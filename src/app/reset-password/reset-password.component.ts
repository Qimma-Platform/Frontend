import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div [dir]="lang === 'ar' ? 'rtl' : 'ltr'" class="min-h-screen bg-[#0d0924] dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 relative text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      <!-- Top Bar: Logo & Language Toggle -->
      <header class="w-full max-w-5xl mx-auto flex items-center justify-between py-2 z-20">
        <a routerLink="/home" class="flex items-center gap-3 group cursor-pointer">
          <img src="assets/images/qimma-round.jpg" alt="Qimma Brand" 
               class="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-indigo-500/30 border border-white/20">
          <div>
            <h1 class="text-xl font-black tracking-tight text-white">
              {{ lang === 'ar' ? 'منصة قِمَّـة' : 'Qimma' }}
            </h1>
            <p class="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
              {{ lang === 'ar' ? 'بوابة إعادة تعيين كلمة المرور' : 'Secure Password Reset' }}
            </p>
          </div>
        </a>

        <button (click)="toggleLanguage()" 
                class="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition border border-white/10 backdrop-blur-md flex items-center gap-2">
          <svg class="w-4 h-4 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path>
          </svg>
          <span>{{ lang === 'ar' ? 'English' : 'العربية' }}</span>
        </button>
      </header>

      <!-- Toast Notification -->
      <div *ngIf="notification.message" 
           [ngClass]="{'bg-emerald-500 text-white shadow-emerald-500/30': notification.type === 'success', 'bg-rose-500 text-white shadow-rose-500/30': notification.type === 'error'}"
           class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-3 animate-fade-in transition-all">
        <svg *ngIf="notification.type === 'success'" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
        <svg *ngIf="notification.type === 'error'" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/></svg>
        <span>{{ notification.message }}</span>
      </div>

      <!-- Main Container -->
      <main class="flex-1 flex items-center justify-center p-2 relative z-20">
        
        <!-- Glow Backdrops -->
        <div class="absolute w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -top-10 -left-10"></div>
        <div class="absolute w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10"></div>

        <div class="w-full max-w-[480px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-7 sm:p-10 animate-fade-in text-center relative overflow-hidden">
          
          <!-- Modern Icon Header (Padlock SVG) -->
          <div class="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-inner border border-indigo-100 dark:border-indigo-900/40">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>

          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
            {{ lang === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password' }}
          </h2>
          <p class="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            {{ lang === 'ar' ? 'أدخل كلمة مرور قوية لتأمين حسابك في منصة قِمَّـة.' : 'Enter a new secure password for your Qimma account.' }}
          </p>

          <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="text-start space-y-4">
            
            <!-- Email Address (Display Only / Non-editable Req 3) -->
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>{{ lang === 'ar' ? 'البريد الإلكتروني المرتبط بالحساب' : 'Account Email Address' }}</span>
                <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
                  {{ lang === 'ar' ? 'غير قابل للتعديل' : 'Non-editable' }}
                </span>
              </label>
              <div class="relative">
                <input type="email" 
                       formControlName="email" 
                       readonly
                       class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold outline-none cursor-not-allowed dir-ltr text-start pl-11 rtl:pr-11 rtl:pl-4 shadow-inner">
                <div class="absolute left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- New Password -->
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {{ lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password' }}
              </label>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" 
                       formControlName="newPassword" 
                       (input)="onPasswordInput($event)" 
                       placeholder="••••••••" 
                       class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition pr-12 rtl:pl-12 rtl:pr-4 text-slate-900 dark:text-white">
                <button type="button" 
                        (click)="togglePasswordVisibility()" 
                        class="absolute right-4 rtl:left-4 rtl:right-auto top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none">
                  <svg *ngIf="showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  <svg *ngIf="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                </button>
              </div>
              
              <!-- Sequential Password Meter -->
              <div class="mt-2 flex gap-1.5">
                <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqLength ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"></div>
                <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqCase ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"></div>
                <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqNumber ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"></div>
                <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqSpecial ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"></div>
              </div>

              <!-- Requirements Checklist -->
              <div class="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'">
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span>{{ lang === 'ar' ? '8+ أحرف' : '8+ Characters' }}</span>
                </div>
                <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqCase ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'">
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span>{{ lang === 'ar' ? 'أحرف كبيرة وصغيرة' : 'Upper & Lowercase' }}</span>
                </div>
                <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'">
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span>{{ lang === 'ar' ? 'رقم واحد على الأقل' : 'At least 1 number' }}</span>
                </div>
                <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqSpecial ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'">
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span>{{ lang === 'ar' ? 'رمز خاص (@#$%&*)' : 'Special (@#$%&*)' }}</span>
                </div>
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {{ lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password' }}
              </label>
              <input [type]="showPassword ? 'text' : 'password'" 
                     formControlName="confirmPassword" 
                     placeholder="••••••••" 
                     class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition text-slate-900 dark:text-white"
                     [ngClass]="{'border-rose-300 ring-1 ring-rose-300': resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched}">
              <p *ngIf="resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched" class="text-rose-500 text-xs font-bold mt-1.5">
                {{ lang === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.' }}
              </p>
            </div>

            <!-- Submit Button -->
            <button type="submit" 
                    [disabled]="resetForm.invalid || !isPasswordStrong || isSubmitting" 
                    class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-2xl transition shadow-xl shadow-indigo-600/30 disabled:opacity-50 mt-6 flex items-center justify-center gap-2 cursor-pointer">
              <svg *ngIf="isSubmitting" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>{{ lang === 'ar' ? 'حفظ كلمة المرور الجديدة' : 'Reset Password' }}</span>
            </button>

            <!-- Back to Login Link -->
            <div class="text-center pt-2">
              <a [routerLink]="isAdmin ? '/admin-portal/login' : '/login'" class="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">
                {{ lang === 'ar' ? '← العودة لتسجيل الدخول' : '← Back to login' }}
              </a>
            </div>

          </form>

        </div>
      </main>

      <!-- Footer -->
      <footer class="w-full py-3 text-center text-xs text-white/50 z-20">
        © 2026 {{ lang === 'ar' ? 'منصة قِمَّـة التعليمية. جميع الحقوق محفوظة.' : 'Qimma E-Learning Platform. All Rights Reserved.' }}
      </footer>

    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  showPassword = false;
  isSubmitting = false;
  token: string = '';
  lang: 'ar' | 'en' = 'ar';
  isAdmin = false;
  notification: { message: string, type: 'success' | 'error' | null } = { message: '', type: null };

  reqLength = false;
  reqCase = false;
  reqNumber = false;
  reqSpecial = false;

  get isPasswordStrong(): boolean {
    return this.reqLength && this.reqCase && this.reqNumber && this.reqSpecial;
  }

  constructor(
    private fb: FormBuilder, 
    private route: ActivatedRoute, 
    private http: HttpClient, 
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      email: [''],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    const savedLang = localStorage.getItem('lang');
    if (savedLang === 'en' || savedLang === 'ar') {
      this.lang = savedLang;
    }

    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
      }

      if (params['isAdmin'] === 'true' || params['role'] === 'admin' || params['role'] === 'Admin') {
        this.isAdmin = true;
      }
      
      const emailParam = params['email'];
      if (emailParam) {
        this.resetForm.patchValue({ email: emailParam });
        if (emailParam.toLowerCase().includes('admin') || emailParam.toLowerCase() === 'admin@fluencyfirst.com') {
          this.isAdmin = true;
        }
      }

      if (this.token) {
        // Try decoding email and role from JWT payload
        try {
          const parts = this.token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const email = payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
            if (email && !emailParam) {
              this.resetForm.patchValue({ email });
            }
            if (email && (email.toLowerCase().includes('admin') || email.toLowerCase() === 'admin@fluencyfirst.com')) {
              this.isAdmin = true;
            }
            const role = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            if (role === 'Admin' || role === '2') {
              this.isAdmin = true;
            }
          }
        } catch {}
      }

      if (!this.token && !this.resetForm.get('email')?.value) {
        this.router.navigate([this.isAdmin ? '/admin-portal/login' : '/login']);
      }
    });
  }

  toggleLanguage() {
    this.lang = this.lang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', this.lang);
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onPasswordInput(event: any) {
    const p = event.target.value || '';
    this.reqLength = p.length >= 8;
    this.reqCase = this.reqLength && (/[a-z]/.test(p) && /[A-Z]/.test(p));
    this.reqNumber = this.reqCase && /[0-9]/.test(p);
    this.reqSpecial = this.reqNumber && /[@#$%&*]/.test(p);
  }

  showToast(message: string, type: 'success' | 'error') {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = { message: '', type: null };
    }, 5000);
  }

  onSubmit() {
    if (this.resetForm.valid && this.isPasswordStrong) {
      this.isSubmitting = true;
      const payload: any = {
        newPassword: this.resetForm.value.newPassword
      };

      if (this.token) {
        payload.token = this.token;
      }
      
      const emailVal = this.resetForm.getRawValue().email;
      if (emailVal) {
        payload.email = emailVal;
      }

      this.http.post<any>('http://localhost:5162/api/auth/reset-password', payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res?.isAdmin === true) {
            this.isAdmin = true;
          }
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
          const msg = this.lang === 'ar' ? 'تم تحديث كلمة المرور بنجاح! جاري التحويل لتسجيل الدخول...' : 'Password reset successfully! Redirecting to login...';
          this.showToast(msg, 'success');
          setTimeout(() => {
            const targetLogin = this.isAdmin ? '/admin-portal/login' : '/login';
            this.router.navigate([targetLogin], { queryParams: { reset: 'success' }, replaceUrl: true });
          }, 1500);
        },
        error: (err) => {
          this.isSubmitting = false;
          const defaultErr = this.lang === 'ar' ? 'فشل إعادة تعيين كلمة المرور.' : 'Error resetting password.';
          this.showToast(err.error?.message || defaultErr, 'error');
        }
      });
    }
  }
}