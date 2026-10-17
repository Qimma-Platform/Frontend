import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CourseService } from '../services/course.service';
import { LanguageService } from '../services/language.service';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-course-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="bg-[#F4F7FE] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 min-h-screen flex w-full" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      <div *ngIf="message" [ngClass]="{'bg-emerald-500': messageType === 'success', 'bg-rose-500': messageType === 'error'}" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl text-white font-bold transition-all duration-500 flex items-center gap-3 animate-fade-in">
        <span>{{ message }}</span>
      </div>

      <aside class="w-64 bg-[#130E35] dark:bg-slate-900 border-e border-indigo-950 dark:border-slate-800 text-white flex flex-col fixed h-screen z-40 hidden lg:flex">
        <div class="p-6 flex items-center gap-3 border-b border-white/10 dark:border-slate-800">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center font-bold text-xl">Q</div>
          <span class="font-bold text-lg tracking-wide">{{ t[lang].brand }}</span>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div class="text-xs uppercase tracking-wider text-white/40 px-3 mb-2">{{ t[lang].main }}</div>
          <a href="/dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium text-sm transition">🏠 {{ t[lang].dashboard }}</a>
          <a href="/courses" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-600/40 text-white font-medium text-sm transition">📖 {{ t[lang].browseCourses }}</a>
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium text-sm transition">📅 {{ t[lang].schedule }}</a>
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium text-sm transition">📝 {{ t[lang].assignments }}</a>
          <div class="text-xs uppercase tracking-wider text-white/40 px-3 mt-6 mb-2">{{ t[lang].account }}</div>
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium text-sm transition">⚙️ {{ t[lang].settings }}</a>
          <button (click)="logout()" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 font-medium text-sm transition w-full text-start">🚪 {{ t[lang].logout }}</button>
        </nav>
        <div class="p-4 border-t border-white/10 dark:border-slate-800">
          <div class="flex items-center gap-3 p-2 rounded-xl bg-white/5 dark:bg-slate-800/50">
            <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (userData?.username || 'Student')" alt="Avatar" class="w-9 h-9 rounded-full bg-white/10" />
            <div class="min-w-0">
              <p class="text-sm font-semibold truncate">{{ userData?.username || 'Student' }}</p>
              <p class="text-xs text-indigo-300 dark:text-indigo-400">{{ t[lang].studentRole }}</p>
            </div>
          </div>
        </div>
      </aside>

      <div class="flex-1 ltr:lg:ml-64 rtl:lg:mr-64 min-h-screen flex flex-col">
        <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-6 py-4 flex items-center justify-between gap-4">
          <div class="flex items-center flex-1 gap-6">
            <h2 class="text-lg font-bold text-slate-800 dark:text-white lg:hidden">{{ t[lang].brand }}</h2>
            <div class="relative hidden sm:block w-full max-w-md">
              <span class="absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400">🔍</span>
              <input type="text" [(ngModel)]="searchTerm" (input)="filterCourses()" [placeholder]="t[lang].search" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all dir-ltr text-left">
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button (click)="toggleLang()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition whitespace-nowrap">
              {{ lang === 'ar' ? 'English' : 'عربي' }}
            </button>
            <button class="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
              🔔 <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <main class="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          <div>
            <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">{{ t[lang].catalogTitle }} 🌍</h1>
            <p class="text-slate-500 dark:text-slate-400 mt-2">{{ t[lang].catalogDesc }}</p>
          </div>

          <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div *ngFor="let i of [1,2,3]" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-pulse flex flex-col h-96">
              <div class="h-40 bg-slate-200 dark:bg-slate-800 w-full"></div>
              <div class="p-6 flex-1 flex flex-col gap-3">
                <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div class="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full mt-auto"></div>
              </div>
            </div>
          </div>

          <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div *ngFor="let course of filteredCourses" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
              <div class="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                <img [src]="getCoverImageUrl(course.coverImageUrl)" (error)="$any($event.target).src='assets/images/default-cover.jpg'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              </div>
              
              <div class="p-6 flex-1 flex flex-col">
                <div class="flex items-center gap-2 mb-3">
                  <span class="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded-lg text-xs font-bold">{{ t[lang].new }}</span>
                </div>
                <h3 class="font-extrabold text-xl text-slate-900 dark:text-white mb-2 line-clamp-2">{{ course.title }}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 flex-1">{{ course.description }}</p>
                
                <div class="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mb-6">
                  <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                    {{ course.instructorName?.substring(0,1) | uppercase }}
                  </div>
                  <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ course.instructorName }}</span>
                </div>

                <button (click)="enroll(course.id)" class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
                  {{ t[lang].enrollBtn }}
                </button>
              </div>
            </div>

            <div *ngIf="filteredCourses.length === 0" class="col-span-full py-16 text-center">
              <div class="text-6xl mb-4">🔍</div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">{{ t[lang].noResultsTitle }}</h3>
              <p class="text-slate-500 dark:text-slate-400 mt-2">{{ t[lang].noResultsDesc }}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  `
})
export class CourseCatalogComponent implements OnInit {
  allCourses: any[] = [];
  filteredCourses: any[] = [];
  searchTerm: string = '';
  isLoading = true;
  userData: any = null;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  lang: 'en' | 'ar' = 'en';

  t = {
    en: {
      brand: 'Qimma', main: 'Main', dashboard: 'Dashboard', browseCourses: 'Browse Courses',
      schedule: 'Schedule', assignments: 'Assignments', account: 'Account', settings: 'Settings', logout: 'Log out',
      search: 'Search for courses...', catalogTitle: 'Explore Courses', catalogDesc: 'Find the perfect course to advance your skills and career.',
      enrollBtn: 'Enroll Now', new: 'New', noResultsTitle: 'No courses found', noResultsDesc: 'Try adjusting your search terms.',
      successMsg: 'Enrolled successfully! Redirecting to your dashboard...',
      errorMsg: 'You are already enrolled in this course or an error occurred.', studentRole: 'Student'
    },
    ar: {
      brand: 'قِمَّـة', main: 'القائمة الرئيسية', dashboard: 'لوحة التحكم', browseCourses: 'تصفح الكورسات',
      schedule: 'الجدول', assignments: 'الواجبات', account: 'الحساب', settings: 'الإعدادات', logout: 'تسجيل خروج',
      search: 'ابحث عن الكورسات...', catalogTitle: 'استكشف الكورسات', catalogDesc: 'ابحث عن الكورس المثالي لتطوير مهاراتك.',
      enrollBtn: 'اشترك الآن', new: 'جديد', noResultsTitle: 'لا توجد كورسات', noResultsDesc: 'جرب استخدام كلمات بحث مختلفة.',
      successMsg: 'تم الاشتراك بنجاح! جاري تحويلك للوحة التحكم...',
      errorMsg: 'أنت مشترك بالفعل في هذا الكورس أو حدث خطأ.', studentRole: 'طالب'
    }
  };

  constructor(private courseService: CourseService, private router: Router, private langService: LanguageService, private http: HttpClient) {}

  ngOnInit() {
    const role = localStorage.getItem('userRole');
    if (role === 'Teacher' || role === '1') {
      this.router.navigate(['/teacher-dashboard']);
      return; 
    }
    this.langService.currentLang$.subscribe(l => this.lang = l);
    this.fetchUserProfile();
    this.loadCourses();
  }

  fetchUserProfile() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('https://qimma.runasp.net/api/user/profile', { headers }).subscribe({
      next: (data: any) => this.userData = data
    });
  }

  loadCourses() {
    this.isLoading = true;
    this.courseService.getAllCourses().subscribe({
      next: (data) => {
        this.allCourses = data;
        this.filteredCourses = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  filterCourses() {
    if (!this.searchTerm.trim()) {
      this.filteredCourses = this.allCourses;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredCourses = this.allCourses.filter(c => 
      c.title.toLowerCase().includes(term) || 
      c.description.toLowerCase().includes(term) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(term))
    );
  }

  enroll(courseId: number) {
    this.courseService.enrollInCourse(courseId).subscribe({
      next: () => {
        this.showMessage(this.t[this.lang].successMsg, 'success');
        setTimeout(() => this.router.navigate(['/dashboard']), 2000);
      },
      error: () => this.showMessage(this.t[this.lang].errorMsg, 'error')
    });
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  toggleLang() {
    this.langService.toggleLanguage();
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

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
}