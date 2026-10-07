import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../services/course.service';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-course-landing',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="min-h-screen bg-slate-50 font-sans relative" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      <div *ngIf="message" [ngClass]="{'bg-emerald-500': messageType === 'success', 'bg-rose-500': messageType === 'error', 'bg-amber-500': messageType === 'warning'}" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-xl text-white font-bold transition-all flex items-center gap-3">
        <span>{{ message }}</span>
      </div>

      <header class="bg-[#130E35] text-white px-6 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="text-slate-400 hover:text-white transition w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center">
            <span class="rtl:rotate-180 text-xl font-bold">←</span>
          </button>
          <span class="font-bold text-lg tracking-wide hidden sm:block">{{ t[lang].brand }}</span>
        </div>
        <button (click)="toggleLang()" class="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition">
          {{ lang === 'ar' ? 'English' : 'عربي' }}
        </button>
      </header>

      <div *ngIf="isLoading" class="max-w-6xl mx-auto p-6 lg:p-10 mt-4 animate-pulse">
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          <div class="w-full md:w-1/3 bg-slate-50 border-r rtl:border-l rtl:border-r-0 border-slate-200 p-6 flex flex-col items-center">
            <div class="w-full h-48 sm:h-56 bg-slate-200 rounded-2xl mb-6"></div>
            <div class="w-32 h-10 bg-slate-200 rounded-lg mb-6"></div>
            <div class="w-full h-14 bg-slate-200 rounded-xl"></div>
          </div>
          <div class="w-full md:w-2/3 p-8 md:p-10 flex flex-col gap-4">
            <div class="w-48 h-6 bg-slate-200 rounded-lg"></div>
            <div class="w-3/4 h-10 bg-slate-200 rounded-xl mb-4"></div>
            <div class="w-1/3 h-6 bg-slate-200 rounded-lg"></div>
            <div class="w-full h-4 bg-slate-200 rounded mt-4"></div>
            <div class="w-full h-4 bg-slate-200 rounded"></div>
            <div class="w-5/6 h-4 bg-slate-200 rounded"></div>
            <div class="w-4/6 h-4 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>

      <main *ngIf="!isLoading && course" class="max-w-6xl mx-auto p-6 lg:p-10 mt-4 animate-fade-in">
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          <div class="w-full md:w-1/3 bg-slate-50 border-r rtl:border-l rtl:border-r-0 border-slate-200 p-6 flex flex-col items-center">
            <div class="w-full h-48 sm:h-56 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative flex items-center justify-center mb-6">
              <img *ngIf="course.coverImageUrl" [src]="course.coverImageUrl" class="w-full h-full object-cover">
              <span *ngIf="!course.coverImageUrl" class="text-6xl font-black text-slate-300">{{ course.title.substring(0,2) | uppercase }}</span>
            </div>
            
            <div class="w-full text-center mb-6">
              <div *ngIf="course.isFree" class="text-3xl font-black text-emerald-600 mb-2">
                {{ lang === 'ar' ? 'مجاني' : 'Free' }}
              </div>
              <div *ngIf="!course.isFree">
                <ng-container *ngIf="course.discountPercentage > 0; else noDiscount">
                  <div class="flex flex-col items-center justify-center gap-1">
                    <span class="text-xs text-rose-500 line-through font-bold">{{ course.price }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}</span>
                    <span class="text-3xl font-black text-[#130E35]">
                      {{ (course.price - (course.price * course.discountPercentage / 100)) }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}
                    </span>
                    <span class="text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded mt-1">
                      ⚠️ {{ lang === 'ar' ? ('خصم ' + course.discountPercentage + '%') : (course.discountPercentage + '% OFF') }}
                    </span>
                  </div>
                </ng-container>
                <ng-template #noDiscount>
                  <span class="text-3xl font-black text-[#130E35] block mb-2">{{ course.price }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}</span>
                </ng-template>
              </div>
            </div>

            <button (click)="handleEnrollment()" [disabled]="isEnrolling" class="w-full py-3.5 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition shadow-lg disabled:opacity-70 flex justify-center items-center gap-2">
              <span *ngIf="isEnrolling" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {{ course.isFree ? t[lang].enrollFree : t[lang].buyNow }}
            </button>
            <p class="text-xs text-slate-400 mt-4 text-center px-4">{{ t[lang].guarantee }}</p>
          </div>

          <div class="w-full md:w-2/3 p-8 md:p-10 flex flex-col">
            <div class="flex items-center gap-3 mb-4">
              <span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">{{ t[lang].newBadge }}</span>
              <span class="text-sm font-semibold text-slate-500">{{ t[lang].instructor }}: {{ course.instructorName }}</span>
            </div>
            
            <h1 class="text-3xl sm:text-4xl font-black text-[#130E35] mb-6 leading-tight">{{ course.title }}</h1>
            
            <div class="prose prose-slate max-w-none text-slate-600 flex-1">
              <h3 class="text-lg font-bold text-slate-800 mb-2">{{ t[lang].aboutCourse }}</h3>
              <p class="whitespace-pre-line leading-relaxed">{{ course.description || t[lang].noDesc }}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class CourseLandingComponent implements OnInit {
  courseId!: number;
  course: any = null;
  isLoading = true;
  isEnrolling = false;
  lang: 'en' | 'ar' = 'en';
  message = '';
  messageType: 'success' | 'error' | 'warning' = 'success';

  t = {
    en: {
      brand: 'Fluency First', instructor: 'Instructor', enrollFree: 'Enroll for Free', buyNow: 'Buy Now',
      aboutCourse: 'About This Course', noDesc: 'No description available for this course.', guarantee: 'Full lifetime access. Learn at your own pace.',
      newBadge: 'NEW COURSE', successMsg: 'Enrolled successfully! Redirecting...', warningPay: 'Redirecting to payment gateway...', errorMsg: 'Something went wrong.'
    },
    ar: {
      brand: 'فلوينسي فيرست', instructor: 'المعلم', enrollFree: 'اشترك مجاناً', buyNow: 'اشتري الكورس الآن',
      aboutCourse: 'عن هذا الكورس', noDesc: 'لا يوجد وصف متاح لهذا الكورس.', guarantee: 'وصول مدى الحياة. تعلم بالسرعة التي تناسبك.',
      newBadge: 'كورس جديد', successMsg: 'تم الاشتراك بنجاح! جاري التوجيه...', warningPay: 'جاري تحويلك لبوابة الدفع...', errorMsg: 'حدث خطأ غير متوقع.'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private courseService: CourseService,
    private langService: LanguageService
  ) {}

  ngOnInit() {
    this.langService.currentLang$.subscribe(l => this.lang = l);
    this.route.params.subscribe(params => {
      this.courseId = +params['id'];
      this.loadCourseData();
    });
  }

  loadCourseData() {
    this.courseService.getAllCourses().subscribe({
      next: (courses: any[]) => {
        this.course = courses.find(c => c.id === this.courseId);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  handleEnrollment() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    if (this.course.isFree) {
      this.isEnrolling = true;

      this.http.post(`http://localhost:5162/api/course/enroll/${this.courseId}`, {}, { headers }).subscribe({
        next: () => {
          this.showMessage(this.t[this.lang].successMsg, 'success');
          setTimeout(() => this.router.navigate(['/dashboard']), 1500);
        },
        error: () => {
          this.isEnrolling = false;
          this.showMessage(this.t[this.lang].errorMsg, 'error');
        }
      });
    } else {
      this.isEnrolling = true;
      this.showMessage(this.t[this.lang].warningPay, 'warning');

      this.http.post<any>(`http://localhost:5162/api/payment/checkout/${this.courseId}`, {}, { headers }).subscribe({
        next: (response) => {
          const checkoutUrl = response.checkoutUrl || response.CheckoutUrl;
          if (checkoutUrl) {
            window.location.href = checkoutUrl;
          } else {
            this.isEnrolling = false;
            this.showMessage(this.t[this.lang].errorMsg, 'error');
          }
        },
        error: () => {
          this.isEnrolling = false;
          this.showMessage(this.t[this.lang].errorMsg, 'error');
        }
      });
    }
  }

  toggleLang() {
    this.langService.toggleLanguage();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  showMessage(msg: string, type: 'success' | 'error' | 'warning') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3500);
  }
}