import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="bg-[#F4F7FE] text-slate-800 min-h-screen flex w-full relative" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- القائمة الجانبية (Sidebar) الموحدة -->
      <aside class="w-64 bg-[#130E35] text-white flex flex-col fixed h-screen z-40 hidden lg:flex">
        <div class="p-6 flex items-center gap-3 border-b border-white/10">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-xl">F</div>
          <span class="font-bold text-lg tracking-wide">{{ t[lang].brand }}</span>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div class="text-xs uppercase tracking-wider text-white/40 px-3 mb-2">{{ t[lang].main }}</div>
          <a (click)="goBack()" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium text-sm transition cursor-pointer">🏠 {{ t[lang].dashboard }}</a>
          <a class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-600/40 text-white font-medium text-sm cursor-pointer">🏆 {{ t[lang].leaderboard }}</a>
          <a class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium text-sm transition cursor-pointer">📅 {{ t[lang].schedule }}</a>
          <div class="text-xs uppercase tracking-wider text-white/40 px-3 mt-6 mb-2">{{ t[lang].account }}</div>
          <a (click)="goToSettings()" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium text-sm transition cursor-pointer">⚙️ {{ t[lang].settings }}</a>
          <button (click)="logout()" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-indigo-300 hover:bg-indigo-500/10 font-medium text-sm transition w-full text-start cursor-pointer">🚪 {{ t[lang].logout }}</button>
        </nav>
      </aside>

      <div class="flex-1 ltr:lg:ml-64 rtl:lg:mr-64 min-h-screen flex flex-col">
        <!-- Header -->
        <header class="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between gap-4">
          <div class="flex items-center flex-1 gap-6">
            <h2 class="text-lg font-bold text-slate-800 lg:hidden">{{ t[lang].brand }}</h2>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button (click)="toggleLang()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition whitespace-nowrap">
              {{ lang === 'ar' ? 'English' : 'عربي' }}
            </button>
          </div>
        </header>

        <main class="p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-8">
          
          <div class="text-center mb-10">
            <h1 class="text-3xl lg:text-4xl font-extrabold text-[#130E35]">{{ t[lang].leaderboardTitle }} 🏆</h1>
            <p class="text-slate-500 mt-2">{{ t[lang].leaderboardDesc }}</p>
          </div>

          <div *ngIf="isLoading" class="flex justify-center p-12">
            <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>

          <div *ngIf="!isLoading && topStudents.length === 0" class="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
            <p class="font-semibold">{{ t[lang].noData }}</p>
          </div>

          <div *ngIf="!isLoading && topStudents.length > 0" class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-0 sm:p-4">
              <div *ngFor="let student of topStudents; let i = index" 
                   class="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                   [ngClass]="{'bg-indigo-50/30': i < 3}">
                
                <div class="flex items-center gap-4 sm:gap-6">
                  <!-- الترتيب -->
                  <div class="w-8 sm:w-10 font-black text-center text-xl sm:text-2xl" 
                       [ngClass]="{'text-amber-500': i === 0, 'text-slate-400': i === 1, 'text-amber-700': i === 2, 'text-slate-300': i > 2}">
                    #{{ i + 1 }}
                  </div>
                  
                  <!-- الصورة والاسم -->
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <img [src]="student.profileImage ? 'http://localhost:5162' + student.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + student.username)" 
                           class="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-sm">
                      <!-- تاج لصاحب المركز الأول -->
                      <span *ngIf="i === 0" class="absolute -top-3 -right-2 text-xl drop-shadow-sm">👑</span>
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-[#130E35] text-sm sm:text-base truncate">{{ student.username }}</p>
                      <p class="text-xs text-slate-500">{{ t[lang].studentRole }}</p>
                    </div>
                  </div>
                </div>

                <!-- النقاط -->
                <div class="bg-indigo-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-indigo-100/50 flex items-center gap-2">
                  <span class="text-indigo-600 text-sm sm:text-base">⚡</span>
                  <span class="font-black text-indigo-700 text-sm sm:text-lg">{{ student.totalXP }} <span class="text-xs font-semibold text-indigo-500">XP</span></span>
                </div>

              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `
})
export class LeaderboardComponent implements OnInit {
  topStudents: any[] = [];
  isLoading = true;
  lang: 'en' | 'ar' = 'en';

  t = {
    en: {
      brand: 'Fluency First', main: 'Main', dashboard: 'Dashboard', leaderboard: 'Leaderboard',
      schedule: 'Schedule', account: 'Account', settings: 'Settings', logout: 'Log out',
      leaderboardTitle: 'Top Performers', leaderboardDesc: 'See who is leading the pack based on total XP earned.',
      studentRole: 'Student', noData: 'No ranking data available yet.'
    },
    ar: {
      brand: 'فلوينسي فيرست', main: 'القائمة الرئيسية', dashboard: 'لوحة التحكم', leaderboard: 'لوحة الشرف',
      schedule: 'الجدول', account: 'الحساب', settings: 'الإعدادات', logout: 'تسجيل خروج',
      leaderboardTitle: 'أوائل المنصة', leaderboardDesc: 'تعرف على الطلاب المتصدرين بناءً على إجمالي النقاط المكتسبة.',
      studentRole: 'طالب', noData: 'لا توجد بيانات للترتيب حتى الآن.'
    }
  };

  constructor(private http: HttpClient, private router: Router, private langService: LanguageService) {}

  ngOnInit() {
    this.langService.currentLang$.subscribe((l: any) => this.lang = l);
    this.fetchLeaderboard();
  }

  toggleLang() {
    this.langService.toggleLanguage();
  }

  fetchLeaderboard() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any[]>('http://localhost:5162/api/user/leaderboard', { headers }).subscribe({
      next: (data) => {
        this.topStudents = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  goBack() {
    const role = localStorage.getItem('userRole');
    if (role === 'Teacher' || role === '1') {
      this.router.navigate(['/teacher-dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
}