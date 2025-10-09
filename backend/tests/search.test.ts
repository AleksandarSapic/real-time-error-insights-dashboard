import { fetchSearchResults } from '../src/lib/search';
import {
  buildMustClauses,
  getElasticsearchTotal,
} from '../src/utils/elasticsearch';
import { getElasticsearchClient } from '../src/loaders/elasticsearch';
import { SearchFilters, SearchParams } from '../src/types/search';
import config from '../src/config';

jest.mock('../src/loaders/elasticsearch');

describe('Elasticsearch Query Handling', () => {
  describe('buildMustClauses', () => {
    it('should return empty array when no filters provided', () => {
      const filters: SearchFilters = {};
      const result = buildMustClauses(filters);
      expect(result).toEqual([]);
    });

    it('should build userId filter', () => {
      const filters: SearchFilters = { userId: 'user-123' };
      const result = buildMustClauses(filters);
      expect(result).toEqual([{ match: { userId: 'user-123' } }]);
    });

    it('should build browser filter', () => {
      const filters: SearchFilters = { browser: 'Chrome' };
      const result = buildMustClauses(filters);
      expect(result).toEqual([{ match: { browser: 'Chrome' } }]);
    });

    it('should build url filter', () => {
      const filters: SearchFilters = { url: '/dashboard' };
      const result = buildMustClauses(filters);
      expect(result).toEqual([{ match: { url: '/dashboard' } }]);
    });

    it('should build text query with multi_match', () => {
      const filters: SearchFilters = { query: 'error occurred' };
      const result = buildMustClauses(filters);
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
      const filters: SearchFilters = { dateStart: '2025-07-15T10:10:00Z' };
      const result = buildMustClauses(filters);
      expect(result).toEqual([
        {
          range: {
            timestamp: {
              gte: '2025-07-15T10:10:00Z',
            },
          },
        },
      ]);
    });

    it('should build date range filter with end date only', () => {
      const filters: SearchFilters = { dateEnd: '2025-07-15T10:10:00Z' };
      const result = buildMustClauses(filters);
      expect(result).toEqual([
        {
          range: {
            timestamp: {
              lte: '2025-07-15T10:10:00Z',
            },
          },
        },
      ]);
    });

    it('should build date range filter with both start and end dates', () => {
      const filters: SearchFilters = {
        dateStart: '2025-07-15T10:10:00Z',
        dateEnd: '2025-07-18T10:10:00Z',
      };
      const result = buildMustClauses(filters);
      expect(result).toEqual([
        {
          range: {
            timestamp: {
              gte: '2025-07-15T10:10:00Z',
              lte: '2025-07-18T10:10:00Z',
            },
          },
        },
      ]);
    });

    it('should build multiple filters combined', () => {
      const filters: SearchFilters = {
        userId: 'user-123',
        browser: 'Chrome',
        query: 'error',
        dateStart: '2025-07-15T10:10:00Z',
      };
      const result = buildMustClauses(filters);
      expect(result).toHaveLength(4);
      expect(result).toContainEqual({ match: { userId: 'user-123' } });
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
            gte: '2025-07-15T10:10:00Z',
          },
        },
      });
    });

    it('should ignore null filter values', () => {
      const filters: SearchFilters = {
        userId: null,
        browser: null,
        query: null,
      };
      const result = buildMustClauses(filters);
      expect(result).toEqual([]);
    });
  });

  describe('getElasticsearchTotal', () => {
    it('should return number when total is a number', () => {
      const result = getElasticsearchTotal(100);
      expect(result).toBe(100);
    });

    it('should extract value from object', () => {
      const total = { value: 250, relation: 'eq' };
      const result = getElasticsearchTotal(total);
      expect(result).toBe(250);
    });

    it('should return 0 when total is undefined', () => {
      const result = getElasticsearchTotal(undefined);
      expect(result).toBe(0);
    });

    it('should return 0 when total is invalid object', () => {
      const result = getElasticsearchTotal({} as any);
      expect(result).toBe(0);
    });
  });

  describe('fetchSearchResults', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        search: jest.fn(),
      };
      (getElasticsearchClient as jest.Mock).mockReturnValue(mockClient);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch search results with no filters', async () => {
      const mockSearchResponse = {
        hits: {
          total: 1,
          hits: [
            {
              _id: '1',
              _source: {
                timestamp: '2025-07-15T10:10:00Z',
                userId: 'user-123',
                browser: 'Chrome',
                url: '/dashboard',
                errorMessage: 'Error occurred',
                stackTrace: 'Stack trace',
              },
            },
          ],
        },
      };
      mockClient.search.mockResolvedValue(mockSearchResponse);

      const params: SearchParams = {
        filters: {},
        offset: 0,
        limit: 10,
        sortOrder: 'desc',
      };

      const result = await fetchSearchResults(params);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: config.elastic.index,
        from: 0,
        size: 10,
        query: { match_all: {} },
        sort: [{ timestamp: { order: 'desc' } }],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.id).toBe('1');
      expect(result.pagination).toEqual({
        offset: 0,
        limit: 10,
        total: 1,
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

      const params: SearchParams = {
        filters: {
          userId: 'user-123',
          browser: 'Chrome',
        },
        offset: 10,
        limit: 20,
        sortOrder: 'desc',
      };

      const result = await fetchSearchResults(params);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: config.elastic.index,
        from: 10,
        size: 20,
        query: {
          bool: {
            must: [
              { match: { userId: 'user-123' } },
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

      const params: SearchParams = {
        filters: {},
        offset: 80,
        limit: 20,
        sortOrder: 'desc',
      };

      const result = await fetchSearchResults(params);

      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.offset).toBe(80);
      expect(result.pagination.returned).toBe(20);
    });

    it('should throw error when search fails', async () => {
      const error = new Error('Search failed');
      mockClient.search.mockRejectedValue(error);

      const params: SearchParams = {
        filters: {},
        offset: 0,
        limit: 10,
        sortOrder: 'desc',
      };

      await expect(fetchSearchResults(params)).rejects.toThrow('Search failed');
    });
  });
});
