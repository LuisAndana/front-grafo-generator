import { TestBed } from '@angular/core/testing';

import { GraphEngine } from './graph-engine';

describe('GraphEngine', () => {
  let service: GraphEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphEngine);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
