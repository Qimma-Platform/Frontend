import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { LanguageService } from '../services/language.service';
import { AssignmentService } from '../services/assignment.service';

@Component({
  selector: 'app-assignment-creator',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans relative" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">

      <div *ngIf="message" [ngClass]="{'bg-emerald-500': messageType === 'success', 'bg-rose-500': messageType === 'error'}" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-xl text-white font-bold transition-all duration-500 flex items-center gap-3">
        <span>{{ message }}</span>
      </div>

      <div *ngIf="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
        <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all">
          <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto mb-4">
            ⚠️
          </div>
          <h3 class="text-xl font-bold text-slate-900 text-center mb-2">{{ t[lang].deleteConfirmTitle }}</h3>
          <p class="text-sm text-slate-500 text-center mb-8">{{ t[lang].deleteConfirmDesc }}</p>
          <div class="flex gap-3">
            <button (click)="showDeleteModal = false" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
              {{ t[lang].cancel }}
            </button>
            <button (click)="confirmDelete()" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-200">
              {{ t[lang].confirmDeleteBtn }}
            </button>
          </div>
        </div>
      </div>

      <header class="bg-[#130E35] text-white px-6 py-4 flex items-center justify-between shadow-md z-10 relative">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="text-slate-400 hover:text-white transition flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10">
            <span class="rtl:rotate-180 text-xl">←</span>
          </button>
          <div>
            <h1 class="text-lg font-bold">{{ isEditMode ? t[lang].editTitle : t[lang].title }}</h1>
            <p class="text-xs text-indigo-300">{{ t[lang].subtitle }}</p>
          </div>
        </div>
      </header>

      <main class="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">

          <!-- Assignment Title -->
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].assignmentTitle }}</label>
            <input type="text" [(ngModel)]="assignmentData.title" [placeholder]="t[lang].titlePlaceholder" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm">
          </div>

          <!-- Due Date -->
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].dueDate }}</label>
            <input type="datetime-local" [(ngModel)]="assignmentData.dueDate" [min]="minDate" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm dir-ltr text-left">
          </div>

          <!-- Questions -->
          <div *ngFor="let q of assignmentData.questions; let qIdx = index; trackBy: trackByIndex" class="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-700 text-sm"># {{ qIdx + 1 }} - {{ t[lang].question }}</span>
              <button *ngIf="assignmentData.questions.length > 1" (click)="removeQuestion(qIdx)" class="text-rose-500 hover:text-rose-700 text-xs font-bold">
                {{ t[lang].delete }}
              </button>
            </div>

            <div class="space-y-3">
              <input type="text" [(ngModel)]="q.text" [name]="'q_text_' + qIdx" [placeholder]="t[lang].questionPlaceholder" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">

              <!-- Question Type -->
              <div class="flex items-center gap-4">
                <label class="text-xs font-bold text-slate-500">{{ t[lang].questionType }}</label>
                <select [(ngModel)]="q.type" [name]="'q_type_' + qIdx" (ngModelChange)="onTypeChange(q)" class="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none">
                  <option value="mcq">{{ t[lang].mcq }}</option>
                  <option value="written">{{ t[lang].written }}</option>
                </select>
              </div>
            </div>

            <!-- MCQ Options -->
            <div *ngIf="q.type === 'mcq'" class="space-y-2">
              <label class="text-xs font-bold text-slate-500">{{ t[lang].options }}</label>
              <div *ngFor="let opt of q.options; let oIdx = index; trackBy: trackByIndex" class="flex items-center gap-2">
                <input type="radio" [name]="'correct_q_' + qIdx" [checked]="q.correctIndex === oIdx" (change)="q.correctIndex = oIdx" class="w-4 h-4 text-indigo-600">
                <input type="text" [(ngModel)]="q.options[oIdx]" [name]="'q_' + qIdx + '_opt_' + oIdx" [placeholder]="t[lang].optionPlaceholder + ' ' + (oIdx + 1)" class="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none">
              </div>
            </div>

            <!-- Written answer hint -->
            <div *ngIf="q.type === 'written'" class="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p class="text-xs text-indigo-600 font-semibold">{{ t[lang].writtenHint }}</p>
            </div>
          </div>

          <button (click)="addQuestion()" class="w-full py-3 border-2 border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-600 hover:text-indigo-700 font-bold rounded-2xl text-sm transition">
            + {{ t[lang].addQuestion }}
          </button>

          <div class="flex flex-wrap sm:flex-nowrap items-center gap-4 pt-4 border-t border-slate-200">
            <button *ngIf="isEditMode" (click)="showDeleteModal = true" class="w-full sm:w-1/4 py-3.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-2xl text-base transition">
              {{ t[lang].deleteAssignment }}
            </button>
            <button (click)="goBack()" class="flex-1 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-base transition">
              {{ t[lang].cancel }}
            </button>
            <button (click)="saveAssignment()" [disabled]="isSaving" class="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl text-base shadow-md transition">
              {{ isSaving ? t[lang].saving : t[lang].save }}
            </button>
          </div>

        </div>
      </main>
    </div>
  `
})
export class AssignmentCreatorComponent implements OnInit {
  lessonId!: number;
  courseId: number = 0;
  lang: 'en' | 'ar' = 'en';
  message = '';
  messageType: 'success' | 'error' = 'success';
  isEditMode = false;
  isSaving = false;
  showDeleteModal = false;
  minDate = '';

  assignmentData: any = {
    title: '',
    dueDate: '',
    questions: [
      { text: '', type: 'mcq', options: ['', '', '', ''], correctIndex: 0 }
    ]
  };

  t: any = {
    en: {
      title: 'Create Assignment', editTitle: 'Edit Assignment',
      subtitle: 'Add questions and set end time for this lesson',
      assignmentTitle: 'Assignment Title', titlePlaceholder: 'Enter assignment title...',
      dueDate: 'End Time', question: 'Question', delete: 'Delete',
      questionPlaceholder: 'Enter question text...', questionType: 'Type:',
      mcq: 'Multiple Choice', written: 'Written / Essay',
      options: 'Options (Select the correct radio)', optionPlaceholder: 'Option',
      writtenHint: 'Students will type their answer as free text. You can grade it manually later.',
      addQuestion: 'Add Another Question', save: 'Save & Publish',
      saving: 'Saving...', cancel: 'Cancel', deleteAssignment: 'Delete Assignment',
      deleteConfirmTitle: 'Confirm Deletion',
      deleteConfirmDesc: 'Are you sure you want to delete this assignment? This action cannot be undone.',
      confirmDeleteBtn: 'Yes, Delete',
      successMsg: 'Assignment saved & published successfully! 🚀',
      validationError: 'Please fill in the title, end time, and all questions correctly ❌',
      deletedMsg: 'Assignment deleted successfully 🗑️',
      serverError: 'A server error occurred. Please try again ❌'
    },
    ar: {
      title: 'إنشاء واجب', editTitle: 'تعديل الواجب',
      subtitle: 'أضف أسئلة وحدد تاريخ التسليم لهذا الدرس',
      assignmentTitle: 'عنوان الواجب', titlePlaceholder: 'اكتب عنوان الواجب...',
      dueDate: 'تاريخ التسليم', question: 'سؤال', delete: 'حذف',
      questionPlaceholder: 'اكتب نص السؤال هنا...', questionType: 'النوع:',
      mcq: 'اختيار من متعدد', written: 'إجابة مكتوبة / مقالية',
      options: 'الاختيارات (اختر زر الإجابة الصحيحة)', optionPlaceholder: 'اختيار',
      writtenHint: 'سيكتب الطالب إجابته كنص حر. يمكنك تقييمها يدوياً لاحقاً.',
      addQuestion: 'إضافة سؤال جديد', save: 'حفظ ونشر',
      saving: 'جاري الحفظ...', cancel: 'إلغاء', deleteAssignment: 'حذف الواجب',
      deleteConfirmTitle: 'تأكيد الحذف',
      deleteConfirmDesc: 'هل أنت متأكد من حذف هذا الواجب بالكامل؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmDeleteBtn: 'نعم، احذف',
      successMsg: 'تم حفظ ونشر الواجب بنجاح! 🚀',
      validationError: 'يرجى ملء العنوان والتاريخ وجميع الأسئلة بشكل صحيح ❌',
      deletedMsg: 'تم حذف الواجب نهائياً 🗑️',
      serverError: 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى ❌'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private langService: LanguageService,
    private assignmentService: AssignmentService
  ) {}

  ngOnInit() {
    this.langService.currentLang$.subscribe(l => this.lang = l);

    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    this.minDate = today.toISOString().slice(0, 16);
    this.assignmentData.dueDate = this.minDate;

    this.route.params.subscribe(params => {
      this.lessonId = +params['lessonId'];
      this.loadExistingAssignment();
    });

    // Try to get courseId from query params
    this.route.queryParams.subscribe(qp => {
      if (qp['courseId']) this.courseId = +qp['courseId'];
    });
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  loadExistingAssignment() {
    this.assignmentService.getAssignmentsByLesson(this.lessonId).subscribe({
      next: (assignments) => {
        if (assignments && assignments.length > 0) {
          const a = assignments[0];
          this.isEditMode = true;
          if (a.courseId) this.courseId = a.courseId;
          this.assignmentData = {
            title: a.title || '',
            dueDate: a.dueDate ? a.dueDate.slice(0, 16) : this.minDate,
            questions: a.questions.map((q: any) => ({
              text: q.questionText || '',
              type: q.type === 'essay' ? 'written' : 'mcq',
              options: q.options ? q.options.split(',') : ['', '', '', ''],
              correctIndex: q.options ? q.options.split(',').indexOf(q.correctAnswer) : 0
            }))
          };
        }
      }
    });
  }

  showMsg(msg: string, type: 'success' | 'error' = 'success') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3500);
  }

  addQuestion() {
    this.assignmentData.questions.push({ text: '', type: 'mcq', options: ['', '', '', ''], correctIndex: 0 });
  }

  removeQuestion(index: number) {
    this.assignmentData.questions.splice(index, 1);
  }

  onTypeChange(q: any) {
    if (q.type === 'mcq' && (!q.options || q.options.length === 0)) {
      q.options = ['', '', '', ''];
      q.correctIndex = 0;
    }
  }

  saveAssignment() {
    // Validation
    if (!this.assignmentData.title || !this.assignmentData.title.trim()) {
      this.showMsg(this.t[this.lang].validationError, 'error');
      return;
    }
    if (!this.assignmentData.dueDate) {
      this.showMsg(this.t[this.lang].validationError, 'error');
      return;
    }
    for (let q of this.assignmentData.questions) {
      if (!q.text || !q.text.trim()) {
        this.showMsg(this.t[this.lang].validationError, 'error');
        return;
      }
      if (q.type === 'mcq') {
        for (let opt of q.options) {
          if (!opt || !opt.trim()) {
            this.showMsg(this.t[this.lang].validationError, 'error');
            return;
          }
        }
      }
    }

    this.isSaving = true;

    const payload = {
      title: this.assignmentData.title,
      description: 'Lesson Assignment',
      dueDate: new Date(this.assignmentData.dueDate).toISOString(),
      totalScore: this.assignmentData.questions.length * 10,
      courseId: this.courseId,
      lessonId: this.lessonId,
      questions: this.assignmentData.questions.map((q: any) => ({
        questionText: q.text,
        type: q.type === 'written' ? 'essay' : 'mcq',
        options: q.type === 'mcq' ? q.options.join(',') : null,
        correctAnswer: q.type === 'mcq' ? q.options[q.correctIndex] : null,
        score: 10
      }))
    };

    this.assignmentService.createAssignment(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.showMsg(this.t[this.lang].successMsg, 'success');
        setTimeout(() => this.goBack(), 1500);
      },
      error: () => {
        this.isSaving = false;
        this.showMsg(this.t[this.lang].serverError, 'error');
      }
    });
  }

  confirmDelete() {
    this.showDeleteModal = false;
    this.showMsg(this.t[this.lang].deletedMsg, 'success');
    setTimeout(() => this.goBack(), 1500);
  }

  goBack() {
    this.router.navigate(['/teacher-dashboard']);
  }
}
