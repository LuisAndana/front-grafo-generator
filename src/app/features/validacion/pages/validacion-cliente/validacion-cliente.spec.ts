import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidacionCliente } from './validacion-cliente';

describe('ValidacionCliente', () => {
  let component: ValidacionCliente;
  let fixture: ComponentFixture<ValidacionCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidacionCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidacionCliente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
