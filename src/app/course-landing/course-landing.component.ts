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
      <div *ngIf="message" 
           [ngClass]="{
             'bg-emerald-600 border border-emerald-400/30 shadow-emerald-600/30': messageType === 'success', 
             'bg-rose-600 border border-rose-400/30 shadow-rose-600/30': messageType === 'error', 
             'bg-amber-500 border border-amber-300/40 shadow-amber-500/40': messageType === 'warning'
           }" 
           class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl text-white font-extrabold transition-all flex items-center gap-3 text-sm">
        <span *ngIf="messageType === 'warning'" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>
        <svg *ngIf="messageType === 'success'" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <svg *ngIf="messageType === 'error'" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
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
                    <span class="text-3xl font-black text-slate-900 dark:text-white">
                      {{ (course.price - (course.price * course.discountPercentage / 100)) }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}
                    </span>
                    <span class="text-xs font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded mt-1">
                      ⚠️ {{ lang === 'ar' ? ('خصم ' + course.discountPercentage + '%') : (course.discountPercentage + '% OFF') }}
                    </span>
                  </div>
                </ng-container>
                <ng-template #noDiscount>
                  <span class="text-3xl font-black text-slate-900 dark:text-white block mb-2">{{ course.price }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}</span>
                </ng-template>
              </div>
            </div>

            <!-- Buy Now / Enroll Button styled identically to "+ New Course" button -->
            <button (click)="handleEnrollment()" [disabled]="isEnrolling" 
                    class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-lg transition shadow-md shadow-indigo-600/20 disabled:opacity-70 flex justify-center items-center gap-2">
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

      <!-- ======================================================== -->
      <!-- PAYMENT METHODS MODAL (InstaPay, Vodafone Cash, Paymob) -->
      <!-- ======================================================== -->
      <div *ngIf="showPaymentModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in" (click)="closePaymentModal()">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-scale-in" (click)="$event.stopPropagation()">
          
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 class="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <span>{{ lang === 'ar' ? 'اختر وسيلة الدفع المناسبة' : 'Choose Payment Method' }}</span>
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                <bdi class="font-bold text-slate-700 dark:text-slate-300">{{ course?.title }}</bdi>
                <span class="text-slate-400">•</span>
                <span class="font-extrabold text-indigo-600 dark:text-indigo-400" dir="ltr">
                  {{ getEffectivePrice() }} {{ lang === 'ar' ? 'ج.م' : 'EGP' }}
                </span>
              </p>
            </div>
            <button (click)="closePaymentModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold transition">✕</button>
          </div>

          <!-- Method Selector Tabs -->
          <div class="grid grid-cols-3 gap-2 my-5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button (click)="selectedPaymentMethod = 'instapay'"
                    [ngClass]="selectedPaymentMethod === 'instapay' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-semibold'"
                    class="py-2.5 px-2 rounded-xl text-xs transition flex flex-col sm:flex-row items-center justify-center gap-1.5">
              <svg class="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span>{{ lang === 'ar' ? 'إنستاباي' : 'InstaPay' }}</span>
            </button>
            <button (click)="selectedPaymentMethod = 'vodafone'"
                    [ngClass]="selectedPaymentMethod === 'vodafone' ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-semibold'"
                    class="py-2.5 px-2 rounded-xl text-xs transition flex flex-col sm:flex-row items-center justify-center gap-1.5">
              <svg class="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
              <span>{{ lang === 'ar' ? 'فودافون كاش' : 'Vodafone' }}</span>
            </button>
            <button (click)="selectedPaymentMethod = 'paymob'"
                    [ngClass]="selectedPaymentMethod === 'paymob' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-semibold'"
                    class="py-2.5 px-2 rounded-xl text-xs transition flex flex-col sm:flex-row items-center justify-center gap-1.5">
              <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <span>Paymob</span>
            </button>
          </div>

          <!-- Content: InstaPay -->
          <div *ngIf="selectedPaymentMethod === 'instapay'" class="space-y-4 animate-fade-in">
            <div class="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-900/50">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block mb-1">
                    {{ lang === 'ar' ? 'رقم التحويل عبر إنستاباي' : 'InstaPay Transfer Number' }}
                  </span>
                  <p class="text-2xl font-black font-mono text-purple-900 dark:text-purple-200 tracking-wider dir-ltr select-all">01212196331</p>
                </div>
                <button (click)="copyToClipboard('01212196331')" 
                        class="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>{{ copiedNumber ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ' : 'Copy') }}</span>
                </button>
              </div>
            </div>

            <!-- Instructions -->
            <div class="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <p class="font-bold text-slate-800 dark:text-slate-200">{{ lang === 'ar' ? 'تعليمات تفعيل الكورس:' : 'Activation Instructions:' }}</p>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <p>{{ lang === 'ar' ? 'قم بالتحويل أولاً عبر تطبيق إنستاباي إلى الرقم أعلاه (01212196331) بالمبلغ المطلوب (' + getEffectivePrice() + ' ج.م).' : 'Transfer ' + getEffectivePrice() + ' EGP via InstaPay to the number above (01212196331).' }}</p>
              </div>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <p>{{ lang === 'ar' ? 'التقط سكرين شوت (لقطة شاشة) واضحة لعملية التحويل الناجحة.' : 'Take a clear screenshot of the successful transfer receipt.' }}</p>
              </div>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <p>{{ lang === 'ar' ? 'أرسل اسمك والبريد الإلكتروني المسجلين بالمنصة مع سكرين شوت التحويل إلى رقم الواتساب: 01020653195 لتفعيل حسابك فوراً.' : 'Send your name & registered email along with the receipt screenshot to WhatsApp: 01020653195 for instant activation.' }}</p>
              </div>
            </div>

            <a [href]="getWhatsAppUrl('instapay')" target="_blank" 
               class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-4">
              <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/>
              </svg>
              <span>{{ lang === 'ar' ? 'إرسال السكرين شوت عبر واتساب' : 'Send Screenshot via WhatsApp' }}</span>
            </a>
          </div>

          <!-- Content: Vodafone Cash -->
          <div *ngIf="selectedPaymentMethod === 'vodafone'" class="space-y-4 animate-fade-in">
            <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block mb-1">
                    {{ lang === 'ar' ? 'رقم التحويل عبر فودافون كاش' : 'Vodafone Cash Transfer Number' }}
                  </span>
                  <p class="text-2xl font-black font-mono text-rose-900 dark:text-rose-200 tracking-wider dir-ltr select-all">01020653195</p>
                </div>
                <button (click)="copyToClipboard('01020653195')" 
                        class="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>{{ copiedNumber ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ' : 'Copy') }}</span>
                </button>
              </div>
            </div>

            <!-- Instructions -->
            <div class="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <p class="font-bold text-slate-800 dark:text-slate-200">{{ lang === 'ar' ? 'تعليمات تفعيل الكورس:' : 'Activation Instructions:' }}</p>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <p>{{ lang === 'ar' ? 'قم بالتحويل أولاً عبر فودافون كاش إلى الرقم أعلاه (01020653195) بالمبلغ المطلوب (' + getEffectivePrice() + ' ج.م).' : 'Transfer ' + getEffectivePrice() + ' EGP via Vodafone Cash to the number above (01020653195).' }}</p>
              </div>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <p>{{ lang === 'ar' ? 'التقط سكرين شوت (لقطة شاشة) واضحة لرسالة أو إشعار التحويل الناجح.' : 'Take a clear screenshot of the transfer message or confirmation.' }}</p>
              </div>
              <div class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span class="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <p>{{ lang === 'ar' ? 'أرسل اسمك والبريد الإلكتروني المسجلين بالمنصة مع سكرين شوت التحويل إلى رقم الواتساب: 01020653195 لتفعيل حسابك فوراً.' : 'Send your name & registered email along with the receipt screenshot to WhatsApp: 01020653195 for instant activation.' }}</p>
              </div>
            </div>

            <a [href]="getWhatsAppUrl('vodafone')" target="_blank" 
               class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-4">
              <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/>
              </svg>
              <span>{{ lang === 'ar' ? 'إرسال السكرين شوت عبر واتساب' : 'Send Screenshot via WhatsApp' }}</span>
            </a>
          </div>

          <!-- Content: Paymob -->
          <div *ngIf="selectedPaymentMethod === 'paymob'" class="space-y-4 animate-fade-in">
            <div class="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/50 text-center">
              <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-600/30">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <h4 class="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
                {{ lang === 'ar' ? 'الدفع الإلكتروني الفوري' : 'Instant Online Payment' }}
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {{ lang === 'ar' ? 'ادفع بأمان بواسطة الفيزا أو الماستركارد أو كروت ميزة أو المحافظ الإلكترونية. سيتم فتح الكورس تلقائياً وفوراً في حسابك فور إتمام العملية.' : 'Pay securely via Credit Card, Debit Card, Meeza, or Mobile Wallets. Instant automatic enrollment upon completion.' }}
              </p>
            </div>

            <!-- Prominent Redirect Notice inside the modal -->
            <div *ngIf="isEnrolling" class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2.5 animate-pulse shadow-sm">
              <span class="w-4 h-4 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin shrink-0"></span>
              <span>{{ t[lang].warningPay }}</span>
            </div>

            <button (click)="payWithPaymob()" [disabled]="isEnrolling" 
                    class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50">
              <span *ngIf="isEnrolling" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isEnrolling ? (lang === 'ar' ? 'جاري التحويل لبوابة Paymob...' : 'Redirecting to Paymob...') : (lang === 'ar' ? 'المتابعة للدفع عبر Paymob (' + getEffectivePrice() + ' ج.م)' : 'Proceed to Paymob (' + getEffectivePrice() + ' EGP)') }}</span>
            </button>
          </div>

        </div>
      </div>

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

  showPaymentModal = false;
  selectedPaymentMethod: 'instapay' | 'vodafone' | 'paymob' = 'instapay';
  copiedNumber = false;
  userName = '';
  userEmail = '';

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
          if (myCourses) {
            try {
              localStorage.setItem('enrolled_course_ids', JSON.stringify(myCourses.map((c: any) => c.id)));
            } catch {}
          }
          if (myCourses && myCourses.some(mc => mc.id === this.courseId)) {
            // Already enrolled - skip landing/subscription flow
            this.router.navigate(['/learn', this.courseId], { replaceUrl: true });
            return;
          }
        },
        error: () => {}
      });

      // Fetch user profile for WhatsApp receipt message
      this.http.get<any>('https://qimma.runasp.net/api/user/profile', { headers }).subscribe({
        next: (profile) => {
          if (profile) {
            this.userName = profile.username || profile.name || '';
            this.userEmail = profile.email || '';
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

  getEffectivePrice(): number {
    if (!this.course) return 0;
    if (this.course.isFree) return 0;
    if (this.course.discountPercentage > 0) {
      return Math.round(this.course.price - (this.course.price * this.course.discountPercentage / 100));
    }
    return this.course.price || 0;
  }

  handleEnrollment() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.course.isFree) {
      this.isEnrolling = true;
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.post(`https://qimma.runasp.net/api/course/enroll/${this.courseId}`, {}, { headers }).subscribe({
        next: () => {
          this.showMessage(this.t[this.lang].successMsg, 'success');
          try {
            const cached = JSON.parse(localStorage.getItem('enrolled_course_ids') || '[]');
            if (!cached.includes(this.courseId)) {
              cached.push(this.courseId);
              localStorage.setItem('enrolled_course_ids', JSON.stringify(cached));
            }
          } catch {}
          setTimeout(() => this.router.navigate(['/dashboard'], { replaceUrl: true }), 1500);
        },
        error: () => {
          this.isEnrolling = false;
          this.showMessage(this.t[this.lang].errorMsg, 'error');
        }
      });
    } else {
      this.showPaymentModal = true;
    }
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.copiedNumber = false;
  }

  copyToClipboard(num: string) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(num);
      this.copiedNumber = true;
      setTimeout(() => this.copiedNumber = false, 2500);
    }
  }

  getWhatsAppUrl(method: 'instapay' | 'vodafone'): string {
    const methodText = method === 'instapay' ? (this.lang === 'ar' ? 'إنستاباي' : 'InstaPay') : (this.lang === 'ar' ? 'فودافون كاش' : 'Vodafone Cash');
    const courseTitle = this.course?.title || '';
    const name = this.userName || '';
    const email = this.userEmail || '';
    const text = this.lang === 'ar'
      ? `مرحباً، قمت بتحويل رسوم الاشتراك لكورس "${courseTitle}" عبر ${methodText}.%0Aالاسم: ${name}%0Aالبريد الإلكتروني: ${email}%0A(مرفق سكرين شوت التحويل)`
      : `Hello, I transferred the enrollment fee for course "${courseTitle}" via ${methodText}.%0AName: ${name}%0AEmail: ${email}%0A(Transfer screenshot attached)`;
    return `https://wa.me/201020653195?text=${text}`;
  }

  payWithPaymob() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
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