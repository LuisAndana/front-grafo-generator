import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Priorizacion } from './priorizacion';

describe('Priorizacion', () => {
  let component: Priorizacion;
  let fixture: ComponentFixture<Priorizacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Priorizacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Priorizacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
