import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ErrorEventsResponse} from '../models/error-events-response.model';
import {ErrorEventsSearchParams} from '../models/error-events-search-params.model';
import {ErrorEventsStats} from '../models/error-events-stats.model';
import {environment} from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class ErrorEventsService {
  private readonly http = inject(HttpClient);

  private readonly SEARCH_API = `${environment.baseUrl}/api/v1/events/search`;
  private readonly STATS_API = `${environment.baseUrl}/api/v1/events/stats`;

  getErrorEvents(params?: ErrorEventsSearchParams): Observable<ErrorEventsResponse> {
    const cleanParams: Record<string, string | number> = {};

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = String(value);
        }
      });
    }

    return this.http.get<ErrorEventsResponse>(this.SEARCH_API, { params: cleanParams });
  }

  getStats(bucketSize: number = 5, aggregations: string[] = []): Observable<ErrorEventsStats> {
    const params: Record<string, string> = {
      bucketSize: bucketSize.toString()
    };

    if (aggregations.length > 0) {
      params['aggregations'] = aggregations.join(',');
    }

    return this.http.get<ErrorEventsStats>(this.STATS_API, { params });
  }
}
