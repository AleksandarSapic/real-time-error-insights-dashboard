import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ErrorEventsFilter} from './error-events-filter';

describe('ErrorEventsFilter', () => {
  let component: ErrorEventsFilter;
  let fixture: ComponentFixture<ErrorEventsFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorEventsFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorEventsFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
