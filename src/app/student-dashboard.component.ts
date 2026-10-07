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
      <div *ngIf="message" [ngClass]="{'bg-emerald-500': messageType === 'success', 'bg-rose-500': messageType === 'error'}" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-[90] px-6 py-3 rounded-xl shadow-xl text-white font-bold transition-all duration-500 flex items-center gap-3 animate-fade-in">
        <span>{{ message }}</span>
      </div>

      <!-- Settings & Crop Modals -->
      <div *ngIf="showCropModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4 animate-fade-in">
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
            <button (click)="applyCrop()" [disabled]="isUploadingImage" class="flex-1 py-3 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50">
              {{ isUploadingImage ? t[lang].saving : (lang === 'ar' ? 'تطبيق' : 'Apply') }}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="showUnsavedModal" class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-fade-in">
        <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in">
          <div class="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
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
              <div class="text-center sm:text-start">
                <h3 class="font-extrabold text-lg text-slate-900">{{ editProfileData.fullName || 'Student' }}</h3>
                <p class="text-sm text-slate-500">{{ editProfileData.email }}</p>
                <span class="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg mt-2 inline-block">{{ t[lang].studentRole }}</span>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].fullName }}</label>
                <input type="text" [(ngModel)]="editProfileData.fullName" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">{{ t[lang].email }}</label>
                <input type="email" [(ngModel)]="editProfileData.email" disabled class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium">
                <p class="text-[11px] text-slate-400 mt-1">{{ t[lang].emailCantChange }}</p>
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
            <button (click)="saveProfile()" [disabled]="isSaving" class="flex-1 py-3.5 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50">
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
          <div class="text-xs uppercase tracking-wider text-white/40 px-3 mb-2">{{ t[lang].main }}</div>
          <a (click)="switchTab('dashboard')" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'dashboard', 'text-white/70 hover:bg-white/5': activeTab !== 'dashboard'}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">🏠 {{ t[lang].dashboard }}</a>
          <a (click)="switchTab('browse')" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'browse', 'text-white/70 hover:bg-white/5': activeTab !== 'browse'}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">📖 {{ t[lang].browseCourses }}</a>
          <a (click)="switchTab('schedule')" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'schedule', 'text-white/70 hover:bg-white/5': activeTab !== 'schedule'}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">📅 {{ t[lang].schedule }}</a>
          <a (click)="switchTab('assignments')" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'assignments', 'text-white/70 hover:bg-white/5': activeTab !== 'assignments'}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">📝 {{ t[lang].assignments }}</a>
          
          <div class="text-xs uppercase tracking-wider text-white/40 px-3 mt-6 mb-2">{{ t[lang].account }}</div>
          <a (click)="openSettings()" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium text-sm transition cursor-pointer">⚙️ {{ t[lang].accountSettings }}</a>
          <button (click)="logout()" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-indigo-300 hover:bg-indigo-500/10 font-medium text-sm transition w-full text-start cursor-pointer">🚪 {{ t[lang].logout }}</button>
        </nav>
        <div class="p-4 border-t border-white/10">
          <div class="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <img [src]="userData?.profileImage ? 'http://localhost:5162' + userData.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + (userData?.username || 'Student'))" alt="Avatar" class="w-9 h-9 rounded-full bg-white/10 object-cover" />
            <div class="min-w-0">
              <p class="text-sm font-semibold truncate">{{ userData?.username || 'Student' }}</p>
              <p class="text-xs text-indigo-300">{{ t[lang].studentRole }}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 ltr:lg:ml-64 rtl:lg:mr-64 min-h-screen flex flex-col">
        <header class="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between gap-4">
          <div class="flex items-center flex-1 gap-6">
            <h2 class="text-lg font-bold text-slate-800 lg:hidden">{{ t[lang].brand }}</h2>
            <div class="relative hidden sm:block w-full max-w-md">
              <span class="absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400">🔍</span>
              <input type="text" [(ngModel)]="searchQuery" [placeholder]="t[lang].search" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all dir-ltr text-left">
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
                  <div *ngFor="let notif of notifications; trackBy: trackById" (click)="markAsRead(notif)" [ngClass]="{'bg-indigo-50/40': !notif.isRead}" class="p-4 hover:bg-slate-50 transition cursor-pointer flex items-start justify-between gap-3 group">
                    <div class="flex-1 min-w-0" dir="auto" style="unicode-bidi: plaintext; text-align: start;">
                      <p class="font-bold text-xs text-slate-900 break-words whitespace-normal" *ngIf="notif.title">{{ notif.title }}</p>
                      <p class="text-xs mt-1 break-words whitespace-normal" [ngClass]="!notif.isRead ? 'font-bold text-slate-900' : 'font-normal text-slate-600'" style="line-height: 1.4;">{{ getNotificationText(notif.message) }}</p>
                      <span class="text-[10px] text-slate-400 mt-2 block">{{ notif.createdAt | date:'short' }}</span>
                    </div>
                    <button (click)="deleteNotification(notif.id, $event)" class="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1" title="مسح">
                      ✖
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
                    <span class="text-xl">⚡</span>
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
                    <span class="text-xl">📚</span>
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
                    <span class="text-xl">🏆</span>
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
                  
                  <button *ngIf="activeLiveSession" (click)="joinLiveSession()" class="px-3 py-1.5 bg-[#130E35] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm">
                    🔗 {{ t[lang].joinSession }}
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
                    <img *ngIf="course.coverImageUrl" [src]="course.coverImageUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
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
                <h2 class="text-2xl font-extrabold text-slate-900">{{ t[lang].browseTeachers }} 👨‍‍🏫</h2>
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
            <div class="mb-6">
              <h2 class="text-2xl font-extrabold text-slate-900">{{ t[lang].schedule }} 📅</h2>
              <p class="text-slate-500 text-sm mt-1">{{ lang === 'ar' ? 'مواعيد البث والاختبارات القادمة لكورساتك.' : 'Upcoming live sessions and deadlines for your courses.' }}</p>
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
                 <div class="text-right rtl:text-left shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
                    <p class="font-black text-slate-800 text-xl">{{ ev.eventDate | date:'MMM d' }}</p>
                    <p class="text-sm text-slate-500 font-bold">{{ ev.eventDate | date:'shortTime' }}</p>
                 </div>
              </div>
              
              <div *ngIf="filteredEvents.length === 0" class="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 animate-fade-in">
                 <span class="text-5xl block mb-4">🗓️</span>
                 <p class="text-slate-500 font-semibold text-lg">{{ lang === 'ar' ? 'لا توجد أحداث أو مواعيد قادمة.' : 'No upcoming events scheduled.' }}</p>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="activeTab === 'assignments'">
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 class="text-2xl font-extrabold text-slate-900">{{ t[lang].assignments }} 📝</h2>
                <p class="text-slate-500 text-sm mt-1">{{ lang === 'ar' ? 'تابع واجباتك وأرسل الحلول لمعلمك.' : 'Track your pending assignments and submit solutions.' }}</p>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="font-bold text-lg text-slate-800 mb-2">{{ lang === 'ar' ? 'الواجبات المطلوبة' : 'Pending Assignments' }}</h3>
              
              <div *ngFor="let task of filteredPendingAssignments; trackBy: trackById" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition group">
                <div class="flex-1">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 uppercase">{{ lang === 'ar' ? 'مطلوب' : 'Pending' }}</span>
                  <h4 class="font-bold text-lg text-slate-900 mt-2">{{ task.title }}</h4>
                  <p class="text-sm text-slate-500 font-medium mt-1">{{ task.courseTitle }}</p>
                  <p class="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1">
                    ⏰ {{ lang === 'ar' ? 'تاريخ التسليم:' : 'Due:' }} {{ task.dueDate | date:'shortDate' }}
                  </p>
                </div>
                <button (click)="openAssignmentSolver(task)" class="w-full sm:w-auto px-5 py-2.5 bg-[#130E35] hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-sm">
                  {{ lang === 'ar' ? 'بدء الحل' : 'Start Assignment' }}
                </button>
              </div>
              <div *ngIf="filteredPendingAssignments.length === 0" class="py-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <span class="text-4xl block mb-2">🎉</span>
                <p class="text-slate-500 font-semibold">{{ lang === 'ar' ? 'لا توجد واجبات مطلوبة تطابق بحثك حالياً!' : 'No pending assignments match your search!' }}</p>
              </div>
            </div>

            <div class="mt-10 space-y-4">
              <h3 class="font-bold text-lg text-slate-800 mb-2">{{ lang === 'ar' ? 'الواجبات المكتملة' : 'Completed Assignments' }}</h3>
              
              <div *ngFor="let task of filteredCompletedAssignments; trackBy: trackById" class="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80 hover:opacity-100 transition">
                <div class="flex-1">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">{{ lang === 'ar' ? 'مكتمل' : 'Completed' }}</span>
                  <h4 class="font-bold text-slate-900 mt-2 line-through decoration-slate-400">{{ task.title }}</h4>
                  <p class="text-sm text-slate-500 font-medium mt-1">{{ task.courseTitle }}</p>
                </div>
                <div class="text-center sm:text-right rtl:sm:text-left">
                  <p class="text-xs text-slate-500 font-bold mb-1">{{ lang === 'ar' ? 'الدرجة' : 'Score' }}</p>
                  <span class="text-lg font-black" [ngClass]="task.score === null || task.score === undefined ? 'text-amber-500' : 'text-indigo-600'">
                    {{ task.score === null || task.score === undefined ? (lang === 'ar' ? '⏳ قيد التقييم (Needs Grading)' : '⏳ Needs Grading') : task.score + '/' + task.totalScore }}
                  </span>
                </div>
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
                    <div>
                      <h3 class="text-xl font-bold text-slate-900 mb-4">{{ lang === 'ar' ? 'نبذة تعريفية' : 'About Instructor' }}</h3>
                      <p class="text-slate-600 leading-relaxed text-base">{{ currentTeacherProfile.teacher.bio || (lang === 'ar' ? 'لا توجد نبذة تعريفية متوفرة حالياً.' : 'No bio available currently.') }}</p>
                    </div>
                 </div>

                 <h3 class="text-2xl font-extrabold text-slate-900 mb-6">{{ lang === 'ar' ? 'الكورسات المقدمة' : 'Provided Courses' }}</h3>
                 
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    <div *ngFor="let course of filteredTeacherCourses; trackBy: trackById" (click)="openCourseLanding(course.id)" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group cursor-pointer">
                       <div class="h-40 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                         <img *ngIf="course.coverImageUrl" [src]="course.coverImageUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
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

        </main>
      </div>
    </div>`
})
export class StudentDashboardComponent implements OnInit {
  private _activeTab: 'dashboard' | 'browse' | 'schedule' | 'assignments' | 'teacherProfile' = 'dashboard';
  get activeTab() { return this._activeTab; }
  set activeTab(val: 'dashboard' | 'browse' | 'schedule' | 'assignments' | 'teacherProfile') {
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
  completedAssignments: any[] = [];

  countries = [
    { code: '+20', flag: '🇪🇬', name: 'Egypt' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' }
  ];
  t = {
    en: {
      brand: 'Fluency First', main: 'Main', dashboard: 'Dashboard', browseCourses: 'Browse Tutors', browseDesc: 'Discover new skills and enroll in our latest courses.',
      browseTeachers: 'Browse Teachers', browseTeachersDesc: 'Find the best instructors and discover their courses.', noTeachersFound: 'No teachers found.',
      schedule: 'Schedule', assignments: 'Assignments', account: 'Account', accountSettings: 'Account Settings',
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
      brand: 'Fluency First', main: 'القائمة الرئيسية', dashboard: 'لوحة التحكم', browseCourses: 'تصفح المعلمين', browseDesc: 'اكتشف مهارات جديدة واشترك في أحدث كورساتنا.',
      browseTeachers: 'تصفح المعلمين', browseTeachersDesc: 'ابحث عن أفضل المعلمين واكتشف كورساتهم.', noTeachersFound: 'لا يوجد معلمون حالياً.',
      schedule: 'الجدول', assignments: 'الواجبات', account: 'الحساب', accountSettings: 'إعدادات الحساب',
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

    // PERFECTLY ROBUST PARSER FOR SIGNALR PAYLOAD
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
        const completedArr = data.completed || data.Completed || [];

        this.pendingAssignments = pendingArr;
        this.completedAssignments = completedArr.map((c: any) => ({
          ...c,
          title: c.assignmentTitle || c.title,
          courseTitle: c.courseTitle || '',
          score: c.givenScore
        }));
      },
      error: () => {
        this.pendingAssignments = [];
        this.completedAssignments = [];
      }
    });
  }

  openAssignmentSolver(task: any) {
    this.router.navigate(['/assignment-solver', task.id]);
  }

  get filteredPendingAssignments() {
    if (!this.searchQuery) return this.pendingAssignments;
    const q = this.searchQuery.toLowerCase();
    return this.pendingAssignments.filter(a => a.title.toLowerCase().includes(q) || (a.courseTitle && a.courseTitle.toLowerCase().includes(q)));
  }

  get filteredCompletedAssignments() {
    if (!this.searchQuery) return this.completedAssignments;
    const q = this.searchQuery.toLowerCase();
    return this.completedAssignments.filter(a => a.title.toLowerCase().includes(q) || (a.courseTitle && a.courseTitle.toLowerCase().includes(q)));
  }

  switchTab(tab: 'dashboard' | 'browse' | 'schedule' | 'assignments' | 'teacherProfile') {
    this.searchQuery = '';
    this.router.navigate([], { queryParams: { tab: tab } });
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
    this.router.navigate(['/course-landing', courseId]);
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

        // CRITICAL FIX: Guarantee that registerStudent is called after the SignalR connection establishes.
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