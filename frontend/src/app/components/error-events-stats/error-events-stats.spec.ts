import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorEventsStats } from './error-events-stats';

describe('ErrorEventsStats', () => {
  let component: ErrorEventsStats;
  let fixture: ComponentFixture<ErrorEventsStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorEventsStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorEventsStats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
