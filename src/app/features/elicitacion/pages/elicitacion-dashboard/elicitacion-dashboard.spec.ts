import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElicitacionDashboard } from './elicitacion-dashboard';

describe('ElicitacionDashboard', () => {
  let component: ElicitacionDashboard;
  let fixture: ComponentFixture<ElicitacionDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElicitacionDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElicitacionDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
