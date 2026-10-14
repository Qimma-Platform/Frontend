import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex relative" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- Toast Notification -->
      <div *ngIf="notification.message" 
           [ngClass]="{'bg-emerald-50 text-emerald-700 border-emerald-200': notification.type === 'success', 'bg-rose-50 text-rose-700 border-rose-200': notification.type === 'error', 'bg-amber-50 text-amber-700 border-amber-200': notification.type === 'warning'}"
           class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-3 animate-fade-in transition-all">
        {{ notification.message }}
      </div>

      <!-- WhatsApp Support Button (With Fixed Hover Tooltip Position) -->
      <a href="https://wa.me/201020653195" target="_blank" 
         class="fixed bottom-6 rtl:left-6 ltr:right-6 z-[100] bg-[#25D366] text-white w-14 h-14 rounded-full shadow-2xl hover:scale-110 hover:shadow-green-500/50 transition-all flex items-center justify-center group" 
         title="Contact Support">
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
        <span class="absolute rtl:left-16 ltr:right-16 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {{ currentLang === 'ar' ? 'للدعم الفني' : 'Support' }}
        </span>
      </a>

      <!-- Global Edge Language Switch -->
      <button (click)="toggleLanguage()" class="fixed top-6 rtl:left-6 ltr:right-6 z-[60] px-5 py-2 bg-white shadow-sm border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition">
         {{ content[currentLang].langSwitch }}
      </button>

      <!-- Left Branding Panel (40% width) -->
      <div class="hidden lg:flex w-2/5 bg-[#130E35] text-white flex-col justify-between p-12 relative overflow-hidden">
         <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
         <div class="absolute top-32 -right-32 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
         
         <div class="relative z-10">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-2xl mb-12 shadow-lg shadow-indigo-500/30">F</div>
            <h1 class="text-4xl xl:text-5xl font-black mb-6 leading-tight">{{ content[currentLang].leftTitle }}</h1>
            <p class="text-indigo-200 text-base xl:text-lg leading-relaxed max-w-md">{{ content[currentLang].leftDesc }}</p>
         </div>

         <div class="relative z-10 space-y-4">
            <div class="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
               <span class="text-2xl">🎓</span><p class="font-semibold text-sm xl:text-base">{{ content[currentLang].feat1 }}</p>
            </div>
            <div class="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
               <span class="text-2xl">📈</span><p class="font-semibold text-sm xl:text-base">{{ content[currentLang].feat2 }}</p>
            </div>
            <div class="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
               <span class="text-2xl">🌍</span><p class="font-semibold text-sm xl:text-base">{{ content[currentLang].feat3 }}</p>
            </div>
         </div>
      </div>

      <!-- Right Form Panel (60% width) -->
      <div class="w-full lg:w-3/5 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-slate-50">
         
         <!-- White Card Frame -->
         <div class="w-full max-w-[460px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 animate-fade-in relative z-10 mt-10 lg:mt-0">
            
            <!-- Tabs -->
            <div *ngIf="currentMode === 'login' || currentMode === 'signup'" class="flex p-1 bg-slate-50 border border-slate-100 rounded-2xl mb-8">
               <button (click)="switchMode('login')" [ngClass]="{'bg-white shadow-sm text-indigo-600': currentMode === 'login', 'text-slate-400 hover:text-slate-600': currentMode !== 'login'}" class="flex-1 py-2.5 text-sm font-bold rounded-xl transition">
                  {{ content[currentLang].loginTab }}
               </button>
               <button (click)="switchMode('signup')" [ngClass]="{'bg-white shadow-sm text-indigo-600': currentMode === 'signup', 'text-slate-400 hover:text-slate-600': currentMode !== 'signup'}" class="flex-1 py-2.5 text-sm font-bold rounded-xl transition">
                  {{ content[currentLang].signupTab }}
               </button>
            </div>

            <!-- Login Form -->
            <form *ngIf="currentMode === 'login'" [formGroup]="loginForm" (ngSubmit)="onLoginSubmit()" class="space-y-5">
               <div class="text-center mb-8">
                  <h2 class="text-3xl font-black text-slate-900">{{ content[currentLang].loginTitle }} 👋</h2>
                  <p class="text-slate-500 mt-2">{{ content[currentLang].loginDesc }}</p>
               </div>

               <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ content[currentLang].emailLabel }}</label>
                  <input type="email" formControlName="email" [placeholder]="content[currentLang].emailPlaceholder" 
                         class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition"
                         [ngClass]="{'border-rose-300 ring-1 ring-rose-300': loginForm.get('email')?.invalid && loginForm.get('email')?.touched}">
                  <p *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="text-rose-500 text-xs font-bold mt-1.5">
                     {{ content[currentLang].invalidEmail }}
                  </p>
               </div>

               <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ content[currentLang].passwordLabel }}</label>
                  <div class="relative">
                     <input [type]="showPassword ? 'text' : 'password'" formControlName="password" [placeholder]="content[currentLang].passwordPlaceholder" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition">
                     <button type="button" (click)="togglePasswordVisibility()" class="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none" [ngClass]="currentLang === 'ar' ? 'left-4' : 'right-4'">
                        <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                        <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                     </button>
                  </div>
               </div>

               <div class="flex items-center justify-between">
                  <label class="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" formControlName="rememberMe" class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                     <span class="text-sm font-bold text-slate-600">{{ content[currentLang].rememberMe }}</span>
                  </label>
                  <a (click)="switchMode('forgot')" class="text-sm font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">{{ content[currentLang].forgotPassLink }}</a>
               </div>

               <button type="submit" [disabled]="loginForm.invalid || isLoggingIn" class="w-full py-4 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50 mt-6 flex items-center justify-center gap-2">
                  <svg *ngIf="isLoggingIn" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {{ content[currentLang].loginBtn }}
               </button>
            </form>

            <!-- Signup Form -->
            <form *ngIf="currentMode === 'signup'" [formGroup]="signupForm" (ngSubmit)="onSignupSubmit()" class="space-y-4">
               <div class="text-center mb-6">
                  <h2 class="text-3xl font-black text-slate-900">{{ content[currentLang].signupTitle }}</h2>
                  <p class="text-slate-500 mt-2">{{ content[currentLang].signupDesc }}</p>
               </div>

               <!-- ELEGANT ROLE SELECTION (Pills) -->
               <div>
                  <label class="block text-xs font-bold text-slate-700 mb-2">{{ content[currentLang].accountTypeLabel }}</label>
                  <div class="flex p-1 bg-slate-50 border border-slate-200 rounded-xl mb-2">
                     <label class="flex-1 cursor-pointer">
                        <input type="radio" formControlName="role" [value]="0" class="peer sr-only">
                        <div class="py-2.5 text-center rounded-lg text-sm font-bold text-slate-500 peer-checked:bg-white peer-checked:text-indigo-600 peer-checked:shadow-sm border border-transparent peer-checked:border-slate-100 transition-all">
                          {{ content[currentLang].studentOpt }}
                        </div>
                     </label>
                     <label class="flex-1 cursor-pointer">
                        <input type="radio" formControlName="role" [value]="1" class="peer sr-only">
                        <div class="py-2.5 text-center rounded-lg text-sm font-bold text-slate-500 peer-checked:bg-white peer-checked:text-indigo-600 peer-checked:shadow-sm border border-transparent peer-checked:border-slate-100 transition-all">
                          {{ content[currentLang].teacherOpt }}
                        </div>
                     </label>
                     <label class="flex-1 cursor-pointer">
                        <input type="radio" formControlName="role" [value]="2" class="peer sr-only">
                        <div class="py-2.5 text-center rounded-lg text-sm font-bold text-slate-500 peer-checked:bg-white peer-checked:text-indigo-600 peer-checked:shadow-sm border border-transparent peer-checked:border-slate-100 transition-all">
                          {{ content[currentLang].adminOpt }}
                        </div>
                     </label>
                  </div>
               </div>

               <!-- ADMIN SECRET KEY -->
               <div *ngIf="signupForm.get('role')?.value === 2" class="animate-fade-in">
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ currentLang === 'ar' ? 'مفتاح المدير السري' : 'Admin Secret Key' }}</label>
                  <input type="password" formControlName="adminSecretKey" [placeholder]="content[currentLang].adminKeyPlaceholder" class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition text-sm">
               </div>

               <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ content[currentLang].nameLabel }}</label>
                  <input type="text" formControlName="username" [placeholder]="content[currentLang].namePlaceholder" class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition">
               </div>

               <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ content[currentLang].emailLabel }}</label>
                  <input type="email" formControlName="email" [placeholder]="content[currentLang].emailPlaceholder" 
                         class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition"
                         [ngClass]="{'border-rose-300 ring-1 ring-rose-300': signupForm.get('email')?.invalid && signupForm.get('email')?.touched}">
                  <p *ngIf="signupForm.get('email')?.invalid && signupForm.get('email')?.touched" class="text-rose-500 text-xs font-bold mt-1.5">
                     {{ content[currentLang].invalidEmail }}
                  </p>
               </div>

               <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ content[currentLang].passwordLabel }}</label>
                  <div class="relative">
                     <input [type]="showPassword ? 'text' : 'password'" formControlName="password" (input)="onPasswordInput($event)" [placeholder]="content[currentLang].passwordPlaceholder" class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition">
                     <button type="button" (click)="togglePasswordVisibility()" class="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none" [ngClass]="currentLang === 'ar' ? 'left-4' : 'right-4'">
                        <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                        <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                     </button>
                  </div>
                  <!-- PASSWORD STRENGTH METER -->
                  <div class="mt-2 flex gap-1.5">
                     <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqLength ? 'bg-emerald-500' : 'bg-slate-200'"></div>
                     <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqCase ? 'bg-emerald-500' : 'bg-slate-200'"></div>
                     <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqNumber ? 'bg-emerald-500' : 'bg-slate-200'"></div>
                     <div class="h-1.5 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqSpecial ? 'bg-emerald-500' : 'bg-slate-200'"></div>
                  </div>
                  <!-- SEQUENTIAL REQUIREMENTS CHECKLIST -->
                  <div class="grid grid-cols-2 gap-2 mt-2.5 text-[11px]">
                    <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqLength ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span>{{ currentLang === 'ar' ? '8 أحرف على الأقل' : '8+ Characters' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqCase ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span>{{ currentLang === 'ar' ? 'حروف كبيرة وصغيرة' : 'Upper & Lowercase' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span>{{ currentLang === 'ar' ? 'رقم واحد على الأقل' : 'At least one number' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 transition-colors duration-200" [ngClass]="reqSpecial ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span>{{ currentLang === 'ar' ? 'رمز خاص (@#$%&*)' : 'Special (@#$%&*)' }}</span>
                    </div>
                  </div>
               </div>

               <button type="submit" [disabled]="signupForm.invalid || !isPasswordStrong || (signupForm.get('role')?.value === 2 && !signupForm.get('adminSecretKey')?.value) || isSigningUp" class="w-full py-4 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center gap-2">
                  <svg *ngIf="isSigningUp" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {{ content[currentLang].signupBtn }}
               </button>
            </form>

            <!-- OTP Verification Form (No Emojis) -->
            <form *ngIf="currentMode === 'otp'" [formGroup]="otpForm" (ngSubmit)="onOtpSubmit()" class="space-y-5 text-center animate-fade-in py-6">
               <h2 class="text-3xl font-black text-slate-900">{{ currentLang === 'ar' ? 'تأكيد البريد' : 'Verify Email' }}</h2>
               <p class="text-slate-500 mt-2">{{ currentLang === 'ar' ? 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك.' : 'Enter the 6-digit code sent to your email.' }}</p>

               <div class="pt-4">
                  <input type="text" formControlName="otp" placeholder="123456" maxlength="6" class="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-black dir-ltr transition">
               </div>

               <button type="submit" [disabled]="otpForm.invalid || isLoggingIn" class="w-full py-4 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50 mt-6 flex items-center justify-center gap-2">
                  <svg *ngIf="isLoggingIn" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {{ currentLang === 'ar' ? 'تأكيد الحساب' : 'Verify Account' }}
               </button>
               <a (click)="switchMode('login')" class="block mt-4 text-sm font-bold text-slate-500 hover:text-slate-700 cursor-pointer">{{ currentLang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to login' }}</a>
            </form>

            <!-- Forgot Password Form -->
            <form *ngIf="currentMode === 'forgot'" [formGroup]="forgotForm" (ngSubmit)="onForgotSubmit()" class="space-y-5 animate-fade-in py-4">
               <div class="text-center mb-8">
                  <h2 class="text-3xl font-black text-slate-900">{{ content[currentLang].forgotTitle }}</h2>
                  <p class="text-slate-500 mt-2">{{ content[currentLang].forgotDesc }}</p>
               </div>

               <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ content[currentLang].emailLabel }}</label>
                  <input type="email" formControlName="email" [placeholder]="content[currentLang].emailPlaceholder" 
                         class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition"
                         [ngClass]="{'border-rose-300 ring-1 ring-rose-300': forgotForm.get('email')?.invalid && forgotForm.get('email')?.touched}">
                  <p *ngIf="forgotForm.get('email')?.invalid && forgotForm.get('email')?.touched" class="text-rose-500 text-xs font-bold mt-1.5">
                     {{ content[currentLang].invalidEmail }}
                  </p>
               </div>

               <button type="submit" [disabled]="forgotForm.invalid || isSendingLink" class="w-full py-4 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50 mt-6 flex items-center justify-center gap-2">
                  <svg *ngIf="isSendingLink" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {{ content[currentLang].sendLinkBtn }}
               </button>
               
               <div class="text-center mt-6">
                  <a (click)="switchMode('login')" class="text-sm font-bold text-slate-500 hover:text-slate-800 cursor-pointer transition">
                     ← {{ currentLang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to login' }}
                  </a>
               </div>
            </form>

         </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  currentMode: 'login' | 'signup' | 'forgot' | 'otp' = 'login'; 
  currentLang: 'ar' | 'en' = 'en';

  showPassword = false;
  isSigningUp = false;
  isLoggingIn = false;
  isSendingLink = false;
  notification: { message: string, type: 'success' | 'error' | 'warning' | null } = { message: '', type: null };

  loginForm: FormGroup;
  signupForm: FormGroup;
  forgotForm: FormGroup;
  otpForm: FormGroup;

  pendingEmail: string = '';

  reqLength = false;
  reqCase = false;
  reqNumber = false;
  reqSpecial = false;

  get isPasswordStrong(): boolean {
    return this.reqLength && this.reqCase && this.reqNumber && this.reqSpecial;
  }

  private apiUrl = 'http://localhost:5162/api/auth'; 

  content: any = {
    ar: {
      langSwitch: 'English', leftTitle: 'أطلق العنان لقدراتك التعليمية', leftDesc: 'انضم لآلاف الطلاب والمعلمين في منصة حديثة مصممة لجعل التعلم ممتعاً، متاحاً، وفعالاً.',
      feat1: 'كورسات يقودها خبراء وفصول مباشرة', feat2: 'تتبع شخصي لمستوى تقدمك', feat3: 'مجتمعات تعليمية تعاونية',
      loginTab: 'تسجيل الدخول', signupTab: 'حساب جديد', loginTitle: 'مرحباً بعودتك', loginDesc: 'أدخل بياناتك للوصول إلى حسابك',
      emailLabel: 'البريد الإلكتروني', emailPlaceholder: 'you@example.com', invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح',
      passwordLabel: 'كلمة المرور', passwordPlaceholder: '••••••••',
      rememberMe: 'تذكرني', forgotPassLink: 'نسيت كلمة المرور؟', loginBtn: 'دخول',
      signupTitle: 'إنشاء حساب', signupDesc: 'ابدأ رحلتك التعليمية اليوم', nameLabel: 'الاسم بالكامل', namePlaceholder: 'مثال: كريم أحمد',
      accountTypeLabel: 'اختر نوع الحساب', studentOpt: 'طالب', teacherOpt: 'معلم', adminOpt: 'مدير', signupBtn: 'إنشاء حساب',
      adminKeyPlaceholder: 'تواصل عبر الواتساب للحصول على الرمز',
      noAccount: 'ليس لديك حساب؟', haveAccount: 'لديك حساب بالفعل؟', forgotTitle: 'استعادة كلمة المرور', forgotDesc: 'أدخل بريدك وسنرسل لك الرابط.', sendLinkBtn: 'إرسال الرابط'
    },
    en: {
      langSwitch: 'عربي', leftTitle: 'Unlock your learning potential', leftDesc: 'Join thousands of students and educators on a modern platform designed to make learning engaging, accessible, and effective.',
      feat1: 'Expert-led courses & live classes', feat2: 'Personalized progress tracking', feat3: 'Collaborative learning communities',
      loginTab: 'Log In', signupTab: 'Sign Up', loginTitle: 'Welcome back', loginDesc: 'Enter your credentials to access your account',
      emailLabel: 'Email Address', emailPlaceholder: 'you@example.com', invalidEmail: 'Please enter a valid email address.',
      passwordLabel: 'Password', passwordPlaceholder: '••••••••',
      rememberMe: 'Remember me', forgotPassLink: 'Forgot password?', loginBtn: 'Log In',
      signupTitle: 'Create account', signupDesc: 'Start your learning journey today', nameLabel: 'Full Name', namePlaceholder: 'Kareem Ahmed',
      accountTypeLabel: 'Choose Account Type', studentOpt: 'Student', teacherOpt: 'Teacher', adminOpt: 'Admin', signupBtn: 'Sign Up',
      adminKeyPlaceholder: 'Contact via WhatsApp to get the key',
      noAccount: "Don't have an account?", haveAccount: 'Already have an account?', forgotTitle: 'Reset Password', forgotDesc: 'Enter your email to receive a reset link.', sendLinkBtn: 'Send Link'
    }
  };

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private route: ActivatedRoute) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });

    this.signupForm = this.fb.group({
      username: ['', Validators.required], 
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      role: [0, Validators.required],
      adminSecretKey: [''] 
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit() {
    // 1. Kick authenticated users back to their dashboard so they can't access login page.
    const token = localStorage.getItem('token');
    if (token) {
       const role = localStorage.getItem('userRole');
       if (role === 'Teacher' || role === '1') {
          this.router.navigate(['/teacher-dashboard'], { replaceUrl: true });
       } else {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
       }
       return;
    }

    // 2. Track URL Parameters for Back button sync
    this.route.queryParams.subscribe(params => {
      if (params['reset'] === 'success') {
        this.showToast(this.currentLang === 'ar' ? 'تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.' : 'Password reset successfully! You can now log in.', 'success');
      }
      const mode = params['mode'];
      if (mode === 'signup' || mode === 'forgot' || mode === 'otp') {
        this.currentMode = mode;
      } else {
        this.currentMode = 'login';
      }
    });

    this.signupForm.get('role')?.valueChanges.subscribe(() => {
      this.signupForm.patchValue({
        username: '',
        email: '',
        password: '',
        adminSecretKey: ''
      }, { emitEvent: false });
      
      this.signupForm.markAsUntouched();
      this.signupForm.markAsPristine();
      this.reqLength = false;
      this.reqCase = false;
      this.reqNumber = false;
      this.reqSpecial = false;
    });
  }

  switchMode(mode: string) {
    this.router.navigate([], { queryParams: { mode: mode } });
  }

  toggleLanguage() {
    this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
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

    // Sequential logic: Each requirement turns green as soon as it is met, starting from the beginning
    this.reqLength = lengthMet;
    this.reqCase = this.reqLength && caseMet;
    this.reqNumber = this.reqCase && numberMet;
    this.reqSpecial = this.reqNumber && specialMet;
  }

  showToast(message: string, type: 'success' | 'error' | 'warning') {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = { message: '', type: null };
    }, 5000);
  }

  onSignupSubmit() {
    if (this.signupForm.valid && this.isPasswordStrong) {
      this.isSigningUp = true;
      const payload = { ...this.signupForm.value, role: Number(this.signupForm.value.role) };
      
      this.http.post(`${this.apiUrl}/register`, payload).subscribe({
        next: (res: any) => {
          this.isSigningUp = false;
          if (res.token === 'OTP_REQUIRED') {
            this.pendingEmail = this.signupForm.value.email;
            this.switchMode('otp');
            this.showToast(this.currentLang === 'ar' ? 'تم إرسال كود التأكيد لبريدك' : 'OTP sent to your email', 'success');
          }
        },
        error: (err) => {
          this.isSigningUp = false;
          let errorMsg = err.error?.message || err.message || '';

          if (errorMsg.includes('Admin Secret Key')) {
             errorMsg = this.currentLang === 'ar' ? 'مفتاح المدير السري غير صحيح.' : 'Invalid Admin Secret Key.';
          } else if (errorMsg.includes('already exists')) {
             errorMsg = this.currentLang === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل.' : 'A user with this email already exists.';
          } else {
             errorMsg = this.currentLang === 'ar' ? 'فشل إنشاء الحساب.' : 'Failed to create account.';
          }

          this.showToast(errorMsg, 'error');
        }
      });
    }
  }

  onOtpSubmit() {
    if (this.otpForm.valid) {
      this.isLoggingIn = true;
      const payload = { email: this.pendingEmail, otp: this.otpForm.value.otp };
      this.http.post(`${this.apiUrl}/verify-otp`, payload).subscribe({
        next: (response: any) => {
          this.handleSuccessfulLogin(response, this.currentLang === 'ar' ? 'تم تأكيد الحساب وتسجيل الدخول' : 'Account verified and logged in');
        },
        error: () => {
          this.isLoggingIn = false;
          this.showToast(this.currentLang === 'ar' ? 'الكود غير صحيح أو منتهي الصلاحية' : 'Invalid or expired OTP', 'error');
        }
      });
    }
  }

  onLoginSubmit() {
    if (this.loginForm.valid) {
      this.isLoggingIn = true;
      this.http.post(`${this.apiUrl}/login`, this.loginForm.value).subscribe({
        next: (response: any) => {
          this.handleSuccessfulLogin(response, this.currentLang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
        },
        error: (err) => {
          this.isLoggingIn = false;
          if (err.error?.message === 'EMAIL_NOT_CONFIRMED') {
            this.pendingEmail = this.loginForm.value.email;
            this.switchMode('otp');
            this.showToast(this.currentLang === 'ar' ? 'برجاء تأكيد بريدك. تم إرسال كود جديد' : 'Please verify email. New OTP sent', 'warning');
          } else {
            this.showToast(this.currentLang === 'ar' ? 'الإيميل أو كلمة المرور غير صحيحة' : 'Invalid email or password', 'error');
          }
        }
      });
    }
  }

  handleSuccessfulLogin(response: any, successMessage: string) {
    const token = response.token || response.Token;
    if (token) {
      localStorage.setItem('token', token);
      
      let userRole = '';
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        userRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || decoded.Role || String(response.role || response.Role || '0');
      } catch(e) {
        userRole = String(response.role || response.Role || '0');
      }

      localStorage.setItem('userRole', userRole);
      this.showToast(successMessage, 'success');
      
      setTimeout(() => {
        this.isLoggingIn = false;
        const roleCheck = String(userRole).toLowerCase();
        // Uses replaceUrl: true to ERASE the login page from the browser's back history stack!
        if (roleCheck === '2' || roleCheck === 'admin') {
          this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
        } else if (roleCheck === '1' || roleCheck === 'teacher' || roleCheck === 'instructor') {
          this.router.navigate(['/teacher-dashboard'], { replaceUrl: true });
        } else {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        }
      }, 1500); 
    } else {
      this.isLoggingIn = false;
    }
  }

  onForgotSubmit() {
    if (this.forgotForm.valid) {
      this.isSendingLink = true;
      this.http.post(`${this.apiUrl}/forgot-password`, this.forgotForm.value).subscribe({
        next: () => {
          this.isSendingLink = false;
          this.showToast(this.currentLang === 'ar' ? 'تم إرسال الرابط لبريدك الإلكتروني' : 'Reset link sent to your email', 'success');
          this.switchMode('login');
        },
        error: () => {
          this.isSendingLink = false;
          this.showToast(this.currentLang === 'ar' ? 'حدث خطأ، تأكد من صحة البريد' : 'Error sending link. Verify your email', 'error');
        }
      });
    }
  }
}