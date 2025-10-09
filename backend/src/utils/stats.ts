import {
  StatsAggregationType,
  StatsResponse,
  TimeInterval,
  TimelineBucket,
  TopItem,
} from '../types/search';

export const buildStatsAggregations = (
  bucketSize: number,
  interval: TimeInterval,
  requestedAggs?: StatsAggregationType[]
): Record<string, any> => {
  const allAggregations: Record<string, any> = {
    timeline: {
      date_histogram: {
        field: 'timestamp',
        calendar_interval: interval,
      },
    },
    unique_users: {
      cardinality: {
        field: 'userId',
      },
    },
    top_errors: {
      terms: {
        field: 'errorMessage.keyword',
        size: bucketSize,
      },
    },
    top_users: {
      terms: {
        field: 'userId',
        size: bucketSize,
      },
    },
    top_browsers: {
      terms: {
        field: 'browser',
        size: bucketSize,
      },
    },
    top_urls: {
      terms: {
        field: 'url.keyword',
        size: bucketSize,
      },
    },
  };

  if (!requestedAggs || requestedAggs.length === 0) {
    return allAggregations;
  }

  const aggregationMapping: Record<StatsAggregationType, string> = {
    timeline: 'timeline',
    uniqueUsers: 'unique_users',
    topErrors: 'top_errors',
    topUsers: 'top_users',
    topBrowsers: 'top_browsers',
    topUrls: 'top_urls',
  };

  return requestedAggs.reduce(
    (result, aggType) => {
      const aggKey = aggregationMapping[aggType];
      if (allAggregations[aggKey]) {
        result[aggKey] = allAggregations[aggKey];
      }
      return result;
    },
    {} as Record<string, any>
  );
};

export const formatStatsResponse = (
  totalEvents: number,
  aggregations?: Record<string, any>
): StatsResponse => {
  const timeline: TimelineBucket[] =
    aggregations?.timeline?.buckets?.map((bucket: any) => ({
      timestamp: bucket.key_as_string || bucket.key,
      count: bucket.doc_count,
    })) || [];

  const topErrors: TopItem[] =
    aggregations?.top_errors?.buckets?.map((bucket: any) => ({
      value: bucket.key,
      count: bucket.doc_count,
    })) || [];

  const topUsers: TopItem[] =
    aggregations?.top_users?.buckets?.map((bucket: any) => ({
      value: bucket.key,
      count: bucket.doc_count,
    })) || [];

  const topBrowsers: TopItem[] =
    aggregations?.top_browsers?.buckets?.map((bucket: any) => ({
      value: bucket.key,
      count: bucket.doc_count,
    })) || [];

  const topUrls: TopItem[] =
    aggregations?.top_urls?.buckets?.map((bucket: any) => ({
      value: bucket.key,
      count: bucket.doc_count,
    })) || [];

  return {
    summary: {
      totalEvents,
      uniqueUsers: aggregations?.unique_users?.value || 0,
    },
    timeline,
    topErrors,
    topUsers,
    topBrowsers,
    topUrls,
  };
};
