import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SrsGenerator } from './srs-generator';

describe('SrsGenerator', () => {
  let component: SrsGenerator;
  let fixture: ComponentFixture<SrsGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SrsGenerator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SrsGenerator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
