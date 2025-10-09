'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const search_1 = require('../src/lib/search');
const elasticsearch_1 = require('../src/utils/elasticsearch');
const elasticsearch_2 = require('../src/loaders/elasticsearch');
const config_1 = __importDefault(require('../src/config'));
jest.mock('../src/loaders/elasticsearch');
describe('Elasticsearch Query Handling', () => {
  describe('buildMustClauses', () => {
    it('should return empty array when no filters provided', () => {
      const filters = {};
      const result = (0, elasticsearch_1.buildMustClauses)(filters);
      expect(result).toEqual([]);
    });
    it('should build userId filter', () => {
      const filters = { userId: 'user123' };
      const result = (0, elasticsearch_1.buildMustClauses)(filters);
      expect(result).toEqual([{ match: { userId: 'user123' } }]);
    });
    it('should build browser filter', () => {
      const filters = { browser: 'Chrome' };
      const result = (0, elasticsearch_1.buildMustClauses)(filters);
      expect(result).toEqual([{ match: { browser: 'Chrome' } }]);
    });
    it('should build url filter', () => {
      const filters = { url: 'https://example.com' };
      const result = (0, elasticsearch_1.buildMustClauses)(filters);
      expect(result).toEqual([{ match: { url: 'https://example.com' } }]);
    });
    it('should build text query with multi_match', () => {
      const filters = { query: 'error occurred' };
      const result = (0, elasticsearch_1.buildMustClauses)(filters);
      expect(result).toEqual([
        {
          multi_match: {
            query: 'error occurred',
            fields: ['errorMessage', 'stackTrace', 'url'],
          },
        },
      ]);
    });
    it('should build date range filter with start date only', () => {
      const filters = { dateStart: '2024-01-01' };
      const result = (0, elasticsearch_1.buildMustClauses)(filters);
      expect(result).toEqual([
        {
          range: {
            timestamp: {
              gte: '2024-01-01',
            },
          },
        },
      ]);
    });
    it('should build date range filter with end date only', () => {
      const filters = { dateEnd: '2024-12-31' };
      const result = (0, elasticsearch_1.buildMustClauses)(filters);
      expect(result).toEqual([
        {
          range: {
            timestamp: {
              lte: '2024-12-31',
            },
          },
        },
      ]);
    });
    it('should build date range filter with both start and end dates', () => {
      const filters = {
        dateStart: '2024-01-01',
        dateEnd: '2024-12-31',
      };
      const result = (0, elasticsearch_1.buildMustClauses)(filters);
      expect(result).toEqual([
        {
          range: {
            timestamp: {
              gte: '2024-01-01',
              lte: '2024-12-31',
            },
          },
        },
      ]);
    });
    it('should build multiple filters combined', () => {
      const filters = {
        userId: 'user123',
        browser: 'Chrome',
        query: 'error',
        dateStart: '2024-01-01',
      };
      const result = (0, elasticsearch_1.buildMustClauses)(filters);
      expect(result).toHaveLength(4);
      expect(result).toContainEqual({ match: { userId: 'user123' } });
      expect(result).toContainEqual({ match: { browser: 'Chrome' } });
      expect(result).toContainEqual({
        multi_match: {
          query: 'error',
          fields: ['errorMessage', 'stackTrace', 'url'],
        },
      });
      expect(result).toContainEqual({
        range: {
          timestamp: {
            gte: '2024-01-01',
          },
        },
      });
    });
    it('should ignore null filter values', () => {
      const filters = {
        userId: null,
        browser: null,
        query: null,
      };
      const result = (0, elasticsearch_1.buildMustClauses)(filters);
      expect(result).toEqual([]);
    });
  });
  describe('getElasticsearchTotal', () => {
    it('should return number when total is a number', () => {
      const result = (0, elasticsearch_1.getElasticsearchTotal)(100);
      expect(result).toBe(100);
    });
    it('should extract value from object', () => {
      const total = { value: 250, relation: 'eq' };
      const result = (0, elasticsearch_1.getElasticsearchTotal)(total);
      expect(result).toBe(250);
    });
    it('should return 0 when total is undefined', () => {
      const result = (0, elasticsearch_1.getElasticsearchTotal)(undefined);
      expect(result).toBe(0);
    });
    it('should return 0 when total is invalid object', () => {
      const result = (0, elasticsearch_1.getElasticsearchTotal)({});
      expect(result).toBe(0);
    });
  });
  describe('fetchSearchResults', () => {
    let mockClient;
    beforeEach(() => {
      mockClient = {
        search: jest.fn(),
      };
      elasticsearch_2.getElasticsearchClient.mockReturnValue(mockClient);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should fetch search results with no filters', async () => {
      const mockSearchResponse = {
        hits: {
          total: 10,
          hits: [
            {
              _id: '1',
              _source: {
                timestamp: '2024-01-01',
                userId: 'user1',
                browser: 'Chrome',
                url: 'https://example.com',
                errorMessage: 'Error occurred',
                stackTrace: 'Stack trace',
              },
            },
          ],
        },
      };
      mockClient.search.mockResolvedValue(mockSearchResponse);
      const params = {
        filters: {},
        offset: 0,
        limit: 10,
      };
      const result = await (0, search_1.fetchSearchResults)(params);
      expect(mockClient.search).toHaveBeenCalledWith({
        index: config_1.default.elastic.index,
        from: 0,
        size: 10,
        query: { match_all: {} },
        sort: [{ timestamp: { order: 'desc' } }],
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
      expect(result.pagination).toEqual({
        offset: 0,
        limit: 10,
        total: 10,
        hasMore: false,
        returned: 1,
      });
    });
    it('should fetch search results with filters', async () => {
      const mockSearchResponse = {
        hits: {
          total: { value: 50, relation: 'eq' },
          hits: [],
        },
      };
      mockClient.search.mockResolvedValue(mockSearchResponse);
      const params = {
        filters: {
          userId: 'user123',
          browser: 'Chrome',
        },
        offset: 10,
        limit: 20,
      };
      const result = await (0, search_1.fetchSearchResults)(params);
      expect(mockClient.search).toHaveBeenCalledWith({
        index: config_1.default.elastic.index,
        from: 10,
        size: 20,
        query: {
          bool: {
            must: [
              { match: { userId: 'user123' } },
              { match: { browser: 'Chrome' } },
            ],
          },
        },
        sort: [{ timestamp: { order: 'desc' } }],
      });
      expect(result.pagination).toEqual({
        offset: 10,
        limit: 20,
        total: 50,
        hasMore: true,
        returned: 0,
      });
    });
    it('should handle pagination correctly', async () => {
      const mockSearchResponse = {
        hits: {
          total: 100,
          hits: Array(20).fill({
            _id: '1',
            _source: { timestamp: '2024-01-01' },
          }),
        },
      };
      mockClient.search.mockResolvedValue(mockSearchResponse);
      const params = {
        filters: {},
        offset: 80,
        limit: 20,
      };
      const result = await (0, search_1.fetchSearchResults)(params);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.offset).toBe(80);
      expect(result.pagination.returned).toBe(20);
    });
    it('should throw error when search fails', async () => {
      const error = new Error('Search failed');
      mockClient.search.mockRejectedValue(error);
      const params = {
        filters: {},
        offset: 0,
        limit: 10,
      };
      await expect((0, search_1.fetchSearchResults)(params)).rejects.toThrow(
        'Search failed'
      );
    });
  });
});
//# sourceMappingURL=search.test.js.map
