import { getElasticsearchClient } from '../loaders/elasticsearch';
import { ErrorEvent } from '../models/ErrorEvent';
import config from '../config';
import {
  buildMustClauses,
  getElasticsearchTotal,
} from '../utils/elasticsearch';
import { SearchParams, SearchResult } from '../types/search';

export const fetchSearchResults = async (
  params: SearchParams
): Promise<SearchResult<ErrorEvent & { id: string }>> => {
  const { filters, offset, limit, sortOrder } = params;

  const mustClauses = buildMustClauses(filters);
  const searchQuery =
    mustClauses.length > 0
      ? { bool: { must: mustClauses } }
      : { match_all: {} };

  const searchResult = await getElasticsearchClient().search<ErrorEvent>({
    index: config.elastic.index,
    from: offset,
    size: limit,
    query: searchQuery,
    sort: [{ timestamp: { order: sortOrder } }],
  });

  const total = getElasticsearchTotal(searchResult.hits.total);

  return {
    data: searchResult.hits.hits.map((hit) => ({
      id: hit._id!,
      ...hit._source!,
    })),
    pagination: {
      offset,
      limit,
      total,
      hasMore: offset + limit < total,
      returned: searchResult.hits.hits.length,
    },
    sort: {
      field: 'timestamp',
      order: sortOrder,
    },
  };
};
