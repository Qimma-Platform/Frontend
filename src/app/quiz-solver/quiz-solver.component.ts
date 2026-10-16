import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { LanguageService } from '../services/language.service';
// import { jwtDecode } from 'jwt-decode'; // لو كنت بتستخدم مكتبة لفك التوكن، لو مش بتستخدمها هنستخدم الـ ID الوهمي مؤقتاً لحد ما نكلم الباك إند

@Component({
  selector: 'app-quiz-solver',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col font-sans relative" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      <header class="bg-[#130E35] dark:bg-slate-900 border-b border-indigo-900/50 dark:border-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-md z-10 relative">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="text-slate-400 hover:text-white transition flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10">
            <span class="rtl:rotate-180 text-xl">←</span>
          </button>
          <div>
            <h1 class="text-lg font-bold">{{ t[lang].title }}</h1>
            <p class="text-xs text-indigo-300 dark:text-indigo-400">{{ t[lang].subtitle }}</p>
          </div>
        </div>
      </header>

      <main class="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6">
        
        <div *ngIf="isLoading" class="space-y-6">
          <div class="h-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          <div class="h-32 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          <div class="h-32 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse"></div>
        </div>

        <div *ngIf="!isLoading && attemptsCount >= maxAttempts && !isSubmitted" class="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-lg border-2 border-rose-100 dark:border-rose-900/50 text-center max-w-md mx-auto mt-10 animate-fade-in">
          <div class="w-20 h-20 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">
            🔒
          </div>
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">{{ t[lang].lockedTitle }}</h2>
          <p class="text-slate-600 dark:text-slate-300 font-semibold mb-8">{{ t[lang].lockedDesc }}</p>
          <button (click)="goBack()" class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2">
            {{ t[lang].backBtn }}
          </button>
        </div>

        <div *ngIf="!isLoading && questions.length === 0 && attemptsCount < maxAttempts" class="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
          <span class="text-4xl mb-4 block">🚫</span>
          <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-2">{{ t[lang].noQuizTitle }}</h2>
          <button (click)="goBack()" class="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition">
            {{ t[lang].backBtn }}
          </button>
        </div>

        <div *ngIf="!isLoading && questions.length > 0 && attemptsCount < maxAttempts && !isSubmitted" class="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div class="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 px-4 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <span class="text-sm font-bold text-indigo-800 dark:text-indigo-300">{{ t[lang].attemptsLeft }}:</span>
            <span class="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg shadow-sm">{{ maxAttempts - attemptsCount }} / {{ maxAttempts }}</span>
          </div>

          <div *ngFor="let q of questions; let qIdx = index" class="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
            <h3 class="font-bold text-slate-800 dark:text-white text-lg">
              <span class="text-indigo-600 dark:text-indigo-400 mr-2">{{ qIdx + 1 }}.</span> {{ q.text }}
            </h3>
            <div *ngIf="q.imageUrl" class="w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mt-2">
              <img [src]="q.imageUrl" class="w-full h-auto object-cover">
            </div>
            <div class="space-y-2 mt-4">
              <label *ngFor="let opt of q.options; let oIdx = index" 
                     class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-indigo-50 dark:hover:bg-slate-750"
                     [ngClass]="userAnswers[qIdx] === oIdx ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'">
                <input type="radio" [name]="'q_' + qIdx" [value]="oIdx" [(ngModel)]="userAnswers[qIdx]" class="w-4 h-4 text-indigo-600 accent-indigo-600">
                <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ opt }}</span>
              </label>
            </div>
          </div>

          <button (click)="submitQuiz()" [disabled]="!isAllAnswered()" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-lg shadow-md transition">
            {{ t[lang].submitBtn }}
          </button>
        </div>

        <div *ngIf="isSubmitted" class="bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 animate-fade-in text-center">
          <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🎉</div>
          
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-white">{{ t[lang].resultTitle }}</h2>
          <div class="flex items-baseline justify-center gap-2 my-6">
            <span class="text-6xl font-black text-indigo-600 dark:text-indigo-400">{{ score }}</span>
            <span class="text-3xl font-bold text-slate-400 dark:text-slate-500">/ {{ questions.length }}</span>
          </div>
          
          <div class="text-left rtl:text-right space-y-4 mt-8">
            <h3 class="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">{{ t[lang].reviewAnswers }}</h3>
            
            <div *ngFor="let q of questions; let qIdx = index" class="p-4 rounded-2xl mb-3 border"
                 [ngClass]="userAnswers[qIdx] === q.correctIndex ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'">
              
              <p class="font-bold text-slate-800 dark:text-white mb-3">{{ qIdx + 1 }}. {{ q.text }}</p>
              
              <div *ngIf="userAnswers[qIdx] === q.correctIndex" class="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/50 dark:bg-emerald-900/40 p-2.5 rounded-xl w-fit">
                <span class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                {{ q.options[userAnswers[qIdx]] }}
              </div>

              <div *ngIf="userAnswers[qIdx] !== q.correctIndex" class="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold bg-rose-100/50 dark:bg-rose-900/40 p-2.5 rounded-xl w-fit">
                <span class="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">✕</span>
                {{ q.options[userAnswers[qIdx]] }}
              </div>

            </div>
          </div>

          <button (click)="goBack()" class="w-full py-4 mt-8 bg-slate-800 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-md">
            {{ t[lang].finishBtn }}
          </button>
        </div>

      </main>
    </div>
  `
})
export class QuizSolverComponent implements OnInit {
  lessonId!: number;
  questions: any[] = [];
  userAnswers: { [key: number]: number } = {};
  isLoading = true;
  isSubmitted = false;
  score = 0;
  
  maxAttempts = 3;
  attemptsCount = 0;
  studentId = 'unknown_student'; // سيتم استبداله برقم الطالب الحقيقي
  
  lang: 'en' | 'ar' = 'en';

  t = {
    en: {
      title: 'Lesson Quiz', subtitle: 'Choose the correct answer for each question',
      loading: 'Loading questions...', noQuizTitle: 'No Quiz Available',
      backBtn: 'Go Back', submitBtn: 'Submit Answers', resultTitle: 'Your Quiz Result',
      reviewAnswers: 'Answers Review', finishBtn: 'Return to Course',
      attemptsLeft: 'Attempts left', lockedTitle: 'Sorry!', 
      lockedDesc: 'You have exhausted your allowed attempts (3 max).'
    },
    ar: {
      title: 'اختبار الدرس', subtitle: 'اختر الإجابة الصحيحة لكل سؤال',
      loading: 'جاري تحميل الأسئلة...', noQuizTitle: 'لا يوجد اختبار',
      backBtn: 'العودة للدرس', submitBtn: 'إرسال الإجابات', resultTitle: 'نتيجة الاختبار',
      reviewAnswers: 'مراجعة الإجابات', finishBtn: 'العودة للكورس',
      attemptsLeft: 'المحاولات المتبقية', lockedTitle: 'عفواً!', 
      lockedDesc: 'لقد استنفذت عدد المحاولات المسموح بها (3 محاولات).'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private langService: LanguageService
  ) {}

  ngOnInit() {
    this.langService.currentLang$.subscribe(l => this.lang = l);
    this.route.params.subscribe(params => {
      this.lessonId = +params['lessonId'];
      
      // هنا بنحاول نجيب ID الطالب من التوكن، لو مش موجود بنعمل ID وهمي مؤقت بس مش هيعمل مشكلة التداخل تاني
      const token = localStorage.getItem('token');
      if (token) {
         try {
            // حل بديل سريع لفك التوكن بدون مكاتب خارجية لمعرفة ID الطالب
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.studentId = payload.nameid || payload.sub || 'student_' + Math.random().toString(36).substring(7);
         } catch(e) {
            this.studentId = 'student_fallback';
         }
      }
      
      this.loadAttemptCount();
      this.loadQuiz();
    });
  }

  getStorageKey() {
    // المفتاح دلوقتي بقى مميز جداً: بيشمل رقم الدرس + رقم الطالب! كدا مستحيل يتداخلوا.
    return `quiz_attempts_lesson_${this.lessonId}_student_${this.studentId}`;
  }

  loadAttemptCount() {
    const savedAttempts = localStorage.getItem(this.getStorageKey());
    this.attemptsCount = savedAttempts ? parseInt(savedAttempts, 10) : 0;
  }

  loadQuiz() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`http://localhost:5162/api/quiz/lesson/${this.lessonId}`, { headers }).subscribe({
      next: (res) => {
        if (res.questions) {
          this.questions = res.questions;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  isAllAnswered(): boolean {
    return this.questions.length > 0 && Object.keys(this.userAnswers).length === this.questions.length;
  }

  submitQuiz() {
    this.score = 0;
    this.questions.forEach((q, index) => {
      if (this.userAnswers[index] === q.correctIndex) {
        this.score++;
      }
    });
    
    this.attemptsCount++;
    localStorage.setItem(this.getStorageKey(), this.attemptsCount.toString());
    
    this.isSubmitted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // إرسال النتيجة للباك إند لتحديث النقاط (لو عامل Endpoint الـ Score)
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    const scoreData = {
      lessonId: this.lessonId,
      score: this.score,
      totalQuestions: this.questions.length
    };

    this.http.post('http://localhost:5162/api/quiz/submit-score', scoreData, { headers }).subscribe({
      next: (res: any) => {
         console.log('Score updated successfully', res);
      },
      error: (err) => {
        console.error('Error submitting score', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard'], { replaceUrl: true }); 
  }
}