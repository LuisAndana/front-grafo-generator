import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StakeholderForm } from './stakeholder-form';

describe('StakeholderForm', () => {
  let component: StakeholderForm;
  let fixture: ComponentFixture<StakeholderForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StakeholderForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StakeholderForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
