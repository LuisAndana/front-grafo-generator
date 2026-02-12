import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rf } from './rf';

describe('Rf', () => {
  let component: Rf;
  let fixture: ComponentFixture<Rf>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rf]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rf);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
