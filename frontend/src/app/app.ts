import {Component, signal} from '@angular/core';
import {ErrorEventsList} from './components/error-events-list/error-events-list';
import {ErrorEventsStats} from './components/error-events-stats/error-events-stats';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ErrorEventsList, ErrorEventsStats],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Real-Time Error Insights Dashboard');
}
