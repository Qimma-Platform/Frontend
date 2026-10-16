import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'" 
         class="min-h-screen bg-slate-50 dark:bg-[#090b14] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      
      <!-- Ambient Cyber Glows -->
      <div class="absolute -top-32 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="absolute -bottom-32 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <!-- Top Header -->
      <header class="w-full max-w-6xl mx-auto flex items-center justify-between py-2 z-20">
        <div class="flex items-center gap-3">
          <img src="assets/images/qimma-round.jpg" alt="Qimma Brand" 
               class="w-11 h-11 rounded-2xl object-cover shadow-xl shadow-indigo-500/20 border-2 border-indigo-500/30">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {{ currentLang === 'ar' ? 'منصة قِمَّـة' : 'Qimma' }}
              </h1>
              <span class="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-extrabold uppercase tracking-wider">
                Admin Gateway
              </span>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {{ currentLang === 'ar' ? 'بوابة إدارة المنصة والتحكم المركزي' : 'Central Administration & Control Portal' }}
            </p>
          </div>
        </div>

        <!-- Controls: Theme & Language -->
        <div class="flex items-center gap-2">
          <button (click)="toggleTheme()" 
                  [title]="isDark ? 'Light Mode' : 'Dark Mode'"
                  class="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-amber-500 dark:text-amber-400 transition shadow-sm">
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

          <button (click)="toggleLanguage()" 
                  class="px-3.5 py-2 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-xl text-xs transition shadow-sm flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path>
            </svg>
            <span>{{ currentLang === 'ar' ? 'English' : 'العربية' }}</span>
          </button>
        </div>
      </header>

      <!-- Toast Notification -->
      <div *ngIf="notification.message" 
           [ngClass]="{'bg-emerald-500 text-white shadow-emerald-500/30': notification.type === 'success', 'bg-rose-500 text-white shadow-rose-500/30': notification.type === 'error'}"
           class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 animate-fade-in border border-white/10 backdrop-blur-md">
        <svg *ngIf="notification.type === 'success'" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
        <svg *ngIf="notification.type === 'error'" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/></svg>
        <span>{{ notification.message }}</span>
      </div>

      <!-- Main Portal Box -->
      <main class="flex-1 flex items-center justify-center p-3 relative z-20">
        <div class="w-full max-w-[460px] bg-white dark:bg-[#121626]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-7 sm:p-10 animate-fade-in relative overflow-hidden">
          
          <!-- Shield Security Icon -->
          <div class="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>

          <div class="text-center mb-6">
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {{ mode === 'login' ? (currentLang === 'ar' ? 'تسجيل دخول الإدارة' : 'Administrator Login') : (currentLang === 'ar' ? 'استعادة كلمة مرور الإدارة' : 'Admin Password Reset') }}
            </h2>
            <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
              {{ mode === 'login' 
                  ? (currentLang === 'ar' ? 'هذه البوابة مخصصة فقط لمديري ومسؤولي النظام.' : 'Authorized personnel only. Access is monitored and logged.')
                  : (currentLang === 'ar' ? 'أدخل بريد المشرف المسجل لإرسال رابط إعادة التعيين.' : 'Enter registered admin email to receive secure reset link.') }}
            </p>
          </div>

          <!-- 1. LOGIN FORM -->
          <form *ngIf="mode === 'login'" [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {{ currentLang === 'ar' ? 'البريد الإلكتروني للإدارة' : 'Admin Email Address' }}
              </label>
              <div class="relative">
                <input type="email" formControlName="email" placeholder="admin@qimma.com" 
                       class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-start text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-11 rtl:pr-11 rtl:pl-4 transition">
                <div class="absolute left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {{ currentLang === 'ar' ? 'كلمة المرور' : 'Password' }}
                </label>
                <a (click)="mode = 'forgot'" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer">
                  {{ currentLang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?' }}
                </a>
              </div>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="••••••••" 
                       class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-start text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-11 pr-11 rtl:pr-11 rtl:pl-11 transition">
                <div class="absolute left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <button type="button" (click)="showPassword = !showPassword" 
                        class="absolute right-3.5 rtl:left-3.5 rtl:right-auto top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <svg *ngIf="showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  <svg *ngIf="!showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                </button>
              </div>
            </div>

            <button type="submit" [disabled]="loginForm.invalid || isLoading" 
                    class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-sm rounded-xl transition shadow-xl shadow-indigo-600/30 disabled:opacity-50 mt-4 flex items-center justify-center gap-2 cursor-pointer">
              <svg *ngIf="isLoading" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>{{ currentLang === 'ar' ? 'دخول لوحة التحكم' : 'Authorize & Enter Console' }}</span>
            </button>
          </form>

          <!-- 2. FORGOT PASSWORD FORM -->
          <form *ngIf="mode === 'forgot'" [formGroup]="forgotForm" (ngSubmit)="onForgot()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {{ currentLang === 'ar' ? 'البريد الإلكتروني لحساب الإدارة' : 'Admin Email Address' }}
              </label>
              <div class="relative">
                <input type="email" formControlName="email" placeholder="admin@qimma.com" 
                       class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-start text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-11 rtl:pr-11 rtl:pl-4 transition">
                <div class="absolute left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
              </div>
            </div>

            <button type="submit" [disabled]="forgotForm.invalid || isSending" 
                    class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-xl transition shadow-xl shadow-indigo-600/30 disabled:opacity-50 mt-4 flex items-center justify-center gap-2 cursor-pointer">
              <svg *ngIf="isSending" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>{{ currentLang === 'ar' ? 'إرسال رابط إعادة التعيين' : 'Send Admin Reset Link' }}</span>
            </button>

            <div class="text-center pt-2">
              <a (click)="mode = 'login'" class="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                ← {{ currentLang === 'ar' ? 'العودة لتسجيل دخول الإدارة' : 'Back to Admin Login' }}
              </a>
            </div>
          </form>

        </div>
      </main>

      <!-- Footer -->
      <footer class="w-full py-3 text-center text-xs text-slate-500 dark:text-slate-400 z-20">
        {{ currentLang === 'ar' ? 'منصة قِمَّـة • نظام إدارة التعليم المركزي المشفر' : 'Qimma Platform • Encrypted Central Admin Infrastructure' }}
      </footer>

    </div>
  `
})
export class AdminLoginComponent implements OnInit {
  loginForm: FormGroup;
  forgotForm: FormGroup;
  mode: 'login' | 'forgot' = 'login';
  showPassword = false;
  isLoading = false;
  isSending = false;
  currentLang: 'ar' | 'en' = 'ar';
  notification: { message: string, type: 'success' | 'error' | null } = { message: '', type: null };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    public themeService: ThemeService,
    private langService: LanguageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.currentLang = this.langService.currentLanguage;
    this.langService.language$.subscribe((lang: 'en' | 'ar') => {
      this.currentLang = lang;
    });

    // If already logged in as Admin, redirect immediately
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && (role === '2' || role === 'Admin' || role?.toLowerCase() === 'admin')) {
      this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
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

  showToast(message: string, type: 'success' | 'error') {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = { message: '', type: null };
    }, 5000);
  }

  onLogin() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;

    const payload = { ...this.loginForm.value, isAdminPortal: true };
    this.http.post('http://localhost:5162/api/auth/login', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const role = String(res.role || '').toLowerCase();
        
        // Strict admin verification
        if (role !== '2' && role !== 'admin') {
          this.showToast(
            this.currentLang === 'ar'
              ? 'تم رفض الدخول: هذه البوابة مخصصة حصرياً لمديري النظام.'
              : 'Access Denied: This portal is strictly restricted to system administrators.',
            'error'
          );
          return;
        }

        // Store tokens
        localStorage.setItem('token', res.token);
        localStorage.setItem('userRole', 'Admin');
        localStorage.setItem('adminName', res.username || 'System Administrator');
        localStorage.setItem('userEmail', this.loginForm.value.email);

        this.showToast(
          this.currentLang === 'ar' ? 'تم التحقق بنجاح! جاري تحويلك للوحة التحكم...' : 'Admin authorized! Redirecting to Console...',
          'success'
        );

        setTimeout(() => {
          this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
        }, 1000);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error?.message === 'PORTAL_ADMIN_ONLY') {
          this.showToast(
            this.currentLang === 'ar'
              ? 'تم رفض الدخول: هذه البوابة مخصصة حصرياً لمديري النظام. يرجى الدخول من بوابة الطلاب والمعلمين.'
              : 'Access Denied: This portal is strictly restricted to system administrators. Please log in through the student/teacher portal.',
            'error'
          );
        } else {
          this.showToast(
            this.currentLang === 'ar' ? 'بيانات دخول الإدارة غير صحيحة.' : 'Invalid administrator credentials.',
            'error'
          );
        }
      }
    });
  }

  onForgot() {
    if (this.forgotForm.invalid) return;
    this.isSending = true;

    this.http.post('http://localhost:5162/api/auth/forgot-password', this.forgotForm.value).subscribe({
      next: () => {
        this.isSending = false;
        this.showToast(
          this.currentLang === 'ar' ? 'تم إرسال رابط إعادة التعيين لبريد الإدارة.' : 'Admin reset link sent to your email.',
          'success'
        );
        this.mode = 'login';
      },
      error: () => {
        this.isSending = false;
        this.showToast(
          this.currentLang === 'ar' ? 'فشل إرسال رابط إعادة التعيين.' : 'Failed to send reset link.',
          'error'
        );
      }
    });
  }
}
