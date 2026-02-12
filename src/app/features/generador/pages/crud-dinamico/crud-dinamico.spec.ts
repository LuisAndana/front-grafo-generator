import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrudDinamico } from './crud-dinamico';

describe('CrudDinamico', () => {
  let component: CrudDinamico;
  let fixture: ComponentFixture<CrudDinamico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrudDinamico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrudDinamico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
