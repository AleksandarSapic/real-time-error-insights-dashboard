import {Component, computed, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {MatPaginator, MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatSort, MatSortModule, Sort} from '@angular/material/sort';
import {ErrorEventsService} from '../../services/error-events.service';
import {ErrorEvent} from '../../models/error-event.model';
import {ErrorEventsSearchParams} from '../../models/error-events-search-params.model';
import {ErrorEventsFilter} from '../error-events-filter/error-events-filter';
import {LoadingSpinner} from '../loading-spinner/loading-spinner';

@Component({
  selector: 'app-error-events-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    ErrorEventsFilter,
    LoadingSpinner,
  ],
  templateUrl: './error-events-list.html',
  styleUrl: './error-events-list.css',
})
export class ErrorEventsList implements OnInit {
  private readonly errorEventsService = inject(ErrorEventsService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['timestamp', 'userId', 'browser', 'url', 'errorMessage', 'stackTrace'];
  dataSource = signal<ErrorEvent[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  totalRecords = signal(0);
  pageSize = signal(5);
  pageIndex = signal(0);
  pageSizeOptions = [5, 10, 25, 50];
  sortDirection = signal<'asc' | 'desc'>('desc');
  offset = computed(() => this.pageIndex() * this.pageSize());

  private currentFilters: Omit<ErrorEventsSearchParams, 'offset' | 'limit'> = {};

  ngOnInit(): void {
    this.loadErrorEvents();
  }

  loadErrorEvents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: ErrorEventsSearchParams = {
      offset: this.offset(),
      limit: this.pageSize(),
      sortBy: 'timestamp',
      sortOrder: this.sortDirection(),
      ...this.currentFilters,
    };

    this.errorEventsService
      .getErrorEvents(params)
      .subscribe({
        next: (response) => {
          this.dataSource.set(response.data);
          this.totalRecords.set(response.pagination.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load error events. Please try again.');
          this.isLoading.set(false);
          console.error('Error loading events:', err);
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadErrorEvents();
  }

  onFilterChange(filters: Omit<ErrorEventsSearchParams, 'offset' | 'limit'>): void {
    this.currentFilters = filters;
    this.pageIndex.set(0);
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadErrorEvents();
  }

  onFilterClear(): void {
    this.currentFilters = {};
    this.pageIndex.set(0);
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadErrorEvents();
  }

  onSortChange(sort: Sort): void {
    if (sort.active === 'timestamp' && sort.direction) {
      this.sortDirection.set(sort.direction as 'asc' | 'desc');
      this.pageIndex.set(0);
      if (this.paginator) {
        this.paginator.firstPage();
      }
      this.loadErrorEvents();
    }
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}
