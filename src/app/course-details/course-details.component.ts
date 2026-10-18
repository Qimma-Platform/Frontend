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
    <div class="bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 min-h-screen pb-12 font-sans relative" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      
      <div *ngIf="message" 
           [ngClass]="{
             'bg-emerald-600 border border-emerald-400/30 shadow-emerald-600/30 text-white': messageType === 'success', 
             'bg-rose-600 border border-rose-400/30 shadow-rose-600/30 text-white': messageType === 'error',
             'bg-amber-500 border border-amber-300/40 shadow-amber-500/40 text-white': messageType === 'warning'
           }"
           class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-extrabold flex items-center gap-3 animate-fade-in transition-all">
        <span *ngIf="messageType === 'warning'" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>
        <svg *ngIf="messageType === 'success'" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <svg *ngIf="messageType === 'error'" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>{{ message }}</span>
      </div>

      <div *ngIf="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in">
          <div class="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">{{ t[lang].deleteConfirmTitle }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">{{ t[lang].deleteConfirmDesc }}</p>
          <div class="flex gap-3">
            <button (click)="closeDeleteModal()" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition">
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
          <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 class="text-xl font-extrabold text-slate-900 dark:text-white mb-6 flex items-center justify-between">
            <span>{{ t[lang].courseLessons }}</span>
              <span class="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-black">{{ lessons.length }}</span>
            </h2>
            
            <div *ngIf="isLoading" class="space-y-3 animate-pulse">
              <div *ngFor="let i of [1,2,3]" class="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800">
                 <div class="flex items-center gap-4 min-w-0 w-full">
                    <div class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                    <div class="flex-1 space-y-2">
                       <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                       <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    </div>
                 </div>
              </div>
            </div>

            <div *ngIf="!isLoading" class="space-y-3 animate-fade-in">
              <div *ngFor="let lesson of lessons; let i = index" class="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/60 transition hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md">
                <div class="flex items-center gap-4 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-sm shrink-0">
                    {{ i + 1 }}
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-bold text-slate-900 dark:text-white text-sm truncate">{{ lesson.title }}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{{ lesson.description }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 shrink-0">
                  <ng-container *ngIf="isTeacher">
                    <button (click)="onEditLesson(lesson)" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition">
                      {{ t[lang].edit }}
                    </button>
                    <button (click)="openDeleteModal(lesson.id)" class="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg transition">
                      {{ t[lang].delete }}
                    </button>
                    <button (click)="openQuizCreator(lesson.id)" class="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg text-xs transition shadow-sm border border-indigo-100 dark:border-indigo-900/40">
                      {{ t[lang].manageQuiz }}
                    </button>
                    <button (click)="openAssignmentCreator(lesson.id)" class="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold rounded-lg text-xs transition shadow-sm border border-purple-100 dark:border-purple-900/40">
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
              
              <div *ngIf="lessons.length === 0" class="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30">
                <span class="text-4xl mb-3 block"></span>
                <p class="text-slate-500 dark:text-slate-400 text-sm font-semibold">{{ t[lang].noLessons }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div *ngIf="isTeacher" class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 sticky top-6">
            <h3 class="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
              {{ editingLessonId ? t[lang].editLessonTitle : t[lang].addLessonTitle }}
            </h3>

            <form [formGroup]="lessonForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].lessonTitle }}</label>
                <input type="text" formControlName="title" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ t[lang].lessonDesc }}</label>
                <textarea formControlName="description" rows="3" class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition"></textarea>
              </div>
              
              <!-- Video Link / URL Input -->
              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {{ lang === 'ar' ? 'رابط الفيديو (URL)' : 'Video Link (URL)' }}
                </label>
                <div class="relative">
                  <input type="text" formControlName="videoUrl" 
                         placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4" 
                         class="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono transition">
                  <svg class="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {{ lang === 'ar' ? 'يدعم روابط يوتيوب وفيميو أو روابط الفيديو المباشرة (MP4/WebM).' : 'Supports YouTube, Vimeo, or direct MP4/WebM URLs.' }}
                </p>
                <div *ngIf="lessonForm.get('videoUrl')?.value" class="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
                  <span class="font-bold text-indigo-700 dark:text-indigo-300 truncate max-w-xs">{{ lessonForm.get('videoUrl')?.value }}</span>
                  <button type="button" (click)="lessonForm.patchValue({ videoUrl: '' })" class="text-rose-500 hover:text-rose-700 font-bold text-xs ml-2 cursor-pointer">✖</button>
                </div>
              </div>
              
              <div class="flex gap-2 pt-2">
                <button *ngIf="editingLessonId" type="button" (click)="cancelEdit()" class="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold py-3 rounded-xl transition cursor-pointer">
                  {{ t[lang].cancel }}
                </button>
                <button type="submit" [disabled]="!lessonForm.valid" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50 cursor-pointer">
                  {{ editingLessonId ? t[lang].updateLessonBtn : t[lang].saveLessonBtn }}
                </button>
              </div>
            </form>
          </div>

          <div *ngIf="!isTeacher" class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 sticky top-6 text-center">
            <div class="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h3 class="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">{{ t[lang].coursePrice }}</h3>
            <p class="text-4xl font-black text-slate-900 dark:text-white mb-6 flex justify-center items-center gap-1">
              <ng-container *ngIf="course?.isFree">
                {{ lang === 'ar' ? 'مجاني' : 'Free' }}
              </ng-container>
              <ng-container *ngIf="!course?.isFree">
                {{ getEffectivePrice() }} <span class="text-base text-slate-500 dark:text-slate-400 font-bold">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                <span *ngIf="course?.discountPercentage > 0" class="text-sm line-through text-slate-400 font-medium ml-2 mr-2">
                  {{ course?.price }} {{ lang === 'ar' ? 'ج.م' : 'EGP' }}
                </span>
              </ng-container>
            </p>
            <button (click)="enrollInCourse()" [disabled]="isProcessingPayment" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold rounded-xl transition shadow-md shadow-indigo-600/20 disabled:opacity-70 flex justify-center items-center gap-2 cursor-pointer">
              <svg *ngIf="isProcessingPayment" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isProcessingPayment ? t[lang].processingPayment : (course?.isFree ? (lang === 'ar' ? 'ابدأ التعلم الآن' : 'Start Learning Now') : t[lang].buyNow) }}
            </button>
          </div>
        </div>
      </main>

      <div *ngIf="showAssignmentPage" class="fixed inset-0 z-[90] flex flex-col bg-slate-100 dark:bg-[#0B0F19] text-slate-900 dark:text-white overflow-y-auto animate-fade-in">
        
        <div *ngIf="showDeleteAssignmentModal" class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in">
            <div class="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">{{ t[lang].deleteAssignConfirmTitle }}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">{{ t[lang].deleteAssignConfirmDesc }}</p>
            <div class="flex gap-3">
              <button (click)="showDeleteAssignmentModal = false" [disabled]="isDeletingAssignment" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition disabled:opacity-50">
                {{ t[lang].cancel }}
              </button>
              <button (click)="confirmDeleteAssignment()" [disabled]="isDeletingAssignment" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-200 disabled:opacity-50">
                {{ isDeletingAssignment ? (lang === 'ar' ? 'جاري الحذف...' : 'Deleting...') : t[lang].confirmDeleteBtn }}
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
          
          <div *ngIf="assignmentError" class="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-fade-in shadow-md">
            <span class="text-xl">⚠️</span>
            <span class="flex-1">{{ assignmentError }}</span>
            <button type="button" (click)="assignmentError = ''" class="text-rose-400 hover:text-rose-600 font-black">✕</button>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{{ t[lang].assignTitleLabel }}</label>
              <input type="text" [(ngModel)]="assignmentData.title" [placeholder]="t[lang].assignTitlePlaceholder" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{{ t[lang].dueDateLabel }}</label>
              <input type="datetime-local" [(ngModel)]="assignmentData.dueDate" [min]="minDate" (click)="$any($event.target).showPicker?.()" (keydown)="preventDateKeyboardTyping($event)" (input)="validateAssignmentDueDate($event)" (change)="validateAssignmentDueDate($event)" style="accent-color: #4f46e5 !important;" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm dir-ltr text-left accent-indigo-600">
            </div>
          </div>

          <div class="space-y-6">
            <div *ngFor="let q of assignmentData.questions; let i = index; trackBy: trackByIndex" class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 relative">
              
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span class="font-black text-indigo-600 dark:text-indigo-400 text-sm"># {{ i + 1 }} - {{ t[lang].questionText }}</span>
                <button (click)="removeAssignmentQuestion(i)" class="text-rose-500 hover:text-rose-700 text-xs font-bold transition">
                  {{ t[lang].delete }}
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div class="sm:col-span-3">
                  <input type="text" [(ngModel)]="q.text" [placeholder]="t[lang].questionPlaceholder" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm">
                </div>
                <div>
                <select [(ngModel)]="q.type" (change)="onQuestionTypeChange(q)" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm">
                    <option value="mcq">{{ t[lang].mcqOption }}</option>
                    <option value="written">{{ t[lang].writtenOption }}</option>
                  </select>
                </div>
              </div>

              <div *ngIf="q.type === 'mcq'" class="mt-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <p class="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{{ t[lang].optionsInstruction }}</p>
                
                <div *ngFor="let opt of q.options; let optIdx = index; trackBy: trackByIndex" 
                     class="flex items-center gap-3 p-2 rounded-xl transition"
                     [ngClass]="q.correctIndex === optIdx ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800' : 'border border-transparent'">
                  <label class="flex items-center gap-2 cursor-pointer shrink-0" [title]="lang === 'ar' ? 'حدد هذا الخيار كإجابة صحيحة' : 'Mark as correct answer'">
                    <input type="radio" [name]="'correct_' + i" [checked]="q.correctIndex === optIdx" (change)="q.correctIndex = optIdx" class="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer">
                    <span *ngIf="q.correctIndex === optIdx" class="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      ✓ {{ lang === 'ar' ? 'الإجابة النموذجية' : 'Correct Answer' }}
                    </span>
                  </label>
                  <input type="text" [(ngModel)]="q.options[optIdx]" [placeholder]="t[lang].optionPlaceholder + ' ' + (optIdx + 1)" class="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none">
                  <button *ngIf="q.options.length > 2" (click)="removeMcqOption(q, optIdx)" class="text-rose-400 hover:text-rose-600 text-xs font-bold">✖</button>
                </div>

                <button *ngIf="q.options.length < 4" (click)="addMcqOption(q)" class="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition">
                  + {{ t[lang].addOptionBtn }}
                </button>
              </div>

            </div>

            <button (click)="addAssignmentQuestion()" class="w-full py-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold rounded-3xl transition bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-center gap-2">
              + {{ t[lang].addNewQuestionBtn }}
            </button>
          </div>

          <div class="flex flex-wrap sm:flex-nowrap items-center gap-4 pt-6 pb-12 border-t border-slate-200 dark:border-slate-800">
            <button *ngIf="isAssignmentEditMode" (click)="openDeleteAssignmentModal()" class="w-full sm:w-1/4 py-3.5 bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 font-bold rounded-2xl text-base transition">
              {{ t[lang].deleteAssignmentBtn }}
            </button>
            <button (click)="showAssignmentPage = false" [disabled]="isSavingAssignment" class="flex-1 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-base transition disabled:opacity-50">
              {{ t[lang].cancel }}
            </button>
            <button (click)="submitAssignment()" [disabled]="isSavingAssignment" class="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-base shadow-md transition disabled:opacity-50">
              <svg *ngIf="isSavingAssignment" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSavingAssignment ? t[lang].savingAssignment : t[lang].saveAssignmentBtn }}
            </button>
          </div>

        </div>
      </div>

      <!-- ======================================================== -->
      <!-- PAYMENT METHODS MODAL (InstaPay, Vodafone Cash, Paymob) -->
      <!-- ======================================================== -->
      <div *ngIf="showPaymentModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in" (click)="closePaymentModal()">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-scale-in text-start" (click)="$event.stopPropagation()">
          
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 class="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <span>{{ lang === 'ar' ? 'اختر وسيلة الدفع المناسبة' : 'Choose Payment Method' }}</span>
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                <bdi class="font-bold text-slate-700 dark:text-slate-300">{{ course?.title }}</bdi>
                <span class="text-slate-400">•</span>
                <span class="font-extrabold text-indigo-600 dark:text-indigo-400" dir="ltr">
                  {{ getEffectivePrice() }} {{ lang === 'ar' ? 'ج.م' : 'EGP' }}
                </span>
              </p>
            </div>
            <button (click)="closePaymentModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold transition">✕</button>
          </div>

          <!-- Method Selector Tabs -->
          <div class="grid grid-cols-3 gap-2 my-5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button (click)="selectedPaymentMethod = 'instapay'"
                    [ngClass]="selectedPaymentMethod === 'instapay' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-semibold'"
                    class="py-2.5 px-2 rounded-xl text-xs transition flex flex-col sm:flex-row items-center justify-center gap-1.5">
              <svg class="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span>{{ lang === 'ar' ? 'إنستاباي' : 'InstaPay' }}</span>
            </button>
            <button (click)="selectedPaymentMethod = 'vodafone'"
                    [ngClass]="selectedPaymentMethod === 'vodafone' ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-semibold'"
                    class="py-2.5 px-2 rounded-xl text-xs transition flex flex-col sm:flex-row items-center justify-center gap-1.5">
              <svg class="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
              <span>{{ lang === 'ar' ? 'فودافون كاش' : 'Vodafone' }}</span>
            </button>
            <button (click)="selectedPaymentMethod = 'paymob'"
                    [ngClass]="selectedPaymentMethod === 'paymob' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-semibold'"
                    class="py-2.5 px-2 rounded-xl text-xs transition flex flex-col sm:flex-row items-center justify-center gap-1.5">
              <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <span>Paymob</span>
            </button>
          </div>

          <!-- Content: InstaPay -->
          <div *ngIf="selectedPaymentMethod === 'instapay'" class="space-y-4 animate-fade-in">
            <div class="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-900/50">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block mb-1">
                    {{ lang === 'ar' ? 'رقم التحويل عبر إنستاباي' : 'InstaPay Transfer Number' }}
                  </span>
                  <p class="text-2xl font-black font-mono text-purple-900 dark:text-purple-200 tracking-wider dir-ltr select-all">01212196331</p>
                </div>
                <button (click)="copyToClipboard('01212196331')" 
                        class="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>{{ copiedNumber ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ' : 'Copy') }}</span>
                </button>
              </div>
            </div>

            <!-- Instructions -->
            <div class="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <p class="font-bold text-slate-800 dark:text-slate-200">{{ lang === 'ar' ? 'تعليمات تفعيل الكورس:' : 'Activation Instructions:' }}</p>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <p>{{ lang === 'ar' ? 'قم بالتحويل أولاً عبر تطبيق إنستاباي إلى الرقم أعلاه (01212196331) بالمبلغ المطلوب (' + getEffectivePrice() + ' ج.م).' : 'Transfer ' + getEffectivePrice() + ' EGP via InstaPay to the number above (01212196331).' }}</p>
              </div>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <p>{{ lang === 'ar' ? 'التقط سكرين شوت (لقطة شاشة) واضحة لعملية التحويل الناجحة.' : 'Take a clear screenshot of the successful transfer receipt.' }}</p>
              </div>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <p>{{ lang === 'ar' ? 'أرسل اسمك والبريد الإلكتروني المسجلين بالمنصة مع سكرين شوت التحويل إلى رقم الواتساب: 01020653195 لتفعيل حسابك فوراً.' : 'Send your name & registered email along with the receipt screenshot to WhatsApp: 01020653195 for instant activation.' }}</p>
              </div>
            </div>

            <a [href]="getWhatsAppUrl('instapay')" target="_blank" 
               class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-4">
              <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/>
              </svg>
              <span>{{ lang === 'ar' ? 'إرسال السكرين شوت عبر واتساب' : 'Send Screenshot via WhatsApp' }}</span>
            </a>
          </div>

          <!-- Content: Vodafone Cash -->
          <div *ngIf="selectedPaymentMethod === 'vodafone'" class="space-y-4 animate-fade-in">
            <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block mb-1">
                    {{ lang === 'ar' ? 'رقم التحويل عبر فودافون كاش' : 'Vodafone Cash Transfer Number' }}
                  </span>
                  <p class="text-2xl font-black font-mono text-rose-900 dark:text-rose-200 tracking-wider dir-ltr select-all">01020653195</p>
                </div>
                <button (click)="copyToClipboard('01020653195')" 
                        class="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>{{ copiedNumber ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ' : 'Copy') }}</span>
                </button>
              </div>
            </div>

            <!-- Instructions -->
            <div class="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <p class="font-bold text-slate-800 dark:text-slate-200">{{ lang === 'ar' ? 'تعليمات تفعيل الكورس:' : 'Activation Instructions:' }}</p>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <p>{{ lang === 'ar' ? 'قم بالتحويل أولاً عبر فودافون كاش إلى الرقم أعلاه (01020653195) بالمبلغ المطلوب (' + getEffectivePrice() + ' ج.م).' : 'Transfer ' + getEffectivePrice() + ' EGP via Vodafone Cash to the number above (01020653195).' }}</p>
              </div>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <p>{{ lang === 'ar' ? 'التقط سكرين شوت (لقطة شاشة) واضحة لرسالة أو إشعار التحويل الناجح.' : 'Take a clear screenshot of the transfer message or confirmation.' }}</p>
              </div>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <p>{{ lang === 'ar' ? 'أرسل اسمك والبريد الإلكتروني المسجلين بالمنصة مع سكرين شوت التحويل إلى رقم الواتساب: 01020653195 لتفعيل حسابك فوراً.' : 'Send your name & registered email along with the receipt screenshot to WhatsApp: 01020653195 for instant activation.' }}</p>
              </div>
            </div>

            <a [href]="getWhatsAppUrl('vodafone')" target="_blank" 
               class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-4">
              <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/>
              </svg>
              <span>{{ lang === 'ar' ? 'إرسال السكرين شوت عبر واتساب' : 'Send Screenshot via WhatsApp' }}</span>
            </a>
          </div>

          <!-- Content: Paymob -->
          <div *ngIf="selectedPaymentMethod === 'paymob'" class="space-y-4 animate-fade-in">
            <div class="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/50 text-center">
              <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-600/30">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <h4 class="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
                {{ lang === 'ar' ? 'الدفع الإلكتروني الفوري' : 'Instant Online Payment' }}
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {{ lang === 'ar' ? 'ادفع بأمان بواسطة الفيزا أو الماستركارد أو كروت ميزة أو المحافظ الإلكترونية. سيتم فتح الكورس تلقائياً وفوراً في حسابك فور إتمام العملية.' : 'Pay securely via Credit Card, Debit Card, Meeza, or Mobile Wallets. Instant automatic enrollment upon completion.' }}
              </p>
            </div>

            <!-- Prominent Redirect Notice inside the modal -->
            <div *ngIf="isProcessingPayment" class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2.5 animate-pulse shadow-sm">
              <span class="w-4 h-4 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin shrink-0"></span>
              <span>{{ lang === 'ar' ? 'جاري تحويلك لبوابة الدفع...' : 'Redirecting to payment gateway...' }}</span>
            </div>

            <button (click)="payWithPaymob()" [disabled]="isProcessingPayment" 
                    class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50">
              <span *ngIf="isProcessingPayment" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isProcessingPayment ? (lang === 'ar' ? 'جاري التحويل لبوابة Paymob...' : 'Redirecting to Paymob...') : (lang === 'ar' ? 'المتابعة للدفع عبر Paymob (' + getEffectivePrice() + ' ج.م)' : 'Proceed to Paymob (' + getEffectivePrice() + ' EGP)') }}</span>
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
  videoSourceType: 'upload' | 'url' = 'upload';

  showPaymentModal = false;
  selectedPaymentMethod: 'instapay' | 'vodafone' | 'paymob' = 'instapay';
  copiedNumber = false;
  userName = '';
  userEmail = '';

  message = '';
  messageType: 'success' | 'error' | 'warning' = 'success';
  showDeleteModal = false;
  lessonToDeleteId: number | null = null;
  editingLessonId: number | null = null;
  isTeacher = false;
  isProcessingPayment = false;
  isSavingAssignment = false;

  showAssignmentPage = false;
  showDeleteAssignmentModal = false;
  isAssignmentEditMode = false;
  isDeletingAssignment = false;
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

    const token = localStorage.getItem('token');
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any>('https://qimma.runasp.net/api/user/profile', { headers }).subscribe({
        next: (profile) => {
          if (profile) {
            this.userName = profile.username || profile.name || '';
            this.userEmail = profile.email || '';
          }
        },
        error: () => {}
      });
    }

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
      this.assignmentError = msg;
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

  showMessage(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
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

      this.http.post('https://qimma.runasp.net/api/course/upload-video', formData, { headers }).subscribe({
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
      this.isAssignmentEditMode = true;
      this.showAssignmentPage = true;
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.assignmentError = '';
    this.http.get<any[]>(`https://qimma.runasp.net/api/assignments/lesson/${lessonId}`, { headers }).subscribe({
      next: (assignments) => {
        if (assignments && assignments.length > 0) {
          const assignment = assignments[0];
          this.assignmentData = {
            title: (assignment.title || '').trimStart(),
            dueDate: this.formatDateForInput(assignment.dueDate),
            questions: assignment.questions.map((q: any) => {
              const opts = q.options ? q.options.split(',').map((o: string) => o.trim()) : ['', '', '', ''];
              const cIdx = q.correctAnswer ? opts.indexOf(q.correctAnswer.trim()) : 0;
              return {
                text: q.questionText || '',
                type: q.type === 'essay' ? 'written' : 'mcq',
                options: opts,
                correctIndex: cIdx >= 0 ? cIdx : 0
              };
            })
          };
          this.localAssignmentsCache[lessonId] = JSON.parse(JSON.stringify(this.assignmentData));
          this.isAssignmentEditMode = true;
        } else {
          this.resetAssignmentForm();
          this.isAssignmentEditMode = false;
        }
        this.showAssignmentPage = true;
      },
      error: () => {
        this.resetAssignmentForm();
        this.isAssignmentEditMode = false;
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
      return;
    }

    if (this.assignmentData.title.startsWith(' ')) {
      this.assignmentError = this.lang === 'ar' ? 'لا يمكن أن يبدأ عنوان الواجب بمسافة فارغة.' : 'Assignment title cannot start with a space.';
      return;
    }

    if (!this.assignmentData.dueDate) {
      this.assignmentError = this.lang === 'ar' ? 'يرجى تحديد موعد وتاريخ التسليم.' : 'Please select the assignment due date & time.';
      return;
    }

    const nowStr = this.getLocalDateTimeString();
    if (this.assignmentData.dueDate < nowStr) {
      this.assignmentError = this.lang === 'ar' ? 'لا يمكن تحديد موعد تسليم في الماضي.' : 'Assignment due date cannot be in the past.';
      return;
    }

    for (let i = 0; i < this.assignmentData.questions.length; i++) {
      const q = this.assignmentData.questions[i];
      if (!q.text || !q.text.trim()) {
        this.assignmentError = this.lang === 'ar' ? `يرجى إدخال نص السؤال #${i + 1}.` : `Please enter text for question #${i + 1}.`;
        return;
      }
      if (q.text.startsWith(' ')) {
        this.assignmentError = this.lang === 'ar' ? `لا يمكن أن يبدأ نص السؤال #${i + 1} بمسافة فارغة.` : `Question #${i + 1} text cannot start with a space.`;
        return;
      }
      if (q.type === 'mcq') {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          if (!opt || !opt.trim()) {
            this.assignmentError = this.lang === 'ar' ? `يرجى ملء جميع خيارات السؤال #${i + 1}.` : `Please fill out all options for question #${i + 1}.`;
            return;
          }
          if (opt.startsWith(' ')) {
            this.assignmentError = this.lang === 'ar' ? `لا يمكن أن يبدأ خيار الإجابة في السؤال #${i + 1} بمسافة فارغة.` : `Option text in question #${i + 1} cannot start with a space.`;
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
        correctAnswer: q.type === 'mcq' ? (q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].trim() : (q.options && q.options[0] ? q.options[0].trim() : null)) : null,
        score: 1
      }))
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('https://qimma.runasp.net/api/assignments', payload, { headers }).subscribe({
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
      }
    });
  }

  openDeleteAssignmentModal() {
    this.showDeleteAssignmentModal = true;
  }

  confirmDeleteAssignment() {
    if (!this.selectedLessonIdForAssignment) return;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.isDeletingAssignment = true;
    this.http.delete(`https://qimma.runasp.net/api/assignments/lesson/${this.selectedLessonIdForAssignment}`, { headers }).subscribe({
      next: () => {
        delete this.localAssignmentsCache[this.selectedLessonIdForAssignment!];
        this.isDeletingAssignment = false;
        this.showDeleteAssignmentModal = false;
        this.showAssignmentPage = false;
        this.showMessage(this.lang === 'ar' ? 'تم حذف الواجب نهائياً 🗑️' : 'Assignment deleted permanently 🗑️', 'success');
      },
      error: () => {
        this.isDeletingAssignment = false;
        this.showDeleteAssignmentModal = false;
        this.showMessage(this.lang === 'ar' ? 'حدث خطأ أثناء حذف الواجب' : 'An error occurred while deleting the assignment', 'error');
      }
    });
  }

  getEffectivePrice(): number {
    if (!this.course) return 0;
    if (this.course.isFree) return 0;
    if (this.course.discountPercentage > 0) {
      return Math.round(this.course.price - (this.course.price * this.course.discountPercentage / 100));
    }
    return this.course.price || 0;
  }

  enrollInCourse() {
    if (this.course?.isFree) {
      this.payWithPaymob();
    } else {
      this.showPaymentModal = true;
    }
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.copiedNumber = false;
  }

  copyToClipboard(num: string) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(num);
      this.copiedNumber = true;
      setTimeout(() => this.copiedNumber = false, 2500);
    }
  }

  getWhatsAppUrl(method: 'instapay' | 'vodafone'): string {
    const methodText = method === 'instapay' ? (this.lang === 'ar' ? 'إنستاباي' : 'InstaPay') : (this.lang === 'ar' ? 'فودافون كاش' : 'Vodafone Cash');
    const courseTitle = this.course?.title || '';
    const name = this.userName || '';
    const email = this.userEmail || '';
    const text = this.lang === 'ar'
      ? `مرحباً، قمت بتحويل رسوم الاشتراك لكورس "${courseTitle}" عبر ${methodText}.%0Aالاسم: ${name}%0Aالبريد الإلكتروني: ${email}%0A(مرفق سكرين شوت التحويل)`
      : `Hello, I transferred the enrollment fee for course "${courseTitle}" via ${methodText}.%0AName: ${name}%0AEmail: ${email}%0A(Transfer screenshot attached)`;
    return `https://wa.me/201020653195?text=${text}`;
  }

  payWithPaymob() {
    this.isProcessingPayment = true;
    this.showMessage(this.lang === 'ar' ? 'جاري تحويلك لبوابة الدفع...' : 'Redirecting to payment gateway...', 'warning');
    this.paymentService.checkoutCourse(this.courseId).subscribe({
      next: (response: any) => {
        const url = response.checkoutUrl || response.CheckoutUrl;
        this.isProcessingPayment = false;
        if (url) {
          window.location.href = url;
        } else {
          this.showMessage(this.lang === 'ar' ? 'رابط الدفع غير موجود في الاستجابة' : 'Checkout URL not found', 'error');
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
    const vUrl = lesson.videoUrl || '';
    if (vUrl.startsWith('http://') || vUrl.startsWith('https://') || vUrl.includes('youtube.com') || vUrl.includes('youtu.be') || vUrl.includes('vimeo.com')) {
      this.videoSourceType = 'url';
    } else {
      this.videoSourceType = 'upload';
    }
    this.lessonForm.patchValue({
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingLessonId = null;
    this.videoSourceType = 'upload';
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