import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SrsGeneratorComponent } from './srs-generator';

describe('SrsGenerator', () => {
  let component: SrsGeneratorComponent;
  let fixture: ComponentFixture<SrsGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SrsGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SrsGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
