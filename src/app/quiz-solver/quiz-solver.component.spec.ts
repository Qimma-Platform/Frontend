import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizSolverComponent } from './quiz-solver.component';

describe('QuizSolverComponent', () => {
  let component: QuizSolverComponent;
  let fixture: ComponentFixture<QuizSolverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizSolverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizSolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
