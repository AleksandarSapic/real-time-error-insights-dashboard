import {Component, OnInit, inject, OnDestroy, AfterViewInit, signal, effect, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {ErrorEventsService} from '../../services/error-events.service';
import {AggregationItem, ErrorEventsStats as StatsModel} from '../../models/error-events-stats.model';
import {Chart, ChartConfiguration, registerables} from 'chart.js';
import {LoadingSpinner} from '../loading-spinner/loading-spinner';

Chart.register(...registerables);

interface AggregationOption {
  value: string;
  label: string;
  chartType: 'bar' | 'doughnut';
}

@Component({
  selector: 'app-error-events-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule, LoadingSpinner],
  templateUrl: './error-events-stats.html',
  styleUrl: './error-events-stats.css'
})
export class ErrorEventsStats implements OnInit, AfterViewInit, OnDestroy {
  private readonly errorEventsService = inject(ErrorEventsService);

  isLoading = signal(false);
  error = signal<string | null>(null);
  stats = signal<StatsModel | null>(null);
  bucketSize = signal(5);
  bucketSizeOptions = [3, 5, 10, 15, 20];

  aggregationOptions: AggregationOption[] = [
    { value: 'topErrors', label: 'Top Errors', chartType: 'bar' },
    { value: 'topBrowsers', label: 'Top Browsers', chartType: 'doughnut' },
    { value: 'topUsers', label: 'Top Users', chartType: 'bar' },
    { value: 'topUrls', label: 'Top URLs', chartType: 'bar' }
  ];

  selectedAggregations = signal<string[]>(['topErrors', 'topBrowsers']);

  visibleCharts = computed(() => {
    const selected = this.selectedAggregations();
    return this.aggregationOptions.filter(opt => selected.includes(opt.value));
  });

  private charts: Map<string, Chart> = new Map();

  constructor() {
    effect(() => {
      const currentStats = this.stats();
      if (currentStats) {
        setTimeout(() => this.createCharts(), 0);
      }
    });
  }

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    if (this.stats()) {
      this.createCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.errorEventsService.getStats(this.bucketSize(), this.selectedAggregations()).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load statistics. Please try again.');
        this.isLoading.set(false);
        console.error('Error loading stats:', err);
      }
    });
  }

  onBucketSizeChange(size: number): void {
    this.bucketSize.set(size);
    this.loadStats();
  }

  toggleAggregation(aggregation: string, checked: boolean): void {
    const current = this.selectedAggregations();
    if (checked) {
      this.selectedAggregations.set([...current, aggregation]);
    } else {
      this.selectedAggregations.set(current.filter(a => a !== aggregation));
    }
    this.loadStats();
  }

  isAggregationSelected(aggregation: string): boolean {
    return this.selectedAggregations().includes(aggregation);
  }

  private createCharts(): void {
    this.destroyCharts();

    const currentStats = this.stats();
    if (!currentStats) return;

    this.visibleCharts().forEach(chartConfig => {
      this.createChart(chartConfig, currentStats);
    });
  }

  private createChart(chartConfig: AggregationOption, stats: StatsModel): void {
    const canvas = document.getElementById(`${chartConfig.value}Chart`) as HTMLCanvasElement;
    if (!canvas) return;

    const data = stats[chartConfig.value as keyof StatsModel] as AggregationItem[] | undefined;
    if (!data || !Array.isArray(data)) return;

    const config: ChartConfiguration = chartConfig.chartType === 'bar'
      ? this.createBarChartConfig(data, chartConfig.label)
      : this.createDoughnutChartConfig(data, chartConfig.label);

    const chart = new Chart(canvas, config);
    this.charts.set(chartConfig.value, chart);
  }

  private createBarChartConfig(data: AggregationItem[], title: string): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: data.map(item => this.truncateLabel(item.value, 30)),
        datasets: [{
          label: 'Count',
          data: data.map(item => item.count),
          backgroundColor: 'rgba(244, 67, 54, 0.7)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: `${title} (${data.length})`,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              title: (context) => {
                const index = context[0].dataIndex;
                return data[index].value;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    };
  }

  private createDoughnutChartConfig(data: AggregationItem[], title: string): ChartConfiguration {
    return {
      type: 'doughnut',
      data: {
        labels: data.map(item => item.value),
        datasets: [{
          label: 'Count',
          data: data.map(item => item.count),
          backgroundColor: [
            'rgba(33, 150, 243, 0.7)',
            'rgba(76, 175, 80, 0.7)',
            'rgba(255, 152, 0, 0.7)',
            'rgba(156, 39, 176, 0.7)',
            'rgba(255, 87, 34, 0.7)'
          ],
          borderColor: [
            'rgba(33, 150, 243, 1)',
            'rgba(76, 175, 80, 1)',
            'rgba(255, 152, 0, 1)',
            'rgba(156, 39, 176, 1)',
            'rgba(255, 87, 34, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: `${title} (${data.length})`,
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    };
  }

  private truncateLabel(label: string, maxLength: number): string {
    return label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
  }

  private destroyCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }
}
