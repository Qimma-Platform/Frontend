import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LanguageService } from '../services/language.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col justify-between relative transition-colors duration-300 selection:bg-indigo-600 selection:text-white" 
         [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- ========================================== -->
      <!-- TOAST NOTIFICATION                         -->
      <!-- ========================================== -->
      <div *ngIf="notification.message" 
           [ngClass]="{
             'bg-emerald-600 text-white shadow-emerald-600/30': notification.type === 'success', 
             'bg-rose-600 text-white shadow-rose-600/30': notification.type === 'error', 
             'bg-amber-500 text-white shadow-amber-500/30': notification.type === 'warning'
           }"
           class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 animate-fade-in transition-all border border-white/20">
        <span *ngIf="notification.type === 'success'" class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
        <span *ngIf="notification.type === 'error'" class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✕</span>
        <span *ngIf="notification.type === 'warning'" class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">⚠️</span>
        <span>{{ notification.message }}</span>
      </div>

      <!-- ========================================== -->
      <!-- TOP NAVIGATION BAR                         -->
      <!-- ========================================== -->
      <header class="w-full px-6 lg:px-12 py-5 flex items-center justify-between relative z-30">
        
        <!-- Back to Home Link / Brand -->
        <a routerLink="/" class="flex items-center gap-3 group cursor-pointer">
          <img src="assets/images/qimma-round.jpg" alt="Qimma Logo" 
               class="w-10 h-10 rounded-xl object-cover shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-all border border-indigo-200 dark:border-indigo-900/60">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {{ currentLang === 'ar' ? 'قِمَّـة' : 'Qimma' }}
              </span>
            </div>
            <p class="text-[10px] text-slate-600 dark:text-slate-300 font-bold">
              {{ currentLang === 'ar' ? 'العودة للرئيسية' : 'Back to Home' }}
            </p>
          </div>
        </a>

        <!-- Controls: Dark Mode & Language -->
        <div class="flex items-center gap-2.5">
          <!-- Dark Mode Button -->
          <button (click)="toggleTheme()" 
                  [title]="isDark ? (currentLang === 'ar' ? 'الوضع النهاري' : 'Light Mode') : (currentLang === 'ar' ? 'الوضع الليلي' : 'Dark Mode')"
                  class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-amber-400 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm">
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

          <!-- Language Switcher -->
          <button (click)="toggleLanguage()" 
                  class="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-extrabold rounded-xl text-xs transition shadow-sm flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path>
            </svg>
            <span>{{ currentLang === 'ar' ? 'English' : 'العربية' }}</span>
          </button>
        </div>
      </header>

      <!-- ========================================== -->
      <!-- MAIN AUTH CONTAINER                        -->
      <!-- ========================================== -->
      <main class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-20">
        
        <!-- Ambient Background Highlights -->
        <div class="absolute top-1/3 rtl:right-10 ltr:left-10 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-1/4 rtl:left-10 ltr:right-10 w-80 h-80 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="w-full max-w-5xl bg-white dark:bg-[#0c1220] rounded-[2.5rem] shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          <!-- LEFT BRANDING SIDEBAR (5 Columns on Desktop) -->
          <div class="hidden lg:flex lg:col-span-5 bg-[#100b2b] text-white flex-col justify-between p-10 relative overflow-hidden border-r rtl:border-l rtl:border-r-0 border-white/10">
            
            <!-- Glowing gradient spheres in backdrop -->
            <div class="absolute -top-24 -left-24 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 space-y-6">
              <!-- Official Round Logo -->
              <div class="flex items-center gap-3">
                <img src="assets/images/qimma-round.jpg" alt="Qimma Brand" 
                     class="w-14 h-14 rounded-2xl object-cover shadow-xl shadow-indigo-500/30 border-2 border-white/20">
                <div>
                  <h2 class="text-2xl font-black tracking-tight text-white">
                    {{ currentLang === 'ar' ? 'منصة قِمَّـة' : 'Qimma' }}
                  </h2>
                  <p class="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                    {{ currentLang === 'ar' ? 'التعلم الذكي المبتكر' : 'Next-Gen E-Learning' }}
                  </p>
                </div>
              </div>

              <div class="pt-4">
                <h1 class="text-3xl font-black text-white leading-tight mb-3">
                  {{ content[currentLang].leftTitle }}
                </h1>
                <p class="text-indigo-200/80 text-sm leading-relaxed">
                  {{ content[currentLang].leftDesc }}
                </p>
              </div>
            </div>

            <!-- Value Pillars -->
            <div class="relative z-10 space-y-3.5 my-8">
              <div class="flex items-center gap-3.5 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div class="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-5.25 6.557q0 .426.046.845"/>
                  </svg>
                </div>
                <p class="font-bold text-xs text-white/90">{{ content[currentLang].feat1 }}</p>
              </div>

              <div class="flex items-center gap-3.5 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
                  </svg>
                </div>
                <p class="font-bold text-xs text-white/90">{{ content[currentLang].feat2 }}</p>
              </div>

              <div class="flex items-center gap-3.5 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/>
                  </svg>
                </div>
                <p class="font-bold text-xs text-white/90">{{ content[currentLang].feat3 }}</p>
              </div>
            </div>

            <!-- Left Panel Footer -->
            <div class="relative z-10 pt-4 border-t border-white/10 text-center text-xs text-indigo-300/70 font-medium">
              <span>© {{ currentYear }} {{ currentLang === 'ar' ? 'منصة قِمَّـة التعليمية' : 'Qimma E-Learning Platform' }}</span>
            </div>

          </div>

          <!-- RIGHT FORM PANEL (7 Columns on Desktop) -->
          <div class="lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 lg:p-12 relative bg-white dark:bg-[#0c1220]">
            
            <div class="w-full max-w-md mx-auto">
              
              <!-- Tab Switcher: Login / Sign Up -->
              <div *ngIf="currentMode === 'login' || currentMode === 'signup'" 
                   class="flex p-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl mb-8">
                <button (click)="switchMode('login')" 
                        [ngClass]="{
                          'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-black': currentMode === 'login', 
                          'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold': currentMode !== 'login'
                        }" 
                        class="flex-1 py-3 text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  <span>{{ content[currentLang].loginTab }}</span>
                </button>

                <button (click)="switchMode('signup')" 
                        [ngClass]="{
                          'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-black': currentMode === 'signup', 
                          'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold': currentMode !== 'signup'
                        }" 
                        class="flex-1 py-3 text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  <span>{{ content[currentLang].signupTab }}</span>
                </button>
              </div>

              <!-- ========================================== -->
              <!-- 1. LOGIN FORM                              -->
              <!-- ========================================== -->
              <form *ngIf="currentMode === 'login'" [formGroup]="loginForm" (ngSubmit)="onLoginSubmit()" class="space-y-5 animate-fade-in">
                
                <div class="mb-6">
                  <h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {{ content[currentLang].loginTitle }} 👋
                  </h3>
                  <p class="text-slate-600 dark:text-slate-300 text-sm mt-1.5">
                    {{ content[currentLang].loginDesc }}
                  </p>
                </div>

                <!-- Email Input -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {{ content[currentLang].emailLabel }}
                  </label>
                  <div class="relative">
                    <input type="email" formControlName="email" [placeholder]="content[currentLang].emailPlaceholder" 
                           class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-850 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                           [ngClass]="{'border-rose-400 ring-1 ring-rose-400': loginForm.get('email')?.invalid && loginForm.get('email')?.touched}">
                  </div>
                  <p *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="text-rose-500 text-xs font-bold mt-1.5">
                    {{ content[currentLang].invalidEmail }}
                  </p>
                </div>

                <!-- Password Input -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {{ content[currentLang].passwordLabel }}
                  </label>
                  <div class="relative">
                    <input [type]="showPassword ? 'text' : 'password'" formControlName="password" [placeholder]="content[currentLang].passwordPlaceholder" 
                           class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition text-sm text-slate-900 dark:text-white placeholder:text-slate-400">
                    <button type="button" (click)="togglePasswordVisibility()" 
                            class="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1" 
                            [ngClass]="currentLang === 'ar' ? 'left-3.5' : 'right-3.5'">
                      <svg *ngIf="showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      <svg *ngIf="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    </button>
                  </div>
                </div>

                <!-- Remember Me & Forgot Password -->
                <div class="flex items-center justify-between text-xs pt-1">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" formControlName="rememberMe" class="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-indigo-500">
                    <span class="font-bold text-slate-600 dark:text-slate-300">{{ content[currentLang].rememberMe }}</span>
                  </label>
                  <a (click)="switchMode('forgot')" class="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                    {{ content[currentLang].forgotPassLink }}
                  </a>
                </div>

                <!-- Submit Button -->
                <button type="submit" [disabled]="loginForm.invalid || isLoggingIn" 
                        class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-sm rounded-2xl transition shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 disabled:opacity-50 mt-6 flex items-center justify-center gap-2 cursor-pointer">
                  <svg *ngIf="isLoggingIn" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>{{ content[currentLang].loginBtn }}</span>
                </button>

                <!-- Quick Switch helper -->
                <p class="text-center text-xs text-slate-600 dark:text-slate-300 pt-2 font-medium">
                  {{ content[currentLang].noAccount }}
                  <a (click)="switchMode('signup')" class="font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1 rtl:mr-1">
                    {{ content[currentLang].signupTab }}
                  </a>
                </p>

              </form>

              <!-- ========================================== -->
              <!-- 2. CREATE ACCOUNT (SIGN UP) FORM           -->
              <!-- ========================================== -->
              <form *ngIf="currentMode === 'signup'" [formGroup]="signupForm" (ngSubmit)="onSignupSubmit()" class="space-y-4 animate-fade-in">
                
                <div class="mb-4">
                  <h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {{ content[currentLang].signupTitle }}
                  </h3>
                  <p class="text-slate-600 dark:text-slate-300 text-sm mt-1">
                    {{ content[currentLang].signupDesc }}
                  </p>
                </div>

                <!-- Account Type Role Selector (Student / Teacher) -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {{ content[currentLang].accountTypeLabel }}
                  </label>
                  <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <label class="cursor-pointer">
                      <input type="radio" formControlName="role" [value]="0" class="peer sr-only">
                      <div class="py-2.5 text-center rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 peer-checked:bg-white dark:peer-checked:bg-slate-900 peer-checked:text-indigo-600 dark:peer-checked:text-indigo-400 peer-checked:shadow-sm transition-all flex items-center justify-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/></svg>
                        <span>{{ content[currentLang].studentOpt }}</span>
                      </div>
                    </label>
                    <label class="cursor-pointer">
                      <input type="radio" formControlName="role" [value]="1" class="peer sr-only">
                      <div class="py-2.5 text-center rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 peer-checked:bg-white dark:peer-checked:bg-slate-900 peer-checked:text-indigo-600 dark:peer-checked:text-indigo-400 peer-checked:shadow-sm transition-all flex items-center justify-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>
                        <span>{{ content[currentLang].teacherOpt }}</span>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Full Name -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {{ content[currentLang].nameLabel }}
                  </label>
                  <input type="text" formControlName="username" [placeholder]="content[currentLang].namePlaceholder" 
                         class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition text-sm text-slate-900 dark:text-white placeholder:text-slate-400">
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {{ content[currentLang].emailLabel }}
                  </label>
                  <input type="email" formControlName="email" [placeholder]="content[currentLang].emailPlaceholder" 
                         class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                         [ngClass]="{'border-rose-400 ring-1 ring-rose-400': signupForm.get('email')?.invalid && signupForm.get('email')?.touched}">
                  <p *ngIf="signupForm.get('email')?.invalid && signupForm.get('email')?.touched" class="text-rose-500 text-xs font-bold mt-1">
                    {{ content[currentLang].invalidEmail }}
                  </p>
                </div>

                <!-- Password -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {{ content[currentLang].passwordLabel }}
                  </label>
                  <div class="relative">
                    <input [type]="showPassword ? 'text' : 'password'" formControlName="password" (input)="onPasswordInput($event)" [placeholder]="content[currentLang].passwordPlaceholder" 
                           class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition text-sm text-slate-900 dark:text-white placeholder:text-slate-400">
                    <button type="button" (click)="togglePasswordVisibility()" 
                            class="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1" 
                            [ngClass]="currentLang === 'ar' ? 'left-3.5' : 'right-3.5'">
                      <svg *ngIf="showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      <svg *ngIf="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    </button>
                  </div>

                  <!-- Password Strength Meter -->
                  <div class="mt-2 flex gap-1.5">
                    <div class="h-1 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqLength ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"></div>
                    <div class="h-1 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqCase ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"></div>
                    <div class="h-1 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqNumber ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"></div>
                    <div class="h-1 flex-1 rounded-full transition-colors duration-300" [ngClass]="reqSpecial ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'"></div>
                  </div>

                  <!-- Sequential Checklist -->
                  <div class="grid grid-cols-2 gap-2 mt-2 text-[10px]">
                    <div class="flex items-center gap-1.5" [ngClass]="reqLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'">
                      <span>{{ reqLength ? '✓' : '○' }}</span>
                      <span>{{ currentLang === 'ar' ? '8 أحرف على الأقل' : '8+ Characters' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5" [ngClass]="reqCase ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'">
                      <span>{{ reqCase ? '✓' : '○' }}</span>
                      <span>{{ currentLang === 'ar' ? 'حروف كبيرة وصغيرة' : 'Upper & Lowercase' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5" [ngClass]="reqNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'">
                      <span>{{ reqNumber ? '✓' : '○' }}</span>
                      <span>{{ currentLang === 'ar' ? 'رقم واحد على الأقل' : 'At least 1 number' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5" [ngClass]="reqSpecial ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'">
                      <span>{{ reqSpecial ? '✓' : '○' }}</span>
                      <span>{{ currentLang === 'ar' ? 'رمز خاص (@#$%&*)' : 'Special (@#$%&*)' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Submit Sign Up Button -->
                <button type="submit" 
                        [disabled]="signupForm.invalid || !isPasswordStrong || isSigningUp" 
                        class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-sm rounded-2xl transition shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 disabled:opacity-50 mt-4 flex items-center justify-center gap-2 cursor-pointer">
                  <svg *ngIf="isSigningUp" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>{{ content[currentLang].signupBtn }}</span>
                </button>

                <p class="text-center text-xs text-slate-600 dark:text-slate-300 pt-2 font-medium">
                  {{ content[currentLang].haveAccount }}
                  <a (click)="switchMode('login')" class="font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1 rtl:mr-1">
                    {{ content[currentLang].loginTab }}
                  </a>
                </p>

              </form>

              <!-- ========================================== -->
              <!-- 3. OTP VERIFICATION FORM                   -->
              <!-- ========================================== -->
              <form *ngIf="currentMode === 'otp'" [formGroup]="otpForm" (ngSubmit)="onOtpSubmit()" class="space-y-6 text-center animate-fade-in py-4">
                
                <div class="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>

                <div>
                  <h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {{ currentLang === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Verify Email' }}
                  </h3>
                  <p class="text-slate-600 dark:text-slate-300 text-sm mt-1.5">
                    {{ currentLang === 'ar' ? 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني.' : 'Enter the 6-digit confirmation code sent to your email.' }}
                  </p>
                  <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1 dir-ltr text-center">
                    {{ pendingEmail }}
                  </p>
                </div>

                <div>
                  <input type="text" formControlName="otp" placeholder="••••••" maxlength="6" 
                         class="w-full px-4 py-4 text-center text-3xl tracking-[0.4em] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-black dir-ltr text-slate-900 dark:text-white transition">
                </div>

                <button type="submit" [disabled]="otpForm.invalid || isLoggingIn" 
                        class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                  <svg *ngIf="isLoggingIn" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>{{ currentLang === 'ar' ? 'تأكيد الحساب والمتابعة' : 'Verify and Proceed' }}</span>
                </button>

                <div>
                  <a (click)="switchMode('login')" class="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 cursor-pointer">
                    ← {{ currentLang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to login' }}
                  </a>
                </div>

              </form>

              <!-- ========================================== -->
              <!-- 4. FORGOT PASSWORD FORM                    -->
              <!-- ========================================== -->
              <form *ngIf="currentMode === 'forgot'" [formGroup]="forgotForm" (ngSubmit)="onForgotSubmit()" class="space-y-5 animate-fade-in py-4">
                
                <div class="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                  </svg>
                </div>

                <div class="text-center">
                  <h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {{ content[currentLang].forgotTitle }}
                  </h3>
                  <p class="text-slate-600 dark:text-slate-300 text-sm mt-1.5">
                    {{ content[currentLang].forgotDesc }}
                  </p>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {{ content[currentLang].emailLabel }}
                  </label>
                  <input type="email" formControlName="email" [placeholder]="content[currentLang].emailPlaceholder" 
                         class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left transition text-sm text-slate-900 dark:text-white"
                         [ngClass]="{'border-rose-400 ring-1 ring-rose-400': forgotForm.get('email')?.invalid && forgotForm.get('email')?.touched}">
                  <p *ngIf="forgotForm.get('email')?.invalid && forgotForm.get('email')?.touched" class="text-rose-500 text-xs font-bold mt-1.5">
                    {{ content[currentLang].invalidEmail }}
                  </p>
                </div>

                <button type="submit" [disabled]="forgotForm.invalid || isSendingLink" 
                        class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                  <svg *ngIf="isSendingLink" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>{{ content[currentLang].sendLinkBtn }}</span>
                </button>

                <div class="text-center pt-2">
                  <a (click)="switchMode('login')" class="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 cursor-pointer transition">
                    ← {{ currentLang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to login' }}
                  </a>
                </div>

              </form>

            </div>

          </div>

        </div>

      </main>

      <!-- ========================================== -->
      <!-- WHATSAPP DIRECT SUPPORT BUTTON (Req 3a)    -->
      <!-- ========================================== -->
      <a href="https://wa.me/201020653195" target="_blank" 
         class="fixed bottom-6 rtl:left-6 ltr:right-6 z-[60] bg-[#25D366] hover:bg-[#20bd5a] text-white w-14 h-14 rounded-full shadow-2xl hover:scale-110 hover:shadow-green-500/50 transition-all flex items-center justify-center group" 
         [title]="currentLang === 'ar' ? 'الدعم الفني' : 'Support'">
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
        <span class="absolute rtl:left-16 ltr:right-16 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
          {{ currentLang === 'ar' ? 'الدعم الفني' : 'Support' }}
        </span>
      </a>

      <!-- ========================================== -->
      <!-- BOTTOM FOOTER NOTE                         -->
      <!-- ========================================== -->
      <footer class="w-full py-4 text-center text-xs text-slate-600 dark:text-slate-300 relative z-20">
        © 2026 {{ currentLang === 'ar' ? 'منصة قِمَّـة التعليمية (Qimma). جميع الحقوق محفوظة.' : 'Qimma E-Learning Platform. All Rights Reserved.' }}
      </footer>

    </div>
  `
})
export class LoginComponent implements OnInit {
  currentMode: 'login' | 'signup' | 'forgot' | 'otp' = 'login'; 
  currentLang: 'ar' | 'en' = 'ar';
  currentYear = new Date().getFullYear();

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
      langSwitch: 'English', 
      leftTitle: 'أطلق العنان لقدراتك مع قِمَّـة', 
      leftDesc: 'انضم لآلاف الطلاب والمعلمين في منصة حديثة مصممة لجعل التعلم ممتعاً، متاحاً، ومبنياً على التميز الأكاديمي.',
      feat1: 'كورسات يقودها نخبة من كبار الخبراء', 
      feat2: 'تتبع شخصي دقيق لمستوى تقدمك ونقاط XP', 
      feat3: 'بيئة تعليمية تفاعلية واختبارات ذكية',
      loginTab: 'تسجيل الدخول', 
      signupTab: 'إنشاء حساب جديد', 
      loginTitle: 'مرحباً بعودتك إلى قِمَّـة', 
      loginDesc: 'أدخل بياناتك للوصول إلى لوحة التحكم ومتابعة دروسك',
      emailLabel: 'البريد الإلكتروني', 
      emailPlaceholder: 'name@example.com', 
      invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح',
      passwordLabel: 'كلمة المرور', 
      passwordPlaceholder: '••••••••',
      rememberMe: 'تذكرني على هذا الجهاز', 
      forgotPassLink: 'نسيت كلمة المرور؟', 
      loginBtn: 'تسجيل الدخول',
      signupTitle: 'انضم إلى عائلة قِمَّـة', 
      signupDesc: 'ابدأ رحلتك التعليمية المجانية اليوم', 
      nameLabel: 'الاسم بالكامل', 
      namePlaceholder: 'مثال: كريم محمد',
      accountTypeLabel: 'نوع الحساب', 
      studentOpt: 'طالب', 
      teacherOpt: 'معلم', 
      adminOpt: 'مشرف', 
      signupBtn: 'إنشاء حساب جديد',
      adminKeyPlaceholder: 'أدخل مفتاح المشرف السري',
      noAccount: 'ليس لديك حساب حتى الآن؟', 
      haveAccount: 'لديك حساب بالفعل؟', 
      forgotTitle: 'استعادة كلمة المرور', 
      forgotDesc: 'أدخل بريدك وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور.', 
      sendLinkBtn: 'إرسال رابط الاستعادة'
    },
    en: {
      langSwitch: 'العربية', 
      leftTitle: 'Unlock Your Learning Peak with Qimma', 
      leftDesc: 'Join thousands of students and educators on a modern platform designed to make learning engaging, accessible, and high-performing.',
      feat1: 'Courses led by distinguished expert teachers', 
      feat2: 'Personalized XP progress tracking and milestones', 
      feat3: 'Interactive tests and vibrant learning community',
      loginTab: 'Log In', 
      signupTab: 'Create Account', 
      loginTitle: 'Welcome Back to Qimma', 
      loginDesc: 'Enter your credentials to access your dashboard and resume learning',
      emailLabel: 'Email Address', 
      emailPlaceholder: 'name@example.com', 
      invalidEmail: 'Please enter a valid email address.',
      passwordLabel: 'Password', 
      passwordPlaceholder: '••••••••',
      rememberMe: 'Remember me on this device', 
      forgotPassLink: 'Forgot password?', 
      loginBtn: 'Log In to Account',
      signupTitle: 'Join the Qimma Community', 
      signupDesc: 'Start your smart learning journey today', 
      nameLabel: 'Full Name', 
      namePlaceholder: 'e.g. Kareem Mohamed',
      accountTypeLabel: 'Account Type', 
      studentOpt: 'Student', 
      teacherOpt: 'Teacher', 
      adminOpt: 'Admin', 
      signupBtn: 'Create Free Account',
      adminKeyPlaceholder: 'Enter Admin Secret Key',
      noAccount: "Don't have an account yet?", 
      haveAccount: 'Already have an account?', 
      forgotTitle: 'Reset Password', 
      forgotDesc: 'Enter your email to receive a secure link to reset your password.', 
      sendLinkBtn: 'Send Reset Link'
    }
  };

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private router: Router, 
    private route: ActivatedRoute,
    public langService: LanguageService,
    public themeService: ThemeService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });

    this.signupForm = this.fb.group({
      username: ['', Validators.required], 
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      role: [0, Validators.required]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  get isDark(): boolean {
    return this.themeService.isDark;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  ngOnInit() {
    this.langService.currentLang$.subscribe(l => this.currentLang = l);

    // 1. Kick authenticated users back to their dashboard so they can't access login page.
    const token = localStorage.getItem('token');
    if (token) {
       const role = localStorage.getItem('userRole');
       if (role === 'Teacher' || role === '1' || role === 'Instructor') {
          this.router.navigate(['/teacher-dashboard'], { replaceUrl: true });
       } else if (role === '2' || role === 'Admin') {
          this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
       } else {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
       }
       return;
    }

    // 2. Track URL Parameters for Tab / Mode sync
    this.route.queryParams.subscribe(params => {
      if (params['reset'] === 'success') {
        this.showToast(this.currentLang === 'ar' ? 'تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.' : 'Password reset successfully! You can now log in.', 'success');
      }
      const mode = params['mode'] || params['tab'];
      if (mode === 'signup' || mode === 'register') {
        this.currentMode = 'signup';
      } else if (mode === 'forgot' || mode === 'otp') {
        this.currentMode = mode;
      } else {
        this.currentMode = 'login';
      }
    });

    this.signupForm.get('role')?.valueChanges.subscribe(() => {
      this.signupForm.patchValue({
        username: '',
        email: '',
        password: ''
      }, { emitEvent: false });
      
      this.signupForm.markAsUntouched();
      this.signupForm.markAsPristine();
      this.reqLength = false;
      this.reqCase = false;
      this.reqNumber = false;
      this.reqSpecial = false;
    });
  }

  switchMode(mode: 'login' | 'signup' | 'forgot' | 'otp') {
    this.currentMode = mode;
    this.router.navigate([], { queryParams: { tab: mode } });
  }

  toggleLanguage() {
    this.langService.toggleLanguage();
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
            this.showToast(this.currentLang === 'ar' ? 'تم إرسال كود التأكيد لبريدك الإلكتروني' : 'OTP sent to your email', 'success');
          }
        },
        error: (err) => {
          this.isSigningUp = false;
          let errorMsg = err.error?.message || err.message || '';

          if (errorMsg.includes('Admin Secret Key')) {
             errorMsg = this.currentLang === 'ar' ? 'مفتاح المشرف السري غير صحيح.' : 'Invalid Admin Secret Key.';
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
          this.handleSuccessfulLogin(response, this.currentLang === 'ar' ? 'تم تأكيد الحساب وتسجيل الدخول بنجاح' : 'Account verified and logged in');
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
      const payload = { ...this.loginForm.value, isAdminPortal: false };
      this.http.post(`${this.apiUrl}/login`, payload).subscribe({
        next: (response: any) => {
          this.handleSuccessfulLogin(response, this.currentLang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
        },
        error: (err) => {
          this.isLoggingIn = false;
          if (err.error?.message === 'EMAIL_NOT_CONFIRMED') {
            this.pendingEmail = this.loginForm.value.email;
            this.switchMode('otp');
            this.showToast(this.currentLang === 'ar' ? 'برجاء تأكيد بريدك. تم إرسال كود جديد' : 'Please verify email. New OTP sent', 'warning');
          } else if (err.error?.message === 'PORTAL_PUBLIC_ONLY') {
            this.showToast(this.currentLang === 'ar' ? 'هذا الحساب مخصص للإدارة. يرجى تسجيل الدخول من بوابة الإدارة الخاصة.' : 'This account is an Administrator. Please log in via the Admin Portal.', 'error');
          } else {
            this.showToast(this.currentLang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password', 'error');
          }
        }
      });
    }
  }

  handleSuccessfulLogin(response: any, successMessage: string) {
    const token = response.token || response.Token;
    if (token) {
      let userRole = '';
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        userRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || decoded.Role || String(response.role || response.Role || '0');
      } catch(e) {
        userRole = String(response.role || response.Role || '0');
      }

      const roleCheck = String(userRole).toLowerCase();
      if (roleCheck === '2' || roleCheck === 'admin') {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        this.isLoggingIn = false;
        this.showToast(this.currentLang === 'ar' ? 'هذا الحساب مخصص للإدارة. يرجى تسجيل الدخول من بوابة الإدارة الخاصة.' : 'This account is an Administrator. Please log in via the Admin Portal.', 'error');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('userRole', userRole);
      this.showToast(successMessage, 'success');
      
      setTimeout(() => {
        this.isLoggingIn = false;
        if (roleCheck === '1' || roleCheck === 'teacher' || roleCheck === 'instructor') {
          this.router.navigate(['/teacher-dashboard'], { replaceUrl: true });
        } else {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        }
      }, 1200); 
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
          this.showToast(this.currentLang === 'ar' ? 'تم إرسال الرابط لبريدك الإلكتروني بنجاح' : 'Reset link sent to your email', 'success');
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