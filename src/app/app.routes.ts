import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { StudentDashboardComponent } from './student-dashboard.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { authGuard } from './auth.guard';
import { TeacherDashboardComponent } from './teacher-dashboard/teacher-dashboard.component';
import { CourseCatalogComponent } from './course-catalog/course-catalog.component';
import { CourseDetailsComponent } from './course-details/course-details.component';
import { CoursePlayerComponent } from './course-player/course-player.component';
import { QuizCreatorComponent } from './quiz-creator/quiz-creator.component';
import { QuizSolverComponent } from './quiz-solver/quiz-solver.component';
import { SettingsComponent } from './settings/settings.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { CourseLandingComponent } from './course-landing/course-landing.component';
import { AssignmentSolverComponent } from './assignment-solver/assignment-solver.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { AdminLoginComponent } from './admin-portal/admin-login.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'home', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin-portal/login', component: AdminLoginComponent },
  { path: 'admin-portal', redirectTo: 'admin-portal/login', pathMatch: 'full' },
  { path: 'dashboard', component: StudentDashboardComponent, canActivate: [authGuard] },
  { path: 'teacher-dashboard', component: TeacherDashboardComponent, canActivate: [authGuard] },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'courses', component: CourseCatalogComponent, canActivate: [authGuard] },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'course/:id', component: CourseDetailsComponent, canActivate: [authGuard] },
  { path: 'learn/:id', component: CoursePlayerComponent, canActivate: [authGuard] },
  { path: 'quiz-creator/:lessonId', component: QuizCreatorComponent },
  { path: 'quiz-solver/:lessonId', component: QuizSolverComponent },
  { path: 'assignment-solver/:id', component: AssignmentSolverComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent },
  { path: 'leaderboard', component: LeaderboardComponent },
  { path: 'course-landing/:id', component: CourseLandingComponent },
  { path: '**', redirectTo: 'login' }
];