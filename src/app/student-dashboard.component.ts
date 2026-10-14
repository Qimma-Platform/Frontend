import { Component, OnInit, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CourseService } from './services/course.service';
import { LanguageService } from './services/language.service';
import { SignalrService } from './services/signalr.service';
import { AssignmentService } from './services/assignment.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="bg-[#F4F7FE] text-slate-800 min-h-screen flex w-full relative" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      <div *ngIf="message" [ngClass]="{'bg-emerald-600 shadow-emerald-500/30': messageType === 'success', 'bg-rose-600 shadow-rose-500/30': messageType === 'error'}" class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl text-white font-bold transition-all duration-300 flex items-center gap-3 animate-fade-in pointer-events-auto border border-white/20">
        <span *ngIf="messageType === 'success'" class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
        <span *ngIf="messageType === 'error'" class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">⚠️</span>
        <span class="text-sm font-bold tracking-wide">{{ message }}</span>
      </div>

      <!-- Settings & Crop Modals -->
      <div *ngIf="showCropModal" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4 animate-fade-in">
        <div class="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col items-center">
          <h3 class="text-xl font-bold text-slate-900 mb-6">{{ lang === 'ar' ? 'تعديل الصورة' : 'Crop Image' }}</h3>
          <div class="relative overflow-hidden bg-slate-100 rounded-2xl cursor-move touch-none border-2 border-slate-200"
               [style.width.px]="300" [style.height.px]="300"
               (mousedown)="startDrag($event)" (mousemove)="onDrag($event)"
               (touchstart)="startDrag($event)" (touchmove)="onDrag($event)">
             <img [src]="cropImageSrc" class="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
                  [style.transform]="'translate(calc(-50% + ' + panX + 'px), calc(-50% + ' + panY + 'px)) scale(' + zoom + ')'"
                  [style.width.px]="baseImageW" [style.height.px]="baseImageH">
          </div>
          <div class="w-full mt-6 px-4">
            <label class="block text-sm font-bold text-slate-700 mb-2">{{ lang === 'ar' ? 'تكبير / تصغير' : 'Zoom' }}</label>
            <input type="range" min="1" max="3" step="0.05" [(ngModel)]="zoom" class="w-full accent-indigo-600">
          </div>
          <div class="flex gap-3 mt-8 w-full">
            <button (click)="showCropModal = false; isUploadingImage = false" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">{{ t[lang].cancel }}</button>
            <button (click)="applyCrop()" [disabled]="isUploadingImage" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50">
              {{ isUploadingImage ? t[lang].saving : (lang === 'ar' ? 'تطبيق' : 'Apply') }}
            </button>
          </div>
        </div>
      </div>

      <!-- UNSAVED CHANGES WARNING MODAL (Overlay above settings, Red warning style) -->
      <div *ngIf="showUnsavedModal" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-fade-in">
        <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in border border-rose-100">
          <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg class="w-8 h-8 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h3 class="text-xl font-extrabold text-slate-900 text-center mb-2">{{ t[lang].unsavedTitle }}</h3>
          <p class="text-sm text-slate-500 text-center mb-8 leading-relaxed">{{ t[lang].unsavedDesc }}</p>
          <div class="flex gap-3">
            <button (click)="cancelDiscard()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">{{ t[lang].stayBtn }}</button>
            <button (click)="confirmDiscard()" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md">{{ t[lang].discardBtn }}</button>
          </div>
        </div>
      </div>

      <!-- ACCOUNT SETTINGS MODAL (Matching Add New Schedule Event style) -->
      <div *ngIf="showSettingsModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900">{{ t[lang].accountSettings }}</h3>
              <p class="text-slate-500 text-xs mt-0.5">{{ lang === 'ar' ? 'تعديل بيانات الحساب والملف الشخصي' : 'Update your profile information and account details' }}</p>
            </div>
            <button (click)="closeSettings()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition">✕</button>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div class="relative group shrink-0">
                <img [src]="editProfileData.profileImage ? 'http://localhost:5162' + editProfileData.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + editProfileData.fullName)" class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm">
                <label class="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[11px] font-bold">
                  {{ t[lang].change }}
                  <input type="file" (change)="onAvatarSelected($event)" accept="image/*" class="hidden">
                </label>
              </div>
              <div class="min-w-0">
                <h4 class="font-bold text-sm text-slate-900 truncate">{{ editProfileData.fullName || 'Student' }}</h4>
                <p class="text-xs text-slate-500 truncate">{{ editProfileData.email }}</p>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg mt-1 inline-block">{{ t[lang].studentRole }}</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].fullName }} <span class="text-rose-500">*</span></label>
              <input type="text" [(ngModel)]="editProfileData.fullName" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].email }}</label>
              <input type="email" [(ngModel)]="editProfileData.email" disabled class="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm font-medium">
              <p class="text-[11px] text-slate-400 mt-1">{{ t[lang].emailCantChange }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].phone }}</label>
              <div class="flex gap-2">
                <select [(ngModel)]="editProfileData.countryCode" class="w-28 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium dir-ltr text-left outline-none">
                  <option *ngFor="let country of countries; trackBy: trackById" [value]="country.code">
                    {{ country.flag }} {{ country.code }}
                  </option>
                </select>
                <input type="text" [(ngModel)]="editProfileData.phone" class="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium dir-ltr text-left outline-none">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].bio }}</label>
              <textarea [(ngModel)]="editProfileData.bio" rows="3" [placeholder]="t[lang].bioPlaceholder" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none"></textarea>
            </div>

            <div class="flex gap-3 pt-3 border-t border-slate-100">
              <button (click)="closeSettings()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition">{{ t[lang].cancel }}</button>
              <button (click)="saveProfile()" [disabled]="isSaving" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                <span>{{ isSaving ? t[lang].saving : t[lang].saveBtn }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <aside [ngClass]="isSidebarCollapsed ? 'w-20' : 'w-64'" class="bg-[#130E35] text-white flex flex-col fixed h-screen z-40 hidden lg:flex transition-all duration-300">
        <div class="p-5 flex items-center justify-between border-b border-white/10">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-xl shrink-0">F</div>
            <span *ngIf="!isSidebarCollapsed" class="font-bold text-lg tracking-wide truncate">{{ t[lang].brand }}</span>
          </div>
          <button (click)="toggleSidebar()" class="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition" [title]="isSidebarCollapsed ? (lang === 'ar' ? 'توسيع القائمة' : 'Expand Sidebar') : (lang === 'ar' ? 'طي القائمة' : 'Collapse Sidebar')">
            <svg class="w-5 h-5 transition-transform" [ngClass]="{'rotate-180': isSidebarCollapsed}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path *ngIf="lang === 'en'" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              <path *ngIf="lang === 'ar'" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <nav class="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <div *ngIf="!isSidebarCollapsed" class="text-xs uppercase tracking-wider text-white/40 px-3 mb-2">{{ t[lang].main }}</div>
          <a (click)="switchTab('dashboard')" [title]="t[lang].dashboard" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'dashboard', 'text-white/70 hover:bg-white/5': activeTab !== 'dashboard', 'justify-center px-2': isSidebarCollapsed}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="2"></rect><rect x="14" y="3" width="7" height="7" rx="2"></rect><rect x="14" y="14" width="7" height="7" rx="2"></rect><rect x="3" y="14" width="7" height="7" rx="2"></rect></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].dashboard }}</span>
          </a>
          <a (click)="switchTab('browse')" [title]="t[lang].browseCourses" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'browse', 'text-white/70 hover:bg-white/5': activeTab !== 'browse', 'justify-center px-2': isSidebarCollapsed}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].browseCourses }}</span>
          </a>
          <a (click)="switchTab('schedule')" [title]="t[lang].schedule" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'schedule', 'text-white/70 hover:bg-white/5': activeTab !== 'schedule', 'justify-center px-2': isSidebarCollapsed}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].schedule }}</span>
          </a>
          <a (click)="switchTab('assignments')" [title]="t[lang].assignments" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'assignments', 'text-white/70 hover:bg-white/5': activeTab !== 'assignments', 'justify-center px-2': isSidebarCollapsed}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14l2 2 4-4"></path></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].assignments }}</span>
          </a>
          <a (click)="switchTab('support')" [title]="t[lang].support" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'support', 'text-white/70 hover:bg-white/5': activeTab !== 'support', 'justify-center px-2': isSidebarCollapsed}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].support }}</span>
          </a>
          
          <div *ngIf="!isSidebarCollapsed" class="text-xs uppercase tracking-wider text-white/40 px-3 mt-6 mb-2">{{ t[lang].account }}</div>
          <a (click)="openSettings()" [title]="t[lang].accountSettings" [ngClass]="isSidebarCollapsed ? 'justify-center px-2' : ''" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].accountSettings }}</span>
          </a>
          <button (click)="logout()" [title]="t[lang].logout" [ngClass]="isSidebarCollapsed ? 'justify-center px-2' : ''" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-300 hover:bg-rose-500/10 font-medium text-sm transition w-full text-start cursor-pointer">
            <svg class="w-5 h-5 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].logout }}</span>
          </button>
        </nav>
        <div class="p-4 border-t border-white/10">
          <div class="flex items-center gap-3 p-2 rounded-xl bg-white/5" [ngClass]="isSidebarCollapsed ? 'justify-center p-1' : ''">
            <img [src]="userData?.profileImage ? 'http://localhost:5162' + userData.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + (userData?.username || 'Student'))" alt="Avatar" class="w-9 h-9 rounded-full bg-white/10 object-cover shrink-0" />
            <div *ngIf="!isSidebarCollapsed" class="min-w-0">
              <p class="text-sm font-semibold truncate">{{ userData?.username || 'Student' }}</p>
              <p class="text-xs text-indigo-300 truncate">{{ t[lang].studentRole }}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div [ngClass]="isSidebarCollapsed ? 'ltr:lg:ml-20 rtl:lg:mr-20' : 'ltr:lg:ml-64 rtl:lg:mr-64'" class="flex-1 min-h-screen flex flex-col transition-all duration-300">
        <header class="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between gap-4">
          <div class="flex items-center flex-1 gap-4">
            <button (click)="toggleSidebar()" class="hidden lg:flex p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition shrink-0" [title]="isSidebarCollapsed ? (lang === 'ar' ? 'توسيع القائمة' : 'Expand Sidebar') : (lang === 'ar' ? 'طي القائمة' : 'Collapse Sidebar')">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
            <h2 class="text-lg font-bold text-slate-800 lg:hidden">{{ t[lang].brand }}</h2>
            <div class="relative hidden sm:block w-full max-w-md">
              <span class="absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input type="text" [(ngModel)]="searchQuery" [placeholder]="t[lang].search" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all dir-ltr text-left">
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button (click)="toggleLang()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition whitespace-nowrap">
              {{ lang === 'ar' ? 'English' : 'عربي' }}
            </button>
            
            <div class="relative notification-container">
              <button (click)="toggleNotifications()" class="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition flex items-center justify-center">
                <svg class="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span *ngIf="unreadCount > 0" class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
              </button>

              <div *ngIf="showNotificationsDropdown" class="absolute rtl:left-0 ltr:right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in">
                
                <div class="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 class="font-bold text-slate-800 text-sm">{{ t[lang].notificationsTitle }}</h3>
                    <span class="text-xs text-indigo-600 font-semibold">{{ unreadCount }} {{ t[lang].unreadText }}</span>
                  </div>
                  <button *ngIf="notifications.length > 0" (click)="deleteAllNotifications()" class="text-xs font-bold text-rose-500 hover:text-rose-700 transition">
                    {{ lang === 'ar' ? 'مسح الكل' : 'Clear All' }}
                  </button>
                </div>

                <div class="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  <div *ngFor="let notif of notifications; trackBy: trackById" (click)="onNotificationClick(notif)" [ngClass]="{'bg-indigo-50/40': !notif.isRead}" class="p-4 hover:bg-slate-50 transition cursor-pointer flex items-start justify-between gap-3 group">
                    <div class="flex-1 min-w-0" dir="auto" style="unicode-bidi: plaintext; text-align: start;">
                      <p class="font-bold text-xs text-slate-900 break-words whitespace-normal" *ngIf="notif.title">{{ notif.title }}</p>
                      <p class="text-xs mt-1 break-words whitespace-normal" [ngClass]="!notif.isRead ? 'font-bold text-slate-900' : 'font-normal text-slate-600'" style="line-height: 1.4;">{{ getNotificationText(notif.message) }}</p>
                      <span class="text-[10px] text-slate-400 mt-2 block">{{ notif.createdAt | date:'short' }}</span>
                    </div>
                    <button (click)="deleteNotification(notif.id, $event)" class="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1" title="مسح">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  <div *ngIf="notifications.length === 0" class="p-8 text-center text-xs text-slate-400">
                    {{ t[lang].noNotifications }}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </header>
        <main class="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8" [ngClass]="{'!p-0': activeTab === 'teacherProfile'}">
          
          <!-- DASHBOARD TAB -->
          <ng-container *ngIf="activeTab === 'dashboard'">
            <div>
              <h1 class="text-2xl lg:text-3xl font-extrabold text-slate-900">{{ t[lang].welcome }}, {{ userData?.username || 'Student' }} 👋</h1>
              <p class="text-slate-500 mt-1">{{ t[lang].streak }}</p>
            </div>

            <!-- Top Row Metrics -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].totalXP }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35]">{{ userData?.totalXP || 0 }}</p>
                    <p class="text-[11px] text-slate-500 mt-1 font-semibold">{{ lang === 'ar' ? 'إجمالي النقاط المكتسبة' : 'Total XP earned' }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].coursesEnrolled }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35]">{{ myCourses.length }}</p>
                    <p class="text-[11px] text-slate-500 mt-1 font-semibold">{{ lang === 'ar' ? 'كورسات مسجل بها' : 'Enrolled courses' }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].completedCourses }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35]">{{ completedCoursesCount }}</p>
                    <p class="text-[11px] text-slate-500 mt-1 font-semibold">{{ lang === 'ar' ? 'شهادات ومكتملات' : 'Certificates earned' }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div class="flex items-center justify-between mb-2">
                  <h2 class="font-bold text-slate-900 text-xs">{{ t[lang].liveSessions }}</h2>
                  <span *ngIf="activeLiveSession" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 flex items-center gap-1.5">
                    <span class="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span> {{ t[lang].liveNow }}
                  </span>
                </div>
                <div class="flex items-center justify-between mt-auto">
                  <div *ngIf="activeLiveSession">
                    <p class="font-bold text-slate-900 text-xs truncate max-w-[120px]">{{ activeLiveSession.courseTitle }}</p>
                    <p class="text-[10px] text-slate-500">{{ activeLiveSession.instructorName }}</p>
                  </div>
                  <div *ngIf="!activeLiveSession && !isLoadingTopMetrics">
                    <p class="text-[11px] text-slate-400">{{ lang === 'ar' ? 'لا يوجد بث' : 'No active sessions' }}</p>
                  </div>
                  <div *ngIf="isLoadingTopMetrics" class="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                  
                  <button *ngIf="activeLiveSession" (click)="joinLiveSession()" class="px-3 py-1.5 bg-[#130E35] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    <span>{{ t[lang].joinSession }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Active Courses Section -->
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-6">
              <div class="flex items-center justify-between">
                <h2 class="font-bold text-xl text-slate-900">{{ t[lang].myActiveCourses }}</h2>
                <a (click)="switchTab('browse')" class="text-sm font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">{{ t[lang].browseMore }}</a>
              </div>

              <!-- Skeleton Loader for Courses -->
              <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div *ngFor="let i of [1,2,3]; trackBy: trackById" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col h-[280px]">
                  <div class="h-32 bg-slate-200 w-full"></div>
                  <div class="p-5 flex-1 flex flex-col gap-3">
                    <div class="h-5 bg-slate-200 rounded-md w-3/4 mb-1"></div>
                    <div class="h-4 bg-slate-200 rounded-md w-1/2 mb-4"></div>
                    <div class="h-10 bg-slate-200 rounded-xl w-full mt-auto"></div>
                  </div>
                </div>
              </div>

              <!-- Actual Course Data -->
              <div *ngIf="!isLoading && myCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div *ngFor="let course of filteredMyCourses; trackBy: trackById" (click)="openCourse(course.id)" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group cursor-pointer">
                  <div class="h-32 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                    <img *ngIf="course.coverImageUrl" [src]="getCoverImageUrl(course.coverImageUrl)" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div *ngIf="!course.coverImageUrl" class="absolute inset-0 bg-gradient-to-tr from-blue-500 to-indigo-600 opacity-90"></div>
                    <span *ngIf="!course.coverImageUrl" class="text-4xl font-bold text-white relative z-10">{{ course.title.substring(0,2) | uppercase }}</span>
                  </div>
                  <div class="p-5 flex-1 flex flex-col">
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="font-bold text-lg text-slate-900 truncate">{{ course.title }}</h3>
                      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">{{ t[lang].enrolled }}</span>
                    </div>
                    <p class="text-xs text-slate-500 mb-3 line-clamp-1 cursor-pointer hover:text-indigo-600 w-fit" (click)="viewTeacherProfile(course.instructorId || course.teacherId, $event)">
                      {{ t[lang].instructor }}: <span class="font-bold">{{ course.instructorName }}</span>
                    </p>
                    <div class="mb-4 mt-auto">
                      <div class="flex justify-between text-xs font-bold text-slate-600 mb-1">
                        <span>{{ t[lang].progress }}</span>
                        <span>{{ course.progressPercentage || 0 }}%</span>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div class="bg-indigo-600 h-2 rounded-full transition-all duration-500" [style.width.%]="course.progressPercentage || 0"></div>
                      </div>
                    </div>
                    <button class="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition shadow-sm">
                      {{ t[lang].continueLearning }}
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- EMPTY STATE: NO COURSES ENROLLED YET -->
              <div *ngIf="myCourses.length === 0 && !isLoading" class="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 animate-fade-in mt-4">
                 <span class="text-5xl block mb-4">📚</span>
                 <p class="text-slate-500 font-semibold text-lg">{{ t[lang].noCourses }}</p>
                 <button (click)="switchTab('browse')" class="mt-4 px-6 py-2 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg text-sm">
                    {{ lang === 'ar' ? 'تصفح الكورسات' : 'Browse Courses' }}
                 </button>
              </div>

            </div>
          </ng-container>

          <ng-container *ngIf="activeTab === 'browse'">
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 class="text-2xl font-extrabold text-slate-900">{{ t[lang].browseTeachers }} 👨‍🏫</h2>
                <p class="text-slate-500 text-sm mt-1">{{ t[lang].browseTeachersDesc }}</p>
              </div>
            </div>

            <div *ngIf="isLoadingTeachers" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div *ngFor="let i of [1,2,3,4]; trackBy: trackById" class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-pulse p-6 flex flex-col items-center">
                  <div class="w-32 h-32 bg-slate-200 rounded-full mb-4"></div>
                  <div class="h-5 bg-slate-200 rounded-md w-3/4 mb-2"></div>
                  <div class="h-4 bg-slate-200 rounded-md w-1/2"></div>
                </div>
            </div>

            <div *ngIf="!isLoadingTeachers" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               <div *ngFor="let teacher of filteredTeachers; trackBy: trackById" (click)="viewTeacherProfile(teacher.id, $event)" class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group p-6 flex flex-col items-center text-center">
                  <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-50 mb-4 group-hover:scale-105 transition-transform bg-slate-100 flex items-center justify-center">
                    <img *ngIf="teacher.profileImage" [src]="'http://localhost:5162' + teacher.profileImage" class="w-full h-full object-cover">
                    <span *ngIf="!teacher.profileImage" class="text-4xl font-bold text-indigo-300">{{ teacher.username.substring(0,2) | uppercase }}</span>
                  </div>
                  <h3 class="font-extrabold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{{ teacher.username }}</h3>
                  <p class="text-sm font-bold text-indigo-500 mt-1 line-clamp-1">{{ teacher.specialization || t[lang].teacherRole }}</p>
               </div>
               
               <div *ngIf="filteredTeachers.length === 0" class="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <span class="text-5xl block mb-4">🔍</span>
                  <p class="text-slate-500 font-semibold text-lg">{{ t[lang].noTeachersFound }}</p>
               </div>
            </div>
          </ng-container>

          <ng-container *ngIf="activeTab === 'schedule'">
            <!-- Calendar Top Bar -->
            <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 class="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
                  <svg class="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span>{{ t[lang].schedule }}</span>
                </h2>
                <p class="text-slate-500 text-sm mt-1">{{ lang === 'ar' ? 'مواعيد البث المباشر والاختبارات ومواعيد التسليم لكورساتك.' : 'Upcoming live sessions, deadlines, and discussions for your courses.' }}</p>
              </div>

              <!-- Search inside calendar -->
              <div class="relative w-full md:w-72">
                <span class="absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <input type="text" [(ngModel)]="calendarSearch" [placeholder]="lang === 'ar' ? 'بحث في المواعيد...' : 'Search bookings & events...'" class="w-full bg-white border border-slate-200 rounded-xl px-10 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
              </div>
            </div>

            <!-- Calendar Container Card -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm space-y-6">
              
              <!-- Month Navigation & View Switcher Row (Mockup Style) -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div class="flex items-center gap-1.5">
                  <button (click)="prevCalendar()" class="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold transition shadow-sm">
                    <span class="rtl:rotate-180">‹</span>
                  </button>
                  <button (click)="goToToday()" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition">
                    {{ lang === 'ar' ? 'اليوم' : 'Today' }}
                  </button>
                  <button (click)="nextCalendar()" class="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold transition shadow-sm">
                    <span class="rtl:rotate-180">›</span>
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <div class="p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200">
                    <button (click)="calendarView = 'week'"
                            [ngClass]="calendarView === 'week' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-500 font-bold hover:text-slate-950'"
                            class="px-4 py-1.5 rounded-lg text-xs transition">
                      {{ lang === 'ar' ? 'أسبوعي' : 'Week' }}
                    </button>
                    <button (click)="calendarView = 'month'"
                            [ngClass]="calendarView === 'month' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-500 font-bold hover:text-slate-950'"
                            class="px-4 py-1.5 rounded-lg text-xs transition">
                      {{ lang === 'ar' ? 'شهري' : 'Month' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Day Cards Horizontal Pills Row (Mockup Style) -->
              <div class="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                <div class="w-12 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>

                <div *ngFor="let day of weekDays; trackBy: trackById"
                     (click)="selectCalendarDay(day.date)"
                     [ngClass]="day.isSelected ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 ring-offset-2' : (day.isToday ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-900 shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50')"
                     class="flex-1 min-w-[70px] h-14 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none shrink-0 relative">
                  <span class="text-[11px] font-semibold" [ngClass]="day.isSelected ? 'text-indigo-100' : (day.isToday ? 'text-indigo-600 font-bold' : 'text-slate-400')">{{ day.dayName }}</span>
                  <span class="text-base font-black mt-0.5 leading-none" [ngClass]="day.isSelected ? 'text-white' : (day.isToday ? 'text-indigo-700' : 'text-slate-800')">{{ day.dayNumber }}</span>
                  <div *ngIf="day.hasEvents" class="w-1.5 h-1.5 rounded-full absolute bottom-1.5" [ngClass]="day.isSelected ? 'bg-emerald-400' : 'bg-indigo-600'"></div>
                </div>
              </div>

              <!-- Main Calendar Board -->
              <div *ngIf="isLoading" class="py-12 animate-pulse space-y-4">
                <div *ngFor="let i of [1,2,3]; trackBy: trackById" class="h-20 bg-slate-100 rounded-2xl"></div>
              </div>

              <div *ngIf="!isLoading">
                <!-- WEEK VIEW: Pastel Event Cards matching mockup -->
                <div *ngIf="calendarView === 'week'" class="space-y-4 pt-2">
                  <div class="flex items-center justify-between">
                    <h3 class="font-extrabold text-sm text-slate-700">
                      {{ selectedDate | date:'EEEE, d MMMM y' }}
                    </h3>
                    <span class="text-xs font-bold text-slate-400">
                      {{ filteredCalendarEvents.length }} {{ lang === 'ar' ? 'مواعيد' : 'events' }}
                    </span>
                  </div>

                  <div *ngIf="filteredCalendarEvents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div *ngFor="let ev of filteredCalendarEvents; trackBy: trackById"
                         [ngClass]="{
                            'bg-blue-50/70 border-blue-200 text-blue-950': ev.eventType === 'Live',
                            'bg-amber-50/70 border-amber-200 text-amber-950': ev.eventType === 'Deadline',
                            'bg-purple-50/70 border-purple-200 text-purple-950': ev.eventType === 'General'
                         }"
                         class="rounded-3xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between relative group">
                      
                      <div>
                        <div class="flex items-center justify-between mb-3">
                          <span [ngClass]="{
                                  'bg-blue-600 text-white': ev.eventType === 'Live',
                                  'bg-amber-500 text-white': ev.eventType === 'Deadline',
                                  'bg-purple-600 text-white': ev.eventType === 'General'
                                }"
                                class="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {{ ev.eventType === 'Live' ? (lang === 'ar' ? 'بث مباشر' : 'Lecture / Live') : (ev.eventType === 'Deadline' ? (lang === 'ar' ? 'موعد تسليم' : 'Practice / Deadline') : (lang === 'ar' ? 'مناقشة عامة' : 'Discussion')) }}
                          </span>
                          <span class="text-xs font-bold opacity-75 dir-ltr">
                            {{ ev.eventDate | date:'h:mm a' }}
                          </span>
                        </div>

                        <h4 class="font-black text-base mb-1 break-words line-clamp-2">{{ ev.title }}</h4>
                        <p class="text-xs opacity-75 font-semibold mb-2">{{ ev.courseTitle }}</p>
                        <p *ngIf="ev.description" class="text-xs opacity-80 line-clamp-2 mt-2 leading-relaxed">{{ ev.description }}</p>
                      </div>

                      <div *ngIf="ev.eventType === 'Live'" class="mt-4 pt-3 border-t border-blue-200/60 flex justify-end">
                        <button *ngIf="activeLiveSession" (click)="joinLiveSession()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                          <span>{{ lang === 'ar' ? 'انضم الآن' : 'Join Live' }}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="filteredCalendarEvents.length === 0" class="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div class="w-12 h-12 rounded-2xl bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <p class="text-slate-500 font-bold text-sm">{{ lang === 'ar' ? 'لا توجد مواعيد أو أحداث مجدولة في هذا اليوم.' : 'No events scheduled for this day.' }}</p>
                  </div>
                </div>

                <!-- MONTH VIEW GRID -->
                <div *ngIf="calendarView === 'month'" class="pt-2">
                  <div class="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
                    <div>{{ lang === 'ar' ? 'أحد' : 'Sun' }}</div>
                    <div>{{ lang === 'ar' ? 'إثنين' : 'Mon' }}</div>
                    <div>{{ lang === 'ar' ? 'ثلاثاء' : 'Tue' }}</div>
                    <div>{{ lang === 'ar' ? 'أربعاء' : 'Wed' }}</div>
                    <div>{{ lang === 'ar' ? 'خميس' : 'Thu' }}</div>
                    <div>{{ lang === 'ar' ? 'جمعة' : 'Fri' }}</div>
                    <div>{{ lang === 'ar' ? 'سبت' : 'Sat' }}</div>
                  </div>

                  <div class="grid grid-cols-7 gap-2">
                    <ng-container *ngFor="let mDay of monthDays; trackBy: trackById">
                      <div *ngIf="mDay.empty" class="h-20 rounded-2xl bg-slate-50/40"></div>
                      <div *ngIf="!mDay.empty"
                           (click)="selectCalendarDay(mDay.date)"
                           [ngClass]="mDay.isSelected ? 'border-2 border-slate-900 bg-slate-50 shadow-sm' : 'border border-slate-100 bg-white hover:bg-slate-50'"
                           class="h-20 rounded-2xl p-2 cursor-pointer transition flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-black" [ngClass]="mDay.isToday ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs' : 'text-slate-700'">
                            {{ mDay.dayNumber }}
                          </span>
                          <span *ngIf="mDay.eventsCount > 0" class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <div *ngIf="mDay.eventsCount > 0" class="text-[10px] font-bold text-indigo-600 truncate">
                          {{ mDay.eventsCount }} {{ lang === 'ar' ? 'حدث' : 'event(s)' }}
                        </div>
                      </div>
                    </ng-container>
                  </div>

                  <!-- SELECTED DAY EVENTS IN MONTH VIEW -->
                  <div class="mt-6 pt-5 border-t border-slate-200 animate-fade-in">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                        <span>📅</span>
                        <span>{{ selectedDate | date:'EEEE, d MMMM y' }}</span>
                      </h3>
                      <span class="text-xs font-bold text-slate-400">
                        {{ selectedDayEvents.length }} {{ lang === 'ar' ? 'مواعيد' : 'events' }}
                      </span>
                    </div>

                    <div *ngIf="selectedDayEvents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div *ngFor="let ev of selectedDayEvents; trackBy: trackById"
                           [ngClass]="{
                              'bg-blue-50/70 border-blue-200 text-blue-950': ev.eventType === 'Live',
                              'bg-amber-50/70 border-amber-200 text-amber-950': ev.eventType === 'Deadline',
                              'bg-purple-50/70 border-purple-200 text-purple-950': ev.eventType === 'General'
                           }"
                           class="rounded-3xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between relative group">
                        
                        <div>
                          <div class="flex items-center justify-between mb-3">
                            <span [ngClass]="{
                                    'bg-blue-600 text-white': ev.eventType === 'Live',
                                    'bg-amber-500 text-white': ev.eventType === 'Deadline',
                                    'bg-purple-600 text-white': ev.eventType === 'General'
                                  }"
                                  class="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                              {{ ev.eventType === 'Live' ? (lang === 'ar' ? 'بث مباشر' : 'Lecture / Live') : (ev.eventType === 'Deadline' ? (lang === 'ar' ? 'موعد تسليم' : 'Practice / Deadline') : (lang === 'ar' ? 'مناقشة عامة' : 'Discussion')) }}
                            </span>
                            <span class="text-xs font-bold opacity-75 dir-ltr">
                              {{ ev.eventDate | date:'h:mm a' }}
                            </span>
                          </div>

                          <h4 class="font-black text-base mb-1 break-words line-clamp-2">{{ ev.title }}</h4>
                          <p class="text-xs opacity-75 font-semibold mb-2">{{ ev.courseTitle }}</p>
                          <p *ngIf="ev.description" class="text-xs opacity-80 line-clamp-2 mt-2 leading-relaxed">{{ ev.description }}</p>
                        </div>

                        <div *ngIf="ev.eventType === 'Live'" class="mt-4 pt-3 border-t border-blue-200/60 flex justify-end">
                          <button *ngIf="activeLiveSession" (click)="joinLiveSession()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            <span>{{ lang === 'ar' ? 'انضم الآن' : 'Join Live' }}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div *ngIf="selectedDayEvents.length === 0" class="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <div class="w-12 h-12 rounded-2xl bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      </div>
                      <p class="text-slate-500 font-bold text-sm">{{ lang === 'ar' ? 'لا توجد مواعيد أو أحداث مجدولة في هذا اليوم.' : 'No events scheduled for this day.' }}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="activeTab === 'assignments'">
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 class="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
                  <svg class="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14l2 2 4-4"></path></svg>
                  <span>{{ t[lang].assignments }}</span>
                </h2>
                <p class="text-slate-500 text-sm mt-1">{{ lang === 'ar' ? 'تابع واجباتك وأرسل الحلول لمعلمك في المواعيد المحددة.' : 'Track your pending assignments and submit solutions.' }}</p>
              </div>
            </div>

            <!-- Categories Buttons with Count Badges (Req 1) -->
            <div class="flex flex-wrap items-center gap-3 p-1.5 bg-slate-100 rounded-2xl w-fit mb-8 border border-slate-200">
              <button (click)="selectedAssignmentCategory = 'pending'"
                      [ngClass]="selectedAssignmentCategory === 'pending' ? 'bg-[#130E35] text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
                      class="px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2">
                <span>{{ lang === 'ar' ? 'الواجبات المطلوبة' : 'Pending' }}</span>
                <span class="px-2 py-0.5 text-xs rounded-full font-black"
                      [ngClass]="selectedAssignmentCategory === 'pending' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'">
                  {{ filteredPendingAssignments.length }}
                </span>
              </button>

              <button (click)="selectedAssignmentCategory = 'missed'"
                      [ngClass]="selectedAssignmentCategory === 'missed' ? 'bg-[#130E35] text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
                      class="px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2">
                <span>{{ lang === 'ar' ? 'الواجبات الفائتة' : 'Missed' }}</span>
                <span class="px-2 py-0.5 text-xs rounded-full font-black"
                      [ngClass]="selectedAssignmentCategory === 'missed' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'">
                  {{ filteredMissedAssignments.length }}
                </span>
              </button>

              <button (click)="selectedAssignmentCategory = 'completed'"
                      [ngClass]="selectedAssignmentCategory === 'completed' ? 'bg-[#130E35] text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
                      class="px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2">
                <span>{{ lang === 'ar' ? 'الواجبات المكتملة' : 'Completed' }}</span>
                <span class="px-2 py-0.5 text-xs rounded-full font-black"
                      [ngClass]="selectedAssignmentCategory === 'completed' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-200 text-slate-700'">
                  {{ filteredCompletedAssignments.length }}
                </span>
              </button>
            </div>

            <!-- PENDING ASSIGNMENTS CATEGORY -->
            <div *ngIf="selectedAssignmentCategory === 'pending'" class="space-y-4 animate-fade-in">
              <div *ngFor="let task of filteredPendingAssignments; trackBy: trackById" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition group">
                <div class="flex-1">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 uppercase">{{ lang === 'ar' ? 'مطلوب' : 'Pending' }}</span>
                  <h4 class="font-bold text-lg text-slate-900 mt-2">{{ task.title }}</h4>
                  <p class="text-sm text-slate-500 font-medium mt-1">{{ task.courseTitle }}</p>
                  <p class="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>{{ lang === 'ar' ? 'تاريخ التسليم:' : 'Due:' }} {{ task.dueDate | date:'d MMM y - h:mm a' }}</span>
                  </p>
                </div>
                <button (click)="openAssignmentSolver(task)" class="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-sm">
                  {{ lang === 'ar' ? 'بدء الحل' : 'Start Assignment' }}
                </button>
              </div>

              <div *ngIf="filteredPendingAssignments.length === 0" class="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <p class="text-slate-500 font-bold">{{ lang === 'ar' ? 'لا توجد واجبات مطلوبة تطابق بحثك حالياً!' : 'No pending assignments match your search!' }}</p>
              </div>
            </div>

            <!-- MISSED ASSIGNMENTS CATEGORY -->
            <div *ngIf="selectedAssignmentCategory === 'missed'" class="space-y-4 animate-fade-in">
              <div *ngFor="let task of filteredMissedAssignments; trackBy: trackById" class="bg-rose-50/40 p-5 rounded-2xl border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex-1">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 uppercase">{{ lang === 'ar' ? 'فات الموعد' : 'Missed' }}</span>
                  <h4 class="font-bold text-lg text-slate-700 mt-2">{{ task.title }}</h4>
                  <p class="text-sm text-slate-500 font-medium mt-1">{{ task.courseTitle }}</p>
                  <p class="text-xs text-rose-600 font-bold mt-2 flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>{{ lang === 'ar' ? 'انتهت المهلة في:' : 'Expired on:' }} {{ task.dueDate | date:'d MMM y - h:mm a' }}</span>
                  </p>
                </div>
                <div class="shrink-0">
                  <span class="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    <span>{{ lang === 'ar' ? 'انتهت مهلة التسليم' : 'Submission Closed' }}</span>
                  </span>
                </div>
              </div>

              <div *ngIf="filteredMissedAssignments.length === 0" class="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <p class="text-slate-500 font-bold text-sm">{{ lang === 'ar' ? 'رائع! لا توجد واجبات فائتة.' : 'Great! No missed assignments.' }}</p>
              </div>
            </div>

            <!-- COMPLETED ASSIGNMENTS CATEGORY -->
            <div *ngIf="selectedAssignmentCategory === 'completed'" class="space-y-4 animate-fade-in">
              <div *ngFor="let task of filteredCompletedAssignments; trackBy: trackById" class="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-90 hover:opacity-100 transition">
                <div class="flex-1">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">{{ lang === 'ar' ? 'مكتمل' : 'Completed' }}</span>
                  <h4 class="font-bold text-slate-900 mt-2">{{ task.title }}</h4>
                  <p class="text-sm text-slate-500 font-medium mt-1">{{ task.courseTitle }}</p>
                </div>
                <div class="text-center sm:text-right rtl:sm:text-left">
                  <p class="text-xs text-slate-500 font-bold mb-1">{{ lang === 'ar' ? 'الدرجة' : 'Score' }}</p>
                  <span class="text-lg font-black" [ngClass]="task.score === null || task.score === undefined ? 'text-amber-500' : 'text-indigo-600'">
                    {{ task.score === null || task.score === undefined ? (lang === 'ar' ? 'قيد التقييم (Needs Grading)' : 'Needs Grading') : task.score + '/' + task.totalScore }}
                  </span>
                </div>
              </div>

              <div *ngIf="filteredCompletedAssignments.length === 0" class="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                </div>
                <p class="text-slate-500 font-bold">{{ lang === 'ar' ? 'لا توجد واجبات مكتملة حالياً!' : 'No completed assignments now!' }}</p>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="activeTab === 'teacherProfile'">
            <div *ngIf="isLoadingProfile" class="w-full animate-pulse">
              <div class="h-64 bg-slate-200 rounded-b-[3rem]"></div>
              <div class="max-w-5xl mx-auto px-6 lg:px-8">
                 <div class="relative -mt-24 mb-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
                    <div class="w-48 h-48 rounded-3xl border-4 border-white bg-slate-300 shrink-0"></div>
                    <div class="pb-4 w-full sm:w-auto text-center sm:text-start flex flex-col items-center sm:items-start gap-3">
                       <div class="h-8 bg-slate-300 rounded-lg w-48"></div>
                       <div class="h-5 bg-slate-200 rounded-lg w-32"></div>
                    </div>
                 </div>
                 <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-10">
                    <div class="h-6 bg-slate-300 rounded-lg w-40 mb-6"></div>
                    <div class="h-4 bg-slate-200 rounded-lg w-full mb-3"></div>
                    <div class="h-4 bg-slate-200 rounded-lg w-5/6"></div>
                 </div>
                 <div class="h-8 bg-slate-300 rounded-lg w-48 mb-6"></div>
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    <div *ngFor="let i of [1,2,3]; trackBy: trackById" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[280px]">
                      <div class="h-40 bg-slate-200 w-full"></div>
                      <div class="p-5 flex-1 flex flex-col gap-3">
                        <div class="h-6 bg-slate-300 rounded-md w-3/4 mb-1"></div>
                        <div class="h-4 bg-slate-200 rounded-md w-1/2 mb-4"></div>
                        <div class="h-10 bg-slate-300 rounded-xl w-full mt-auto"></div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
            
            <div *ngIf="!isLoadingProfile && currentTeacherProfile" class="w-full relative animate-fade-in">
              <div class="h-64 bg-slate-100 relative rounded-b-[3rem] shadow-sm overflow-hidden">
                 <button (click)="switchTab('browse')" class="absolute top-6 rtl:right-6 ltr:left-6 w-12 h-12 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-20 shadow-md">
                    <span class="rtl:rotate-180 font-black text-xl">←</span>
                 </button>
                 <img *ngIf="currentTeacherProfile.teacher.coverImage" [src]="'http://localhost:5162' + currentTeacherProfile.teacher.coverImage" class="w-full h-full object-cover">
                 <div *ngIf="!currentTeacherProfile.teacher.coverImage" class="w-full h-full bg-gradient-to-r from-cyan-400 to-blue-600"></div>
              </div>
              
              <div class="max-w-5xl mx-auto px-6 lg:px-8 relative">
                 <div class="relative -mt-24 mb-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
                    <div class="w-48 h-48 rounded-3xl border-4 border-white shadow-2xl overflow-hidden bg-white shrink-0 flex items-center justify-center">
                       <img *ngIf="currentTeacherProfile.teacher.profileImage" [src]="'http://localhost:5162' + currentTeacherProfile.teacher.profileImage" class="w-full h-full object-cover">
                       <span *ngIf="!currentTeacherProfile.teacher.profileImage" class="text-6xl font-bold text-indigo-300">{{ currentTeacherProfile.teacher.username.substring(0,2) | uppercase }}</span>
                    </div>
                    <div class="text-center sm:text-start pb-4">
                       <h2 class="text-4xl font-black text-slate-900">{{ currentTeacherProfile.teacher.username }}</h2>
                       <p class="text-lg font-bold text-indigo-600 mt-1">{{ currentTeacherProfile.teacher.specialization || t[lang].teacherRole }}</p>
                    </div>
                 </div>

                 <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-10 flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-4 flex-wrap">
                        <h3 class="text-xl font-bold text-slate-900">{{ lang === 'ar' ? 'نبذة تعريفية' : 'About Instructor' }}</h3>
                        <div class="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-amber-700 font-bold text-sm shadow-sm" [title]="lang === 'ar' ? 'التقييم العام للمعلم' : 'Instructor Total Rating'">
                          <span class="text-amber-500 text-base">★</span>
                          <span>{{ (currentTeacherProfile?.rating || 0) | number:'1.1-1' }}</span>
                          <span class="text-xs text-amber-600/80 font-normal">({{ currentTeacherProfile?.totalRatingsCount || 0 }} {{ lang === 'ar' ? 'تقييم' : 'ratings' }})</span>
                        </div>
                      </div>
                      <p class="text-slate-600 leading-relaxed text-base">{{ currentTeacherProfile.teacher.bio || (lang === 'ar' ? 'لا توجد نبذة تعريفية متوفرة حالياً.' : 'No bio available currently.') }}</p>
                    </div>
                 </div>

                 <h3 class="text-2xl font-extrabold text-slate-900 mb-6">{{ lang === 'ar' ? 'الكورسات المقدمة' : 'Provided Courses' }}</h3>
                 
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    <div *ngFor="let course of filteredTeacherCourses; trackBy: trackById" (click)="openCourseLanding(course.id)" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group cursor-pointer">
                       <div class="h-40 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                         <img *ngIf="course.coverImageUrl" [src]="getCoverImageUrl(course.coverImageUrl)" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                         <div *ngIf="!course.coverImageUrl" class="absolute inset-0 bg-gradient-to-tr from-slate-400 to-slate-600 opacity-90"></div>
                         <span *ngIf="!course.coverImageUrl" class="text-4xl font-bold text-white relative z-10">{{ course.title.substring(0,2) | uppercase }}</span>
                       </div>
                       <div class="p-5 flex-1 flex flex-col">
                         <h3 class="font-bold text-lg text-slate-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">{{ course.title }}</h3>
                         <div class="mt-2 mb-3">
                           <div *ngIf="!course.isFree; else freeCourse">
                              <ng-container *ngIf="course.discountPercentage > 0; else noDiscount">
                                 <div class="flex items-center gap-2">
                                   <span class="text-lg font-black text-emerald-600">{{ (course.price - (course.price * course.discountPercentage / 100)) }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}</span>
                                   <span class="text-xs text-rose-500 line-through">{{ course.price }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}</span>
                                 </div>
                              </ng-container>
                              <ng-template #noDiscount>
                                 <span class="text-lg font-black text-emerald-600">{{ course.price || 0 }} {{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}</span>
                              </ng-template>
                           </div>
                           <ng-template #freeCourse>
                              <span class="text-lg font-black text-emerald-600">{{ lang === 'ar' ? 'مجاني' : 'Free' }}</span>
                           </ng-template>
                         </div>
                         <button class="w-full mt-auto py-2.5 bg-[#130E35] hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-sm">{{ t[lang].enrollNow }}</button>
                       </div>
                    </div>
                    <div *ngIf="filteredTeacherCourses.length === 0" class="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                       <span class="text-5xl block mb-4">📭</span>
                       <p class="text-slate-500 font-semibold text-lg">{{ lang === 'ar' ? 'لا توجد كورسات متاحة حالياً لهذا المعلم.' : 'No courses available from this teacher currently.' }}</p>
                    </div>
                 </div>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="activeTab === 'support'">
            <div class="space-y-6 animate-fade-in">
              <!-- Hero Banner -->
              <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#130E35] via-indigo-900 to-indigo-800 p-8 lg:p-10 text-white shadow-xl">
                <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div class="relative z-10 max-w-2xl">
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 mb-4 border border-white/10">
                    <svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span>{{ lang === 'ar' ? 'فريق الدعم متواجد لخدمتكم' : 'Support team ready to assist you' }}</span>
                  </span>
                  <h1 class="text-3xl lg:text-4xl font-black mb-3">
                    {{ lang === 'ar' ? 'مركز المساعدة والدعم الفني' : 'Help & Support Center' }}
                  </h1>
                  <p class="text-indigo-200 text-sm lg:text-base leading-relaxed">
                    {{ lang === 'ar' ? 'نحن هنا لنضمن لك تجربة تعليمية متميزة وسلسة. سواء كان لديك استفسار حول الكورسات، مواعيد البث المباشر، تسليم الواجبات، أو واجهت أي عائق تقني، تواصل معنا مباشرة وسنقوم بالرد عليك في أسرع وقت.' : 'We are here to ensure a seamless and exceptional learning experience. Whether you have questions regarding courses, live sessions, assignments, or any technical issues, reach out to us and we will assist you immediately.' }}
                  </p>
                </div>
              </div>

              <!-- Contact Methods Cards -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Phone Hotline Card -->
                <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </div>
                    <h3 class="font-extrabold text-lg text-slate-900 mb-1">{{ lang === 'ar' ? 'الاتصال المباشر' : 'Direct Call' }}</h3>
                    <p class="text-xs text-slate-500 mb-4">{{ lang === 'ar' ? 'تحدث مباشرة مع أحد مسؤولي الدعم الفني' : 'Speak directly with our support team' }}</p>
                    <p class="text-xl font-black text-indigo-600 dir-ltr text-left rtl:text-right font-mono mb-4">01020653195</p>
                  </div>
                  <a href="tel:01020653195" class="w-full py-3 bg-[#130E35] hover:bg-slate-800 text-white rounded-xl text-center text-xs font-bold transition shadow-sm block">
                    {{ lang === 'ar' ? 'اتصال الآن 01020653195' : 'Call Now 01020653195' }}
                  </a>
                </div>

                <!-- WhatsApp Card -->
                <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </div>
                    <h3 class="font-extrabold text-lg text-slate-900 mb-1">{{ lang === 'ar' ? 'محادثة واتساب' : 'WhatsApp Support' }}</h3>
                    <p class="text-xs text-slate-500 mb-4">{{ lang === 'ar' ? 'تواصل فوري للرد على جميع استفساراتك' : 'Instant replies to all your questions' }}</p>
                    <p class="text-xl font-black text-emerald-600 dir-ltr text-left rtl:text-right font-mono mb-4">01020653195</p>
                  </div>
                  <a href="https://wa.me/201020653195" target="_blank" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center text-xs font-bold transition shadow-sm block">
                    {{ lang === 'ar' ? 'محادثة عبر واتساب' : 'Chat on WhatsApp' }}
                  </a>
                </div>

                <!-- Working Hours Card -->
                <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <h3 class="font-extrabold text-lg text-slate-900 mb-1">{{ lang === 'ar' ? 'مواعيد العمل' : 'Working Hours' }}</h3>
                    <p class="text-xs text-slate-500 mb-4">{{ lang === 'ar' ? 'ساعات تواجد فريق الدعم' : 'Availability for student assistance' }}</p>
                    <p class="text-sm font-bold text-slate-800 leading-relaxed mb-4">
                      {{ lang === 'ar' ? 'يومياً من 9:00 صباحاً حتى 11:00 مساءً بتوقيت القاهرة' : 'Daily from 9:00 AM to 11:00 PM (Cairo Time)' }}
                    </p>
                  </div>
                  <div class="w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-center text-xs font-bold">
                    {{ lang === 'ar' ? 'متاح طوال أيام الأسبوع' : 'Available 7 Days a Week' }}
                  </div>
                </div>
              </div>

              <!-- Common Inquiries / FAQ Section -->
              <div class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 class="font-extrabold text-xl text-slate-900 mb-6 flex items-center gap-2">
                  <svg class="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>{{ lang === 'ar' ? 'الأسئلة الشائعة والأكثر تكراراً' : 'Frequently Asked Questions' }}</span>
                </h3>
                <div class="space-y-4">
                  <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 class="font-bold text-slate-900 text-sm mb-2">{{ lang === 'ar' ? 'كيف يمكنني الانضمام لحصص البث المباشر (Live Sessions)؟' : 'How do I join Live Sessions?' }}</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">{{ lang === 'ar' ? 'عندما يبدأ المعلم جلسة بث مباشر لكورس أنت مشترك به، سيظهر شريط البث المباشر فورياً في لوحة التحكم وزر \"انضم للجلسة\"، كما ستتلقى إشعاراً فورياً برابط الحصة.' : 'When your teacher starts a live session for a course you are enrolled in, a live banner will immediately appear on your dashboard with a \"Join Session\" button, alongside an instant notification.' }}</p>
                  </div>
                  <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 class="font-bold text-slate-900 text-sm mb-2">{{ lang === 'ar' ? 'ماذا أفعل إذا فاتتني مهلة تسليم الواجب؟' : 'What happens if I miss an assignment deadline?' }}</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">{{ lang === 'ar' ? 'يتم نقل الواجب تلقائياً إلى تبويب \"الواجبات الفائتة\" بعد انتهاء المهلة المحددة، ويمكنك مراجعة معلمك إذا كان مسموحاً بإعادة فتح التسليم.' : 'The assignment automatically moves to the \"Missed Assignments\" category once the deadline passes. You can consult your instructor if late submission is permitted.' }}</p>
                  </div>
                  <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 class="font-bold text-slate-900 text-sm mb-2">{{ lang === 'ar' ? 'كيف أقوم بتغيير كلمة المرور أو تحديث بيانات الحساب؟' : 'How can I reset my password or update my profile?' }}</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">{{ lang === 'ar' ? 'من القائمة الجانبية، اختر \"إعدادات الحساب\" لتعديل اسمك، رقم الهاتف، أو النبذة التعريفية، ولإعادة تعيين كلمة المرور استخدم خيار \"نسيت كلمة المرور\" من صفحة تسجيل الدخول.' : 'From the sidebar, select \"Account Settings\" to edit your name, phone, or bio. To reset password, use the \"Forgot Password\" option on the login page.' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

        </main>
      </div>
    </div>`
})
export class StudentDashboardComponent implements OnInit {
  private _activeTab: 'dashboard' | 'browse' | 'schedule' | 'assignments' | 'teacherProfile' | 'support' = 'dashboard';
  get activeTab() { return this._activeTab; }
  set activeTab(val: 'dashboard' | 'browse' | 'schedule' | 'assignments' | 'teacherProfile' | 'support') {
    this._activeTab = val;
  }

  userData: any = null;
  myCourses: any[] = [];
  allCourses: any[] = [];
  teachers: any[] = [];
  events: any[] = [];

  isLoading = true;
  isLoadingTopMetrics = true;
  isLoadingTeachers = true;
  isLoadingProfile = false;

  searchQuery: string = '';
  lang: 'en' | 'ar' = 'en';

  showSettingsModal = false;
  showUnsavedModal = false;
  isSaving = false;

  editProfileData: any = { fullName: '', email: '', phone: '', countryCode: '+20', bio: '', profileImage: '' };
  originalProfileData: string = '';

  message = '';
  messageType: 'success' | 'error' = 'success';

  activeLiveSession: any = null;
  completedCoursesCount: number = 0;

  notifications: any[] = [];
  unreadCount: number = 0;
  showNotificationsDropdown: boolean = false;

  currentTeacherProfile: any = null;
  isSidebarCollapsed: boolean = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  showCropModal = false;
  cropImageSrc: string | null = null;
  zoom = 1;
  panX = 0;
  panY = 0;
  isDragging = false;
  startX = 0;
  startY = 0;
  baseImageW = 0;
  baseImageH = 0;
  isUploadingImage = false;

  pendingAssignments: any[] = [];
  missedAssignments: any[] = [];
  completedAssignments: any[] = [];

  selectedAssignmentCategory: 'pending' | 'missed' | 'completed' = 'pending';
  selectedDate: Date = new Date();
  currentCalendarMonth: Date = new Date();
  calendarView: 'week' | 'month' = 'week';
  calendarSearch: string = '';

  countries = [
    { code: '+20', flag: '🇪🇬', name: 'Egypt' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' }
  ];
  t = {
    en: {
      brand: 'Be First', main: 'Main', dashboard: 'Dashboard', browseCourses: 'Browse Tutors', browseDesc: 'Discover new skills and enroll in our latest courses.',
      browseTeachers: 'Browse Teachers', browseTeachersDesc: 'Find the best instructors and discover their courses.', noTeachersFound: 'No teachers found.',
      schedule: 'Schedule', assignments: 'Assignments', support: 'Help & Support', account: 'Account', accountSettings: 'Account Settings',
      logout: 'Log out', search: 'Search courses, lessons, assignments...', welcome: 'Welcome back',
      streak: 'Keep up the great work!', totalXP: 'Total XP',
      coursesEnrolled: 'Courses Enrolled', completedCourses: 'Completed', progress: 'Progress', myActiveCourses: 'My Active Courses', browseMore: 'Browse more',
      enrolled: 'Enrolled', enrollNow: 'View Course', instructor: 'Instructor', noCourses: "You haven't enrolled in any courses yet.",
      noNewCourses: 'No new courses available to enroll right now.',
      liveSessions: 'Live Sessions', liveNow: 'Live Now', joinSession: 'Join Session',
      studentRole: 'Student', teacherRole: 'Teacher', continueLearning: 'Continue Learning', noSearchResults: 'No matching results found.',
      change: 'Change', fullName: 'Full Name', email: 'Email Address', emailCantChange: "Email cannot be changed.",
      phone: 'Phone Number', bio: 'Bio / About me', bioPlaceholder: 'Write a short bio about yourself...',
      cancel: 'Cancel', saveBtn: 'Save Changes', saving: 'Saving...',
      unsavedTitle: 'Unsaved Changes', unsavedDesc: 'You have modified your profile. Are you sure you want to discard these changes without saving?',
      stayBtn: 'No, stay here', discardBtn: 'Yes, discard',
      notificationsTitle: 'Notifications', unreadText: 'unread', noNotifications: 'No new notifications'
    },
    ar: {
      brand: 'فلوينسي فيرست', main: 'القائمة الرئيسية', dashboard: 'لوحة التحكم', browseCourses: 'تصفح المعلمين', browseDesc: 'اكتشف مهارات جديدة واشترك في أحدث كورساتنا.',
      browseTeachers: 'تصفح المعلمين', browseTeachersDesc: 'ابحث عن أفضل المعلمين واكتشف كورساتهم.', noTeachersFound: 'لا يوجد معلمون حالياً.',
      schedule: 'الجدول', assignments: 'الواجبات', support: 'المساعدة والدعم', account: 'الحساب', accountSettings: 'إعدادات الحساب',
      logout: 'تسجيل خروج', search: 'ابحث عن الكورسات، المعلمين، الواجبات...', welcome: 'مرحباً بعودتك',
      streak: 'استمر في العمل الرائع!', totalXP: 'إجمالي النقاط',
      coursesEnrolled: 'الكورسات المشترك بها', completedCourses: 'المكتملة والشهادات', progress: 'التقدم', myActiveCourses: 'كورساتي النشطة', browseMore: 'تصفح المزيد',
      enrolled: 'مشترك', enrollNow: 'عرض التفاصيل', instructor: 'المعلم', noCourses: "لم تشترك في أي كورسات حتى الآن.",
      noNewCourses: 'لا توجد كورسات جديدة متاحة للاشتراك حالياً.',
      liveSessions: 'البث المباشر', liveNow: 'مباشر الآن', joinSession: 'انضم للجلسة',
      studentRole: 'طالب', teacherRole: 'معلم', continueLearning: 'متابعة التعلم', noSearchResults: 'لا توجد نتائج مطابقة للبحث.',
      change: 'تغيير', fullName: 'الاسم بالكامل', email: 'البريد الإلكتروني', emailCantChange: "لا يمكن تغيير البريد الإلكتروني.",
      phone: 'رقم الهاتف', bio: 'نبذة عني', bioPlaceholder: 'اكتب نبذة مختصرة عنك...',
      cancel: 'إلغاء', saveBtn: 'حفظ التغييرات', saving: 'جاري الحفظ...',
      unsavedTitle: 'تغييرات لم تُحفظ', unsavedDesc: 'لقد قمت بتعديل بياناتك. هل أنت متأكد من رغبتك في الخروج دون حفظ؟',
      stayBtn: 'لا، البقاء هنا', discardBtn: 'نعم، تجاهل التغييرات',
      notificationsTitle: 'الإشعارات', unreadText: 'غير مقروء', noNotifications: 'لا توجد إشعارات جديدة'
    }
  };

  constructor(
    private http: HttpClient,
    public router: Router,
    private route: ActivatedRoute,
    private courseService: CourseService,
    private langService: LanguageService,
    private signalrService: SignalrService,
    private assignmentService: AssignmentService,
    private ngZone: NgZone
  ) { }

  getCoverImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `http://localhost:5162${url.startsWith('/') ? '' : '/'}${url}`;
  }

  ngOnInit() {
    const role = localStorage.getItem('userRole');
    if (role === 'Teacher' || role === '1') {
      this.router.navigate(['/teacher-dashboard'], { replaceUrl: true });
      return;
    }

    this.langService.currentLang$.subscribe((l: any) => this.lang = l);

    // --- BROWSER HISTORY SYNC ---
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] || 'dashboard';
      this.activeTab = tab as any;

      if (tab === 'browse' && this.teachers.length === 0) this.fetchTeachers();
      if (tab === 'schedule' && this.events.length === 0) this.fetchSchedule();
      if (tab === 'assignments' && this.pendingAssignments.length === 0) this.loadAssignments();
      if (tab === 'teacherProfile' && params['teacherId']) {
        this.loadTeacherProfileData(params['teacherId']);
      }
    });
    // ---------------------------

    this.fetchUserProfile();
    this.fetchMyCourses();
    this.fetchNotifications();
    this.signalrService.startConnection();

    this.signalrService.sessionStarted$.subscribe((payload: any) => {
      this.ngZone.run(() => {
        try {
          if (!payload) return;
          
          let incomingCourseId = null;
          let incomingTitle = null;
          let incomingInstructor = null;
          let incomingUrl = null;

          if (Array.isArray(payload)) {
             incomingCourseId = payload[0];
             incomingInstructor = payload[1];
             incomingTitle = payload[2];
             incomingUrl = payload[3];
          } else if (typeof payload === 'object') {
             incomingCourseId = payload.courseId || payload.CourseId || payload.id || payload.Id;
             incomingTitle = payload.courseTitle || payload.CourseTitle || payload.title;
             incomingInstructor = payload.instructorName || payload.InstructorName;
             incomingUrl = payload.meetUrl || payload.MeetUrl || payload.url;
          } else {
             incomingCourseId = payload;
          }

          if (!incomingCourseId) return;

          const matchingCourse = this.myCourses.find(c => c.id.toString() === incomingCourseId.toString());
          
          if (matchingCourse) {
            this.activeLiveSession = {
              courseId: incomingCourseId,
              courseTitle: incomingTitle || matchingCourse.title,
              instructorName: incomingInstructor || matchingCourse.instructorName,
              meetUrl: incomingUrl || ''
            };
          }
        } catch(e) {
          console.error('Error handling live session event', e);
        }
      });
    });

    this.signalrService.sessionEnded$.subscribe((id: any) => {
      this.ngZone.run(() => {
        if (this.activeLiveSession?.courseId.toString() === id.toString()) {
          this.activeLiveSession = null;
        }
      });
    });
  }

  trackById(index: number, item: any): any {
    return item.id || index;
  }

  loadAssignments() {
    this.assignmentService.getStudentAssignments().subscribe({
      next: (data: any) => {
        const pendingArr = data.pending || data.Pending || [];
        const missedArr = data.missed || data.Missed || [];
        const completedArr = data.completed || data.Completed || [];

        this.pendingAssignments = pendingArr;
        this.missedAssignments = missedArr;
        this.completedAssignments = completedArr.map((c: any) => ({
          ...c,
          title: c.assignmentTitle || c.title,
          courseTitle: c.courseTitle || '',
          score: c.givenScore
        }));
      },
      error: () => {
        this.pendingAssignments = [];
        this.missedAssignments = [];
        this.completedAssignments = [];
      }
    });
  }

  openAssignmentSolver(task: any) {
    this.router.navigate(['/assignment-solver', task.id], { replaceUrl: true });
  }

  get filteredPendingAssignments() {
    if (!this.searchQuery) return this.pendingAssignments;
    const q = this.searchQuery.toLowerCase();
    return this.pendingAssignments.filter(a => a.title.toLowerCase().includes(q) || (a.courseTitle && a.courseTitle.toLowerCase().includes(q)));
  }

  get filteredMissedAssignments() {
    if (!this.searchQuery) return this.missedAssignments;
    const q = this.searchQuery.toLowerCase();
    return this.missedAssignments.filter(a => a.title.toLowerCase().includes(q) || (a.courseTitle && a.courseTitle.toLowerCase().includes(q)));
  }

  get filteredCompletedAssignments() {
    if (!this.searchQuery) return this.completedAssignments;
    const q = this.searchQuery.toLowerCase();
    return this.completedAssignments.filter(a => a.title.toLowerCase().includes(q) || (a.courseTitle && a.courseTitle.toLowerCase().includes(q)));
  }

  switchTab(tab: 'dashboard' | 'browse' | 'schedule' | 'assignments' | 'teacherProfile' | 'support') {
    this.searchQuery = '';
    this.router.navigate([], { queryParams: { tab: tab } });
  }

  getMonthYearTitle(): string {
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const m = this.currentCalendarMonth.getMonth();
    const y = this.currentCalendarMonth.getFullYear();
    return this.lang === 'ar' ? `${monthsAr[m]} ${y}` : `${monthsEn[m]} ${y}`;
  }

  prevCalendar(): void {
    if (this.calendarView === 'week') {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() - 7);
      this.selectedDate = d;
      this.currentCalendarMonth = new Date(d);
    } else {
      const d = new Date(this.currentCalendarMonth);
      d.setMonth(d.getMonth() - 1);
      this.currentCalendarMonth = d;
    }
  }

  nextCalendar(): void {
    if (this.calendarView === 'week') {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() + 7);
      this.selectedDate = d;
      this.currentCalendarMonth = new Date(d);
    } else {
      const d = new Date(this.currentCalendarMonth);
      d.setMonth(d.getMonth() + 1);
      this.currentCalendarMonth = d;
    }
  }

  goToToday(): void {
    const today = new Date();
    this.selectedDate = today;
    this.currentCalendarMonth = new Date(today);
  }

  selectCalendarDay(date: Date): void {
    this.selectedDate = new Date(date);
    this.currentCalendarMonth = new Date(date);
  }

  isSameDate(d1: any, d2: any): boolean {
    if (!d1 || !d2) return false;
    const a = new Date(d1);
    const b = new Date(d2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  get weekDays(): any[] {
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    
    const current = new Date(this.selectedDate);
    const dayOfWeek = current.getDay();
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - dayOfWeek);
    
    const result = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const isSelected = this.isSameDate(d, this.selectedDate);
      const isToday = this.isSameDate(d, today);
      const hasEvents = this.events.some(e => this.isSameDate(e.eventDate, d));
      result.push({
        date: d,
        dayName: this.lang === 'ar' ? daysAr[d.getDay()] : daysEn[d.getDay()],
        dayNumber: d.getDate(),
        isSelected,
        isToday,
        hasEvents
      });
    }
    return result;
  }

  get monthDays(): any[] {
    const y = this.currentCalendarMonth.getFullYear();
    const m = this.currentCalendarMonth.getMonth();
    const firstDayIndex = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const result: any[] = [];
    const today = new Date();

    for (let i = 0; i < firstDayIndex; i++) {
      result.push({ empty: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      const isSelected = this.isSameDate(d, this.selectedDate);
      const isToday = this.isSameDate(d, today);
      const dayEvents = this.events.filter(e => this.isSameDate(e.eventDate, d));
      result.push({
        empty: false,
        date: d,
        dayNumber: day,
        isSelected,
        isToday,
        eventsCount: dayEvents.length,
        hasEvents: dayEvents.length > 0
      });
    }
    return result;
  }

  get filteredCalendarEvents(): any[] {
    let list = this.events;
    if (this.calendarSearch) {
      const q = this.calendarSearch.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.courseTitle && e.courseTitle.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    if (this.calendarView === 'week') {
      return list.filter(e => this.isSameDate(e.eventDate, this.selectedDate));
    }
    const m = this.currentCalendarMonth.getMonth();
    const y = this.currentCalendarMonth.getFullYear();
    return list.filter(e => {
      const d = new Date(e.eventDate);
      return d.getMonth() === m && d.getFullYear() === y;
    });
  }

  get selectedDayEvents(): any[] {
    let list = this.events;
    if (this.calendarSearch) {
      const q = this.calendarSearch.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.courseTitle && e.courseTitle.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return list.filter(e => this.isSameDate(e.eventDate, this.selectedDate));
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  endDrag() {
    this.isDragging = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    if (this.showNotificationsDropdown && !targetElement.closest('.notification-container')) {
      this.showNotificationsDropdown = false;
    }
  }

  toggleNotifications() {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    if (this.showNotificationsDropdown) {
      this.fetchNotifications();
    }
  }

  fetchNotifications() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:5162/api/notifications', { headers }).subscribe({
      next: (data) => {
        this.notifications = data.map(n => {
          const dateStr = n.createdAt.endsWith('Z') ? n.createdAt : n.createdAt + 'Z';
          return { ...n, createdAt: dateStr };
        });
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      },
      error: () => { }
    });
  }

  onNotificationClick(notif: any) {
    this.markAsRead(notif);
    this.showNotificationsDropdown = false;
    const rawMsg = notif.message || '';
    const parts = rawMsg.split('||');
    const type = parts[0];
    const msg = rawMsg.toLowerCase();
    const title = (notif.title || '').toLowerCase();
    const text = msg + ' ' + title;

    // 1. LESSON NOTIFICATION -> Direct to CoursePlayer with target lessonId!
    if (type === 'NEW_LESSON' || text.includes('تم نشر درس جديد') || text.includes('new lesson')) {
      if (type === 'NEW_LESSON' && parts.length >= 4) {
        const lessonId = parts[1];
        const courseId = parts[3];
        if (courseId) {
          this.router.navigate(['/learn', courseId], { queryParams: { lessonId: lessonId } });
          return;
        }
      }
      // Fallback for older text formats: find course by matching title
      const matched = this.myCourses.find(c => text.includes(c.title?.toLowerCase())) ||
                      this.allCourses.find(c => text.includes(c.title?.toLowerCase()));
      if (matched) {
        this.router.navigate(['/learn', matched.id]);
        return;
      }
      this.switchTab('dashboard');
      return;
    }

    // 2. QUIZ NOTIFICATION -> Direct to Quiz Solver!
    if (type === 'NEW_QUIZ' || text.includes('تم نشر اختبار جديد') || text.includes('new quiz') || text.includes('كويز') || text.includes('quiz')) {
      if (type === 'NEW_QUIZ' && parts.length >= 4 && parts[3] && !isNaN(Number(parts[3]))) {
        const lessonId = parts[3];
        this.router.navigate(['/quiz-solver', lessonId]);
        return;
      }
      const courseTitle = parts[2];
      const matchedCourse = this.myCourses.find(c => courseTitle && c.title?.toLowerCase() === courseTitle.toLowerCase());
      if (matchedCourse) {
        this.router.navigate(['/learn', matchedCourse.id]);
        return;
      }
      this.switchTab('dashboard');
      return;
    }

    // 3. ASSIGNMENT NOTIFICATION -> Direct to Assignment Solver!
    if (type === 'NEW_ASSIGNMENT' || text.includes('واجب جديد') || text.includes('new assignment')) {
      const assignmentId = parts[4];
      if (assignmentId && !isNaN(Number(assignmentId))) {
        this.router.navigate(['/assignment-solver', assignmentId]);
        return;
      }
      this.switchTab('assignments');
      this.selectedAssignmentCategory = 'pending';
      return;
    }

    // 4. ASSIGNMENT GRADED -> Direct to Completed Assignments!
    if (type === 'ASSIGNMENT_GRADED' || text.includes('تم تقييم واجب') || text.includes('graded')) {
      this.switchTab('assignments');
      this.selectedAssignmentCategory = 'completed';
      return;
    }

    // 5. SCHEDULE EVENT -> Direct to Schedule tab!
    if (type === 'NEW_SCHEDULE' || text.includes('new_schedule') || text.includes('schedule') || text.includes('موعد') || text.includes('حدث') || text.includes('event')) {
      this.switchTab('schedule');
      return;
    }

    // 6. LIVE SESSION -> Open live link or go to schedule!
    if (text.includes('live') || text.includes('بث') || text.includes('مباشر')) {
      if (this.activeLiveSession?.meetUrl) {
        this.joinLiveSession();
      } else {
        this.switchTab('schedule');
      }
      return;
    }

    // 7. QUIZ FULLMARK / XP
    if (type === 'QUIZ_FULLMARK' || text.includes('نقطة') || text.includes('xp')) {
      this.switchTab('dashboard');
      return;
    }

    // Default:
    this.switchTab('dashboard');
  }

  markAsRead(notif: any) {
    if (notif.isRead) return;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.post(`http://localhost:5162/api/notifications/${notif.id}/read`, {}, { headers }).subscribe({
      next: () => {
        notif.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    });
  }

  deleteNotification(id: number, event: Event) {
    event.stopPropagation();
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`http://localhost:5162/api/notifications/${id}`, { headers }).subscribe({
      next: () => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif && !notif.isRead) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.notifications = this.notifications.filter(n => n.id !== id);
      }
    });
  }

  deleteAllNotifications() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete('http://localhost:5162/api/notifications/all', { headers }).subscribe({
      next: () => {
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  getNotificationText(message: string): string {
    if (!message) return '';
    const parts = message.split('||');
    const type = parts[0];

    if (this.lang === 'en') {
      if (type === 'NEW_LESSON') return `A new lesson has been published titled '${parts[2]}' in course '${parts[4]}'. Check it out now!`;
      if (type === 'NEW_SCHEDULE') return `A new schedule event (${parts[1]}) titled '${parts[2]}' has been added for course '${parts[3]}'.`;
      if (type === 'NEW_QUIZ') return `A new quiz has been published for lesson '${parts[1]}' in course '${parts[2]}'. Test your knowledge now!`;
      if (type === 'QUIZ_FULLMARK') return `🎉 Congratulations! You earned ${parts[1]} XP for getting a full mark in the quiz. Keep going!`;
      if (type === 'NEW_ASSIGNMENT') return `New Assignment '${parts[1]}' in course '${parts[2]}'. Due before ${parts[3]}!`;
      if (type === 'ASSIGNMENT_SUBMITTED') return `Student ${parts[1]} submitted assignment '${parts[2]}' in course '${parts[3]}'.`;
      if (type === 'ASSIGNMENT_GRADED') return `Assignment '${parts[1]}' has been graded. You scored ${parts[2]}/${parts[3]}.`;

      if (message.includes('تم إضافة موعد جديد')) return message.replace('تم إضافة موعد جديد', 'A new event has been added').replace('بعنوان', 'titled').replace('لكورس', 'for course');
      if (message.includes('50 نقطة') || message.includes('50 XP') || message.includes('الكويز')) return '🎉 Congratulations! You earned 50 XP for getting a full mark in the quiz. Keep going!';
      if (message.includes('بدأ المعلم') && message.includes('بثاً مباشراً')) return message.replace('بدأ المعلم', 'Instructor').replace('بثاً مباشراً لكورس', 'started a live session for').replace('انضم الآن!', 'Join now!').replace('. انضم الآن!', '. Join now!');
      if (message.includes('طالب جديد انضم')) return message.replace('طالب جديد انضم! لقد قام طالب بالاشتراك في كورس', 'New student enrolled! A student has enrolled in course').replace('طالب جديد انضم!', 'New student enrolled!');
      if (message.includes('تم نشر درس جديد')) return message.replace('تم نشر درس جديد بعنوان', 'A new lesson has been published titled').replace('في كورس', 'in course').replace('تفقده الآن!', 'Check it out now!');
      if (message.includes('تم نشر اختبار جديد')) return message.replace('تم نشر اختبار جديد لدرس', 'A new quiz has been published for lesson').replace('في كورس', 'in course').replace('Test your knowledge now!', 'اختبر معلوماتك الآن!');
      if (message.includes('واجب جديد')) return message.replace('واجب جديد', 'New Assignment').replace('قم بتسليمه قبل', 'Due before');
      return message;
    }

    if (this.lang === 'ar') {
      if (type === 'NEW_LESSON') return `تم نشر درس جديد بعنوان '${parts[2]}' في كورس '${parts[4]}'. تفقده الآن!`;
      if (type === 'NEW_SCHEDULE') return `تم إضافة موعد جديد (${parts[1]}) بعنوان '${parts[2]}' لكورس '${parts[3]}'.`;
      if (type === 'NEW_QUIZ') return `تم نشر اختبار جديد لدرس '${parts[1]}' في كورس '${parts[2]}'. اختبر معلوماتك الآن!`;
      if (type === 'QUIZ_FULLMARK') return `🎉 مبروك! لقد ربحت ${parts[1]} نقطة لحصولك على الدرجة النهائية في الكويز. استمر يا بطل!`;
      if (type === 'NEW_ASSIGNMENT') return `واجب جديد '${parts[1]}' في كورس '${parts[2]}'. قم بتسليمه قبل ${parts[3]}!`;
      if (type === 'ASSIGNMENT_SUBMITTED') return `قام الطالب ${parts[1]} بتسليم واجب '${parts[2]}' في كورس '${parts[3]}'.`;
      if (type === 'ASSIGNMENT_GRADED') return `تم تقييم واجب '${parts[1]}'. حصلت على ${parts[2]}/${parts[3]}.`;

      if (message.includes('Congratulations') && message.includes('50 XP')) return '🎉 مبروك! لقد ربحت 50 نقطة لحصولك على الدرجة النهائية في الكويز. استمر يا بطل!';
      if (message.includes('started a live session for')) return message.replace('Instructor', 'بدأ المعلم').replace('started a live session for', 'بثاً مباشراً لكورس').replace('Join now!', 'انضم الآن!').replace('. Join now!', '. انضم الآن!');
      if (message.includes('New student enrolled')) return message.replace('New student enrolled! A student has enrolled in course', 'طالب جديد انضم! لقد قام طالب بالاشتراك في كورس').replace('New student enrolled!', 'طالب جديد انضم!');
      if (message.includes('A new lesson has been published')) return message.replace('A new lesson has been published titled', 'تم نشر درس جديد بعنوان').replace('in course', 'في كورس').replace('Check it out now!', 'تفقده الآن!');
      if (message.includes('A new quiz has been published')) return message.replace('A new quiz has been published for lesson', 'تم نشر اختبار جديد لدرس').replace('in course', 'في كورس').replace('Test your knowledge now!', 'اختبر معلوماتك الآن!');
      return message;
    }

    return message;
  }

  joinLiveSession() {
    if (this.activeLiveSession?.meetUrl) {
      let url = this.activeLiveSession.meetUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      window.open(url, '_blank');
    }
  }

  viewTeacherProfile(instructorId: number | undefined, event?: Event) {
    if (event) event.stopPropagation();
    if (!instructorId) return;

    this.router.navigate([], { queryParams: { tab: 'teacherProfile', teacherId: instructorId } });
  }

  loadTeacherProfileData(instructorId: number) {
    this.currentTeacherProfile = null;
    this.isLoadingProfile = true;
    window.scrollTo(0, 0);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`http://localhost:5162/api/user/teacher/${instructorId}`, { headers }).subscribe({
      next: (data) => {
        data.courses = data.courses.filter((c: any) => !this.myCourses.some(mc => mc.id === c.id));
        this.currentTeacherProfile = data;
        this.isLoadingProfile = false;
      },
      error: () => {
        this.isLoadingProfile = false;
        this.switchTab('browse');
      }
    });
  }

  fetchTeachers() {
    this.isLoadingTeachers = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:5162/api/user/teachers', { headers }).subscribe({
      next: (data) => {
        this.teachers = data;
        this.isLoadingTeachers = false;
      },
      error: () => {
        this.isLoadingTeachers = false;
        this.teachers = [];
      }
    });
  }

  fetchSchedule() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:5162/api/schedule/student', { headers }).subscribe({
      next: (data) => {
        this.events = data.map(e => {
          const d = e.eventDate.endsWith('Z') ? e.eventDate : e.eventDate + 'Z';
          return { ...e, eventDate: d };
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.events = [];
      }
    });
  }

  get filteredEvents() {
    if (!this.searchQuery) return this.events;
    const q = this.searchQuery.toLowerCase();
    return this.events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.courseTitle.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q))
    );
  }

  get filteredTeachers() {
    if (!this.searchQuery) return this.teachers;
    const q = this.searchQuery.toLowerCase();
    return this.teachers.filter(t =>
      t.username.toLowerCase().includes(q) ||
      (t.specialization && t.specialization.toLowerCase().includes(q))
    );
  }

  get filteredMyCourses() {
    if (!this.searchQuery) return this.myCourses;
    return this.myCourses.filter(c =>
      c.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(this.searchQuery.toLowerCase()))
    );
  }

  get filteredTeacherCourses() {
    if (!this.currentTeacherProfile || !this.currentTeacherProfile.courses) return [];
    if (!this.searchQuery) return this.currentTeacherProfile.courses;
    return this.currentTeacherProfile.courses.filter((c: any) =>
      c.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  toggleLang() {
    this.langService.toggleLanguage();
  }

  openCourse(courseId: number) {
    this.router.navigate(['/learn', courseId]);
  }

  openCourseLanding(courseId: number) {
    this.router.navigate(['/course-landing', courseId], { replaceUrl: true });
  }

  openSettings() {
    this.editProfileData = {
      fullName: this.userData?.username || '',
      email: this.userData?.email || '',
      phone: this.userData?.phoneNumber?.split(' ')[1] || '',
      countryCode: this.userData?.phoneNumber?.split(' ')[0] || '+20',
      bio: this.userData?.bio || '',
      profileImage: this.userData?.profileImage || ''
    };
    this.originalProfileData = JSON.stringify(this.editProfileData);
    this.showSettingsModal = true;
  }

  closeSettings() {
    if (JSON.stringify(this.editProfileData) !== this.originalProfileData) {
      this.showUnsavedModal = true;
    } else {
      this.showSettingsModal = false;
    }
  }

  confirmDiscard() {
    this.showUnsavedModal = false;
    this.showSettingsModal = false;
  }

  cancelDiscard() {
    this.showUnsavedModal = false;
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      this.cropImageSrc = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const ratio = Math.max(300 / img.width, 300 / img.height);
        this.baseImageW = img.width * ratio;
        this.baseImageH = img.height * ratio;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.showCropModal = true;
      };
      img.src = this.cropImageSrc;
    };
    reader.readAsDataURL(file);
  }

  startDrag(e: MouseEvent | TouchEvent) {
    this.isDragging = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    this.startX = clientX - this.panX;
    this.startY = clientY - this.panY;
  }

  onDrag(e: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    this.panX = clientX - this.startX;
    this.panY = clientY - this.startY;
  }

  applyCrop() {
    this.isUploadingImage = true;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(this.zoom * 2, this.zoom * 2);
      ctx.translate(this.panX, this.panY);
      ctx.drawImage(img, -this.baseImageW / 2, -this.baseImageH / 2, this.baseImageW, this.baseImageH);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.post('http://localhost:5162/api/user/upload-avatar', formData, { headers }).subscribe({
          next: (res: any) => {
            this.editProfileData.profileImage = res.profileImage;
            this.userData.profileImage = res.profileImage;
            this.showCropModal = false;
            this.isUploadingImage = false;
          },
          error: () => {
            this.isUploadingImage = false;
            this.showMessage(this.lang === 'ar' ? 'فشل رفع الصورة' : 'Upload failed', 'error');
          }
        });
      }, 'image/jpeg', 0.9);
    };
    img.src = this.cropImageSrc as string;
  }

  saveProfile() {
    this.isSaving = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const updateModel = {
      username: this.editProfileData.fullName,
      phoneNumber: this.editProfileData.countryCode + ' ' + this.editProfileData.phone
    };
    this.http.put('http://localhost:5162/api/user/profile', updateModel, { headers }).subscribe({
      next: () => {
        this.userData.username = this.editProfileData.fullName;
        this.userData.phoneNumber = updateModel.phoneNumber;
        this.originalProfileData = JSON.stringify(this.editProfileData);
        this.isSaving = false;
        this.showSettingsModal = false;
        this.showMessage(this.lang === 'ar' ? 'تم حفظ التعديلات بنجاح' : 'Profile updated successfully', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.showMessage(this.lang === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error updating profile', 'error');
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error' | 'warning') {
    this.message = msg;
    this.messageType = type as 'success' | 'error';
    setTimeout(() => this.message = '', 3500);
  }

  fetchUserProfile() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('http://localhost:5162/api/user/profile', { headers }).subscribe({
      next: (data: any) => this.userData = data,
      error: () => this.logout()
    });
  }

  fetchMyCourses() {
    if (this.myCourses.length === 0) this.isLoading = true;
    this.isLoadingTopMetrics = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:5162/api/course/my-courses', { headers }).subscribe({
      next: (data: any[]) => {
        if (!data || data.length === 0) {
          this.myCourses = [];
          this.completedCoursesCount = 0;
          this.isLoading = false;
          this.isLoadingTopMetrics = false;
          return;
        }

        this.myCourses = data.map(course => {
          const completed: number[] = JSON.parse(localStorage.getItem(`completed_lessons_${course.id}`) || '[]');
          
          let calculatedProgress = 0;
          if (course.totalLessonsCount && course.totalLessonsCount > 0) {
            calculatedProgress = Math.round((completed.length / course.totalLessonsCount) * 100);
          }
          course.progressPercentage = calculatedProgress;

          let earnedCertificates: number[] = JSON.parse(localStorage.getItem('earned_certificates') || '[]');
          if (calculatedProgress >= 100 && !earnedCertificates.includes(course.id)) {
            earnedCertificates.push(course.id);
            localStorage.setItem('earned_certificates', JSON.stringify(earnedCertificates));
          }
          
          return course;
        });

        const finalCertificates = JSON.parse(localStorage.getItem('earned_certificates') || '[]');
        this.completedCoursesCount = finalCertificates.filter((id: number) => this.myCourses.some(c => c.id === id)).length;

        const enrolledIds = this.myCourses.map(c => c.id.toString());
        this.signalrService.registerStudent(enrolledIds);
        setTimeout(() => {
          this.signalrService.registerStudent(enrolledIds);
        }, 2500);

        this.isLoading = false;
        this.isLoadingTopMetrics = false;
      },
      error: () => {
        this.isLoading = false;
        this.isLoadingTopMetrics = false;
        this.myCourses = [];
      }
    });
  }

  fetchAllCourses() {
    this.isLoading = true;
    this.courseService.getAllCourses().subscribe({
      next: (data: any) => {
        this.allCourses = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.allCourses = [];
      }
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
}