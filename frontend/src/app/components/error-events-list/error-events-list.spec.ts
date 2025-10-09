import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ErrorEventsList} from './error-events-list';

describe('ErrorEventsList', () => {
  let component: ErrorEventsList;
  let fixture: ComponentFixture<ErrorEventsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorEventsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorEventsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
