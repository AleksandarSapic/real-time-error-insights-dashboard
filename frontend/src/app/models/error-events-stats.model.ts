export interface ErrorEventsStats {
  summary: {
    totalEvents: number;
    uniqueUsers: number;
  };
  timeline: TimelineBucket[];
  topUsers: AggregationItem[];
  topUrls: AggregationItem[];
  topErrors: AggregationItem[];
  topBrowsers: AggregationItem[];
}

export interface AggregationItem {
  value: string;
  count: number;
}

export interface TimelineBucket {
  timestamp: string;
  count: number;
}
