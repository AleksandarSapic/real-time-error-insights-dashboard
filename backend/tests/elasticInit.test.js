'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const elasticInit_1 = require('../src/utils/elasticInit');
const elasticsearch_1 = require('../src/loaders/elasticsearch');
const config_1 = __importDefault(require('../src/config'));
jest.mock('../src/loaders/elasticsearch');
describe('Elasticsearch Index Initialization', () => {
  let mockClient;
  beforeEach(() => {
    mockClient = {
      indices: {
        exists: jest.fn(),
        create: jest.fn(),
      },
    };
    elasticsearch_1.getElasticsearchClient.mockReturnValue(mockClient);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('initializeElasticsearchIndex', () => {
    it('should create index when it does not exist', async () => {
      mockClient.indices.exists.mockResolvedValue(false);
      mockClient.indices.create.mockResolvedValue({ acknowledged: true });
      await (0, elasticInit_1.initializeElasticsearchIndex)();
      expect(mockClient.indices.exists).toHaveBeenCalledWith({
        index: config_1.default.elastic.index,
      });
      expect(mockClient.indices.create).toHaveBeenCalledWith({
        index: config_1.default.elastic.index,
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
        },
        mappings: {
          properties: {
            timestamp: { type: 'date' },
            userId: { type: 'keyword' },
            browser: { type: 'keyword' },
            url: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
            errorMessage: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
            stackTrace: { type: 'text' },
          },
        },
      });
    });
    it('should not create index when it already exists', async () => {
      mockClient.indices.exists.mockResolvedValue(true);
      await (0, elasticInit_1.initializeElasticsearchIndex)();
      expect(mockClient.indices.exists).toHaveBeenCalledWith({
        index: config_1.default.elastic.index,
      });
      expect(mockClient.indices.create).not.toHaveBeenCalled();
    });
    it('should throw error when index creation fails', async () => {
      const error = new Error('Index creation failed');
      mockClient.indices.exists.mockResolvedValue(false);
      mockClient.indices.create.mockRejectedValue(error);
      await expect(
        (0, elasticInit_1.initializeElasticsearchIndex)()
      ).rejects.toThrow('Index creation failed');
    });
    it('should throw error when checking index existence fails', async () => {
      const error = new Error('Connection failed');
      mockClient.indices.exists.mockRejectedValue(error);
      await expect(
        (0, elasticInit_1.initializeElasticsearchIndex)()
      ).rejects.toThrow('Connection failed');
    });
  });
});
//# sourceMappingURL=elasticInit.test.js.map
