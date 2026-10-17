import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LanguageService } from '../services/language.service';
import { ThemeService } from '../services/theme.service';

interface FeaturedCourse {
  id: number;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  coverImageUrl?: string;
  instructorName?: string;
  rating?: number;
  lessonsCount?: number;
  category?: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  template: `
    <div [dir]="lang === 'ar' ? 'rtl' : 'ltr'" class="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-indigo-600 selection:text-white">
      
      <!-- ========================================== -->
      <!-- 1. STICKY HEADER & NAVBAR WITH ACTIVE UNDERLINE -->
      <!-- ========================================== -->
      <header class="sticky top-0 z-50 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <!-- Brand Logo -->
          <a routerLink="/" class="flex items-center gap-3 group cursor-pointer">
            <img src="assets/images/qimma-round.jpg" alt="Qimma Logo" 
                 class="w-11 h-11 rounded-2xl object-cover shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-all duration-300 border border-indigo-200 dark:border-indigo-900/60">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {{ lang === 'ar' ? '(قِمَّـة)' : 'Qimmah' }}
                </span>
                <span class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                  {{ lang === 'ar' ? 'منصة ذكية' : 'Smart Platform' }}
                </span>
              </div>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wide">
                {{ lang === 'ar' ? 'بداية جديدة نحو التميّز' : 'A New Beginning Toward Excellence' }}
              </p>
            </div>
          </a>

          <!-- Desktop Navigation Links with Active Underline (Req Z) -->
          <nav class="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
            <a href="#hero" 
               [ngClass]="activeSection === 'hero' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 pb-1 font-black' : 'hover:text-indigo-600 dark:hover:text-indigo-400 pb-1'" 
               class="transition-all cursor-pointer">
              {{ lang === 'ar' ? 'الرئيسية' : 'Home' }}
            </a>
            <a href="#features" 
               [ngClass]="activeSection === 'features' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 pb-1 font-black' : 'hover:text-indigo-600 dark:hover:text-indigo-400 pb-1'" 
               class="transition-all cursor-pointer">
              {{ lang === 'ar' ? 'مميزات المنصة' : 'Features' }}
            </a>
            <a href="#courses" 
               [ngClass]="activeSection === 'courses' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 pb-1 font-black' : 'hover:text-indigo-600 dark:hover:text-indigo-400 pb-1'" 
               class="transition-all cursor-pointer">
              {{ lang === 'ar' ? 'أشهر الكورسات' : 'Popular Courses' }}
            </a>
            <a href="#contact" 
               [ngClass]="activeSection === 'contact' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 pb-1 font-black' : 'hover:text-indigo-600 dark:hover:text-indigo-400 pb-1'" 
               class="transition-all cursor-pointer">
              {{ lang === 'ar' ? 'تواصل معنا' : 'Contact Us' }}
            </a>
          </nav>

          <!-- Controls: Dark Mode, Language, Auth -->
          <div class="flex items-center gap-3">
            
            <!-- Dark Mode Toggle Button -->
            <button (click)="toggleTheme()" 
                    [title]="isDark ? (lang === 'ar' ? 'الوضع النهاري' : 'Light Mode') : (lang === 'ar' ? 'الوضع الليلي' : 'Dark Mode')"
                    class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-amber-400 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center shadow-xs cursor-pointer">
              <svg *ngIf="isDark" class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <svg *ngIf="!isDark" class="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </button>

            <!-- Language Switcher Toggle -->
            <button (click)="toggleLanguage()" 
                    class="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path>
              </svg>
              <span>{{ lang === 'ar' ? 'English' : 'العربية' }}</span>
            </button>

            <!-- Logged In / Guest CTAs -->
            <div *ngIf="isLoggedIn" class="flex items-center gap-2">
              <a [routerLink]="userDashboardRoute" 
                 class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>{{ lang === 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</span>
              </a>
            </div>

            <div *ngIf="!isLoggedIn" class="flex items-center gap-2">
              <a routerLink="/login" 
                 class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs transition shadow-xs">
                {{ lang === 'ar' ? 'تسجيل الدخول' : 'Log In' }}
              </a>

              <a [routerLink]="['/login']" [queryParams]="{ tab: 'signup' }"
                 class="hidden sm:inline-flex px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all">
                {{ lang === 'ar' ? 'إنشاء حساب جديد' : 'Create an Account' }}
              </a>
            </div>

            <!-- Mobile Drawer Button -->
            <button (click)="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path *ngIf="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                <path *ngIf="mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Nav Menu -->
        <div *ngIf="mobileMenuOpen" class="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] px-6 py-5 space-y-4 text-sm font-bold animate-fade-in">
          <a (click)="mobileMenuOpen = false" href="#hero" class="block text-slate-700 dark:text-slate-300 hover:text-indigo-600">{{ lang === 'ar' ? 'الرئيسية' : 'Home' }}</a>
          <a (click)="mobileMenuOpen = false" href="#features" class="block text-slate-700 dark:text-slate-300 hover:text-indigo-600">{{ lang === 'ar' ? 'مميزات المنصة' : 'Features' }}</a>
          <a (click)="mobileMenuOpen = false" href="#courses" class="block text-slate-700 dark:text-slate-300 hover:text-indigo-600">{{ lang === 'ar' ? 'أشهر الكورسات' : 'Popular Courses' }}</a>
          <a (click)="mobileMenuOpen = false" href="#contact" class="block text-slate-700 dark:text-slate-300 hover:text-indigo-600">{{ lang === 'ar' ? 'تواصل معنا' : 'Contact Us' }}</a>
          <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <a routerLink="/login" class="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs">
              {{ lang === 'ar' ? 'تسجيل الدخول' : 'Log In' }}
            </a>
            <a [routerLink]="['/login']" [queryParams]="{ tab: 'signup' }" class="w-full text-center py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md">
              {{ lang === 'ar' ? 'إنشاء حساب جديد' : 'Create an Account' }}
            </a>
          </div>
        </div>
      </header>

      <!-- ========================================== -->
      <!-- 2. HERO SECTION (Req B & C)               -->
      <!-- ========================================== -->
      <section id="hero" class="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-slate-100/60 via-slate-50 to-white dark:from-[#0E1424] dark:via-[#0B0F19] dark:to-[#0B0F19]">
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <!-- Left Text Content (Column 7) -->
            <div class="lg:col-span-7 space-y-6 text-center lg:text-start">
              
              <!-- Announcement Badge -->
              <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-black shadow-xs">
                <span class="flex h-2 w-2 relative">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span>
                  {{ lang === 'ar' ? 'منصة (قِمَّـة) التعليمية الذكية • بداية جديدة نحو التميّز' : 'Qimmah Smart Educational Platform • A New Beginning Toward Excellence' }}
                </span>
              </div>

              <!-- Main Hero Heading (Req B) -->
              <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.25] text-slate-900 dark:text-white">
                <span class="block text-slate-900 dark:text-slate-100">
                  {{ lang === 'ar' ? 'طريقك المباشر نحو' : 'Your direct path to the' }}
                </span>
                <span class="text-indigo-600 dark:text-indigo-400">
                  {{ lang === 'ar' ? 'قمة التفوق الدراسي والمهني' : 'pinnacle of academic and professional success.' }}
                </span>
              </h1>

              <!-- Subtitle Description (Req B exact copy) -->
              <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                {{ lang === 'ar' 
                  ? 'منصة تعليمية متكاملة تجمعك بنخبة من أكفأ المعلمين، مع مسارات تدريبية تفاعلية، اختبارات ذكية، ونظام تحفيز رقمي بالنقاط لتصل إلى أهدافك بكل ثقة وسهولة. انطلق نحو مستقبلك بخطوات واثقة ومدروسة.' 
                  : 'An integrated educational platform connecting you with a select group of highly qualified instructors. Featuring interactive training paths, smart assessments, and a digital, points-based incentive system, it empowers you to reach your goals with confidence and ease.' }}
              </p>

              <!-- Single CTA Button without arrow (Req C) -->
              <div class="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start">
                <a [routerLink]="['/login']" [queryParams]="{ tab: 'signup' }" 
                   class="w-full sm:w-auto px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all text-center">
                  {{ lang === 'ar' ? 'ابدأ التعلم الآن مجاناً' : 'Start Learning for Free Now' }}
                </a>
              </div>

            </div>

            <!-- Right Hero Card (Image Th & High Contrast Dark Mode Fix) -->
            <div class="lg:col-span-5 relative">
              <div class="relative mx-auto max-w-md lg:max-w-none">
                
                <!-- Main Showcase Card -->
                <div class="relative bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                  
                  <!-- Top Banner Image -->
                  <div class="relative h-48 rounded-2xl overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/60">
                    <img src="assets/images/qimma-banner.jpg" alt="Qimma Platform" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end p-4">
                      <div>
                        <span class="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                          {{ lang === 'ar' ? 'منصة معتمدة' : 'Official Platform' }}
                        </span>
                        <h4 class="text-white font-extrabold text-lg mt-1 drop-shadow-md">
                          {{ lang === 'ar' ? 'تجربة تعليمية بلا حدود' : 'Limitless Learning Experience' }}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <!-- 4 Feature Badges with High-Contrast Text (Fixing Dark Mode text legibility) -->
                  <div class="grid grid-cols-2 gap-3">
                    
                    <!-- 1. Smart Quizzes -->
                    <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/90 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-black text-slate-900 dark:text-white truncate">{{ lang === 'ar' ? 'اختبارات ذكية' : 'Smart Quizzes' }}</p>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">{{ lang === 'ar' ? 'تصحيح فوري وتغذية راجعة' : 'Instant Grading' }}</p>
                      </div>
                    </div>

                    <!-- 2. Leaderboard -->
                    <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/90 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34"></path><path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34"></path><path d="M6 4h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z"></path></svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-black text-slate-900 dark:text-white truncate">{{ lang === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard' }}</p>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">{{ lang === 'ar' ? 'تنافس بنقاط XP' : 'Earn XP & Badges' }}</p>
                      </div>
                    </div>

                    <!-- 3. Top Educators -->
                    <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/90 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-black text-slate-900 dark:text-white truncate">{{ lang === 'ar' ? 'نخبة المعلمين' : 'Top Educators' }}</p>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">{{ lang === 'ar' ? 'متابعة دورية مباشرة' : 'Direct Guidance' }}</p>
                      </div>
                    </div>

                    <!-- 4. Digital Wallet -->
                    <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182032] border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/90 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-black text-slate-900 dark:text-white truncate">{{ lang === 'ar' ? 'محفظة مرنة' : 'Digital Wallet' }}</p>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">{{ lang === 'ar' ? 'دفع آمن بالفيزا وكاش' : 'Easy Checkout' }}</p>
                      </div>
                    </div>

                  </div>

                  <!-- Quick Enrollment CTA in card with high-contrast text -->
                  <div class="p-4 rounded-2xl bg-slate-100 dark:bg-[#1a2337] border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p class="text-xs font-black text-slate-900 dark:text-white">{{ lang === 'ar' ? 'خصم خاص للطلاب الجدد' : 'New Students Welcome Pack' }}</p>
                      <p class="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium">{{ lang === 'ar' ? 'سجّل اليوم واستفد من باقة الكورسات المتميزة' : 'Register today to access free lessons' }}</p>
                    </div>
                    <a [routerLink]="['/login']" [queryParams]="{ tab: 'signup' }" 
                       class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-sm transition shrink-0">
                      {{ lang === 'ar' ? 'سجّل الآن' : 'Join' }}
                    </a>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ========================================== -->
      <!-- 3. "EVERYTHING YOU NEED TO EXCEL" (Req D)  -->
      <!-- ========================================== -->
      <section id="features" class="py-16 lg:py-24 bg-white dark:bg-[#0B0F19] border-b border-slate-200/80 dark:border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span class="px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider border border-indigo-200/50 dark:border-indigo-800/50">
              {{ lang === 'ar' ? 'مميزات منصة (قِمَّـة)' : 'Why Choose Qimmah?' }}
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {{ lang === 'ar' ? 'كل ما تحتاجه للتفوق في مكان واحد' : 'Everything You Need to Excel, All in One Place' }}
            </h2>
            <p class="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
              {{ lang === 'ar' 
                ? 'صُممت منصة (قِمَّـة) لتقديم تجربة تعليمية استثنائية تركز على الفهم والتطبيق العملي بأحدث الوسائل الذكية.' 
                : 'Engineered to empower every student with smart, interactive tools designed for genuine mastery.' }}
            </p>
          </div>

          <!-- Feature Cards Grid: Icon NEXT to text to save space (Req D) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Feature 1: Top-tier instructors -->
            <div class="p-6 rounded-3xl bg-slate-50 dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 hover:shadow-md transition-all duration-300 flex items-start gap-4">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                  {{ lang === 'ar' ? 'نخبة من كبار المعلمين' : 'A Select Group of Top-Tier Instructors' }}
                </h3>
                <p class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  {{ lang === 'ar' 
                    ? 'يخضع جميع معلمي (قِمَّـة) لمعايير انتقاء صارمة لضمان إيصال المعلومة بأسهل الطرق المبتكرة ومتابعة مستمرة لكل طالب.' 
                    : 'All Qimmah instructors undergo a rigorous selection process to ensure they deliver information using the most accessible, innovative methods, while providing continuous follow-up for every student.' }}
                </p>
              </div>
            </div>

            <!-- Feature 2: Interactive Assessments -->
            <div class="p-6 rounded-3xl bg-slate-50 dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 hover:shadow-md transition-all duration-300 flex items-start gap-4">
              <div class="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                  {{ lang === 'ar' ? 'اختبارات وواجبات تفاعلية' : 'Smart Interactive Assessments' }}
                </h3>
                <p class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  {{ lang === 'ar' 
                    ? 'بنك أسئلة متجدد، اختبارات ذكية، وواجبات عملية تخضع للتصحيح الفوري والتقييم الدقيق لتحديد نقاط القوة ومعالجة الثغرات أولاً بأول.' 
                    : 'Dynamic question banks, smart quizzes, and hands-on assignments with instant grading to identify strengths and bridge knowledge gaps.' }}
                </p>
              </div>
            </div>

            <!-- Feature 3: XP Gamification -->
            <div class="p-6 rounded-3xl bg-slate-50 dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 hover:shadow-md transition-all duration-300 flex items-start gap-4">
              <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                  {{ lang === 'ar' ? 'نظام تحفيز رقمي بالنقاط' : 'Digital Points-Based Incentive System' }}
                </h3>
                <p class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  {{ lang === 'ar' 
                    ? 'كل درس تنجزه وكل اختبار تجتازه يمنحك نقاط خبرة XP وأوسمة شرفية ترفع ترتيبك بين زملائك وتعزز حماسك المستمر.' 
                    : 'Every lesson completed and quiz conquered awards you XP points and milestone badges, elevating your ranking among your peers.' }}
                </p>
              </div>
            </div>

            <!-- Feature 4: Flexible Wallet -->
            <div class="p-6 rounded-3xl bg-slate-50 dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/40 hover:shadow-md transition-all duration-300 flex items-start gap-4">
              <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                  {{ lang === 'ar' ? 'محفظة مالية آمنة ومرنة' : 'Flexible Digital Wallet' }}
                </h3>
                <p class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  {{ lang === 'ar' 
                    ? 'خيارات دفع سهلة وسريعة عبر البطاقات البنكية أو المحافظ الإلكترونية، مع تفعيل فوري للاشتراكات ومتابعة شفافة لجميع المعاملات.' 
                    : 'Effortless payment options via credit cards or mobile wallets, granting instant enrollment and complete transaction transparency.' }}
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- ========================================== -->
      <!-- 4. "EXPLORE OUR MOST POPULAR COURSES" (Req E & S) -->
      <!-- ========================================== -->
      <section id="courses" class="py-16 lg:py-24 bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200/80 dark:border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span class="px-3.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider border border-purple-200/50 dark:border-purple-800/50">
                {{ lang === 'ar' ? 'الكورسات الأعلى تقييماً' : 'Highest Rated Courses' }}
              </span>
              <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3">
                {{ lang === 'ar' ? 'استكشف أشهر كورساتنا' : 'Explore Our Most Popular Courses' }}
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {{ lang === 'ar' ? 'أعلى 4 كورسات تقييماً على المنصة (تحديث تلقائي ديناميكي)' : 'Top 4 rated courses dynamically updated based on reviews' }}
              </p>
            </div>
          </div>

          <!-- Courses Grid: Exactly 4 courses, NO free/paid price indicator (Req E & S) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div *ngFor="let course of displayCourses" 
                 class="group bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              
              <div>
                <!-- Cover Image (No price or free badge!) -->
                <div class="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img [src]="getCoverImageUrl(course.coverImageUrl)" 
                       [alt]="course.title" 
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                       (error)="handleImageError($event)">
                  
                  <!-- Rating Badge -->
                  <div class="absolute top-3 rtl:left-3 ltr:right-3">
                    <span class="px-2.5 py-1 bg-slate-950/75 backdrop-blur-sm text-white text-xs font-black rounded-lg shadow-sm flex items-center gap-1">
                      <span class="text-amber-400">★</span>
                      <span>{{ course.rating != null ? course.rating : 0 }}</span>
                    </span>
                  </div>

                  <!-- Category Tag -->
                  <div class="absolute bottom-3 rtl:right-3 ltr:left-3">
                    <span class="px-2.5 py-1 bg-slate-950/75 backdrop-blur-sm text-white text-[10px] font-bold rounded-md">
                      {{ course.category || (lang === 'ar' ? 'مسار تعليمي' : 'Course') }}
                    </span>
                  </div>
                </div>

                <!-- Course Info -->
                <div class="p-5 space-y-3">
                  <h3 class="font-black text-slate-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {{ course.title }}
                  </h3>

                  <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {{ course.description || (lang === 'ar' ? 'شرح شامل للمنهج مع تدريبات واختبارات تفاعلية ومتابعة مستمرة.' : 'Comprehensive syllabus coverage with interactive tests and follow-up.') }}
                  </p>
                </div>
              </div>

              <!-- Footer Actions: View Course (Opens Details) & Subscribe (Routes to Signup) (Req E) -->
              <div class="p-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                <button (click)="openCourseDetails(course)" 
                        class="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition text-center cursor-pointer">
                  {{ lang === 'ar' ? 'عرض الكورس' : 'View Course' }}
                </button>
                <a [routerLink]="['/login']" [queryParams]="{ tab: 'signup' }" 
                   class="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition text-center shadow-xs">
                  {{ lang === 'ar' ? 'اشتراك' : 'Subscribe' }}
                </a>
              </div>

            </div>
          </div>

        </div>
      </section>

      <!-- ========================================== -->
      <!-- 5. FOOTER WITH FACEBOOK & LINKEDIN (Req F) -->
      <!-- ========================================== -->
      <footer id="contact" class="bg-[#070A11] text-slate-300 border-t border-slate-800 pt-16 pb-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            
            <!-- Column 1: Brand & Social Links -->
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <img src="assets/images/qimma-round.jpg" alt="Qimma" class="w-12 h-12 rounded-2xl object-cover border border-white/20 shadow-lg">
                <div>
                  <h3 class="text-2xl font-black text-white tracking-wide">
                    {{ lang === 'ar' ? '(قِمَّـة)' : 'Qimmah' }}
                  </h3>
                  <p class="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                    {{ lang === 'ar' ? 'المنصة التعليمية الذكية' : 'Smart Educational Platform' }}
                  </p>
                </div>
              </div>
              <p class="text-sm text-slate-400 leading-relaxed">
                {{ lang === 'ar' 
                  ? 'منصة (قِمَّـة) هي بوابتك نحو التفوق والتميز التعليمي في مسارات متكاملة مع نخبة من أكفأ المعلمين.' 
                  : 'Qimmah is your direct path to academic mastery through interactive lessons and premier educators.' }}
              </p>
              
              <!-- Social Icons: Added Facebook & LinkedIn logos (Req F) -->
              <div class="flex items-center gap-3 pt-2">
                <!-- Facebook Logo -->
                <a href="https://facebook.com" target="_blank" class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-[#1877F2] text-white flex items-center justify-center transition shadow-xs" title="Facebook">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                <!-- LinkedIn Logo -->
                <a href="https://linkedin.com" target="_blank" class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-[#0A66C2] text-white flex items-center justify-center transition shadow-xs" title="LinkedIn">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>

                <!-- WhatsApp Support -->
                <a href="https://wa.me/201020653195" target="_blank" class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-[#25D366] text-white flex items-center justify-center transition shadow-xs" title="WhatsApp Support">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
              </div>
            </div>

            <!-- Column 2: Quick Links -->
            <div class="space-y-3">
              <h4 class="text-white font-black text-sm uppercase tracking-wider">
                {{ lang === 'ar' ? 'روابط المنصة' : 'Navigation' }}
              </h4>
              <ul class="space-y-2 text-sm text-slate-400">
                <li><a href="#hero" class="hover:text-indigo-400 transition">{{ lang === 'ar' ? 'الرئيسية' : 'Home' }}</a></li>
                <li><a href="#features" class="hover:text-indigo-400 transition">{{ lang === 'ar' ? 'مميزات المنصة' : 'Features' }}</a></li>
                <li><a href="#courses" class="hover:text-indigo-400 transition">{{ lang === 'ar' ? 'أشهر الكورسات' : 'Popular Courses' }}</a></li>
                <li><a [routerLink]="['/login']" [queryParams]="{ tab: 'signup' }" class="hover:text-indigo-400 transition">{{ lang === 'ar' ? 'إنشاء حساب جديد' : 'Sign Up' }}</a></li>
              </ul>
            </div>

            <!-- Column 3: Portals (Req 3: Removed Admin Portal Login & Public Leaderboard) -->
            <div class="space-y-3">
              <h4 class="text-white font-black text-sm uppercase tracking-wider">
                {{ lang === 'ar' ? 'تسجيل الدخول' : 'Portals' }}
              </h4>
              <ul class="space-y-2 text-sm text-slate-400">
                <li><a routerLink="/login" class="hover:text-indigo-400 transition">{{ lang === 'ar' ? 'بوابة الطلاب والمعلمين' : 'Student & Teacher Login' }}</a></li>
              </ul>
            </div>

            <!-- Column 4: Contact -->
            <div class="space-y-3">
              <h4 class="text-white font-black text-sm uppercase tracking-wider">
                {{ lang === 'ar' ? 'الدعم الفني المباشر' : 'Customer Support' }}
              </h4>
              <div class="space-y-2.5 text-sm">
                <a href="tel:01020653195" class="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  <svg class="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <span class="dir-ltr">01020653195</span>
                </a>
                <a href="mailto:kareemelsandarosy2@gmail.com" class="flex items-center gap-2 text-slate-400 hover:text-white transition truncate">
                  <svg class="w-4 h-4 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <span class="truncate">kareemelsandarosy2&#64;gmail.com</span>
                </a>
              </div>
            </div>

          </div>

          <!-- Bottom Copyright -->
          <div class="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 {{ lang === 'ar' ? 'منصة (قِمَّـة) التعليمية الذكية. جميع الحقوق محفوظة.' : 'Qimmah Smart Educational Platform. All Rights Reserved.' }}</p>
            <div class="flex items-center gap-6">
              <span>{{ lang === 'ar' ? 'تعليم ذكي مبني على التميز' : 'Excellence in Smart Learning' }}</span>
            </div>
          </div>

        </div>
      </footer>

      <!-- ========================================== -->
      <!-- COURSE DETAILS PREVIEW MODAL (Req E)       -->
      <!-- ========================================== -->
      <div *ngIf="selectedCourseForDetails" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 max-w-lg w-full shadow-2xl relative animate-scale-in">
          
          <button (click)="selectedCourseForDetails = null" 
                  class="absolute top-5 rtl:left-5 ltr:right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer">
            ✕
          </button>

          <div class="h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-5">
            <img [src]="getCoverImageUrl(selectedCourseForDetails.coverImageUrl)" class="w-full h-full object-cover">
          </div>

          <div class="flex items-center gap-2 mb-3">
            <span class="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-black text-xs rounded-lg flex items-center gap-1">
              <span class="text-amber-500">★</span>
              <span>{{ selectedCourseForDetails.rating != null ? selectedCourseForDetails.rating : 0 }}</span>
            </span>
          </div>

          <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">
            {{ selectedCourseForDetails.title }}
          </h3>

          <p class="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-4">
            {{ selectedCourseForDetails.instructorName ? (lang === 'ar' ? 'المعلم المسؤول: ' + selectedCourseForDetails.instructorName : 'Instructor: ' + selectedCourseForDetails.instructorName) : '' }}
          </p>

          <div class="max-h-40 overflow-y-auto pr-2 mb-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {{ selectedCourseForDetails.description || (lang === 'ar' ? 'كورس تفاعلي شامل يحتوي على شرح مبسط لكافة جوانب المنهج، واختبارات قياس مستوى دورية لضمان أعلى درجات الفهم والتفوق.' : 'A comprehensive interactive course featuring clear conceptual lessons and regular quizzes.') }}
          </div>

          <div class="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button (click)="selectedCourseForDetails = null" 
                    class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition cursor-pointer">
              {{ lang === 'ar' ? 'إغلاق' : 'Close' }}
            </button>

            <a (click)="selectedCourseForDetails = null" [routerLink]="['/login']" [queryParams]="{ tab: 'signup' }" 
               class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition text-center shadow-md cursor-pointer">
              {{ lang === 'ar' ? 'اشترك في الكورس' : 'Subscribe Now' }}
            </a>
          </div>

        </div>
      </div>

    </div>
  `
})
export class LandingPageComponent implements OnInit {
  lang: 'en' | 'ar' = 'ar';
  isLoggedIn: boolean = false;
  userRole: string | null = null;
  mobileMenuOpen: boolean = false;
  activeSection: string = 'hero';

  displayCourses: FeaturedCourse[] = [];
  selectedCourseForDetails: FeaturedCourse | null = null;

  constructor(
    public langService: LanguageService,
    public themeService: ThemeService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.langService.currentLang$.subscribe(l => {
      this.lang = l;
    });

    const token = localStorage.getItem('token');
    this.userRole = localStorage.getItem('userRole');
    this.isLoggedIn = !!token;

    this.loadRealCourses();
  }

  // Scroll Spy for Navbar Underline (Req Z)
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const sections = ['hero', 'features', 'courses', 'contact'];
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    for (const sectionId of sections) {
      const el = document.getElementById(sectionId);
      if (el) {
        const top = el.offsetTop - 120;
        const height = el.offsetHeight;
        if (scrollPosition >= top && scrollPosition < top + height) {
          this.activeSection = sectionId;
          break;
        }
      }
    }
  }

  get isDark(): boolean {
    return this.themeService.isDark;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleLanguage() {
    this.langService.toggleLanguage();
  }

  get userDashboardRoute(): string {
    if (this.userRole === '2' || this.userRole === 'Admin') return '/admin-dashboard';
    if (this.userRole === '1' || this.userRole === 'Teacher' || this.userRole === 'Instructor') return '/teacher-dashboard';
    return '/dashboard';
  }

  loadRealCourses() {
    const fallbackCourses: FeaturedCourse[] = [
      {
        id: 1,
        title: this.lang === 'ar' ? 'الفيزياء الشاملة للثانوية العامة' : 'Comprehensive Physics Masterclass',
        description: this.lang === 'ar' ? 'تغطية شاملة لكل قوانين الكهربية والمغناطيسية والفيزياء الحديثة مع تدريبات مكثفة.' : 'In-depth coverage of electricity, magnetism, and modern physics with hands-on problem sets.',
        price: 150,
        isFree: false,
        coverImageUrl: 'assets/images/qimma-banner.jpg',
        instructorName: this.lang === 'ar' ? 'أ. د. أحمد منصور' : 'Dr. Ahmed Mansour',
        rating: 4.98,
        category: this.lang === 'ar' ? 'العلوم الطبيعية' : 'Science'
      },
      {
        id: 2,
        title: this.lang === 'ar' ? 'كورس إتقان قواعد اللغة الإنجليزية والتحدث' : 'English Fluency & Grammar Mastery',
        description: this.lang === 'ar' ? 'مسار مكثف لتطوير مهارات التحدث بالإنجليزية واجتياز الامتحانات الدولية بكل ثقة.' : 'High-impact communication course designed for fluency, grammar, and test readiness.',
        price: 200,
        isFree: false,
        coverImageUrl: 'assets/images/qimma-banner.jpg',
        instructorName: this.lang === 'ar' ? 'د. سارة عبد الرحمن' : 'Dr. Sara Ali',
        rating: 4.95,
        category: this.lang === 'ar' ? 'اللغات' : 'Languages'
      },
      {
        id: 3,
        title: this.lang === 'ar' ? 'أساسيات الجبر وحساب المثلثات' : 'Foundations of Algebra & Trigonometry',
        description: this.lang === 'ar' ? 'تأسيس متين في حل المعادلات والدوال المثلثية والمتطابقات مع اختبارات تفاعلية.' : 'Master algebraic models, equations, and trigonometric proofs with live practice.',
        price: 0,
        isFree: true,
        coverImageUrl: 'assets/images/qimma-round.jpg',
        instructorName: this.lang === 'ar' ? 'أ. د. أحمد منصور' : 'Dr. Ahmed Mansour',
        rating: 4.92,
        category: this.lang === 'ar' ? 'الرياضيات' : 'Mathematics'
      },
      {
        id: 4,
        title: this.lang === 'ar' ? 'مقدمة في البرمجة والتفكير المنطقي' : 'Introduction to Programming & Logic',
        description: this.lang === 'ar' ? 'تعلم أساسيات الخوارزميات والتفكير البرمجي وبناء أول تطبيق لك من الصفر.' : 'Learn computational thinking, data structures, and build real applications from scratch.',
        price: 180,
        isFree: false,
        coverImageUrl: 'assets/images/qimma-round.jpg',
        instructorName: this.lang === 'ar' ? 'م. كريم الشناوي' : 'Eng. Kareem',
        rating: 4.90,
        category: this.lang === 'ar' ? 'التكنولوجيا' : 'Technology'
      }
    ];

    this.http.get<any[]>('https://qimma.runasp.net/api/course').subscribe({
      next: (courses) => {
        if (courses && courses.length > 0) {
          // Dynamic sorting: Highest rating first, then total students count
          const sorted = [...courses].sort((a, b) => {
            const rA = a.rating != null && !isNaN(Number(a.rating)) ? Number(a.rating) : 0;
            const rB = b.rating != null && !isNaN(Number(b.rating)) ? Number(b.rating) : 0;
            if (rB !== rA) return rB - rA;
            return (b.totalStudentsCount || 0) - (a.totalStudentsCount || 0);
          });
          // Exactly 4 courses displayed (Req E)
          this.displayCourses = sorted.slice(0, 4).map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            price: c.price || 0,
            isFree: c.isFree || c.price === 0,
            coverImageUrl: c.coverImageUrl || 'assets/images/qimma-banner.jpg',
            instructorName: c.instructorName || c.instructor?.username,
            rating: c.rating != null && !isNaN(Number(c.rating)) ? Number(c.rating) : 0,
            category: this.lang === 'ar' ? 'كورس معتمد' : 'Accredited Course'
          }));
        } else {
          this.displayCourses = fallbackCourses.slice(0, 4);
        }
      },
      error: () => {
        this.displayCourses = fallbackCourses.slice(0, 4);
      }
    });
  }

  openCourseDetails(course: FeaturedCourse) {
    this.selectedCourseForDetails = course;
  }

  getCoverImageUrl(url: string | undefined): string {
    if (!url) return 'assets/images/qimma-banner.jpg';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('assets/')) return url;
    return `https://qimma.runasp.net${url.startsWith('/') ? '' : '/'}${url}`;
  }

  handleImageError(event: any) {
    event.target.src = 'assets/images/qimma-banner.jpg';
  }
}
