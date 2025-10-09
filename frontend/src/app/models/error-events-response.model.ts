import {ErrorEvent} from './error-event.model';
import {Pagination} from './pagination.model';

export interface ErrorEventsResponse {
  data: ErrorEvent[];
  pagination: Pagination;
}
