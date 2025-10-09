export interface SearchFilters {
  userId?: string | null;
  url?: string | null;
  browser?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  query?: string | null;
}

export interface SearchParams {
  filters: SearchFilters;
  offset: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
}

export interface SearchResult<T> {
  data: T[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
    returned: number;
  };
  sort: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export enum TimeInterval {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

export enum StatsAggregationType {
  Timeline = 'timeline',
  UniqueUsers = 'uniqueUsers',
  TopErrors = 'topErrors',
  TopUsers = 'topUsers',
  TopBrowsers = 'topBrowsers',
  TopUrls = 'topUrls',
}

export interface StatsParams {
  filters: SearchFilters;
  bucketSize: number;
  interval: TimeInterval;
  aggregations: StatsAggregationType[] | undefined;
}

export interface TimelineBucket {
  timestamp: string;
  count: number;
}

export interface TopItem {
  value: string;
  count: number;
}

export interface StatsResponse {
  summary: {
    totalEvents: number;
    uniqueUsers: number;
  };
  timeline: TimelineBucket[];
  topErrors: TopItem[];
  topUsers: TopItem[];
  topBrowsers: TopItem[];
  topUrls: TopItem[];
}
