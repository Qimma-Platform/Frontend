import { Component, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { LanguageService } from '../services/language.service';
import Chart from 'chart.js/auto';

interface AdminStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  totalPaidEnrollments: number;
  totalFreeEnrollments: number;
  paidCoursesCount: number;
  freeCoursesCount: number;
  chartLabels: string[];
  revenueChartData: number[];
  enrollmentChartData: number[];
  topCourses: AdminCourse[];
  topInstructors: AdminUser[];
  recentActivities: AdminAuditLog[];
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  phoneNumber?: string;
  profileImage?: string;
  specialization?: string;
  bio?: string;
  role: number;
  roleName: string;
  totalXP?: number;
  enrolledCoursesCount?: number;
  assignedCoursesCount?: number;
  isEmailConfirmed: boolean;
}

interface AdminCourse {
  id: number;
  title: string;
  description?: string;
  coverImageUrl?: string;
  instructorId: number;
  instructorName: string;
  isFree: boolean;
  price: number;
  discountPercentage: number;
  rating?: number;
  totalRatingsCount: number;
  enrolledStudentsCount: number;
  modulesCount: number;
}

interface AdminEnrollee {
  studentId: number;
  studentName: string;
  email: string;
  phoneNumber?: string;
  profileImage?: string;
  totalXP: number;
  enrolledAt: string;
}

interface AdminPaidStudent {
  studentId: number;
  studentName: string;
  email: string;
  phoneNumber?: string;
  profileImage?: string;
  courseId: number;
  courseTitle: string;
  instructorName: string;
  amountPaid: number;
  enrolledAt: string;
  paymentStatus: string;
}

interface AdminAuditLog {
  id: number;
  adminId: number;
  adminUsername: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

interface AdminProfile {
  id: number;
  username: string;
  email: string;
  phoneNumber?: string;
  roleName: string;
}

interface AdminNotification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  template: `
    <div class="bg-[#F4F7FE] text-slate-800 h-screen w-full flex overflow-hidden relative font-sans" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- TOAST NOTIFICATION (Without emojis, using clean SVGs) -->
      <div *ngIf="toastMessage" 
           [ngClass]="toastType === 'success' ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-rose-600 shadow-rose-500/30'" 
           class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl text-white font-bold transition-all duration-300 flex items-center gap-3 animate-fade-in pointer-events-auto border border-white/20">
        <span class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg *ngIf="toastType === 'success'" class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <svg *ngIf="toastType === 'error'" class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </span>
        <span class="text-sm tracking-wide">{{ toastMessage }}</span>
      </div>

      <!-- SIDEBAR: STRICTLY FIXED AND DOES NOT SCROLL WITH PAGE -->
      <aside [ngClass]="isSidebarCollapsed ? 'w-20' : 'w-72'" 
             class="bg-[#130E35] text-white flex flex-col shrink-0 transition-all duration-300 relative z-30 shadow-2xl h-screen overflow-hidden">
        
        <!-- Brand Header -->
        <div class="h-20 flex items-center px-6 border-b border-white/10 gap-3 justify-between shrink-0">
          <div class="flex items-center gap-3 overflow-hidden" *ngIf="!isSidebarCollapsed">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <div>
              <h1 class="font-black text-lg leading-tight tracking-wide text-white">Fluency First</h1>
              <p class="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{{ t[lang].adminPanel }}</p>
            </div>
          </div>
          <button (click)="toggleSidebar()" 
                  class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition shrink-0">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path *ngIf="!isSidebarCollapsed" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
              <path *ngIf="isSidebarCollapsed" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Admin Profile Pill -->
        <div class="p-4 border-b border-white/10 shrink-0" *ngIf="!isSidebarCollapsed">
          <div class="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shrink-0">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-extrabold text-sm text-white truncate">{{ adminProfile?.username || adminName }}</p>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{{ t[lang].superAdminBadge }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Navigation Links (Fixed Container with internal scrollbar if screen is very short) -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
          
          <!-- 1. Overview Tab -->
          <button (click)="switchTab('overview')" 
                  [ngClass]="activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9" rx="1"></rect>
              <rect x="14" y="3" width="7" height="5" rx="1"></rect>
              <rect x="14" y="12" width="7" height="9" rx="1"></rect>
              <rect x="3" y="16" width="7" height="5" rx="1"></rect>
            </svg>
            <span *ngIf="!isSidebarCollapsed">{{ t[lang].overview }}</span>
          </button>

          <!-- 2. Students Tab -->
          <button (click)="switchTab('students')" 
                  [ngClass]="activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].students }}</span>
            </div>
            <span *ngIf="!isSidebarCollapsed && stats" class="px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-mono">
              {{ stats.totalStudents }}
            </span>
          </button>

          <!-- 3. Instructors Tab -->
          <button (click)="switchTab('instructors')" 
                  [ngClass]="activeTab === 'instructors' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].instructors }}</span>
            </div>
            <span *ngIf="!isSidebarCollapsed && stats" class="px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-mono">
              {{ stats.totalInstructors }}
            </span>
          </button>

          <!-- 4. Courses Tab (Grouped by Instructor view first) -->
          <button (click)="switchTab('courses', { courseView: 'instructors' })" 
                  [ngClass]="activeTab === 'courses' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].courses }}</span>
            </div>
            <span *ngIf="!isSidebarCollapsed && stats" class="px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-mono">
              {{ stats.totalCourses }}
            </span>
          </button>

          <!-- 5. Course Enrollees Tab -->
          <button (click)="switchTab('enrollees')" 
                  [ngClass]="activeTab === 'enrollees' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span *ngIf="!isSidebarCollapsed">{{ t[lang].courseEnrollees }}</span>
          </button>

          <!-- 6. Paid Students Tab (New requirement 5) -->
          <button (click)="switchTab('paid-students')" 
                  [ngClass]="activeTab === 'paid-students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].paidStudents }}</span>
            </div>
            <span *ngIf="!isSidebarCollapsed && stats?.totalPaidEnrollments" class="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[11px] font-mono">
              {{ stats?.totalPaidEnrollments }}
            </span>
          </button>

          <!-- 7. Audit Logs Tab -->
          <button (click)="switchTab('logs')" 
                  [ngClass]="activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span *ngIf="!isSidebarCollapsed">{{ t[lang].auditLogs }}</span>
          </button>

          <!-- 8. Account Settings Tab (New requirement 8) -->
          <button (click)="switchTab('settings')" 
                  [ngClass]="activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-start">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span *ngIf="!isSidebarCollapsed">{{ t[lang].accountSettings }}</span>
          </button>

        </nav>

        <!-- Bottom Actions (Log Out directly placed below sections like teacher/student dashboard, NO language switcher here) -->
        <div class="p-4 border-t border-white/10 shrink-0">
          <button (click)="logout()" 
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs transition">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span *ngIf="!isSidebarCollapsed">{{ t[lang].logout }}</span>
          </button>
        </div>
      </aside>

      <!-- MAIN CONTENT WRAPPER -->
      <div class="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">
        
        <!-- TOP APP BAR (Removed Refresh button per requirement 4, kept Language Switcher here) -->
        <header class="h-20 bg-white border-b border-slate-200/80 px-6 lg:px-10 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div class="flex items-center gap-3">
            <h2 class="text-xl lg:text-2xl font-black text-slate-900 leading-tight">
              {{ getTabTitle() }}
            </h2>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200/50">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{{ t[lang].systemStatusOk }}</span>
            </span>
          </div>

          <div class="flex items-center gap-3">
            <!-- Language Switcher in Header -->
            <button (click)="toggleLanguage()" 
                    class="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-extrabold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/50 transition flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>{{ lang === 'ar' ? 'English' : 'العربية' }}</span>
            </button>

            <!-- NOTIFICATION BELL (Req 5) -->
            <div class="relative notification-container">
              <button (click)="toggleNotifications()" 
                      class="relative p-2.5 rounded-xl border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 transition flex items-center justify-center">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span *ngIf="unreadNotificationsCount > 0" 
                      class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full min-w-[18px] text-center shadow-md animate-pulse">
                  {{ unreadNotificationsCount }}
                </span>
              </button>

              <!-- Notifications Dropdown Panel -->
              <div *ngIf="showNotificationsDropdown" 
                   class="absolute ltr:right-0 rtl:left-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden animate-fade-in"
                   [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
                
                <div class="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <h3 class="font-extrabold text-slate-900 text-sm">{{ t[lang].notifications }}</h3>
                    <span *ngIf="unreadNotificationsCount > 0" class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full">
                      {{ unreadNotificationsCount }} {{ t[lang].unread }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button *ngIf="unreadNotificationsCount > 0" (click)="markAllNotificationsAsRead()" 
                            class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
                      {{ t[lang].markAllAsRead }}
                    </button>
                    <button *ngIf="notifications.length > 0" (click)="deleteAllNotifications()" 
                            class="text-xs font-bold text-rose-500 hover:text-rose-700 transition">
                      {{ t[lang].clearAll }}
                    </button>
                  </div>
                </div>

                <div class="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  <div *ngIf="notifications.length === 0" class="p-8 text-center text-slate-400 font-bold text-xs">
                    {{ t[lang].noNotifications }}
                  </div>

                  <div *ngFor="let notif of notifications" (click)="markNotificationAsRead(notif)" 
                       [ngClass]="{'bg-indigo-50/40': !notif.isRead, 'bg-white': notif.isRead}" 
                       class="p-4 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 group">
                    
                    <div class="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-xs font-black shadow-xs"
                         [ngClass]="{
                           'bg-emerald-100 text-emerald-700': getNotificationType(notif.message) === 'ENROLLMENT_PAID',
                           'bg-blue-100 text-blue-700': getNotificationType(notif.message) === 'ENROLLMENT',
                           'bg-purple-100 text-purple-700': getNotificationType(notif.message) === 'NEW_USER' || getNotificationType(notif.message) === 'NEW_INSTRUCTOR' || getNotificationType(notif.message) === 'NEW_STUDENT',
                           'bg-slate-100 text-slate-700': getNotificationType(notif.message) === 'SYSTEM'
                         }">
                      <svg *ngIf="getNotificationType(notif.message) === 'ENROLLMENT_PAID'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      <svg *ngIf="getNotificationType(notif.message) === 'ENROLLMENT'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                      <svg *ngIf="getNotificationType(notif.message) === 'NEW_USER' || getNotificationType(notif.message) === 'NEW_INSTRUCTOR' || getNotificationType(notif.message) === 'NEW_STUDENT'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                      <svg *ngIf="getNotificationType(notif.message) === 'SYSTEM'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>

                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold text-slate-900 leading-snug break-words">
                        {{ getNotificationTitle(notif.message) }}
                      </p>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] text-slate-400 font-mono">{{ formatTimeAgo(notif.createdAt) }}</span>
                        <span class="text-[10px] text-slate-300">•</span>
                        <span class="text-[10px] text-slate-400 font-mono">{{ formatDateTime(notif.createdAt) }}</span>
                      </div>
                    </div>

                    <span *ngIf="!notif.isRead" class="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5"></span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Admin Profile Indicator -->
            <div class="flex items-center gap-3 pl-2" [ngClass]="lang === 'ar' ? 'pr-2 pl-0 border-r border-slate-200' : 'pl-2 border-l border-slate-200'">
              <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200">
                {{ (adminProfile?.username || 'A').substring(0,1).toUpperCase() }}
              </div>
              <div class="hidden sm:block">
                <p class="text-xs font-bold text-slate-900 leading-tight">{{ adminProfile?.username || adminName }}</p>
                <p class="text-[10px] text-slate-400 font-medium">admin</p>
              </div>
            </div>
          </div>
        </header>

        <!-- MAIN SCROLLABLE BODY -->
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

          <!-- ======================================================== -->
          <!-- TAB 1: EXECUTIVE ANALYTICAL DASHBOARD OVERVIEW (Req 6 & 7) -->
          <!-- ======================================================== -->
          <div *ngIf="activeTab === 'overview'" class="space-y-6 animate-fade-in">
            
            <!-- Top Controls & Timeframe Filters -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="text-lg font-black text-slate-900">{{ t[lang].executiveOverview }}</h3>
                <p class="text-xs text-slate-500 font-medium">{{ t[lang].executiveOverviewDesc }}</p>
              </div>

              <!-- Timeframe Filter Buttons -->
              <div class="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <button *ngFor="let tf of timeframeOptions" 
                        (click)="setTimeframe(tf.id)" 
                        [ngClass]="selectedTimeframe === tf.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition">
                  {{ lang === 'ar' ? tf.labelAr : tf.labelEn }}
                </button>
              </div>
            </div>

            <!-- COMPACT METRIC CARDS ROW (Req 7: Text on left, Icon on right, Smaller height) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              <!-- Total Students -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between">
                <div>
                  <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].totalStudents }}</p>
                  <p class="text-2xl font-black text-slate-900 mt-1 leading-none">{{ stats?.totalStudents ?? 0 }}</p>
                  <span class="inline-block text-[10px] font-bold text-emerald-600 mt-1.5">
                    ↑ {{ stats?.totalStudents ?? 0 }} {{ t[lang].active }}
                  </span>
                </div>
                <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                  </svg>
                </div>
              </div>

              <!-- Total Instructors -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between">
                <div>
                  <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].totalInstructors }}</p>
                  <p class="text-2xl font-black text-slate-900 mt-1 leading-none">{{ stats?.totalInstructors ?? 0 }}</p>
                  <span class="inline-block text-[10px] font-bold text-indigo-600 mt-1.5">
                    ✓ {{ stats?.totalInstructors ?? 0 }} {{ t[lang].verified }}
                  </span>
                </div>
                <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>

              <!-- Total Courses -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between">
                <div>
                  <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].totalCourses }}</p>
                  <p class="text-2xl font-black text-slate-900 mt-1 leading-none">{{ stats?.totalCourses ?? 0 }}</p>
                  <span class="inline-block text-[10px] font-bold text-amber-600 mt-1.5">
                    ● {{ stats?.totalCourses ?? 0 }} {{ t[lang].published }}
                  </span>
                </div>
                <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </div>
              </div>

              <!-- Total Enrollments -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between">
                <div>
                  <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].totalEnrollments }}</p>
                  <p class="text-2xl font-black text-slate-900 mt-1 leading-none">{{ stats?.totalEnrollments ?? 0 }}</p>
                  <span class="inline-block text-[10px] font-bold text-emerald-600 mt-1.5">
                    {{ stats?.totalPaidEnrollments ?? 0 }} {{ t[lang].paidCourse }}
                  </span>
                </div>
                <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                </div>
              </div>

              <!-- Platform Revenue -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between">
                <div>
                  <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].platformRevenue }}</p>
                  <p class="text-2xl font-black text-slate-900 mt-1 leading-none">
                    {{ (stats?.totalRevenue ?? 0) | number:'1.0-0' }} <span class="text-xs font-bold text-slate-500">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                  </p>
                  <span class="inline-block text-[10px] font-bold text-emerald-600 mt-1.5">
                    +{{ stats?.totalPaidEnrollments ?? 0 }} {{ t[lang].paymentsCount }}
                  </span>
                </div>
                <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
              </div>

            </div>

            <!-- ANALYTICS CHARTS ROW (Chart.js) -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <!-- Main Trend Chart (Revenue & Monthly Enrollments) -->
              <div class="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h4 class="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                      <span>{{ t[lang].revenueTrendChartTitle }}</span>
                    </h4>
                    <p class="text-xs text-slate-400 font-medium">{{ t[lang].revenueTrendDesc }}</p>
                  </div>
                  <div class="flex items-center gap-3 text-xs font-bold">
                    <span class="flex items-center gap-1.5 text-indigo-600">
                      <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      <span>{{ t[lang].revenueLegend }}</span>
                    </span>
                    <span class="flex items-center gap-1.5 text-emerald-500">
                      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>{{ t[lang].enrollmentsLegend }}</span>
                    </span>
                  </div>
                </div>

                <div class="h-[280px] w-full relative">
                  <canvas id="adminRevenueTrendChart"></canvas>
                </div>
              </div>

              <!-- Doughnut Breakdown Chart (Course Distribution: Free vs Paid) -->
              <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 class="font-extrabold text-base text-slate-900 flex items-center gap-2 mb-1">
                    <svg class="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 2a10 10 0 0 1 10 10h-10z"></path>
                    </svg>
                    <span>{{ t[lang].courseDistributionChartTitle }}</span>
                  </h4>
                  <p class="text-xs text-slate-400 font-medium mb-4">{{ t[lang].courseDistributionDesc }}</p>
                </div>

                <div class="h-[210px] w-full relative flex items-center justify-center">
                  <canvas id="adminCourseDistributionChart"></canvas>
                </div>

                <div class="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div class="p-2 rounded-xl bg-slate-50">
                    <p class="text-slate-400 font-bold">{{ t[lang].paidCourse }}</p>
                    <p class="font-black text-indigo-700 text-sm mt-0.5">{{ stats?.paidCoursesCount ?? 0 }}</p>
                  </div>
                  <div class="p-2 rounded-xl bg-slate-50">
                    <p class="text-slate-400 font-bold">{{ t[lang].freeCourse }}</p>
                    <p class="font-black text-emerald-600 text-sm mt-0.5">{{ stats?.freeCoursesCount ?? 0 }}</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- ANALYTICAL RANKING TABLES (Top Performing Courses & Top Instructors) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <!-- Top Performing Courses -->
              <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>{{ t[lang].topPerformingCourses }}</span>
                  </h4>
                  <button (click)="switchTab('courses', { courseView: 'all' })" class="text-xs font-bold text-indigo-600 hover:underline">
                    {{ t[lang].viewAll }} →
                  </button>
                </div>

                <div class="space-y-3">
                  <div *ngFor="let c of stats?.topCourses" class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 font-black text-indigo-600 text-xs">
                        #{{ c.id }}
                      </div>
                      <div class="min-w-0">
                        <p class="font-extrabold text-sm text-slate-900 truncate">{{ c.title }}</p>
                        <p class="text-xs text-slate-500 font-medium">{{ c.instructorName }}</p>
                      </div>
                    </div>
                    <div class="text-end shrink-0">
                      <p class="font-black text-xs text-indigo-600">{{ c.enrolledStudentsCount }} {{ t[lang].studentsCountSuffix }}</p>
                      <span class="text-[11px] font-bold text-slate-400">
                        {{ c.isFree ? t[lang].freeBadge : (c.price + ' ' + (lang === 'ar' ? 'ج.م' : 'EGP')) }}
                      </span>
                    </div>
                  </div>
                  <div *ngIf="!stats?.topCourses || stats?.topCourses?.length === 0" class="text-center py-6 text-slate-400 text-xs font-bold">
                    {{ t[lang].noDataAvailable }}
                  </div>
                </div>
              </div>

              <!-- Top Instructors -->
              <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>{{ t[lang].topInstructors }}</span>
                  </h4>
                  <button (click)="switchTab('instructors')" class="text-xs font-bold text-indigo-600 hover:underline">
                    {{ t[lang].viewAll }} →
                  </button>
                </div>

                <div class="space-y-3">
                  <div *ngFor="let inst of stats?.topInstructors" class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {{ inst.username.substring(0,2).toUpperCase() }}
                      </div>
                      <div class="min-w-0">
                        <p class="font-extrabold text-sm text-slate-900 truncate">{{ inst.username }}</p>
                        <p class="text-xs text-slate-500 font-medium truncate">{{ inst.specialization || (lang === 'ar' ? 'معلم لغة' : 'Language Teacher') }}</p>
                      </div>
                    </div>
                    <div class="text-end shrink-0">
                      <p class="font-black text-xs text-purple-700">{{ inst.assignedCoursesCount }} {{ t[lang].coursesCountSuffix }}</p>
                      <span class="text-[11px] font-bold text-emerald-600">{{ inst.enrolledCoursesCount || 0 }} {{ t[lang].studentsCountSuffix }}</span>
                    </div>
                  </div>
                  <div *ngIf="!stats?.topInstructors || stats?.topInstructors?.length === 0" class="text-center py-6 text-slate-400 text-xs font-bold">
                    {{ t[lang].noDataAvailable }}
                  </div>
                </div>
              </div>

            </div>

          </div>

          <!-- ======================================================== -->
          <!-- TAB 2: STUDENTS MANAGEMENT -->
          <!-- ======================================================== -->
          <div *ngIf="activeTab === 'students'" class="space-y-6 animate-fade-in">
            
            <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <!-- Search bar -->
              <div class="relative flex-1 max-w-md">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input type="text" [(ngModel)]="studentSearch" (input)="fetchStudents()" 
                       placeholder="{{ t[lang].searchStudentsPlaceholder }}" 
                       class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs">
              </div>

              <!-- Add student button (Req 9: Matching teacher dashboard button color) -->
              <button (click)="openAddStudentModal()" 
                      class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>{{ t[lang].addStudent }}</span>
              </button>
            </div>

            <!-- Students Table -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
                  <thead class="bg-slate-50 border-b border-slate-200/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th class="px-6 py-4">{{ t[lang].student }}</th>
                      <th class="px-6 py-4">{{ t[lang].email }}</th>
                      <th class="px-6 py-4">{{ t[lang].phone }}</th>
                      <th class="px-6 py-4">{{ t[lang].enrolledCourses }}</th>
                      <th class="px-6 py-4">{{ t[lang].xpPoints }}</th>
                      <th class="px-6 py-4 text-center">{{ t[lang].actions }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium">
                    <tr *ngIf="students.length === 0" class="text-center">
                      <td colspan="6" class="px-6 py-12 text-slate-400 font-bold">
                        {{ t[lang].noStudentsFound }}
                      </td>
                    </tr>
                    <tr *ngFor="let s of students" class="hover:bg-slate-50/70 transition">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <img [src]="s.profileImage ? 'http://localhost:5162' + s.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + s.username)" 
                               class="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-200 shrink-0">
                          <div>
                            <p class="font-bold text-slate-900">{{ s.username }}</p>
                            <span class="text-[11px] text-slate-400 font-mono">ID: #{{ s.id }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-slate-600 font-mono text-xs">{{ s.email }}</td>
                      <td class="px-6 py-4 text-slate-600 font-mono text-xs">{{ s.phoneNumber || '—' }}</td>
                      <td class="px-6 py-4">
                        <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black">
                          {{ s.enrolledCoursesCount || 0 }} {{ t[lang].coursesCountSuffix }}
                        </span>
                      </td>
                      <td class="px-6 py-4 font-bold text-amber-600">⚡ {{ s.totalXP || 0 }} XP</td>
                      <td class="px-6 py-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                          <button (click)="openEditStudentModal(s)" 
                                  class="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition shadow-xs" 
                                  title="{{ t[lang].edit }}">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </button>
                          <button (click)="openDeleteUserConfirm(s, 'Student')" 
                                  class="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition shadow-xs" 
                                  title="{{ t[lang].delete }}">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <!-- ======================================================== -->
          <!-- TAB 3: INSTRUCTORS MANAGEMENT -->
          <!-- ======================================================== -->
          <div *ngIf="activeTab === 'instructors'" class="space-y-6 animate-fade-in">
            
            <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <!-- Search bar -->
              <div class="relative flex-1 max-w-md">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input type="text" [(ngModel)]="instructorSearch" (input)="fetchInstructors()" 
                       placeholder="{{ t[lang].searchInstructorsPlaceholder }}" 
                       class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs">
              </div>

              <!-- Add instructor button (Req 9: Matching teacher dashboard button color) -->
              <button (click)="openAddInstructorModal()" 
                      class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>{{ t[lang].addInstructor }}</span>
              </button>
            </div>

            <!-- Instructors Table -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
                  <thead class="bg-slate-50 border-b border-slate-200/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th class="px-6 py-4">{{ t[lang].instructor }}</th>
                      <th class="px-6 py-4">{{ t[lang].email }}</th>
                      <th class="px-6 py-4">{{ t[lang].specialization }}</th>
                      <th class="px-6 py-4">{{ t[lang].phone }}</th>
                      <th class="px-6 py-4">{{ t[lang].assignedCourses }}</th>
                      <th class="px-6 py-4 text-center">{{ t[lang].actions }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium">
                    <tr *ngIf="instructors.length === 0" class="text-center">
                      <td colspan="6" class="px-6 py-12 text-slate-400 font-bold">
                        {{ t[lang].noInstructorsFound }}
                      </td>
                    </tr>
                    <tr *ngFor="let inst of instructors" class="hover:bg-slate-50/70 transition">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <img [src]="inst.profileImage ? 'http://localhost:5162' + inst.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + inst.username)" 
                               class="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-200 shrink-0">
                          <div>
                            <p class="font-bold text-slate-900">{{ inst.username }}</p>
                            <span class="text-[11px] text-slate-400 font-mono">ID: #{{ inst.id }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-slate-600 font-mono text-xs">{{ inst.email }}</td>
                      <td class="px-6 py-4">
                        <span class="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-black">
                          {{ inst.specialization || (lang === 'ar' ? 'معلم لغة' : 'Language Teacher') }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-slate-600 font-mono text-xs">{{ inst.phoneNumber || '—' }}</td>
                      <td class="px-6 py-4">
                        <button (click)="viewInstructorCourses(inst)" 
                                class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1">
                          <span>{{ inst.assignedCoursesCount || 0 }} {{ t[lang].coursesCountSuffix }}</span>
                          <span class="text-[10px]">→</span>
                        </button>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                          <button (click)="openEditInstructorModal(inst)" 
                                  class="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition shadow-xs" 
                                  title="{{ t[lang].edit }}">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </button>
                          <button (click)="openDeleteUserConfirm(inst, 'Instructor')" 
                                  class="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition shadow-xs" 
                                  title="{{ t[lang].delete }}">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <!-- ======================================================== -->
          <!-- TAB 4: COURSES MANAGEMENT (Req 10: Instructor first, All courses button) -->
          <!-- ======================================================== -->
          <div *ngIf="activeTab === 'courses'" class="space-y-6 animate-fade-in">
            
            <!-- VIEW 1: INSTRUCTOR SELECTION VIEW (Default according to Req 10) -->
            <div *ngIf="courseViewMode === 'instructors'" class="space-y-6">
              
              <!-- Action Bar -->
              <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <!-- Search bar -->
                <div class="relative flex-1 max-w-md">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                  <input type="text" [(ngModel)]="instructorCourseSearch" 
                         placeholder="{{ t[lang].searchInstructorsForCourses }}" 
                         class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs">
                </div>

                <div class="flex items-center gap-3">
                  <!-- Button to view all courses on platform (Req 10) -->
                  <button (click)="showAllCoursesView()" 
                          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    <span>{{ t[lang].viewAllPlatformCourses }}</span>
                  </button>
                </div>
              </div>

              <!-- Instructors Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div *ngFor="let inst of filteredInstructorsForCourses" 
                     class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="flex items-center gap-4 mb-4">
                      <img [src]="inst.profileImage ? 'http://localhost:5162' + inst.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + inst.username)" 
                           class="w-14 h-14 rounded-2xl bg-slate-100 object-cover border border-slate-200 shrink-0">
                      <div class="min-w-0 flex-1">
                        <h4 class="font-extrabold text-base text-slate-900 truncate">{{ inst.username }}</h4>
                        <p class="text-xs text-slate-500 font-medium truncate">{{ inst.specialization || (lang === 'ar' ? 'معلم لغة' : 'Language Teacher') }}</p>
                        <span class="inline-block mt-1 text-[11px] font-mono text-slate-400">{{ inst.email }}</span>
                      </div>
                    </div>

                    <div class="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100 text-xs font-bold mb-4">
                      <span class="text-slate-500">{{ t[lang].assignedCourses }}:</span>
                      <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-black">
                        {{ getCoursesCountByInstructor(inst.id) }} {{ t[lang].coursesCountSuffix }}
                      </span>
                    </div>
                  </div>

                  <!-- Button to view this instructor's courses -->
                  <button (click)="viewInstructorCourses(inst)" 
                          class="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2">
                    <span>{{ t[lang].viewInstructorCoursesBtn }}</span>
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path *ngIf="lang !== 'ar'" d="M5 12h14M12 5l7 7-7 7"/>
                      <path *ngIf="lang === 'ar'" d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                  </button>
                </div>
              </div>

            </div>

            <!-- VIEW 2: DRILL-DOWN INTO SINGLE INSTRUCTOR'S COURSES OR ALL PLATFORM COURSES -->
            <div *ngIf="courseViewMode === 'instructor-courses' || courseViewMode === 'all'" class="space-y-6">
              
              <!-- Back header & Sub-title -->
              <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <button (click)="backToInstructorsCourseView()" 
                          class="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 text-xs font-bold shrink-0">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path *ngIf="lang !== 'ar'" d="M19 12H5M12 19l-7-7 7-7"/>
                      <path *ngIf="lang === 'ar'" d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <span>{{ t[lang].backToInstructors }}</span>
                  </button>

                  <div>
                    <h3 class="text-lg font-black text-slate-900 leading-tight">
                      {{ courseViewMode === 'all' ? t[lang].allPlatformCoursesTitle : ((selectedInstructorForCourses?.username || (lang === 'ar' ? 'المعلم' : 'Instructor')) + ' - ' + t[lang].courses) }}
                    </h3>
                    <p class="text-xs text-slate-500 font-medium">
                      {{ displayedCourses.length }} {{ t[lang].coursesCountSuffix }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="relative w-64">
                    <input type="text" [(ngModel)]="courseSearch" 
                           placeholder="{{ t[lang].searchCoursesPlaceholder }}" 
                           class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                  </div>

                  <button *ngIf="courseViewMode === 'instructor-courses'" (click)="openCreateCourseModal()" 
                          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm text-xs flex items-center gap-1.5 shrink-0">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>{{ t[lang].createNewCourse }}</span>
                  </button>
                </div>
              </div>

              <!-- Courses Grid -->
              <div *ngIf="displayedCourses.length === 0" class="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200/80">
                {{ t[lang].noCoursesFound }}
              </div>

              <div *ngIf="displayedCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div *ngFor="let c of displayedCourses" 
                     class="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between">
                  <div>
                    <div class="h-44 bg-slate-100 relative overflow-hidden">
                      <img [src]="c.coverImageUrl ? (c.coverImageUrl.startsWith('http') ? c.coverImageUrl : 'http://localhost:5162' + c.coverImageUrl) : 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80'" 
                           class="w-full h-full object-cover">
                      <div class="absolute top-3 right-3 flex gap-2">
                        <span *ngIf="c.isFree" class="px-2.5 py-1 bg-emerald-600 text-white text-xs font-black rounded-xl shadow-md">
                          {{ t[lang].freeBadge }}
                        </span>
                        <span *ngIf="!c.isFree" class="px-2.5 py-1 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-md">
                          {{ c.price }} {{ lang === 'ar' ? 'ج.م' : 'EGP' }}
                        </span>
                      </div>
                    </div>

                    <div class="p-6">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold text-slate-400 font-mono">ID: #{{ c.id }}</span>
                        <span class="text-xs font-bold text-amber-600 flex items-center gap-1">
                          ★ {{ c.rating || '5.0' }}
                        </span>
                      </div>

                      <h4 class="font-black text-lg text-slate-900 leading-snug line-clamp-1 mb-2">{{ c.title }}</h4>
                      <p class="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                        {{ c.description || (lang === 'ar' ? 'لا يوجد وصف متاح للكورس.' : 'No description provided for this course.') }}
                      </p>

                      <div class="p-3 bg-slate-50 rounded-2xl space-y-2 border border-slate-100 text-xs">
                        <div class="flex items-center justify-between">
                          <span class="text-slate-400 font-semibold">{{ t[lang].instructor }}:</span>
                          <span class="font-bold text-slate-800">{{ c.instructorName }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-slate-400 font-semibold">{{ t[lang].enrolledStudents }}:</span>
                          <span class="font-black text-indigo-600">{{ c.enrolledStudentsCount }} {{ t[lang].studentsCountSuffix }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-2">
                    <button (click)="viewCourseEnrollees(c)" 
                            class="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                      </svg>
                      <span>{{ t[lang].viewEnrollees }}</span>
                    </button>

                    <button (click)="openAssignInstructorModal(c)" 
                            class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition" 
                            title="{{ t[lang].assignInstructor }}">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                    </button>

                    <button (click)="openEditCourseModal(c)" 
                            class="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition shadow-xs" 
                            title="{{ t[lang].edit }}">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    </button>

                    <button (click)="openDeleteCourseConfirm(c)" 
                            class="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition shadow-xs" 
                            title="{{ t[lang].delete }}">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

          <!-- ======================================================== -->
          <!-- TAB 5: COURSE ENROLLEES VIEWER -->
          <!-- ======================================================== -->
          <div *ngIf="activeTab === 'enrollees'" class="space-y-6 animate-fade-in">
            
            <div class="bg-white rounded-3xl border border-slate-200/80 p-6 lg:p-8 shadow-xs">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 class="text-lg font-black text-slate-900">{{ t[lang].courseEnrolleesManager }}</h3>
                  <p class="text-xs text-slate-500">{{ t[lang].courseEnrolleesDesc }}</p>
                </div>

                <div class="flex items-center gap-3">
                  <select [(ngModel)]="selectedCourseIdForEnrollees" (change)="onEnrolleeCourseSelected()" 
                          class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option [ngValue]="null" disabled>{{ t[lang].selectCoursePlaceholder }}</option>
                    <option *ngFor="let c of courses" [ngValue]="c.id">
                      {{ c.title }} ({{ c.enrolledStudentsCount }} {{ t[lang].studentsCountSuffix }})
                    </option>
                  </select>

                  <button *ngIf="selectedCourseIdForEnrollees" (click)="openEnrollStudentModal()" 
                          class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm text-xs flex items-center gap-1.5 shrink-0">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>{{ t[lang].enrollStudent }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div *ngIf="!selectedCourseIdForEnrollees" class="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200/80">
              {{ t[lang].pleaseSelectCourse }}
            </div>

            <div *ngIf="selectedCourseIdForEnrollees" class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                <h4 class="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <svg class="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  <span>{{ getSelectedCourseTitle() }}</span>
                </h4>
                <span class="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-xl">
                  {{ enrollees.length }} {{ t[lang].studentsCountSuffix }}
                </span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
                  <thead class="bg-slate-50 border-b border-slate-200/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th class="px-6 py-4">{{ t[lang].student }}</th>
                      <th class="px-6 py-4">{{ t[lang].email }}</th>
                      <th class="px-6 py-4">{{ t[lang].phone }}</th>
                      <th class="px-6 py-4">{{ t[lang].xpPoints }}</th>
                      <th class="px-6 py-4">{{ t[lang].enrolledAt }}</th>
                      <th class="px-6 py-4 text-center">{{ t[lang].actions }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium">
                    <tr *ngIf="enrollees.length === 0" class="text-center">
                      <td colspan="6" class="px-6 py-12 text-slate-400 font-bold">
                        {{ t[lang].noEnrolleesForCourse }}
                      </td>
                    </tr>
                    <tr *ngFor="let en of enrollees" class="hover:bg-slate-50/70 transition">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <img [src]="en.profileImage ? 'http://localhost:5162' + en.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + en.studentName)" 
                               class="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-200 shrink-0">
                          <div>
                            <p class="font-bold text-slate-900">{{ en.studentName }}</p>
                            <span class="text-[11px] text-slate-400 font-mono">ID: #{{ en.studentId }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-slate-600 font-mono text-xs">{{ en.email }}</td>
                      <td class="px-6 py-4 text-slate-600 font-mono text-xs">{{ en.phoneNumber || '—' }}</td>
                      <td class="px-6 py-4 font-bold text-amber-600">⚡ {{ en.totalXP || 0 }} XP</td>
                      <td class="px-6 py-4 text-slate-500 font-mono text-xs">{{ formatDateTime(en.enrolledAt) }}</td>
                      <td class="px-6 py-4 text-center">
                        <button (click)="openUnenrollConfirm(en)" 
                                class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition flex items-center gap-1.5 mx-auto">
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          <span>{{ t[lang].unenrollBtn }}</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <!-- ======================================================== -->
          <!-- TAB 6: PAID STUDENTS & REVENUE RECORDS (New Requirement 5) -->
          <!-- ======================================================== -->
          <div *ngIf="activeTab === 'paid-students'" class="space-y-6 animate-fade-in">
            
            <!-- Summary Header Banner -->
            <div class="bg-white rounded-3xl border border-slate-200/80 p-6 lg:p-8 shadow-xs">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <span>{{ t[lang].paidStudentsTitle }}</span>
                  </h3>
                  <p class="text-xs text-slate-500 mt-1">{{ t[lang].paidStudentsDesc }}</p>
                </div>

                <!-- 4 Summary Badges: Paid Enrollments, Total Revenue, Platform 20%, Instructors 80% (Req 2) -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div class="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                    <p class="text-[11px] font-bold text-emerald-700">{{ t[lang].totalPaidRecords }}</p>
                    <p class="text-xl font-black text-emerald-800 mt-0.5">{{ filteredPaidStudents.length }}</p>
                  </div>
                  <div class="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                    <p class="text-[11px] font-bold text-indigo-700">{{ t[lang].totalPaidRevenue }}</p>
                    <p class="text-xl font-black text-indigo-800 mt-0.5">{{ calculateTotalPaidRevenue() | number }} <span class="text-xs">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span></p>
                  </div>
                  <div class="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-center">
                    <p class="text-[11px] font-bold text-blue-700">{{ t[lang].platformShare }}</p>
                    <p class="text-xl font-black text-blue-800 mt-0.5">{{ calculatePlatformShare() | number }} <span class="text-xs">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span></p>
                  </div>
                  <div class="p-3.5 bg-purple-50 border border-purple-100 rounded-2xl text-center">
                    <p class="text-[11px] font-bold text-purple-700">{{ t[lang].instructorShare }}</p>
                    <p class="text-xl font-black text-purple-800 mt-0.5">{{ calculateInstructorShare() | number }} <span class="text-xs">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Controls bar with Timeframe Capsule Filter (Req 1) & Aligned Search (Req 3) -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <!-- Timeframe Capsule Filter Pills (Matching image) -->
              <div class="bg-white rounded-full p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1 self-start sm:self-auto">
                <button (click)="setPaidTimeframe('7d')"
                        [ngClass]="paidStudentsTimeframe === '7d' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                        class="px-4 py-1.5 rounded-full text-xs font-bold transition">
                  {{ t[lang].days7 }}
                </button>
                <button (click)="setPaidTimeframe('30d')"
                        [ngClass]="paidStudentsTimeframe === '30d' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                        class="px-4 py-1.5 rounded-full text-xs font-bold transition">
                  {{ t[lang].days30 }}
                </button>
                <button (click)="setPaidTimeframe('1y')"
                        [ngClass]="paidStudentsTimeframe === '1y' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                        class="px-4 py-1.5 rounded-full text-xs font-bold transition">
                  {{ t[lang].year1 }}
                </button>
                <button (click)="setPaidTimeframe('all')"
                        [ngClass]="paidStudentsTimeframe === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                        class="px-4 py-1.5 rounded-full text-xs font-bold transition">
                  {{ t[lang].allTime }}
                </button>
              </div>

              <!-- Compact Clean Search Input -->
              <div class="relative w-full sm:w-72">
                <span class="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3.5 rtl:pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input type="text" [(ngModel)]="paidStudentsSearch" 
                       placeholder="{{ t[lang].searchPaidStudentsPlaceholder }}" 
                       class="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs">
              </div>
            </div>

            <!-- Paid Students Table -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
                  <thead class="bg-slate-50 border-b border-slate-200/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th class="px-6 py-4">{{ t[lang].student }}</th>
                      <th class="px-6 py-4">{{ t[lang].courseTitle }}</th>
                      <th class="px-6 py-4">{{ t[lang].instructor }}</th>
                      <th class="px-6 py-4">{{ t[lang].coursePrice }}</th>
                      <th class="px-6 py-4 text-blue-700">{{ t[lang].platformShare }}</th>
                      <th class="px-6 py-4 text-purple-700">{{ t[lang].instructorShare }}</th>
                      <th class="px-6 py-4">{{ t[lang].enrolledAt }}</th>
                      <th class="px-6 py-4 text-center">{{ t[lang].status }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium">
                    <tr *ngIf="filteredPaidStudents.length === 0" class="text-center">
                      <td colspan="8" class="px-6 py-12 text-slate-400 font-bold">
                        {{ t[lang].noPaidStudentsFound }}
                      </td>
                    </tr>
                    <tr *ngFor="let ps of filteredPaidStudents" class="hover:bg-slate-50/70 transition">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <img [src]="ps.profileImage ? 'http://localhost:5162' + ps.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + ps.studentName)" 
                               class="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-200 shrink-0">
                          <div>
                            <p class="font-bold text-slate-900">{{ ps.studentName }}</p>
                            <span class="text-[11px] text-slate-400 font-mono">{{ ps.email }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <p class="font-bold text-slate-800">{{ ps.courseTitle }}</p>
                        <span class="text-[11px] text-slate-400 font-mono">Course ID: #{{ ps.courseId }}</span>
                      </td>
                      <td class="px-6 py-4 text-slate-600 font-medium text-xs">{{ ps.instructorName }}</td>
                      <td class="px-6 py-4 font-black text-slate-900">
                        {{ ps.amountPaid }} <span class="text-xs font-bold">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                      </td>
                      <td class="px-6 py-4 font-black text-blue-600">
                        {{ (ps.amountPaid * 0.20) | number:'1.0-2' }} <span class="text-xs font-bold">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                      </td>
                      <td class="px-6 py-4 font-black text-purple-600">
                        {{ (ps.amountPaid * 0.80) | number:'1.0-2' }} <span class="text-xs font-bold">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                      </td>
                      <td class="px-6 py-4 text-slate-500 font-mono text-xs">{{ formatDateTime(ps.enrolledAt) }}</td>
                      <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border border-emerald-200/50">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{{ lang === 'ar' ? 'تم الدفع بنجاح' : 'Paid & Active' }}</span>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <!-- ======================================================== -->
          <!-- TAB 7: AUDIT LOGS (Removed refresh icon 🔄 per Req 4) -->
          <!-- ======================================================== -->
          <div *ngIf="activeTab === 'logs'" class="space-y-6 animate-fade-in">
            
            <div class="bg-white rounded-3xl border border-slate-200/80 p-6 lg:p-8 shadow-xs">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 class="text-lg font-black text-slate-900">{{ t[lang].auditLogsTitle }}</h3>
                  <p class="text-xs text-slate-500">{{ t[lang].auditLogsDesc }}</p>
                </div>
                
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Timeframe Capsule Filter Pills (Req 1) -->
                  <div class="bg-slate-50 rounded-full p-1 border border-slate-200/80 shadow-xs flex items-center gap-1">
                    <button (click)="setLogsTimeframe('7d')"
                            [ngClass]="logsTimeframe === '7d' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition">
                      {{ t[lang].days7 }}
                    </button>
                    <button (click)="setLogsTimeframe('30d')"
                            [ngClass]="logsTimeframe === '30d' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition">
                      {{ t[lang].days30 }}
                    </button>
                    <button (click)="setLogsTimeframe('1y')"
                            [ngClass]="logsTimeframe === '1y' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition">
                      {{ t[lang].year1 }}
                    </button>
                    <button (click)="setLogsTimeframe('all')"
                            [ngClass]="logsTimeframe === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition">
                      {{ t[lang].allTime }}
                    </button>
                  </div>

                  <!-- Compact Search Bar -->
                  <div class="relative w-64">
                    <span class="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3.5 rtl:pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </span>
                    <input type="text" [(ngModel)]="logSearch" placeholder="{{ t[lang].filterLogsPlaceholder }}" 
                           class="w-full ltr:pl-9 rtl:pr-9 ltr:pr-4 rtl:pl-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs">
                  </div>
                </div>
              </div>

              <!-- Logs Table -->
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
                  <thead class="bg-slate-50 border-b border-slate-200/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th class="px-6 py-4">ID</th>
                      <th class="px-6 py-4">{{ t[lang].action }}</th>
                      <th class="px-6 py-4">{{ t[lang].entity }}</th>
                      <th class="px-6 py-4">{{ t[lang].details }}</th>
                      <th class="px-6 py-4">{{ t[lang].admin }}</th>
                      <th class="px-6 py-4">{{ t[lang].timestamp }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium">
                    <tr *ngIf="filteredAuditLogs.length === 0" class="text-center">
                      <td colspan="6" class="px-6 py-12 text-slate-400 font-bold">
                        {{ t[lang].noAuditLogs }}
                      </td>
                    </tr>
                    <tr *ngFor="let l of filteredAuditLogs" class="hover:bg-slate-50/70 transition">
                      <td class="px-6 py-4 font-mono text-xs text-slate-400">#{{ l.id }}</td>
                      <td class="px-6 py-4">
                        <span [ngClass]="{
                          'bg-emerald-100 text-emerald-700': l.action === 'CREATE' || l.action === 'ENROLL',
                          'bg-blue-100 text-blue-700': l.action === 'UPDATE' || l.action === 'ASSIGN',
                          'bg-rose-100 text-rose-700': l.action === 'DELETE' || l.action === 'UNENROLL'
                        }" class="px-2.5 py-1 rounded-lg text-xs font-black uppercase">
                          {{ l.action }}
                        </span>
                      </td>
                      <td class="px-6 py-4 font-bold text-slate-700">{{ l.entity }}</td>
                      <td class="px-6 py-4 text-slate-800 text-xs font-semibold">{{ l.details }}</td>
                      <td class="px-6 py-4 text-indigo-700 font-bold text-xs">{{ l.adminUsername }}</td>
                      <td class="px-6 py-4 font-mono text-xs text-slate-500">{{ formatDateTime(l.timestamp) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <!-- ======================================================== -->
          <!-- TAB 8: ADMIN ACCOUNT SETTINGS (New Requirement 8) -->
          <!-- ======================================================== -->
          <div *ngIf="activeTab === 'settings'" class="space-y-6 animate-fade-in max-w-3xl mx-auto">
            
            <div class="bg-white rounded-3xl border border-slate-200/80 p-6 lg:p-8 shadow-xs">
              <div class="flex items-center gap-4 pb-6 border-b border-slate-100 mb-6">
                <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl border border-indigo-100">
                  <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-black text-slate-900">{{ t[lang].adminAccountSettingsTitle }}</h3>
                  <p class="text-xs text-slate-500 mt-0.5">{{ t[lang].adminAccountSettingsDesc }}</p>
                </div>
              </div>

              <form [formGroup]="adminProfileForm" (ngSubmit)="saveAdminProfile()" class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].username }} <span class="text-rose-500">*</span></label>
                  <input type="text" formControlName="username" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].email }}</label>
                  <input type="email" [value]="adminProfile?.email" disabled class="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-400 outline-none cursor-not-allowed">
                  <p class="text-[10px] text-slate-400 mt-1">{{ t[lang].emailCantChange }}</p>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].phone }}</label>
                  <input type="text" formControlName="phoneNumber" placeholder="+20 100 000 0000" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
                </div>

                <div class="pt-4 border-t border-slate-100">
                  <h4 class="font-extrabold text-sm text-slate-900 mb-2">{{ t[lang].securitySectionTitle }}</h4>
                  <p class="text-xs text-slate-400 mb-4">{{ t[lang].securitySectionDesc }}</p>
                  
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].resetPasswordOptional }}</label>
                    <input type="password" formControlName="newPassword" placeholder="{{ t[lang].leaveBlankIfSame }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
                  </div>
                </div>

                <div class="pt-6">
                  <button type="submit" [disabled]="adminProfileForm.invalid || isSubmitting" 
                          class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                    <svg *ngIf="!isSubmitting" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{{ isSubmitting ? t[lang].saving : t[lang].save }}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

        </main>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: ADD / EDIT STUDENT -->
      <!-- ======================================================== -->
      <div *ngIf="showStudentModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900">
                {{ isEditingStudent ? t[lang].editStudentTitle : t[lang].addStudentTitle }}
              </h3>
              <p class="text-slate-500 text-xs mt-0.5">{{ t[lang].studentFormDesc }}</p>
            </div>
            <button (click)="showStudentModal = false" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition">✕</button>
          </div>

          <form [formGroup]="studentForm" (ngSubmit)="saveStudent()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].username }} <span class="text-rose-500">*</span></label>
              <input type="text" formControlName="username" placeholder="{{ t[lang].usernamePlaceholder }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].email }} <span class="text-rose-500">*</span></label>
              <input type="email" formControlName="email" placeholder="student@example.com" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div *ngIf="!isEditingStudent">
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].password }} <span class="text-rose-500">*</span></label>
              <input type="password" formControlName="password" placeholder="••••••••" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div *ngIf="isEditingStudent">
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].resetPasswordOptional }}</label>
              <input type="password" formControlName="newPassword" placeholder="{{ t[lang].leaveBlankIfSame }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].phone }}</label>
              <input type="text" formControlName="phoneNumber" placeholder="+20 100 000 0000" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div *ngIf="isEditingStudent">
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].totalXP }}</label>
              <input type="number" formControlName="totalXP" placeholder="0" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div class="flex gap-3 pt-4">
              <button type="button" (click)="showStudentModal = false" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm">{{ t[lang].cancel }}</button>
              <button type="submit" [disabled]="studentForm.invalid || isSubmitting" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 text-sm">
                {{ isSubmitting ? t[lang].saving : t[lang].save }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: ADD / EDIT INSTRUCTOR -->
      <!-- ======================================================== -->
      <div *ngIf="showInstructorModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900">
                {{ isEditingInstructor ? t[lang].editInstructorTitle : t[lang].addInstructorTitle }}
              </h3>
              <p class="text-slate-500 text-xs mt-0.5">{{ t[lang].instructorFormDesc }}</p>
            </div>
            <button (click)="showInstructorModal = false" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition">✕</button>
          </div>

          <form [formGroup]="instructorForm" (ngSubmit)="saveInstructor()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].username }} <span class="text-rose-500">*</span></label>
              <input type="text" formControlName="username" placeholder="{{ t[lang].usernamePlaceholder }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].email }} <span class="text-rose-500">*</span></label>
              <input type="email" formControlName="email" placeholder="teacher@example.com" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div *ngIf="!isEditingInstructor">
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].password }} <span class="text-rose-500">*</span></label>
              <input type="password" formControlName="password" placeholder="••••••••" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div *ngIf="isEditingInstructor">
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].resetPasswordOptional }}</label>
              <input type="password" formControlName="newPassword" placeholder="{{ t[lang].leaveBlankIfSame }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].specialization }}</label>
              <input type="text" formControlName="specialization" placeholder="e.g. English Grammar & IELTS Coach" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].phone }}</label>
              <input type="text" formControlName="phoneNumber" placeholder="+20 100 000 0000" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].bio }}</label>
              <textarea formControlName="bio" rows="2" placeholder="Brief instructor biography..." class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none"></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button type="button" (click)="showInstructorModal = false" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm">{{ t[lang].cancel }}</button>
              <button type="submit" [disabled]="instructorForm.invalid || isSubmitting" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 text-sm">
                {{ isSubmitting ? t[lang].saving : t[lang].save }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: ADD / EDIT COURSE -->
      <!-- ======================================================== -->
      <div *ngIf="showCourseModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900">
                {{ isEditingCourse ? t[lang].editCourseTitle : t[lang].createCourseTitle }}
              </h3>
              <p class="text-slate-500 text-xs mt-0.5">{{ t[lang].courseFormDesc }}</p>
            </div>
            <button (click)="showCourseModal = false" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition">✕</button>
          </div>

          <form [formGroup]="courseForm" (ngSubmit)="saveCourse()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].courseTitle }} <span class="text-rose-500">*</span></label>
              <input type="text" formControlName="title" placeholder="{{ t[lang].courseTitlePlaceholder }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].instructor }} <span class="text-rose-500">*</span></label>
              <select formControlName="instructorId" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
                <option value="" disabled>{{ t[lang].selectInstructorPlaceholder }}</option>
                <option *ngFor="let inst of instructors" [value]="inst.id">{{ inst.username }} ({{ inst.email }})</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].description }}</label>
              <textarea formControlName="description" rows="3" placeholder="{{ t[lang].descPlaceholder }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].coverImageUrl }}</label>
              <input type="text" formControlName="coverImageUrl" placeholder="https://... or /uploads/..." class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].pricingType }}</label>
              <div class="flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="isFree" [value]="true" class="w-4 h-4 text-indigo-600">
                  <span>{{ t[lang].freeCourse }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="isFree" [value]="false" class="w-4 h-4 text-indigo-600">
                  <span>{{ t[lang].paidCourse }}</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3" *ngIf="!courseForm.get('isFree')?.value">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].price }} (EGP)</label>
                <input type="number" formControlName="price" placeholder="0" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].discountPercentage }} (%)</label>
                <input type="number" formControlName="discountPercentage" placeholder="0" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <button type="button" (click)="showCourseModal = false" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm">{{ t[lang].cancel }}</button>
              <button type="submit" [disabled]="courseForm.invalid || isSubmitting" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 text-sm">
                {{ isSubmitting ? t[lang].saving : t[lang].save }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: REASSIGN INSTRUCTOR -->
      <!-- ======================================================== -->
      <div *ngIf="showAssignModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900">{{ t[lang].reassignInstructorTitle }}</h3>
              <p class="text-slate-500 text-xs mt-0.5">{{ selectedCourseToAssign?.title }}</p>
            </div>
            <button (click)="showAssignModal = false" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition">✕</button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].selectNewInstructor }}</label>
              <select [(ngModel)]="newAssignedInstructorId" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
                <option [ngValue]="null" disabled>{{ t[lang].selectInstructorPlaceholder }}</option>
                <option *ngFor="let inst of instructors" [ngValue]="inst.id">{{ inst.username }} ({{ inst.email }})</option>
              </select>
            </div>

            <div class="flex gap-3 pt-4">
              <button (click)="showAssignModal = false" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm">{{ t[lang].cancel }}</button>
              <button (click)="submitAssignInstructor()" [disabled]="!newAssignedInstructorId || isSubmitting" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 text-sm">
                {{ isSubmitting ? t[lang].saving : t[lang].save }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: ENROLL STUDENT INTO COURSE -->
      <!-- ======================================================== -->
      <div *ngIf="showEnrollModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900">{{ t[lang].enrollStudentModalTitle }}</h3>
              <p class="text-slate-500 text-xs mt-0.5">{{ getSelectedCourseTitle() }}</p>
            </div>
            <button (click)="showEnrollModal = false" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition">✕</button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].selectStudentToEnroll }}</label>
              <select [(ngModel)]="studentIdToEnroll" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
                <option [ngValue]="null" disabled>{{ t[lang].selectStudentPlaceholder }}</option>
                <option *ngFor="let s of students" [ngValue]="s.id">{{ s.username }} ({{ s.email }})</option>
              </select>
            </div>

            <div class="flex gap-3 pt-4">
              <button (click)="showEnrollModal = false" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm">{{ t[lang].cancel }}</button>
              <button (click)="submitEnrollStudent()" [disabled]="!studentIdToEnroll || isSubmitting" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 text-sm">
                {{ isSubmitting ? t[lang].saving : t[lang].enrollBtn }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: CONFIRM DELETE (REUSABLE, without emojis) -->
      <!-- ======================================================== -->
      <div *ngIf="showConfirmModal" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm text-center animate-scale-in">
          <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">{{ confirmTitle }}</h3>
          <p class="text-sm text-slate-500 mb-8">{{ confirmMessage }}</p>
          <div class="flex gap-3">
            <button (click)="showConfirmModal = false" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm">{{ t[lang].cancel }}</button>
            <button (click)="executeConfirmAction()" [disabled]="isSubmitting" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 text-sm">
              {{ isSubmitting ? t[lang].processing : t[lang].confirmDeleteBtn }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  apiUrl = 'http://localhost:5162/api/admin';
  lang: 'en' | 'ar' = 'en';
  isSidebarCollapsed = false;
  activeTab = 'overview';
  isLoading = false;
  isSubmitting = false;

  adminName = 'Super Admin';
  adminProfile: AdminProfile | null = null;
  stats: AdminStats | null = null;
  students: AdminUser[] = [];
  instructors: AdminUser[] = [];
  courses: AdminCourse[] = [];
  enrollees: AdminEnrollee[] = [];
  paidStudents: AdminPaidStudent[] = [];
  auditLogs: AdminAuditLog[] = [];

  // Filter & Search states
  studentSearch = '';
  instructorSearch = '';
  instructorCourseSearch = '';
  courseSearch = '';
  paidStudentsSearch = '';
  logSearch = '';

  // Timeframe filter for Overview
  selectedTimeframe = 'all';
  timeframeOptions = [
    { id: '7days', labelEn: '7 Days', labelAr: '7 أيام' },
    { id: '30days', labelEn: '30 Days', labelAr: '30 يوم' },
    { id: '1year', labelEn: '1 Year', labelAr: 'سنة' },
    { id: 'all', labelEn: 'All Time', labelAr: 'الكل' }
  ];

  // Courses View Flow: 'instructors' | 'instructor-courses' | 'all' (Req 10)
  courseViewMode: 'instructors' | 'instructor-courses' | 'all' = 'instructors';
  selectedInstructorForCourses: AdminUser | null = null;
  selectedInstructorIdForCourses: number | null = null;

  // Notifications state (Req 5)
  notifications: AdminNotification[] = [];
  unreadNotificationsCount = 0;
  showNotificationsDropdown = false;

  // Timeframe filter for Paid Students (Req 1)
  paidStudentsTimeframe: '7d' | '30d' | '1y' | 'all' = 'all';

  // Timeframe filter for Audit Logs (Req 1)
  logsTimeframe: '7d' | '30d' | '1y' | 'all' = 'all';

  // Enrollee state
  selectedCourseIdForEnrollees: number | null = null;
  studentIdToEnroll: number | null = null;

  // Forms
  studentForm: FormGroup;
  instructorForm: FormGroup;
  courseForm: FormGroup;
  adminProfileForm: FormGroup;

  // Modal states
  showStudentModal = false;
  isEditingStudent = false;
  selectedStudentId: number | null = null;

  showInstructorModal = false;
  isEditingInstructor = false;
  selectedInstructorId: number | null = null;

  showCourseModal = false;
  isEditingCourse = false;
  selectedCourseId: number | null = null;

  showAssignModal = false;
  selectedCourseToAssign: AdminCourse | null = null;
  newAssignedInstructorId: number | null = null;

  showEnrollModal = false;

  // Confirmation modal
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmCallback: (() => void) | null = null;

  // Toast
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Chart instances
  revenueChart: any = null;
  distributionChart: any = null;

  t = {
    en: {
      adminPanel: 'Admin Console',
      superAdminBadge: 'System Administrator',
      overview: 'Overview',
      students: 'Students',
      instructors: 'Instructors',
      courses: 'Courses',
      courseEnrollees: 'Course Enrollees',
      paidStudents: 'Paid Students',
      auditLogs: 'Audit Logs',
      accountSettings: 'Account Settings',
      logout: 'Log Out',
      systemStatusOk: 'Platform Operational',
      executiveOverview: 'Executive Analytics & KPI Monitoring',
      executiveOverviewDesc: 'Real-time performance indicators, active revenue flow, and platform engagement.',
      totalStudents: 'Total Students',
      totalInstructors: 'Total Instructors',
      totalCourses: 'Total Courses',
      totalEnrollments: 'Total Enrollments',
      platformRevenue: 'Platform Revenue',
      active: 'Active',
      verified: 'Verified',
      published: 'Published',
      paidCourse: 'Paid',
      freeCourse: 'Free',
      freeBadge: 'Free',
      paymentsCount: 'paid transactions',
      revenueTrendChartTitle: 'Revenue & Enrollment Trends',
      revenueTrendDesc: 'Historical monthly performance comparison across platform offerings.',
      revenueLegend: 'Revenue (EGP)',
      enrollmentsLegend: 'Enrollments Count',
      courseDistributionChartTitle: 'Course Catalog Distribution',
      courseDistributionDesc: 'Proportion of paid versus free course offerings.',
      topPerformingCourses: 'Top Performing Courses',
      topInstructors: 'Top Instructors',
      viewAll: 'View All',
      noDataAvailable: 'No statistical data available.',
      searchStudentsPlaceholder: 'Search students by name, email, or phone...',
      addStudent: 'Add Student',
      student: 'Student',
      email: 'Email',
      phone: 'Phone',
      enrolledCourses: 'Enrolled Courses',
      xpPoints: 'XP Points',
      actions: 'Actions',
      noStudentsFound: 'No students found matching your criteria.',
      edit: 'Edit',
      delete: 'Delete',
      coursesCountSuffix: 'courses',
      searchInstructorsPlaceholder: 'Search instructors by name, email, or specialization...',
      addInstructor: 'Add Instructor',
      instructor: 'Instructor',
      specialization: 'Specialization',
      assignedCourses: 'Assigned Courses',
      noInstructorsFound: 'No instructors found matching your criteria.',
      searchInstructorsForCourses: 'Search instructors to view their courses...',
      viewAllPlatformCourses: 'View All Platform Courses',
      createNewCourse: 'Create Course',
      viewInstructorCoursesBtn: 'View Instructor Courses',
      backToInstructors: 'Back to Instructors',
      allPlatformCoursesTitle: 'All Platform Courses',
      searchCoursesPlaceholder: 'Search courses by title or instructor...',
      noCoursesFound: 'No courses found.',
      studentsCountSuffix: 'students',
      viewEnrollees: 'Enrollees',
      enrolledStudents: 'Enrolled Students',
      assignInstructor: 'Reassign Instructor',
      courseEnrolleesManager: 'Course Enrollees Manager',
      courseEnrolleesDesc: 'View and manage real-time active students enrolled in any selected course.',
      selectCoursePlaceholder: 'Select a course to view enrollees...',
      enrollStudent: 'Enroll Student',
      pleaseSelectCourse: 'Please select a course from above to view its enrolled students.',
      noEnrolleesForCourse: 'No students are currently enrolled in this course.',
      enrolledAt: 'Enrolled Date',
      unenrollBtn: 'Remove Student',
      paidStudentsTitle: 'Paid Students & Subscription Ledger',
      paidStudentsDesc: 'Verified record of students who completed paid course enrollments.',
      totalPaidRecords: 'Paid Enrollments',
      totalPaidRevenue: 'Total Paid Revenue',
      platformShare: 'Platform Share (20%)',
      instructorShare: 'Instructors Share (80%)',
      coursePrice: 'Course Price',
      notifications: 'Notifications',
      markAllAsRead: 'Mark All as Read',
      clearAll: 'Clear All',
      noNotifications: 'No notifications at this time.',
      unread: 'unread',
      days7: '7 Days',
      days30: '30 Days',
      year1: '1 Year',
      allTime: 'All Time',
      searchPaidStudentsPlaceholder: 'Search by student, email, course, or instructor...',
      amountPaid: 'Amount Paid',
      status: 'Status',
      noPaidStudentsFound: 'No paid student records found.',
      auditLogsTitle: 'Administrative Action Logs',
      auditLogsDesc: 'Immutable audit log tracking all creation, updates, removals, and assignments.',
      filterLogsPlaceholder: 'Filter logs by action, details, admin...',
      action: 'Action',
      entity: 'Entity',
      details: 'Details',
      admin: 'Admin',
      timestamp: 'Timestamp',
      noAuditLogs: 'No audit logs found.',
      adminAccountSettingsTitle: 'Administrator Profile Settings',
      adminAccountSettingsDesc: 'Update your display username, contact number, and login credentials.',
      username: 'Full Name / Username',
      usernamePlaceholder: 'e.g. Ahmed Ali',
      password: 'Password',
      resetPasswordOptional: 'New Password (Optional)',
      leaveBlankIfSame: 'Leave blank to keep existing password',
      totalXP: 'Total XP',
      cancel: 'Cancel',
      save: 'Save Changes',
      saving: 'Saving...',
      securitySectionTitle: 'Security & Access Credentials',
      securitySectionDesc: 'Optionally update your password. Leave empty if you do not want to change it.',
      emailCantChange: 'Admin email address cannot be altered.',
      editStudentTitle: 'Edit Student Details',
      addStudentTitle: 'Create New Student',
      studentFormDesc: 'Update or create student profile credentials and XP.',
      editInstructorTitle: 'Edit Instructor Details',
      addInstructorTitle: 'Create New Instructor',
      instructorFormDesc: 'Manage teacher profile, bio, credentials, and discipline.',
      bio: 'Bio / Description',
      editCourseTitle: 'Edit Course Details',
      createCourseTitle: 'Create New Course',
      courseFormDesc: 'Configure course metadata, instructor assignment, and pricing.',
      courseTitle: 'Course Title',
      courseTitlePlaceholder: 'e.g. Master Conversational English A1-C1',
      selectInstructorPlaceholder: 'Select an instructor...',
      description: 'Description',
      descPlaceholder: 'Detailed course description...',
      coverImageUrl: 'Cover Image URL',
      pricingType: 'Pricing Type',
      price: 'Price',
      discountPercentage: 'Discount %',
      reassignInstructorTitle: 'Reassign Course Instructor',
      selectNewInstructor: 'Select New Instructor',
      enrollStudentModalTitle: 'Enroll Student into Course',
      selectStudentToEnroll: 'Select Student',
      selectStudentPlaceholder: 'Choose student to enroll...',
      enrollBtn: 'Enroll Now',
      processing: 'Processing...',
      confirmDeleteBtn: 'Confirm Delete'
    },
    ar: {
      adminPanel: 'لوحة تحكم المسؤول',
      superAdminBadge: 'مدير النظام المعتمد',
      overview: 'نظرة عامة',
      students: 'الطلاب',
      instructors: 'المعلمون',
      courses: 'الكورسات',
      courseEnrollees: 'المسجلون في الكورس',
      paidStudents: 'الطلاب المسددون',
      auditLogs: 'سجل العمليات والتدقيق',
      accountSettings: 'إعدادات الحساب',
      logout: 'تسجيل الخروج',
      systemStatusOk: 'المنصة تعمل بكفاءة',
      executiveOverview: 'التحليلات والمؤشرات الإدارية',
      executiveOverviewDesc: 'مؤشرات الأداء المباشرة، تدفقات الإيرادات ومتابعة تفاعل المنصة لحظياً.',
      totalStudents: 'إجمالي الطلاب',
      totalInstructors: 'إجمالي المعلمين',
      totalCourses: 'إجمالي الكورسات',
      totalEnrollments: 'إجمالي الاشتراكات',
      platformRevenue: 'أرباح المنصة',
      active: 'نشط',
      verified: 'معتمد',
      published: 'منشور',
      paidCourse: 'مدفوع',
      freeCourse: 'مجاني',
      freeBadge: 'مجاني',
      paymentsCount: 'معاملة مسددة',
      revenueTrendChartTitle: 'مؤشر الإيرادات ونمو الاشتراكات',
      revenueTrendDesc: 'مقارنة تاريخية شهرية للإيرادات وعدد الطلاب المشتركين.',
      revenueLegend: 'الإيرادات (ج.م)',
      enrollmentsLegend: 'عدد الاشتراكات',
      courseDistributionChartTitle: 'توزيع الكورسات (مجاني / مدفوع)',
      courseDistributionDesc: 'نسبة الكورسات المدفوعة مقارنة بالكورسات المجانية.',
      topPerformingCourses: 'أفضل الكورسات أداءً',
      topInstructors: 'أبرز المعلمين بالمنصة',
      viewAll: 'عرض الكل',
      noDataAvailable: 'لا توجد بيانات إحصائية متاحة حالياً.',
      searchStudentsPlaceholder: 'البحث عن طالب بالاسم، البريد أو الهاتف...',
      addStudent: 'إضافة طالب جديد',
      student: 'الطالب',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      enrolledCourses: 'الكورسات المشترك بها',
      xpPoints: 'نقاط الخبرة XP',
      actions: 'إجراءات',
      noStudentsFound: 'لا يوجد طلاب مطابقون لخيارات البحث.',
      edit: 'تعديل',
      delete: 'حذف',
      coursesCountSuffix: 'كورسات',
      searchInstructorsPlaceholder: 'البحث عن معلم بالاسم، البريد أو التخصص...',
      addInstructor: 'إضافة معلم جديد',
      instructor: 'المعلم',
      specialization: 'التخصص',
      assignedCourses: 'الكورسات المسندة',
      noInstructorsFound: 'لا يوجد معلمون مطابقون لخيارات البحث.',
      searchInstructorsForCourses: 'البحث عن معلم لعرض كورساته...',
      viewAllPlatformCourses: 'عرض جميع كورسات المنصة',
      createNewCourse: 'إنشاء كورس جديد',
      viewInstructorCoursesBtn: 'عرض كورسات المعلم',
      backToInstructors: 'العودة لقائمة المعلمين',
      allPlatformCoursesTitle: 'جميع كورسات المنصة',
      searchCoursesPlaceholder: 'البحث عن كورس بالعنوان أو اسم المعلم...',
      noCoursesFound: 'لا توجد كورسات مطابقة.',
      studentsCountSuffix: 'طالب',
      viewEnrollees: 'المسجلون',
      enrolledStudents: 'الطلاب المسجلون',
      assignInstructor: 'تعيين معلم للكورس',
      courseEnrolleesManager: 'إدارة الطلاب المسجلين بالكورس',
      courseEnrolleesDesc: 'عرض وإدارة الطلاب المشتركين فعلياً في أي كورس محدد وإمكانية تسجيل أو إلغاء اشتراك الطلاب.',
      selectCoursePlaceholder: 'اختر كورساً لعرض طلابه المسجلين...',
      enrollStudent: 'تسجيل طالب في الكورس',
      pleaseSelectCourse: 'يرجى اختيار كورس من القائمة بالأعلى لعرض الطلاب المسجلين فيه.',
      noEnrolleesForCourse: 'لا يوجد طلاب مسجلون في هذا الكورس حالياً.',
      enrolledAt: 'تاريخ التسجيل',
      unenrollBtn: 'إلغاء الاشتراك',
      paidStudentsTitle: 'سجل الطلاب المسددين والمدفوعات',
      paidStudentsDesc: 'سجل معتمد وموثق لجميع الطلاب الذين سددوا رسوم الكورسات على المنصة.',
      totalPaidRecords: 'الاشتراكات المدفوعة',
      totalPaidRevenue: 'إجمالي المحصل',
      platformShare: 'نسبة المنصة (20%)',
      instructorShare: 'نسبة المعلمين (80%)',
      coursePrice: 'سعر الكورس',
      notifications: 'الإشعارات',
      markAllAsRead: 'تحديد الكل كمقروء',
      clearAll: 'مسح الكل',
      noNotifications: 'لا توجد إشعارات حالياً.',
      unread: 'غير مقروء',
      days7: '7 أيام',
      days30: '30 يوماً',
      year1: 'سنة',
      allTime: 'كل الأوقات',
      searchPaidStudentsPlaceholder: 'البحث باسم الطالب، البريد، الكورس أو المعلم...',
      amountPaid: 'المبلغ المدفوع',
      status: 'الحالة',
      noPaidStudentsFound: 'لا توجد سجلات لطلاب مسددين مطابقة للبحث.',
      auditLogsTitle: 'سجل عمليات وتدقيق المشرفين',
      auditLogsDesc: 'سجل غير قابل للتعديل يوثق عمليات الإنشاء، التحديث، الحذف، والتعيينات الإدارية.',
      filterLogsPlaceholder: 'تصفية السجل بالإجراء، التفاصيل، اسم المشرف...',
      action: 'الإجراء',
      entity: 'الكيان',
      details: 'التفاصيل',
      admin: 'المشرف',
      timestamp: 'الوقت والتاريخ',
      noAuditLogs: 'لا توجد سجلات تدقيق.',
      adminAccountSettingsTitle: 'إعدادات حساب المسؤول',
      adminAccountSettingsDesc: 'تحديث اسم المسؤول، رقم الهاتف وتغيير كلمة المرور.',
      username: 'اسم المستخدم / الاسم الكامل',
      usernamePlaceholder: 'مثال: أحمد علي',
      password: 'كلمة المرور',
      resetPasswordOptional: 'كلمة مرور جديدة (اختياري)',
      leaveBlankIfSame: 'اترك الحقل فارغاً للاحتفاظ بكلمة المرور الحالية',
      totalXP: 'إجمالي نقاط الخبرة XP',
      cancel: 'إلغاء',
      save: 'حفظ التعديلات',
      saving: 'جارٍ الحفظ...',
      securitySectionTitle: 'بيانات الأمان وكلمة المرور',
      securitySectionDesc: 'يمكنك اختيار كلمة مرور جديدة، أو تركها فارغة للاحتفاظ بكلمة المرور الحالية.',
      emailCantChange: 'لا يمكن تعديل البريد الإلكتروني للمسؤول.',
      editStudentTitle: 'تعديل بيانات الطالب',
      addStudentTitle: 'إضافة طالب جديد',
      studentFormDesc: 'تعديل أو إنشاء بيانات حساب الطالب ونقاط الخبرة.',
      editInstructorTitle: 'تعديل بيانات المعلم',
      addInstructorTitle: 'إضافة معلم جديد',
      instructorFormDesc: 'إدارة بيانات المعلم، التخصص، النبذة الشخصية وكلمة المرور.',
      bio: 'نبذة عن المعلم',
      editCourseTitle: 'تعديل بيانات الكورس',
      createCourseTitle: 'إنشاء كورس جديد',
      courseFormDesc: 'تحديد بيانات الكورس، تعيين المعلم المسؤول، والسعر.',
      courseTitle: 'عنوان الكورس',
      courseTitlePlaceholder: 'مثال: كورس إتقان قواعد اللغة الإنجليزية',
      selectInstructorPlaceholder: 'اختر المعلم المسؤول...',
      description: 'الوصف',
      descPlaceholder: 'اكتب وصفاً مفصلاً للكورس ومحتواه...',
      coverImageUrl: 'رابط صورة الغلاف',
      pricingType: 'نوع التسعير',
      price: 'السعر',
      discountPercentage: 'نسبة الخصم %',
      reassignInstructorTitle: 'إعادة تعيين المعلم للكورس',
      selectNewInstructor: 'اختر المعلم الجديد',
      enrollStudentModalTitle: 'تسجيل طالب في الكورس يدوياً',
      selectStudentToEnroll: 'اختر الطالب',
      selectStudentPlaceholder: 'اختر طالباً لإضافته للكورس...',
      enrollBtn: 'تسجيل الآن',
      processing: 'جارٍ التنفيذ...',
      confirmDeleteBtn: 'تأكيد الحذف'
    }
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    public location: Location,
    private langService: LanguageService
  ) {
    this.studentForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      newPassword: [''],
      phoneNumber: [''],
      totalXP: [0]
    });

    this.instructorForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      newPassword: [''],
      phoneNumber: [''],
      specialization: [''],
      bio: ['']
    });

    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      instructorId: ['', Validators.required],
      description: [''],
      coverImageUrl: [''],
      isFree: [false],
      price: [0],
      discountPercentage: [0]
    });

    this.adminProfileForm = this.fb.group({
      username: ['', Validators.required],
      phoneNumber: [''],
      newPassword: ['']
    });
  }

  ngOnInit() {
    // 1. Language subscription
    this.langService.currentLang$.subscribe(l => {
      this.lang = l;
      if (this.activeTab === 'overview') {
        setTimeout(() => this.renderCharts(), 150);
      }
    });

    // 2. Auth & Admin Role Check
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    const roleStr = String(role).toLowerCase();
    if (roleStr !== '2' && roleStr !== 'admin') {
      this.showToast('Access Denied. Admin privileges required.', 'error');
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    // Extract admin name from token
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      this.adminName = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.unique_name || decoded.name || 'Super Admin';
    } catch {
      this.adminName = 'Super Admin';
    }

    // 3. Navigation optimization: Subscribe to queryParams (Req 2)
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] || 'overview';
      if (this.activeTab !== tab) {
        this.clearAllSearches();
      }
      this.activeTab = tab;

      if (tab === 'courses') {
        const mode = params['courseView'] || 'instructors';
        this.courseViewMode = mode;
        const instId = params['instructorId'];
        if (instId) {
          this.selectedInstructorIdForCourses = +instId;
          this.selectedInstructorForCourses = this.instructors.length > 0
            ? (this.instructors.find(i => i.id === this.selectedInstructorIdForCourses) || null)
            : null;
        } else {
          this.selectedInstructorIdForCourses = null;
          this.selectedInstructorForCourses = null;
        }
      }

      if (tab === 'enrollees') {
        const cid = params['courseId'];
        if (cid) {
          this.selectedCourseIdForEnrollees = +cid;
          this.onEnrolleeCourseSelected();
        }
      }

      // Load data corresponding to the active tab
      this.loadTabState(tab);
    });

    // Initial data fetches
    this.fetchAdminProfile();
    this.loadStats();
    this.fetchStudents();
    this.fetchInstructors();
    this.fetchCourses();
    this.fetchPaidStudents();
    this.fetchNotifications();
  }

  ngAfterViewInit() {
    if (this.activeTab === 'overview') {
      setTimeout(() => this.renderCharts(), 200);
    }
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleLanguage() {
    this.langService.toggleLanguage();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  clearAllSearches() {
    this.studentSearch = '';
    this.instructorSearch = '';
    this.instructorCourseSearch = '';
    this.courseSearch = '';
    this.paidStudentsSearch = '';
    this.logSearch = '';
  }

  // NAVIGATION FLOW OPTIMIZATION (Req 2 & Req 7):
  switchTab(tab: string, extraParams: any = {}) {
    this.clearAllSearches();
    const queryParams: any = { tab, ...extraParams };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: ''
    });
  }

  loadTabState(tab: string) {
    if (tab === 'overview') {
      this.loadStats();
      setTimeout(() => this.renderCharts(), 150);
    } else if (tab === 'students') {
      this.fetchStudents();
    } else if (tab === 'instructors') {
      this.fetchInstructors();
    } else if (tab === 'courses') {
      this.fetchCourses();
      this.fetchInstructors();
    } else if (tab === 'paid-students') {
      this.fetchPaidStudents();
    } else if (tab === 'enrollees') {
      if (this.courses.length === 0) this.fetchCourses();
    } else if (tab === 'logs') {
      this.fetchAuditLogs();
    } else if (tab === 'settings') {
      this.fetchAdminProfile();
    }
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'overview': return this.t[this.lang].overview;
      case 'students': return this.t[this.lang].students;
      case 'instructors': return this.t[this.lang].instructors;
      case 'courses': return this.t[this.lang].courses;
      case 'enrollees': return this.t[this.lang].courseEnrollees;
      case 'paid-students': return this.t[this.lang].paidStudents;
      case 'logs': return this.t[this.lang].auditLogs;
      case 'settings': return this.t[this.lang].accountSettings;
      default: return this.t[this.lang].adminPanel;
    }
  }

  // ==========================================
  // 1. STATS, TIMEFRAME & CHARTS (Req 6 & 7)
  // ==========================================
  setTimeframe(tf: string) {
    this.selectedTimeframe = tf;
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    const url = `${this.apiUrl}/stats?timeframe=${this.selectedTimeframe}`;
    this.http.get<AdminStats>(url, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.stats = res;
        this.isLoading = false;
        setTimeout(() => this.renderCharts(), 150);
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load dashboard statistics.', 'error');
      }
    });
  }

  destroyCharts() {
    if (this.revenueChart) {
      this.revenueChart.destroy();
      this.revenueChart = null;
    }
    if (this.distributionChart) {
      this.distributionChart.destroy();
      this.distributionChart = null;
    }
  }

  renderCharts() {
    if (typeof window === 'undefined' || this.activeTab !== 'overview' || !this.stats) return;

    this.destroyCharts();

    // Chart 1: Revenue & Enrollment Trend
    const ctx1 = document.getElementById('adminRevenueTrendChart') as HTMLCanvasElement;
    if (ctx1) {
      const labels = this.stats.chartLabels || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
      const revenueData = this.stats.revenueChartData || [0, 0, 0, 0, 1350, 500];
      const enrollmentData = this.stats.enrollmentChartData || [0, 0, 0, 0, 15, 8];

      this.revenueChart = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              type: 'line',
              label: this.t[this.lang].revenueLegend,
              data: revenueData,
              borderColor: '#4F46E5',
              backgroundColor: 'rgba(79, 70, 229, 0.12)',
              fill: true,
              tension: 0.35,
              yAxisID: 'yRevenue',
              borderWidth: 3,
              pointBackgroundColor: '#4F46E5',
              pointRadius: 4
            },
            {
              type: 'bar',
              label: this.t[this.lang].enrollmentsLegend,
              data: enrollmentData,
              backgroundColor: 'rgba(16, 185, 129, 0.65)',
              borderRadius: 8,
              yAxisID: 'yCount',
              barThickness: 22
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#130E35',
              padding: 12,
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 12 }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11, weight: 'bold' }, color: '#64748B' }
            },
            yRevenue: {
              type: 'linear',
              position: 'left',
              grid: { color: '#F1F5F9' },
              ticks: {
                font: { size: 10 },
                color: '#4F46E5',
                callback: (val) => val + (this.lang === 'ar' ? ' ج.م' : ' EGP')
              }
            },
            yCount: {
              type: 'linear',
              position: 'right',
              grid: { display: false },
              ticks: { font: { size: 10 }, color: '#10B981' }
            }
          }
        }
      });
    }

    // Chart 2: Course Distribution Doughnut (Paid vs Free)
    const ctx2 = document.getElementById('adminCourseDistributionChart') as HTMLCanvasElement;
    if (ctx2) {
      const paidCount = this.stats.paidCoursesCount || 0;
      const freeCount = this.stats.freeCoursesCount || 0;

      this.distributionChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: [this.t[this.lang].paidCourse, this.t[this.lang].freeCourse],
          datasets: [
            {
              data: [paidCount, freeCount],
              backgroundColor: ['#4F46E5', '#10B981'],
              borderWidth: 3,
              borderColor: '#FFFFFF',
              hoverOffset: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 12, weight: 'bold' }, boxWidth: 12, padding: 15 }
            }
          }
        }
      });
    }
  }

  // ==========================================
  // 2. STUDENTS MANAGEMENT
  // ==========================================
  fetchStudents() {
    this.isLoading = true;
    const url = this.studentSearch.trim()
      ? `${this.apiUrl}/students?search=${encodeURIComponent(this.studentSearch.trim())}`
      : `${this.apiUrl}/students`;

    this.http.get<AdminUser[]>(url, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.students = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load students.', 'error');
      }
    });
  }

  openAddStudentModal() {
    this.isEditingStudent = false;
    this.selectedStudentId = null;
    this.studentForm.reset({ totalXP: 0 });
    this.studentForm.get('password')?.setValidators([Validators.required]);
    this.studentForm.get('password')?.updateValueAndValidity();
    this.showStudentModal = true;
  }

  openEditStudentModal(student: AdminUser) {
    this.isEditingStudent = true;
    this.selectedStudentId = student.id;
    this.studentForm.get('password')?.clearValidators();
    this.studentForm.get('password')?.updateValueAndValidity();
    this.studentForm.patchValue({
      username: student.username,
      email: student.email,
      phoneNumber: student.phoneNumber || '',
      totalXP: student.totalXP || 0,
      newPassword: ''
    });
    this.showStudentModal = true;
  }

  saveStudent() {
    if (this.studentForm.invalid) return;
    this.isSubmitting = true;
    const formVal = this.studentForm.value;

    if (this.isEditingStudent && this.selectedStudentId) {
      const payload: any = {
        username: formVal.username,
        email: formVal.email,
        phoneNumber: formVal.phoneNumber,
        totalXP: formVal.totalXP
      };
      if (formVal.newPassword && formVal.newPassword.trim()) {
        payload.newPassword = formVal.newPassword.trim();
      }

      this.http.put(`${this.apiUrl}/students/${this.selectedStudentId}`, payload, { headers: this.getHeaders() }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showStudentModal = false;
          this.showToast(this.lang === 'ar' ? 'تم تحديث بيانات الطالب بنجاح' : 'Student updated successfully.', 'success');
          this.fetchStudents();
          this.loadStats();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Error updating student', 'error');
        }
      });
    } else {
      const payload = {
        username: formVal.username,
        email: formVal.email,
        password: formVal.password,
        phoneNumber: formVal.phoneNumber
      };

      this.http.post(`${this.apiUrl}/students`, payload, { headers: this.getHeaders() }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showStudentModal = false;
          this.showToast(this.lang === 'ar' ? 'تم إنشاء حساب الطالب بنجاح' : 'Student created successfully.', 'success');
          this.fetchStudents();
          this.loadStats();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Error creating student', 'error');
        }
      });
    }
  }

  // ==========================================
  // 3. INSTRUCTORS MANAGEMENT
  // ==========================================
  fetchInstructors() {
    this.isLoading = true;
    const url = this.instructorSearch.trim()
      ? `${this.apiUrl}/instructors?search=${encodeURIComponent(this.instructorSearch.trim())}`
      : `${this.apiUrl}/instructors`;

    this.http.get<AdminUser[]>(url, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.instructors = res;
        this.isLoading = false;
        if (this.selectedInstructorIdForCourses) {
          this.selectedInstructorForCourses = this.instructors.find(i => i.id === this.selectedInstructorIdForCourses) || null;
        }
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load instructors.', 'error');
      }
    });
  }

  openAddInstructorModal() {
    this.isEditingInstructor = false;
    this.selectedInstructorId = null;
    this.instructorForm.reset();
    this.instructorForm.get('password')?.setValidators([Validators.required]);
    this.instructorForm.get('password')?.updateValueAndValidity();
    this.showInstructorModal = true;
  }

  openEditInstructorModal(instructor: AdminUser) {
    this.isEditingInstructor = true;
    this.selectedInstructorId = instructor.id;
    this.instructorForm.get('password')?.clearValidators();
    this.instructorForm.get('password')?.updateValueAndValidity();
    this.instructorForm.patchValue({
      username: instructor.username,
      email: instructor.email,
      phoneNumber: instructor.phoneNumber || '',
      specialization: instructor.specialization || '',
      bio: instructor.bio || '',
      newPassword: ''
    });
    this.showInstructorModal = true;
  }

  saveInstructor() {
    if (this.instructorForm.invalid) return;
    this.isSubmitting = true;
    const formVal = this.instructorForm.value;

    if (this.isEditingInstructor && this.selectedInstructorId) {
      const payload: any = {
        username: formVal.username,
        email: formVal.email,
        phoneNumber: formVal.phoneNumber,
        specialization: formVal.specialization,
        bio: formVal.bio
      };
      if (formVal.newPassword && formVal.newPassword.trim()) {
        payload.newPassword = formVal.newPassword.trim();
      }

      this.http.put(`${this.apiUrl}/instructors/${this.selectedInstructorId}`, payload, { headers: this.getHeaders() }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showInstructorModal = false;
          this.showToast(this.lang === 'ar' ? 'تم تحديث بيانات المعلم بنجاح' : 'Instructor updated successfully.', 'success');
          this.fetchInstructors();
          this.loadStats();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Error updating instructor', 'error');
        }
      });
    } else {
      const payload = {
        username: formVal.username,
        email: formVal.email,
        password: formVal.password,
        phoneNumber: formVal.phoneNumber,
        specialization: formVal.specialization,
        bio: formVal.bio
      };

      this.http.post(`${this.apiUrl}/instructors`, payload, { headers: this.getHeaders() }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showInstructorModal = false;
          this.showToast(this.lang === 'ar' ? 'تم إنشاء حساب المعلم بنجاح' : 'Instructor created successfully.', 'success');
          this.fetchInstructors();
          this.loadStats();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Error creating instructor', 'error');
        }
      });
    }
  }

  // ==========================================
  // 4. COURSES FLOW (Req 10: Instructor first, All courses button)
  // ==========================================
  fetchCourses() {
    this.isLoading = true;
    this.http.get<AdminCourse[]>(`${this.apiUrl}/courses`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.courses = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load courses.', 'error');
      }
    });
  }

  getCoursesCountByInstructor(instructorId: number): number {
    return this.courses.filter(c => c.instructorId === instructorId).length;
  }

  get filteredInstructorsForCourses(): AdminUser[] {
    if (!this.instructorCourseSearch.trim()) return this.instructors;
    const q = this.instructorCourseSearch.trim().toLowerCase();
    return this.instructors.filter(i => 
      i.username.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      (i.specialization && i.specialization.toLowerCase().includes(q))
    );
  }

  viewInstructorCourses(instructor: AdminUser) {
    this.selectedInstructorForCourses = instructor;
    this.selectedInstructorIdForCourses = instructor.id;
    this.courseViewMode = 'instructor-courses';
    this.switchTab('courses', { courseView: 'instructor-courses', instructorId: instructor.id });
  }

  showAllCoursesView() {
    this.selectedInstructorForCourses = null;
    this.selectedInstructorIdForCourses = null;
    this.courseViewMode = 'all';
    this.switchTab('courses', { courseView: 'all' });
  }

  backToInstructorsCourseView() {
    this.selectedInstructorForCourses = null;
    this.selectedInstructorIdForCourses = null;
    this.courseViewMode = 'instructors';
    this.switchTab('courses', { courseView: 'instructors' });
  }

  get displayedCourses(): AdminCourse[] {
    let list = this.courses;
    if (this.courseViewMode === 'instructor-courses' && this.selectedInstructorIdForCourses) {
      list = list.filter(c => c.instructorId === this.selectedInstructorIdForCourses);
    }
    if (this.courseSearch.trim()) {
      const q = this.courseSearch.trim().toLowerCase();
      list = list.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.instructorName.toLowerCase().includes(q)
      );
    }
    return list;
  }

  openCreateCourseModal() {
    this.isEditingCourse = false;
    this.selectedCourseId = null;
    const defaultInstructorId = this.selectedInstructorForCourses ? this.selectedInstructorForCourses.id : '';
    this.courseForm.reset({ instructorId: defaultInstructorId, isFree: false, price: 0, discountPercentage: 0 });
    this.showCourseModal = true;
  }

  openEditCourseModal(course: AdminCourse) {
    this.isEditingCourse = true;
    this.selectedCourseId = course.id;
    this.courseForm.patchValue({
      title: course.title,
      instructorId: course.instructorId,
      description: course.description || '',
      coverImageUrl: course.coverImageUrl || '',
      isFree: course.isFree,
      price: course.price || 0,
      discountPercentage: course.discountPercentage || 0
    });
    this.showCourseModal = true;
  }

  saveCourse() {
    if (this.courseForm.invalid) return;
    this.isSubmitting = true;
    const formVal = this.courseForm.value;

    const payload = {
      title: formVal.title,
      instructorId: +formVal.instructorId,
      description: formVal.description,
      coverImageUrl: formVal.coverImageUrl,
      isFree: !!formVal.isFree,
      price: formVal.isFree ? 0 : (+formVal.price || 0),
      discountPercentage: +formVal.discountPercentage || 0
    };

    if (this.isEditingCourse && this.selectedCourseId) {
      this.http.put(`${this.apiUrl}/courses/${this.selectedCourseId}`, payload, { headers: this.getHeaders() }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showCourseModal = false;
          this.showToast(this.lang === 'ar' ? 'تم تحديث الكورس بنجاح' : 'Course updated successfully.', 'success');
          this.fetchCourses();
          this.loadStats();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Error updating course', 'error');
        }
      });
    } else {
      this.http.post(`${this.apiUrl}/courses`, payload, { headers: this.getHeaders() }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showCourseModal = false;
          this.showToast(this.lang === 'ar' ? 'تم إنشاء الكورس بنجاح' : 'Course created successfully.', 'success');
          this.fetchCourses();
          this.loadStats();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Error creating course', 'error');
        }
      });
    }
  }

  openAssignInstructorModal(course: AdminCourse) {
    this.selectedCourseToAssign = course;
    this.newAssignedInstructorId = course.instructorId;
    this.showAssignModal = true;
  }

  submitAssignInstructor() {
    if (!this.selectedCourseToAssign || !this.newAssignedInstructorId) return;
    this.isSubmitting = true;

    this.http.put(`${this.apiUrl}/courses/${this.selectedCourseToAssign.id}/assign-instructor`, 
      { instructorId: this.newAssignedInstructorId }, 
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showAssignModal = false;
        this.showToast(this.lang === 'ar' ? 'تم تعيين المعلم بنجاح' : 'Instructor reassigned successfully.', 'success');
        this.fetchCourses();
        this.fetchInstructors();
        this.loadStats();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showToast(err.error?.message || 'Error assigning instructor', 'error');
      }
    });
  }

  openDeleteCourseConfirm(course: AdminCourse) {
    this.confirmTitle = this.lang === 'ar' ? 'حذف الكورس نهائياً' : 'Delete Course';
    this.confirmMessage = this.lang === 'ar' 
      ? `هل أنت متأكد من رغبتك في حذف كورس "${course.title}"؟ سيتم حذف جميع الدروس والاشتراكات المتعلقة به.` 
      : `Are you sure you want to delete course "${course.title}"? All related modules, lessons, and enrollments will be permanently removed.`;
    
    this.confirmCallback = () => {
      this.isSubmitting = true;
      this.http.delete(`${this.apiUrl}/courses/${course.id}`, { headers: this.getHeaders() }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showConfirmModal = false;
          this.showToast(this.lang === 'ar' ? 'تم حذف الكورس بنجاح' : 'Course deleted successfully.', 'success');
          this.fetchCourses();
          this.loadStats();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Error deleting course', 'error');
        }
      });
    };
    this.showConfirmModal = true;
  }

  // ==========================================
  // 5. COURSE ENROLLEES
  // ==========================================
  viewCourseEnrollees(course: AdminCourse) {
    this.selectedCourseIdForEnrollees = course.id;
    this.switchTab('enrollees', { courseId: course.id });
  }

  getSelectedCourseTitle(): string {
    if (!this.selectedCourseIdForEnrollees) return '';
    const c = this.courses.find(x => x.id === this.selectedCourseIdForEnrollees);
    return c ? c.title : '';
  }

  onEnrolleeCourseSelected() {
    if (!this.selectedCourseIdForEnrollees) {
      this.enrollees = [];
      return;
    }

    this.isLoading = true;
    this.http.get<AdminEnrollee[]>(`${this.apiUrl}/courses/${this.selectedCourseIdForEnrollees}/enrollees`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.enrollees = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load course enrollees.', 'error');
      }
    });
  }

  openEnrollStudentModal() {
    this.studentIdToEnroll = null;
    this.showEnrollModal = true;
  }

  submitEnrollStudent() {
    if (!this.selectedCourseIdForEnrollees || !this.studentIdToEnroll) return;
    this.isSubmitting = true;

    this.http.post(`${this.apiUrl}/courses/${this.selectedCourseIdForEnrollees}/enroll`, 
      { studentId: this.studentIdToEnroll }, 
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showEnrollModal = false;
        this.showToast(this.lang === 'ar' ? 'تم تسجيل الطالب في الكورس بنجاح' : 'Student enrolled successfully.', 'success');
        this.onEnrolleeCourseSelected();
        this.fetchCourses();
        this.loadStats();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showToast(err.error?.message || 'Error enrolling student', 'error');
      }
    });
  }

  openUnenrollConfirm(enrollee: AdminEnrollee) {
    if (!this.selectedCourseIdForEnrollees) return;
    this.confirmTitle = this.lang === 'ar' ? 'إلغاء اشتراك الطالب' : 'Remove Student from Course';
    this.confirmMessage = this.lang === 'ar'
      ? `هل أنت متأكد من رغبتك في إزالة الطالب "${enrollee.studentName}" من هذا الكورس؟`
      : `Are you sure you want to remove student "${enrollee.studentName}" from this course?`;

    this.confirmCallback = () => {
      this.isSubmitting = true;
      this.http.delete(`${this.apiUrl}/courses/${this.selectedCourseIdForEnrollees}/enroll/${enrollee.studentId}`, { headers: this.getHeaders() }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showConfirmModal = false;
          this.showToast(this.lang === 'ar' ? 'تم إلغاء اشتراك الطالب بنجاح' : 'Student removed successfully.', 'success');
          this.onEnrolleeCourseSelected();
          this.fetchCourses();
          this.loadStats();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Error removing student', 'error');
        }
      });
    };
    this.showConfirmModal = true;
  }

  // ==========================================
  // 6. PAID STUDENTS (Req 5)
  // ==========================================
  fetchPaidStudents() {
    this.isLoading = true;
    const url = this.paidStudentsSearch.trim()
      ? `${this.apiUrl}/paid-students?search=${encodeURIComponent(this.paidStudentsSearch.trim())}`
      : `${this.apiUrl}/paid-students`;

    this.http.get<AdminPaidStudent[]>(url, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.paidStudents = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load paid students records.', 'error');
      }
    });
  }

  setPaidTimeframe(tf: '7d' | '30d' | '1y' | 'all') {
    this.paidStudentsTimeframe = tf;
  }

  get filteredPaidStudents(): AdminPaidStudent[] {
    let list = this.paidStudents;
    if (this.paidStudentsTimeframe !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (this.paidStudentsTimeframe === '7d') cutoff.setDate(now.getDate() - 7);
      else if (this.paidStudentsTimeframe === '30d') cutoff.setDate(now.getDate() - 30);
      else if (this.paidStudentsTimeframe === '1y') cutoff.setFullYear(now.getFullYear() - 1);

      list = list.filter(item => {
        if (!item.enrolledAt) return true;
        const d = this.ensureUtcDate(item.enrolledAt);
        return d >= cutoff;
      });
    }

    if (this.paidStudentsSearch.trim()) {
      const q = this.paidStudentsSearch.trim().toLowerCase();
      list = list.filter(p =>
        p.studentName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.courseTitle.toLowerCase().includes(q) ||
        p.instructorName.toLowerCase().includes(q)
      );
    }
    return list;
  }

  calculateTotalPaidRevenue(): number {
    return this.filteredPaidStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  }

  calculatePlatformShare(): number {
    return Math.round(this.calculateTotalPaidRevenue() * 0.20);
  }

  calculateInstructorShare(): number {
    return Math.round(this.calculateTotalPaidRevenue() * 0.80);
  }

  // ==========================================
  // 7. DELETE USERS (Generic)
  // ==========================================
  openDeleteUserConfirm(user: AdminUser, type: 'Student' | 'Instructor') {
    this.confirmTitle = this.lang === 'ar' 
      ? `حذف ${type === 'Student' ? 'الطالب' : 'المعلم'}` 
      : `Delete ${type}`;
    
    this.confirmMessage = this.lang === 'ar'
      ? `هل أنت متأكد من حذف الحساب "${user.username}" نهائياً من المنصة؟`
      : `Are you sure you want to permanently delete account "${user.username}"?`;

    this.confirmCallback = () => {
      this.isSubmitting = true;
      const endpoint = type === 'Student' ? 'students' : 'instructors';
      this.http.delete(`${this.apiUrl}/${endpoint}/${user.id}`, { headers: this.getHeaders() }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showConfirmModal = false;
          this.showToast(this.lang === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully.', 'success');
          if (type === 'Student') this.fetchStudents();
          else this.fetchInstructors();
          this.loadStats();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Error during deletion', 'error');
        }
      });
    };
    this.showConfirmModal = true;
  }

  executeConfirmAction() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
  }

  // ==========================================
  // 8. AUDIT LOGS
  // ==========================================
  fetchAuditLogs() {
    this.isLoading = true;
    this.http.get<AdminAuditLog[]>(`${this.apiUrl}/logs?limit=100`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.auditLogs = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load audit logs.', 'error');
      }
    });
  }

  setLogsTimeframe(tf: '7d' | '30d' | '1y' | 'all') {
    this.logsTimeframe = tf;
  }

  get filteredAuditLogs(): AdminAuditLog[] {
    let list = this.auditLogs;
    if (this.logsTimeframe !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (this.logsTimeframe === '7d') cutoff.setDate(now.getDate() - 7);
      else if (this.logsTimeframe === '30d') cutoff.setDate(now.getDate() - 30);
      else if (this.logsTimeframe === '1y') cutoff.setFullYear(now.getFullYear() - 1);

      list = list.filter(item => {
        if (!item.timestamp) return true;
        const d = this.ensureUtcDate(item.timestamp);
        return d >= cutoff;
      });
    }

    if (this.logSearch.trim()) {
      const q = this.logSearch.trim().toLowerCase();
      list = list.filter(l => 
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.adminUsername.toLowerCase().includes(q)
      );
    }
    return list;
  }

  // ==========================================
  // 9. ADMIN ACCOUNT PROFILE SETTINGS (Req 8)
  // ==========================================
  fetchAdminProfile() {
    this.http.get<AdminProfile>(`${this.apiUrl}/profile`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.adminProfile = res;
        this.adminProfileForm.patchValue({
          username: res.username,
          phoneNumber: res.phoneNumber || '',
          newPassword: ''
        });
      },
      error: () => {}
    });
  }

  saveAdminProfile() {
    if (this.adminProfileForm.invalid) return;
    this.isSubmitting = true;
    const val = this.adminProfileForm.value;

    const payload: any = {
      username: val.username,
      phoneNumber: val.phoneNumber
    };
    if (val.newPassword && val.newPassword.trim()) {
      payload.newPassword = val.newPassword.trim();
    }

    this.http.put(`${this.apiUrl}/profile`, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showToast(this.lang === 'ar' ? 'تم حفظ التعديلات بنجاح' : 'Profile updated successfully.', 'success');
        this.fetchAdminProfile();
        this.adminProfileForm.patchValue({ newPassword: '' });
        // Requirement 6: Return to Overview when editing profile
        this.switchTab('overview');
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showToast(err.error?.message || 'Error updating profile', 'error');
      }
    });
  }

  // ==========================================
  // 10. NOTIFICATIONS SYSTEM (Req 5)
  // ==========================================
  toggleNotifications() {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    if (this.showNotificationsDropdown) {
      this.fetchNotifications();
    }
  }

  fetchNotifications() {
    this.http.get<AdminNotification[]>(`${this.apiUrl}/notifications`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.notifications = res || [];
        this.unreadNotificationsCount = this.notifications.filter(n => !n.isRead).length;
      },
      error: () => {}
    });
  }

  markNotificationAsRead(notif: AdminNotification) {
    if (notif.isRead) return;
    this.http.post(`${this.apiUrl}/notifications/${notif.id}/read`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        notif.isRead = true;
        this.unreadNotificationsCount = this.notifications.filter(n => !n.isRead).length;
      },
      error: () => {}
    });
  }

  markAllNotificationsAsRead() {
    this.http.post(`${this.apiUrl}/notifications/read-all`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadNotificationsCount = 0;
      },
      error: () => {}
    });
  }

  deleteAllNotifications() {
    this.http.delete(`${this.apiUrl}/notifications/all`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.notifications = [];
        this.unreadNotificationsCount = 0;
      },
      error: () => {}
    });
  }

  getNotificationType(message: string): string {
    if (!message) return 'SYSTEM';
    if (message.includes('||')) {
      return message.split('||')[0].trim();
    }
    if (message.includes('ENROLLMENT_PAID') || message.includes('paid')) return 'ENROLLMENT_PAID';
    if (message.includes('enrolled')) return 'ENROLLMENT';
    if (message.includes('Instructor') || message.includes('Student') || message.includes('registered')) return 'NEW_USER';
    return 'SYSTEM';
  }

  getNotificationTitle(message: string): string {
    if (!message) return '';
    const parts = message.split('||');
    if (parts.length >= 3) {
      return this.lang === 'ar' ? parts[1].trim() : parts[2].trim();
    } else if (parts.length === 2) {
      return parts[1].trim();
    }
    return message;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showNotificationsDropdown) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-container')) {
      this.showNotificationsDropdown = false;
    }
  }

  // ==========================================
  // 11. DATE & TIME HELPERS (Req 4: Local laptop time)
  // ==========================================
  ensureUtcDate(dateVal: any): Date {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    let str = String(dateVal);
    if (!str.endsWith('Z') && !str.includes('+') && str.includes('T')) {
      str += 'Z';
    }
    return new Date(str);
  }

  formatDateTime(dateVal: any): string {
    if (!dateVal) return '';
    const d = this.ensureUtcDate(dateVal);
    return d.toLocaleString(this.lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '';
    const d = this.ensureUtcDate(dateVal);
    return d.toLocaleDateString(this.lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTimeAgo(dateVal: any): string {
    if (!dateVal) return '';
    const d = this.ensureUtcDate(dateVal);
    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));
    if (diffSec < 60) return this.lang === 'ar' ? 'الآن' : 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return this.lang === 'ar' ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return this.lang === 'ar' ? `منذ ${diffHrs} ساعة` : `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return this.lang === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  }
}

