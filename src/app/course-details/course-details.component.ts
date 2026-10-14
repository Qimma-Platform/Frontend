import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { CourseService } from '../services/course.service';
import { LanguageService } from '../services/language.service';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  template: `
    <div class="bg-slate-50 min-h-screen pb-12 font-sans relative" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      
      <div *ngIf="message" 
           [ngClass]="{'bg-emerald-50 text-emerald-700 border-emerald-200': messageType === 'success', 'bg-rose-50 text-rose-700 border-rose-200': messageType === 'error'}"
           class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[200] px-6 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-3 animate-fade-in transition-all">
        <span *ngIf="messageType === 'success'">✅</span>
        <span *ngIf="messageType === 'error'">❌</span>
        {{ message }}
      </div>

      <div *ngIf="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
        <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in">
          <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
          <h3 class="text-xl font-bold text-slate-900 text-center mb-2">{{ t[lang].deleteConfirmTitle }}</h3>
          <p class="text-sm text-slate-500 text-center mb-8">{{ t[lang].deleteConfirmDesc }}</p>
          <div class="flex gap-3">
            <button (click)="closeDeleteModal()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
              {{ t[lang].cancel }}
            </button>
            <button (click)="confirmDelete()" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-200">
              {{ t[lang].confirmDeleteBtn }}
            </button>
          </div>
        </div>
      </div>

      <header class="bg-[#130E35] text-white py-4 px-6 shadow-md relative overflow-hidden">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <button (click)="goBack()" class="text-slate-400 hover:text-white transition w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10">
              <span class="rtl:rotate-180 font-bold text-lg">←</span>
            </button>
            <div>
              <h1 class="text-lg font-extrabold">{{ course?.title || t[lang].loading }}</h1>
              <p class="text-slate-400 text-xs line-clamp-1">{{ course?.description }}</p>
            </div>
          </div>
          <button (click)="toggleLang()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm">
            {{ lang === 'ar' ? 'English' : 'عربي' }}
          </button>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="lg:col-span-2 space-y-4">
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 class="text-xl font-extrabold text-slate-900 mb-6 flex items-center justify-between">
            <span>{{ t[lang].courseLessons }}</span>
              <span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black">{{ lessons.length }}</span>
            </h2>
            
            <div *ngIf="isLoading" class="space-y-3 animate-pulse">
              <div *ngFor="let i of [1,2,3]" class="p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 bg-slate-50">
                 <div class="flex items-center gap-4 min-w-0 w-full">
                    <div class="w-10 h-10 rounded-xl bg-slate-200 shrink-0"></div>
                    <div class="flex-1 space-y-2">
                       <div class="h-4 bg-slate-200 rounded w-1/2"></div>
                       <div class="h-3 bg-slate-200 rounded w-1/3"></div>
                    </div>
                 </div>
              </div>
            </div>

            <div *ngIf="!isLoading" class="space-y-3 animate-fade-in">
              <div *ngFor="let lesson of lessons; let i = index" class="p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 transition hover:bg-white hover:border-indigo-200 hover:shadow-md">
                <div class="flex items-center gap-4 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
                    {{ i + 1 }}
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-bold text-slate-900 text-sm truncate">{{ lesson.title }}</h3>
                    <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">{{ lesson.description }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 shrink-0">
                  <ng-container *ngIf="isTeacher">
                    <button (click)="onEditLesson(lesson)" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition">
                      {{ t[lang].edit }}
                    </button>
                    <button (click)="openDeleteModal(lesson.id)" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition">
                      {{ t[lang].delete }}
                    </button>
                    <button (click)="openQuizCreator(lesson.id)" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition shadow-sm border border-indigo-100">
                      {{ t[lang].manageQuiz }}
                    </button>
                    <button (click)="openAssignmentCreator(lesson.id)" class="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-xs transition shadow-sm border border-purple-100">
                      {{ t[lang].manageAssignment }}
                    </button>
                  </ng-container>

                  <ng-container *ngIf="!isTeacher">
                    <button (click)="startQuiz(lesson.id)" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md">
                       {{ t[lang].startQuizBtn }}
                    </button>
                  </ng-container>
                </div>
              </div>
              
              <div *ngIf="lessons.length === 0" class="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <span class="text-4xl mb-3 block"></span>
                <p class="text-slate-500 text-sm font-semibold">{{ t[lang].noLessons }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div *ngIf="isTeacher" class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-6">
            <h3 class="text-lg font-extrabold text-slate-900 mb-4">
              {{ editingLessonId ? t[lang].editLessonTitle : t[lang].addLessonTitle }}
            </h3>

            <form [formGroup]="lessonForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].lessonTitle }}</label>
                <input type="text" formControlName="title" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition">
                </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].lessonDesc }}</label>
                <textarea formControlName="description" rows="3" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition"></textarea>
              </div>
              
              <!-- Video File Upload Section -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].videoUpload }}</label>
                <div class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative">
                    <input type="file" (change)="onVideoSelected($event)" accept="video/mp4,video/x-m4v,video/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                    
                    <div *ngIf="!isUploadingVideo && !lessonForm.get('videoUrl')?.value">
                        <span class="text-2xl mb-1 block"></span>
                        <p class="text-xs font-bold text-indigo-600">{{ t[lang].clickToUploadVideo }}</p>
                    </div>

                    <div *ngIf="isUploadingVideo" class="flex flex-col items-center justify-center">
                        <svg class="animate-spin h-6 w-6 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                           <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="text-xs font-bold text-slate-500">{{ t[lang].uploading }}</p>
                    </div>

                    <div *ngIf="!isUploadingVideo && lessonForm.get('videoUrl')?.value">
                        <span class="text-2xl mb-1 block">✅</span>
                        <p class="text-xs font-bold text-emerald-600">{{ t[lang].videoUploadedSuccess }}</p>
                    </div>
                </div>
              </div>
              
              <div class="flex gap-2 pt-2">
                <button *ngIf="editingLessonId" type="button" (click)="cancelEdit()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-3 rounded-xl transition">
                  {{ t[lang].cancel }}
                </button>
                <button type="submit" [disabled]="!lessonForm.valid || isUploadingVideo" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-100 disabled:opacity-50">
                  {{ editingLessonId ? t[lang].updateLessonBtn : t[lang].saveLessonBtn }}
                </button>
              </div>
            </form>
          </div>

          <div *ngIf="!isTeacher" class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-6 text-center">
            <div class="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h3 class="text-sm font-bold text-slate-400 mb-1 uppercase tracking-wider">{{ t[lang].coursePrice }}</h3>
            <p class="text-4xl font-black text-slate-900 mb-6 flex justify-center items-center gap-1">
              {{ course?.price || '0' }} <span class="text-base text-slate-500 font-bold">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
            </p>
            <button (click)="enrollInCourse()" [disabled]="isProcessingPayment" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition shadow-lg shadow-indigo-200 disabled:opacity-70 flex justify-center items-center gap-2">
              <svg *ngIf="isProcessingPayment" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isProcessingPayment ? t[lang].processingPayment : t[lang].buyNow }}
            </button>
          </div>
        </div>
      </main>

      <div *ngIf="showAssignmentPage" class="fixed inset-0 z-[90] flex flex-col bg-slate-100 overflow-y-auto animate-fade-in">
        
        <div *ngIf="showDeleteAssignmentModal" class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
        <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in">
            <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <h3 class="text-xl font-bold text-slate-900 text-center mb-2">{{ t[lang].deleteAssignConfirmTitle }}</h3>
            <p class="text-sm text-slate-500 text-center mb-8">{{ t[lang].deleteAssignConfirmDesc }}</p>
            <div class="flex gap-3">
              <button (click)="showDeleteAssignmentModal = false" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
                {{ t[lang].cancel }}
              </button>
              <button (click)="confirmDeleteAssignment()" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-200">
                {{ t[lang].confirmDeleteBtn }}
              </button>
            </div>
          </div>
        </div>

        <div class="bg-[#130E35] text-white py-4 px-8 shadow-md flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button (click)="showAssignmentPage = false" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
              <span class="rtl:rotate-180 font-bold text-lg">←</span>
            </button>
            <div>
              <h2 class="text-xl font-extrabold">{{ t[lang].editAssignmentTitle }}</h2>
              <p class="text-xs text-indigo-300 mt-0.5">{{ t[lang].editAssignmentDesc }}</p>
            </div>
          </div>
        </div>

        <div class="max-w-4xl w-full mx-auto p-6 lg:p-10 space-y-6">
          
          <div *ngIf="assignmentError" class="bg-rose-50 border-2 border-rose-300 text-rose-700 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-fade-in shadow-md">
            <span class="text-xl">⚠️</span>
            <span class="flex-1">{{ assignmentError }}</span>
            <button type="button" (click)="assignmentError = ''" class="text-rose-400 hover:text-rose-600 font-black">✕</button>
          </div>

          <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].assignTitleLabel }}</label>
              <input type="text" [(ngModel)]="assignmentData.title" [placeholder]="t[lang].assignTitlePlaceholder" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].dueDateLabel }}</label>
              <input type="datetime-local" [(ngModel)]="assignmentData.dueDate" [min]="minDate" (click)="$any($event.target).showPicker?.()" (keydown)="preventDateKeyboardTyping($event)" (input)="validateAssignmentDueDate($event)" (change)="validateAssignmentDueDate($event)" style="accent-color: #4f46e5 !important;" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm dir-ltr text-left accent-indigo-600">
            </div>
          </div>

          <div class="space-y-6">
            <div *ngFor="let q of assignmentData.questions; let i = index; trackBy: trackByIndex" class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 relative">
              
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <span class="font-black text-indigo-600 text-sm"># {{ i + 1 }} - {{ t[lang].questionText }}</span>
                <button (click)="removeAssignmentQuestion(i)" class="text-rose-500 hover:text-rose-700 text-xs font-bold transition">
                  {{ t[lang].delete }}
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div class="sm:col-span-3">
                  <input type="text" [(ngModel)]="q.text" [placeholder]="t[lang].questionPlaceholder" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm">
                </div>
                <div>
                <select [(ngModel)]="q.type" (change)="onQuestionTypeChange(q)" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm">
                    <option value="mcq">{{ t[lang].mcqOption }}</option>
                    <option value="written">{{ t[lang].writtenOption }}</option>
                  </select>
                </div>
              </div>

              <div *ngIf="q.type === 'mcq'" class="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <p class="text-xs font-bold text-slate-500 mb-2">{{ t[lang].optionsInstruction }}</p>
                
                <div *ngFor="let opt of q.options; let optIdx = index; trackBy: trackByIndex" class="flex items-center gap-3">
                  <input type="radio" [name]="'correct_' + i" [checked]="q.correctIndex === optIdx" (change)="q.correctIndex = optIdx" style="accent-color: #4f46e5 !important;" class="w-4 h-4 text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer">
                  <input type="text" [(ngModel)]="q.options[optIdx]" [placeholder]="t[lang].optionPlaceholder + ' ' + (optIdx + 1)" class="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none">
                  <button *ngIf="q.options.length > 2" (click)="removeMcqOption(q, optIdx)" class="text-rose-400 hover:text-rose-600 text-xs font-bold">✖</button>
                </div>

                <button *ngIf="q.options.length < 4" (click)="addMcqOption(q)" class="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
                  + {{ t[lang].addOptionBtn }}
                </button>
              </div>

            </div>

            <button (click)="addAssignmentQuestion()" class="w-full py-4 border-2 border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-600 font-bold rounded-3xl transition bg-indigo-50/50 flex items-center justify-center gap-2">
              + {{ t[lang].addNewQuestionBtn }}
            </button>
          </div>

          <div class="flex items-center gap-4 pt-6 pb-12">
            <button (click)="submitAssignment()" [disabled]="isSavingAssignment" class="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-200 disabled:opacity-50">
              <svg *ngIf="isSavingAssignment" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSavingAssignment ? t[lang].savingAssignment : t[lang].saveAssignmentBtn }}
            </button>
            <button (click)="showAssignmentPage = false" [disabled]="isSavingAssignment" class="flex-1 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-sm transition disabled:opacity-50">
              {{ t[lang].cancel }}
            </button>
          </div>

        </div>
      </div>

    </div>
  `
})
export class CourseDetailsComponent implements OnInit {
  courseId!: number;
  course: any = null;
  lessons: any[] = [];
  lessonForm: FormGroup;
  isLoading = true;
  isUploadingVideo = false;

  message = '';
  messageType: 'success' | 'error' = 'success';
  showDeleteModal = false;
  lessonToDeleteId: number | null = null;
  editingLessonId: number | null = null;
  isTeacher = false;
  isProcessingPayment = false;
  isSavingAssignment = false;

  showAssignmentPage = false;
  showDeleteAssignmentModal = false;
  selectedLessonIdForAssignment: number | null = null;
  minDate = '';
  assignmentError = '';

  localAssignmentsCache: { [lessonId: number]: any } = {};

  assignmentData = {
    title: '',
    dueDate: '',
    questions: [
      { text: '', type: 'mcq', options: ['', '', '', ''], correctIndex: 0 }
    ]
  };

  lang: 'en' | 'ar' = 'en';

  t = {
    en: {
      loading: 'Loading...', courseLessons: 'Course Lessons', edit: 'Edit', delete: 'Delete',
      noLessons: 'No lessons added yet. Start by adding one!', addLessonTitle: 'Add New Lesson',
      editLessonTitle: 'Edit Lesson', lessonTitle: 'Lesson Title', lessonDesc: 'Lesson Description & Instructions',
      videoUrl: 'Video URL', videoUpload: 'Upload Video File (.mp4)', clickToUploadVideo: 'Click to select video',
      uploading: 'Uploading Video...', videoUploadedSuccess: 'Video Uploaded Successfully!',
      saveLessonBtn: 'Save Lesson', updateLessonBtn: 'Update Lesson',
      successMsg: 'Lesson added successfully!', updateSuccessMsg: 'Lesson updated successfully!', deleteSuccessMsg: 'Lesson deleted successfully!',
      cancel: 'Cancel', deleteConfirmTitle: 'Confirm Deletion', deleteConfirmDesc: 'Are you sure you want to delete this lesson? This action cannot be undone.',
      confirmDeleteBtn: 'Yes, Delete', errorProcess: 'An error occurred.', manageQuiz: 'Quiz', manageAssignment: 'Assignment',
      startQuizBtn: 'Start Quiz', coursePrice: 'Course Price', buyNow: 'Enroll Now', processingPayment: 'Redirecting to Payment...', paymentError: 'Failed to connect to payment gateway.',
      editAssignmentTitle: 'Edit Lesson Assignment', editAssignmentDesc: 'Add or edit questions, select correct answers and due date',
      assignTitleLabel: 'Assignment Title', assignTitlePlaceholder: 'e.g. OOP Assignment...', dueDateLabel: 'Due Date',
      questionText: 'Question', questionPlaceholder: 'Write question text...', mcqOption: 'MCQ', writtenOption: 'Written',
      optionsInstruction: 'Options (Select correct answer button):', optionPlaceholder: 'Option', addOptionBtn: 'Add Option',
      addNewQuestionBtn: 'Add New Question', saveAssignmentBtn: 'Save Assignment', savingAssignment: 'Saving Assignment...', deleteAssignmentBtn: 'Delete Assignment',
      validationError: 'Please fill in all assignment fields, question texts, and options before saving!',
      deleteAssignConfirmTitle: 'Delete Assignment', deleteAssignConfirmDesc: 'Are you sure you want to delete this assignment? All questions will be lost.'
    },
    ar: {
      loading: 'جاري التحميل...', courseLessons: 'الدروس المضافة للكورس', edit: 'تعديل', delete: 'حذف',
      noLessons: 'لم تقم بإضافة أي دروس بعد. ابدأ بإضافة درسك الأول!', addLessonTitle: 'إضافة درس جديد',
      editLessonTitle: 'تعديل الدرس', lessonTitle: 'عنوان الدرس', lessonDesc: 'التفاصيل والتعليمات للطلاب',
      videoUrl: 'رابط الفيديو', videoUpload: 'رفع ملف الفيديو (.mp4)', clickToUploadVideo: 'اضغط لاختيار الفيديو',
      uploading: 'جاري رفع الفيديو...', videoUploadedSuccess: 'تم رفع الفيديو بنجاح!',
      saveLessonBtn: 'إضافة الدرس', updateLessonBtn: 'تحديث الدرس',
      successMsg: 'تم إضافة الدرس بنجاح!', updateSuccessMsg: 'تم تحديث الدرس بنجاح!', deleteSuccessMsg: 'تم حذف الدرس بنجاح!',
      cancel: 'إلغاء', deleteConfirmTitle: 'تأكيد الحذف', deleteConfirmDesc: 'هل أنت متأكد من حذف هذا الدرس؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmDeleteBtn: 'نعم، احذف', errorProcess: 'حدث خطأ أثناء التنفيذ.', manageQuiz: 'اختبار', manageAssignment: 'واجب',
      startQuizBtn: 'ابدأ الاختبار', coursePrice: 'سعر الكورس', buyNow: 'اشترك في الكورس الآن', processingPayment: 'جاري تحويلك للدفع...', paymentError: 'عذراً، حدث خطأ أثناء الاتصال ببوابة الدفع.',
      editAssignmentTitle: 'تعديل واجب الدرس', editAssignmentDesc: 'إضافة أو تعديل الأسئلة وتحديد الإجابات الصحيحة وموعد التسليم',
      assignTitleLabel: 'عنوان الواجب', assignTitlePlaceholder: 'مثال: واجب البرمجة الكائنية...', dueDateLabel: 'موعد التسليم النهائي',
      questionText: 'سؤال', questionPlaceholder: 'اكتب نص السؤال هنا...', mcqOption: 'اختياري (MCQ)', writtenOption: 'مقالي (Written)',
      optionsInstruction: 'الاختيارات (اختر زر الإجابة الصحيحة):', optionPlaceholder: 'الخيار', addOptionBtn: 'إضافة خيار جديد',
      addNewQuestionBtn: 'إضافة سؤال جديد', saveAssignmentBtn: 'حفظ الواجب', savingAssignment: 'جاري الحفظ...', deleteAssignmentBtn: 'حذف الواجب',
      validationError: 'برجاء استكمال جميع بيانات الواجب (العنوان، تاريخ التسليم، ونصوص جميع الأسئلة والاختيارات) قبل الحفظ يا بطل! ❤️',
      deleteAssignConfirmTitle: 'حذف الواجب', deleteAssignConfirmDesc: 'هل أنت متأكد من حذف هذا الواجب بجميع أسئلته؟ لا يمكن التراجع.'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private fb: FormBuilder,
    private langService: LanguageService,
    private paymentService: PaymentService,
    private http: HttpClient
  ) {
    this.lessonForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      videoUrl: ['', Validators.required]
    });
  }

  ngOnInit() {
    const role = localStorage.getItem('userRole');
    this.isTeacher = (role === 'Teacher' || role === '1');

    this.langService.currentLang$.subscribe(l => this.lang = l);
    this.route.params.subscribe(params => {
      this.courseId = +params['id'];
      this.loadCourseData();
    });

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

  validateAssignmentDueDate(event?: any) {
    const nowStr = this.getLocalDateTimeString();
    this.minDate = nowStr;
    if (this.assignmentData.dueDate && this.assignmentData.dueDate < nowStr) {
      this.assignmentData.dueDate = nowStr;
      const msg = this.lang === 'ar' ? 'لا يمكن اختيار تاريخ أو وقت في الماضي.' : 'Cannot select a date or time in the past.';
      this.showMessage(msg, 'error');
    }
  }

  loadCourseData() {
    this.isLoading = true;
    this.courseService.getCourseById(this.courseId).subscribe(data => {
      this.course = data;
      this.courseService.getCourseLessons(this.courseId).subscribe(lessonsData => {
        this.lessons = lessonsData;
        this.isLoading = false;
      });
    });
  }

  showMessage(msg: string, type: 'success' | 'error' = 'success') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3500);
  }

  onVideoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isUploadingVideo = true;
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.post('http://localhost:5162/api/course/upload-video', formData, { headers }).subscribe({
        next: (res: any) => {
          this.lessonForm.patchValue({ videoUrl: res.videoUrl });
          this.isUploadingVideo = false;
        },
        error: () => {
          this.isUploadingVideo = false;
          this.showMessage(this.lang === 'ar' ? 'فشل رفع الفيديو. تأكد من حجم الملف.' : 'Failed to upload video.', 'error');
        }
      });
    }
  }

  openAssignmentCreator(lessonId: number) {
    this.selectedLessonIdForAssignment = lessonId;

    if (this.localAssignmentsCache[lessonId]) {
      this.assignmentData = JSON.parse(JSON.stringify(this.localAssignmentsCache[lessonId]));
      this.showAssignmentPage = true;
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.assignmentError = '';
    this.http.get<any[]>(`http://localhost:5162/api/assignments/lesson/${lessonId}`, { headers }).subscribe({
      next: (assignments) => {
        if (assignments && assignments.length > 0) {
          const assignment = assignments[0];
          this.assignmentData = {
            title: (assignment.title || '').trimStart(),
            dueDate: this.formatDateForInput(assignment.dueDate),
            questions: assignment.questions.map((q: any) => ({
              text: q.questionText || '',
              type: q.type === 'essay' ? 'written' : 'mcq',
              options: q.options ? q.options.split(',') : ['', '', '', ''],
              correctIndex: q.options ? q.options.split(',').indexOf(q.correctAnswer) : 0
            }))
          };
          this.localAssignmentsCache[lessonId] = JSON.parse(JSON.stringify(this.assignmentData));
        } else {
          this.resetAssignmentForm();
        }
        this.showAssignmentPage = true;
      },
      error: () => {
        this.resetAssignmentForm();
        this.showAssignmentPage = true;
      }
    });
  }

  resetAssignmentForm() {
    this.minDate = this.getLocalDateTimeString();
    this.assignmentData = {
      title: '',
      dueDate: this.minDate,
      questions: [
        { text: '', type: 'mcq', options: ['', '', '', ''], correctIndex: 0 }
      ]
    };
  }

  addAssignmentQuestion() {
    this.assignmentData.questions.push({ text: '', type: 'mcq', options: ['', '', '', ''], correctIndex: 0 });
  }

  removeAssignmentQuestion(index: number) {
    this.assignmentData.questions.splice(index, 1);
  }

  onQuestionTypeChange(q: any) {
    if (q.type === 'mcq' && (!q.options || q.options.length === 0)) {
      q.options = ['', '', '', ''];
      q.correctIndex = 0;
    }
  }

  addMcqOption(q: any) {
    if (q.options.length < 4) {
      q.options.push('');
    }
  }

  removeMcqOption(q: any, optIdx: number) {
    if (q.options.length > 2) {
      q.options.splice(optIdx, 1);
      if (q.correctIndex >= q.options.length) {
        q.correctIndex = 0;
      }
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  formatDateForInput(dStr: string | null | undefined): string {
    if (!dStr) return this.minDate;
    if (dStr.endsWith('Z')) {
      const d = new Date(dStr);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return dStr.slice(0, 16);
  }

  submitAssignment() {
    this.assignmentError = '';

    if (!this.assignmentData.title || !this.assignmentData.title.trim()) {
      this.assignmentError = this.lang === 'ar' ? 'يرجى إدخال عنوان الواجب.' : 'Please enter the assignment title.';
      this.showMessage(this.assignmentError, 'error');
      return;
    }

    if (this.assignmentData.title.startsWith(' ')) {
      this.assignmentError = this.lang === 'ar' ? 'لا يمكن أن يبدأ عنوان الواجب بمسافة فارغة.' : 'Assignment title cannot start with a space.';
      this.showMessage(this.assignmentError, 'error');
      return;
    }

    if (!this.assignmentData.dueDate) {
      this.assignmentError = this.lang === 'ar' ? 'يرجى تحديد موعد وتاريخ التسليم.' : 'Please select the assignment due date & time.';
      this.showMessage(this.assignmentError, 'error');
      return;
    }

    const nowStr = this.getLocalDateTimeString();
    if (this.assignmentData.dueDate < nowStr) {
      this.assignmentError = this.lang === 'ar' ? 'لا يمكن تحديد موعد تسليم في الماضي.' : 'Assignment due date cannot be in the past.';
      this.showMessage(this.assignmentError, 'error');
      return;
    }

    for (let i = 0; i < this.assignmentData.questions.length; i++) {
      const q = this.assignmentData.questions[i];
      if (!q.text || !q.text.trim()) {
        this.assignmentError = this.lang === 'ar' ? `يرجى إدخال نص السؤال #${i + 1}.` : `Please enter text for question #${i + 1}.`;
        this.showMessage(this.assignmentError, 'error');
        return;
      }
      if (q.text.startsWith(' ')) {
        this.assignmentError = this.lang === 'ar' ? `لا يمكن أن يبدأ نص السؤال #${i + 1} بمسافة فارغة.` : `Question #${i + 1} text cannot start with a space.`;
        this.showMessage(this.assignmentError, 'error');
        return;
      }
      if (q.type === 'mcq') {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          if (!opt || !opt.trim()) {
            this.assignmentError = this.lang === 'ar' ? `يرجى ملء جميع خيارات السؤال #${i + 1}.` : `Please fill out all options for question #${i + 1}.`;
            this.showMessage(this.assignmentError, 'error');
            return;
          }
          if (opt.startsWith(' ')) {
            this.assignmentError = this.lang === 'ar' ? `لا يمكن أن يبدأ خيار الإجابة في السؤال #${i + 1} بمسافة فارغة.` : `Option text in question #${i + 1} cannot start with a space.`;
            this.showMessage(this.assignmentError, 'error');
            return;
          }
        }
      }
    }

    this.isSavingAssignment = true;

    const rawDue = this.assignmentData.dueDate;
    const formattedDue = rawDue.includes('T') ? (rawDue.length === 16 ? rawDue + ':00' : rawDue) : rawDue;

    const payload = {
      title: this.assignmentData.title.trim(),
      description: "Lesson Assignment", 
      dueDate: formattedDue,
      totalScore: this.assignmentData.questions.length * 1,
      courseId: this.courseId,
      lessonId: this.selectedLessonIdForAssignment,
      questions: this.assignmentData.questions.map(q => ({
        questionText: q.text.trim(),
        type: q.type === 'written' ? 'essay' : 'mcq',
        options: q.type === 'mcq' ? q.options.map((o: string) => o.trim()).join(',') : null,
        correctAnswer: q.type === 'mcq' ? q.options[q.correctIndex].trim() : null,
        score: 1
      }))
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('http://localhost:5162/api/assignments', payload, { headers }).subscribe({
      next: () => {
        this.localAssignmentsCache[this.selectedLessonIdForAssignment!] = JSON.parse(JSON.stringify(this.assignmentData));
        this.isSavingAssignment = false;
        this.assignmentError = '';
        this.showMessage(this.lang === 'ar' ? 'تم حفظ ونشر الواجب بنجاح' : 'Assignment saved & published successfully', 'success');
        this.showAssignmentPage = false;
      },
      error: (err) => {
        this.isSavingAssignment = false;
        this.assignmentError = err.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء حفظ الواجب' : 'An error occurred while saving the assignment');
        this.showMessage(this.assignmentError, 'error');
      }
    });
  }

  openDeleteAssignmentModal() {
    this.showDeleteAssignmentModal = true;
  }

  confirmDeleteAssignment() {
    this.showDeleteAssignmentModal = false;
    this.showAssignmentPage = false;
  }

  enrollInCourse() {
    this.isProcessingPayment = true;
    this.paymentService.checkoutCourse(this.courseId).subscribe({
      next: (response: any) => {
        const url = response.checkoutUrl || response.CheckoutUrl;
        if (url) {
          window.location.href = url;
        } else {
          this.isProcessingPayment = false;
          this.showMessage('رابط الدفع غير موجود في الاستجابة', 'error');
        }
      },
      error: () => {
        this.isProcessingPayment = false;
        this.showMessage(this.t[this.lang].paymentError, 'error');
      }
    });
  }

  openDeleteModal(lessonId: number) {
    this.lessonToDeleteId = lessonId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.lessonToDeleteId = null;
  }

  confirmDelete() {
    if (this.lessonToDeleteId === null) return;
    this.courseService.deleteLesson(this.courseId, this.lessonToDeleteId).subscribe({
      next: () => {
        this.showMessage(this.t[this.lang].deleteSuccessMsg, 'success');
        this.loadCourseData();
        if (this.editingLessonId === this.lessonToDeleteId) this.cancelEdit();
        this.closeDeleteModal();
      },
      error: () => {
        this.showMessage(this.t[this.lang].errorProcess, 'error');
        this.closeDeleteModal();
      }
    });
  }

  onEditLesson(lesson: any) {
    this.editingLessonId = lesson.id;
    this.lessonForm.patchValue({
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingLessonId = null;
    this.lessonForm.reset();
  }

  onSubmit() {
    if (this.lessonForm.valid) {
      if (this.editingLessonId) {
        this.courseService.updateLesson(this.courseId, this.editingLessonId, this.lessonForm.value).subscribe({
          next: () => {
            this.showMessage(this.t[this.lang].updateSuccessMsg, 'success');
            this.cancelEdit();
            this.loadCourseData();
          },
          error: () => this.showMessage(this.t[this.lang].errorProcess, 'error')
        });
      } else {
        this.courseService.addLesson(this.courseId, this.lessonForm.value).subscribe({
          next: () => {
            this.showMessage(this.t[this.lang].successMsg, 'success');
            this.lessonForm.reset();
            this.loadCourseData();
          },
          error: () => this.showMessage(this.t[this.lang].errorProcess, 'error')
        });
      }
    }
  }

  openQuizCreator(lessonId: number) {
    this.router.navigate(['/quiz-creator', lessonId]);
  }

  startQuiz(lessonId: number) {
    this.router.navigate([`/quiz-solver/${lessonId}`], { replaceUrl: true });
  }

  toggleLang() {
    this.langService.toggleLanguage();
  }

  goBack() {
    this.router.navigate([this.isTeacher ? '/teacher-dashboard' : '/student-dashboard']);
  }
}