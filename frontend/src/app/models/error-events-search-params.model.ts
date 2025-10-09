export interface ErrorEventsSearchParams {
  offset?: number;
  limit?: number;
  query?: string;
  dateStart?: string;
  dateEnd?: string;
  userId?: string;
  browser?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
