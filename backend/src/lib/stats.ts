import { getElasticsearchClient } from '../loaders/elasticsearch';
import { ErrorEvent } from '../models/ErrorEvent';
import config from '../config';
import {
  buildMustClauses,
  getElasticsearchTotal,
} from '../utils/elasticsearch';
import { buildStatsAggregations, formatStatsResponse } from '../utils/stats';
import { StatsParams, StatsResponse } from '../types/search';

export async function fetchEventStats(
  params: StatsParams
): Promise<StatsResponse> {
  const { filters, bucketSize, interval, aggregations } = params;

  const mustClauses = buildMustClauses(filters);
  const query =
    mustClauses.length > 0
      ? { bool: { must: mustClauses } }
      : { match_all: {} };

  console.log('Fetching event statistics..', { filters, aggregations });

  const searchResult = await getElasticsearchClient().search<ErrorEvent>({
    index: config.elastic.index,
    size: 0,
    query,
    aggs: buildStatsAggregations(bucketSize, interval, aggregations),
  });

  return formatStatsResponse(
    getElasticsearchTotal(searchResult.hits.total),
    searchResult.aggregations
  );
}
