import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-assignment-solver',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 min-h-screen flex flex-col font-sans" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      <div *ngIf="message" [ngClass]="{'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800': messageType === 'success', 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800': messageType === 'error'}" class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-3 animate-fade-in transition-all">
        {{ message }}
      </div>

      <header class="bg-[#130E35] dark:bg-slate-900 border-b border-indigo-900/50 dark:border-slate-800 text-white py-4 px-6 shadow-md shrink-0">
        <div class="max-w-4xl mx-auto flex justify-between items-center">
          <div class="flex items-center gap-4">
            <button (click)="goBack()" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
              <span class="rtl:rotate-180 font-bold text-lg">←</span>
            </button>
            <div>
              <h1 class="text-xl font-extrabold">{{ assignment?.title || t[lang].loading }}</h1>
              <div class="flex items-center gap-3 mt-1 flex-wrap">
                <p class="text-indigo-300 dark:text-indigo-400 text-xs">{{ assignment?.courseTitle }}</p>
                <span *ngIf="assignment?.dueDate" class="text-xs px-2.5 py-0.5 rounded-full font-bold" [ngClass]="isExpired ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40' : 'bg-white/10 text-slate-200'">
                  ⏰ {{ lang === 'ar' ? 'موعد التسليم:' : 'Due:' }} {{ assignment.dueDate | date:'d MMM y - h:mm a' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 max-w-4xl w-full mx-auto p-6 lg:p-8">
        <div *ngIf="isLoading" class="space-y-4 animate-pulse">
          <div *ngFor="let i of [1,2,3]" class="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        </div>

        <div *ngIf="!isLoading && assignment" class="space-y-6 animate-fade-in pb-20">
          <div *ngIf="alreadySubmitted" class="bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-900/60 p-6 rounded-3xl text-center space-y-2 animate-fade-in">
            <span class="text-3xl block">📋</span>
            <h3 class="text-lg font-bold text-indigo-900 dark:text-indigo-200">{{ lang === 'ar' ? 'تم تسليم هذا الواجب مسبقاً' : 'Assignment Already Submitted' }}</h3>
            <p *ngIf="submittedDetails?.givenScore !== null" class="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {{ lang === 'ar' ? 'تم تقييم الواجب! درجتك:' : 'Graded! Your score:' }} {{ submittedDetails.givenScore }} / {{ submittedDetails.totalScore }}
            </p>
            <p *ngIf="submittedDetails?.givenScore === null" class="text-sm font-medium text-amber-600 dark:text-amber-400">
              {{ lang === 'ar' ? 'لقد قمت بتسليم إجاباتك بنجاح، والواجب قيد المراجعة والتقييم من قِبل المعلم.' : 'Your submission was received and is currently pending review by your teacher.' }}
            </p>
          </div>

          <div *ngIf="isExpired && !alreadySubmitted" class="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900/60 p-6 rounded-3xl text-center space-y-2 animate-fade-in">
            <span class="text-3xl block">⛔</span>
            <h3 class="text-lg font-bold text-rose-800 dark:text-rose-300">{{ lang === 'ar' ? 'انتهت مهلة تسليم هذا الواجب' : 'This assignment deadline has passed' }}</h3>
            <p class="text-sm text-rose-600 dark:text-rose-400 font-medium">{{ lang === 'ar' ? 'لا يمكن استقبال إجابات جديدة بعد انتهاء الوقت المحدد.' : 'Submissions are no longer accepted after the deadline.' }}</p>
          </div>

          <div *ngFor="let q of assignment.questions; let i = index" class="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 class="font-bold text-slate-800 dark:text-white text-lg mb-4 leading-relaxed">
               <span class="text-indigo-600 dark:text-indigo-400">{{ lang === 'ar' ? 'س' : 'Q' }}{{ i + 1 }}:</span> {{ q.questionText }}
            </h3>
            
            <div *ngIf="q.type === 'mcq'" class="space-y-3">
               <label *ngFor="let option of (q.options ? q.options.split(',') : []); let optIdx = index" class="flex items-center p-4 border border-slate-200 dark:border-slate-700/80 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 transition" [ngClass]="{'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500 ring-1 ring-indigo-300 dark:ring-indigo-500': answers[q.id] === optIdx.toString(), 'opacity-60 cursor-not-allowed': isExpired || alreadySubmitted}">
                 <input type="radio" [disabled]="isExpired || alreadySubmitted" [name]="'q_' + q.id" [value]="optIdx.toString()" [(ngModel)]="answers[q.id]" class="w-4 h-4 text-indigo-600 accent-indigo-600 focus:ring-indigo-500">
                 <span class="ml-3 rtl:mr-3 rtl:ml-0 font-medium text-slate-700 dark:text-slate-300 text-sm">{{ option }}</span>
               </label>
            </div>

            <div *ngIf="q.type !== 'mcq'" class="mt-4">
               <textarea [(ngModel)]="answers[q.id]" [disabled]="isExpired || alreadySubmitted" rows="4" class="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed" [placeholder]="lang === 'ar' ? 'اكتب إجابتك هنا...' : 'Type your answer here...'"></textarea>
            </div>
          </div>

          <div class="flex justify-end pt-4" *ngIf="!alreadySubmitted">
             <button (click)="submitAssignment()" [disabled]="isSubmitting || isExpired" class="flex items-center justify-center gap-2 px-10 py-4 bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50">
               <svg *ngIf="isSubmitting" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                 <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               {{ isSubmitting ? t[lang].submitting : (isExpired ? (lang === 'ar' ? 'انتهت المهلة' : 'Deadline Passed') : t[lang].submitBtn) }}
             </button>
          </div>
          <div class="flex justify-end pt-4" *ngIf="alreadySubmitted">
             <button (click)="goBack()" class="flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-sm transition">
               {{ lang === 'ar' ? 'العودة' : 'Go Back' }}
             </button>
          </div>
        </div>
      </main>
    </div>
  `
})
export class AssignmentSolverComponent implements OnInit {
  assignmentId!: number;
  assignment: any = null;
  isLoading = true;
  isSubmitting = false;
  isExpired = false;
  alreadySubmitted = false;
  submittedDetails: any = null;
  answers: { [questionId: number]: string } = {};
  
  message = '';
  messageType: 'success' | 'error' = 'success';
  lang: 'en' | 'ar' = 'en';

  t = {
    en: { loading: 'Loading Assignment...', submitBtn: 'Submit Assignment', submitting: 'Submitting...', success: 'Assignment submitted successfully!', error: 'An error occurred.', missingAnswers: 'Please answer all questions before submitting.' },
    ar: { loading: 'جاري تحميل الواجب...', submitBtn: 'تسليم الواجب', submitting: 'جاري التسليم...', success: 'تم تسليم الواجب بنجاح!', error: 'حدث خطأ أثناء التسليم.', missingAnswers: 'برجاء الإجابة على جميع الأسئلة قبل التسليم.' }
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
      this.assignmentId = +params['id'];
      this.loadAssignment();
    });
  }

  loadAssignment() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any>(`https://qimma.runasp.net/api/assignments/${this.assignmentId}`, { headers }).subscribe({
      next: (data) => {
        this.assignment = data;
        if (data?.dueDate) {
          const dueTime = new Date(data.dueDate).getTime();
          if (dueTime < Date.now()) {
            this.isExpired = true;
          }
        }
        this.isLoading = false;

        this.http.get<any[]>('https://qimma.runasp.net/api/assignments/student', { headers }).subscribe({
          next: (subs) => {
            const found = (subs || []).find((s: any) => s.assignmentId === this.assignmentId);
            if (found) {
              this.alreadySubmitted = true;
              this.submittedDetails = found;
            }
          }
        });
      },
      error: () => {
        this.showMessage(this.t[this.lang].error, 'error');
        this.goBack();
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error' = 'success') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  submitAssignment() {
    if (this.isExpired) {
      this.showMessage(this.lang === 'ar' ? 'انتهت مهلة هذا الواجب ولا يمكن تسليمه.' : 'Deadline passed. Submissions closed.', 'error');
      return;
    }

    if (Object.keys(this.answers).length < (this.assignment?.questions?.length || 0)) {
      this.showMessage(this.t[this.lang].missingAnswers, 'error');
      return;
    }

    this.isSubmitting = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const payload = {
      assignmentId: this.assignmentId,
      answers: Object.keys(this.answers).map(qId => {
        const question = this.assignment.questions.find((q: any) => q.id === +qId);
        let finalAnswer = this.answers[+qId];
        
        if (question && question.type === 'mcq') {
          const opts = question.options ? question.options.split(',') : [];
          finalAnswer = opts[+finalAnswer] || finalAnswer;
        }

        return {
          assignmentQuestionId: +qId,
          answerText: finalAnswer
        };
      })
    };

    this.http.post('https://qimma.runasp.net/api/assignments/submit', payload, { headers }).subscribe({
      next: () => {
        this.showMessage(this.t[this.lang].success, 'success');
        setTimeout(() => this.goBack(), 1500);
      },
      error: () => {
        this.isSubmitting = false;
        this.showMessage(this.t[this.lang].error, 'error');
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard'], { queryParams: { tab: 'assignments' }, replaceUrl: true });
  }
}