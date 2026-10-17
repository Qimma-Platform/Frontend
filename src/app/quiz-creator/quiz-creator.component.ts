import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-quiz-creator',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col font-sans relative" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      
      <div *ngIf="message" [ngClass]="{'bg-emerald-500': messageType === 'success', 'bg-rose-500': messageType === 'error'}" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-xl text-white font-bold transition-all duration-500 flex items-center gap-3">
        <span>{{ message }}</span>
      </div>

      <div *ngIf="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all">
          <div class="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl mx-auto mb-4">
            ⚠️
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">{{ t[lang].deleteConfirmTitle }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">{{ t[lang].deleteConfirmDesc }}</p>
          <div class="flex gap-3">
            <button (click)="closeDeleteModal()" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition">
              {{ t[lang].cancelQuiz }}
            </button>
            <button (click)="confirmDeleteQuiz()" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-200 dark:shadow-none">
              {{ t[lang].confirmDeleteBtn }}
            </button>
          </div>
        </div>
      </div>

      <header class="bg-[#130E35] dark:bg-slate-900 border-b border-indigo-900/50 dark:border-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-md z-10 relative">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="text-slate-400 hover:text-white transition flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10">
            <span class="rtl:rotate-180 text-xl">←</span>
          </button>
          <div>
            <h1 class="text-lg font-bold">{{ isEditMode ? t[lang].editTitle : t[lang].title }}</h1>
            <p class="text-xs text-indigo-300 dark:text-indigo-400">{{ t[lang].subtitle }}</p>
          </div>
        </div>
      </header>

      <main class="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div *ngIf="formError" class="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-2xl text-sm font-bold flex items-center gap-3 animate-fade-in">
            <span>⚠️ {{ formError }}</span>
          </div>
          <div *ngFor="let q of questions; let qIdx = index; trackBy: trackByIndex" class="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-700 dark:text-slate-300 text-sm"># {{ qIdx + 1 }} - {{ t[lang].question }}</span>
              <button *ngIf="questions.length > 1" (click)="removeQuestion(qIdx)" class="text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-bold">
                 {{ t[lang].delete }}
              </button>
            </div>

            <div class="space-y-3">
              <input type="text" [(ngModel)]="q.text" [name]="'question_text_' + qIdx" [placeholder]="t[lang].questionPlaceholder" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:text-white">
              
              <div class="flex items-center gap-3">
                <label class="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition flex items-center gap-2">
                   {{ t[lang].uploadImage }}
                  <input type="file" (change)="onImageSelected($event, q)" accept="image/*" class="hidden">
                </label>
                <span class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs" *ngIf="q.imageFileName">{{ q.imageFileName }}</span>
                <button *ngIf="q.imageUrl" (click)="q.imageUrl = ''; q.imageFileName = ''" class="text-rose-500 dark:text-rose-400 text-xs font-bold hover:underline">Remove</button>
              </div>

              <div *ngIf="q.imageUrl" class="w-32 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                <img [src]="q.imageUrl" class="w-full h-full object-cover">
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-500 dark:text-slate-400">{{ t[lang].options }}</label>
                <button *ngIf="q.options.length < 6" type="button" (click)="addOption(q)" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                  + {{ lang === 'ar' ? 'إضافة خيار' : 'Add Option' }}
                </button>
              </div>

              <div *ngFor="let opt of q.options; let oIdx = index; trackBy: trackByIndex" 
                   class="flex items-center gap-3 p-2.5 rounded-2xl transition border"
                   [ngClass]="q.correctIndex === oIdx ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'">
                <label class="flex items-center gap-2 cursor-pointer shrink-0" [title]="lang === 'ar' ? 'حدد هذا الخيار كإجابة صحيحة' : 'Mark as correct answer'">
                  <input type="radio" [name]="'correct_option_q_' + qIdx" [checked]="q.correctIndex === oIdx" (change)="q.correctIndex = oIdx" class="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer">
                  <span *ngIf="q.correctIndex === oIdx" class="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {{ t[lang].correctAnswer }}
                  </span>
                </label>
                
                <input type="text" [(ngModel)]="q.options[oIdx]" [name]="'q_' + qIdx + '_opt_' + oIdx" [placeholder]="t[lang].optionPlaceholder + ' ' + (oIdx + 1)" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <button *ngIf="q.options.length > 2" type="button" (click)="removeOption(q, oIdx)" class="text-slate-400 hover:text-rose-500 font-bold text-xs p-1" title="Delete Option">
                  ✕
                </button>
              </div>
            </div>
          </div>

          <button (click)="addQuestion()" class="w-full py-3 border-2 border-dashed border-indigo-300 dark:border-indigo-500/40 hover:border-indigo-500 dark:hover:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold rounded-2xl text-sm transition">
            + {{ t[lang].addQuestion }}
          </button>

          <div class="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button (click)="openDeleteModal()" 
                    class="px-6 py-3.5 bg-rose-50 dark:bg-[#28131d] hover:bg-rose-100 dark:hover:bg-[#381a28] text-rose-600 dark:text-[#ff6b81] border border-rose-200 dark:border-rose-900/40 font-bold rounded-2xl text-base transition shrink-0 cursor-pointer">
              {{ t[lang].deleteQuiz }}
            </button>
            <button (click)="cancelQuiz()" 
                    class="flex-1 py-3.5 bg-slate-100 dark:bg-[#1a2234] hover:bg-slate-200 dark:hover:bg-[#232d45] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 font-bold rounded-2xl text-base transition cursor-pointer">
              {{ t[lang].cancelQuiz }}
            </button>
            <button (click)="saveQuiz()" 
                    class="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-base shadow-lg shadow-indigo-600/30 transition cursor-pointer">
              {{ t[lang].saveQuiz }}
            </button>
          </div>

        </div>
      </main>
    </div>
  `
})
export class QuizCreatorComponent implements OnInit {
  lessonId!: number;
  lang: 'en' | 'ar' = 'en';
  message = '';
  messageType: 'success' | 'error' = 'success';
  formError = '';
  isEditMode = false;
  showDeleteModal = false;

  questions: any[] = [
    { text: '', imageUrl: '', imageFileName: '', options: ['', '', '', ''], correctIndex: 0 }
  ];

  t = {
    en: {
      title: 'Create Lesson Quiz', editTitle: 'Edit Lesson Quiz', subtitle: 'Add or modify questions and set correct answers',
      question: 'Question', delete: 'Delete', questionPlaceholder: 'Enter question text...',
      uploadImage: 'Upload Photo (Optional)', options: 'Options (Select correct answer button):',
      correctAnswer: '✓ Correct Answer',
      optionPlaceholder: 'Option', addQuestion: 'Add Another Question', saveQuiz: 'Save Quiz',
      cancelQuiz: 'Cancel', deleteQuiz: 'Delete Quiz', successMsg: 'Quiz saved successfully! 🚀',
      validationError: 'Please fill in all questions and options correctly ❌', deletedMsg: 'Quiz deleted permanently 🗑️',
      serverError: 'A server error occurred. Please try again ❌', deleteConfirmTitle: 'Confirm Deletion',
      deleteConfirmDesc: 'Are you sure you want to delete this quiz? This action cannot be undone.', confirmDeleteBtn: 'Yes, Delete'
    },
    ar: {
      title: 'إنشاء اختبار الدرس', editTitle: 'تعديل اختبار الدرس', subtitle: 'إضافة أو تعديل الأسئلة وتحديد الإجابات الصحيحة',
      question: 'سؤال', delete: 'حذف', questionPlaceholder: 'اكتب نص السؤال هنا...',
      uploadImage: 'رفع صورة (اختياري)', options: 'الاختيارات (اختر زر الإجابة الصحيحة):',
      correctAnswer: '✓ الإجابة النموذجية',
      optionPlaceholder: 'اختيار', addQuestion: 'إضافة سؤال جديد', saveQuiz: 'حفظ الاختبار',
      cancelQuiz: 'إلغاء', deleteQuiz: 'حذف الاختبار', successMsg: 'تم حفظ الاختبار بنجاح! 🚀',
      validationError: 'يرجى ملء جميع الأسئلة والاختيارات بشكل صحيح ❌', deletedMsg: 'تم حذف الاختبار نهائياً 🗑️',
      serverError: 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى ❌', deleteConfirmTitle: 'تأكيد الحذف',
      deleteConfirmDesc: 'هل أنت متأكد من حذف هذا الاختبار بالكامل؟ لا يمكن التراجع عن هذا الإجراء.', confirmDeleteBtn: 'نعم، احذف'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private langService: LanguageService,
    private location: Location
  ) {}

  ngOnInit() {
    this.langService.currentLang$.subscribe(l => this.lang = l);
    this.route.params.subscribe(params => {
      this.lessonId = +params['lessonId'];
      this.loadExistingQuiz();
    });
  }

  // الدالة السحرية اللي بتحل باج الكتابة في حقول مصفوفة الـ Primitives
  trackByIndex(index: number, obj: any): any {
    return index;
  }

  loadExistingQuiz() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`https://qimma.runasp.net/api/quiz/lesson/${this.lessonId}`, { headers }).subscribe({
      next: (res) => {
        if (res.questions && res.questions.length > 0) {
          this.isEditMode = true;
          this.questions = res.questions.map((q: any) => ({
            text: q.text,
            imageUrl: q.imageUrl || '',
            imageFileName: q.imageUrl ? 'Uploaded Image' : '',
            options: q.options && q.options.length >= 2 ? q.options : ['', '', '', ''],
            correctIndex: q.correctIndex
          }));
        }
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error' = 'success') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3500);
  }

  addQuestion() {
    this.questions.push({ text: '', imageUrl: '', imageFileName: '', options: ['', '', '', ''], correctIndex: 0 });
  }

  removeQuestion(index: number) {
    this.questions.splice(index, 1);
  }

  addOption(q: any) {
    if (q.options.length < 6) {
      q.options.push('');
    }
  }

  removeOption(q: any, oIdx: number) {
    if (q.options.length > 2) {
      q.options.splice(oIdx, 1);
      if (q.correctIndex >= q.options.length) {
        q.correctIndex = q.options.length - 1;
      }
    }
  }

  onImageSelected(event: any, question: any) {
    const file = event.target.files[0];
    if (file) {
      question.imageFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        question.imageUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  cancelQuiz() {
    this.location.back();
  }

  openDeleteModal() {
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  clearAllStudentAttemptsForThisLesson() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`quiz_attempts_lesson_${this.lessonId}_student_`)) {
        localStorage.removeItem(key);
      }
    });
  }

  confirmDeleteQuiz() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete(`https://qimma.runasp.net/api/quiz/lesson/${this.lessonId}`, { headers }).subscribe({
      next: () => {
        this.showMessage(this.t[this.lang].deletedMsg, 'success');
        this.clearAllStudentAttemptsForThisLesson();
        this.closeDeleteModal();
        setTimeout(() => this.goBack(), 1500);
      },
      error: () => {
        this.showMessage(this.t[this.lang].serverError, 'error');
        this.closeDeleteModal();
      }
    });
  }

  saveQuiz() {
    this.formError = '';
    for (let q of this.questions) {
      if (!q.text.trim()) {
        this.formError = this.t[this.lang].validationError;
        return;
      }
      if (q.text.startsWith(' ')) {
        this.formError = this.lang === 'ar' ? 'لا يمكن أن يبدأ نص السؤال بمسافة فارغة.' : 'Question text cannot start with a space.';
        return;
      }
      for (let opt of q.options) {
        if (!opt.trim()) {
          this.formError = this.t[this.lang].validationError;
          return;
        }
        if (opt.startsWith(' ')) {
          this.formError = this.lang === 'ar' ? 'لا يمكن أن يبدأ خيار الإجابة بمسافة فارغة.' : 'Option text cannot start with a space.';
          return;
        }
      }
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const quizData = {
      lessonId: this.lessonId,
      questions: this.questions
    };

    this.http.post('https://qimma.runasp.net/api/quiz/create', quizData, { headers }).subscribe({
      next: () => {
        this.formError = '';
        this.showMessage(this.t[this.lang].successMsg, 'success');
        this.clearAllStudentAttemptsForThisLesson();
        setTimeout(() => this.location.back(), 1500);
      },
      error: () => {
        this.formError = this.t[this.lang].serverError;
      }
    });
  }

  goBack() {
    this.location.back();
  }
}