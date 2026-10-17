import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="min-h-screen bg-[#F4F7FE] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col font-sans" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- رسالة نجاح أو خطأ -->
      <div *ngIf="message" [ngClass]="{'bg-emerald-500': messageType === 'success', 'bg-rose-500': messageType === 'error'}" class="fixed top-5 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-xl text-white font-bold transition-all flex items-center gap-3">
        <span>{{ message }}</span>
      </div>

      <header class="bg-[#130E35] dark:bg-slate-900 border-b border-indigo-900/50 dark:border-slate-800 text-white px-8 py-5 flex items-center justify-between shadow-md">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            <span class="rtl:rotate-180">←</span>
          </button>
          <h1 class="text-xl font-bold">{{ t[lang].title }}</h1>
        </div>
      </header>

      <main class="flex-1 max-w-2xl w-full mx-auto p-6 lg:p-10">
        <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-8">
          
          <!-- قسم صورة البروفايل -->
          <div class="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div class="relative group">
              <img [src]="profileData.profileImage ? 'https://qimma.runasp.net' + profileData.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + profileData.username)" class="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 dark:border-slate-700 shadow-md">
              <label class="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
                📷 {{ t[lang].change }}
                <input type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden">
              </label>
            </div>
            <div class="text-center sm:text-start">
              <h3 class="font-extrabold text-lg text-slate-900 dark:text-white">{{ profileData.username }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ profileData.email }}</p>
              <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">Role: {{ profileData.role === '1' ? 'Teacher' : 'Student' }}</p>
              <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{{ lang === 'ar' ? 'الحد الأقصى للصورة: 1 ميجابايت' : 'Max image size: 1 MB' }}</p>
            </div>
          </div>

          <!-- نموذج تعديل البيانات -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{{ t[lang].username }}</label>
              <input type="text" [(ngModel)]="profileData.username" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium">
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{{ t[lang].phone }}</label>
              <input type="text" [(ngModel)]="profileData.phoneNumber" [placeholder]="t[lang].phonePlaceholder" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium">
            </div>
          </div>

          <button (click)="saveProfile()" [disabled]="isSaving" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition disabled:opacity-50">
            {{ isSaving ? t[lang].saving : t[lang].saveBtn }}
          </button>

        </div>
      </main>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  profileData: any = { username: '', email: '', phoneNumber: '', profileImage: '' };
  isSaving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  lang: 'en' | 'ar' = 'en';

  t = {
    en: { title: 'Account Settings', change: 'Change', username: 'Full Name / Username', phone: 'Phone Number', phonePlaceholder: 'Enter your phone number...', saveBtn: 'Save Changes', saving: 'Saving...', success: 'Profile updated successfully! 🚀', error: 'Failed to update profile ❌' },
    ar: { title: 'إعدادات الحساب', change: 'تغيير', username: 'الاسم / اسم المستخدم', phone: 'رقم الهاتف', phonePlaceholder: 'أدخل رقم هاتفك...', saveBtn: 'حفظ التغييرات', saving: 'جاري الحفظ...', success: 'تم تحديث البروفايل بنجاح! 🚀', error: 'فشل تحديث البروفايل ❌' }
  };

  constructor(private http: HttpClient, private router: Router, private langService: LanguageService) {}

  ngOnInit() {
    this.langService.currentLang$.subscribe((l: any) => this.lang = l);
    this.loadProfile();
  }

  loadProfile() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('https://qimma.runasp.net/api/user/profile', { headers }).subscribe({
      next: (res: any) => { this.profileData = res; },
      error: () => {}
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        this.showMessage(this.lang === 'ar' ? 'حجم الصورة يتجاوز الحد الأقصى المسموح به (1 ميجابايت)' : 'Image size exceeds maximum limit (1 MB)', 'error');
        event.target.value = '';
        return;
      }
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.post('https://qimma.runasp.net/api/user/upload-avatar', formData, { headers }).subscribe({
        next: (res: any) => {
          this.profileData.profileImage = res.profileImage;
          this.showMessage(this.lang === 'ar' ? 'تم رفع الصورة بنجاح' : 'Avatar uploaded successfully', 'success');
        },
        error: () => {
          this.showMessage(this.lang === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload avatar', 'error');
        }
      });
    }
  }

  saveProfile() {
    this.isSaving = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const updateModel = {
      username: this.profileData.username,
      phoneNumber: this.profileData.phoneNumber
    };

    this.http.put('https://qimma.runasp.net/api/user/profile', updateModel, { headers }).subscribe({
      next: () => {
        this.isSaving = false;
        this.showMessage(this.t[this.lang].success, 'success');
      },
      error: () => {
        this.isSaving = false;
        this.showMessage(this.t[this.lang].error, 'error');
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3500);
  }

  goBack() {
    const role = localStorage.getItem('userRole');
    if (role === 'Teacher' || role === '1') {
      this.router.navigate(['/teacher-dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}