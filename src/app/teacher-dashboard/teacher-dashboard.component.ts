import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { LanguageService } from '../services/language.service';
import { SignalrService } from '../services/signalr.service';
import { AssignmentService } from '../services/assignment.service';
import { ThemeService } from '../services/theme.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, FormsModule],
  template: `
    <div class="bg-[#F8FAFC] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex w-full h-screen overflow-hidden" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      
      <div *ngIf="message" [ngClass]="{'bg-emerald-600 shadow-emerald-500/30': messageType === 'success', 'bg-rose-600 shadow-rose-500/30': messageType === 'error'}" class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl text-white font-bold transition-all duration-300 flex items-center gap-3 animate-fade-in pointer-events-auto border border-white/20">
        <span *ngIf="messageType === 'success'" class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
        <span *ngIf="messageType === 'error'" class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">⚠️</span>
        <span class="text-sm font-bold tracking-wide">{{ message }}</span>
      </div>

      <!-- Settings & Other Modals -->
      <div *ngIf="showCropModal" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-6">
            {{ cropType === 'avatar' ? (lang === 'ar' ? 'تعديل الصورة الشخصية' : 'Crop Profile Picture') :
               (cropType === 'cover' ? (lang === 'ar' ? 'تعديل صورة الغلاف' : 'Crop Cover Image') :
               (lang === 'ar' ? 'تعديل غلاف الكورس' : 'Crop Course Cover')) }}
          </h3>
          <div class="relative overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-move touch-none border-2 border-slate-200 dark:border-slate-700 max-w-full select-none"
               [style.width.px]="cropContainerWidth"
               [style.height.px]="cropContainerHeight"
               (mousedown)="startDrag($event)" (mousemove)="onDrag($event)"
               (touchstart)="startDrag($event)" (touchmove)="onDrag($event)"
               (wheel)="onWheelZoom($event)">
             <img [src]="cropImageSrc" class="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
                  [style.transform]="'translate(calc(-50% + ' + panX + 'px), calc(-50% + ' + panY + 'px)) scale(' + zoom + ')'"
                  [style.width.px]="baseImageW" [style.height.px]="baseImageH">
          </div>
          <div class="w-full mt-6 px-4">
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">{{ lang === 'ar' ? 'تكبير / تصغير' : 'Zoom In / Out' }}</label>
              <div class="flex items-center gap-1.5">
                <button type="button" (click)="zoomOut()" class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold flex items-center justify-center text-sm transition" [title]="lang === 'ar' ? 'تصغير' : 'Zoom Out'">－</button>
                <button type="button" (click)="resetZoom()" class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 transition" [title]="lang === 'ar' ? 'إعادة ضبط' : 'Reset Zoom'">{{ (zoom * 100) | number:'1.0-0' }}%</button>
                <button type="button" (click)="zoomIn()" class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold flex items-center justify-center text-sm transition" [title]="lang === 'ar' ? 'تكبير' : 'Zoom In'">＋</button>
              </div>
            </div>
            <input type="range" min="0.1" max="5" step="0.02" [(ngModel)]="zoom" class="w-full accent-indigo-600 cursor-pointer">
            <div class="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
              <span>{{ lang === 'ar' ? 'تصغير (10%)' : 'Zoom Out (10%)' }}</span>
              <span>100%</span>
              <span>{{ lang === 'ar' ? 'تكبير (500%)' : 'Zoom In (500%)' }}</span>
            </div>
          </div>
          <div class="flex gap-3 mt-8 w-full">
            <button (click)="showCropModal = false; isUploadingImage = false" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition">{{ t[lang].cancel }}</button>
            <button (click)="applyCrop()" [disabled]="isUploadingImage" class="flex-1 py-3 bg-[#130E35] dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50">
              {{ isUploadingImage ? t[lang].saving : (lang === 'ar' ? 'تطبيق' : 'Apply') }}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="showDeleteModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in">
        <div class="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">{{ t[lang].deleteConfirmTitle }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">{{ t[lang].deleteConfirmDesc }}</p>
          <div class="flex gap-3">
            <button (click)="closeDeleteModal()" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition">{{ t[lang].cancel }}</button>
            <button (click)="confirmDelete()" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md">{{ t[lang].confirmDeleteBtn }}</button>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: ENROLL STUDENT INTO COURSE (Teacher) -->
      <!-- ======================================================== -->
      <div *ngIf="showEnrollModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900 dark:text-white">{{ t[lang].enrollStudentModalTitle }}</h3>
              <p class="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{{ getSelectedCourseTitle() }}</p>
            </div>
            <button (click)="showEnrollModal = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold transition">✕</button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].selectStudentToEnroll }}</label>
              <div *ngIf="isLoadingAvailableStudents" class="p-3 text-center text-xs text-slate-400">
                <span class="inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin align-middle mr-1.5"></span>
                {{ lang === 'ar' ? 'جاري تحميل قائمة الطلاب...' : 'Loading students...' }}
              </div>
              <select *ngIf="!isLoadingAvailableStudents" [(ngModel)]="studentIdToEnroll" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
                <option [ngValue]="null" disabled>{{ t[lang].selectStudentPlaceholder }}</option>
                <option *ngFor="let s of availablePlatformStudents" [ngValue]="s.id">{{ s.username || s.name }} ({{ s.email }})</option>
              </select>
            </div>

            <div class="flex gap-3 pt-4">
              <button (click)="showEnrollModal = false" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition text-sm">{{ t[lang].cancel }}</button>
              <button (click)="submitEnrollStudent()" [disabled]="!studentIdToEnroll || isSubmittingEnroll" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 text-sm">
                {{ isSubmittingEnroll ? t[lang].saving : t[lang].enrollBtn }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: UNENROLL STUDENT CONFIRMATION (Teacher) -->
      <!-- ======================================================== -->
      <div *ngIf="showUnenrollModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in text-center">
          <div class="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">{{ lang === 'ar' ? 'إلغاء اشتراك الطالب' : 'Remove Student' }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
            {{ lang === 'ar' ? ('هل أنت متأكد من رغبتك في إزالة الطالب "' + (enrolleeToUnenroll?.studentName || '') + '" من هذا الكورس؟') : ('Are you sure you want to remove student "' + (enrolleeToUnenroll?.studentName || '') + '" from this course?') }}
          </p>
          <div class="flex gap-3">
            <button (click)="showUnenrollModal = false" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition">{{ t[lang].cancel }}</button>
            <button (click)="confirmUnenrollStudent()" [disabled]="isSubmittingEnroll" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50">
              {{ isSubmittingEnroll ? t[lang].saving : (lang === 'ar' ? 'نعم، إزالة' : 'Yes, Remove') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: COMPREHENSIVE COURSE QUIZ (New / Edit) -->
      <!-- ======================================================== -->
      <div *ngIf="showComprehensiveQuizModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                📝
              </div>
              <div>
                <h3 class="font-extrabold text-xl text-slate-900 dark:text-white">
                  {{ isComprehensiveQuizEditMode ? (lang === 'ar' ? 'تعديل الاختبار الشامل للكورس' : 'Edit Comprehensive Course Quiz') : (lang === 'ar' ? 'إنشاء اختبار شامل للكورس' : 'Create Comprehensive Course Quiz') }}
                </h3>
                <p class="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  {{ lang === 'ar' ? 'اختبار شامل للكورس بالكامل، يظهر للطالب عند فتح الكورس وفي لوحة الطالب.' : 'Course-level exam visible to students on the course page and dashboard.' }}
                </p>
              </div>
            </div>
            <button (click)="closeComprehensiveQuizModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold transition">✕</button>
          </div>

          <!-- Alert for Error -->
          <div *ngIf="comprehensiveQuizError" class="mb-4 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-2">
            <span>⚠️ {{ comprehensiveQuizError }}</span>
          </div>

          <div class="space-y-5">
            <!-- Select Course -->
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'الكورس المستهدف' : 'Target Course' }}</label>
              <select [(ngModel)]="comprehensiveQuizCourseId" (change)="onComprehensiveQuizCourseChange()" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium outline-none">
                <option [ngValue]="null" disabled>{{ lang === 'ar' ? 'اختر الكورس...' : 'Select a course...' }}</option>
                <option *ngFor="let c of courses" [ngValue]="c.id">{{ c.title }}</option>
              </select>
            </div>

            <div *ngIf="isComprehensiveQuizLoading" class="py-12 text-center text-slate-400 animate-pulse text-sm">
              {{ lang === 'ar' ? 'جاري تحميل بيانات الاختبار الشامل...' : 'Loading comprehensive exam data...' }}
            </div>

            <!-- Questions Form -->
            <div *ngIf="!isComprehensiveQuizLoading && comprehensiveQuizCourseId" class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{{ lang === 'ar' ? 'أسئلة الاختبار الشامل' : 'Exam Questions' }}</span>
                  <span class="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold">{{ comprehensiveQuizQuestions.length }}</span>
                </h4>
                <button type="button" (click)="addComprehensiveQuizQuestion()" class="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1">
                  <span>+</span> {{ lang === 'ar' ? 'إضافة سؤال' : 'Add Question' }}
                </button>
              </div>

              <div *ngFor="let q of comprehensiveQuizQuestions; let qIdx = index; trackBy: trackByIndex" class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300"># {{ qIdx + 1 }} - {{ lang === 'ar' ? 'السؤال' : 'Question' }}</span>
                  <button *ngIf="comprehensiveQuizQuestions.length > 1" type="button" (click)="removeComprehensiveQuizQuestion(qIdx)" class="text-xs text-rose-500 hover:text-rose-700 font-bold">
                    {{ lang === 'ar' ? 'حذف السؤال' : 'Remove' }}
                  </button>
                </div>

                <div>
                  <input type="text" [(ngModel)]="q.text" placeholder="{{ lang === 'ar' ? 'اكتب نص السؤال هنا...' : 'Enter question text...' }}" class="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500">
                </div>

                <!-- Options -->
                <div class="space-y-2 pt-1">
                  <label class="block text-[11px] font-bold text-slate-500 dark:text-slate-400">{{ lang === 'ar' ? 'الخيارات (اختر الإجابة الصحيحة بالضغط على الدائرة):' : 'Options (Select the correct option with the radio button):' }}</label>
                  <div *ngFor="let opt of q.options; let oIdx = index; trackBy: trackByIndex" class="flex items-center gap-2">
                    <input type="radio" [name]="'quiz_opt_' + qIdx" [checked]="q.correctIndex === oIdx" (change)="q.correctIndex = oIdx" class="w-4 h-4 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer" title="{{ lang === 'ar' ? 'تحديد كإجابة صحيحة' : 'Set as correct' }}">
                    <input type="text" [(ngModel)]="q.options[oIdx]" placeholder="{{ lang === 'ar' ? ('الخيار ' + (oIdx + 1)) : ('Option ' + (oIdx + 1)) }}" class="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500">
                    <button *ngIf="q.options.length > 2" type="button" (click)="removeComprehensiveQuizOption(q, oIdx)" class="text-slate-400 hover:text-rose-500 px-1 text-sm font-bold">✕</button>
                  </div>
                  <div *ngIf="q.options.length < 6" class="pt-1">
                    <button type="button" (click)="addComprehensiveQuizOption(q)" class="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold">+ {{ lang === 'ar' ? 'إضافة خيار آخر' : 'Add another option' }}</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button *ngIf="isComprehensiveQuizEditMode" type="button" (click)="deleteComprehensiveQuiz()" [disabled]="isComprehensiveQuizSaving" class="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 font-bold rounded-xl text-xs transition">
                {{ lang === 'ar' ? 'حذف الاختبار الشامل' : 'Delete Exam' }}
              </button>
              <div class="flex items-center gap-3 ms-auto">
                <button type="button" (click)="closeComprehensiveQuizModal()" class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition">
                  {{ t[lang].cancel }}
                </button>
                <button type="button" (click)="saveComprehensiveQuiz()" [disabled]="!comprehensiveQuizCourseId || isComprehensiveQuizSaving" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50">
                  {{ isComprehensiveQuizSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ الاختبار الشامل' : 'Save Exam') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: COMPREHENSIVE COURSE ASSIGNMENT (New / Edit) -->
      <!-- ======================================================== -->
      <div *ngIf="showComprehensiveAssignmentModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
                📚
              </div>
              <div>
                <h3 class="font-extrabold text-xl text-slate-900 dark:text-white">
                  {{ isComprehensiveAssignmentEditMode ? (lang === 'ar' ? 'تعديل الواجب الشامل للكورس' : 'Edit Comprehensive Assignment') : (lang === 'ar' ? 'إنشاء واجب شامل للكورس' : 'Create Comprehensive Assignment') }}
                </h3>
                <p class="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  {{ lang === 'ar' ? 'واجب شامل للكورس بالكامل يظهر للطلاب لحله ومراجعته وتصحيحه.' : 'Course-level assignment for students to submit and receive grades.' }}
                </p>
              </div>
            </div>
            <button (click)="closeComprehensiveAssignmentModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold transition">✕</button>
          </div>

          <!-- Alert for Error -->
          <div *ngIf="comprehensiveAssignmentError" class="mb-4 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-2">
            <span>⚠️ {{ comprehensiveAssignmentError }}</span>
          </div>

          <div class="space-y-5">
            <!-- Select Course -->
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'الكورس المستهدف' : 'Target Course' }}</label>
              <select [(ngModel)]="comprehensiveAssignmentCourseId" (change)="onComprehensiveAssignmentCourseChange()" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 text-sm font-medium outline-none">
                <option [ngValue]="null" disabled>{{ lang === 'ar' ? 'اختر الكورس...' : 'Select a course...' }}</option>
                <option *ngFor="let c of courses" [ngValue]="c.id">{{ c.title }}</option>
              </select>
            </div>

            <div *ngIf="isComprehensiveAssignmentLoading" class="py-12 text-center text-slate-400 animate-pulse text-sm">
              {{ lang === 'ar' ? 'جاري تحميل بيانات الواجب الشامل...' : 'Loading comprehensive assignment data...' }}
            </div>

            <!-- Form Content -->
            <div *ngIf="!isComprehensiveAssignmentLoading && comprehensiveAssignmentCourseId" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'عنوان الواجب الشامل' : 'Assignment Title' }}</label>
                <input type="text" [(ngModel)]="comprehensiveAssignmentData.title" placeholder="{{ lang === 'ar' ? 'مثال: الواجب النهائي الشامل' : 'e.g. Final Comprehensive Assignment' }}" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 text-sm font-medium outline-none">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'تعليمات / تفاصيل الواجب (اختياري)' : 'Instructions / Description (Optional)' }}</label>
                <textarea rows="2" [(ngModel)]="comprehensiveAssignmentData.description" placeholder="{{ lang === 'ar' ? 'اكتب تعليمات أو تفاصيل توجيهية للطلاب...' : 'Write guidelines or instructions for students...' }}" class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 text-xs font-medium outline-none"></textarea>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'تاريخ ووقت انتهاء التسليم' : 'Due Date & Time' }}</label>
                <input type="datetime-local" [(ngModel)]="comprehensiveAssignmentData.dueDate" [min]="minDate" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 text-sm font-medium outline-none">
              </div>

              <!-- Questions Header -->
              <div class="flex items-center justify-between pt-2">
                <h4 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{{ lang === 'ar' ? 'أسئلة الواجب' : 'Assignment Questions' }}</span>
                  <span class="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold">{{ comprehensiveAssignmentData.questions.length }}</span>
                </h4>
                <button type="button" (click)="addComprehensiveAssignmentQuestion()" class="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1">
                  <span>+</span> {{ lang === 'ar' ? 'إضافة سؤال' : 'Add Question' }}
                </button>
              </div>

              <!-- Questions List -->
              <div *ngFor="let q of comprehensiveAssignmentData.questions; let qIdx = index; trackBy: trackByIndex" class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300"># {{ qIdx + 1 }} - {{ lang === 'ar' ? 'السؤال' : 'Question' }}</span>
                  <div class="flex items-center gap-2">
                    <select [(ngModel)]="q.type" (change)="onComprehensiveAssignmentTypeChange(q)" class="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-bold outline-none">
                      <option value="mcq">{{ lang === 'ar' ? 'اختيار من متعدد' : 'Multiple Choice' }}</option>
                      <option value="written">{{ lang === 'ar' ? 'مقالي / نصي' : 'Written / Essay' }}</option>
                    </select>
                    <button *ngIf="comprehensiveAssignmentData.questions.length > 1" type="button" (click)="removeComprehensiveAssignmentQuestion(qIdx)" class="text-xs text-rose-500 hover:text-rose-700 font-bold">
                      {{ lang === 'ar' ? 'حذف' : 'Remove' }}
                    </button>
                  </div>
                </div>

                <div>
                  <input type="text" [(ngModel)]="q.text" placeholder="{{ lang === 'ar' ? 'اكتب نص السؤال هنا...' : 'Enter question text...' }}" class="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500">
                </div>

                <!-- MCQ Options -->
                <div *ngIf="q.type === 'mcq'" class="space-y-2 pt-1">
                  <label class="block text-[11px] font-bold text-slate-500 dark:text-slate-400">{{ lang === 'ar' ? 'الخيارات (اختر الإجابة الصحيحة بالضغط على الدائرة):' : 'Options (Select the correct option with the radio button):' }}</label>
                  <div *ngFor="let opt of q.options; let oIdx = index; trackBy: trackByIndex" class="flex items-center gap-2">
                    <input type="radio" [name]="'assign_opt_' + qIdx" [checked]="q.correctIndex === oIdx" (change)="q.correctIndex = oIdx" class="w-4 h-4 text-purple-600 accent-purple-600 focus:ring-purple-500 shrink-0 cursor-pointer" title="{{ lang === 'ar' ? 'تحديد كإجابة صحيحة' : 'Set as correct' }}">
                    <input type="text" [(ngModel)]="q.options[oIdx]" placeholder="{{ lang === 'ar' ? ('الخيار ' + (oIdx + 1)) : ('Option ' + (oIdx + 1)) }}" class="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500">
                    <button *ngIf="q.options.length > 2" type="button" (click)="q.options.splice(oIdx, 1)" class="text-slate-400 hover:text-rose-500 px-1 text-sm font-bold">✕</button>
                  </div>
                  <div *ngIf="q.options.length < 6" class="pt-1">
                    <button type="button" (click)="q.options.push('')" class="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-bold">+ {{ lang === 'ar' ? 'إضافة خيار آخر' : 'Add another option' }}</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button *ngIf="isComprehensiveAssignmentEditMode" type="button" (click)="deleteComprehensiveAssignment()" [disabled]="isComprehensiveAssignmentSaving" class="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 font-bold rounded-xl text-xs transition">
                {{ lang === 'ar' ? 'حذف الواجب الشامل' : 'Delete Assignment' }}
              </button>
              <div class="flex items-center gap-3 ms-auto">
                <button type="button" (click)="closeComprehensiveAssignmentModal()" class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition">
                  {{ t[lang].cancel }}
                </button>
                <button type="button" (click)="saveComprehensiveAssignment()" [disabled]="!comprehensiveAssignmentCourseId || isComprehensiveAssignmentSaving" class="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50">
                  {{ isComprehensiveAssignmentSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ الواجب الشامل' : 'Save Assignment') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- EDIT COURSE MODAL (Matching Add New Schedule Event style) -->
      <div *ngIf="showEditCourseModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900 dark:text-white">{{ lang === 'ar' ? 'تعديل بيانات الكورس' : 'Edit Course Details' }}</h3>
              <p class="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{{ lang === 'ar' ? 'قم بتعديل تفاصيل الكورس بالأسفل.' : 'Update the course details below.' }}</p>
            </div>
            <button (click)="closeEditCourseModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold transition">✕</button>
          </div>

          <div *ngIf="editCourseError" class="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <svg class="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{{ editCourseError }}</span>
          </div>

          <form [formGroup]="editCourseForm" (ngSubmit)="saveCourseEdit()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].courseTitle }} <span class="text-rose-500">*</span></label>
              <input type="text" formControlName="title" placeholder="{{ lang === 'ar' ? 'عنوان الكورس...' : 'Course Title...' }}" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].desc }} <span class="text-slate-400 font-normal">({{ lang === 'ar' ? 'اختياري' : 'Optional' }})</span></label>
              <textarea formControlName="description" rows="3" placeholder="{{ lang === 'ar' ? 'وصف وتفاصيل الكورس...' : 'Course description & details...' }}" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].courseType }}</label>
              <div class="flex items-center gap-6 p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="isFree" [value]="true" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                  <span>{{ t[lang].freeCourse }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="isFree" [value]="false" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                  <span>{{ t[lang].paidCourse }}</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3" *ngIf="!editCourseForm.get('isFree')?.value">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].price }}</label>
                <div class="relative">
                  <input type="number" formControlName="price" placeholder="0" class="w-full pl-3 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-left" style="direction: ltr;">
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                </div>
                <p class="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium leading-tight">
                  {{ lang === 'ar' ? 'تنبيه: تخصم المنصة نسبة 10% من سعر الكورس.' : 'Notice: Platform deducts 10% of the price.' }}
                </p>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].discount }}</label>
                <div class="relative">
                  <input type="number" formControlName="discountPercentage" placeholder="0" class="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-left" style="direction: ltr;">
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].uploadCover }}</label>
              <div class="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer relative overflow-hidden group">
                <input type="file" (change)="onEditFileSelected($event)" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                <div *ngIf="!editCourseImagePreview" class="text-center pointer-events-none py-2">
                  <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400">{{ t[lang].clickToUpload }}</p>
                </div>
                <div *ngIf="editCourseImagePreview" class="w-full h-32 relative rounded-xl overflow-hidden pointer-events-none">
                  <img [src]="editCourseImagePreview" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="text-white font-bold text-xs bg-black/60 px-3 py-1.5 rounded-lg">✏️ {{ t[lang].changeImage }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" (click)="closeEditCourseModal()" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition">{{ t[lang].cancel }}</button>
              <button type="submit" [disabled]="isSaving || !editCourseForm.valid" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                <span>{{ isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- UNSAVED CHANGES WARNING MODAL (Overlay above settings, Red warning style) -->
      <div *ngIf="showUnsavedModal" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in border border-rose-100 dark:border-rose-900/50">
          <div class="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg class="w-8 h-8 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white text-center mb-2">{{ t[lang].unsavedTitle }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 text-center mb-8 leading-relaxed">{{ t[lang].unsavedDesc }}</p>
          <div class="flex gap-3">
            <button (click)="cancelDiscard()" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition">{{ t[lang].stayBtn }}</button>
            <button (click)="confirmDiscard()" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md">{{ t[lang].discardBtn }}</button>
          </div>
        </div>
      </div>

      <!-- ACCOUNT SETTINGS MODAL (Matching Add New Schedule Event style) -->
      <div *ngIf="showSettingsModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900 dark:text-white">{{ t[lang].accountSettings }}</h3>
              <p class="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{{ lang === 'ar' ? 'تعديل بيانات الحساب والملف الشخصي' : 'Update your profile information and account details' }}</p>
            </div>
            <button (click)="closeSettings()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold transition">✕</button>
          </div>

          <div class="space-y-4">
            <!-- Cover image preview & change (Req 2) -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">{{ lang === 'ar' ? 'صورة الغلاف للملف الشخصي' : 'Profile Cover Image' }}</label>
                <span class="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{{ lang === 'ar' ? 'الحد الأقصى: 1 ميجابايت' : 'Max: 1 MB' }}</span>
              </div>
              <div class="relative group rounded-2xl overflow-hidden h-28 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                <img [src]="getCoverImageUrl(editProfileData.coverImage)" (error)="$any($event.target).src='assets/images/default-cover.jpg'" class="w-full h-full object-cover">
                <label class="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {{ lang === 'ar' ? 'تغيير صورة الغلاف' : 'Change Cover Image' }}
                  <input type="file" (change)="onCoverSelected($event)" accept="image/*" class="hidden">
                </label>
              </div>
            </div>

            <div class="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div class="relative group shrink-0">
                <img [src]="editProfileData.profileImage ? 'https://qimma.runasp.net' + editProfileData.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + editProfileData.fullName)" class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 dark:border-indigo-900 shadow-sm">
                <label class="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[11px] font-bold">
                  {{ t[lang].change }}
                  <input type="file" (change)="onAvatarSelected($event)" accept="image/*" class="hidden">
                </label>
              </div>
              <div class="min-w-0">
                <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate">{{ editProfileData.fullName || 'Teacher' }}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ editProfileData.email }}</p>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{{ lang === 'ar' ? 'الحد الأقصى للصورة: 1 ميجابايت' : 'Max: 1 MB' }}</p>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 rounded-lg mt-1 inline-block">{{ editProfileData.specialization || t[lang].teacher }}</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].fullName }} <span class="text-rose-500">*</span></label>
              <input type="text" [(ngModel)]="editProfileData.fullName" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-slate-900 dark:text-white">
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].specialization }} <span class="text-rose-500">*</span></label>
              <input type="text" [(ngModel)]="editProfileData.specialization" [placeholder]="t[lang].specPlaceholder" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-slate-900 dark:text-white">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].email }}</label>
              <input type="email" [(ngModel)]="editProfileData.email" disabled class="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm font-medium">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].phone }}</label>
              <div class="flex gap-2">
                <select [(ngModel)]="editProfileData.countryCode" class="w-28 px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium dir-ltr text-left outline-none text-slate-900 dark:text-white">
                  <option *ngFor="let country of countries; trackBy: trackById" [value]="country.code">
                    {{ country.flag }} {{ country.code }}
                  </option>
                </select>
                <input type="text" [(ngModel)]="editProfileData.phone" class="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium dir-ltr text-left outline-none text-slate-900 dark:text-white">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].bio }}</label>
              <textarea [(ngModel)]="editProfileData.bio" rows="3" [placeholder]="t[lang].bioPlaceholder" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-slate-900 dark:text-white"></textarea>
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 class="font-extrabold text-sm text-slate-900 dark:text-white mb-1">{{ t[lang].securitySectionTitle }}</h4>
              <p class="text-xs text-slate-400 mb-3">{{ t[lang].securitySectionDesc }}</p>
              
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].resetPasswordOptional }}</label>
                <input type="password" [(ngModel)]="editProfileData.newPassword" [placeholder]="t[lang].leaveBlankIfSame" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-slate-900 dark:text-white">
              </div>
            </div>

            <div class="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button (click)="closeSettings()" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition">{{ t[lang].cancel }}</button>
              <button (click)="saveProfile()" [disabled]="isSaving || !editProfileData.specialization || editProfileData.specialization.trim() === '' || !editProfileData.fullName || editProfileData.fullName.trim() === ''" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-md disabled:opacity-50">
                {{ isSaving ? t[lang].saving : t[lang].saveBtn }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CREATE COURSE MODAL (Placed at root level with z-[100] to cover entire screen) -->
      <div *ngIf="showCreateForm" class="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900 dark:text-white">{{ t[lang].createCourse }}</h3>
              <p class="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{{ t[lang].fillDetails }}</p>
            </div>
            <button (click)="cancelCreateCourse()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">✕</button>
          </div>

          <div *ngIf="createCourseError" class="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/>
            </svg>
            <span>{{ createCourseError }}</span>
          </div>

          <form [formGroup]="courseForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].courseTitle }}</label>
              <input type="text" formControlName="title" placeholder="{{ lang === 'ar' ? 'عنوان الكورس...' : 'Course Title...' }}" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'الوصف (اختياري)' : 'Description (Optional)' }}</label>
              <textarea formControlName="description" rows="3" placeholder="{{ lang === 'ar' ? 'وصف وتفاصيل الكورس...' : 'Course description & details...' }}" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].courseType }}</label>
              <div class="flex gap-4 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input type="radio" formControlName="isFree" [value]="true" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                  <span>{{ t[lang].freeCourse }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input type="radio" formControlName="isFree" [value]="false" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                  <span>{{ t[lang].paidCourse }}</span>
                </label>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3" *ngIf="!courseForm.get('isFree')?.value">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].price }}</label>
                <div class="relative">
                  <input type="number" formControlName="price" placeholder="0" class="w-full pl-3 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-left" style="direction: ltr;">
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                </div>
                <p class="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium leading-tight">
                  {{ lang === 'ar' ? 'تنبيه: تخصم المنصة نسبة 10% من سعر الكورس.' : 'Notice: Platform deducts 10% of the price.' }}
                </p>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].discount }}</label>
                <div class="relative">
                  <input type="number" formControlName="discountPercentage" placeholder="0" class="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-left" style="direction: ltr;">
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].uploadCover }}</label>
              <div class="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer relative overflow-hidden group">
                <input type="file" (change)="onFileSelected($event)" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                <div *ngIf="!imagePreview" class="text-center pointer-events-none py-2">
                  <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400">{{ t[lang].clickToUpload }}</p>
                </div>
                <div *ngIf="imagePreview" class="w-full h-32 relative rounded-xl overflow-hidden pointer-events-none">
                  <img [src]="imagePreview" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="text-white font-bold text-xs bg-black/50 px-3 py-1.5 rounded-lg">✏️ {{ t[lang].changeImage }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex gap-3 pt-3">
              <button type="button" (click)="cancelCreateCourse()" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition">{{ t[lang].cancel }}</button>
              <button type="submit" [disabled]="!courseForm.valid || isSaving" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md">{{ isSaving ? t[lang].saving : t[lang].publishBtn }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- SCHEDULE EVENT CREATION MODAL (Placed at root level with z-[100] to cover entire screen) -->
      <div *ngIf="showEventForm" class="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-extrabold text-xl text-slate-900 dark:text-white">{{ lang === 'ar' ? 'إضافة موعد جديد في الجدول' : 'Add New Schedule Event' }}</h3>
            <button (click)="cancelCreateEvent()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold transition">✕</button>
          </div>

          <div *ngIf="eventFormError" class="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <svg class="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{{ eventFormError }}</span>
          </div>

          <form [formGroup]="eventForm" (ngSubmit)="submitEvent()" class="space-y-4">
            <div class="relative">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'الكورس المرتبط' : 'Related Course' }}</label>
              <button type="button" 
                      (click)="isCourseDropdownOpen = !isCourseDropdownOpen" 
                      class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none flex items-center justify-between text-start cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition">
                <span class="truncate" [ngClass]="eventForm.get('courseId')?.value ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 dark:text-slate-500'">
                  {{ getSelectedCourseTitle() || (lang === 'ar' ? 'اختر الكورس...' : 'Select course...') }}
                </span>
                <svg class="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200" [ngClass]="{'rotate-180': isCourseDropdownOpen}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>

              <!-- Dropdown List limited to ~3 items with clean scrollbar -->
              <div *ngIf="isCourseDropdownOpen" class="absolute z-30 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in">
                <div class="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  <div *ngFor="let c of courses; trackBy: trackById" 
                       (click)="selectEventCourse(c.id)" 
                       class="px-4 py-2.5 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 cursor-pointer text-sm font-medium transition flex items-center justify-between"
                       [ngClass]="eventForm.get('courseId')?.value == c.id ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'">
                    <span class="truncate">{{ c.title }}</span>
                    <svg *ngIf="eventForm.get('courseId')?.value == c.id" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div *ngIf="courses.length === 0" class="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                    {{ lang === 'ar' ? 'لا توجد كورسات متاحة' : 'No courses available' }}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'عنوان الحدث' : 'Event Title' }}</label>
              <input type="text" formControlName="title" placeholder="{{ lang === 'ar' ? 'مثال: محاضرة مراجعة البلاغة' : 'e.g. Grammar Review Session' }}" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'نوع الحدث' : 'Event Type' }}</label>
              <input type="text" formControlName="eventType" placeholder="{{ lang === 'ar' ? 'مثال: Live, Deadline, Workshop...' : 'e.g. Live, Deadline, Workshop...' }}" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'تاريخ ووقت الحدث' : 'Event Date & Time' }}</label>
              <input type="datetime-local" formControlName="eventDate" [min]="minDate" (click)="$any($event.target).showPicker?.()" (keydown)="preventDateKeyboardTyping($event)" (input)="validateEventDate($event)" (change)="validateEventDate($event)" style="accent-color: #4f46e5 !important;" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none accent-indigo-600">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ lang === 'ar' ? 'الوصف (اختياري)' : 'Description (Optional)' }}</label>
              <textarea formControlName="description" rows="3" placeholder="{{ lang === 'ar' ? 'ملاحظات وتفاصيل إضافية للطلاب...' : 'Additional notes for students...' }}" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none"></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button type="button" (click)="cancelCreateEvent()" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition">{{ t[lang].cancel }}</button>
              <button type="submit" [disabled]="!eventForm.valid || isSaving" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md">
                {{ isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'إضافة الحدث' : 'Add Event') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Mobile Backdrop Overlay -->
      <div *ngIf="isMobileSidebarOpen" 
           (click)="isMobileSidebarOpen = false" 
           class="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden animate-fade-in cursor-pointer">
      </div>

      <!-- SIDEBAR -->
      <aside class="dashboard-sidebar-drawer bg-[#130E35] text-white flex flex-col shrink-0 h-screen overflow-hidden"
             [ngClass]="[
               isMobileSidebarOpen ? 'drawer-open' : 'drawer-closed',
               isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
             ]">
        
        <!-- Brand Header -->
        <div class="h-20 flex items-center px-6 border-b border-white/10 gap-3 justify-between shrink-0">
          <div (click)="switchTab('dashboard')" class="flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-90 transition group" *ngIf="!isSidebarCollapsed || isMobileSidebarOpen" title="Qimma Dashboard">
            <img src="assets/images/qimma-round.jpg" alt="Qimma Logo" class="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-indigo-500/30 shrink-0 border border-white/20">
            <div>
              <h1 class="font-black text-lg leading-tight tracking-wide text-white group-hover:text-indigo-300 transition">Qimma</h1>
              <p class="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{{ t[lang].instructorPanel }}</p>
            </div>
          </div>
          <!-- Desktop Toggle -->
          <button (click)="toggleSidebar()" 
                  class="hidden lg:flex w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 items-center justify-center text-slate-300 hover:text-white transition shrink-0"
                  [title]="isSidebarCollapsed ? (lang === 'ar' ? 'توسيع القائمة' : 'Expand Sidebar') : (lang === 'ar' ? 'طي القائمة' : 'Collapse Sidebar')">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path *ngIf="!isSidebarCollapsed" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
              <path *ngIf="isSidebarCollapsed" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
            </svg>
          </button>
          <!-- Mobile Close -->
          <button (click)="isMobileSidebarOpen = false" 
                  aria-label="Close menu"
                  class="lg:hidden w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-base font-bold shrink-0 transition cursor-pointer">
            ✕
          </button>
        </div>

        <!-- Instructor Profile Pill -->
        <div class="p-4 border-b border-white/10 shrink-0" *ngIf="!isSidebarCollapsed || isMobileSidebarOpen">
          <div class="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden font-bold">
              <img *ngIf="userData?.profileImage" [src]="'https://qimma.runasp.net' + userData.profileImage" class="w-full h-full object-cover">
              <span *ngIf="!userData?.profileImage">{{ (userData?.username || 'T').substring(0,1).toUpperCase() }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-extrabold text-sm text-white truncate">{{ userData?.username || (lang === 'ar' ? 'معلم' : 'Instructor') }}</p>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{{ userData?.specialization || t[lang].teacher }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
          <button (click)="switchTab('dashboard')" 
                  [ngClass]="activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start"
                  [class.justify-center]="isSidebarCollapsed && !isMobileSidebarOpen"
                  [title]="t[lang].dashboard">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9" rx="1"></rect>
              <rect x="14" y="3" width="7" height="5" rx="1"></rect>
              <rect x="14" y="12" width="7" height="9" rx="1"></rect>
              <rect x="3" y="16" width="7" height="5" rx="1"></rect>
            </svg>
            <span *ngIf="!isSidebarCollapsed || isMobileSidebarOpen" class="truncate">{{ t[lang].dashboard }}</span>
          </button>

          <button (click)="switchTab('courses')" 
                  [ngClass]="activeTab === 'courses' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start"
                  [class.justify-center]="isSidebarCollapsed && !isMobileSidebarOpen"
                  [title]="t[lang].myCourses">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span *ngIf="!isSidebarCollapsed || isMobileSidebarOpen" class="truncate">{{ t[lang].myCourses }}</span>
          </button>

          <button (click)="switchTab('enrollees')" 
                  [ngClass]="activeTab === 'enrollees' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start"
                  [class.justify-center]="isSidebarCollapsed && !isMobileSidebarOpen"
                  [title]="t[lang].enrollees">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span *ngIf="!isSidebarCollapsed || isMobileSidebarOpen" class="truncate">{{ t[lang].enrollees }}</span>
          </button>

          <button (click)="switchTab('students')" 
                  [ngClass]="activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start"
                  [class.justify-center]="isSidebarCollapsed && !isMobileSidebarOpen"
                  [title]="t[lang].students">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span *ngIf="!isSidebarCollapsed || isMobileSidebarOpen" class="truncate">{{ t[lang].students }}</span>
          </button>

          <button (click)="switchTab('live')" 
                  [ngClass]="activeTab === 'live' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start"
                  [class.justify-center]="isSidebarCollapsed && !isMobileSidebarOpen"
                  [title]="t[lang].liveSessions">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
            <span *ngIf="!isSidebarCollapsed || isMobileSidebarOpen" class="truncate">{{ t[lang].liveSessions }}</span>
          </button>

          <button (click)="switchTab('schedule')" 
                  [ngClass]="activeTab === 'schedule' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start"
                  [class.justify-center]="isSidebarCollapsed && !isMobileSidebarOpen"
                  [title]="t[lang].schedule">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span *ngIf="!isSidebarCollapsed || isMobileSidebarOpen" class="truncate">{{ t[lang].schedule }}</span>
          </button>

          <button (click)="switchTab('support')" 
                  [ngClass]="activeTab === 'support' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start"
                  [class.justify-center]="isSidebarCollapsed && !isMobileSidebarOpen"
                  [title]="t[lang].support">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
            <span *ngIf="!isSidebarCollapsed || isMobileSidebarOpen" class="truncate">{{ t[lang].support }}</span>
          </button>

          <button (click)="openSettings()" 
                  [ngClass]="activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start"
                  [class.justify-center]="isSidebarCollapsed && !isMobileSidebarOpen"
                  [title]="t[lang].accountSettings">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span *ngIf="!isSidebarCollapsed || isMobileSidebarOpen" class="truncate">{{ t[lang].accountSettings }}</span>
          </button>
        </nav>

        <!-- Bottom Actions -->
        <div class="p-4 border-t border-white/10 shrink-0">
          <button (click)="logout()" 
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs transition"
                  [class.justify-center]="isSidebarCollapsed && !isMobileSidebarOpen"
                  [title]="t[lang].logout">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span *ngIf="!isSidebarCollapsed || isMobileSidebarOpen">{{ t[lang].logout }}</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Wrapper -->
      <div class="flex-1 h-screen flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <header class="h-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-10 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div class="flex items-center gap-2 sm:gap-3">
            <button (click)="isMobileSidebarOpen = !isMobileSidebarOpen" 
                    aria-label="Toggle navigation menu"
                    class="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 class="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
              {{ getTabTitle() }}
            </h2>
          </div>

          <div class="flex items-center gap-3">
            <!-- Dark Mode Switcher in Header -->
            <button (click)="toggleDarkMode()" 
                    [title]="isDarkMode ? (lang === 'ar' ? 'الوضع النهاري' : 'Light Mode') : (lang === 'ar' ? 'الوضع الليلي' : 'Dark Mode')"
                    class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center shadow-sm">
              <svg *ngIf="isDarkMode" class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <svg *ngIf="!isDarkMode" class="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </button>

            <!-- Language Switcher in Header (Image 2) -->
            <button (click)="toggleLang()" 
                    class="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path>
              </svg>
              <span>{{ lang === 'ar' ? 'English' : 'العربية' }}</span>
            </button>

            <!-- NOTIFICATION BELL (Image 2 & 3) -->
            <div class="relative notification-container">
              <button (click)="toggleNotifications()" 
                      class="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center justify-center">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span *ngIf="unreadCount > 0" 
                      class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full min-w-[18px] text-center shadow-md animate-pulse">
                  {{ unreadCount }}
                </span>
              </button>

              <!-- Notifications Dropdown Panel (Image 3) -->
              <div *ngIf="showNotificationsDropdown" 
                   class="absolute ltr:right-0 rtl:left-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 z-50 overflow-hidden animate-fade-in"
                   [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
                
                <div class="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <h3 class="font-extrabold text-slate-900 dark:text-white text-sm">{{ t[lang].notificationsTitle }}</h3>
                    <span *ngIf="unreadCount > 0" class="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-xs font-black rounded-full">
                      {{ unreadCount }} {{ t[lang].unreadText }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button *ngIf="unreadCount > 0" (click)="markAllNotificationsAsRead()" 
                            class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition">
                      {{ t[lang].markAllAsRead }}
                    </button>
                    <button *ngIf="notifications.length > 0" (click)="deleteAllNotifications()" 
                            class="text-xs font-bold text-rose-500 hover:text-rose-700 transition">
                      {{ t[lang].clearAll }}
                    </button>
                  </div>
                </div>

                <div class="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  <div *ngIf="notifications.length === 0" class="p-8 text-center text-slate-400 dark:text-slate-500 font-bold text-xs">
                    {{ t[lang].noNotifications }}
                  </div>

                  <div *ngFor="let notif of notifications" (click)="onNotificationClick(notif)" 
                       [ngClass]="{'bg-indigo-50/40 dark:bg-indigo-950/20': !notif.isRead, 'bg-white dark:bg-slate-900': notif.isRead}" 
                       class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-start gap-3 group">
                    
                    <div class="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-xs font-black shadow-xs"
                         [ngClass]="{
                           'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400': getNotificationType(notif.message) === 'ENROLLMENT_PAID',
                           'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400': getNotificationType(notif.message) === 'ENROLLMENT',
                           'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400': getNotificationType(notif.message) === 'NEW_USER' || getNotificationType(notif.message) === 'NEW_INSTRUCTOR' || getNotificationType(notif.message) === 'NEW_STUDENT',
                           'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400': getNotificationType(notif.message) === 'ASSIGNMENT',
                           'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300': getNotificationType(notif.message) === 'SYSTEM'
                         }">
                      <svg *ngIf="getNotificationType(notif.message) === 'ENROLLMENT_PAID'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      <svg *ngIf="getNotificationType(notif.message) === 'ENROLLMENT'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                      <svg *ngIf="getNotificationType(notif.message) === 'NEW_USER' || getNotificationType(notif.message) === 'NEW_INSTRUCTOR' || getNotificationType(notif.message) === 'NEW_STUDENT'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                      <svg *ngIf="getNotificationType(notif.message) === 'ASSIGNMENT'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                      </svg>
                      <svg *ngIf="getNotificationType(notif.message) === 'SYSTEM'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>

                    <div class="flex-1 min-w-0 text-start" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
                      <p class="text-xs font-bold text-slate-900 dark:text-white leading-snug break-words">
                        <bdi>{{ getNotificationTitle(notif.message) }}</bdi>
                      </p>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed break-words" *ngIf="getNotificationDesc(notif.message)">
                        <bdi>{{ getNotificationDesc(notif.message) }}</bdi>
                      </p>
                      <div class="flex items-center gap-2 mt-1" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
                        <span class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{{ formatTimeAgo(notif.createdAt) }}</span>
                        <span class="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                        <span class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{{ formatDateTime(notif.createdAt) }}</span>
                      </div>
                    </div>

                    <span *ngIf="!notif.isRead" class="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5"></span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Vertical Separator (Image 2) -->
            <div class="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

            <!-- Instructor Profile Indicator in Header (Image 2) -->
            <div class="flex items-center gap-3 pl-2 cursor-pointer" (click)="openSettings()" [ngClass]="lang === 'ar' ? 'pr-2 pl-0 border-r border-slate-200 dark:border-slate-700' : 'pl-2 border-l border-slate-200 dark:border-slate-700'">
              <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-200 dark:border-indigo-800/60 overflow-hidden shadow-xs">
                <img *ngIf="userData?.profileImage" [src]="'https://qimma.runasp.net' + userData.profileImage" class="w-full h-full object-cover">
                <span *ngIf="!userData?.profileImage">{{ (userData?.username || 'T').substring(0,1).toUpperCase() }}</span>
              </div>
              <div class="hidden sm:block">
                <p class="text-xs font-bold text-slate-900 dark:text-white leading-tight">{{ userData?.username || (lang === 'ar' ? 'معلم' : 'Instructor') }}</p>
                <p class="text-[10px] text-slate-400 dark:text-slate-400 font-medium">{{ t[lang].teacher }}</p>
              </div>
            </div>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          
          <!-- DASHBOARD TAB -->
          <ng-container *ngIf="activeTab === 'dashboard'">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 class="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">{{ t[lang].welcome }}, {{ userData?.username || 'Instructor' }} 👋</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">{{ t[lang].streak }}</p>
              </div>
            </div>

            <!-- Top Number Metrics -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{{ t[lang].totalStudents }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35] dark:text-white">{{ totalStudentsCount }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                </div>
              </div>
              
              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{{ t[lang].activeCourses }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35] dark:text-white">{{ courses.length }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{{ t[lang].totalQuizzes }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35] dark:text-white">{{ totalQuizzesCount }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{{ t[lang].totalLessons }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35] dark:text-white">{{ totalLessonsCount }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Revenue, Growth, Rating Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
                <div class="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div class="flex items-center justify-between mb-4 relative z-10">
                  <h3 class="font-bold text-emerald-50">{{ t[lang].totalRevenue }}</h3>
                  <span class="p-2 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  </span>
                </div>
                <div class="relative z-10" *ngIf="!isLoadingDashboard">
                  <p class="text-4xl font-black mb-1 flex items-baseline gap-1">
                    {{ totalRevenue | number }} <span class="text-lg font-bold text-emerald-100">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                  </p>
                  <p class="text-sm text-emerald-100 font-medium mt-2 flex items-center gap-1">
                    <span class="bg-emerald-400/30 px-2 py-0.5 rounded-md text-white">+{{ monthlyRevenue | number }}</span> {{ t[lang].thisMonth }}
                  </p>
                </div>
                <div *ngIf="isLoadingDashboard" class="relative z-10 space-y-3">
                  <div class="h-10 w-32 bg-emerald-400/50 rounded animate-pulse"></div>
                  <div class="h-4 w-48 bg-emerald-400/50 rounded animate-pulse mt-2"></div>
                </div>
              </div>

              <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-center">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-bold text-slate-500 dark:text-slate-400">{{ t[lang].studentGrowth }}</h3>
                  <span class="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                  </span>
                </div>
                <div *ngIf="!isLoadingDashboard">
                  <p class="text-3xl font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <span *ngIf="studentGrowth > 0">+</span>{{ studentGrowth }}% 
                    <svg *ngIf="studentGrowth >= 0" class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    <svg *ngIf="studentGrowth < 0" class="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>
                  </p>
                  <p class="text-sm text-slate-400 dark:text-slate-500 font-medium mt-1">{{ t[lang].increaseLastMonth }}</p>
                </div>
                <div *ngIf="isLoadingDashboard" class="space-y-3">
                  <div class="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                  <div class="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-2"></div>
                </div>
              </div>

              <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-center">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-bold text-slate-500 dark:text-slate-400">{{ t[lang].instructorRating }}</h3>
                  <span class="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </span>
                </div>
                <div *ngIf="!isLoadingDashboard">
                  <div class="flex items-end gap-3 mt-2">
                    <p class="text-5xl font-black text-slate-900 dark:text-white">{{ instructorRating }}</p>
                    <p class="text-base text-slate-400 dark:text-slate-500 font-bold mb-1">/ 5.0</p>
                  </div>
                  <div class="flex gap-1 mt-3">
                    <span *ngFor="let star of [1,2,3,4,5]; trackBy: trackById" class="text-amber-400 text-lg" [class.opacity-30]="star > instructorRating">★</span>
                  </div>
                </div>
                <div *ngIf="isLoadingDashboard" class="space-y-4 mt-2">
                  <div class="h-10 w-24 bg-slate-200 rounded animate-pulse"></div>
                  <div class="flex gap-1"><div *ngFor="let i of [1,2,3,4,5]; trackBy: trackById" class="h-5 w-5 bg-slate-200 rounded-full animate-pulse"></div></div>
                </div>
              </div>
            </div>

            <!-- Filter Capsule matching Image 1 (Req 2) -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex flex-wrap items-center gap-2">
                <!-- Timeframe Capsule Filter Pills (Matching image 1) -->
                <div class="bg-white dark:bg-slate-900 rounded-full p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-1 self-start sm:self-auto">
                  <button (click)="setChartTimeframe('7days')"
                          [ngClass]="selectedChartTimeframe === '7days' && !selectedChartDate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
                          class="px-4 py-1.5 rounded-full text-xs font-bold transition">
                    {{ t[lang].days7 }}
                  </button>
                  <button (click)="setChartTimeframe('30days')"
                          [ngClass]="selectedChartTimeframe === '30days' && !selectedChartDate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
                          class="px-4 py-1.5 rounded-full text-xs font-bold transition">
                    {{ t[lang].days30 }}
                  </button>
                  <button (click)="setChartTimeframe('1year')"
                          [ngClass]="selectedChartTimeframe === '1year' && !selectedChartDate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
                          class="px-4 py-1.5 rounded-full text-xs font-bold transition">
                    {{ t[lang].year1 }}
                  </button>
                  <button (click)="setChartTimeframe('all')"
                          [ngClass]="selectedChartTimeframe === 'all' && !selectedChartDate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
                          class="px-4 py-1.5 rounded-full text-xs font-bold transition">
                    {{ t[lang].allTime }}
                  </button>
                </div>

                <!-- Specific Day Filter (Matching image 1) -->
                <div class="bg-white dark:bg-slate-900 rounded-full px-3 py-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span class="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{{ t[lang].specificDayFilter }}:</span>
                  <input type="date" [(ngModel)]="selectedChartDate" (change)="onChartDateChange()" class="text-xs bg-transparent border-0 outline-none font-bold text-indigo-700 dark:text-indigo-400 cursor-pointer">
                  <button *ngIf="selectedChartDate" (click)="clearChartDate()" class="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center font-bold text-[10px]" title="{{ t[lang].clearDateFilter }}">✕</button>
                </div>
              </div>
            </div>

            <!-- ANALYTICS CHARTS ROW: Enrollments & Completions + Course Catalog Distribution (Req 5) -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <!-- lg:col-span-2: Enrollments & Course Completions -->
              <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h4 class="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                      </svg>
                      <span>{{ lang === 'ar' ? 'التسجيلات وإتمام الكورسات' : 'Enrollments & Course Completions' }}</span>
                    </h4>
                    <p class="text-xs text-slate-400 dark:text-slate-500 font-medium">{{ lang === 'ar' ? 'متابعة وتيرة تسجيل الطلاب وإكمالهم للكورسات' : 'Track student enrollments and course completions' }}</p>
                  </div>
                  <div class="flex items-center gap-3 text-xs font-bold">
                    <span class="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                      <span>{{ lang === 'ar' ? 'التسجيلات' : 'Enrollments' }}</span>
                    </span>
                    <span class="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
                      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                      <span>{{ lang === 'ar' ? 'المكتملة' : 'Completions' }}</span>
                    </span>
                  </div>
                </div>

                <div class="h-[280px] w-full relative">
                  <canvas id="assignmentsChart"></canvas>
                </div>
              </div>

              <!-- 1 col: Doughnut Breakdown Chart (Course Catalog Distribution: Free vs Paid) -->
              <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 class="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <svg class="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 2a10 10 0 0 1 10 10h-10z"></path>
                    </svg>
                    <span>{{ t[lang].courseDistributionChartTitle }}</span>
                  </h4>
                  <p class="text-xs text-slate-400 dark:text-slate-500 font-medium mb-4">{{ t[lang].courseDistributionDesc }}</p>
                </div>

                <div class="h-[210px] w-full relative flex items-center justify-center">
                  <canvas id="teacherCourseDistributionChart"></canvas>
                </div>

                <div class="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                  <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <p class="text-slate-400 dark:text-slate-500 font-bold">{{ t[lang].paidCourse }}</p>
                    <p class="font-black text-indigo-700 dark:text-indigo-400 text-sm mt-0.5">{{ paidCoursesCount }}</p>
                  </div>
                  <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <p class="text-slate-400 dark:text-slate-500 font-bold">{{ t[lang].freeCourse }}</p>
                    <p class="font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{{ freeCoursesCount }}</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- YOUR TOP COURSES WIDGET (Req 2) -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
              <!-- Card Header -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center shadow-xs">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </div>
                  <div>
                    <h3 class="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">{{ t[lang].yourTopCourses }}</h3>
                    <p class="text-xs text-slate-400 dark:text-slate-500 font-medium">{{ lang === 'ar' ? 'الكورسات الأكثر نشاطاً ونسبة إتمام الطلاب' : 'Most engaged courses & student completion' }}</p>
                  </div>
                </div>

                <!-- Toggle Extend View All / View Less Button -->
                <button *ngIf="topCourses && topCourses.length > 3" 
                        (click)="showAllTopCourses = !showAllTopCourses" 
                        type="button"
                        class="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition flex items-center gap-1.5 cursor-pointer px-3.5 py-1.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 border border-indigo-100/50 dark:border-indigo-900/50">
                  <span>{{ showAllTopCourses ? (lang === 'ar' ? 'عرض أقل' : 'View Less') : (lang === 'ar' ? 'عرض الكل' : 'View All') }}</span>
                  <svg [ngClass]="{'rotate-180': showAllTopCourses}" class="w-4 h-4 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
              </div>

              <!-- Skeleton Loader while dashboard stats load -->
              <div *ngIf="isLoadingDashboard" class="space-y-4">
                <div *ngFor="let i of [1, 2, 3]" class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3 animate-pulse">
                  <div class="flex justify-between items-center">
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-14"></div>
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
                  </div>
                  <div class="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full"></div>
                  <div class="flex justify-end">
                    <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                  </div>
                </div>
              </div>

              <!-- Courses List -->
              <div class="space-y-3.5" *ngIf="!isLoadingDashboard && topCourses && topCourses.length > 0">
                <div *ngFor="let course of (showAllTopCourses ? topCourses : topCourses.slice(0, 3)); trackBy: trackById" 
                     class="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 transition-all duration-200 space-y-2.5">
                  <!-- Row 1: Percentage on left, Course Title on right -->
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">{{ course.completionPercentage }}%</span>
                    <span class="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate max-w-[75%] text-start">{{ course.title }}</span>
                  </div>

                  <!-- Row 2: Progress Track (filled with emerald gradient) -->
                  <div class="w-full bg-slate-200/80 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex justify-end">
                    <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-xs" [style.width.%]="course.completionPercentage"></div>
                  </div>

                  <!-- Row 3: Students count on right -->
                  <div class="flex items-center justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                    <span>{{ course.studentsCount }} {{ t[lang].studentsCountText }}</span>
                  </div>
                </div>
              </div>

              <!-- Empty state if no courses -->
              <div *ngIf="!isLoadingDashboard && (!topCourses || topCourses.length === 0)" class="text-center py-8 text-slate-400 dark:text-slate-500 text-sm font-medium bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                {{ lang === 'ar' ? 'لا توجد كورسات منشورة حالياً لعرضها هنا.' : 'No published courses available yet.' }}
              </div>
            </div>

            <!-- Transactions & Activity Feed Row (Req 4: Filter by Month and Year) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <!-- Recent Transactions Box -->
              <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                <div class="flex items-center justify-between mb-6 flex-wrap gap-2">
                  <h3 class="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    <span>{{ t[lang].recentTransactions }}</span>
                  </h3>
                  <div class="flex items-center gap-2 flex-wrap" *ngIf="!isLoadingDashboard">
                    <select [(ngModel)]="selectedTransactionMonth" class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="all">{{ lang === 'ar' ? 'كل الشهور' : 'All Months' }}</option>
                      <option value="1">{{ lang === 'ar' ? 'يناير' : 'Jan' }}</option>
                      <option value="2">{{ lang === 'ar' ? 'فبراير' : 'Feb' }}</option>
                      <option value="3">{{ lang === 'ar' ? 'مارس' : 'Mar' }}</option>
                      <option value="4">{{ lang === 'ar' ? 'أبريل' : 'Apr' }}</option>
                      <option value="5">{{ lang === 'ar' ? 'مايو' : 'May' }}</option>
                      <option value="6">{{ lang === 'ar' ? 'يونيو' : 'Jun' }}</option>
                      <option value="7">{{ lang === 'ar' ? 'يوليو' : 'Jul' }}</option>
                      <option value="8">{{ lang === 'ar' ? 'أغسطس' : 'Aug' }}</option>
                      <option value="9">{{ lang === 'ar' ? 'سبتمبر' : 'Sep' }}</option>
                      <option value="10">{{ lang === 'ar' ? 'أكتوبر' : 'Oct' }}</option>
                      <option value="11">{{ lang === 'ar' ? 'نوفمبر' : 'Nov' }}</option>
                      <option value="12">{{ lang === 'ar' ? 'ديسمبر' : 'Dec' }}</option>
                    </select>
                    <select [(ngModel)]="selectedTransactionYear" class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="all">{{ lang === 'ar' ? 'كل السنوات' : 'All Years' }}</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                    <button (click)="showAllTransactions = !showAllTransactions" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                       {{ showAllTransactions ? (lang === 'ar' ? 'عرض أقل' : 'View Less') : (lang === 'ar' ? 'عرض الكل' : 'View All') }}
                    </button>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto pr-2">
                  <table class="w-full text-left rtl:text-right border-collapse whitespace-nowrap">
                    <thead class="sticky top-0 bg-white dark:bg-slate-900 z-10">
                      <tr class="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th class="pb-3 font-bold">{{ t[lang].studentName }}</th>
                        <th class="pb-3 font-bold">{{ t[lang].course }}</th>
                        <th class="pb-3 font-bold">{{ t[lang].amount }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
                      <!-- Skeleton Loader for Transactions -->
                      <ng-container *ngIf="isLoadingDashboard">
                        <tr *ngFor="let i of [1,2,3,4,5]; trackBy: trackById">
                          <td class="py-4"><div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div><div class="h-2 bg-slate-100 dark:bg-slate-800 rounded w-16 mt-2 animate-pulse"></div></td>
                          <td class="py-4"><div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-32 animate-pulse"></div></td>
                          <td class="py-4"><div class="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div></td>
                        </tr>
                      </ng-container>

                      <!-- Actual Data -->
                      <ng-container *ngIf="!isLoadingDashboard">
                        <tr *ngFor="let tr of filteredRecentTransactions; trackBy: trackById" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td class="py-3 text-sm font-bold text-slate-800 dark:text-white">{{ tr.studentName }}
                            <span class="block text-[10px] text-slate-400 dark:text-slate-500">{{ tr.date | date:'MMM d, y' }}</span>
                          </td>
                          <td class="py-3 text-xs text-slate-500 dark:text-slate-400 font-medium">{{ tr.courseTitle }}</td>
                          <td class="py-3">
                            <span *ngIf="tr.amount > 0" class="text-sm font-black text-emerald-600 dark:text-emerald-400">+{{ tr.amount }} <span class="text-xs">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span></span>
                            <span *ngIf="tr.amount === 0" class="text-xs font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded-md">{{ lang === 'ar' ? 'مجاني' : 'Free' }}</span>
                          </td>
                        </tr>
                        <tr *ngIf="filteredRecentTransactions.length === 0">
                          <td colspan="3" class="py-8 text-center">
                             <div class="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2">
                               <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                             </div>
                             <p class="text-xs text-slate-400 dark:text-slate-500 font-medium">{{ lang === 'ar' ? 'لا توجد معاملات مطابقة لعوامل التصفية.' : 'No transactions found for these filters.' }}</p>
                          </td>
                        </tr>
                      </ng-container>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Activity Feed Box -->
              <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                <div class="flex items-center justify-between mb-6 flex-wrap gap-2">
                  <h3 class="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    <span>{{ t[lang].activityFeed }}</span>
                  </h3>
                  <div class="flex items-center gap-2 flex-wrap" *ngIf="!isLoadingDashboard">
                    <select [(ngModel)]="selectedActivityMonth" class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="all">{{ lang === 'ar' ? 'كل الشهور' : 'All Months' }}</option>
                      <option value="1">{{ lang === 'ar' ? 'يناير' : 'Jan' }}</option>
                      <option value="2">{{ lang === 'ar' ? 'فبراير' : 'Feb' }}</option>
                      <option value="3">{{ lang === 'ar' ? 'مارس' : 'Mar' }}</option>
                      <option value="4">{{ lang === 'ar' ? 'أبريل' : 'Apr' }}</option>
                      <option value="5">{{ lang === 'ar' ? 'مايو' : 'May' }}</option>
                      <option value="6">{{ lang === 'ar' ? 'يونيو' : 'Jun' }}</option>
                      <option value="7">{{ lang === 'ar' ? 'يوليو' : 'Jul' }}</option>
                      <option value="8">{{ lang === 'ar' ? 'أغسطس' : 'Aug' }}</option>
                      <option value="9">{{ lang === 'ar' ? 'سبتمبر' : 'Sep' }}</option>
                      <option value="10">{{ lang === 'ar' ? 'أكتوبر' : 'Oct' }}</option>
                      <option value="11">{{ lang === 'ar' ? 'نوفمبر' : 'Nov' }}</option>
                      <option value="12">{{ lang === 'ar' ? 'ديسمبر' : 'Dec' }}</option>
                    </select>
                    <select [(ngModel)]="selectedActivityYear" class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="all">{{ lang === 'ar' ? 'كل السنوات' : 'All Years' }}</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                    <button (click)="showAllActivities = !showAllActivities" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      {{ showAllActivities ? (lang === 'ar' ? 'عرض أقل' : 'View Less') : (lang === 'ar' ? 'عرض الكل' : 'View All') }}
                    </button>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto relative rtl:pr-4 ltr:pl-4 border-l-2 rtl:border-r-2 rtl:border-l-0 border-slate-100 dark:border-slate-800 space-y-6">
                  
                  <!-- Skeleton Loader for Activity Feed -->
                  <ng-container *ngIf="isLoadingDashboard">
                    <div *ngFor="let i of [1,2,3,4,5]; trackBy: trackById" class="relative flex gap-4 mt-2">
                       <div class="absolute -left-[26px] rtl:-right-[26px] rtl:left-auto top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                       <div class="flex-1 space-y-2 rtl:mr-2 ltr:ml-2">
                          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                          <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3 animate-pulse"></div>
                       </div>
                    </div>
                  </ng-container>

                  <!-- Actual Data -->
                  <ng-container *ngIf="!isLoadingDashboard">
                    <div *ngFor="let feed of filteredActivityFeed; trackBy: trackById" class="relative">
                      <div class="absolute -left-[25px] rtl:-right-[25px] rtl:left-auto top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-sm"
                           [ngClass]="{'bg-indigo-500': feed.type === 'enroll', 'bg-emerald-500': feed.type === 'quiz', 'bg-blue-500': feed.type === 'lesson'}">
                      </div>
                      <div class="rtl:mr-2 ltr:ml-2">
                        <p class="text-sm font-bold text-slate-800 dark:text-white mb-0.5 leading-snug">
                          {{ lang === 'ar' ? feed.messageAr : feed.messageEn }}
                        </p>
                        <p class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{{ formatDateTime(feed.date) }}</p>
                      </div>
                    </div>
                    
                    <div *ngIf="filteredActivityFeed.length === 0" class="py-8 text-center text-xs text-slate-400 border-0">
                       <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                         <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                       </div>
                      <p class="text-xs text-slate-400 font-medium">{{ lang === 'ar' ? 'لا يوجد نشاط مطابق لعوامل التصفية.' : 'No activity found for these filters.' }}</p>
                    </div>
                  </ng-container>

                </div>
              </div>

            </div>

          </ng-container>

          <ng-container *ngIf="activeTab === 'courses'">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white">{{ t[lang].myPublished }}</h2>
                  <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{{ t[lang].manageCourses }}</p>
                </div>
                <div class="flex items-center gap-2.5 flex-wrap">
                  <!-- + New Quiz Button (Comprehensive) -->
                  <button (click)="openComprehensiveQuizModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm text-sm flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>+ {{ t[lang].newQuizBtn }}</span>
                  </button>

                  <!-- + New Assignment Button (Comprehensive) -->
                  <button (click)="openComprehensiveAssignmentModal()" class="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-sm text-sm flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>+ {{ t[lang].newAssignmentBtn }}</span>
                  </button>

                  <!-- + New Course Button -->
                  <button (click)="openCreateCourse()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm text-sm flex items-center gap-1.5 cursor-pointer">
                    <span>+ {{ t[lang].newCourseBtn }}</span>
                  </button>
                </div>
              </div>

              <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div *ngFor="let i of [1,2,3,4]; trackBy: trackById" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-pulse flex flex-col h-[280px]">
                  <div class="h-32 bg-slate-200 dark:bg-slate-800 w-full"></div>
                  <div class="p-5 flex-1 flex flex-col gap-3">
                    <div class="h-5 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4 mb-1"></div>
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2 mb-4"></div>
                    <div class="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full mt-auto"></div>
                  </div>
                </div>
              </div>

              <div *ngIf="!isLoading && courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div *ngFor="let c of filteredCourses; trackBy: trackById" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group">
                  <div class="h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img [src]="getCoverImageUrl(c.coverImageUrl)" (error)="$any($event.target).src='assets/images/default-cover.jpg'" class="w-full h-full object-cover">
                  </div>
                  <div class="p-5 flex-1 flex flex-col">
                    <div class="flex items-center justify-between mb-2 gap-2">
                      <div class="flex items-center gap-2 flex-1 min-w-0">
                        <h3 class="font-bold text-lg text-slate-900 dark:text-white truncate" [title]="c.title">{{ c.title }}</h3>
                        <div class="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg shrink-0 border border-amber-200/50 dark:border-amber-800/50" [title]="lang === 'ar' ? 'تقييم الكورس' : 'Course Rating'">
                          <span class="text-amber-500 text-xs">★</span>
                          <span class="text-xs font-bold text-amber-700 dark:text-amber-400">{{ c.rating || '0.0' }}</span>
                        </div>
                      </div>
                      <button (click)="openEditCourseModal(c)" class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center transition shadow-sm shrink-0 border border-amber-200/50 dark:border-amber-800/50" [title]="lang === 'ar' ? 'تعديل الكورس' : 'Edit Course'">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                    </div>
                    <div class="flex items-center gap-2 mb-4">
                      <span *ngIf="c.isFree" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                        <span>{{ lang === 'ar' ? 'مجاني' : 'Free' }}</span>
                      </span>
                      <span *ngIf="!c.isFree" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                        <span>{{ lang === 'ar' ? 'مدفوع' : 'Paid' }}</span>
                        <span class="text-indigo-300 dark:text-indigo-500">•</span>
                        <ng-container *ngIf="c.discountPercentage > 0">
                          <span class="dir-ltr font-extrabold text-indigo-600 dark:text-indigo-300">{{ (c.price - (c.price * c.discountPercentage / 100)) | number:'1.0-2' }} {{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                          <span class="dir-ltr line-through text-slate-400 dark:text-slate-500 text-[11px] font-medium">{{ c.price }} {{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                        </ng-container>
                        <ng-container *ngIf="!c.discountPercentage || c.discountPercentage <= 0">
                          <span class="dir-ltr font-extrabold">{{ c.price }} {{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                        </ng-container>
                      </span>
                    </div>
                    <div class="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button (click)="onViewCourse(c)" class="flex-1 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 border border-indigo-200/50 dark:border-indigo-800/50">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>{{ t[lang].view }}</span>
                      </button>
                      <button (click)="openEnrolleesForCourse(c.id)" class="px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0" [title]="t[lang].enrollees">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>{{ t[lang].enrollees }}</span>
                      </button>
                      <button (click)="openDeleteModal(c.id)" class="px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 border border-rose-200/50 dark:border-rose-800/50 shrink-0" [title]="t[lang].deleteCourseBtn">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                        <span>{{ lang === 'ar' ? 'حذف' : 'Delete' }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div *ngIf="filteredCourses.length === 0 && courses.length > 0" class="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed p-12 text-center text-slate-500 dark:text-slate-400">{{ t[lang].noSearchResults }}</div>
              </div>

              <!-- EMPTY STATE: NO COURSES PUBLISHED -->
              <div *ngIf="courses.length === 0 && !isLoading" class="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center animate-fade-in mt-6">
                <div class="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-4 border border-indigo-200/50 dark:border-indigo-800/50">
                  <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
                <p class="text-slate-500 dark:text-slate-400 font-semibold text-lg">{{ lang === 'ar' ? 'لم تقم بنشر أي كورسات حتى الآن.' : 'No courses published yet.' }}</p>
              </div>

            </div>
          </ng-container>

          <!-- ======================================================== -->
          <!-- TAB: COURSE ENROLLEES MANAGER (Teacher - Matching Image 2) -->
          <!-- ======================================================== -->
          <ng-container *ngIf="activeTab === 'enrollees'">
            <div class="space-y-6 animate-fade-in">
              
              <!-- Header Card (Matching Image 2) -->
              <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 lg:p-8 shadow-xs">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-black text-slate-900 dark:text-white">{{ t[lang].courseEnrolleesManager }}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ t[lang].courseEnrolleesDesc }}</p>
                  </div>

                  <div class="flex items-center gap-3">
                    <select [(ngModel)]="selectedCourseIdForEnrollees" (change)="onEnrolleeCourseSelected()" 
                            class="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500">
                      <option [ngValue]="null" disabled>{{ t[lang].selectCoursePlaceholder }}</option>
                      <option *ngFor="let c of courses" [ngValue]="c.id">
                        {{ c.title }} ({{ c.studentsCount || c.enrolledStudentsCount || 0 }} {{ t[lang].studentsCountSuffix }})
                      </option>
                    </select>

                    <button *ngIf="selectedCourseIdForEnrollees" (click)="openEnrollStudentModal()" 
                            class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm text-xs flex items-center gap-1.5 shrink-0">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>{{ t[lang].enrollStudent }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Empty State: Course Not Selected -->
              <div *ngIf="!selectedCourseIdForEnrollees" class="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center text-slate-400 dark:text-slate-500 font-bold border border-slate-200/80 dark:border-slate-800">
                {{ t[lang].pleaseSelectCourse }}
              </div>

              <!-- Enrollees Table Card (Matching Image 2) -->
              <div *ngIf="selectedCourseIdForEnrollees" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h4 class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <span>{{ getSelectedEnrolleeCourseTitle() }}</span>
                  </h4>
                  <span class="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-black rounded-xl">
                    {{ courseEnrollees.length }} {{ t[lang].studentsCountSuffix }}
                  </span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
                    <thead class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th class="px-6 py-4">{{ t[lang].student }}</th>
                        <th class="px-6 py-4">{{ t[lang].email }}</th>
                        <th class="px-6 py-4">{{ t[lang].phone }}</th>
                        <th class="px-6 py-4">{{ t[lang].xpPoints }}</th>
                        <th class="px-6 py-4">{{ t[lang].enrolledAt }}</th>
                        <th class="px-6 py-4 text-center">{{ t[lang].actions }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      <tr *ngIf="isLoadingEnrollees" class="text-center">
                        <td colspan="6" class="px-6 py-12 text-slate-400 dark:text-slate-500 font-bold">
                          <span class="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin align-middle mr-2"></span>
                          {{ lang === 'ar' ? 'جاري تحميل قائمة الطلاب...' : 'Loading enrollees...' }}
                        </td>
                      </tr>
                      <tr *ngIf="!isLoadingEnrollees && courseEnrollees.length === 0" class="text-center">
                        <td colspan="6" class="px-6 py-12 text-slate-400 dark:text-slate-500 font-bold">
                          {{ t[lang].noEnrolleesForCourse }}
                        </td>
                      </tr>
                      <tr *ngFor="let en of courseEnrollees" class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-3">
                            <img [src]="en.profileImage ? (en.profileImage.startsWith('http') ? en.profileImage : 'https://qimma.runasp.net' + en.profileImage) : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + en.studentName)" 
                                 class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700 shrink-0">
                            <div>
                              <p class="font-bold text-slate-900 dark:text-white">{{ en.studentName }}</p>
                              <span class="text-[11px] text-slate-400 dark:text-slate-500 font-mono">ID: #{{ en.studentId }}</span>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{{ en.email }}</td>
                        <td class="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{{ en.phoneNumber || '—' }}</td>
                        <td class="px-6 py-4 font-bold text-amber-600 dark:text-amber-400">⚡ {{ en.totalXP || 0 }} XP</td>
                        <td class="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{{ formatDateTime(en.enrolledAt) }}</td>
                        <td class="px-6 py-4 text-center">
                          <button (click)="openUnenrollConfirm(en)" 
                                  class="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center gap-1.5 mx-auto">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            <span>{{ t[lang].unenrollBtn }}</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </ng-container>

          <ng-container *ngIf="activeTab === 'students'">
            
            <div *ngIf="studentViewMode === 'select-course'" class="animate-fade-in">
              <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white">{{ t[lang].selectCourseToView }}</h2>
                  <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{{ t[lang].selectCourseDesc }}</p>
                </div>
                <button (click)="viewAllPlatformStudents()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm text-sm flex items-center gap-2 self-start sm:self-auto transition">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>{{ lang === 'ar' ? 'عرض جميع طلابي' : 'View All My Students' }}</span>
                </button>
              </div>

              <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div *ngFor="let i of [1,2,3]; trackBy: trackById" class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse flex items-center gap-4">
                  <div class="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                  </div>
                </div>
              </div>

              <div *ngIf="!isLoading && courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div *ngFor="let c of filteredCourses; trackBy: trackById" (click)="selectCourseForStudents(c)" class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-4 group">
                  <div class="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    <img [src]="getCoverImageUrl(c.coverImageUrl)" (error)="$any($event.target).src='assets/images/default-cover.jpg'" class="w-full h-full object-cover">
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{{ c.title }}</h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ t[lang].clickToViewStudents }} →</p>
                  </div>
                </div>
              </div>

              <!-- EMPTY STATE: NO COURSES TO SELECT -->
              <div *ngIf="courses.length === 0 && !isLoading" class="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center animate-fade-in mt-6">
                <div class="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-4 border border-indigo-200/50 dark:border-indigo-800/50">
                  <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <p class="text-slate-500 dark:text-slate-400 font-semibold text-lg">
                  {{ lang === 'ar' ? 'لم تقم بنشر أي كورسات حتى الآن لعرض طلابها.' : 'You haven\'t published any courses yet to view students.' }}
                </p>
              </div>

            </div>

            <!-- VIEW ALL PLATFORM STUDENTS (Req 10) -->
            <div *ngIf="studentViewMode === 'all-platform-students'" class="animate-fade-in">
              <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div class="flex items-center gap-4">
                  <button (click)="goBackToCourseSelection()" class="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300">
                    <span class="rtl:rotate-180">←</span>
                  </button>
                  <div>
                    <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white">{{ lang === 'ar' ? 'جميع طلاب المنصة' : 'All Platform Students' }}</h2>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{{ lang === 'ar' ? 'عرض شامل لكافة الطلاب المسجلين في منصة قِمَّـة.' : 'Overview of all registered students on the Qimma platform.' }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-black rounded-xl text-sm border border-indigo-100 dark:border-indigo-900/50">
                    {{ filteredAllPlatformStudents.length }} {{ lang === 'ar' ? 'طالب' : 'Students' }}
                  </div>
                </div>
              </div>

              <!-- Search Bar -->
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 flex items-center gap-3 shadow-sm">
                <svg class="w-5 h-5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" [(ngModel)]="allStudentsSearchQuery" [placeholder]="lang === 'ar' ? 'ابحث عن طالب بالاسم، البريد أو الهاتف...' : 'Search student by name, email or phone...'" class="w-full bg-transparent focus:outline-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500">
              </div>

              <!-- Loading Skeleton -->
              <div *ngIf="isLoadingAllStudents" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div *ngFor="let i of [1,2,3,4,5,6,7,8]; trackBy: trackById" class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse flex items-center gap-4">
                  <div class="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                  </div>
                </div>
              </div>

              <!-- Students Grid -->
              <div *ngIf="!isLoadingAllStudents" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div *ngFor="let s of filteredAllPlatformStudents; trackBy: trackById" class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition flex flex-col justify-between group">
                  <div class="flex items-start gap-3.5 mb-3">
                    <img [src]="s.profileImage ? 'https://qimma.runasp.net' + s.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + s.name)" class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700 shrink-0">
                    <div class="min-w-0 flex-1">
                      <h4 class="font-extrabold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 transition-colors">{{ s.name }}</h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" *ngIf="s.email">{{ s.email }}</p>
                      <p class="text-[11px] text-slate-400 dark:text-slate-500 dir-ltr text-left rtl:text-right font-mono mt-0.5" *ngIf="s.phoneNumber">{{ s.phoneNumber }}</p>
                    </div>
                  </div>
                  <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span class="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                      <span>{{ s.enrolledCoursesCount || 0 }} {{ lang === 'ar' ? 'كورس مسجل' : 'Courses' }}</span>
                    </span>
                    <span class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{{ s.createdAt | date:'MMM y' }}</span>
                  </div>
                </div>

                <div *ngIf="filteredAllPlatformStudents.length === 0" class="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <p class="text-slate-500 dark:text-slate-400 font-bold text-sm">{{ t[lang].noSearchResults }}</p>
                </div>
              </div>
            </div>

            <div *ngIf="studentViewMode === 'select-student'" class="animate-fade-in">
              <div class="flex items-center gap-4 mb-6">
                <button (click)="goBackToCourseSelection()" class="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300">
                  <span class="rtl:rotate-180">←</span>
                </button>
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white">{{ t[lang].enrolledStudents }}</h2>
                  <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{{ t[lang].inCourse }}: <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ selectedCourse?.title }}</span></p>
                </div>
              </div>

              <div *ngIf="isLoadingStudents" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div *ngFor="let i of [1,2,3,4]; trackBy: trackById" class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse flex items-center gap-3.5">
                  <div class="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
                  </div>
                </div>
              </div>

              <div *ngIf="!isLoadingStudents" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div *ngFor="let student of filteredStudents; trackBy: trackById" (click)="selectStudentDetails(student)" class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition cursor-pointer flex items-center gap-3.5 group">
                  <img [src]="student.profileImage ? 'https://qimma.runasp.net' + student.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + student.name)" class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-100 dark:border-slate-700 shrink-0">
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 transition-colors">{{ student.name }}</p>
                    <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{{ t[lang].viewResults }}</p>
                  </div>
                </div>
                
                <div *ngIf="enrolledStudents.length === 0" class="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <p class="text-slate-500 dark:text-slate-400 font-semibold">{{ t[lang].noStudentsEnrolled }}</p>
                </div>
                <div *ngIf="filteredStudents.length === 0 && enrolledStudents.length > 0" class="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">{{ t[lang].noSearchResults }}</div>
              </div>
            </div>

            <div *ngIf="studentViewMode === 'student-details'" class="animate-fade-in">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                  <button (click)="goBackToStudentSelection()" class="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300">
                    <span class="rtl:rotate-180">←</span>
                  </button>
                  <div class="flex items-center gap-3">
                    <img [src]="selectedStudent?.profileImage ? 'https://qimma.runasp.net' + selectedStudent.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + selectedStudent?.name)" class="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 object-cover">
                    <div>
                      <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">{{ selectedStudent?.name }}</h2>
                      <p class="text-slate-500 dark:text-slate-400 text-xs mt-1">{{ selectedCourse?.title }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="isLoadingStudents" class="space-y-4 animate-pulse">
                <div *ngFor="let i of [1,2]; trackBy: trackById" class="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              </div>

              <div class="space-y-4" *ngIf="!isLoadingStudents && filteredStudentResults.length > 0">
                <div *ngFor="let group of filteredStudentResults; trackBy: trackById" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all">
                  
                  <div (click)="group.expanded = !group.expanded" class="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                    <div class="flex items-center gap-4">
                       <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                         <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                       </div>
                       <div>
                         <h3 class="font-bold text-slate-800 dark:text-white text-base">{{ group.lessonTitle }}</h3>
                         <div class="flex gap-3 mt-1">
                           <p *ngIf="group.attempts.length > 0" class="text-xs text-slate-500 dark:text-slate-400 font-semibold">{{ group.attempts.length }} {{ t[lang].attemptsText }}</p>
                           <p *ngIf="group.assignment && group.assignment.givenScore === null" class="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                             <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                             <span>{{ lang === 'ar' ? 'يحتاج للتقييم' : 'Needs Grading' }}</span>
                           </p>
                           <p *ngIf="group.assignment && group.assignment.givenScore !== null" class="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                             <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                             <span>{{ lang === 'ar' ? 'تم التقييم' : 'Graded' }}</span>
                           </p>
                         </div>
                       </div>
                    </div>
                    <button class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-transform" [ngClass]="{'rotate-180': group.expanded}">▼</button>
                  </div>
                  
                  <div *ngIf="group.expanded" class="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 animate-fade-in">
                     
                     <div *ngIf="group.attempts.length > 0" class="overflow-x-auto">
                       <h4 class="font-bold text-sm text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                         <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                         <span>{{ lang === 'ar' ? 'نتائج الاختبار (Quiz)' : 'Quiz Results' }}</span>
                       </h4>
                       <table class="w-full text-left rtl:text-right border-collapse whitespace-nowrap">
                       <thead>
                           <tr class="text-slate-500 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-800">
                             <th class="pb-3 font-bold">{{ t[lang].attemptNo }}</th>
                             <th class="pb-3 font-bold">{{ t[lang].score }}</th>
                             <th class="pb-3 font-bold">{{ t[lang].date }}</th>
                           </tr>
                         </thead>
                         <tbody>
                           <tr *ngFor="let res of group.attempts" class="border-b border-slate-100 dark:border-slate-800 last:border-0">
                             <td class="py-3 text-sm font-bold text-slate-700 dark:text-slate-300">#{{ res.attemptNumber }}</td>
                             <td class="py-3">
                               <span class="px-2.5 py-1.5 rounded-lg text-xs font-bold" [ngClass]="res.score >= (res.totalQuestions / 2) ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'">
                                 {{ res.score }} / {{ res.totalQuestions }}
                               </span>
                             </td>
                             <td class="py-3 text-sm font-medium text-slate-500 dark:text-slate-400">{{ res.date | date:'shortDate' }}</td>
                           </tr>
                         </tbody>
                       </table>
                     </div>

                     <div *ngIf="group.attempts.length === 0 && !group.assignment" class="text-sm text-slate-500 dark:text-slate-400 text-center py-4 font-medium">
                        {{ lang === 'ar' ? 'لم يقم الطالب بأي نشاط في هذا الدرس حتى الآن.' : 'No activity recorded for this lesson yet.' }}
                     </div>

                     <div *ngIf="group.assignment" class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
                          <h4 class="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                            <span>{{ lang === 'ar' ? 'حل الواجب (Assignment)' : 'Assignment Submission' }}</span>
                          </h4>
                          <span *ngIf="group.assignment.givenScore === null" class="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <span>{{ lang === 'ar' ? 'يحتاج للتقييم' : 'Needs Grading' }}</span>
                          </span>
                          <span *ngIf="group.assignment.givenScore !== null" class="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>{{ lang === 'ar' ? 'تم التقييم' : 'Graded' }}</span>
                          </span>
                        </div>
                        
                        <!-- Student Answers Summary Bar (Req 6) -->
                        <div class="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs font-bold shadow-xs">
                          <span class="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                            <span>{{ lang === 'ar' ? 'نتائج إجابات الطالب في الواجب:' : 'Student Assignment Questions Breakdown:' }}</span>
                          </span>
                          <div class="flex items-center gap-2">
                            <span class="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                              ✓ {{ getCorrectCount(group.assignment) }} {{ lang === 'ar' ? 'إجابة صحيحة' : 'Correct' }}
                            </span>
                            <span class="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 rounded-xl flex items-center gap-1 border border-rose-300 dark:border-rose-800">
                              ✕ {{ getIncorrectCount(group.assignment) }} {{ lang === 'ar' ? 'إجابة خاطئة' : 'Incorrect' }}
                            </span>
                            <span *ngIf="getEssayCount(group.assignment) > 0" class="px-3 py-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-xl flex items-center gap-1 border border-indigo-300 dark:border-indigo-800">
                              📝 {{ getEssayCount(group.assignment) }} {{ lang === 'ar' ? 'مقالي' : 'Essay' }}
                            </span>
                          </div>
                        </div>

                        <div class="space-y-4 mb-6">
                          <div *ngFor="let q of group.assignment.answers; let i = index" class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                            
                            <!-- Header with Question Number and Status Badge (Req 6) -->
                            <div class="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                              <span class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">
                                  {{ i + 1 }}
                                </span>
                                <span>{{ lang === 'ar' ? 'السؤال' : 'Question' }} {{ i + 1 }}</span>
                              </span>

                              <!-- Clear correctness badge -->
                              <div class="flex items-center gap-2">
                                <span *ngIf="q.type === 'mcq' && q.isCorrect" class="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-xs font-black rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-xs">
                                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  <span>{{ lang === 'ar' ? 'إجابة صحيحة' : 'Correct Answer' }}</span>
                                </span>

                                <span *ngIf="q.type === 'mcq' && !q.isCorrect" class="px-3 py-1 bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 text-xs font-black rounded-xl border border-rose-300 dark:border-rose-800 flex items-center gap-1.5 shadow-xs">
                                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  <span>{{ lang === 'ar' ? 'إجابة خاطئة' : 'Incorrect Answer' }}</span>
                                </span>

                                <span *ngIf="q.type !== 'mcq'" class="px-3 py-1 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 text-xs font-black rounded-xl border border-indigo-300 dark:border-indigo-800 flex items-center gap-1.5 shadow-xs">
                                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                  <span>{{ lang === 'ar' ? 'سؤال مقالي' : 'Essay Question' }}</span>
                                </span>
                              </div>
                            </div>

                            <p class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">{{ q.question }}</p>
                            
                            <!-- Student's answer box -->
                            <div class="p-4 rounded-xl border text-sm font-medium"
                                 [ngClass]="q.type === 'mcq' ? (q.isCorrect ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200') : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200'">
                              <span class="text-xs font-bold block mb-1" [ngClass]="q.type === 'mcq' ? (q.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400') : 'text-slate-500 dark:text-slate-400'">
                                {{ lang === 'ar' ? 'إجابة الطالب:' : "Student's Answer:" }}
                              </span>
                              {{ q.answer || (lang === 'ar' ? '(لم تتم الإجابة)' : '(No answer provided)') }}
                            </div>

                            <!-- Model answer for MCQ questions -->
                            <div *ngIf="q.type === 'mcq' && q.correctAnswer" class="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                              <div class="flex items-center gap-2">
                                <span class="text-slate-500 dark:text-slate-400">{{ lang === 'ar' ? 'الإجابة النموذجية المحددة بالسؤال:' : 'Expected Model Answer:' }}</span>
                                <span class="text-indigo-600 dark:text-indigo-400 font-black">{{ q.correctAnswer }}</span>
                              </div>
                              <span *ngIf="q.isCorrect" class="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                                ✓ {{ lang === 'ar' ? 'تطابقت الإجابة' : 'Answer Matched' }}
                              </span>
                              <span *ngIf="!q.isCorrect" class="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1">
                                ✕ {{ lang === 'ar' ? 'لم تتطابق الإجابة' : 'Answer Mismatched' }}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 lg:px-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 hidden sm:block">{{ lang === 'ar' ? 'التقييم النهائي للواجب المقالي:' : 'Final Assignment Grade:' }}</p>
                          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <div class="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner">
                              <span class="px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border-l border-slate-200 dark:border-slate-700">{{ lang === 'ar' ? 'الدرجة:' : 'Score:' }}</span>
                              <input type="number" min="0" [max]="group.assignment.totalScore" [(ngModel)]="group.assignment.givenScore" placeholder="-" class="w-16 px-2 py-2 bg-white dark:bg-slate-900 focus:outline-none text-center font-black text-indigo-600 dark:text-indigo-400">
                              <span class="px-3 py-2 text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">/ {{ group.assignment.totalScore }}</span>
                            </div>
                            <button (click)="saveAssignmentGrade(group.assignment)" [disabled]="isSaving" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition shadow-md shadow-emerald-200 dark:shadow-none flex items-center gap-2 disabled:opacity-50">
                              <svg *ngIf="!isSaving" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                              <svg *ngIf="isSaving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle></svg>
                              <span>{{ isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ' : 'Save') }}</span>
                            </button>
                          </div>
                        </div>
                     </div>

                  </div>
                </div>
              </div>
              
              <div *ngIf="!isLoadingStudents && filteredStudentResults.length === 0" class="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                {{ t[lang].noSearchResults }}
              </div>
            </div>
          </ng-container>

          <!-- ================= LIVE SESSIONS TAB (Req 6b) ================= -->
          <ng-container *ngIf="activeTab === 'live'">
            <div class="space-y-8 animate-fade-in">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <svg class="w-6 h-6 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    <span>{{ t[lang].liveSessions }}</span>
                  </h2>
                  <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{{ lang === 'ar' ? 'اختر الكورس المستهدف لبدء البث المباشر وإشعار الطلاب المشتركين فورياً.' : 'Select a course to broadcast a live session and instantly notify enrolled students.' }}</p>
                </div>

                <div *ngIf="isLiveActive" class="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center gap-2 font-bold text-xs animate-pulse">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>{{ lang === 'ar' ? 'البث المباشر قيد التشغيل حالياً' : 'Live Session is currently ACTIVE' }}</span>
                </div>
              </div>

              <!-- Course Selection for Live -->
              <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 class="font-bold text-base text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  <span>{{ lang === 'ar' ? '1. اختر الكورس لبدء الجلسة:' : '1. Select Course for the Session:' }}</span>
                </h3>

                <div *ngIf="courses.length === 0" class="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  {{ lang === 'ar' ? 'لم تقم بنشر أي كورسات حتى الآن.' : 'No courses published yet.' }}
                </div>

                <div *ngIf="courses.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div *ngFor="let c of courses; trackBy: trackById"
                       (click)="selectCourseForLiveSession(c)"
                       [ngClass]="selectedCourseForLive?.id === c.id ? 'border-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-600/20' : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'"
                       class="p-4 rounded-2xl cursor-pointer transition flex items-center gap-3.5 group">
                    <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      <img [src]="getCoverImageUrl(c.coverImageUrl)" (error)="$any($event.target).src='assets/images/default-cover.jpg'" class="w-full h-full object-cover">
                    </div>
                    <div class="min-w-0 flex-1">
                      <h4 class="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ c.title }}</h4>
                      <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ lang === 'ar' ? 'اضغط لتحديد الكورس' : 'Click to select' }}</p>
                    </div>
                    <div *ngIf="selectedCourseForLive?.id === c.id" class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </div>
                  </div>
                </div>
              </div>

              <!-- Selected Course Live Session Panel -->
              <div *ngIf="selectedCourseForLive" class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                <!-- Left: Broadcast Controls -->
                <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                      <div>
                        <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{{ lang === 'ar' ? 'الكورس المحدد' : 'Selected Course' }}</span>
                        <h3 class="text-xl font-black text-slate-900 dark:text-white mt-1">{{ selectedCourseForLive.title }}</h3>
                      </div>
                      <span class="px-3 py-1 rounded-full text-xs font-bold"
                            [ngClass]="isLiveActive ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'">
                        {{ isLiveActive ? (lang === 'ar' ? 'مباشر الآن' : 'Live Now') : (lang === 'ar' ? 'غير نشط' : 'Idle') }}
                      </span>
                    </div>

                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          {{ lang === 'ar' ? 'رابط الاجتماع (Google Meet / Zoom / Microsoft Teams):' : 'Meeting Link (Google Meet / Zoom / Microsoft Teams):' }}
                        </label>
                        <div class="relative">
                          <span class="absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400 dark:text-slate-500">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                          </span>
                          <input type="url" [(ngModel)]="meetUrlInput"
                                 [disabled]="isLiveActive"
                                 placeholder="https://meet.google.com/xyz-abcd-efg"
                                 class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left">
                        </div>
                      </div>

                      <div class="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3">
                        <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        <p class="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                          {{ lang === 'ar' ? 'بمجرد الضغط على "بدء البث المباشر"، سيتم إرسال إشعار فوري لجميع الطلاب المشتركين في هذا الكورس، وسيظهر شريط البث المباشر في لوحات تحكمهم مع زر للانضمام فوراً.' : 'Once you click "Start Live Session", an instant notification will be delivered to all students enrolled in this course, and a live banner with a Join button will activate on their dashboard.' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 mt-6">
                    <button *ngIf="!isLiveActive" (click)="startLiveSession()" [disabled]="!meetUrlInput"
                            class="flex-1 py-3.5 px-6 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                      <span>{{ lang === 'ar' ? 'بدء البث المباشر وإشعار الطلاب' : 'Start Live & Broadcast Link' }}</span>
                    </button>

                    <button *ngIf="isLiveActive" (click)="openActiveMeeting()"
                            class="flex-1 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      <span>{{ lang === 'ar' ? 'فتح رابط الاجتماع كمعلم' : 'Open Meeting as Host' }}</span>
                    </button>

                    <button *ngIf="isLiveActive" (click)="endLiveSession()"
                            class="py-3.5 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition flex items-center justify-center gap-2">
                      <span>{{ lang === 'ar' ? 'إنهاء البث المباشر' : 'End Live Session' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Right: Enrolled Students in Selected Course -->
                <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col max-h-[550px]">
                  <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <h4 class="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <span>{{ lang === 'ar' ? 'الطلاب المشتركون' : 'Enrolled Students' }}</span>
                    </h4>
                    <span class="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-black rounded-lg">
                      {{ enrolledStudentsForLive.length }}
                    </span>
                  </div>

                  <div *ngIf="isLoadingStudentsForLive" class="space-y-3">
                    <div *ngFor="let i of [1,2,3,4]; trackBy: trackById" class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      <div class="flex-1 space-y-1.5">
                        <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="!isLoadingStudentsForLive" class="flex-1 overflow-y-auto space-y-2 pr-1">
                    <div *ngFor="let student of enrolledStudentsForLive; trackBy: trackById" class="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-3">
                      <img [src]="student.profileImage ? 'https://qimma.runasp.net' + student.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + student.name)" class="w-10 h-10 rounded-full bg-white dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700 shrink-0">
                      <div class="min-w-0 flex-1">
                        <p class="font-bold text-slate-800 dark:text-white text-xs truncate">{{ student.name }}</p>
                        <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{{ lang === 'ar' ? 'مؤهل لتلقي البث' : 'Eligible for session' }}</span>
                        </p>
                      </div>
                    </div>

                    <div *ngIf="enrolledStudentsForLive.length === 0" class="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                      <svg class="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <span>{{ lang === 'ar' ? 'لا يوجد طلاب مشتركون في هذا الكورس بعد.' : 'No students enrolled in this course yet.' }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </ng-container>

          <!-- ================= SCHEDULE TAB (Req 5) ================= -->
          <ng-container *ngIf="activeTab === 'schedule'">
            <div class="space-y-6 animate-fade-in">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>{{ t[lang].schedule }}</span>
                  </h2>
                  <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{{ lang === 'ar' ? 'جدول المواعيد والجلسات المباشرة ومواعيد تسليم الواجبات.' : 'Manage your upcoming lectures, live sessions, and assignment deadlines.' }}</p>
                </div>

                <button (click)="openCreateEvent()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm text-sm flex items-center gap-2 self-start sm:self-auto">
                  <span>+</span>
                  <span>{{ lang === 'ar' ? 'إضافة موعد جديد' : 'New Event' }}</span>
                </button>
              </div>

              <!-- Calendar Container Card -->
              <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
                
                <!-- Calendar Controls Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div class="flex items-center gap-3">
                    <h3 class="text-xl font-black text-slate-900 dark:text-white min-w-[150px]">
                      {{ getMonthYearTitle() }}
                    </h3>
                    <div class="flex items-center gap-1.5">
                      <button (click)="prevCalendar()" class="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold transition shadow-sm">
                        <span class="rtl:rotate-180">‹</span>
                      </button>
                      <button (click)="goToToday()" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition">
                        {{ lang === 'ar' ? 'اليوم' : 'Today' }}
                      </button>
                      <button (click)="nextCalendar()" class="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold transition shadow-sm">
                        <span class="rtl:rotate-180">›</span>
                      </button>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <div class="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                      <button (click)="calendarView = 'week'"
                              [ngClass]="calendarView === 'week' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-black' : 'text-slate-500 dark:text-slate-400 font-bold hover:text-slate-950 dark:hover:text-white'"
                              class="px-4 py-1.5 rounded-lg text-xs transition">
                        {{ lang === 'ar' ? 'أسبوعي' : 'Week' }}
                      </button>
                      <button (click)="calendarView = 'month'"
                              [ngClass]="calendarView === 'month' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-black' : 'text-slate-500 dark:text-slate-400 font-bold hover:text-slate-950 dark:hover:text-white'"
                              class="px-4 py-1.5 rounded-lg text-xs transition">
                        {{ lang === 'ar' ? 'شهري' : 'Month' }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Day Cards Horizontal Pills Row (Mockup Style) -->
                <div class="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  <div class="w-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>

                  <div *ngFor="let day of weekDays; trackBy: trackById"
                       (click)="selectCalendarDay(day.date)"
                       [ngClass]="day.isSelected ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-900' : (day.isToday ? 'bg-indigo-50 dark:bg-indigo-950/50 border-2 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm' : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800')"
                       class="flex-1 min-w-[70px] h-14 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none shrink-0 relative">
                    <span class="text-[11px] font-semibold" [ngClass]="day.isSelected ? 'text-indigo-100' : (day.isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500')">{{ day.dayName }}</span>
                    <span class="text-base font-black mt-0.5 leading-none" [ngClass]="day.isSelected ? 'text-white' : (day.isToday ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200')">{{ day.dayNumber }}</span>
                    <div *ngIf="day.hasEvents" class="w-1.5 h-1.5 rounded-full absolute bottom-1.5" [ngClass]="day.isSelected ? 'bg-emerald-300' : 'bg-indigo-600'"></div>
                  </div>
                </div>

                <!-- Main Calendar Board -->
                <div *ngIf="isLoading" class="py-12 animate-pulse space-y-4">
                  <div *ngFor="let i of [1,2,3]; trackBy: trackById" class="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                </div>

                <div *ngIf="!isLoading">
                  <!-- WEEK VIEW: Pastel Event Cards matching mockup -->
                  <div *ngIf="calendarView === 'week'" class="space-y-4 pt-2">
                    <div class="flex items-center justify-between">
                      <h3 class="font-extrabold text-sm text-slate-700 dark:text-slate-200">
                        {{ selectedDate | date:'EEEE, d MMMM y' }}
                      </h3>
                      <span class="text-xs font-bold text-slate-400 dark:text-slate-500">
                        {{ filteredCalendarEvents.length }} {{ lang === 'ar' ? 'مواعيد' : 'events' }}
                      </span>
                    </div>

                    <div *ngIf="filteredCalendarEvents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div *ngFor="let ev of filteredCalendarEvents; trackBy: trackById"
                           [ngClass]="{
                              'bg-blue-50/70 border-blue-200 text-blue-950 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-100': ev.eventType === 'Live',
                              'bg-amber-50/70 border-amber-200 text-amber-950 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-100': ev.eventType === 'Deadline',
                              'bg-purple-50/70 border-purple-200 text-purple-950 dark:bg-purple-950/30 dark:border-purple-900/50 dark:text-purple-100': ev.eventType === 'General'
                           }"
                           class="rounded-3xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between relative group">
                        
                        <div>
                          <div class="flex items-center justify-between mb-3">
                            <span [ngClass]="{
                                    'bg-blue-600 text-white': ev.eventType === 'Live',
                                    'bg-amber-500 text-white': ev.eventType === 'Deadline',
                                    'bg-purple-600 text-white': ev.eventType === 'General'
                                  }"
                                  class="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                              {{ ev.eventType === 'Live' ? (lang === 'ar' ? 'بث مباشر' : 'Live Session') : (ev.eventType === 'Deadline' ? (lang === 'ar' ? 'موعد تسليم' : 'Deadline') : (lang === 'ar' ? 'حدث عام' : 'General')) }}
                            </span>
                            <span class="text-xs font-bold opacity-75 dir-ltr">
                              {{ ev.eventDate | date:'h:mm a' }}
                            </span>
                          </div>

                          <h4 class="font-black text-base mb-1 break-words line-clamp-2">{{ ev.title }}</h4>
                          <p class="text-xs opacity-75 font-semibold mb-2">{{ ev.courseTitle }}</p>
                          <p *ngIf="ev.description" class="text-xs opacity-80 line-clamp-2 mt-2 leading-relaxed">{{ ev.description }}</p>
                        </div>

                        <div class="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end">
                          <button (click)="deleteEvent(ev.id)" class="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition shadow-sm" [title]="lang === 'ar' ? 'حذف الموعد' : 'Delete Event'">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div *ngIf="filteredCalendarEvents.length === 0" class="py-16 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                      <div class="w-12 h-12 rounded-2xl bg-slate-200/70 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      </div>
                      <p class="text-slate-500 dark:text-slate-400 font-bold text-sm">{{ lang === 'ar' ? 'لا توجد مواعيد أو أحداث مجدولة في هذا اليوم.' : 'No events scheduled for this day.' }}</p>
                    </div>
                  </div>

                  <!-- MONTH VIEW GRID -->
                  <div *ngIf="calendarView === 'month'" class="pt-2">
                    <div class="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                      <div>{{ lang === 'ar' ? 'أحد' : 'Sun' }}</div>
                      <div>{{ lang === 'ar' ? 'إثنين' : 'Mon' }}</div>
                      <div>{{ lang === 'ar' ? 'ثلاثاء' : 'Tue' }}</div>
                      <div>{{ lang === 'ar' ? 'أربعاء' : 'Wed' }}</div>
                      <div>{{ lang === 'ar' ? 'خميس' : 'Thu' }}</div>
                      <div>{{ lang === 'ar' ? 'جمعة' : 'Fri' }}</div>
                      <div>{{ lang === 'ar' ? 'سبت' : 'Sat' }}</div>
                    </div>

                    <div class="grid grid-cols-7 gap-2">
                      <ng-container *ngFor="let mDay of monthDays; trackBy: trackById">
                        <div *ngIf="mDay.empty" class="h-20 rounded-2xl bg-slate-50/40 dark:bg-slate-800/20"></div>
                        <div *ngIf="!mDay.empty"
                             (click)="selectCalendarDay(mDay.date)"
                             [ngClass]="mDay.isSelected ? 'border-2 border-indigo-600 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800 shadow-sm' : 'border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'"
                             class="h-20 rounded-2xl p-2 cursor-pointer transition flex flex-col justify-between">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-black" [ngClass]="mDay.isToday ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs' : 'text-slate-700 dark:text-slate-200'">
                              {{ mDay.dayNumber }}
                            </span>
                            <span *ngIf="mDay.eventsCount > 0" class="w-2 h-2 rounded-full bg-emerald-500"></span>
                          </div>
                          <div *ngIf="mDay.eventsCount > 0" class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                            {{ mDay.eventsCount }} {{ lang === 'ar' ? 'حدث' : 'event(s)' }}
                          </div>
                        </div>
                      </ng-container>
                    </div>

                    <!-- SELECTED DAY EVENTS IN MONTH VIEW -->
                    <div class="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
                      <div class="flex items-center justify-between mb-4">
                        <h3 class="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>📅</span>
                          <span>{{ selectedDate | date:'EEEE, d MMMM y' }}</span>
                        </h3>
                        <span class="text-xs font-bold text-slate-400 dark:text-slate-500">
                          {{ selectedDayEvents.length }} {{ lang === 'ar' ? 'مواعيد' : 'events' }}
                        </span>
                      </div>

                      <div *ngIf="selectedDayEvents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div *ngFor="let ev of selectedDayEvents; trackBy: trackById"
                             [ngClass]="{
                                'bg-blue-50/70 border-blue-200 text-blue-950 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-100': ev.eventType === 'Live',
                                'bg-amber-50/70 border-amber-200 text-amber-950 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-100': ev.eventType === 'Deadline',
                                'bg-purple-50/70 border-purple-200 text-purple-950 dark:bg-purple-950/30 dark:border-purple-900/50 dark:text-purple-100': ev.eventType !== 'Live' && ev.eventType !== 'Deadline'
                             }"
                             class="rounded-3xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between relative group">
                          
                          <div>
                            <div class="flex items-center justify-between mb-3">
                              <span [ngClass]="{
                                      'bg-blue-600 text-white': ev.eventType === 'Live',
                                      'bg-amber-500 text-white': ev.eventType === 'Deadline',
                                      'bg-purple-600 text-white': ev.eventType !== 'Live' && ev.eventType !== 'Deadline'
                                    }"
                                    class="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                {{ ev.eventType === 'Live' ? (lang === 'ar' ? 'بث مباشر' : 'Live Session') : (ev.eventType === 'Deadline' ? (lang === 'ar' ? 'موعد تسليم' : 'Deadline') : ev.eventType) }}
                              </span>
                              <span class="text-xs font-bold opacity-75 dir-ltr">
                                {{ ev.eventDate | date:'h:mm a' }}
                              </span>
                            </div>

                            <h4 class="font-black text-base mb-1 break-words line-clamp-2">{{ ev.title }}</h4>
                            <p class="text-xs opacity-75 font-semibold mb-2">{{ ev.courseTitle }}</p>
                            <p *ngIf="ev.description" class="text-xs opacity-80 line-clamp-2 mt-2 leading-relaxed">{{ ev.description }}</p>
                          </div>

                          <div class="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end">
                            <button (click)="deleteEvent(ev.id)" class="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition shadow-sm" [title]="lang === 'ar' ? 'حذف الموعد' : 'Delete Event'">
                              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div *ngIf="selectedDayEvents.length === 0" class="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div class="w-12 h-12 rounded-2xl bg-slate-200/70 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <p class="text-slate-500 dark:text-slate-400 font-bold text-sm">{{ lang === 'ar' ? 'لا توجد مواعيد أو أحداث مجدولة في هذا اليوم.' : 'No events scheduled for this day.' }}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </ng-container>

          <!-- ================= HELP & SUPPORT TAB (Req 6a) ================= -->
          <ng-container *ngIf="activeTab === 'support'">
            <div class="space-y-8 animate-fade-in max-w-5xl mx-auto">
              
              <!-- Hero Banner -->
              <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#130E35] via-indigo-900 to-indigo-800 p-8 lg:p-10 text-white shadow-xl">
                <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div class="relative z-10 max-w-2xl">
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 mb-4 border border-white/10">
                    <svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span>{{ lang === 'ar' ? 'فريق الدعم متواجد لخدمتكم' : 'Support team ready to assist you' }}</span>
                  </span>
                  <h1 class="text-3xl lg:text-4xl font-black mb-3 text-white">
                    {{ lang === 'ar' ? 'مركز المساعدة والدعم الفني' : 'Help & Support Center' }}
                  </h1>
                  <p class="text-indigo-200 text-sm lg:text-base leading-relaxed">
                    {{ lang === 'ar' ? 'نحن هنا لنضمن لك تجربة تعليمية متميزة وسلسة. سواء كان لديك استفسار حول الكورسات، مواعيد البث المباشر، تسليم الواجبات، أو واجهت أي عائق تقني، تواصل معنا مباشرة وسنقوم بالرد عليك في أسرع وقت.' : 'We are here to ensure a seamless and exceptional learning experience. Whether you have questions regarding courses, live sessions, assignments, or any technical issues, reach out to us and we will assist you immediately.' }}
                  </p>
                </div>
              </div>

              <!-- Contact Cards Row -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <!-- Phone Support Card -->
                <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </div>
                    <h3 class="font-extrabold text-lg text-slate-900 dark:text-white mb-1">{{ lang === 'ar' ? 'الاتصال الهاتفي المباشر' : 'Direct Phone Support' }}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">{{ lang === 'ar' ? 'للتواصل العاجل مع المشرف الأكاديمي' : 'Urgent queries with platform staff' }}</p>
                    <p class="text-xl font-black text-indigo-600 dark:text-indigo-400 dir-ltr text-left rtl:text-right font-mono mb-4">01020653195</p>
                  </div>
                  <a href="tel:01020653195" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center text-xs font-bold transition shadow-sm block">
                    {{ lang === 'ar' ? 'اتصل الآن' : 'Call Now' }}
                  </a>
                </div>

                <!-- WhatsApp Support Card -->
                <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </div>
                    <h3 class="font-extrabold text-lg text-slate-900 dark:text-white mb-1">{{ lang === 'ar' ? 'محادثة واتساب الفورية' : 'Instant WhatsApp' }}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">{{ lang === 'ar' ? 'إرسال لقطات شاشة واستفسارات تقنية' : 'Send screenshots and technical tickets' }}</p>
                    <p class="text-xl font-black text-emerald-600 dark:text-emerald-400 dir-ltr text-left rtl:text-right font-mono mb-4">01020653195</p>
                  </div>
                  <a href="https://wa.me/201020653195" target="_blank" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center text-xs font-bold transition shadow-sm block">
                    {{ lang === 'ar' ? 'محادثة عبر واتساب' : 'Chat on WhatsApp' }}
                  </a>
                </div>

                <!-- Working Hours Card -->
                <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <h3 class="font-extrabold text-lg text-slate-900 dark:text-white mb-1">{{ lang === 'ar' ? 'مواعيد العمل والدعم' : 'Support Working Hours' }}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">{{ lang === 'ar' ? 'ساعات تواجد المشرفين للرد والمساعدة' : 'Availability for instructor assistance' }}</p>
                    <p class="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed mb-4">
                      {{ lang === 'ar' ? 'يومياً من 9:00 صباحاً حتى 11:00 مساءً بتوقيت القاهرة' : 'Daily from 9:00 AM to 11:00 PM (Cairo Time)' }}
                    </p>
                  </div>
                  <div class="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-center text-xs font-bold">
                    {{ lang === 'ar' ? 'طوال أيام الأسبوع' : '7 Days a Week' }}
                  </div>
                </div>
              </div>

              <!-- Instructor FAQ Section -->
              <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <h3 class="font-extrabold text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>{{ lang === 'ar' ? 'الأسئلة الشائعة للمعلمين' : 'Instructor Frequently Asked Questions' }}</span>
                </h3>
                <div class="space-y-4">
                  <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-2">{{ lang === 'ar' ? 'كيف يتم احتساب نسبة المنصة (10%) وصرف الأرباح؟' : 'How does the 10% platform deduction and payout work?' }}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{{ lang === 'ar' ? 'تخصم المنصة 10% فقط لتغطية خوادم الاستضافة، البث المباشر، وتكاليف بوابات الدفع الإلكتروني. يتم تحويل صافي أرباحك (90%) دورياً عبر فودافون كاش، إنستاباي، أو التحويل البنكي.' : 'The platform deducts only 10% to cover cloud hosting, video streaming, and secure payment gateway processing. Net profits (90%) are disbursed periodically via Vodafone Cash, InstaPay, or direct bank transfer.' }}</p>
                  </div>
                  <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-2">{{ lang === 'ar' ? 'كيف أقوم ببث جلسة مباشرة لطلابي عبر Google Meet أو Zoom؟' : 'How do I broadcast live sessions via Google Meet or Zoom?' }}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{{ lang === 'ar' ? 'من القائمة الجانبية، اختر تبويب "البث المباشر"، ثم حدد الكورس وأدخل رابط الاجتماع واضغط "بدء البث المباشر". سيتلقى جميع الطلاب المشتركين إشعاراً فورياً ورابط الانضمام.' : 'From the sidebar, open the "Live Sessions" tab, select your course, paste the meeting URL, and click "Start Live & Broadcast Link". All enrolled students will receive an instant notification with the direct join link.' }}</p>
                  </div>
                  <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-2">{{ lang === 'ar' ? 'كيف يتم تصحيح الواجبات المقالية والاختبارات التلقائية؟' : 'How are MCQ quizzes and manual assignments graded?' }}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{{ lang === 'ar' ? 'يتم تصحيح أسئلة الاختيار من متعدد تلقائياً ومنح النقاط للطلاب، بينما تظهر الأسئلة المقالية تحت تبويب "الطلاب" داخل ملف كل طالب مع حقل لوضع الدرجة وحفظها بنقرة واحدة.' : 'Multiple-choice questions are auto-graded and reward XP automatically. Essay assignments appear under the "Students" tab inside each student profile for manual score entry and saving.' }}</p>
                  </div>
                </div>
              </div>

            </div>
          </ng-container>

        </main>
      </div>
    </div>
  `
})
export class TeacherDashboardComponent implements OnInit {
  activeTab: string = 'dashboard';
  studentViewMode: string = 'select-course';
  isSidebarCollapsed: boolean = false;
  isMobileSidebarOpen: boolean = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  showCreateForm = false;
  showEventForm = false;

  showAssignmentModal = false;
  assignmentData = { courseId: null, title: '', dueDate: '', questions: [''] };

  showEditCourseModal = false;
  selectedCourseToEdit: any = null;
  editCourseForm: FormGroup;
  editCourseImagePreview: string | ArrayBuffer | null = null;
  editCourseError: string | null = null;

  imagePreview: string | ArrayBuffer | null = null;
  createCourseError: string | null = null;
  courseForm: FormGroup;
  eventForm: FormGroup;
  eventFormError: string | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';
  showDeleteModal = false;
  courseToDeleteId: number | null = null;
  
  // Course Enrollees Management
  selectedCourseIdForEnrollees: number | null = null;
  courseEnrollees: any[] = [];
  availablePlatformStudents: any[] = [];
  isLoadingEnrollees = false;
  isLoadingAvailableStudents = false;
  showEnrollModal = false;
  studentIdToEnroll: number | null = null;
  isSubmittingEnroll = false;
  showUnenrollModal = false;
  enrolleeToUnenroll: any = null;
  
  isLoading = true;
  isLoadingDashboard = true; 
  isLoadingTopMetrics = true;
  isLoadingStudents = false;
  
  searchQuery: string = '';
  minDate: string = '';

  showSettingsModal = false;
  showUnsavedModal = false;
  isSaving = false;

  editProfileData: any = { fullName: '', email: '', phone: '', countryCode: '+20', bio: '', profileImage: '', specialization: '', coverImage: '' };
  originalProfileData: string = '';

  courses: any[] = [];
  events: any[] = [];
  userData: any = null;

  selectedCourse: any = null;
  selectedStudent: any = null;
  enrolledStudents: any[] = [];
  
  totalStudentsCount: number = 0;
  totalQuizzesCount: number = 0;
  totalLessonsCount: number = 0;

  totalRevenue: number = 0;
  monthlyRevenue: number = 0;
  studentGrowth: number = 0;
  instructorRating: number = 0;
  recentTransactions: any[] = [];
  activityFeed: any[] = [];
  topCourses: any[] = [];
  showAllTopCourses: boolean = false;
  isCourseDropdownOpen: boolean = false;

  showAllTransactions = false;
  showAllActivities = false;
  
  selectedTransactionMonth: string = 'all';
  selectedTransactionYear: string = 'all';
  selectedActivityMonth: string = 'all';
  selectedActivityYear: string = 'all';
  selectedChartTimeframe: string = '7days';

  allPlatformStudents: any[] = [];
  isLoadingAllStudents: boolean = false;
  allStudentsSearchQuery: string = '';

  groupedStudentResults: any[] = [];

  selectedCourseForLive: any = null;
  meetUrlInput: string = '';
  isLiveActive: boolean = false;
  activeLiveTitle: string = '';
  enrolledStudentsForLive: any[] = [];
  isLoadingStudentsForLive: boolean = false;

  selectedDate: Date = new Date();
  currentCalendarMonth: Date = new Date();
  calendarView: 'week' | 'month' = 'week';
  calendarSearch: string = '';

  notifications: any[] = [];
  unreadCount: number = 0;
  showNotificationsDropdown: boolean = false;

  showCropModal = false;
  cropType: 'avatar' | 'cover' | 'courseCover' | 'editCourseCover' = 'avatar';
  cropContainerWidth = 300;
  cropContainerHeight = 300;
  cropImageSrc: string | null = null;
  zoom = 1;
  panX = 0;
  panY = 0;
  isDragging = false;
  startX = 0;
  startY = 0;
  baseImageW = 0;
  baseImageH = 0;
  isUploadingImage = false;

  public chart: any;

  lang: 'en' | 'ar' = 'en';
  countries = [
    { code: '+20', flag: '🇪🇬', name: 'Egypt' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' }
  ];

  selectedChartDate: string = '';
  distributionChart: any = null;

  get paidCoursesCount(): number {
    return this.courses.filter(c => !c.isFree && c.price > 0).length;
  }
  get freeCoursesCount(): number {
    return this.courses.filter(c => c.isFree || !c.price || c.price === 0).length;
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'dashboard': return this.lang === 'ar' ? 'لوحة التحكم الرئيسية' : 'Instructor Overview';
      case 'courses': return this.lang === 'ar' ? 'إدارة الكورسات' : 'Courses Management';
      case 'students': return this.lang === 'ar' ? 'الطلاب المشتركون' : 'Enrolled Students';
      case 'live': return this.lang === 'ar' ? 'الجلسات المباشرة' : 'Live Sessions';
      case 'schedule': return this.lang === 'ar' ? 'الجدول والمواعيد' : 'Class Schedule';
      case 'support': return this.lang === 'ar' ? 'الدعم والمساعدة' : 'Support & Help';
      case 'settings': return this.lang === 'ar' ? 'إعدادات الحساب' : 'Account Settings';
      default: return this.lang === 'ar' ? 'لوحة المعلم' : 'Instructor Dashboard';
    }
  }

  t = {
    en: {
      brand: 'Qimma', menu: 'Main', dashboard: 'Dashboard', myCourses: 'My Courses',
      students: 'Students', schedule: 'Schedule', account: 'Account', accountSettings: 'Account Settings',
      logout: 'Log out', totalStudents: 'Total Students', activeCourses: 'Active Courses',
      totalQuizzes: 'Total Quizzes', totalLessons: 'Total Lessons',
      revenue: 'Total Revenue / XP', createCourse: 'Create New Course', fillDetails: 'Fill in the course details below.',
      courseTitle: 'Course Title', desc: 'Description', uploadCover: 'Course Cover Image', clickToUpload: 'Click to upload image',
      courseType: 'Course Type', freeCourse: 'Free', paidCourse: 'Paid',
      price: 'Monthly Price', discount: 'Discount %',
      changeImage: 'Change Image', publishBtn: 'Publish Course', myPublished: 'My Published Courses',
      noCourses: 'No courses published yet.', successMsg: 'Action completed successfully!',
      errorMsg: 'Error processing request.', welcome: 'Welcome back', streak: 'Keep up the great work!',
      teacher: 'Teacher', manageCourses: 'Manage your active courses and content.', newCourseBtn: 'New Course',
      view: 'View', deleteCourseBtn: 'Delete Course', cancel: 'Cancel', viewAll: 'View All', liveSessions: 'Live Sessions',
      newSession: 'New', startSession: 'Start Session', deleteConfirmTitle: 'Delete Course',
      deleteConfirmDesc: 'Are you sure you want to delete this entire course? This action cannot be undone.',
      confirmDeleteBtn: 'Yes, Delete', deleteSuccessMsg: 'Course deleted successfully!',
      selectCourseToView: 'Select a Course', selectCourseDesc: 'Choose a course to view its enrolled students and their quiz results.',
      clickToViewStudents: 'View Enrolled Students', enrolledStudents: 'Enrolled Students', inCourse: 'In Course',
      noStudentsEnrolled: 'No students have enrolled in this course yet.',
      viewResults: 'View Quiz Results', noStudentsFound: 'No students enrolled in this course yet.',
      lessonTitle: 'Lesson', attemptNo: 'Attempt', score: 'Score', date: 'Date', noSearchResults: 'No matching results found.',
      attemptsText: 'Attempts', specialization: 'Specialization', specPlaceholder: 'e.g. Arabic Teacher',
      change: 'Change', fullName: 'Full Name', email: 'Email Address', emailCantChange: "Email cannot be changed.",
      phone: 'Phone Number', bio: 'Bio / About me', bioPlaceholder: 'Write a short bio about yourself...',
      saveBtn: 'Save Changes', saving: 'Saving...',
      securitySectionTitle: 'Security & Access Credentials',
      securitySectionDesc: 'Optionally update your password. Leave empty if you do not want to change it.',
      resetPasswordOptional: 'New Password (Optional)',
      leaveBlankIfSame: 'Leave empty if you do not want to change it',
      unsavedTitle: 'Unsaved Changes', unsavedDesc: 'You have modified your profile. Are you sure you want to discard these changes without saving?',
      stayBtn: 'No, stay here', discardBtn: 'Yes, discard', liveNow: 'Live Now',
      notificationsTitle: 'Notifications', unreadText: 'unread', noNotifications: 'No new notifications',
      addEvent: 'New Event', totalRevenue: 'Total Revenue', thisMonth: 'this month',
      studentGrowth: 'Student Growth', increaseLastMonth: 'Increase from last month',
      instructorRating: 'Instructor Rating', recentTransactions: 'Recent Transactions',
      studentName: 'Student Name', course: 'Course', amount: 'Amount', activityFeed: 'Activity Feed',
      support: 'Help & Support',
      yourTopCourses: 'Your Top Courses',
      viewAllCourses: 'View all',
      studentsCountText: 'students',
      instructorPanel: 'Instructor Panel',
      systemStatusOk: 'System Online',
      clearAll: 'Clear All',
      markAllAsRead: 'Mark all read',
      courseDistributionChartTitle: 'Course Catalog Distribution',
      courseDistributionDesc: 'Breakdown of free vs paid courses',
      specificDayFilter: 'Specific Day',
      clearDateFilter: 'Clear date filter',
      days7: '7 Days',
      days30: '30 Days',
      year1: '1 Year',
      allTime: 'All Time',
      enrollees: 'Enrollees',
      courseEnrolleesManager: 'Course Enrollees Manager',
      courseEnrolleesDesc: 'View and manage real-time active students enrolled in any selected course.',
      selectCoursePlaceholder: 'Select a Course...',
      studentsCountSuffix: 'students',
      enrollStudent: 'Enroll Student',
      pleaseSelectCourse: 'Please select a course to view and manage its enrolled students.',
      student: 'STUDENT',
      xpPoints: 'XP POINTS',
      enrolledAt: 'ENROLLED DATE',
      actions: 'ACTIONS',
      noEnrolleesForCourse: 'No students enrolled in this course yet.',
      unenrollBtn: 'Remove Student',
      enrollStudentModalTitle: 'Enroll Student into Course',
      selectStudentToEnroll: 'Select Student',
      selectStudentPlaceholder: 'Choose a student from the platform...',
      enrollBtn: 'Enroll Student',
      newQuizBtn: 'New Quiz',
      newAssignmentBtn: 'New Assignment'
    },
    ar: {
      brand: 'قِمَّـة', menu: 'القائمة الرئيسية', dashboard: 'الرئيسية', myCourses: 'إدارة الكورسات',
      students: 'الطلاب', schedule: 'الجدول', account: 'الحساب', accountSettings: 'إعدادات الحساب',
      logout: 'تسجيل خروج', totalStudents: 'إجمالي الطلاب', activeCourses: 'الكورسات النشطة',
      totalQuizzes: 'إجمالي الاختبارات', totalLessons: 'إجمالي الدروس',
      revenue: 'إجمالي العائد / النقاط', createCourse: 'إنشاء كورس جديد', fillDetails: 'قم بملء بيانات الكورس بالأسفل.',
      courseTitle: 'عنوان الكورس', desc: 'الوصف', uploadCover: 'صورة غلاف الكورس', clickToUpload: 'اضغط لرفع صورة',
      courseType: 'نوع الكورس', freeCourse: 'مجاني', paidCourse: 'مدفوع',
      price: 'سعر الاشتراك الشهري', discount: 'نسبة الخصم %',
      changeImage: 'تغيير الصورة', publishBtn: 'نشر الكورس', myPublished: 'الكورسات المنشورة',
      noCourses: 'لم تقم بنشر أي كورسات حتى الآن.', successMsg: 'تم الإجراء بنجاح!',
      errorMsg: 'حدث خطأ أثناء التنفيذ.', welcome: 'مرحباً بعودتك', streak: 'استمر في العمل الرائع!',
      teacher: 'معلم', manageCourses: 'إدارة الكورسات النشطة والمحتوى الخاص بك.', newCourseBtn: 'كورس جديد',
      view: 'عرض', deleteCourseBtn: 'حذف الكورس', cancel: 'إلغاء', viewAll: 'عرض الكل', liveSessions: 'البث المباشر',
      newSession: 'جديد', startSession: 'بدء الجلسة', deleteConfirmTitle: 'حذف الكورس',
      deleteConfirmDesc: 'هل أنت متأكد من حذف الكورس بالكامل بجميع دروسه؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmDeleteBtn: 'نعم، احذف', deleteSuccessMsg: 'تم حذف الكورس بنجاح!',
      selectCourseToView: 'اختر الكورس', selectCourseDesc: 'اختر كورس لعرض الطلاب المشتركين فيه ونتائج اختباراتهم.',
      clickToViewStudents: 'عرض الطلاب المشتركين', enrolledStudents: 'الطلاب المشتركين', inCourse: 'في كورس',
      noStudentsEnrolled: 'لم يشترك أي طالب في هذا الكورس بعد.',
      viewResults: 'عرض نتائج الاختبارات', noStudentsFound: 'لا يوجد طلاب مشتركين في هذا الكورس بعد.',
      lessonTitle: 'الدرس', attemptNo: 'المحاولة', score: 'الدرجة', date: 'التاريخ', noSearchResults: 'لا توجد نتائج مطابقة.',
      attemptsText: 'محاولات', specialization: 'التخصص', specPlaceholder: 'مثال: أستاذ اللغة العربية',
      change: 'تغيير', fullName: 'الاسم بالكامل', email: 'البريد الإلكتروني', emailCantChange: "لا يمكن تغيير البريد الإلكتروني.",
      phone: 'رقم الهاتف', bio: 'نبذة عني', bioPlaceholder: 'اكتب نبذة مختصرة عنك...',
      saveBtn: 'حفظ التغييرات', saving: 'جاري الحفظ...',
      securitySectionTitle: 'بيانات الأمان وكلمة المرور',
      securitySectionDesc: 'تحديث كلمة المرور (اختياري). اترك الحقل فارغاً إذا كنت لا ترغب في تغييرها.',
      resetPasswordOptional: 'كلمة المرور الجديدة (اختياري)',
      leaveBlankIfSame: 'اترك الحقل فارغاً إذا كنت لا ترغب في تغييرها',
      unsavedTitle: 'تغييرات لم تُحفظ', unsavedDesc: 'لقد قمت بتعديل بياناتك. هل أنت متأكد من رغبتك في الخروج دون حفظ؟',
      stayBtn: 'لا، البقاء هنا', discardBtn: 'نعم، تجاهل التغييرات', liveNow: 'مباشر الآن',
      notificationsTitle: 'الإشعارات', unreadText: 'غير مقروء', noNotifications: 'لا توجد إشعارات جديدة',
      addEvent: 'حدث جديد', totalRevenue: 'إجمالي الإيرادات', thisMonth: 'هذا الشهر',
      studentGrowth: 'معدل نمو الطلاب', increaseLastMonth: 'زيادة عن الشهر الماضي',
      instructorRating: 'متوسط التقييم', recentTransactions: 'المعاملات الأخيرة',
      studentName: 'اسم الطالب', course: 'الكورس', amount: 'Amount', activityFeed: 'نشاط الطلاب',
      support: 'المساعدة والدعم',
      yourTopCourses: 'أفضل كورساتك',
      viewAllCourses: 'عرض الكل',
      studentsCountText: 'طالب',
      instructorPanel: 'لوحة تحكم المعلم',
      systemStatusOk: 'النظام متصل',
      clearAll: 'مسح الكل',
      markAllAsRead: 'تحديد الكل كمقروء',
      courseDistributionChartTitle: 'توزيع الكورسات',
      courseDistributionDesc: 'تفصيل الكورسات المجانية مقابل المدفوعة',
      specificDayFilter: 'يوم محدد',
      clearDateFilter: 'مسح فلتر اليوم',
      days7: '7 أيام',
      days30: '30 يوم',
      year1: 'سنة واحدة',
      allTime: 'كل الأوقات',
      enrollees: 'الطلاب المسجلين',
      courseEnrolleesManager: 'إدارة الطلاب المسجلين بالكورس',
      courseEnrolleesDesc: 'عرض وإدارة الطلاب المسجلين فعلياً في أي كورس محدد في الوقت الحقيقي.',
      selectCoursePlaceholder: 'اختر الكورس...',
      studentsCountSuffix: 'طلاب',
      enrollStudent: 'إضافة طالب',
      pleaseSelectCourse: 'يرجى اختيار أحد الكورسات لعرض وإدارة الطلاب المسجلين به.',
      student: 'الطالب',
      xpPoints: 'نقاط XP',
      enrolledAt: 'تاريخ التسجيل',
      actions: 'الإجراءات',
      noEnrolleesForCourse: 'لا يوجد طلاب مسجلون في هذا الكورس حتى الآن.',
      unenrollBtn: 'إلغاء الاشتراك',
      enrollStudentModalTitle: 'تسجيل طالب في الكورس',
      selectStudentToEnroll: 'اختر الطالب',
      selectStudentPlaceholder: 'اختر طالباً من المنصة...',
      enrollBtn: 'تسجيل الطالب',
      newQuizBtn: 'اختبار شامل',
      newAssignmentBtn: 'واجب شامل'
    }
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public router: Router,
    private route: ActivatedRoute,
    private langService: LanguageService,
    private signalrService: SignalrService,
    private assignmentService: AssignmentService,
    public themeService: ThemeService
  ) {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      isFree: [false],
      price: [0],
      discountPercentage: [0],
      coverImageUrl: ['']
    });

    this.editCourseForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      isFree: [false],
      price: [0],
      discountPercentage: [0],
      coverImageUrl: ['']
    });

    this.eventForm = this.fb.group({
      courseId: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      eventDate: ['', Validators.required],
      eventType: ['', Validators.required]
    });
  }

  ngOnInit() {
    const role = localStorage.getItem('userRole');
    if (role !== 'Teacher' && role !== '1') {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
      return;
    }
    
    this.langService.currentLang$.subscribe((l: any) => {
      this.lang = l;
      if (this.activeTab === 'dashboard' && this.chart) {
        this.loadDashboardStats(); 
      }
    });

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] || 'dashboard';
      
      this.activeTab = tab as string;
      
      this.showCreateForm = false;
      this.showEventForm = false;
      this.studentViewMode = 'select-course';

      if (tab === 'dashboard') {
         this.loadDashboardStats();
      }
      
      if (tab === 'schedule' && this.events.length === 0) {
         this.fetchSchedule();
      }

      if (tab === 'enrollees') {
         if (params['courseId']) {
           this.selectedCourseIdForEnrollees = +params['courseId'];
         }
         if (!this.selectedCourseIdForEnrollees && this.courses.length > 0) {
           this.selectedCourseIdForEnrollees = this.courses[0].id;
         }
         this.loadCourseEnrollees();
         this.loadAvailableStudents();
      }

      if (this.courses.length === 0) {
         this.loadMyCourses();
      }
    });

    this.fetchUserProfile();
    this.fetchNotifications();
    this.signalrService.startConnection();

    this.minDate = this.getLocalDateTimeString();
  }

  getLocalDateTimeString(d: Date = new Date()): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  preventDateKeyboardTyping(event: KeyboardEvent) {
    if (['Tab', 'Escape', 'Enter'].includes(event.key)) {
      return;
    }
    event.preventDefault();
  }

  validateEventDate(event?: any) {
    const nowStr = this.getLocalDateTimeString();
    this.minDate = nowStr;
    const currentVal = this.eventForm.get('eventDate')?.value;
    if (currentVal && currentVal < nowStr) {
      this.eventForm.patchValue({ eventDate: nowStr });
      const msg = this.lang === 'ar' ? 'لا يمكن اختيار تاريخ أو وقت في الماضي.' : 'Cannot select a date or time in the past.';
      this.eventFormError = msg;
    }
  }

  switchTab(tab: string) {
    this.isMobileSidebarOpen = false;
    this.searchQuery = '';
    if (tab === 'students') {
       this.router.navigate(['/teacher-dashboard'], { queryParams: { tab: tab, view: 'select-course' } });
    } else if (tab === 'enrollees') {
       if (!this.selectedCourseIdForEnrollees && this.courses.length > 0) {
         this.selectedCourseIdForEnrollees = this.courses[0].id;
       }
       this.router.navigate(['/teacher-dashboard'], { queryParams: { tab: tab } });
       this.loadCourseEnrollees();
       this.loadAvailableStudents();
    } else {
       this.router.navigate(['/teacher-dashboard'], { queryParams: { tab: tab } });
    }
  }

  goBackToCourseSelection() {
    this.studentViewMode = 'select-course';
  }

  goBackToStudentSelection() {
    this.studentViewMode = 'select-student';
  }

  openCreateCourse() {
    this.imagePreview = null;
    this.createCourseError = null;
    this.courseForm.reset({ isFree: false, price: 0, discountPercentage: 0 });
    this.showCreateForm = true;
    this.activeTab = 'courses';
  }

  cancelCreateCourse() {
    this.showCreateForm = false;
    this.createCourseError = null;
  }

  openCreateEvent() {
    this.minDate = this.getLocalDateTimeString();
    this.showEventForm = true;
    this.isCourseDropdownOpen = false;
    this.eventFormError = null;
    this.eventForm.reset({ eventType: '', eventDate: this.minDate });
    if (this.courses.length === 0) {
      this.loadMyCourses();
    }
  }

  cancelCreateEvent() {
    this.showEventForm = false;
    this.isCourseDropdownOpen = false;
    this.eventFormError = null;
  }

  selectEventCourse(courseId: number) {
    this.eventForm.patchValue({ courseId: courseId });
    this.isCourseDropdownOpen = false;
  }

  getSelectedCourseTitle(): string {
    const id = this.eventForm?.get('courseId')?.value;
    if (!id) return '';
    const c = this.courses.find(x => x.id == id);
    return c ? c.title : '';
  }

  selectCourseForStudents(course: any) {
    this.selectedCourse = course;
    this.studentViewMode = 'select-student';
    this.loadStudentsForCourse(course.id);
  }

  selectStudentDetails(student: any) {
    this.selectedStudent = student;
    this.studentViewMode = 'student-details';
    this.loadStudentQuizResults(student.id, this.selectedCourse.id);
  }

  quickAction(actionType: 'course') {
    if (actionType === 'course') {
      this.openCreateCourse();
    }
  }

  trackById(index: number, item: any): any {
    return item.id || index;
  }

  get filteredRecentTransactions() {
    let filtered = this.recentTransactions;
    if (this.selectedTransactionMonth !== 'all') {
      filtered = filtered.filter(tr => {
        if (!tr.date) return true;
        const date = new Date(tr.date);
        return (date.getMonth() + 1).toString() === this.selectedTransactionMonth;
      });
    }
    if (this.selectedTransactionYear !== 'all') {
      filtered = filtered.filter(tr => {
        if (!tr.date) return true;
        const date = new Date(tr.date);
        return date.getFullYear().toString() === this.selectedTransactionYear;
      });
    }
    return this.showAllTransactions ? filtered : filtered.slice(0, 5);
  }

  get filteredActivityFeed() {
    let filtered = this.activityFeed;
    if (this.selectedActivityMonth !== 'all') {
      filtered = filtered.filter(feed => {
        if (!feed.date) return true;
        const date = new Date(feed.date);
        return (date.getMonth() + 1).toString() === this.selectedActivityMonth;
      });
    }
    if (this.selectedActivityYear !== 'all') {
      filtered = filtered.filter(feed => {
        if (!feed.date) return true;
        const date = new Date(feed.date);
        return date.getFullYear().toString() === this.selectedActivityYear;
      });
    }
    return this.showAllActivities ? filtered : filtered.slice(0, 5);
  }

  get filteredAllPlatformStudents() {
    if (!this.allStudentsSearchQuery) return this.allPlatformStudents;
    const q = this.allStudentsSearchQuery.toLowerCase();
    return this.allPlatformStudents.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phoneNumber && s.phoneNumber.includes(q))
    );
  }

  viewAllPlatformStudents() {
    this.studentViewMode = 'all-platform-students';
    this.loadAllPlatformStudents();
  }

  loadAllPlatformStudents() {
    this.isLoadingAllStudents = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>('https://qimma.runasp.net/api/user/students', { headers }).subscribe({
      next: (data) => {
        this.allPlatformStudents = data || [];
        this.isLoadingAllStudents = false;
      },
      error: () => {
        this.allPlatformStudents = [];
        this.isLoadingAllStudents = false;
      }
    });
  }

  selectCourseForLiveSession(course: any) {
    this.selectedCourseForLive = course;
    this.isLoadingStudentsForLive = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(`https://qimma.runasp.net/api/quiz/course/${course.id}/students`, { headers }).subscribe({
      next: (data) => {
        this.enrolledStudentsForLive = data || [];
        this.isLoadingStudentsForLive = false;
      },
      error: () => {
        this.enrolledStudentsForLive = [];
        this.isLoadingStudentsForLive = false;
      }
    });
  }

  getMonthYearTitle(): string {
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const m = this.currentCalendarMonth.getMonth();
    const y = this.currentCalendarMonth.getFullYear();
    return this.lang === 'ar' ? `${monthsAr[m]} ${y}` : `${monthsEn[m]} ${y}`;
  }

  prevCalendar(): void {
    if (this.calendarView === 'week') {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() - 7);
      this.selectedDate = d;
      this.currentCalendarMonth = new Date(d);
    } else {
      const d = new Date(this.currentCalendarMonth);
      d.setMonth(d.getMonth() - 1);
      this.currentCalendarMonth = d;
    }
  }

  nextCalendar(): void {
    if (this.calendarView === 'week') {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() + 7);
      this.selectedDate = d;
      this.currentCalendarMonth = new Date(d);
    } else {
      const d = new Date(this.currentCalendarMonth);
      d.setMonth(d.getMonth() + 1);
      this.currentCalendarMonth = d;
    }
  }

  goToToday(): void {
    const today = new Date();
    this.selectedDate = today;
    this.currentCalendarMonth = new Date(today);
  }

  selectCalendarDay(date: Date): void {
    this.selectedDate = new Date(date);
    this.currentCalendarMonth = new Date(date);
  }

  isSameDate(d1: any, d2: any): boolean {
    if (!d1 || !d2) return false;
    const a = new Date(d1);
    const b = new Date(d2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  get weekDays(): any[] {
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    
    const current = new Date(this.selectedDate);
    const dayOfWeek = current.getDay();
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - dayOfWeek);
    
    const result = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const isSelected = this.isSameDate(d, this.selectedDate);
      const isToday = this.isSameDate(d, today);
      const hasEvents = this.events.some(e => this.isSameDate(e.eventDate, d));
      result.push({
        date: d,
        dayName: this.lang === 'ar' ? daysAr[d.getDay()] : daysEn[d.getDay()],
        dayNumber: d.getDate(),
        isSelected,
        isToday,
        hasEvents
      });
    }
    return result;
  }

  get monthDays(): any[] {
    const y = this.currentCalendarMonth.getFullYear();
    const m = this.currentCalendarMonth.getMonth();
    const firstDayIndex = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const result: any[] = [];
    const today = new Date();

    for (let i = 0; i < firstDayIndex; i++) {
      result.push({ empty: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      const isSelected = this.isSameDate(d, this.selectedDate);
      const isToday = this.isSameDate(d, today);
      const dayEvents = this.events.filter(e => this.isSameDate(e.eventDate, d));
      result.push({
        empty: false,
        date: d,
        dayNumber: day,
        isSelected,
        isToday,
        eventsCount: dayEvents.length,
        hasEvents: dayEvents.length > 0
      });
    }
    return result;
  }

  get filteredCalendarEvents(): any[] {
    let list = this.events;
    if (this.calendarSearch) {
      const q = this.calendarSearch.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.courseTitle && e.courseTitle.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    if (this.calendarView === 'week') {
      return list.filter(e => this.isSameDate(e.eventDate, this.selectedDate));
    }
    const m = this.currentCalendarMonth.getMonth();
    const y = this.currentCalendarMonth.getFullYear();
    return list.filter(e => {
      const d = new Date(e.eventDate);
      return d.getMonth() === m && d.getFullYear() === y;
    });
  }

  get selectedDayEvents(): any[] {
    let list = this.events;
    if (this.calendarSearch) {
      const q = this.calendarSearch.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.courseTitle && e.courseTitle.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return list.filter(e => this.isSameDate(e.eventDate, this.selectedDate));
  }

  get filteredStudentResults() {
    if (!this.searchQuery) return this.groupedStudentResults;
    const q = this.searchQuery.toLowerCase();
    return this.groupedStudentResults.filter(g => 
      (g.lessonTitle && g.lessonTitle.toLowerCase().includes(q)) ||
      (g.assignment && g.assignment.title && g.assignment.title.toLowerCase().includes(q))
    );
  }

  setChartTimeframe(tf: string) {
    this.selectedChartTimeframe = tf;
    this.selectedChartDate = '';
    this.loadDashboardStats();
  }

  onChartDateChange() {
    if (this.selectedChartDate) {
      this.loadDashboardStats();
    }
  }

  clearChartDate() {
    this.selectedChartDate = '';
    this.selectedChartTimeframe = '7days';
    this.loadDashboardStats();
  }

  onTimeframeChange() {
    this.loadDashboardStats();
  }

  loadDashboardStats() {
    if (this.totalRevenue === 0) this.isLoadingDashboard = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    let url = `https://qimma.runasp.net/api/instructor/dashboard/stats?timeframe=${this.selectedChartTimeframe}`;
    if (this.selectedChartDate) {
      url += `&date=${encodeURIComponent(this.selectedChartDate)}`;
    }

    this.http.get<any>(url, { headers }).subscribe({
      next: (data) => {
        this.totalRevenue = data?.totalRevenue || 0;
        this.monthlyRevenue = data?.monthlyRevenue || 0;
        this.studentGrowth = data?.studentGrowth || 0;
        this.instructorRating = data?.instructorRating || 0;
        
        this.totalStudentsCount = data?.totalStudents || 0;
        this.totalLessonsCount = data?.totalLessons || 0;
        this.totalQuizzesCount = data?.totalQuizzes || 0;
        
        this.recentTransactions = data?.recentTransactions || [];
        this.activityFeed = data?.activityFeed || [];
        this.topCourses = (data?.topCourses || []).sort((a: any, b: any) => {
          const diff = (b.completionPercentage || 0) - (a.completionPercentage || 0);
          if (diff !== 0) return diff;
          return (b.studentsCount || 0) - (a.studentsCount || 0);
        });
        if ((!this.topCourses || this.topCourses.length === 0) && this.courses && this.courses.length > 0) {
          this.topCourses = this.courses.slice(0, 10).map(c => ({
            id: c.id,
            title: c.title,
            studentsCount: c.studentsCount || c.enrollmentsCount || 0,
            completionPercentage: c.completionPercentage || 0,
            coverImageUrl: c.coverImageUrl
          })).sort((a, b) => {
            const diff = (b.completionPercentage || 0) - (a.completionPercentage || 0);
            if (diff !== 0) return diff;
            return (b.studentsCount || 0) - (a.studentsCount || 0);
          });
        }

        this.isLoadingDashboard = false;
        this.isLoadingTopMetrics = false;

        if (data?.chartData) {
          this.renderChart(data.chartData);
        }
        this.renderCourseDistributionChart();
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        this.isLoadingDashboard = false;
        this.isLoadingTopMetrics = false;
        this.renderCourseDistributionChart();
      }
    });
  }

  renderCourseDistributionChart() {
    setTimeout(() => {
      const canvas = document.getElementById('teacherCourseDistributionChart') as HTMLCanvasElement;
      if (!canvas) return;

      if (this.distributionChart) {
        this.distributionChart.destroy();
        this.distributionChart = null;
      }
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();

      const paidCount = this.paidCoursesCount;
      const freeCount = this.freeCoursesCount;

      this.distributionChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: [this.t[this.lang].paidCourse, this.t[this.lang].freeCourse],
          datasets: [
            {
              data: [paidCount, freeCount],
              backgroundColor: ['#4F46E5', '#10B981'],
              borderWidth: 3,
              borderColor: '#FFFFFF',
              hoverOffset: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 12, weight: 'bold' }, boxWidth: 12, padding: 15 }
            }
          }
        }
      });
    }, 100);
  }

  renderChart(chartData: any) {
    setTimeout(() => {
      const canvas = document.getElementById('assignmentsChart') as HTMLCanvasElement;
      if (!canvas) return;
      
      if (this.chart) {
        this.chart.destroy();
      }
      
      this.chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: this.lang === 'ar' ? 'تسجيلات جديدة' : 'New Enrollments',
              data: chartData.newEnrollments || chartData.ongoing || [],
              borderColor: '#4F46E5',
              backgroundColor: '#4F46E5',
              tension: 0.3,
              borderWidth: 2
            },
            {
              label: this.lang === 'ar' ? 'إتمام الكورسات' : 'Course Completions',
              data: chartData.courseCompletions || chartData.submitted || [],
              borderColor: '#10B981',
              backgroundColor: '#10B981',
              tension: 0.3,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                usePointStyle: true,
                boxWidth: 8
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              grid: { color: '#f1f5f9' },
              border: { dash: [4, 4] }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }, 100);
  }

  openAssignmentModal() {
    this.assignmentData = { courseId: null, title: '', dueDate: '', questions: [''] };
    this.showAssignmentModal = true;
  }

  addAssignmentQuestion() {
    this.assignmentData.questions.push('');
  }

  removeAssignmentQuestion(index: number) {
    this.assignmentData.questions.splice(index, 1);
  }

  submitAssignment() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.showMessage(this.lang === 'ar' ? 'تم نشر الواجب بنجاح وإرسال إشعارات للطلاب!' : 'Assignment published successfully!', 'success');
    this.showAssignmentModal = false;
    this.assignmentData = { courseId: null, title: '', dueDate: '', questions: [''] };
  }

  saveAssignmentGrade(assign: any) {
    if (assign.givenScore === null || assign.givenScore === undefined) {
      this.showMessage(this.lang === 'ar' ? 'يرجى إدخال الدرجة أولاً.' : 'Please enter a score first.', 'error');
      return;
    }

    if (assign.givenScore < 0) {
      this.showMessage(this.lang === 'ar' ? 'لا يمكن أن تكون الدرجة بالسالب.' : 'Grade cannot be negative.', 'error');
      return;
    }

    if (assign.totalScore && assign.givenScore > assign.totalScore) {
      this.showMessage(this.lang === 'ar' ? `لا يمكن أن تتجاوز الدرجة إجمالي درجة الواجب (${assign.totalScore}).` : `Grade cannot exceed assignment total score (${assign.totalScore}).`, 'error');
      return;
    }

    this.isSaving = true;
    
    this.assignmentService.gradeAssignment(assign.id, assign.givenScore).subscribe({
      next: () => {
        this.isSaving = false;
        this.showMessage(this.lang === 'ar' ? 'تم حفظ الدرجة بنجاح' : 'Grade saved successfully', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.showMessage(this.lang === 'ar' ? 'حدث خطأ أثناء حفظ الدرجة' : 'Error saving grade', 'error');
      }
    });
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  endDrag() {
    this.isDragging = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    if (this.showNotificationsDropdown && !targetElement.closest('.notification-container')) {
      this.showNotificationsDropdown = false;
    }
  }

  toggleNotifications() {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    if (this.showNotificationsDropdown) {
      this.fetchNotifications();
    }
  }

  fetchNotifications() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('https://qimma.runasp.net/api/notifications', { headers }).subscribe({
      next: (data) => {
        const filteredData = data.filter(n => {
          const msg = n.message || '';
          if (msg.includes('بدأ المعلم') && msg.includes('بثاً مباشراً')) return false;
          if (msg.includes('started a live session')) return false;
          return true;
        });
        this.notifications = filteredData.map(n => {
          const dateStr = n.createdAt.endsWith('Z') ? n.createdAt : n.createdAt + 'Z';
          return { ...n, createdAt: dateStr };
        });
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      },
      error: () => { }
    });
  }

  onNotificationClick(notif: any) {
    this.markAsRead(notif);
    this.showNotificationsDropdown = false;
    const rawMsg = notif.message || '';
    const parts = rawMsg.split('||');
    const type = parts[0];
    const msg = rawMsg.toLowerCase();
    const title = (notif.title || '').toLowerCase();
    const text = msg + ' ' + title;

    if (type === 'ASSIGNMENT_SUBMITTED' || text.includes('submitted') || text.includes('تسليم')) {
      this.switchTab('students');
      const courseId = parts[4];
      const studentId = parts[5];
      if (courseId) {
        const targetCourse = this.courses.find(c => c.id == courseId);
        if (targetCourse) {
          this.selectCourseForStudents(targetCourse);
          if (studentId) {
            setTimeout(() => {
              const targetStudent = this.enrolledStudents.find(s => (s.studentId || s.id) == studentId);
              if (targetStudent) {
                this.selectStudentDetails(targetStudent);
              } else {
                this.selectStudentDetails({ id: +studentId, studentId: +studentId, username: parts[1] || 'Student', studentName: parts[1] || 'Student' });
              }
            }, 350);
          }
        }
      }
      return;
    }

    if (text.includes('enrolled') || text.includes('انضم') || text.includes('طالب جديد')) {
      this.switchTab('students');
      return;
    }

    if (type === 'NEW_SCHEDULE' || text.includes('schedule') || text.includes('موعد') || text.includes('حدث') || text.includes('event')) {
      this.switchTab('schedule');
      return;
    }

    if (text.includes('live') || text.includes('بث') || text.includes('مباشر')) {
      this.switchTab('live');
      return;
    }

    if (type === 'NEW_LESSON' || type === 'NEW_QUIZ' || text.includes('lesson') || text.includes('quiz') || text.includes('كويز') || text.includes('اختبار') || text.includes('درس')) {
      this.switchTab('courses');
      return;
    }

    this.switchTab('dashboard');
  }

  markAsRead(notif: any) {
    if (notif.isRead) return;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post(`https://qimma.runasp.net/api/notifications/${notif.id}/read`, {}, { headers }).subscribe({
      next: () => {
        notif.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    });
  }

  deleteNotification(id: number, event: Event) {
    event.stopPropagation();
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`https://qimma.runasp.net/api/notifications/${id}`, { headers }).subscribe({
      next: () => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif && !notif.isRead) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.notifications = this.notifications.filter(n => n.id !== id);
      }
    });
  }

  deleteAllNotifications() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete('https://qimma.runasp.net/api/notifications/all', { headers }).subscribe({
      next: () => {
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  markAllNotificationsAsRead() {
    this.notifications.forEach(n => n.isRead = true);
    this.unreadCount = 0;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.post('https://qimma.runasp.net/api/notifications/read-all', {}, { headers }).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  containsArabic(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text || '');
  }

  translateLegacyNotification(message: string, targetLang: 'ar' | 'en'): string {
    if (!message) return '';

    // Live session notification
    if (message.includes('بدأ المعلم') || message.includes('started a live session')) {
      if (targetLang === 'en') {
        return message
          .replace(/بدأ المعلم/g, 'Instructor')
          .replace(/بثاً مباشراً لكورس/g, 'started a live session for course')
          .replace(/انضم الآن!?/g, 'Join now!')
          .replace(/\. انضم الآن!?/g, '. Join now!');
      } else {
        return message
          .replace(/Instructor/g, 'بدأ المعلم')
          .replace(/started a live session for course/g, 'بثاً مباشراً لكورس')
          .replace(/Join now!?/g, 'انضم الآن!')
          .replace(/\. Join now!?/g, '. انضم الآن!');
      }
    }

    // Extract student & course inside quotes: 'Student' ... 'Course'
    const quotes = [...message.matchAll(/'([^']+)'/g)].map(m => m[1]);
    const student = quotes[0] || '';
    const course = quotes[1] || '';

    // Amount: بمبلغ 108.00 ج.م or for 108.00 EGP
    const amountMatch = message.match(/(?:بمبلغ|for)\s*([\d\.]+)\s*(?:ج\.م|EGP)/i);
    const amount = amountMatch ? amountMatch[1] : '';

    // Profit: أرباحك: 86.40 ج.م or profit: 86.40 EGP
    const profitMatch = message.match(/(?:أرباحك|profit):\s*([\d\.]+)\s*(?:ج\.م|EGP)/i);
    const profit = profitMatch ? profitMatch[1] : '';

    // Platform share & instructor share:
    const platformMatch = message.match(/نسبة المنصة:\s*([\d\.]+)\s*ج\.م/);
    const platformShare = platformMatch ? platformMatch[1] : '';
    const instShareMatch = message.match(/نسبة المعلم:\s*([\d\.]+)\s*ج\.م/);
    const instShare = instShareMatch ? instShareMatch[1] : '';

    const isAdminEnroll = message.includes('المشرف') || message.includes('Admin');

    if (student && course) {
      if (targetLang === 'en') {
        if (platformShare && instShare) {
          return `Student '${student}' enrolled in course '${course}' for ${amount} EGP (Platform: ${platformShare} EGP, Instructor: ${instShare} EGP).`;
        }
        if (isAdminEnroll) {
          return `Admin enrolled student '${student}' in course '${course}'${amount ? ' for ' + amount + ' EGP' : ''}${profit ? ' (Your profit: ' + profit + ' EGP)' : ''}.`;
        }
        if (profit) {
          return `Student '${student}' was enrolled in course '${course}'${amount ? ' for ' + amount + ' EGP' : ''} (Your profit: ${profit} EGP).`;
        }
        if (amount) {
          return `Student '${student}' enrolled in course '${course}' for ${amount} EGP.`;
        }
        return `Student '${student}' enrolled in free course '${course}'.`;
      } else {
        if (platformShare && instShare) {
          return `تم تسجيل الطالب '${student}' في كورس '${course}' بمبلغ ${amount} ج.م (نسبة المنصة: ${platformShare} ج.م، نسبة المعلم: ${instShare} ج.م).`;
        }
        if (isAdminEnroll) {
          return `قام المشرف بتسجيل الطالب '${student}' في كورس '${course}'${amount ? ' بمبلغ ' + amount + ' ج.م' : ''}${profit ? ' (أرباحك: ' + profit + ' ج.م)' : ''}.`;
        }
        if (profit) {
          return `تم تسجيل الطالب '${student}' في كورس '${course}'${amount ? ' بمبلغ ' + amount + ' ج.م' : ''} (أرباحك: ${profit} ج.م).`;
        }
        if (amount) {
          return `تم تسجيل الطالب '${student}' في كورس '${course}' بمبلغ ${amount} ج.م.`;
        }
        return `تم تسجيل الطالب '${student}' في الكورس المجاني '${course}'.`;
      }
    }

    if (targetLang === 'en' && this.containsArabic(message)) {
      return message
        .replace(/طالب جديد انضم!?\s*/g, 'New student joined! ')
        .replace(/لقد قام المشرف بتسجيل الطالب/g, 'Admin enrolled student')
        .replace(/تم تسجيل الطالب/g, 'Student was enrolled')
        .replace(/لقد قام الطالب/g, 'Student')
        .replace(/قام الطالب/g, 'Student')
        .replace(/بالاشتراك في كورس/g, 'enrolled in course')
        .replace(/في كورس/g, 'in course')
        .replace(/في الكورس المجاني/g, 'in free course')
        .replace(/بمبلغ/g, 'for')
        .replace(/\(أرباحك:/g, '(Your profit:')
        .replace(/أرباحك:/g, 'Your profit:')
        .replace(/ج\.م/g, 'EGP');
    }

    if (targetLang === 'ar' && !this.containsArabic(message)) {
      return message
        .replace(/New student enrolled!?\s*/gi, 'انضم طالب جديد! ')
        .replace(/Student was enrolled in course/gi, 'تم تسجيل الطالب في كورس')
        .replace(/enrolled in course/gi, 'اشترك في كورس')
        .replace(/Your profit:/gi, 'أرباحك:')
        .replace(/EGP/gi, 'ج.م');
    }

    return message;
  }

  getNotificationType(message: string): string {
    if (!message) return 'SYSTEM';
    if (message.includes('||')) {
      const type = message.split('||')[0].trim();
      if (type.includes('ENROLLMENT_PAID') || type.includes('PAID')) return 'ENROLLMENT_PAID';
      if (type.includes('ENROLLMENT') || type.includes('ENROLLED')) return 'ENROLLMENT';
      if (type.includes('ASSIGNMENT')) return 'ASSIGNMENT';
      if (type.includes('USER') || type.includes('STUDENT') || type.includes('INSTRUCTOR')) return 'NEW_USER';
      return type;
    }
    if (message.includes('paid') || message.includes('مدفوع') || message.includes('أرباحك') || message.includes('profit') || message.includes('ج.م') || message.includes('EGP')) return 'ENROLLMENT_PAID';
    if (message.includes('enrolled') || message.includes('انضم') || message.includes('اشترك')) return 'ENROLLMENT';
    if (message.includes('assignment') || message.includes('واجب') || message.includes('تسليم')) return 'ASSIGNMENT';
    if (message.includes('Instructor') || message.includes('Student') || message.includes('طالب') || message.includes('معلم')) return 'NEW_USER';
    return 'SYSTEM';
  }

  getNotificationTitle(message: string): string {
    if (!message) return '';
    const parts = message.split('||').map(p => p.trim());
    const type = parts[0];

    if (type === 'NEW_QUIZ') {
      const lessonTitle = parts[1] || '';
      return this.lang === 'ar' ? `اختبار جديد: ${lessonTitle}` : `New Quiz: ${lessonTitle}`;
    }
    if (type === 'NEW_LESSON') {
      const lessonTitle = parts[2] || parts[1] || '';
      return this.lang === 'ar' ? `درس جديد: ${lessonTitle}` : `New Lesson: ${lessonTitle}`;
    }
    if (type === 'NEW_SCHEDULE') {
      const title = parts[2] || parts[1] || '';
      return this.lang === 'ar' ? `موعد جديد: ${title}` : `New Schedule: ${title}`;
    }
    if (type === 'LIVE_SESSION') {
      return this.lang === 'ar' ? 'جلسة بث مباشر جديدة' : 'New Live Session';
    }
    if (type === 'QUIZ_FULLMARK') {
      return this.lang === 'ar' ? '🎉 الدرجة النهائية في الكويز!' : '🎉 Full Mark in Quiz!';
    }
    if (type === 'STUDENT_FULLMARK') {
      const studentName = parts[1] || '';
      return this.lang === 'ar' ? `درجة نهائية: ${studentName}` : `Full Mark: ${studentName}`;
    }
    if (type === 'NEW_ASSIGNMENT') {
      const title = parts[1] || '';
      return this.lang === 'ar' ? `واجب جديد: ${title}` : `New Assignment: ${title}`;
    }
    if (type === 'ASSIGNMENT_SUBMITTED') {
      const studentName = parts[1] || '';
      return this.lang === 'ar' ? `تسليم واجب جديد: ${studentName}` : `Assignment Submitted: ${studentName}`;
    }
    if (type === 'ASSIGNMENT_GRADED') {
      const title = parts[1] || '';
      return this.lang === 'ar' ? `تم تصحيح الواجب: ${title}` : `Assignment Graded: ${title}`;
    }
    if (type === 'ENROLLMENT_PAID') {
      return this.lang === 'ar' ? 'اشتراك كورس (مدفوع)' : 'Paid Course Enrollment';
    }
    if (type === 'ENROLLMENT') {
      return this.lang === 'ar' ? 'اشتراك كورس جديد' : 'New Course Enrollment';
    }
    if (type === 'NEW_USER' || type === 'NEW_INSTRUCTOR' || type === 'NEW_STUDENT') {
      return this.lang === 'ar' ? 'انضمام مستخدم جديد' : 'New User Registration';
    }
    if (type === 'SYSTEM') {
      return this.lang === 'ar' ? 'إشعار من النظام' : 'System Notification';
    }

    if (message.includes('بدأ المعلم') || message.includes('started a live session')) {
      return this.lang === 'ar' ? 'جلسة بث مباشر جديدة' : 'New Live Session';
    }
    if (message.includes('طالب جديد انضم') || message.includes('New student enrolled') || message.includes('تم تسجيل الطالب') || message.includes('اشتراك كورس')) {
      const isPaid = message.includes('أرباحك') || message.includes('profit') || message.includes('بمبلغ') || message.includes('PAID');
      if (isPaid) {
        return this.lang === 'ar' ? 'اشتراك كورس (مدفوع)' : 'Paid Course Enrollment';
      }
      return this.lang === 'ar' ? 'اشتراك طالب جديد' : 'New Student Enrollment';
    }
    if (message.includes('AI graded your task') || message.includes('تصحيح المهمة')) {
      return this.lang === 'ar' ? 'تقييم المهمة بالذكاء الاصطناعي' : 'AI Task Evaluation';
    }

    if (parts.length >= 2) {
      const content = this.lang === 'ar' ? parts[1] : (parts[2] || parts[1]);
      if (content) {
        const colonIdx = content.indexOf(':');
        if (colonIdx > 0 && colonIdx < 30 && !content.substring(0, colonIdx).includes('(') && !content.substring(0, colonIdx).includes('أرباح')) {
          return content.substring(0, colonIdx).trim();
        }
      }
    }

    const colonIdx = message.indexOf(':');
    if (colonIdx > 0 && colonIdx < 30 && !message.substring(0, colonIdx).includes('(') && !message.substring(0, colonIdx).includes('أرباح')) {
      return message.substring(0, colonIdx).trim();
    }

    return this.lang === 'ar' ? 'إشعار جديد' : 'New Notification';
  }

  getNotificationDesc(message: string): string {
    if (!message) return '';
    const parts = message.split('||').map(p => p.trim());
    const type = parts[0];

    if (type === 'NEW_QUIZ') {
      const lessonTitle = parts[1] || '';
      const courseTitle = parts[2] || '';
      return this.lang === 'ar'
        ? `تم نشر اختبار جديد لدرس '${lessonTitle}' في كورس '${courseTitle}'. اختبر معلوماتك الآن!`
        : `A new quiz has been published for lesson '${lessonTitle}' in course '${courseTitle}'. Test your knowledge now!`;
    }
    if (type === 'NEW_LESSON') {
      const lessonTitle = parts[2] || parts[1] || '';
      const courseTitle = parts[4] || '';
      return this.lang === 'ar'
        ? `تم نشر درس جديد بعنوان '${lessonTitle}' في كورس '${courseTitle}'. تفقده الآن!`
        : `A new lesson has been published titled '${lessonTitle}' in course '${courseTitle}'. Check it out now!`;
    }
    if (type === 'NEW_SCHEDULE') {
      const eventType = parts[1] || '';
      const title = parts[2] || '';
      const courseTitle = parts[3] || '';
      return this.lang === 'ar'
        ? `تم إضافة موعد جديد (${eventType}) بعنوان '${title}' لكورس '${courseTitle}'.`
        : `A new schedule event (${eventType}) titled '${title}' has been added for course '${courseTitle}'.`;
    }
    if (type === 'LIVE_SESSION') {
      return this.lang === 'ar' ? (parts[1] || '') : (parts[2] || parts[1] || '');
    }
    if (type === 'QUIZ_FULLMARK') {
      const xp = parts[1] || '50';
      return this.lang === 'ar'
        ? `🎉 مبروك! لقد ربحت ${xp} نقطة XP لحصولك على الدرجة النهائية في الكويز. استمر يا بطل!`
        : `🎉 Congratulations! You earned ${xp} XP for getting a full mark in the quiz. Keep going!`;
    }
    if (type === 'STUDENT_FULLMARK') {
      const studentName = parts[1] || '';
      const lessonTitle = parts[2] || '';
      return this.lang === 'ar'
        ? `حصل الطالب '${studentName}' على الدرجة النهائية في كويز درس '${lessonTitle}'.`
        : `Student '${studentName}' achieved a full mark on the quiz for lesson '${lessonTitle}'.`;
    }
    if (type === 'NEW_ASSIGNMENT') {
      const title = parts[1] || '';
      const courseTitle = parts[2] || '';
      const dueDate = parts[3] || '';
      return this.lang === 'ar'
        ? `تم إضافة واجب جديد '${title}' في كورس '${courseTitle}'. موعد التسليم: ${dueDate}.`
        : `A new assignment '${title}' has been added to course '${courseTitle}'. Due before: ${dueDate}.`;
    }
    if (type === 'ASSIGNMENT_SUBMITTED') {
      const studentName = parts[1] || '';
      const title = parts[2] || '';
      const courseTitle = parts[3] || '';
      return this.lang === 'ar'
        ? `قام الطالب '${studentName}' بتسليم واجب '${title}' في كورس '${courseTitle}'.`
        : `Student '${studentName}' submitted assignment '${title}' in course '${courseTitle}'.`;
    }
    if (type === 'ASSIGNMENT_GRADED') {
      const title = parts[1] || '';
      const score = parts[2] || '0';
      const totalScore = parts[3] || '0';
      return this.lang === 'ar'
        ? `تم تقييم واجبك '${title}'. نتيجتك: ${score}/${totalScore}.`
        : `Your assignment '${title}' has been graded. You scored ${score}/${totalScore}.`;
    }

    if (parts.length >= 2) {
      let text = this.lang === 'ar' ? parts[1] : (parts[2] || parts[1]);
      if (this.lang === 'en' && !parts[2] && this.containsArabic(text)) {
        return this.translateLegacyNotification(text, 'en');
      }
      const colonIdx = text.indexOf(':');
      if (colonIdx > 0 && colonIdx < 35 && !text.substring(0, colonIdx).includes('(') && !text.substring(0, colonIdx).includes('أرباح')) {
        return text.substring(colonIdx + 1).trim();
      }
      return text;
    }

    // Legacy un-delimited notifications
    if (message.includes('بدأ المعلم') || message.includes('started a live session') ||
        message.includes('طالب جديد انضم') || message.includes('New student enrolled') ||
        message.includes('تم تسجيل الطالب') || message.includes('قام الطالب')) {
      return this.translateLegacyNotification(message, this.lang);
    }

    const colonIdx = message.indexOf(':');
    if (colonIdx > 0 && colonIdx < 35 && !message.substring(0, colonIdx).includes('(') && !message.substring(0, colonIdx).includes('أرباح')) {
      return message.substring(colonIdx + 1).trim();
    }

    return message;
  }

  ensureUtcDate(dateVal: any): Date {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    let str = String(dateVal);
    if (!str.endsWith('Z') && !str.includes('+') && str.includes('T')) {
      str += 'Z';
    }
    return new Date(str);
  }

  formatDateTime(dateVal: any): string {
    if (!dateVal) return '';
    const d = this.ensureUtcDate(dateVal);
    return d.toLocaleString(this.lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatTimeAgo(dateVal: any): string {
    if (!dateVal) return '';
    const d = this.ensureUtcDate(dateVal);
    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));
    if (diffSec < 60) return this.lang === 'ar' ? 'الآن' : 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return this.lang === 'ar' ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return this.lang === 'ar' ? `منذ ${diffHrs} ساعة` : `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return this.lang === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  }

  startLiveSession() {
    if (!this.selectedCourseForLive || !this.meetUrlInput) return;
    const courseId = this.selectedCourseForLive.id.toString();
    const instructorName = this.userData?.username || 'Instructor';
    const courseTitle = this.selectedCourseForLive.title;
    let url = this.meetUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    this.signalrService.startSession(courseId, instructorName, courseTitle, url);
    this.isLiveActive = true;
    this.activeLiveTitle = courseTitle;
    window.open(url, '_blank');
  }

  openActiveMeeting() {
    if (this.meetUrlInput) {
      let url = this.meetUrlInput.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      window.open(url, '_blank');
    }
  }

  endLiveSession() {
    if (this.selectedCourseForLive) {
      this.signalrService.endSession(this.selectedCourseForLive.id.toString());
    }
    this.isLiveActive = false;
    this.meetUrlInput = '';
    this.selectedCourseForLive = null;
  }

  fetchSchedule() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>('https://qimma.runasp.net/api/schedule/teacher', { headers }).subscribe({
      next: (data) => {
        this.events = (data || []).map(e => {
          const d = e.eventDate.endsWith('Z') ? e.eventDate : e.eventDate + 'Z';
          return { ...e, eventDate: d };
        });
        this.isLoading = false;
      },
      error: () => {
        this.events = [];
        this.isLoading = false;
      }
    });
  }

  submitEvent() {
    if (this.eventForm.valid) {
      const val = this.eventForm.value;
      if (val.title && val.title.startsWith(' ')) {
        const msg = this.lang === 'ar' ? 'لا يمكن أن يبدأ عنوان الحدث بمسافة فارغة.' : 'Event title cannot begin with a space.';
        this.eventFormError = msg;
        return;
      }
      if (val.description && val.description.startsWith(' ')) {
        const msg = this.lang === 'ar' ? 'لا يمكن أن يبدأ وصف الحدث بمسافة فارغة.' : 'Description cannot begin with a space.';
        this.eventFormError = msg;
        return;
      }
      if (val.eventType && val.eventType.startsWith(' ')) {
        const msg = this.lang === 'ar' ? 'لا يمكن أن يبدأ نوع الحدث بمسافة فارغة.' : 'Event type cannot begin with a space.';
        this.eventFormError = msg;
        return;
      }

      const nowStr = this.getLocalDateTimeString();
      if (val.eventDate && val.eventDate < nowStr) {
        const msg = this.lang === 'ar' ? 'لا يمكن تحديد موعد حدث في الماضي.' : 'Cannot set an event date/time in the past.';
        this.eventFormError = msg;
        return;
      }

      this.isSaving = true;
      this.eventFormError = null;
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      let payload = { ...val };
      payload.courseId = Number(payload.courseId);
      if (!payload.eventDate.includes('Z')) {
        payload.eventDate = new Date(payload.eventDate).toISOString();
      }
      this.http.post('https://qimma.runasp.net/api/schedule', payload, { headers }).subscribe({
        next: () => {
          this.showEventForm = false;
          this.eventForm.reset({ eventType: '' });
          this.eventFormError = null;
          this.fetchSchedule();
          this.isSaving = false;
          this.showMessage(this.lang === 'ar' ? 'تمت إضافة الحدث بنجاح' : 'Event added successfully', 'success');
        },
        error: (err: any) => {
          this.isSaving = false;
          const msg = err?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء إضافة الحدث' : 'Error adding event');
          this.eventFormError = msg;
        }
      });
    }
  }

  deleteEvent(id: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete(`https://qimma.runasp.net/api/schedule/${id}`, { headers }).subscribe({
      next: () => {
        this.events = this.events.filter(e => e.id !== id);
        this.showMessage(this.lang === 'ar' ? 'تم حذف الحدث' : 'Event deleted', 'success');
      }
    });
  }

  get filteredEvents() {
    if (!this.searchQuery) return this.events;
    const q = this.searchQuery.toLowerCase();
    return this.events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.courseTitle.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q))
    );
  }

  get filteredCourses() {
    if (!this.searchQuery) return this.courses;
    return this.courses.filter(c =>
      c.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get filteredStudents() {
    if (!this.searchQuery) return this.enrolledStudents;
    return this.enrolledStudents.filter(s =>
      s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (s.phoneNumber && s.phoneNumber.includes(this.searchQuery))
    );
  }

  fetchUserProfile() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('https://qimma.runasp.net/api/user/profile', { headers }).subscribe({
      next: (data: any) => {
        this.userData = data;
      },
      error: () => this.logout()
    });
  }

  openSettings() {
    this.isMobileSidebarOpen = false;
    this.editProfileData = {
      fullName: this.userData?.username || '',
      email: this.userData?.email || '',
      phone: this.userData?.phoneNumber?.split(' ')[1] || '',
      countryCode: this.userData?.phoneNumber?.split(' ')[0] || '+20',
      bio: this.userData?.bio || '',
      profileImage: this.userData?.profileImage || '',
      specialization: this.userData?.specialization || '',
      coverImage: this.userData?.coverImage || '',
      newPassword: ''
    };
    this.originalProfileData = JSON.stringify(this.editProfileData);
    this.showSettingsModal = true;
  }

  closeSettings() {
    if (JSON.stringify(this.editProfileData) !== this.originalProfileData) {
      this.showUnsavedModal = true;
    } else {
      this.showSettingsModal = false;
    }
  }

  confirmDiscard() {
    this.showUnsavedModal = false;
    this.showSettingsModal = false;
  }

  cancelDiscard() {
    this.showUnsavedModal = false;
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      this.showMessage(this.lang === 'ar' ? 'حجم الصورة الشخصية يتجاوز الحد الأقصى (1 ميجابايت)' : 'Profile image exceeds maximum size (1 MB)', 'error');
      event.target.value = '';
      return;
    }
    event.target.value = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      this.cropImageSrc = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        this.cropType = 'avatar';
        this.cropContainerWidth = 300;
        this.cropContainerHeight = 300;
        const ratio = Math.max(300 / img.width, 300 / img.height);
        this.baseImageW = img.width * ratio;
        this.baseImageH = img.height * ratio;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.showCropModal = true;
      };
      img.src = this.cropImageSrc;
    };
    reader.readAsDataURL(file);
  }

  onCoverSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      this.showMessage(this.lang === 'ar' ? 'حجم صورة الغلاف يتجاوز الحد الأقصى (1 ميجابايت)' : 'Cover image exceeds maximum size (1 MB)', 'error');
      event.target.value = '';
      return;
    }
    event.target.value = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      this.cropImageSrc = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        this.cropType = 'cover';
        this.cropContainerWidth = 380;
        this.cropContainerHeight = 160;
        const ratio = Math.max(380 / img.width, 160 / img.height);
        this.baseImageW = img.width * ratio;
        this.baseImageH = img.height * ratio;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.showCropModal = true;
      };
      img.src = this.cropImageSrc;
    };
    reader.readAsDataURL(file);
  }

  startDrag(e: MouseEvent | TouchEvent) {
    this.isDragging = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    this.startX = clientX - this.panX;
    this.startY = clientY - this.panY;
  }

  onDrag(e: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    this.panX = clientX - this.startX;
    this.panY = clientY - this.startY;
  }

  zoomIn() {
    this.zoom = Math.min(5.0, Number((this.zoom + 0.15).toFixed(2)));
  }

  zoomOut() {
    this.zoom = Math.max(0.1, Number((this.zoom - 0.15).toFixed(2)));
  }

  resetZoom() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
  }

  onWheelZoom(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    this.zoom = Math.min(Math.max(Number((this.zoom + delta).toFixed(2)), 0.1), 5.0);
  }

  applyCrop() {
    this.isUploadingImage = true;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let outW = 600;
      let outH = 600;

      if (this.cropType === 'cover') {
        outW = 1140;
        outH = 480;
      } else if (this.cropType === 'courseCover' || this.cropType === 'editCourseCover') {
        outW = 800;
        outH = 450;
      }

      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleMultiplier = outW / this.cropContainerWidth;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2 + (this.panX * scaleMultiplier), canvas.height / 2 + (this.panY * scaleMultiplier));
      ctx.scale(this.zoom * scaleMultiplier, this.zoom * scaleMultiplier);
      ctx.drawImage(img, -this.baseImageW / 2, -this.baseImageH / 2, this.baseImageW, this.baseImageH);

      if (this.cropType === 'courseCover') {
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        this.imagePreview = compressed;
        this.courseForm.patchValue({ coverImageUrl: compressed });
        this.showCropModal = false;
        this.isUploadingImage = false;
        return;
      }

      if (this.cropType === 'editCourseCover') {
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        this.editCourseImagePreview = compressed;
        this.editCourseForm.patchValue({ coverImageUrl: compressed });
        this.showCropModal = false;
        this.isUploadingImage = false;
        return;
      }

      const isAvatar = this.cropType === 'avatar';
      const endpoint = isAvatar ? 'https://qimma.runasp.net/api/user/upload-avatar' : 'https://qimma.runasp.net/api/user/upload-cover';
      const fileName = isAvatar ? 'avatar.jpg' : 'cover.jpg';

      canvas.toBlob((blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append('file', new File([blob], fileName, { type: 'image/jpeg' }));
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.post(endpoint, formData, { headers }).subscribe({
          next: (res: any) => {
            if (isAvatar) {
              this.editProfileData.profileImage = res.profileImage;
              this.userData.profileImage = res.profileImage;
            } else {
              this.editProfileData.coverImage = res.coverImage;
              this.userData.coverImage = res.coverImage;
            }
            this.showCropModal = false;
            this.isUploadingImage = false;
            this.showMessage(this.lang === 'ar' ? 'تم تحديث الصورة بنجاح' : 'Image updated successfully', 'success');
          },
          error: () => {
            this.isUploadingImage = false;
            this.showMessage(this.lang === 'ar' ? 'فشل رفع الصورة' : 'Upload failed', 'error');
          }
        });
      }, 'image/jpeg', 0.9);
    };
    img.src = this.cropImageSrc as string;
  }

  saveProfile() {
    this.isSaving = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const updateModel: any = {
      username: this.editProfileData.fullName,
      phoneNumber: this.editProfileData.countryCode + ' ' + this.editProfileData.phone,
      bio: this.editProfileData.bio,
      specialization: this.editProfileData.specialization
    };
    if (this.editProfileData.newPassword && this.editProfileData.newPassword.trim()) {
      updateModel.newPassword = this.editProfileData.newPassword.trim();
    }

    this.http.put('https://qimma.runasp.net/api/user/profile', updateModel, { headers }).subscribe({
      next: () => {
        this.userData.username = this.editProfileData.fullName;
        this.userData.phoneNumber = updateModel.phoneNumber;
        this.userData.bio = updateModel.bio;
        this.userData.specialization = updateModel.specialization;
        this.editProfileData.newPassword = '';
        this.originalProfileData = JSON.stringify(this.editProfileData);
        this.isSaving = false;
        this.showSettingsModal = false;
        this.showMessage(this.lang === 'ar' ? 'تم حفظ التعديلات بنجاح' : 'Profile updated successfully', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.showMessage(this.lang === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error updating profile', 'error');
      }
    });
  }

  toggleLang() {
    this.langService.toggleLanguage();
    if (this.activeTab === 'dashboard' && this.chart) {
      this.loadDashboardStats(); 
    }
  }

  get isDarkMode(): boolean {
    return this.themeService.isDark;
  }

  toggleDarkMode() {
    this.themeService.toggleTheme();
  }

  getCoverImageUrl(url: string | null | undefined): string {
    if (!url || url.trim() === '' || url.includes('placeholder')) {
      return 'assets/images/default-cover.jpg';
    }
    if (url.includes('localhost:5162')) {
      url = url.replace('http://localhost:5162', 'https://qimma.runasp.net');
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('assets/')) {
      return url;
    }
    if (url.startsWith('/assets/')) {
      return url.substring(1);
    }
    return `https://qimma.runasp.net${url.startsWith('/') ? '' : '/'}${url}`;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      this.showMessage(this.lang === 'ar' ? 'حجم غلاف الكورس يتجاوز الحد الأقصى (1 ميجابايت)' : 'Course cover exceeds maximum size (1 MB)', 'error');
      event.target.value = '';
      return;
    }
    event.target.value = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      this.cropImageSrc = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        this.cropType = 'courseCover';
        this.cropContainerWidth = 380;
        this.cropContainerHeight = 214;
        const ratio = Math.max(380 / img.width, 214 / img.height);
        this.baseImageW = img.width * ratio;
        this.baseImageH = img.height * ratio;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.showCropModal = true;
      };
      img.src = this.cropImageSrc;
    };
    reader.readAsDataURL(file);
  }

  onViewCourse(course: any) {
    this.router.navigate(['/course', course.id]);
  }

  loadMyCourses() {
    if (this.courses.length === 0) this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any[]>('https://qimma.runasp.net/api/course/instructor-courses', { headers }).subscribe({
      next: (data: any[]) => {
        this.courses = data || [];
        if ((!this.topCourses || this.topCourses.length === 0) && this.courses.length > 0) {
          this.topCourses = this.courses.slice(0, 10).map(c => ({
            id: c.id,
            title: c.title,
            studentsCount: c.studentsCount || c.enrollmentsCount || 0,
            completionPercentage: c.completionPercentage || 0,
            coverImageUrl: c.coverImageUrl
          })).sort((a, b) => {
            const diff = (b.completionPercentage || 0) - (a.completionPercentage || 0);
            if (diff !== 0) return diff;
            return (b.studentsCount || 0) - (a.studentsCount || 0);
          });
        }
        if (this.activeTab === 'dashboard') {
          this.renderCourseDistributionChart();
        }
        this.isLoading = false;
        this.isLoadingTopMetrics = false;
      },
      error: () => {
        this.courses = [];
        this.isLoadingTopMetrics = false;
        this.isLoading = false;
      }
    });
  }

  loadStudentsForCourse(courseId: number) {
    this.isLoadingStudents = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`https://qimma.runasp.net/api/quiz/course/${courseId}/students`, { headers }).subscribe({
      next: (data) => {
        this.enrolledStudents = data || [];
        this.isLoadingStudents = false;
      },
      error: () => {
        this.enrolledStudents = [];
        this.isLoadingStudents = false;
      }
    });
  }

  loadStudentQuizResults(studentId: number, courseId: number) {
    this.isLoadingStudents = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`https://qimma.runasp.net/api/course/${courseId}/lessons`, { headers }).subscribe({
      next: (lessons) => {
        const groups = new Map<number, any>();
        
        (lessons || []).forEach(l => {
          groups.set(l.id, {
            lessonId: l.id,
            lessonTitle: l.title,
            attempts: [],
            assignment: null,
            expanded: false
          });
        });

        this.http.get<any[]>(`https://qimma.runasp.net/api/quiz/course/${courseId}/student/${studentId}/results`, { headers }).subscribe({
          next: (quizData) => {
            (quizData || []).forEach(item => {
              const lessonGroup = Array.from(groups.values()).find(g => g.lessonId === item.lessonId || g.lessonTitle === item.lessonTitle);
              if (lessonGroup) {
                lessonGroup.attempts.push(item);
              }
            });

            this.http.get<any[]>(`https://qimma.runasp.net/api/assignments/course/${courseId}`, { headers }).subscribe({
              next: (allAssignments) => {
                
                this.assignmentService.getSubmissionsForGrading(courseId, studentId).subscribe({
                  next: (subData) => {
                    (subData || []).forEach(sub => {
                      const assignmentRef = (allAssignments || []).find(a => a.id === sub.assignmentId);
                      const targetLessonId = assignmentRef?.lessonId;
                      
                      let lessonGroup = targetLessonId ? groups.get(targetLessonId) : null;
                      
                      if (!lessonGroup) {
                        lessonGroup = {
                          lessonId: targetLessonId || Date.now(),
                          lessonTitle: sub.assignmentTitle,
                          attempts: [],
                          assignment: null,
                          expanded: false
                        };
                        groups.set(lessonGroup.lessonId, lessonGroup);
                      }

                      lessonGroup.assignment = {
                        id: sub.id,
                        title: sub.assignmentTitle,
                        givenScore: sub.givenScore,
                        totalScore: sub.totalScore,
                        answers: (sub.answers || []).map((a: any) => {
                          const isMcq = (a.questionType || '').toLowerCase() === 'mcq' || (a.questionType || '').toLowerCase() === 'quiz';
                          let isCorrect: boolean | null = null;
                          if (isMcq) {
                            if (a.isCorrect !== undefined && a.isCorrect !== null) {
                              isCorrect = !!a.isCorrect;
                            } else if (a.correctAnswer && a.answerText) {
                              isCorrect = a.answerText.trim().toLowerCase() === a.correctAnswer.trim().toLowerCase();
                            } else if (a.score !== null && a.score !== undefined) {
                              isCorrect = a.score > 0;
                            } else {
                              isCorrect = false;
                            }
                          }

                          return {
                            question: a.questionText,
                            answer: a.answerText,
                            type: (a.questionType || '').toLowerCase(),
                            score: a.score,
                            correctAnswer: a.correctAnswer,
                            isCorrect: isCorrect
                          };
                        })
                      };
                    });

                    this.groupedStudentResults = Array.from(groups.values());
                    this.isLoadingStudents = false;
                  },
                  error: () => {
                    this.groupedStudentResults = Array.from(groups.values());
                    this.isLoadingStudents = false;
                  }
                });
              },
              error: () => {
                  this.groupedStudentResults = Array.from(groups.values());
                  this.isLoadingStudents = false;
              }
            });
          },
          error: () => {
            this.groupedStudentResults = Array.from(groups.values());
            this.isLoadingStudents = false;
          }
        });
      },
      error: () => {
        this.groupedStudentResults = [];
        this.isLoadingStudents = false;
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error' = 'success') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  openDeleteModal(courseId: number) {
    this.courseToDeleteId = courseId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.courseToDeleteId = null;
  }

  confirmDelete() {
    if (this.courseToDeleteId) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.delete(`https://qimma.runasp.net/api/course/${this.courseToDeleteId}`, { headers }).subscribe({
        next: () => {
          this.showMessage(this.t[this.lang].deleteSuccessMsg, 'success');
          this.loadMyCourses();
          this.closeDeleteModal();
        },
        error: () => {
          this.showMessage(this.t[this.lang].errorMsg, 'error');
          this.closeDeleteModal();
        }
      });
    }
  }

  openEditCourseModal(course: any) {
    this.selectedCourseToEdit = course;
    this.editCourseError = null;
    this.editCourseImagePreview = course.coverImageUrl ? this.getCoverImageUrl(course.coverImageUrl) : null;
    this.editCourseForm.patchValue({
      title: course.title,
      description: course.description,
      isFree: course.isFree,
      price: course.price,
      discountPercentage: course.discountPercentage,
      coverImageUrl: course.coverImageUrl || ''
    });
    this.showEditCourseModal = true;
  }

  closeEditCourseModal() {
    this.showEditCourseModal = false;
    this.editCourseError = null;
    this.selectedCourseToEdit = null;
    this.editCourseImagePreview = null;
    this.editCourseForm.reset();
  }

  onEditFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      this.showMessage(this.lang === 'ar' ? 'حجم غلاف الكورس يتجاوز الحد الأقصى (1 ميجابايت)' : 'Course cover exceeds maximum size (1 MB)', 'error');
      event.target.value = '';
      return;
    }
    event.target.value = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      this.cropImageSrc = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        this.cropType = 'editCourseCover';
        this.cropContainerWidth = 380;
        this.cropContainerHeight = 214;
        const ratio = Math.max(380 / img.width, 214 / img.height);
        this.baseImageW = img.width * ratio;
        this.baseImageH = img.height * ratio;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.showCropModal = true;
      };
      img.src = this.cropImageSrc;
    };
    reader.readAsDataURL(file);
  }

  saveCourseEdit() {
    if (!this.selectedCourseToEdit || !this.editCourseForm.valid) return;
    const val = this.editCourseForm.value;
    if (val.title && val.title.startsWith(' ')) {
      const msg = this.lang === 'ar' ? 'لا يمكن أن يبدأ عنوان الكورس بمسافة فارغة.' : 'Course title cannot begin with a space.';
      this.editCourseError = msg;
      return;
    }
    if (val.description && val.description.startsWith(' ')) {
      const msg = this.lang === 'ar' ? 'لا يمكن أن يبدأ وصف الكورس بمسافة فارغة.' : 'Course description cannot begin with a space.';
      this.editCourseError = msg;
      return;
    }
    if (!val.isFree) {
      if (val.price === null || val.price === undefined || val.price <= 0) {
        const msg = this.lang === 'ar' ? 'يجب أن يكون سعر الكورس المدفوع أكبر من صفر.' : 'Paid course price must be greater than zero.';
        this.editCourseError = msg;
        return;
      }
      if (val.discountPercentage !== null && val.discountPercentage !== undefined && val.discountPercentage !== '') {
        const disc = Number(val.discountPercentage);
        if (disc < 0 || disc > 100) {
          const msg = this.lang === 'ar' ? 'نسبة الخصم يجب أن تكون بين 0 و 100%.' : 'Discount percentage must be between 0 and 100%.';
          this.editCourseError = msg;
          return;
        }
      }
    }

    this.isSaving = true;
    this.editCourseError = null;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const payload = this.editCourseForm.value;
    this.http.put<any>(`https://qimma.runasp.net/api/course/${this.selectedCourseToEdit.id}`, payload, { headers }).subscribe({
      next: (updatedCourse) => {
        this.isSaving = false;
        this.editCourseError = null;
        this.showMessage(this.lang === 'ar' ? 'تم تحديث بيانات الكورس بنجاح!' : 'Course details updated successfully!', 'success');
        const index = this.courses.findIndex(c => c.id === this.selectedCourseToEdit.id);
        if (index !== -1 && updatedCourse) {
          this.courses[index] = { ...this.courses[index], ...updatedCourse };
        }
        this.closeEditCourseModal();
        this.loadMyCourses();
      },
      error: (err: any) => {
        this.isSaving = false;
        const msg = err?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء تحديث بيانات الكورس.' : 'Error updating course details.');
        this.editCourseError = msg;
      }
    });
  }

  onSubmit() {
    if (this.courseForm.valid) {
      const val = this.courseForm.value;
      if (val.title && val.title.startsWith(' ')) {
        this.createCourseError = this.lang === 'ar' ? 'لا يمكن أن يبدأ عنوان الكورس بمسافة فارغة.' : 'Course title cannot begin with a space.';
        return;
      }
      if (val.description && val.description.startsWith(' ')) {
        this.createCourseError = this.lang === 'ar' ? 'لا يمكن أن يبدأ وصف الكورس بمسافة فارغة.' : 'Course description cannot begin with a space.';
        return;
      }
      if (!val.isFree) {
        if (val.price === null || val.price === undefined || val.price <= 0) {
          this.createCourseError = this.lang === 'ar' ? 'يجب أن يكون سعر الكورس المدفوع أكبر من صفر.' : 'Paid course price must be greater than zero.';
          return;
        }
        if (val.discountPercentage !== null && val.discountPercentage !== undefined && val.discountPercentage !== '') {
          const disc = Number(val.discountPercentage);
          if (disc < 0 || disc > 100) {
            this.createCourseError = this.lang === 'ar' ? 'نسبة الخصم يجب أن تكون بين 0 و 100%.' : 'Discount percentage must be between 0 and 100%.';
            return;
          }
        }
      }

      this.isSaving = true;
      this.createCourseError = null;
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.post<any>('https://qimma.runasp.net/api/course', this.courseForm.value, { headers }).subscribe({
        next: (newCourse) => {
          this.showMessage(this.t[this.lang].successMsg, 'success');
          this.createCourseError = null;
          this.courseForm.reset();
          this.imagePreview = null;
          this.isSaving = false;
          
          if(newCourse) {
            this.courses.unshift(newCourse);
          }
          this.loadMyCourses();
          
          setTimeout(() => {
            this.showCreateForm = false;
            this.router.navigate(['/teacher-dashboard'], { queryParams: { tab: 'courses' } });
          }, 1500);
        },
        error: (err: any) => {
          this.isSaving = false;
          this.createCourseError = err?.error?.message || this.t[this.lang].errorMsg;
        }
      });
    }
  }

  getCorrectCount(assignment: any): number {
    if (!assignment || !assignment.answers) return 0;
    return assignment.answers.filter((a: any) => a.type === 'mcq' && a.isCorrect === true).length;
  }

  getIncorrectCount(assignment: any): number {
    if (!assignment || !assignment.answers) return 0;
    return assignment.answers.filter((a: any) => a.type === 'mcq' && a.isCorrect === false).length;
  }

  getEssayCount(assignment: any): number {
    if (!assignment || !assignment.answers) return 0;
    return assignment.answers.filter((a: any) => a.type !== 'mcq').length;
  }

  // ==========================================
  // COURSE ENROLLEES MANAGEMENT (Image 2)
  // ==========================================
  openEnrolleesForCourse(courseId: number) {
    this.selectedCourseIdForEnrollees = courseId;
    this.activeTab = 'enrollees';
    this.router.navigate(['/teacher-dashboard'], { queryParams: { tab: 'enrollees', courseId } });
    this.loadCourseEnrollees();
    this.loadAvailableStudents();
  }

  onEnrolleeCourseSelected() {
    this.loadCourseEnrollees();
  }

  getSelectedEnrolleeCourseTitle(): string {
    if (!this.selectedCourseIdForEnrollees) return '';
    const course = this.courses.find(c => c.id === this.selectedCourseIdForEnrollees);
    return course ? course.title : '';
  }

  loadCourseEnrollees() {
    if (!this.selectedCourseIdForEnrollees) return;
    this.isLoadingEnrollees = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`https://qimma.runasp.net/api/instructor/dashboard/courses/${this.selectedCourseIdForEnrollees}/enrollees`, { headers }).subscribe({
      next: (res) => {
        this.courseEnrollees = res || [];
        this.isLoadingEnrollees = false;
      },
      error: (err) => {
        // Fallback to Admin enrollees endpoint if instructor endpoint returns 404
        if (err?.status === 404 || err?.status === 401 || err?.status === 403) {
          this.http.get<any[]>(`https://qimma.runasp.net/api/admin/courses/${this.selectedCourseIdForEnrollees}/enrollees`, { headers }).subscribe({
            next: (adminRes) => {
              this.courseEnrollees = (adminRes || []).map((e: any) => ({
                studentId: e.studentId,
                studentName: e.studentName,
                email: e.email,
                phoneNumber: e.phoneNumber,
                profileImage: e.profileImage,
                totalXP: e.totalXP,
                enrolledAt: e.enrolledAt
              }));
              this.isLoadingEnrollees = false;
            },
            error: () => {
              this.isLoadingEnrollees = false;
              this.showMessage(this.lang === 'ar' ? 'فشل تحميل قائمة الطلاب المسجلين' : 'Failed to load enrollees', 'error');
            }
          });
        } else {
          this.isLoadingEnrollees = false;
          this.showMessage(this.lang === 'ar' ? 'فشل تحميل قائمة الطلاب المسجلين' : 'Failed to load enrollees', 'error');
        }
      }
    });
  }

  loadAvailableStudents() {
    this.isLoadingAvailableStudents = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('https://qimma.runasp.net/api/instructor/dashboard/students/available', { headers }).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.availablePlatformStudents = res;
          this.isLoadingAvailableStudents = false;
        } else {
          this.fallbackLoadAdminStudents(headers);
        }
      },
      error: () => {
        this.fallbackLoadAdminStudents(headers);
      }
    });
  }

  private fallbackLoadAdminStudents(headers: HttpHeaders) {
    this.http.get<any[]>('https://qimma.runasp.net/api/admin/students', { headers }).subscribe({
      next: (adminRes) => {
        this.availablePlatformStudents = (adminRes || []).map((s: any) => ({
          id: s.id,
          username: s.username,
          email: s.email,
          phoneNumber: s.phoneNumber,
          profileImage: s.profileImage,
          totalXP: s.totalXP || 0
        }));
        this.isLoadingAvailableStudents = false;
      },
      error: () => {
        this.isLoadingAvailableStudents = false;
      }
    });
  }

  openEnrollStudentModal() {
    this.studentIdToEnroll = null;
    this.showEnrollModal = true;
    this.loadAvailableStudents();
  }

  submitEnrollStudent() {
    if (!this.selectedCourseIdForEnrollees || !this.studentIdToEnroll) return;
    this.isSubmittingEnroll = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post(`https://qimma.runasp.net/api/instructor/dashboard/courses/${this.selectedCourseIdForEnrollees}/enroll`, 
      { studentId: this.studentIdToEnroll }, 
      { headers }
    ).subscribe({
      next: () => {
        this.isSubmittingEnroll = false;
        this.showEnrollModal = false;
        this.showMessage(this.lang === 'ar' ? 'تم تسجيل الطالب في الكورس بنجاح' : 'Student enrolled successfully.', 'success');
        this.loadCourseEnrollees();
        this.loadMyCourses();
        this.loadDashboardStats();
      },
      error: (err) => {
        // Fallback to Admin enroll endpoint if instructor endpoint returns 404
        if (err?.status === 404 || err?.status === 401 || err?.status === 403) {
          this.http.post(`https://qimma.runasp.net/api/admin/courses/${this.selectedCourseIdForEnrollees}/enroll`,
            { studentId: this.studentIdToEnroll },
            { headers }
          ).subscribe({
            next: () => {
              this.isSubmittingEnroll = false;
              this.showEnrollModal = false;
              this.showMessage(this.lang === 'ar' ? 'تم تسجيل الطالب في الكورس بنجاح' : 'Student enrolled successfully.', 'success');
              this.loadCourseEnrollees();
              this.loadMyCourses();
              this.loadDashboardStats();
            },
            error: (adminErr) => {
              this.isSubmittingEnroll = false;
              const errMsg = adminErr?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء تسجيل الطالب' : 'Error enrolling student');
              this.showMessage(errMsg, 'error');
            }
          });
        } else {
          this.isSubmittingEnroll = false;
          const errMsg = err?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء تسجيل الطالب' : 'Error enrolling student');
          this.showMessage(errMsg, 'error');
        }
      }
    });
  }

  openUnenrollConfirm(enrollee: any) {
    this.enrolleeToUnenroll = enrollee;
    this.showUnenrollModal = true;
  }

  confirmUnenrollStudent() {
    if (!this.selectedCourseIdForEnrollees || !this.enrolleeToUnenroll) return;
    this.isSubmittingEnroll = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`https://qimma.runasp.net/api/instructor/dashboard/courses/${this.selectedCourseIdForEnrollees}/enroll/${this.enrolleeToUnenroll.studentId}`, { headers }).subscribe({
      next: () => {
        this.isSubmittingEnroll = false;
        this.showUnenrollModal = false;
        this.showMessage(this.lang === 'ar' ? 'تم إلغاء اشتراك الطالب بنجاح' : 'Student removed successfully.', 'success');
        this.loadCourseEnrollees();
        this.loadMyCourses();
        this.loadDashboardStats();
      },
      error: (err) => {
        // Fallback to admin delete enrollment endpoint if 404
        if (err?.status === 404 || err?.status === 401 || err?.status === 403) {
          this.http.delete(`https://qimma.runasp.net/api/admin/courses/${this.selectedCourseIdForEnrollees}/enroll/${this.enrolleeToUnenroll.studentId}`, { headers }).subscribe({
            next: () => {
              this.isSubmittingEnroll = false;
              this.showUnenrollModal = false;
              this.showMessage(this.lang === 'ar' ? 'تم إلغاء اشتراك الطالب بنجاح' : 'Student removed successfully.', 'success');
              this.loadCourseEnrollees();
              this.loadMyCourses();
              this.loadDashboardStats();
            },
            error: (adminErr) => {
              this.isSubmittingEnroll = false;
              const errMsg = adminErr?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء إلغاء اشتراك الطالب' : 'Error removing student');
              this.showMessage(errMsg, 'error');
            }
          });
        } else {
          this.isSubmittingEnroll = false;
          const errMsg = err?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء إلغاء اشتراك الطالب' : 'Error removing student');
          this.showMessage(errMsg, 'error');
        }
      }
    });
  }

  // ========================================================
  // COMPREHENSIVE QUIZ STATE & METHODS
  // ========================================================
  showComprehensiveQuizModal = false;
  comprehensiveQuizCourseId: number | null = null;
  isComprehensiveQuizLoading = false;
  isComprehensiveQuizSaving = false;
  isComprehensiveQuizEditMode = false;
  comprehensiveQuizQuestions: any[] = [];
  comprehensiveQuizError = '';

  openComprehensiveQuizModal(defaultCourseId?: number) {
    this.comprehensiveQuizError = '';
    this.comprehensiveQuizCourseId = defaultCourseId || (this.courses.length > 0 ? this.courses[0].id : null);
    this.showComprehensiveQuizModal = true;
    if (this.comprehensiveQuizCourseId) {
      this.loadComprehensiveQuizForCourse(this.comprehensiveQuizCourseId);
    } else {
      this.resetComprehensiveQuizForm();
    }
  }

  closeComprehensiveQuizModal() {
    this.showComprehensiveQuizModal = false;
    this.comprehensiveQuizError = '';
  }

  onComprehensiveQuizCourseChange() {
    if (this.comprehensiveQuizCourseId) {
      this.loadComprehensiveQuizForCourse(this.comprehensiveQuizCourseId);
    } else {
      this.resetComprehensiveQuizForm();
    }
  }

  resetComprehensiveQuizForm() {
    this.isComprehensiveQuizEditMode = false;
    this.comprehensiveQuizQuestions = [
      { text: '', imageUrl: '', options: ['', '', '', ''], correctIndex: 0 }
    ];
  }

  loadComprehensiveQuizForCourse(courseId: number) {
    this.isComprehensiveQuizLoading = true;
    this.comprehensiveQuizError = '';
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`https://qimma.runasp.net/api/quiz/course-exam/${courseId}`, { headers }).subscribe({
      next: (res) => {
        this.isComprehensiveQuizLoading = false;
        if (res && res.questions && res.questions.length > 0) {
          this.isComprehensiveQuizEditMode = true;
          this.comprehensiveQuizQuestions = res.questions.map((q: any) => ({
            text: q.text || '',
            imageUrl: q.imageUrl || '',
            options: q.options && q.options.length >= 2 ? [...q.options] : ['', '', '', ''],
            correctIndex: q.correctIndex >= 0 ? q.correctIndex : 0
          }));
        } else {
          this.resetComprehensiveQuizForm();
        }
      },
      error: () => {
        this.isComprehensiveQuizLoading = false;
        this.resetComprehensiveQuizForm();
      }
    });
  }

  addComprehensiveQuizQuestion() {
    this.comprehensiveQuizQuestions.push({
      text: '',
      imageUrl: '',
      options: ['', '', '', ''],
      correctIndex: 0
    });
  }

  removeComprehensiveQuizQuestion(index: number) {
    if (this.comprehensiveQuizQuestions.length > 1) {
      this.comprehensiveQuizQuestions.splice(index, 1);
    }
  }

  addComprehensiveQuizOption(q: any) {
    if (q.options.length < 6) {
      q.options.push('');
    }
  }

  removeComprehensiveQuizOption(q: any, oIdx: number) {
    if (q.options.length > 2) {
      q.options.splice(oIdx, 1);
      if (q.correctIndex >= q.options.length) {
        q.correctIndex = q.options.length - 1;
      }
    }
  }

  saveComprehensiveQuiz() {
    this.comprehensiveQuizError = '';
    if (!this.comprehensiveQuizCourseId) {
      this.comprehensiveQuizError = this.lang === 'ar' ? 'يرجى اختيار الكورس أولاً.' : 'Please select a course first.';
      return;
    }

    for (let i = 0; i < this.comprehensiveQuizQuestions.length; i++) {
      const q = this.comprehensiveQuizQuestions[i];
      if (!q.text || !q.text.trim()) {
        this.comprehensiveQuizError = this.lang === 'ar' ? `يرجى إدخال نص السؤال #${i + 1}.` : `Please enter text for question #${i + 1}.`;
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          this.comprehensiveQuizError = this.lang === 'ar' ? `يرجى ملء جميع خيارات السؤال #${i + 1}.` : `Please fill out all options for question #${i + 1}.`;
          return;
        }
      }
    }

    this.isComprehensiveQuizSaving = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const payload = {
      courseId: this.comprehensiveQuizCourseId,
      lessonId: null,
      questions: this.comprehensiveQuizQuestions.map(q => ({
        text: q.text.trim(),
        imageUrl: q.imageUrl || '',
        options: q.options.map((opt: string) => opt.trim()),
        correctIndex: q.correctIndex
      }))
    };

    this.http.post('https://qimma.runasp.net/api/quiz/create', payload, { headers }).subscribe({
      next: () => {
        this.isComprehensiveQuizSaving = false;
        this.showComprehensiveQuizModal = false;
        this.showMessage(this.lang === 'ar' ? 'تم حفظ الاختبار الشامل بنجاح وإرسال إشعار للطلاب! 🚀' : 'Comprehensive course exam saved successfully and students notified! 🚀', 'success');
        this.loadDashboardStats();
      },
      error: (err) => {
        this.isComprehensiveQuizSaving = false;
        this.comprehensiveQuizError = err?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء حفظ الاختبار الشامل.' : 'Error saving comprehensive exam.');
      }
    });
  }

  deleteComprehensiveQuiz() {
    if (!this.comprehensiveQuizCourseId) return;
    this.isComprehensiveQuizSaving = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`https://qimma.runasp.net/api/quiz/course-exam/${this.comprehensiveQuizCourseId}`, { headers }).subscribe({
      next: () => {
        this.isComprehensiveQuizSaving = false;
        this.showComprehensiveQuizModal = false;
        this.showMessage(this.lang === 'ar' ? 'تم حذف الاختبار الشامل بنجاح.' : 'Comprehensive exam deleted successfully.', 'success');
        this.loadDashboardStats();
      },
      error: (err) => {
        this.isComprehensiveQuizSaving = false;
        this.comprehensiveQuizError = err?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء حذف الاختبار.' : 'Error deleting exam.');
      }
    });
  }

  // ========================================================
  // COMPREHENSIVE ASSIGNMENT STATE & METHODS
  // ========================================================
  showComprehensiveAssignmentModal = false;
  comprehensiveAssignmentCourseId: number | null = null;
  isComprehensiveAssignmentLoading = false;
  isComprehensiveAssignmentSaving = false;
  isComprehensiveAssignmentEditMode = false;
  comprehensiveAssignmentId: number | null = null;
  comprehensiveAssignmentData: any = {
    title: '',
    description: '',
    dueDate: '',
    questions: []
  };
  comprehensiveAssignmentError = '';

  openComprehensiveAssignmentModal(defaultCourseId?: number) {
    this.comprehensiveAssignmentError = '';
    this.comprehensiveAssignmentCourseId = defaultCourseId || (this.courses.length > 0 ? this.courses[0].id : null);
    this.showComprehensiveAssignmentModal = true;
    if (this.comprehensiveAssignmentCourseId) {
      this.loadComprehensiveAssignmentForCourse(this.comprehensiveAssignmentCourseId);
    } else {
      this.resetComprehensiveAssignmentForm();
    }
  }

  closeComprehensiveAssignmentModal() {
    this.showComprehensiveAssignmentModal = false;
    this.comprehensiveAssignmentError = '';
  }

  onComprehensiveAssignmentCourseChange() {
    if (this.comprehensiveAssignmentCourseId) {
      this.loadComprehensiveAssignmentForCourse(this.comprehensiveAssignmentCourseId);
    } else {
      this.resetComprehensiveAssignmentForm();
    }
  }

  resetComprehensiveAssignmentForm() {
    this.isComprehensiveAssignmentEditMode = false;
    this.comprehensiveAssignmentId = null;
    const selectedCourse = this.courses.find(c => c.id === this.comprehensiveAssignmentCourseId);
    const defaultTitle = selectedCourse ? (this.lang === 'ar' ? `واجب شامل - ${selectedCourse.title}` : `Comprehensive Assignment - ${selectedCourse.title}`) : '';
    this.comprehensiveAssignmentData = {
      title: defaultTitle,
      description: '',
      dueDate: this.getLocalDateTimeString(),
      questions: [
        { text: '', type: 'mcq', options: ['', '', '', ''], correctIndex: 0 }
      ]
    };
  }

  loadComprehensiveAssignmentForCourse(courseId: number) {
    this.isComprehensiveAssignmentLoading = true;
    this.comprehensiveAssignmentError = '';

    this.assignmentService.getAssignmentsByCourse(courseId).subscribe({
      next: (assignments) => {
        this.isComprehensiveAssignmentLoading = false;
        const comp = assignments ? assignments.find((a: any) => !a.lessonId || a.lessonId === 0) : null;
        if (comp) {
          this.isComprehensiveAssignmentEditMode = true;
          this.comprehensiveAssignmentId = comp.id;
          this.comprehensiveAssignmentData = {
            title: comp.title || '',
            description: comp.description || '',
            dueDate: comp.dueDate ? comp.dueDate.slice(0, 16) : this.getLocalDateTimeString(),
            questions: comp.questions && comp.questions.length > 0 ? comp.questions.map((q: any) => ({
              text: q.questionText || '',
              type: q.type === 'essay' ? 'written' : 'mcq',
              options: q.options ? q.options.split(',').map((o: string) => o.trim()) : ['', '', '', ''],
              correctIndex: q.options ? Math.max(0, q.options.split(',').map((o: string) => o.trim()).indexOf((q.correctAnswer || '').trim())) : 0
            })) : [{ text: '', type: 'mcq', options: ['', '', '', ''], correctIndex: 0 }]
          };
        } else {
          this.resetComprehensiveAssignmentForm();
        }
      },
      error: () => {
        this.isComprehensiveAssignmentLoading = false;
        this.resetComprehensiveAssignmentForm();
      }
    });
  }

  addComprehensiveAssignmentQuestion() {
    this.comprehensiveAssignmentData.questions.push({
      text: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correctIndex: 0
    });
  }

  removeComprehensiveAssignmentQuestion(index: number) {
    if (this.comprehensiveAssignmentData.questions.length > 1) {
      this.comprehensiveAssignmentData.questions.splice(index, 1);
    }
  }

  onComprehensiveAssignmentTypeChange(q: any) {
    if (q.type === 'mcq' && (!q.options || q.options.length === 0)) {
      q.options = ['', '', '', ''];
      q.correctIndex = 0;
    }
  }

  saveComprehensiveAssignment() {
    this.comprehensiveAssignmentError = '';
    if (!this.comprehensiveAssignmentCourseId) {
      this.comprehensiveAssignmentError = this.lang === 'ar' ? 'يرجى اختيار الكورس أولاً.' : 'Please select a course first.';
      return;
    }
    if (!this.comprehensiveAssignmentData.title || !this.comprehensiveAssignmentData.title.trim()) {
      this.comprehensiveAssignmentError = this.lang === 'ar' ? 'يرجى كتابة عنوان الواجب الشامل.' : 'Please enter the comprehensive assignment title.';
      return;
    }

    for (let i = 0; i < this.comprehensiveAssignmentData.questions.length; i++) {
      const q = this.comprehensiveAssignmentData.questions[i];
      if (!q.text || !q.text.trim()) {
        this.comprehensiveAssignmentError = this.lang === 'ar' ? `يرجى إدخال نص السؤال #${i + 1}.` : `Please enter text for question #${i + 1}.`;
        return;
      }
      if (q.type === 'mcq') {
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j] || !q.options[j].trim()) {
            this.comprehensiveAssignmentError = this.lang === 'ar' ? `يرجى ملء جميع خيارات السؤال #${i + 1}.` : `Please fill out all options for question #${i + 1}.`;
            return;
          }
        }
      }
    }

    this.isComprehensiveAssignmentSaving = true;
    const rawDue = this.comprehensiveAssignmentData.dueDate || this.getLocalDateTimeString();
    const formattedDue = rawDue.includes('T') ? (rawDue.length === 16 ? rawDue + ':00' : rawDue) : rawDue;

    const payload = {
      title: this.comprehensiveAssignmentData.title.trim(),
      description: this.comprehensiveAssignmentData.description || 'Comprehensive Course Assignment',
      dueDate: formattedDue,
      totalScore: this.comprehensiveAssignmentData.questions.length * 10,
      courseId: this.comprehensiveAssignmentCourseId,
      lessonId: null,
      questions: this.comprehensiveAssignmentData.questions.map((q: any) => ({
        questionText: q.text.trim(),
        type: q.type === 'written' ? 'essay' : 'mcq',
        options: q.type === 'mcq' ? q.options.map((opt: string) => opt.trim()).join(',') : null,
        correctAnswer: q.type === 'mcq' ? (q.options[q.correctIndex] || '').trim() : null,
        score: 10
      }))
    };

    this.assignmentService.createAssignment(payload).subscribe({
      next: () => {
        this.isComprehensiveAssignmentSaving = false;
        this.showComprehensiveAssignmentModal = false;
        this.showMessage(this.lang === 'ar' ? 'تم حفظ الواجب الشامل للكورس بنجاح! 🚀' : 'Comprehensive course assignment saved successfully! 🚀', 'success');
        this.loadDashboardStats();
      },
      error: (err: any) => {
        this.isComprehensiveAssignmentSaving = false;
        this.comprehensiveAssignmentError = err?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء حفظ الواجب الشامل.' : 'Error saving comprehensive assignment.');
      }
    });
  }

  deleteComprehensiveAssignment() {
    if (!this.comprehensiveAssignmentId) return;
    this.isComprehensiveAssignmentSaving = true;

    this.assignmentService.deleteAssignment(this.comprehensiveAssignmentId).subscribe({
      next: () => {
        this.isComprehensiveAssignmentSaving = false;
        this.showComprehensiveAssignmentModal = false;
        this.showMessage(this.lang === 'ar' ? 'تم حذف الواجب الشامل بنجاح.' : 'Comprehensive assignment deleted successfully.', 'success');
        this.loadDashboardStats();
      },
      error: (err: any) => {
        this.isComprehensiveAssignmentSaving = false;
        this.comprehensiveAssignmentError = err?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء حذف الواجب الشامل.' : 'Error deleting comprehensive assignment.');
      }
    });
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
}