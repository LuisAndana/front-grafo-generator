import { TestBed } from '@angular/core/testing';

import { CrudGenerator } from './crud-generator';

describe('CrudGenerator', () => {
  let service: CrudGenerator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrudGenerator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
