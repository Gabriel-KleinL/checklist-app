import { TestBed } from '@angular/core/testing';

import { ChecklistData } from './checklist-data';

describe('ChecklistData', () => {
  let service: ChecklistData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChecklistData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
