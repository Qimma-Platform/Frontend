import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { LanguageService } from '../services/language.service';
import { SignalrService } from '../services/signalr.service';
import { AssignmentService } from '../services/assignment.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, FormsModule],
  template: `
    <div class="bg-[#F4F7FE] text-slate-800 min-h-screen flex w-full relative" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      
      <div *ngIf="message" [ngClass]="{'bg-emerald-500': messageType === 'success', 'bg-rose-500': messageType === 'error'}" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-[90] px-6 py-3 rounded-xl shadow-xl text-white font-bold transition-all duration-500 flex items-center gap-3 animate-fade-in">
        <span>{{ message }}</span>
      </div>

      <!-- Settings & Other Modals -->
      <div *ngIf="showCropModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4 animate-fade-in">
        <div class="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col items-center">
          <h3 class="text-xl font-bold text-slate-900 mb-6">{{ lang === 'ar' ? 'تعديل الصورة' : 'Crop Image' }}</h3>
          <div class="relative overflow-hidden bg-slate-100 rounded-2xl cursor-move touch-none border-2 border-slate-200"
               [style.width.px]="300"
               [style.height.px]="300"
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
            <button (click)="applyCrop()" [disabled]="isUploadingImage" class="flex-1 py-3 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50">
              {{ isUploadingImage ? t[lang].saving : (lang === 'ar' ? 'تطبيق' : 'Apply') }}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
        <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in">
        <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
          <h3 class="text-xl font-bold text-slate-900 text-center mb-2">{{ t[lang].deleteConfirmTitle }}</h3>
          <p class="text-sm text-slate-500 text-center mb-8">{{ t[lang].deleteConfirmDesc }}</p>
          <div class="flex gap-3">
            <button (click)="closeDeleteModal()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">{{ t[lang].cancel }}</button>
            <button (click)="confirmDelete()" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md">{{ t[lang].confirmDeleteBtn }}</button>
          </div>
        </div>
      </div>

      <div *ngIf="showUnsavedModal" class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-fade-in">
        <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in">
          <div class="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mx-auto mb-4">⚠</div>
          <h3 class="text-xl font-bold text-slate-900 text-center mb-2">{{ t[lang].unsavedTitle }}</h3>
          <p class="text-sm text-slate-500 text-center mb-8">{{ t[lang].unsavedDesc }}</p>
          <div class="flex gap-3">
            <button (click)="cancelDiscard()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">{{ t[lang].stayBtn }}</button>
            <button (click)="confirmDiscard()" class="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition shadow-md">{{ t[lang].discardBtn }}</button>
          </div>
        </div>
      </div>

      <div *ngIf="showSettingsModal" class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-md px-4 py-10 animate-fade-in">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto flex flex-col animate-scale-in">
          <div class="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-100 p-6 flex items-center justify-between z-10">
            <h2 class="text-xl font-extrabold text-[#130E35]">{{ t[lang].accountSettings }}</h2>
            <button (click)="closeSettings()" class="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition font-bold">✖</button>
          </div>
          <div class="p-6 sm:p-8 space-y-6">
            <div class="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
              <div class="relative group">
                <img [src]="editProfileData.profileImage ? 'http://localhost:5162' + editProfileData.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + editProfileData.fullName)" class="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 shadow-md">
                <label class="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
                  📷 {{ t[lang].change }}
                  <input type="file" (change)="onAvatarSelected($event)" accept="image/*" class="hidden">
                </label>
              </div>
              <div class="text-center sm:text-start flex-1">
                <h3 class="font-extrabold text-lg text-slate-900">{{ editProfileData.fullName || 'Teacher' }}</h3>
                <p class="text-sm text-slate-500">{{ editProfileData.email }}</p>
                <span class="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-700 rounded-lg mt-2 inline-block">{{ editProfileData.specialization || t[lang].teacher }}</span>
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-bold text-slate-700 mb-2">{{ lang === 'ar' ? 'صورة الغلاف الشخصي' : 'Profile Cover Image' }}</label>
              <div class="h-32 rounded-2xl border-2 border-dashed border-slate-300 relative overflow-hidden flex items-center justify-center group cursor-pointer hover:bg-slate-50 transition bg-slate-100">
                <img *ngIf="editProfileData.coverImage" [src]="'http://localhost:5162' + editProfileData.coverImage" class="w-full h-full object-cover transition duration-300 group-hover:opacity-50">
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">🖼️ {{ t[lang].change }}</span>
                </div>
                <input type="file" (change)="onCoverSelected($event)" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].fullName }} <span class="text-rose-500">*</span></label>
                <input type="text" [(ngModel)]="editProfileData.fullName" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].specialization }} <span class="text-rose-500">*</span></label>
                <input type="text" [(ngModel)]="editProfileData.specialization" [placeholder]="t[lang].specPlaceholder" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium">
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].email }}</label>
                <input type="email" [(ngModel)]="editProfileData.email" disabled class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium">
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].phone }}</label>
                <div class="flex gap-2">
                  <select [(ngModel)]="editProfileData.countryCode" class="w-32 px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium dir-ltr text-left">
                    <option *ngFor="let country of countries; trackBy: trackById" [value]="country.code">
                      {{ country.flag }} {{ country.code }}
                    </option>
                  </select>
                  <input type="text" [(ngModel)]="editProfileData.phone" class="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium dir-ltr text-left">
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].bio }}</label>
                <textarea [(ngModel)]="editProfileData.bio" rows="3" [placeholder]="t[lang].bioPlaceholder" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"></textarea>
              </div>
            </div>
          </div>
          <div class="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 sticky bottom-0">
          <button (click)="closeSettings()" class="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition">{{ t[lang].cancel }}</button>
            <button (click)="saveProfile()" [disabled]="isSaving || !editProfileData.specialization || editProfileData.specialization.trim() === '' || !editProfileData.fullName || editProfileData.fullName.trim() === ''" class="flex-1 py-3.5 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50">
              {{ isSaving ? t[lang].saving : t[lang].saveBtn }}
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="w-64 bg-[#130E35] text-white flex flex-col fixed h-screen z-40 hidden lg:flex">
        <div class="p-6 flex items-center gap-3 border-b border-white/10">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-xl">F</div>
          <span class="font-bold text-lg tracking-wide">{{ t[lang].brand }}</span>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div class="text-xs uppercase tracking-wider text-white/40 px-3 mb-2">{{ t[lang].menu }}</div>
          <a (click)="switchTab('dashboard')" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'dashboard', 'text-white/70 hover:bg-white/5': activeTab !== 'dashboard'}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">🏠 {{ t[lang].dashboard }}</a>
          <a (click)="switchTab('courses')" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'courses', 'text-white/70 hover:bg-white/5': activeTab !== 'courses'}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">📚 {{ t[lang].myCourses }}</a>
          <a (click)="switchTab('students')" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'students', 'text-white/70 hover:bg-white/5': activeTab !== 'students'}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">👥 {{ t[lang].students }}</a>
          <a (click)="switchTab('schedule')" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'schedule', 'text-white/70 hover:bg-white/5': activeTab !== 'schedule'}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">📅 {{ t[lang].schedule }}</a>
          
          <div class="text-xs uppercase tracking-wider text-white/40 px-3 mt-6 mb-2">{{ t[lang].account }}</div>
          
          <a (click)="openSettings()" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium text-sm transition cursor-pointer">⚙️ {{ t[lang].accountSettings }}</a>
          <button (click)="logout()" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-indigo-300 hover:bg-indigo-500/10 font-medium text-sm transition w-full text-start cursor-pointer">🚪 {{ t[lang].logout }}</button>
        </nav>
        <div class="p-4 border-t border-white/10">
          <div class="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <img [src]="userData?.profileImage ? 'http://localhost:5162' + userData.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + (userData?.username || 'Teacher'))" class="w-9 h-9 rounded-full bg-white/10 object-cover" />
            <div class="min-w-0">
              <p class="text-sm font-semibold truncate">{{ userData?.username || 'Loading...' }}</p>
              <p class="text-xs text-indigo-300 truncate">{{ userData?.specialization || t[lang].teacher }}</p>
            </div>
          </div>
        </div>
      </aside>
      
      <!-- Main Content -->
      <div class="flex-1 ltr:lg:ml-64 rtl:lg:mr-64 min-h-screen flex flex-col">
        <header *ngIf="!(activeTab === 'courses' && showCreateForm) && !(activeTab === 'schedule' && showEventForm)" class="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between gap-4">
          <div class="flex items-center flex-1 gap-6">
            <h2 class="text-lg font-bold text-slate-800 lg:hidden">{{ t[lang].brand }}</h2>
            <div class="relative hidden sm:block w-full max-w-md">
              <span class="absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400">🔍</span>
              <input type="text" [(ngModel)]="searchQuery" [placeholder]="lang === 'ar' ? 'ابحث...' : 'Search...'" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all dir-ltr text-left">
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button (click)="toggleLang()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition whitespace-nowrap">
              {{ lang === 'ar' ? 'English' : 'عربي' }}
            </button>

            <div class="relative notification-container">
              <button (click)="toggleNotifications()" class="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition">
                🔔 <span *ngIf="unreadCount > 0" class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
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
                  <div *ngFor="let notif of notifications; trackBy: trackById" (click)="markAsRead(notif)" 
                       [ngClass]="{'bg-indigo-50/40': !notif.isRead}"
                       class="p-4 hover:bg-slate-50 transition cursor-pointer flex items-start justify-between gap-3 group">
                    <div class="flex-1 min-w-0" dir="auto" style="unicode-bidi: plaintext; text-align: start;">
                      <p class="font-bold text-xs text-slate-900 break-words whitespace-normal" *ngIf="notif.title">{{ notif.title }}</p>
                      <p class="text-xs mt-1 break-words whitespace-normal" [ngClass]="!notif.isRead ? 'font-bold text-slate-900' : 'font-normal text-slate-600'" style="line-height: 1.4;">{{ getNotificationText(notif.message) }}</p>
                      <span class="text-[10px] text-slate-400 mt-2 block">{{ notif.createdAt | date:'short' }}</span>
                    </div>
                    <button (click)="deleteNotification(notif.id, $event)" class="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1" title="مسح">
                      ✖️
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

        <main class="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          
          <!-- DASHBOARD TAB -->
          <ng-container *ngIf="activeTab === 'dashboard'">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 class="text-2xl lg:text-3xl font-extrabold text-slate-900">{{ t[lang].welcome }}, {{ userData?.username || 'Instructor' }} 👋</h1>
                <p class="text-slate-500 mt-1">{{ t[lang].streak }}</p>
              </div>
              
              <div class="flex items-center gap-3">
                <button (click)="openCreateCourse()" class="px-5 py-2.5 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg text-sm flex items-center gap-2">
                  + {{ t[lang].createCourse }}
                </button>
              </div>
            </div>

            <!-- Top Number Metrics -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].totalStudents }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35]">{{ totalStudentsCount }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm text-xl">👥</div>
                </div>
              </div>
              
              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].activeCourses }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35]">{{ courses.length }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm text-xl">📚</div>
                </div>
              </div>

              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].totalQuizzes }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35]">{{ totalQuizzesCount }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm text-xl">📝</div>
                </div>
              </div>

              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].totalLessons }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35]">{{ totalLessonsCount }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm text-xl">🎬</div>
                </div>
              </div>
            </div>

            <!-- Revenue, Growth, Rating Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
                <div class="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div class="flex items-center justify-between mb-4 relative z-10">
                  <h3 class="font-bold text-emerald-50">{{ t[lang].totalRevenue }}</h3>
                  <span class="p-2 bg-white/20 rounded-lg text-xl backdrop-blur-sm">💰</span>
                </div>
                <div class="relative z-10" *ngIf="!isLoadingDashboard">
                  <p class="text-4xl font-black mb-1 flex items-baseline gap-1">
                    {{ totalRevenue | number }} <span class="text-lg font-bold text-emerald-100">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                  </p>
                  <p class="text-sm text-emerald-100 font-medium mt-2 flex items-center gap-1">
                    <span class="bg-emerald-400/30 px-2 py-0.5 rounded-md text-white">+{{ monthlyRevenue | number }}</span> {{ t[lang].thisMonth }}
                  </p>
                </div>
                <div *ngIf="isLoadingDashboard" class="relative z-10 space-y-3">
                  <div class="h-10 w-32 bg-emerald-400/50 rounded animate-pulse"></div>
                  <div class="h-4 w-48 bg-emerald-400/50 rounded animate-pulse mt-2"></div>
                </div>
              </div>

              <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-center">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-bold text-slate-500">{{ t[lang].studentGrowth }}</h3>
                  <span class="p-2 bg-blue-50 text-blue-600 rounded-lg text-xl">📈</span>
                </div>
                <div *ngIf="!isLoadingDashboard">
                  <p class="text-3xl font-black text-slate-900 mb-1 flex items-center gap-2">
                    <span *ngIf="studentGrowth > 0">+</span>{{ studentGrowth }}% 
                    <svg *ngIf="studentGrowth >= 0" class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    <svg *ngIf="studentGrowth < 0" class="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>
                  </p>
                  <p class="text-sm text-slate-400 font-medium mt-1">{{ t[lang].increaseLastMonth }}</p>
                </div>
                <div *ngIf="isLoadingDashboard" class="space-y-3">
                  <div class="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
                  <div class="h-4 w-40 bg-slate-100 rounded animate-pulse mt-2"></div>
                </div>
              </div>

              <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-center">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-bold text-slate-500">{{ t[lang].instructorRating }}</h3>
                  <span class="p-2 bg-amber-50 text-amber-500 rounded-lg text-xl">⭐</span>
                </div>
                <div *ngIf="!isLoadingDashboard">
                  <div class="flex items-end gap-3 mt-2">
                    <p class="text-5xl font-black text-slate-900">{{ instructorRating }}</p>
                    <p class="text-base text-slate-400 font-bold mb-1">/ 5.0</p>
                  </div>
                  <div class="flex gap-1 mt-3">
                    <span *ngFor="let star of [1,2,3,4,5]; trackBy: trackById" class="text-amber-400 text-lg" [class.opacity-30]="star > instructorRating">★</span>
                  </div>
                </div>
                <div *ngIf="isLoadingDashboard" class="space-y-4 mt-2">
                  <div class="h-10 w-24 bg-slate-200 rounded animate-pulse"></div>
                  <div class="flex gap-1"><div *ngFor="let i of [1,2,3,4,5]; trackBy: trackById" class="h-5 w-5 bg-slate-200 rounded-full animate-pulse"></div></div>
                </div>
              </div>
            </div>

            <!-- Live Sessions row now appears BEFORE the Chart -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <h2 class="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>🔴</span> {{ t[lang].liveSessions }}
                </h2>
                <span *ngIf="isLiveActive" class="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 flex items-center gap-1.5">
                  <span class="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span> {{ t[lang].liveNow }}
                </span>
              </div>

              <div *ngIf="!isLiveActive" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <select [(ngModel)]="selectedCourseForLive" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-semibold text-slate-700">
                  <option [ngValue]="null" disabled>{{ lang === 'ar' ? 'اختر الكورس لبدء البث...' : 'Select course to start live...' }}</option>
                  <option *ngFor="let c of courses; trackBy: trackById" [ngValue]="c">{{ c.title }}</option>
                </select>
                <input type="url" [(ngModel)]="meetUrlInput" placeholder="Meeting URL (Zoom, Google Meet...)" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition dir-ltr text-left">
                <button (click)="startLiveSession()" [disabled]="!selectedCourseForLive || !meetUrlInput" class="w-full py-3 bg-[#130E35] disabled:bg-slate-300 disabled:text-slate-500 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-sm">
                  {{ t[lang].startSession }}
                </button>
              </div>

              <div *ngIf="isLiveActive" class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">{{ lang === 'ar' ? 'جلسة بث نشطة حالياً' : 'Active live session' }}</p>
                  <p class="text-base font-extrabold text-slate-900 mt-0.5">{{ activeLiveTitle }}</p>
                </div>
                <div class="flex gap-3 w-full sm:w-auto">
                  <button (click)="openActiveMeeting()" class="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
                    🔗 {{ lang === 'ar' ? 'فتح البث' : 'Open Room' }}
                  </button>
                  <button (click)="endLiveSession()" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2">
                    🛑 {{ lang === 'ar' ? 'إنهاء البث' : 'End Session' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- New Assignments Chart Section with Timeframe Controls & Skeleton -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h3 class="font-bold text-lg text-slate-900 flex items-center gap-2">
                  📊 {{ lang === 'ar' ? 'نشاط الطلاب' : 'Assignments & Activity' }}
                </h3>
                <div class="flex items-center gap-2">
                   <select [(ngModel)]="selectedChartTimeframe" (change)="onTimeframeChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="7days">{{ lang === 'ar' ? 'أخر 7 أيام' : 'Last 7 Days' }}</option>
                      <option value="30days">{{ lang === 'ar' ? 'أخر 30 يوم' : 'Last 30 Days' }}</option>
                      <option value="1year">{{ lang === 'ar' ? 'أخر 12 شهر' : 'Last 12 Months' }}</option>
                    </select>
                </div>
              </div>
              
              <!-- Chart Skeleton Loader -->
              <div *ngIf="isLoadingDashboard" class="w-full h-[300px] bg-slate-50 rounded-xl border border-slate-100 flex items-end justify-between p-4 gap-2">
                 <div *ngFor="let h of [10, 30, 20, 50, 40, 70, 60, 80, 50, 90, 70, 100]; trackBy: trackById" [style.height.%]="h" class="flex-1 bg-slate-200 rounded-t-sm animate-pulse"></div>
              </div>

              <!-- Actual Chart -->
              <div *ngIf="!isLoadingDashboard" class="w-full h-[300px] relative">
                <canvas id="assignmentsChart"></canvas>
              </div>
            </div>

            <!-- Transactions & Activity Feed Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <!-- Recent Transactions Box -->
              <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="font-bold text-lg text-slate-900 flex items-center gap-2">
                    💳 {{ t[lang].recentTransactions }}
                  </h3>
                  <div class="flex items-center gap-2" *ngIf="!isLoadingDashboard">
                    <select [(ngModel)]="selectedTransactionMonth" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="all">{{ lang === 'ar' ? 'كل الشهور' : 'All Months' }}</option>
                      <option value="1">{{ lang === 'ar' ? 'يناير' : 'Jan' }}</option>
                      <option value="2">{{ lang === 'ar' ? 'فبراير' : 'Feb' }}</option>
                      <option value="3">{{ lang === 'ar' ? 'مارس' : 'Mar' }}</option>
                      <option value="4">{{ lang === 'ar' ? 'أبريل' : 'Apr' }}</option>
                      <option value="5">{{ lang === 'ar' ? 'مايو' : 'May' }}</option>
                      <option value="6">{{ lang === 'ar' ? 'يونيو' : 'Jun' }}</option>
                      <option value="7">{{ lang === 'ar' ? 'يوليو' : 'Jul' }}</option>
                      <option value="8">{{ lang === 'ar' ? 'أغسطس' : 'Aug' }}</option>
                      <option value="9">{{ lang === 'ar' ? 'سبتمبر' : 'Sep' }}</option>
                      <option value="10">{{ lang === 'ar' ? 'أكتوبر' : 'Oct' }}</option>
                      <option value="11">{{ lang === 'ar' ? 'نوفمبر' : 'Nov' }}</option>
                      <option value="12">{{ lang === 'ar' ? 'ديسمبر' : 'Dec' }}</option>
                    </select>
                    <button (click)="showAllTransactions = !showAllTransactions" class="text-xs font-bold text-indigo-600 hover:underline">
                       {{ showAllTransactions ? (lang === 'ar' ? 'عرض أقل' : 'View Less') : (lang === 'ar' ? 'عرض الكل' : 'View All') }}
                    </button>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto pr-2">
                  <table class="w-full text-left rtl:text-right border-collapse whitespace-nowrap">
                    <thead class="sticky top-0 bg-white z-10">
                      <tr class="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                        <th class="pb-3 font-bold">{{ t[lang].studentName }}</th>
                        <th class="pb-3 font-bold">{{ t[lang].course }}</th>
                        <th class="pb-3 font-bold">{{ t[lang].amount }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                      <!-- Skeleton Loader for Transactions -->
                      <ng-container *ngIf="isLoadingDashboard">
                        <tr *ngFor="let i of [1,2,3,4,5]; trackBy: trackById">
                          <td class="py-4"><div class="h-4 bg-slate-200 rounded w-24 animate-pulse"></div><div class="h-2 bg-slate-100 rounded w-16 mt-2 animate-pulse"></div></td>
                          <td class="py-4"><div class="h-3 bg-slate-100 rounded w-32 animate-pulse"></div></td>
                          <td class="py-4"><div class="h-5 bg-slate-200 rounded w-16 animate-pulse"></div></td>
                        </tr>
                      </ng-container>

                      <!-- Actual Data -->
                      <ng-container *ngIf="!isLoadingDashboard">
                        <tr *ngFor="let tr of filteredRecentTransactions; trackBy: trackById" class="hover:bg-slate-50 transition">
                          <td class="py-3 text-sm font-bold text-slate-800">{{ tr.studentName }}
                            <span class="block text-[10px] text-slate-400">{{ tr.date | date:'MMM d, y' }}</span>
                          </td>
                          <td class="py-3 text-xs text-slate-500 font-medium">{{ tr.courseTitle }}</td>
                          <td class="py-3">
                            <span *ngIf="tr.amount > 0" class="text-sm font-black text-emerald-600">+{{ tr.amount }} <span class="text-xs">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span></span>
                            <span *ngIf="tr.amount === 0" class="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">{{ lang === 'ar' ? 'مجاني' : 'Free' }}</span>
                          </td>
                        </tr>
                        <tr *ngIf="filteredRecentTransactions.length === 0">
                          <td colspan="3" class="py-8 text-center">
                             <span class="text-3xl block mb-2 opacity-50">📭</span>
                             <p class="text-xs text-slate-400 font-medium">{{ lang === 'ar' ? 'لا توجد معاملات مطابقة لعوامل التصفية.' : 'No transactions found for these filters.' }}</p>
                          </td>
                        </tr>
                      </ng-container>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Activity Feed Box -->
              <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="font-bold text-lg text-slate-900 flex items-center gap-2">
                    ⚡ {{ t[lang].activityFeed }}
                  </h3>
                  <div class="flex items-center gap-2" *ngIf="!isLoadingDashboard">
                    <select [(ngModel)]="selectedActivityMonth" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="all">{{ lang === 'ar' ? 'كل الشهور' : 'All Months' }}</option>
                      <option value="1">{{ lang === 'ar' ? 'يناير' : 'Jan' }}</option>
                      <option value="2">{{ lang === 'ar' ? 'فبراير' : 'Feb' }}</option>
                      <option value="3">{{ lang === 'ar' ? 'مارس' : 'Mar' }}</option>
                      <option value="4">{{ lang === 'ar' ? 'أبريل' : 'Apr' }}</option>
                      <option value="5">{{ lang === 'ar' ? 'مايو' : 'May' }}</option>
                      <option value="6">{{ lang === 'ar' ? 'يونيو' : 'Jun' }}</option>
                      <option value="7">{{ lang === 'ar' ? 'يوليو' : 'Jul' }}</option>
                      <option value="8">{{ lang === 'ar' ? 'أغسطس' : 'Aug' }}</option>
                      <option value="9">{{ lang === 'ar' ? 'سبتمبر' : 'Sep' }}</option>
                      <option value="10">{{ lang === 'ar' ? 'أكتوبر' : 'Oct' }}</option>
                      <option value="11">{{ lang === 'ar' ? 'نوفمبر' : 'Nov' }}</option>
                      <option value="12">{{ lang === 'ar' ? 'ديسمبر' : 'Dec' }}</option>
                    </select>
                    <button (click)="showAllActivities = !showAllActivities" class="text-xs font-bold text-indigo-600 hover:underline">
                      {{ showAllActivities ? (lang === 'ar' ? 'عرض أقل' : 'View Less') : (lang === 'ar' ? 'عرض الكل' : 'View All') }}
                    </button>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto relative rtl:pr-4 ltr:pl-4 border-l-2 rtl:border-r-2 rtl:border-l-0 border-slate-100 space-y-6">
                  
                  <!-- Skeleton Loader for Activity Feed -->
                  <ng-container *ngIf="isLoadingDashboard">
                    <div *ngFor="let i of [1,2,3,4,5]; trackBy: trackById" class="relative flex gap-4 mt-2">
                       <div class="absolute -left-[26px] rtl:-right-[26px] rtl:left-auto top-1 w-4 h-4 rounded-full border-4 border-white bg-slate-200 animate-pulse"></div>
                       <div class="flex-1 space-y-2 rtl:mr-2 ltr:ml-2">
                          <div class="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                          <div class="h-3 bg-slate-100 rounded w-1/3 animate-pulse"></div>
                       </div>
                    </div>
                  </ng-container>

                  <!-- Actual Data -->
                  <ng-container *ngIf="!isLoadingDashboard">
                    <div *ngFor="let feed of filteredActivityFeed; trackBy: trackById" class="relative">
                      <div class="absolute -left-[25px] rtl:-right-[25px] rtl:left-auto top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm"
                           [ngClass]="{'bg-indigo-500': feed.type === 'enroll', 'bg-emerald-500': feed.type === 'quiz', 'bg-blue-500': feed.type === 'lesson'}">
                      </div>
                      <div class="rtl:mr-2 ltr:ml-2">
                        <p class="text-sm font-bold text-slate-800 mb-0.5 leading-snug">
                          {{ lang === 'ar' ? feed.messageAr : feed.messageEn }}
                        </p>
                        <p class="text-[11px] text-slate-400 font-medium">{{ feed.date | date:'MMM d, y, h:mm a' }}</p>
                      </div>
                    </div>
                    
                    <div *ngIf="filteredActivityFeed.length === 0" class="py-8 text-center text-xs text-slate-400 border-0">
                       <span class="text-3xl block mb-2 opacity-50">📭</span>
                      <p class="text-xs text-slate-400 font-medium">{{ lang === 'ar' ? 'لا يوجد نشاط مطابق לעوامل التصفية.' : 'No activity found for these filters.' }}</p>
                    </div>
                  </ng-container>

                </div>
              </div>

            </div>

          </ng-container>

          <ng-container *ngIf="activeTab === 'courses'">
             <div *ngIf="!showCreateForm">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900">{{ t[lang].myPublished }}</h2>
                  <p class="text-slate-500 text-sm mt-1">{{ t[lang].manageCourses }}</p>
                </div>
                <button (click)="openCreateCourse()" class="px-5 py-2.5 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-sm text-sm">
                  + {{ t[lang].newCourseBtn }}
                </button>
              </div>

              <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div *ngFor="let i of [1,2,3,4]; trackBy: trackById" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col h-[280px]">
                  <div class="h-32 bg-slate-200 w-full"></div>
                  <div class="p-5 flex-1 flex flex-col gap-3">
                    <div class="h-5 bg-slate-200 rounded-md w-3/4 mb-1"></div>
                    <div class="h-4 bg-slate-200 rounded-md w-1/2 mb-4"></div>
                    <div class="h-10 bg-slate-200 rounded-xl w-full mt-auto"></div>
                  </div>
                </div>
              </div>

              <div *ngIf="!isLoading && courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div *ngFor="let c of filteredCourses; trackBy: trackById" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group">
                  <div class="h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img *ngIf="c.coverImageUrl" [src]="c.coverImageUrl" class="w-full h-full object-cover">
                    <span *ngIf="!c.coverImageUrl" class="text-4xl font-bold text-slate-300">{{ c.title.substring(0,2) | uppercase }}</span>
                    </div>
                  <div class="p-5 flex-1 flex flex-col">
                    <div class="flex justify-between items-start mb-1 gap-2">
                      <h3 class="font-bold text-lg text-slate-900 line-clamp-1 flex-1">{{ c.title }}</h3>
                      <div class="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg shrink-0" [title]="lang === 'ar' ? 'تقييم الكورس' : 'Course Rating'">
                        <span class="text-amber-500 text-sm">★</span>
                        <span class="text-sm font-bold text-amber-700">{{ c.rating || '0.0' }}</span>
                      </div>
                    </div>
                    <p class="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{{ c.description }}</p>
                    <div class="flex gap-2 mt-auto">
                      <button (click)="onViewCourse(c)" class="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition shadow-sm">{{ t[lang].view }}</button>
                      <button (click)="openDeleteModal(c.id)" class="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-sm font-bold transition shadow-sm">{{ t[lang].deleteCourseBtn }}</button>
                    </div>
                  </div>
                </div>

                <div *ngIf="filteredCourses.length === 0 && courses.length > 0" class="col-span-full bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">{{ t[lang].noSearchResults }}</div>
              </div>

              <!-- EMPTY STATE: NO COURSES PUBLISHED -->
              <div *ngIf="courses.length === 0 && !isLoading" class="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center animate-fade-in mt-6">
                <span class="text-5xl block mb-4">📚</span>
                <p class="text-slate-500 font-semibold text-lg">{{ lang === 'ar' ? 'لم تقم بنشر أي كورسات حتى الآن.' : 'No courses published yet.' }}</p>
              </div>

            </div>

            <div *ngIf="showCreateForm" class="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 lg:p-10 relative overflow-hidden animate-fade-in">
              <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
              <div class="flex items-center justify-between mb-8">
                <div>
                  <h3 class="font-extrabold text-2xl text-slate-900">{{ t[lang].createCourse }}</h3>
                  <p class="text-slate-500 text-sm mt-1">{{ t[lang].fillDetails }}</p>
                </div>
                <button (click)="cancelCreateCourse()" class="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition font-bold">✖</button>
              </div>
              <form [formGroup]="courseForm" (ngSubmit)="onSubmit()" class="space-y-5">
                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].courseTitle }}</label>
                  <input type="text" formControlName="title" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium">
                </div>
                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].desc }}</label>
                  <textarea formControlName="description" rows="4" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"></textarea>
                </div>

                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].courseType }}</label>
                  <div class="flex gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" formControlName="isFree" [value]="true" class="w-5 h-5 text-indigo-600 focus:ring-indigo-500">
                      <span class="font-bold text-slate-700">{{ t[lang].freeCourse }}</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" formControlName="isFree" [value]="false" class="w-5 h-5 text-indigo-600 focus:ring-indigo-500">
                      <span class="font-bold text-slate-700">{{ t[lang].paidCourse }}</span>
                    </label>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4" *ngIf="!courseForm.get('isFree')?.value">
                  <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].price }}</label>
                    <div class="relative">
                      <input type="number" formControlName="price" placeholder="0" class="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" style="direction: ltr;">
                      <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{{ lang === 'ar' ? 'جنيهاً' : 'L.E' }}</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].discount }}</label>
                    <div class="relative">
                      <input type="number" formControlName="discountPercentage" placeholder="0" class="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" style="direction: ltr;">
                      <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].uploadCover }}</label>
                  <div class="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-slate-50 transition cursor-pointer relative overflow-hidden group">
                    <input type="file" (change)="onFileSelected($event)" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                    <div *ngIf="!imagePreview" class="text-center pointer-events-none">
                      <span class="text-4xl block mb-2 group-hover:scale-110 transition-transform"></span>
                      <p class="text-sm font-bold text-indigo-600">{{ t[lang].clickToUpload }}</p>
                    </div>
                    <div *ngIf="imagePreview" class="w-full h-40 relative rounded-xl overflow-hidden pointer-events-none">
                      <img [src]="imagePreview" class="w-full h-full object-cover">
                      <div class="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-lg">✏️ {{ t[lang].changeImage }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex gap-3 pt-6">
                  <button type="button" (click)="cancelCreateCourse()" class="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition">{{ t[lang].cancel }}</button>
                  <button type="submit" [disabled]="!courseForm.valid || isSaving" class="flex-1 bg-[#130E35] text-white font-bold py-3.5 rounded-xl disabled:opacity-50 hover:bg-slate-800 transition shadow-lg">{{ isSaving ? t[lang].saving : t[lang].publishBtn }}</button>
                </div>
              </form>
            </div>
          </ng-container>
          <ng-container *ngIf="activeTab === 'students'">
            
            <div *ngIf="studentViewMode === 'select-course'" class="animate-fade-in">
              <div class="mb-6">
                <h2 class="text-2xl font-extrabold text-slate-900">{{ t[lang].selectCourseToView }}</h2>
                <p class="text-slate-500 text-sm mt-1">{{ t[lang].selectCourseDesc }}</p>
              </div>

              <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div *ngFor="let i of [1,2,3]; trackBy: trackById" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-pulse flex items-center gap-4">
                  <div class="w-14 h-14 rounded-xl bg-slate-200 shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div class="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
              </div>

              <div *ngIf="!isLoading && courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div *ngFor="let c of filteredCourses; trackBy: trackById" (click)="selectCourseForStudents(c)" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-4 group">
                  <div class="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center overflow-hidden shrink-0">
                    <img *ngIf="c.coverImageUrl" [src]="c.coverImageUrl" class="w-full h-full object-cover">
                    <span *ngIf="!c.coverImageUrl" class="text-xl font-bold text-indigo-300">{{ c.title.substring(0,2) | uppercase }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{{ c.title }}</h4>
                    <p class="text-xs text-slate-500 mt-1">{{ t[lang].clickToViewStudents }} →</p>
                  </div>
                </div>
              </div>

              <!-- EMPTY STATE: NO COURSES TO SELECT -->
              <div *ngIf="courses.length === 0 && !isLoading" class="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center animate-fade-in mt-6">
                <span class="text-5xl block mb-4">👥</span>
                <p class="text-slate-500 font-semibold text-lg">
                  {{ lang === 'ar' ? 'لم تقم بنشر أي كورسات حتى الآن لعرض طلابها.' : 'You haven\\'t published any courses yet to view students.' }}
                </p>
              </div>

            </div>

            <div *ngIf="studentViewMode === 'select-student'" class="animate-fade-in">
              <div class="flex items-center gap-4 mb-6">
                <button (click)="goBackToCourseSelection()" class="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition text-slate-600">
                  <span class="rtl:rotate-180">←</span>
                </button>
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900">{{ t[lang].enrolledStudents }}</h2>
                  <p class="text-slate-500 text-sm mt-1">{{ t[lang].inCourse }}: <span class="font-semibold text-indigo-600">{{ selectedCourse?.title }}</span></p>
                </div>
              </div>

              <div *ngIf="isLoadingStudents" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div *ngFor="let i of [1,2,3,4]; trackBy: trackById" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-pulse flex items-center gap-3.5">
                  <div class="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-3 bg-slate-200 rounded w-full"></div>
                    <div class="h-2 bg-slate-100 rounded w-2/3"></div>
                  </div>
                </div>
              </div>

              <div *ngIf="!isLoadingStudents" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div *ngFor="let student of filteredStudents; trackBy: trackById" (click)="selectStudentDetails(student)" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex items-center gap-3.5 group">
                  <img [src]="student.profileImage ? 'http://localhost:5162' + student.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + student.name)" class="w-12 h-12 rounded-full bg-slate-100 object-cover border border-slate-100 shrink-0">
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{{ student.name }}</p>
                    <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      {{ student.phoneNumber?.split(' ')[0] || '📞' }} <span class="font-medium dir-ltr text-left">{{ student.phoneNumber?.split(' ')[1] || 'No Phone' }}</span>
                    </p>
                    <p class="text-[11px] text-emerald-600 font-semibold mt-1">{{ t[lang].viewResults }}</p>
                  </div>
                </div>
                
                <div *ngIf="enrolledStudents.length === 0" class="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
                  <span class="text-4xl block mb-2">📭</span>
                  <p class="text-slate-500 font-semibold">{{ t[lang].noStudentsEnrolled }}</p>
                  </div>
                <div *ngIf="filteredStudents.length === 0 && enrolledStudents.length > 0" class="col-span-full py-12 text-center text-slate-500">{{ t[lang].noSearchResults }}</div>
              </div>
            </div>

            <div *ngIf="studentViewMode === 'student-details'" class="animate-fade-in">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                  <button (click)="goBackToStudentSelection()" class="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition text-slate-600">
                    <span class="rtl:rotate-180">←</span>
                  </button>
                  <div class="flex items-center gap-3">
                    <img [src]="selectedStudent?.profileImage ? 'http://localhost:5162' + selectedStudent.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + selectedStudent?.name)" class="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 object-cover">
                    <div>
                      <h2 class="text-xl font-extrabold text-slate-900">{{ selectedStudent?.name }}</h2>
                      <p class="text-slate-500 text-xs mt-1">{{ selectedCourse?.title }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="isLoadingStudents" class="space-y-4 animate-pulse">
                <div *ngFor="let i of [1,2]; trackBy: trackById" class="h-20 bg-slate-200 rounded-2xl"></div>
              </div>

              <div class="space-y-4" *ngIf="!isLoadingStudents && filteredStudentResults.length > 0">
                <div *ngFor="let group of filteredStudentResults; trackBy: trackById" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all">
                  
                  <div (click)="group.expanded = !group.expanded" class="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
                    <div class="flex items-center gap-4">
                       <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">📄</div>
                       <div>
                         <h3 class="font-bold text-slate-800 text-base">{{ group.lessonTitle }}</h3>
                         <div class="flex gap-3 mt-1">
                           <p *ngIf="group.attempts.length > 0" class="text-xs text-slate-500 font-semibold">{{ group.attempts.length }} {{ t[lang].attemptsText }}</p>
                           <p *ngIf="group.assignment && group.assignment.givenScore === null" class="text-xs text-amber-600 font-bold flex items-center gap-1">⏳ {{ lang === 'ar' ? 'يحتاج للتقييم' : 'Needs Grading' }}</p>
                           <p *ngIf="group.assignment && group.assignment.givenScore !== null" class="text-xs text-emerald-600 font-bold flex items-center gap-1">✅ {{ lang === 'ar' ? 'تم التقييم' : 'Graded' }}</p>
                         </div>
                       </div>
                    </div>
                    <button class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-transform" [ngClass]="{'rotate-180': group.expanded}">▼</button>
                  </div>
                  
                  <div *ngIf="group.expanded" class="border-t border-slate-100 bg-slate-50/50 p-5 animate-fade-in">
                     
                     <div *ngIf="group.attempts.length > 0" class="overflow-x-auto">
                       <h4 class="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                         <span>🎯</span> {{ lang === 'ar' ? 'نتائج الاختبار (Quiz)' : 'Quiz Results' }}
                       </h4>
                       <table class="w-full text-left rtl:text-right border-collapse whitespace-nowrap">
                       <thead>
                           <tr class="text-slate-500 text-xs border-b border-slate-200">
                             <th class="pb-3 font-bold">{{ t[lang].attemptNo }}</th>
                             <th class="pb-3 font-bold">{{ t[lang].score }}</th>
                             <th class="pb-3 font-bold">{{ t[lang].date }}</th>
                           </tr>
                         </thead>
                         <tbody>
                           <tr *ngFor="let res of group.attempts" class="border-b border-slate-100 last:border-0">
                             <td class="py-3 text-sm font-bold text-slate-700">#{{ res.attemptNumber }}</td>
                             <td class="py-3">
                               <span class="px-2.5 py-1.5 rounded-lg text-xs font-bold" [ngClass]="res.score >= (res.totalQuestions / 2) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                                 {{ res.score }} / {{ res.totalQuestions }}
                               </span>
                             </td>
                             <td class="py-3 text-sm font-medium text-slate-500">{{ res.date | date:'shortDate' }}</td>
                           </tr>
                         </tbody>
                       </table>
                     </div>

                     <div *ngIf="group.attempts.length === 0 && !group.assignment" class="text-sm text-slate-500 text-center py-4 font-medium">
                        {{ lang === 'ar' ? 'لم يقم الطالب بأي نشاط في هذا الدرس حتى الآن.' : 'No activity recorded for this lesson yet.' }}
                     </div>

                     <div *ngIf="group.assignment" class="mt-6 pt-6 border-t border-slate-200">
                        <div class="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm">
                          <h4 class="font-bold text-slate-800 flex items-center gap-2">
                            <span class="text-lg">📝</span> {{ lang === 'ar' ? 'حل الواجب (Assignment)' : 'Assignment Submission' }}
                          </h4>
                          <span *ngIf="group.assignment.givenScore === null" class="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-bold shadow-sm">
                            ⏳ {{ lang === 'ar' ? 'يحتاج للتقييم' : 'Needs Grading' }}
                          </span>
                          <span *ngIf="group.assignment.givenScore !== null" class="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold shadow-sm">
                            ✅ {{ lang === 'ar' ? 'تم التقييم' : 'Graded' }}
                          </span>
                        </div>
                        
                        <div class="space-y-4 mb-6">
                          <div *ngFor="let q of group.assignment.answers; let i = index" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
                            <div class="absolute top-4 rtl:left-4 ltr:right-4">
                              <span *ngIf="q.type === 'mcq'" class="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md">{{ lang === 'ar' ? 'اختياري (تلقائي)' : 'MCQ (Auto)' }}</span>
                              <span *ngIf="q.type !== 'mcq'" class="text-[10px] font-bold px-2 py-1 bg-purple-50 text-purple-600 rounded-md">{{ lang === 'ar' ? 'مقالي (للتقييم)' : 'Essay (Manual)' }}</span>
                            </div>
                            <p class="text-sm font-bold text-slate-800 mb-3 pr-24 rtl:pl-24 ltr:pr-24">{{ lang === 'ar' ? 'س' : 'Q' }}{{ i+1 }}: {{ q.question }}</p>
                            <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 font-medium">
                              {{ q.answer }}
                            </div>
                            <div *ngIf="q.type === 'mcq'" class="mt-3 flex items-center gap-2">
                              <span *ngIf="q.score > 0" class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                ✔ {{ lang === 'ar' ? 'إجابة صحيحة' : 'Correct Answer' }} ({{ q.score }}/1)
                              </span>
                              <span *ngIf="q.score === 0" class="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                                ❌ {{ lang === 'ar' ? 'إجابة خاطئة' : 'Incorrect Answer' }} (0/1)
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div class="flex items-center justify-between bg-white p-4 lg:px-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                          <p class="text-sm font-bold text-slate-500 hidden sm:block">{{ lang === 'ar' ? 'التقييم النهائي للواجب المقالي:' : 'Final Assignment Grade:' }}</p>
                          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <div class="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                              <span class="px-3 py-2 text-sm font-bold text-slate-600 bg-slate-100 border-l border-slate-200">{{ lang === 'ar' ? 'الدرجة:' : 'Score:' }}</span>
                              <input type="number" [(ngModel)]="group.assignment.givenScore" placeholder="-" class="w-16 px-2 py-2 bg-white focus:outline-none text-center font-black text-indigo-600">
                              <span class="px-3 py-2 text-slate-400 font-bold bg-slate-50 border-r border-slate-200">/ {{ group.assignment.totalScore }}</span>
                            </div>
                            <button (click)="saveAssignmentGrade(group.assignment)" [disabled]="isSaving" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition shadow-md shadow-emerald-200 flex items-center gap-2 disabled:opacity-50">
                              <span>{{ isSaving ? '⏳' : '💾' }}</span> {{ isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ' : 'Save') }}
                            </button>
                          </div>
                        </div>
                     </div>

                  </div>
                </div>
              </div>
              
              <div *ngIf="!isLoadingStudents && filteredStudentResults.length === 0" class="py-12 text-center text-slate-500 font-medium">
                {{ t[lang].noSearchResults }}
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="activeTab === 'schedule'">
            <!-- Schedule content remains exactly the same... -->
            <div *ngIf="!showEventForm">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900">{{ t[lang].schedule }} 📅</h2>
                </div>
                <button (click)="openCreateEvent()" class="px-5 py-2.5 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-sm text-sm">
                  + {{ lang === 'ar' ? 'حدث جديد' : 'New Event' }}
                </button>
              </div>

              <div *ngIf="isLoading" class="animate-pulse space-y-4">
                <div *ngFor="let i of [1,2,3]; trackBy: trackById" class="h-24 bg-slate-200 rounded-2xl"></div>
              </div>

              <div *ngIf="!isLoading" class="space-y-4 animate-fade-in">
                <div *ngFor="let ev of filteredEvents; trackBy: trackById" class="bg-white p-5 rounded-2xl border-l-4 shadow-sm flex items-center justify-between group"
                     [ngClass]="{'border-rose-500': ev.eventType==='Live', 'border-indigo-500': ev.eventType==='Deadline', 'border-emerald-500': ev.eventType==='General'}">
                   <div class="flex-1 min-w-0">
                      <span class="text-xs font-bold px-2.5 py-1 rounded-md"
                            [ngClass]="{'bg-rose-50 text-rose-700': ev.eventType==='Live', 'bg-indigo-50 text-indigo-700': ev.eventType==='Deadline', 'bg-emerald-50 text-emerald-700': ev.eventType==='General'}">
                            {{ ev.eventType }}
                      </span>
                      <h3 class="font-bold text-lg text-slate-900 mt-2 break-words whitespace-normal">{{ ev.title }}</h3>
                      <p class="text-sm text-slate-500 break-words whitespace-normal">{{ ev.courseTitle }} <span *ngIf="ev.description">- {{ ev.description }}</span></p>
                   </div>
                   <div class="flex items-center gap-4">
                     <div class="text-right rtl:text-left shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
                        <p class="font-black text-slate-800 text-xl">{{ ev.eventDate | date:'MMM d' }}</p>
                        <p class="text-sm text-slate-500 font-bold">{{ ev.eventDate | date:'shortTime' }}</p>
                     </div>
                     <button (click)="deleteEvent(ev.id)" class="w-10 h-10 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                       ✖
                     </button>
                   </div>
                </div>
                
                <div *ngIf="filteredEvents.length === 0" class="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                   <span class="text-5xl block mb-4">🗓️</span>
                   <p class="text-slate-500 font-semibold text-lg">{{ lang === 'ar' ? 'لا توجد أحداث أو مواعيد قادمة.' : 'No upcoming events scheduled.' }}</p>
                </div>
              </div>
            </div>

            <div *ngIf="showEventForm" class="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 lg:p-10 relative overflow-hidden animate-fade-in">
              <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
              <div class="flex items-center justify-between mb-8">
                <div>
                  <h3 class="font-extrabold text-2xl text-slate-900">{{ lang === 'ar' ? 'إضافة حدث للجدول' : 'Add Schedule Event' }}</h3>
                </div>
                <button (click)="cancelCreateEvent()" class="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition font-bold">✖</button>
              </div>
              <form [formGroup]="eventForm" (ngSubmit)="submitEvent()" class="space-y-5">
                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">{{ lang === 'ar' ? 'اختر الكورس' : 'Select Course' }}</label>
                  <select formControlName="courseId" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium">
                    <option value="" disabled>{{ lang === 'ar' ? 'اختر كورس...' : 'Select a course...' }}</option>
                    <option *ngFor="let c of courses; trackBy: trackById" [value]="c.id">{{ c.title }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">{{ lang === 'ar' ? 'عنوان الحدث' : 'Event Title' }}</label>
                  <input type="text" formControlName="title" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium">
                </div>
                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].desc }}</label>
                  <textarea formControlName="description" rows="3" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">{{ lang === 'ar' ? 'وقت وتاريخ الحدث' : 'Date & Time' }}</label>
                    <input type="datetime-local" formControlName="eventDate" [min]="minDate" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium dir-ltr text-left">
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">{{ lang === 'ar' ? 'نوع الحدث' : 'Event Type' }}</label>
                    <select formControlName="eventType" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium">
                      <option value="Live">{{ lang === 'ar' ? 'بث مباشر 🔴' : 'Live Session 🔴' }}</option>
                      <option value="Deadline">{{ lang === 'ar' ? 'موعد تسليم ⏰' : 'Deadline ⏰' }}</option>
                      <option value="General">{{ lang === 'ar' ? 'عام 📌' : 'General 📌' }}</option>
                    </select>
                  </div>
                </div>
                <div class="flex gap-3 pt-6">
                  <button type="button" (click)="cancelCreateEvent()" class="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition">{{ t[lang].cancel }}</button>
                  <button type="submit" [disabled]="!eventForm.valid || isSaving" class="flex-1 bg-[#130E35] text-white font-bold py-3.5 rounded-xl disabled:opacity-50 hover:bg-slate-800 transition shadow-lg">{{ isSaving ? t[lang].saving : t[lang].saveBtn }}</button>
                </div>
              </form>
            </div>
          </ng-container>

        </main>
      </div>
    </div>
  `
})
export class TeacherDashboardComponent implements OnInit {
  activeTab: string = 'dashboard';
  studentViewMode: string = 'select-course';

  showCreateForm = false;
  showEventForm = false;

  showAssignmentModal = false;
  assignmentData = { courseId: null, title: '', dueDate: '', questions: [''] };

  imagePreview: string | ArrayBuffer | null = null;
  courseForm: FormGroup;
  eventForm: FormGroup;
  message = '';
  messageType: 'success' | 'error' = 'success';
  showDeleteModal = false;
  courseToDeleteId: number | null = null;
  
  isLoading = true;
  isLoadingDashboard = true; 
  isLoadingTopMetrics = true;
  isLoadingStudents = false;
  
  searchQuery: string = '';
  minDate: string = '';

  showSettingsModal = false;
  showUnsavedModal = false;
  isSaving = false;

  editProfileData: any = { fullName: '', email: '', phone: '', countryCode: '+20', bio: '', profileImage: '', specialization: '', coverImage: '' };
  originalProfileData: string = '';

  courses: any[] = [];
  events: any[] = [];
  userData: any = null;

  selectedCourse: any = null;
  selectedStudent: any = null;
  enrolledStudents: any[] = [];
  totalStudentsCount: number = 0;
  totalQuizzesCount: number = 0;
  totalLessonsCount: number = 0;

  totalRevenue: number = 0;
  monthlyRevenue: number = 0;
  studentGrowth: number = 0;
  instructorRating: number = 0;
  recentTransactions: any[] = [];
  activityFeed: any[] = [];

  showAllTransactions = false;
  showAllActivities = false;
  
  selectedTransactionMonth: string = 'all';
  selectedActivityMonth: string = 'all';
  selectedChartTimeframe: string = '7days';

  groupedStudentResults: any[] = [];

  selectedCourseForLive: any = null;
  meetUrlInput: string = '';
  isLiveActive: boolean = false;
  activeLiveTitle: string = '';

  notifications: any[] = [];
  unreadCount: number = 0;
  showNotificationsDropdown: boolean = false;

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

  public chart: any;

  lang: 'en' | 'ar' = 'en';
  countries = [
    { code: '+20', flag: '🇪🇬', name: 'Egypt' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' }
  ];

  t = {
    en: {
      brand: 'Fluency First', menu: 'Main', dashboard: 'Dashboard', myCourses: 'My Courses',
      students: 'Students', schedule: 'Schedule', account: 'Account', accountSettings: 'Account Settings',
      logout: 'Log out', totalStudents: 'Total Students', activeCourses: 'Active Courses',
      totalQuizzes: 'Total Quizzes', totalLessons: 'Total Lessons',
      revenue: 'Total Revenue / XP', createCourse: 'Create New Course', fillDetails: 'Fill in the course details below.',
      courseTitle: 'Course Title', desc: 'Description', uploadCover: 'Course Cover Image', clickToUpload: 'Click to upload image',
      courseType: 'Course Type', freeCourse: 'Free', paidCourse: 'Paid',
      price: 'Monthly Price', discount: 'Discount %',
      changeImage: 'Change Image', publishBtn: 'Publish Course', myPublished: 'My Published Courses',
      noCourses: 'No courses published yet.', successMsg: 'Action completed successfully!',
      errorMsg: 'Error processing request.', welcome: 'Welcome back', streak: 'Keep up the great work!',
      teacher: 'Teacher', manageCourses: 'Manage your active courses and content.', newCourseBtn: 'New Course',
      view: 'View & Edit', deleteCourseBtn: 'Delete Course', cancel: 'Cancel', viewAll: 'View All', liveSessions: 'Live Sessions',
      newSession: 'New', startSession: 'Start Session', deleteConfirmTitle: 'Delete Course',
      deleteConfirmDesc: 'Are you sure you want to delete this entire course? This action cannot be undone.',
      confirmDeleteBtn: 'Yes, Delete', deleteSuccessMsg: 'Course deleted successfully!',
      selectCourseToView: 'Select a Course', selectCourseDesc: 'Choose a course to view its enrolled students and their quiz results.',
      clickToViewStudents: 'View Enrolled Students', enrolledStudents: 'Enrolled Students', inCourse: 'In Course',
      noStudentsEnrolled: 'No students have enrolled in this course yet.',
      viewResults: 'View Quiz Results', noStudentsFound: 'No students enrolled in this course yet.',
      lessonTitle: 'Lesson', attemptNo: 'Attempt', score: 'Score', date: 'Date', noSearchResults: 'No matching results found.',
      attemptsText: 'Attempts', specialization: 'Specialization', specPlaceholder: 'e.g. Arabic Teacher',
      change: 'Change', fullName: 'Full Name', email: 'Email Address', emailCantChange: "Email cannot be changed.",
      phone: 'Phone Number', bio: 'Bio / About me', bioPlaceholder: 'Write a short bio about yourself...',
      saveBtn: 'Save Changes', saving: 'Saving...',
      unsavedTitle: 'Unsaved Changes', unsavedDesc: 'You have modified your profile. Are you sure you want to discard these changes without saving?',
      stayBtn: 'No, stay here', discardBtn: 'Yes, discard', liveNow: 'Live Now',
      notificationsTitle: 'Notifications', unreadText: 'unread', noNotifications: 'No new notifications',
      addEvent: 'New Event', totalRevenue: 'Total Revenue', thisMonth: 'this month',
      studentGrowth: 'Student Growth', increaseLastMonth: 'Increase from last month',
      instructorRating: 'Instructor Rating', recentTransactions: 'Recent Transactions',
      studentName: 'Student Name', course: 'Course', amount: 'Amount', activityFeed: 'Activity Feed'
    },
    ar: {
      brand: 'Fluency First', menu: 'القائمة الرئيسية', dashboard: 'الرئيسية', myCourses: 'إدارة الكورسات',
      students: 'الطلاب', schedule: 'الجدول', account: 'الحساب', accountSettings: 'إعدادات الحساب',
      logout: 'تسجيل خروج', totalStudents: 'إجمالي الطلاب', activeCourses: 'الكورسات النشطة',
      totalQuizzes: 'إجمالي الاختبارات', totalLessons: 'إجمالي الدروس',
      revenue: 'إجمالي العائد / النقاط', createCourse: 'إنشاء كورس جديد', fillDetails: 'قم بملء بيانات الكورس بالأسفل.',
      courseTitle: 'عنوان الكورس', desc: 'الوصف', uploadCover: 'صورة غلاف الكورس', clickToUpload: 'اضغط لرفع صورة',
      courseType: 'نوع الكورس', freeCourse: 'مجاني', paidCourse: 'مدفوع',
      price: 'سعر الاشتراك الشهري', discount: 'نسبة الخصم %',
      changeImage: 'تغيير الصورة', publishBtn: 'نشر الكورس', myPublished: 'الكورسات المنشورة',
      noCourses: 'لم تقم بنشر أي كورسات حتى الآن.', successMsg: 'تم الإجراء بنجاح!',
      errorMsg: 'حدث خطأ أثناء التنفيذ.', welcome: 'مرحباً بعودتك', streak: 'استمر في العمل الرائع!',
      teacher: 'معلم', manageCourses: 'إدارة الكورسات النشطة والمحتوى الخاص بك.', newCourseBtn: 'كورس جديد',
      view: 'عرض وتعديل', deleteCourseBtn: 'حذف الكورس', cancel: 'إلغاء', viewAll: 'عرض الكل', liveSessions: 'البث المباشر',
      newSession: 'جديد', startSession: 'بدء الجلسة', deleteConfirmTitle: 'حذف الكورس',
      deleteConfirmDesc: 'هل أنت متأكد من حذف الكورس بالكامل بجميع دروسه؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmDeleteBtn: 'نعم، احذف', deleteSuccessMsg: 'تم حذف الكورس بنجاح!',
      selectCourseToView: 'اختر الكورس', selectCourseDesc: 'اختر كورس لعرض الطلاب المشتركين فيه ونتائج اختباراتهم.',
      clickToViewStudents: 'عرض الطلاب المشتركين', enrolledStudents: 'الطلاب المشتركين', inCourse: 'في كورس',
      noStudentsEnrolled: 'لم يشترك أي طالب في هذا الكورس بعد.',
      viewResults: 'عرض نتائج الاختبارات', noStudentsFound: 'لا يوجد طلاب مشتركين في هذا الكورس بعد.',
      lessonTitle: 'الدرس', attemptNo: 'المحاولة', score: 'الدرجة', date: 'التاريخ', noSearchResults: 'لا توجد نتائج مطابقة.',
      attemptsText: 'محاولات', specialization: 'التخصص', specPlaceholder: 'مثال: أستاذ اللغة العربية',
      change: 'تغيير', fullName: 'الاسم بالكامل', email: 'البريد الإلكتروني', emailCantChange: "لا يمكن تغيير البريد الإلكتروني.",
      phone: 'رقم الهاتف', bio: 'نبذة عني', bioPlaceholder: 'اكتب نبذة مختصرة عنك...',
      saveBtn: 'حفظ التغييرات', saving: 'جاري الحفظ...',
      unsavedTitle: 'تغييرات لم تُحفظ', unsavedDesc: 'لقد قمت بتعديل بياناتك. هل أنت متأكد من رغبتك في الخروج دون حفظ؟',
      stayBtn: 'لا، البقاء هنا', discardBtn: 'نعم، تجاهل التغييرات', liveNow: 'مباشر الآن',
      notificationsTitle: 'الإشعارات', unreadText: 'غير مقروء', noNotifications: 'لا توجد إشعارات جديدة',
      addEvent: 'حدث جديد', totalRevenue: 'إجمالي الإيرادات', thisMonth: 'هذا الشهر',
      studentGrowth: 'معدل نمو الطلاب', increaseLastMonth: 'زيادة عن الشهر الماضي',
      instructorRating: 'متوسط التقييم', recentTransactions: 'المعاملات الأخيرة',
      studentName: 'اسم الطالب', course: 'الكورس', amount: 'Amount', activityFeed: 'نشاط الطلاب'
    }
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public router: Router,
    private route: ActivatedRoute,
    private langService: LanguageService,
    private signalrService: SignalrService,
    private assignmentService: AssignmentService
  ) {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      isFree: [false],
      price: [0],
      discountPercentage: [0],
      coverImageUrl: ['']
    });

    this.eventForm = this.fb.group({
      courseId: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      eventDate: ['', Validators.required],
      eventType: ['Live', Validators.required]
    });
  }

  ngOnInit() {
    const role = localStorage.getItem('userRole');
    if (role !== 'Teacher' && role !== '1') {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
      return;
    }
    
    this.langService.currentLang$.subscribe((l: any) => {
      this.lang = l;
      if (this.activeTab === 'dashboard' && this.chart) {
        this.loadDashboardStats(); 
      }
    });

    // --- BROWSER HISTORY SYNC ---
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] || 'dashboard';
      
      this.activeTab = tab as string;
      
      // Reset sub-views
      this.showCreateForm = false;
      this.showEventForm = false;
      this.studentViewMode = 'select-course';

      if (tab === 'dashboard') {
         this.loadDashboardStats();
      }
      
      if (tab === 'schedule' && this.events.length === 0) {
         this.fetchSchedule();
      }

      if ((tab === 'courses' || tab === 'students') && this.courses.length === 0) {
         this.loadMyCourses();
      }
    });
    // ---------------------------

    this.fetchUserProfile();
    this.fetchNotifications();
    this.signalrService.startConnection();

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    this.minDate = now.toISOString().slice(0, 16);
  }

  switchTab(tab: string) {
    this.searchQuery = '';
    this.router.navigate([], { queryParams: { tab: tab } });
  }

  goBackToCourseSelection() {
    this.studentViewMode = 'select-course';
  }

  goBackToStudentSelection() {
    this.studentViewMode = 'select-student';
  }

  openCreateCourse() {
    this.imagePreview = null;
    this.courseForm.reset({ isFree: false, price: 0, discountPercentage: 0 });
    this.showCreateForm = true;
  }

  cancelCreateCourse() {
    this.showCreateForm = false;
  }

  openCreateEvent() {
    this.showEventForm = true;
    this.eventForm.reset({ eventType: 'Live' });
  }

  cancelCreateEvent() {
    this.showEventForm = false;
  }

  selectCourseForStudents(course: any) {
    this.selectedCourse = course;
    this.studentViewMode = 'select-student';
    this.loadStudentsForCourse(course.id);
  }

  selectStudentDetails(student: any) {
    this.selectedStudent = student;
    this.studentViewMode = 'student-details';
    this.loadStudentQuizResults(student.id, this.selectedCourse.id);
  }

  quickAction(actionType: 'course') {
    if (actionType === 'course') {
      this.openCreateCourse();
    }
  }

  trackById(index: number, item: any): any {
    return item.id || index;
  }

  get filteredRecentTransactions() {
    let filtered = this.recentTransactions;
    if (this.selectedTransactionMonth !== 'all') {
      filtered = filtered.filter(tr => {
        if (!tr.date) return true;
        const date = new Date(tr.date);
        return (date.getMonth() + 1).toString() === this.selectedTransactionMonth;
      });
    }
    return this.showAllTransactions ? filtered : filtered.slice(0, 5);
  }

  get filteredActivityFeed() {
    let filtered = this.activityFeed;
    if (this.selectedActivityMonth !== 'all') {
      filtered = filtered.filter(feed => {
        if (!feed.date) return true;
        const date = new Date(feed.date);
        return (date.getMonth() + 1).toString() === this.selectedActivityMonth;
      });
    }
    return this.showAllActivities ? filtered : filtered.slice(0, 5);
  }

  get filteredStudentResults() {
    if (!this.searchQuery) return this.groupedStudentResults;
    const q = this.searchQuery.toLowerCase();
    return this.groupedStudentResults.filter(g => 
      (g.lessonTitle && g.lessonTitle.toLowerCase().includes(q)) ||
      (g.assignment && g.assignment.title && g.assignment.title.toLowerCase().includes(q))
    );
  }

  onTimeframeChange() {
    this.loadDashboardStats();
  }

  loadDashboardStats() {
    if (this.totalRevenue === 0) this.isLoadingDashboard = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`http://localhost:5162/api/instructor/dashboard/stats?timeframe=${this.selectedChartTimeframe}`, { headers }).subscribe({
      next: (data) => {
        this.totalRevenue = data?.totalRevenue || 0;
        this.monthlyRevenue = data?.monthlyRevenue || 0;
        this.studentGrowth = data?.studentGrowth || 0;
        this.instructorRating = data?.instructorRating || 0;
        
        this.recentTransactions = data?.recentTransactions || [];
        this.activityFeed = data?.activityFeed || [];

        this.isLoadingDashboard = false;

        if (data?.chartData) {
          this.renderChart(data.chartData);
        }
      },
      error: () => {
        this.isLoadingDashboard = false;
      }
    });
  }

  renderChart(chartData: any) {
    setTimeout(() => {
      const canvas = document.getElementById('assignmentsChart') as HTMLCanvasElement;
      if (!canvas) return;
      
      if (this.chart) {
        this.chart.destroy();
      }
      
      this.chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: this.lang === 'ar' ? 'مسجلين (Ongoing)' : 'Ongoing',
              data: chartData.ongoing,
              borderColor: '#F59E0B',
              backgroundColor: '#F59E0B',
              tension: 0.1,
              borderWidth: 2
            },
            {
              label: this.lang === 'ar' ? 'تم التسليم (Submitted)' : 'Submitted',
              data: chartData.submitted,
              borderColor: '#10B981',
              backgroundColor: '#10B981',
              tension: 0.1,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                usePointStyle: true,
                boxWidth: 8
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMin: 0,
              grid: { color: '#f1f5f9' },
              border: { dash: [4, 4] }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }, 100);
  }

  openAssignmentModal() {
    this.assignmentData = { courseId: null, title: '', dueDate: '', questions: [''] };
    this.showAssignmentModal = true;
  }

  addAssignmentQuestion() {
    this.assignmentData.questions.push('');
  }

  removeAssignmentQuestion(index: number) {
    this.assignmentData.questions.splice(index, 1);
  }

  submitAssignment() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.showMessage(this.lang === 'ar' ? 'تم نشر الواجب بنجاح وإرسال إشعارات للطلاب!' : 'Assignment published successfully!', 'success');
    this.showAssignmentModal = false;
    this.assignmentData = { courseId: null, title: '', dueDate: '', questions: [''] };
  }

  saveAssignmentGrade(assign: any) {
    if (assign.givenScore === null || assign.givenScore === undefined) {
      this.showMessage(this.lang === 'ar' ? 'يرجى إدخال الدرجة أولاً.' : 'Please enter a score first.', 'error');
      return;
    }

    this.isSaving = true;
    
    this.assignmentService.gradeAssignment(assign.id, assign.givenScore).subscribe({
      next: () => {
        this.isSaving = false;
        this.showMessage(this.lang === 'ar' ? 'تم حفظ الدرجة بنجاح' : 'Grade saved successfully', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.showMessage(this.lang === 'ar' ? 'حدث خطأ أثناء حفظ الدرجة' : 'Error saving grade', 'error');
      }
    });
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
        const filteredData = data.filter(n => {
          const msg = n.message || '';
          if (msg.includes('بدأ المعلم') && msg.includes('بثاً مباشراً')) return false;
          if (msg.includes('started a live session')) return false;
          return true;
        });
        this.notifications = filteredData.map(n => {
          const dateStr = n.createdAt.endsWith('Z') ? n.createdAt : n.createdAt + 'Z';
          return { ...n, createdAt: dateStr };
        });
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      },
      error: () => { }
    });
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
      if (type === 'NEW_QUIZ') return `A new quiz has been published for lesson '${parts[1]}' in course '${parts[2]}'. Test your knowledge now!`;
      if (type === 'QUIZ_FULLMARK') return `🎉 Congratulations! You earned ${parts[1]} XP for getting a full mark in the quiz. Keep going!`;
      if (type === 'NEW_ASSIGNMENT') return `New Assignment '${parts[1]}' in course '${parts[2]}'. Due before ${parts[3]}!`;
      if (type === 'ASSIGNMENT_SUBMITTED') return `Student ${parts[1]} submitted assignment '${parts[2]}' in course '${parts[3]}'.`;
      if (type === 'ASSIGNMENT_GRADED') return `Assignment '${parts[1]}' has been graded. You scored ${parts[2]}/${parts[3]}.`;

      // Fallback for older hardcoded notifications
      if (message.includes('50 نقطة') || message.includes('50 XP') || message.includes('الكويز')) return '🎉 Congratulations! You earned 50 XP for getting a full mark in the quiz. Keep going!';
      if (message.includes('بدأ المعلم') && message.includes('بثاً مباشراً')) return message.replace('بدأ المعلم', 'Instructor').replace('بثاً مباشراً لكورس', 'started a live session for').replace('انضم الآن!', 'Join now!').replace('. انضم الآن!', '. Join now!');
      if (message.includes('طالب جديد انضم')) return message.replace('طالب جديد انضم! لقد قام طالب بالاشتراك في كورس', 'New student enrolled! A student has enrolled in course').replace('طالب جديد انضم!', 'New student enrolled!');
      if (message.includes('تم نشر درس جديد')) return message.replace('تم نشر درس جديد بعنوان', 'A new lesson has been published titled').replace('في كورس', 'in course').replace('تفقده الآن!', 'Check it out now!');
      if (message.includes('تم نشر اختبار جديد')) return message.replace('تم نشر اختبار جديد لدرس', 'A new quiz has been published for lesson').replace('في كورس', 'in course').replace('Test your knowledge now!', 'اختبر معلوماتك الآن!');
      if (message.includes('واجب جديد')) return message.replace('واجب جديد', 'New Assignment').replace('قم بتسليمه قبل', 'Due before');
      return message;
    }
    
    if (this.lang === 'ar') {
      if (type === 'NEW_QUIZ') return `تم نشر اختبار جديد لدرس '${parts[1]}' في كورس '${parts[2]}'. اختبر معلوماتك الآن!`;
      if (type === 'QUIZ_FULLMARK') return `🎉 مبروك! لقد ربحت ${parts[1]} نقطة لحصولك على الدرجة النهائية في الكويز. استمر يا بطل!`;
      if (type === 'NEW_ASSIGNMENT') return `واجب جديد '${parts[1]}' في كورس '${parts[2]}'. قم بتسليمه قبل ${parts[3]}!`;
      if (type === 'ASSIGNMENT_SUBMITTED') return `قام الطالب ${parts[1]} بتسليم واجب '${parts[2]}' في كورس '${parts[3]}'.`;
      if (type === 'ASSIGNMENT_GRADED') return `تم تقييم واجب '${parts[1]}'. حصلت على ${parts[2]}/${parts[3]}.`;
      
      // Fallback for older hardcoded notifications
      if (message.includes('Congratulations') && message.includes('50 XP')) return '🎉 مبروك! لقد ربحت 50 نقطة لحصولك على الدرجة النهائية في الكويز. استمر يا بطل!';
      if (message.includes('started a live session for')) return message.replace('Instructor', 'بدأ المعلم').replace('started a live session for', 'بثاً مباشراً لكورس').replace('Join now!', 'انضم الآن!').replace('. Join now!', '. انضم الآن!');
      if (message.includes('New student enrolled')) return message.replace('New student enrolled! A student has enrolled in course', 'طالب جديد انضم! لقد قام طالب بالاشتراك في كورس').replace('New student enrolled!', 'طالب جديد انضم!');
      if (message.includes('A new lesson has been published')) return message.replace('A new lesson has been published titled', 'تم نشر درس جديد بعنوان').replace('in course', 'في كورس').replace('Check it out now!', 'تفقده الآن!');
      if (message.includes('A new quiz has been published')) return message.replace('A new quiz has been published for lesson', 'تم نشر اختبار جديد لدرس').replace('in course', 'في كورس').replace('Test your knowledge now!', 'اختبر معلوماتك الآن!');
      return message;
    }
    
    return message;
  }

  startLiveSession() {
    if (!this.selectedCourseForLive || !this.meetUrlInput) return;
    const courseId = this.selectedCourseForLive.id.toString();
    const instructorName = this.userData?.username || 'Instructor';
    const courseTitle = this.selectedCourseForLive.title;
    let url = this.meetUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    this.signalrService.startSession(courseId, instructorName, courseTitle, url);
    this.isLiveActive = true;
    this.activeLiveTitle = courseTitle;
    window.open(url, '_blank');
  }

  openActiveMeeting() {
    if (this.meetUrlInput) {
      let url = this.meetUrlInput.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      window.open(url, '_blank');
    }
  }

  endLiveSession() {
    if (this.selectedCourseForLive) {
      this.signalrService.endSession(this.selectedCourseForLive.id.toString());
    }
    this.isLiveActive = false;
    this.meetUrlInput = '';
    this.selectedCourseForLive = null;
  }

  fetchSchedule() {
    if (this.events.length === 0) this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>('http://localhost:5162/api/schedule/teacher', { headers }).subscribe({
      next: (data) => {
        this.events = (data || []).map(e => {
          const d = e.eventDate.endsWith('Z') ? e.eventDate : e.eventDate + 'Z';
          return { ...e, eventDate: d };
        });
        this.isLoading = false;
      },
      error: () => {
        this.events = [];
        this.isLoading = false;
      }
    });
  }

  submitEvent() {
    if (this.eventForm.valid) {
      this.isSaving = true;
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      let payload = this.eventForm.value;
      payload.courseId = Number(payload.courseId);
      if (!payload.eventDate.includes('Z')) {
        payload.eventDate = new Date(payload.eventDate).toISOString();
      }
      this.http.post('http://localhost:5162/api/schedule', payload, { headers }).subscribe({
        next: () => {
          this.showEventForm = false;
          this.eventForm.reset({ eventType: 'Live' });
          this.fetchSchedule();
          this.isSaving = false;
          this.showMessage(this.lang === 'ar' ? 'تمت إضافة الحدث بنجاح' : 'Event added successfully', 'success');
        },
        error: () => {
          this.isSaving = false;
          this.showMessage(this.lang === 'ar' ? 'حدث خطأ' : 'Error adding event', 'error');
        }
      });
    }
  }

  deleteEvent(id: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete(`http://localhost:5162/api/schedule/${id}`, { headers }).subscribe({
      next: () => {
        this.events = this.events.filter(e => e.id !== id);
        this.showMessage(this.lang === 'ar' ? 'تم حذف الحدث' : 'Event deleted', 'success');
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

  get filteredCourses() {
    if (!this.searchQuery) return this.courses;
    return this.courses.filter(c =>
      c.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get filteredStudents() {
    if (!this.searchQuery) return this.enrolledStudents;
    return this.enrolledStudents.filter(s =>
      s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (s.phoneNumber && s.phoneNumber.includes(this.searchQuery))
    );
  }

  fetchUserProfile() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('http://localhost:5162/api/user/profile', { headers }).subscribe({
      next: (data: any) => {
        this.userData = data;
        this.loadMyCourses();
      },
      error: () => this.logout()
    });
  }

  openSettings() {
    this.editProfileData = {
      fullName: this.userData?.username || '',
      email: this.userData?.email || '',
      phone: this.userData?.phoneNumber?.split(' ')[1] || '',
      countryCode: this.userData?.phoneNumber?.split(' ')[0] || '+20',
      bio: this.userData?.bio || '',
      profileImage: this.userData?.profileImage || '',
      specialization: this.userData?.specialization || '',
      coverImage: this.userData?.coverImage || ''
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

  onCoverSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.post('http://localhost:5162/api/user/upload-cover', formData, { headers }).subscribe({
      next: (res: any) => {
        this.editProfileData.coverImage = res.coverImage;
        this.userData.coverImage = res.coverImage;
      },
      error: () => this.showMessage(this.lang === 'ar' ? 'فشل رفع الغلاف' : 'Cover upload failed', 'error')
    });
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
      phoneNumber: this.editProfileData.countryCode + ' ' + this.editProfileData.phone,
      bio: this.editProfileData.bio,
      specialization: this.editProfileData.specialization
    };

    this.http.put('http://localhost:5162/api/user/profile', updateModel, { headers }).subscribe({
      next: () => {
        this.userData.username = this.editProfileData.fullName;
        this.userData.phoneNumber = updateModel.phoneNumber;
        this.userData.bio = updateModel.bio;
        this.userData.specialization = updateModel.specialization;
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

  toggleLang() {
    this.langService.toggleLanguage();
    if (this.activeTab === 'dashboard' && this.chart) {
      this.loadDashboardStats(); 
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.courseForm.patchValue({ coverImageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  }

  onViewCourse(course: any) {
    this.router.navigate(['/course', course.id]);
  }

  loadMyCourses() {
    if (this.courses.length === 0) this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any[]>('http://localhost:5162/api/course/instructor-courses', { headers }).subscribe({
      next: (data: any[]) => {
        this.courses = data || [];
        
        if (this.courses.length === 0) {
           this.isLoadingTopMetrics = false;
           this.isLoading = false;
           return;
        }

        Promise.all([
          this.calculateTotalStudentsAsync(),
          this.calculateRealTeacherStatsAsync()
        ]).then(() => {
          this.isLoadingTopMetrics = false;
        });

        this.isLoading = false;
      },
      error: () => {
        this.courses = [];
        this.isLoadingTopMetrics = false;
        this.isLoading = false;
      }
    });
  }

  calculateTotalStudentsAsync(): Promise<void> {
    return new Promise((resolve) => {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      let uniqueStudents = new Set<number>();
      let processedCourses = 0;

      if (this.courses.length === 0) {
        this.totalStudentsCount = 0;
        resolve();
        return;
      }

      this.courses.forEach(course => {
        this.http.get<any[]>(`http://localhost:5162/api/quiz/course/${course.id}/students`, { headers }).subscribe({
          next: (data) => {
            (data || []).forEach(s => uniqueStudents.add(s.id));
            processedCourses++;
            if (processedCourses === this.courses.length) {
              this.totalStudentsCount = uniqueStudents.size;
              resolve();
            }
          },
          error: () => {
            processedCourses++;
            if (processedCourses === this.courses.length) {
              this.totalStudentsCount = uniqueStudents.size;
              resolve();
            }
          }
        });
      });
    });
  }

  calculateRealTeacherStatsAsync(): Promise<void> {
    return new Promise((resolve) => {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      if (this.courses.length === 0) {
        this.totalLessonsCount = 0;
        this.totalQuizzesCount = 0;
        resolve();
        return;
      }

      let lessonsCount = 0;
      let quizzesCount = 0;
      let checkedCourses = 0;

      this.courses.forEach(course => {
        this.http.get<any[]>(`http://localhost:5162/api/course/${course.id}/lessons`, { headers }).subscribe({
          next: (lessons: any[]) => {
            lessonsCount += (lessons || []).length;
            this.totalLessonsCount = lessonsCount;

            if (!lessons || lessons.length === 0) {
              checkedCourses++;
              if (checkedCourses === this.courses.length) resolve();
              return;
            }

            let checkedLessons = 0;
            lessons.forEach(lesson => {
              this.http.get<any>(`http://localhost:5162/api/quiz/lesson/${lesson.id}`, { headers }).subscribe({
                next: (quiz) => {
                  if (quiz && quiz.questions && quiz.questions.length > 0) {
                    quizzesCount++;
                    this.totalQuizzesCount = quizzesCount;
                  }
                },
                error: () => { },
                complete: () => {
                  checkedLessons++;
                  if (checkedLessons === lessons.length) {
                    checkedCourses++;
                    if (checkedCourses === this.courses.length) resolve();
                  }
                }
              });
            });
          },
          error: () => {
            checkedCourses++;
            if (checkedCourses === this.courses.length) resolve();
          }
        });
      });
    });
  }

  loadStudentsForCourse(courseId: number) {
    this.isLoadingStudents = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`http://localhost:5162/api/quiz/course/${courseId}/students`, { headers }).subscribe({
      next: (data) => {
        this.enrolledStudents = data || [];
        this.isLoadingStudents = false;
      },
      error: () => {
        this.enrolledStudents = [];
        this.isLoadingStudents = false;
      }
    });
  }

  loadStudentQuizResults(studentId: number, courseId: number) {
    this.isLoadingStudents = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`http://localhost:5162/api/course/${courseId}/lessons`, { headers }).subscribe({
      next: (lessons) => {
        const groups = new Map<number, any>();
        
        (lessons || []).forEach(l => {
          groups.set(l.id, {
            lessonId: l.id,
            lessonTitle: l.title,
            attempts: [],
            assignment: null,
            expanded: false
          });
        });

        this.http.get<any[]>(`http://localhost:5162/api/quiz/course/${courseId}/student/${studentId}/results`, { headers }).subscribe({
          next: (quizData) => {
            (quizData || []).forEach(item => {
              const lessonGroup = Array.from(groups.values()).find(g => g.lessonId === item.lessonId || g.lessonTitle === item.lessonTitle);
              if (lessonGroup) {
                lessonGroup.attempts.push(item);
              }
            });

            this.http.get<any[]>(`http://localhost:5162/api/assignments/course/${courseId}`, { headers }).subscribe({
              next: (allAssignments) => {
                
                this.assignmentService.getSubmissionsForGrading(courseId, studentId).subscribe({
                  next: (subData) => {
                    (subData || []).forEach(sub => {
                      const assignmentRef = (allAssignments || []).find(a => a.id === sub.assignmentId);
                      const targetLessonId = assignmentRef?.lessonId;
                      
                      let lessonGroup = targetLessonId ? groups.get(targetLessonId) : null;
                      
                      if (!lessonGroup) {
                        lessonGroup = {
                          lessonId: targetLessonId || Date.now(),
                          lessonTitle: sub.assignmentTitle,
                          attempts: [],
                          assignment: null,
                          expanded: false
                        };
                        groups.set(lessonGroup.lessonId, lessonGroup);
                      }

                      lessonGroup.assignment = {
                        id: sub.id,
                        title: sub.assignmentTitle,
                        givenScore: sub.givenScore,
                        totalScore: sub.totalScore,
                        answers: (sub.answers || []).map((a: any) => ({
                          question: a.questionText,
                          answer: a.answerText,
                          type: (a.questionType || '').toLowerCase(),
                          score: a.score
                        }))
                      };
                    });

                    this.groupedStudentResults = Array.from(groups.values());
                    this.isLoadingStudents = false;
                  },
                  error: () => {
                    this.groupedStudentResults = Array.from(groups.values());
                    this.isLoadingStudents = false;
                  }
                });
              },
              error: () => {
                  this.groupedStudentResults = Array.from(groups.values());
                  this.isLoadingStudents = false;
              }
            });
          },
          error: () => {
            this.groupedStudentResults = Array.from(groups.values());
            this.isLoadingStudents = false;
          }
        });
      },
      error: () => {
        this.groupedStudentResults = [];
        this.isLoadingStudents = false;
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error' = 'success') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  openDeleteModal(courseId: number) {
    this.courseToDeleteId = courseId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.courseToDeleteId = null;
  }

  confirmDelete() {
    if (this.courseToDeleteId) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.delete(`http://localhost:5162/api/course/${this.courseToDeleteId}`, { headers }).subscribe({
        next: () => {
          this.showMessage(this.t[this.lang].deleteSuccessMsg, 'success');
          this.loadMyCourses();
          this.closeDeleteModal();
        },
        error: () => {
          this.showMessage(this.t[this.lang].errorMsg, 'error');
          this.closeDeleteModal();
        }
      });
    }
  }

  onSubmit() {
    if (this.courseForm.valid) {
      this.isSaving = true;
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.post<any>('http://localhost:5162/api/course', this.courseForm.value, { headers }).subscribe({
        next: (newCourse) => {
          this.showMessage(this.t[this.lang].successMsg, 'success');
          this.courseForm.reset();
          this.imagePreview = null;
          this.isSaving = false;
          
          if(newCourse) {
            this.courses.unshift(newCourse);
          }
          this.loadMyCourses();
          
          setTimeout(() => {
            this.showCreateForm = false;
          }, 1500);
        },
        error: () => {
          this.isSaving = false;
          this.showMessage(this.t[this.lang].errorMsg, 'error');
        }
      });
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
}