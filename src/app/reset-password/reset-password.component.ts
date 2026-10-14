import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-[#130E35] flex items-center justify-center p-6 relative">
      
      <div *ngIf="notification.message" 
           [ngClass]="{'bg-emerald-50 text-emerald-700 border-emerald-200': notification.type === 'success', 'bg-rose-50 text-rose-700 border-rose-200': notification.type === 'error'}"
           class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-3 animate-fade-in transition-all">
        {{ notification.message }}
      </div>

      <div class="w-full max-w-[460px] bg-white rounded-[2rem] shadow-2xl p-8 sm:p-10 animate-fade-in text-center">
        
        <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>

        <h2 class="text-3xl font-black text-slate-900 mb-2">Set New Password</h2>
        <p class="text-slate-500 mb-8 text-sm">Enter a new secure password for your account.</p>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="text-left space-y-5">
          
          <div *ngIf="!token">
            <label class="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
            <input type="email" formControlName="email" class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium outline-none cursor-not-allowed">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
            <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" formControlName="newPassword" (input)="onPasswordInput($event)" placeholder="••••••••" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition pr-12">
                <button type="button" (click)="togglePasswordVisibility()" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                    <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                </button>
            </div>
            
            <!-- SEQUENTIAL PASSWORD METER -->
            <div class="mt-2 flex gap-1.5">
                <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqLength ? 'bg-emerald-500' : 'bg-slate-200'"></div>
                <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqCase ? 'bg-emerald-500' : 'bg-slate-200'"></div>
                <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqNumber ? 'bg-emerald-500' : 'bg-slate-200'"></div>
                <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqSpecial ? 'bg-emerald-500' : 'bg-slate-200'"></div>
            </div>

            <!-- SEQUENTIAL REQUIREMENTS CHECKLIST -->
            <div class="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqLength ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>8+ Characters</span>
              </div>
              <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqCase ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>Upper & Lowercase</span>
              </div>
              <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>At least one number</span>
              </div>
              <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqSpecial ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>Special (&#64;#$%&*)</span>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password</label>
            <input [type]="showPassword ? 'text' : 'password'" formControlName="confirmPassword" placeholder="••••••••" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                   [ngClass]="{'border-rose-300 ring-1 ring-rose-300': resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched}">
            <p *ngIf="resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched" class="text-rose-500 text-xs font-bold mt-1.5">Passwords do not match.</p>
          </div>

          <button type="submit" [disabled]="resetForm.invalid || !isPasswordStrong || isSubmitting" class="w-full py-4 bg-[#818CF8] hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50 mt-6 flex items-center justify-center gap-2">
             <svg *ngIf="isSubmitting" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             Reset Password
          </button>
        </form>

      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  showPassword = false;
  isSubmitting = false;
  token: string = '';
  notification: { message: string, type: 'success' | 'error' | null } = { message: '', type: null };

  reqLength = false;
  reqCase = false;
  reqNumber = false;
  reqSpecial = false;

  get isPasswordStrong(): boolean {
    return this.reqLength && this.reqCase && this.reqNumber && this.reqSpecial;
  }

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private http: HttpClient, private router: Router) {
    this.resetForm = this.fb.group({
      email: [''],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
      } else if (params['email']) {
        this.resetForm.patchValue({ email: params['email'] });
      } else {
        this.router.navigate(['/login']);
      }
    });
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
    const lengthMet = p.length >= 8;
    const caseMet = /[a-z]/.test(p) && /[A-Z]/.test(p);
    const numberMet = /[0-9]/.test(p);
    const specialMet = /[@#$%&*]/.test(p);

    // Sequential logic: Each requirement turns green sequentially starting from the beginning
    this.reqLength = lengthMet;
    this.reqCase = this.reqLength && caseMet;
    this.reqNumber = this.reqCase && numberMet;
    this.reqSpecial = this.reqNumber && specialMet;
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
      } else {
        payload.email = this.resetForm.getRawValue().email;
      }

      this.http.post('http://localhost:5162/api/auth/reset-password', payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          // Clear any active session tokens so user is directed to fresh login
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
          this.showToast('Password reset successfully! Redirecting to login...', 'success');
          setTimeout(() => {
            this.router.navigate(['/login'], { queryParams: { reset: 'success' }, replaceUrl: true });
          }, 1500);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Error resetting password.', 'error');
        }
      });
    }
  }
}