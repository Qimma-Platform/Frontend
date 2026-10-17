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
    <div class="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 font-sans relative" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      <div *ngIf="message" [ngClass]="{'bg-emerald-500': messageType === 'success', 'bg-rose-500': messageType === 'error', 'bg-amber-500': messageType === 'warning'}" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-xl text-white font-bold transition-all flex items-center gap-3">
        <span>{{ message }}</span>
      </div>

      <header class="bg-[#130E35] dark:bg-slate-900 border-b border-indigo-900/50 dark:border-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
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
        <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
          <div class="w-full md:w-1/3 bg-slate-50 dark:bg-slate-800/40 border-r rtl:border-l rtl:border-r-0 border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center">
            <div class="w-full h-48 sm:h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-6"></div>
            <div class="w-32 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6"></div>
            <div class="w-full h-14 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
          <div class="w-full md:w-2/3 p-8 md:p-10 flex flex-col gap-4">
            <div class="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div class="w-3/4 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4"></div>
            <div class="w-1/3 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div class="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded mt-4"></div>
            <div class="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div class="w-5/6 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div class="w-4/6 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>

      <main *ngIf="!isLoading && course" class="max-w-6xl mx-auto p-6 lg:p-10 mt-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
          <div class="w-full md:w-1/3 bg-slate-50 dark:bg-slate-800/40 border-r rtl:border-l rtl:border-r-0 border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center">
            <div class="w-full h-48 sm:h-56 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative flex items-center justify-center mb-6">
              <img [src]="getCoverImageUrl(course.coverImageUrl)" (error)="$any($event.target).src='assets/images/default-cover.jpg'" class="w-full h-full object-cover">
            </div>
            
            <div class="w-full text-center mb-6">
              <div *ngIf="course.isFree" class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                {{ lang === 'ar' ? 'مجاني' : 'Free' }}
              </div>
              <div *ngIf="!course.isFree">
                <ng-container *ngIf="course.discountPercentage > 0; else noDiscount">
                  <div class="flex flex-col items-center justify-center gap-1">
                    <span class="text-xs text-rose-500 line-through font-bold">{{ course.price }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}</span>
                    <span class="text-3xl font-black text-[#130E35] dark:text-white">
                      {{ (course.price - (course.price * course.discountPercentage / 100)) }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}
                    </span>
                    <span class="text-xs font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded mt-1">
                      ⚠️ {{ lang === 'ar' ? ('خصم ' + course.discountPercentage + '%') : (course.discountPercentage + '% OFF') }}
                    </span>
                  </div>
                </ng-container>
                <ng-template #noDiscount>
                  <span class="text-3xl font-black text-[#130E35] dark:text-white block mb-2">{{ course.price }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}</span>
                </ng-template>
              </div>
            </div>

            <button (click)="handleEnrollment()" [disabled]="isEnrolling" class="w-full py-3.5 bg-[#130E35] dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold rounded-xl text-lg transition shadow-lg disabled:opacity-70 flex justify-center items-center gap-2">
              <span *ngIf="isEnrolling" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {{ course.isFree ? t[lang].enrollFree : t[lang].buyNow }}
            </button>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center px-4">{{ t[lang].guarantee }}</p>
          </div>

          <div class="w-full md:w-2/3 p-8 md:p-10 flex flex-col">
            <div class="flex items-center gap-3 mb-4">
              <span class="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold">{{ t[lang].newBadge }}</span>
              <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ t[lang].instructor }}: {{ course.instructorName }}</span>
            </div>
            
            <h1 class="text-3xl sm:text-4xl font-black text-[#130E35] dark:text-white mb-6 leading-tight">{{ course.title }}</h1>
            
            <div class="prose prose-slate max-w-none text-slate-600 dark:text-slate-300 flex-1">
              <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-2">{{ t[lang].aboutCourse }}</h3>
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
      brand: 'Qimma', instructor: 'Instructor', enrollFree: 'Enroll for Free', buyNow: 'Buy Now',
      aboutCourse: 'About This Course', noDesc: 'No description available for this course.', guarantee: 'Full lifetime access. Learn at your own pace.',
      newBadge: 'NEW COURSE', successMsg: 'Enrolled successfully! Redirecting...', warningPay: 'Redirecting to payment gateway...', errorMsg: 'Something went wrong.'
    },
    ar: {
      brand: 'قِمَّـة', instructor: 'المعلم', enrollFree: 'اشترك مجاناً', buyNow: 'اشتري الكورس الآن',
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
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    if (token) {
      this.http.get<any[]>('https://qimma.runasp.net/api/course/my-courses', { headers }).subscribe({
        next: (myCourses) => {
          if (myCourses && myCourses.some(mc => mc.id === this.courseId)) {
            // Already enrolled - skip landing/subscription flow
            this.router.navigate(['/learn', this.courseId], { replaceUrl: true });
            return;
          }
        },
        error: () => {}
      });
    }

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

      this.http.post(`https://qimma.runasp.net/api/course/enroll/${this.courseId}`, {}, { headers }).subscribe({
        next: () => {
          this.showMessage(this.t[this.lang].successMsg, 'success');
          setTimeout(() => this.router.navigate(['/dashboard'], { replaceUrl: true }), 1500);
        },
        error: () => {
          this.isEnrolling = false;
          this.showMessage(this.t[this.lang].errorMsg, 'error');
        }
      });
    } else {
      this.isEnrolling = true;
      this.showMessage(this.t[this.lang].warningPay, 'warning');

      this.http.post<any>(`https://qimma.runasp.net/api/payment/checkout/${this.courseId}`, {}, { headers }).subscribe({
        next: (response) => {
          const checkoutUrl = response.checkoutUrl || response.CheckoutUrl;
          this.isEnrolling = false;
          if (checkoutUrl) {
            window.open(checkoutUrl, '_blank');
          } else {
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
    this.router.navigate(['/dashboard'], { replaceUrl: true });
  }

  getCoverImageUrl(url: string | null | undefined): string {
    if (!url || url.trim() === '' || url.includes('placeholder')) return 'assets/images/default-cover.jpg';
    if (url.includes('localhost:5162')) {
      url = url.replace('http://localhost:5162', 'https://qimma.runasp.net');
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('assets/')) return url;
    if (url.startsWith('/assets/')) return url.substring(1);
    return `https://qimma.runasp.net${url.startsWith('/') ? '' : '/'}${url}`;
  }

  showMessage(msg: string, type: 'success' | 'error' | 'warning') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3500);
  }
}