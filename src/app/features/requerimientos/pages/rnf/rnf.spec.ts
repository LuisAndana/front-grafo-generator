import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rnf } from './rnf';

describe('Rnf', () => {
  let component: Rnf;
  let fixture: ComponentFixture<Rnf>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rnf]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rnf);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
