import {Component, inject, OnInit, output, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {ErrorEventsSearchParams} from '../../models/error-events-search-params.model';
import {debounceTime} from 'rxjs';

@Component({
  selector: 'app-error-events-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './error-events-filter.html',
  styleUrl: './error-events-filter.css',
})
export class ErrorEventsFilter implements OnInit {
  private readonly fb = inject(FormBuilder);

  filterChange = output<Omit<ErrorEventsSearchParams, 'offset' | 'limit'>>();
  filterClear = output<void>();

  filterForm: FormGroup;
  hasFilters = signal(false);

  constructor() {
    this.filterForm = this.fb.group({
      query: [''],
      dateRange: this.fb.group({
        start: [null],
        end: [null],
      }),
      userId: [''],
      browser: [''],
    });
  }

  ngOnInit(): void {
    this.filterForm.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.updateHasFilters();
      this.onApplyFilter();
    });
  }

  updateHasFilters(): void {
    const values = this.filterForm.value;
    this.hasFilters.set(!!(
      values.query ||
      values.dateRange?.start ||
      values.dateRange?.end ||
      values.userId ||
      values.browser
    ));
  }

  onApplyFilter(): void {
    const filters = this.filterForm.value;
    const dateRange = filters.dateRange;
    const params: Omit<ErrorEventsSearchParams, 'offset' | 'limit'> = {
      ...(filters.query && { query: filters.query }),
      ...(dateRange?.start && dateRange?.end && {
        dateStart: this.formatDateForApi(dateRange.start),
        dateEnd: this.formatDateForApi(dateRange.end)
      }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.browser && { browser: filters.browser.charAt(0).toUpperCase() + filters.browser.slice(1).toLowerCase() }),
    };

    this.filterChange.emit(params);
  }

  onClearFilters(): void {
    this.filterForm.reset();
    this.hasFilters.set(false);
    this.filterClear.emit();
  }

  private formatDateForApi(date: Date): string {
    return date.toISOString();
  }
}
