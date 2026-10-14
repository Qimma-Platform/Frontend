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
      
      <div *ngIf="message" [ngClass]="{'bg-emerald-600 shadow-emerald-500/30': messageType === 'success', 'bg-rose-600 shadow-rose-500/30': messageType === 'error'}" class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl text-white font-bold transition-all duration-300 flex items-center gap-3 animate-fade-in pointer-events-auto border border-white/20">
        <span *ngIf="messageType === 'success'" class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
        <span *ngIf="messageType === 'error'" class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">⚠️</span>
        <span class="text-sm font-bold tracking-wide">{{ message }}</span>
      </div>

      <!-- Settings & Other Modals -->
      <div *ngIf="showCropModal" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4 animate-fade-in">
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

      <div *ngIf="showDeleteModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
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

      <!-- EDIT COURSE MODAL (Matching Add New Schedule Event style) -->
      <div *ngIf="showEditCourseModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900">{{ lang === 'ar' ? 'تعديل بيانات الكورس' : 'Edit Course Details' }}</h3>
              <p class="text-slate-500 text-xs mt-0.5">{{ lang === 'ar' ? 'قم بتعديل تفاصيل الكورس بالأسفل.' : 'Update the course details below.' }}</p>
            </div>
            <button (click)="closeEditCourseModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition">✕</button>
          </div>

          <div *ngIf="editCourseError" class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <svg class="w-4 h-4 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{{ editCourseError }}</span>
          </div>

          <form [formGroup]="editCourseForm" (ngSubmit)="saveCourseEdit()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].courseTitle }} <span class="text-rose-500">*</span></label>
              <input type="text" formControlName="title" placeholder="{{ lang === 'ar' ? 'عنوان الكورس...' : 'Course Title...' }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].desc }} <span class="text-slate-400 font-normal">({{ lang === 'ar' ? 'اختياري' : 'Optional' }})</span></label>
              <textarea formControlName="description" rows="3" placeholder="{{ lang === 'ar' ? 'وصف وتفاصيل الكورس...' : 'Course description & details...' }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].courseType }}</label>
              <div class="flex items-center gap-6 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="isFree" [value]="true" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                  <span>{{ t[lang].freeCourse }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="isFree" [value]="false" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                  <span>{{ t[lang].paidCourse }}</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3" *ngIf="!editCourseForm.get('isFree')?.value">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].price }}</label>
                <div class="relative">
                  <input type="number" formControlName="price" placeholder="0" class="w-full pl-3 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-left" style="direction: ltr;">
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                </div>
                <p class="text-[11px] text-amber-600 mt-1 font-medium leading-tight">
                  {{ lang === 'ar' ? 'تنبيه: تخصم المنصة نسبة 20% من سعر الكورس.' : 'Notice: Platform deducts 20% of the price.' }}
                </p>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].discount }}</label>
                <div class="relative">
                  <input type="number" formControlName="discountPercentage" placeholder="0" class="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-left" style="direction: ltr;">
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].uploadCover }}</label>
              <div class="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition cursor-pointer relative overflow-hidden group">
                <input type="file" (change)="onEditFileSelected($event)" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                <div *ngIf="!editCourseImagePreview" class="text-center pointer-events-none py-2">
                  <p class="text-xs font-bold text-indigo-600">{{ t[lang].clickToUpload }}</p>
                </div>
                <div *ngIf="editCourseImagePreview" class="w-full h-32 relative rounded-xl overflow-hidden pointer-events-none">
                  <img [src]="editCourseImagePreview" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="text-white font-bold text-xs bg-black/60 px-3 py-1.5 rounded-lg">✏️ {{ t[lang].changeImage }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-3 border-t border-slate-100">
              <button type="button" (click)="closeEditCourseModal()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition">{{ t[lang].cancel }}</button>
              <button type="submit" [disabled]="isSaving || !editCourseForm.valid" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                <span>{{ isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- UNSAVED CHANGES WARNING MODAL (Overlay above settings, Red warning style) -->
      <div *ngIf="showUnsavedModal" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-fade-in">
        <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl w-full max-w-sm transform transition-all animate-scale-in border border-rose-100">
          <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg class="w-8 h-8 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
                <h4 class="font-bold text-sm text-slate-900 truncate">{{ editProfileData.fullName || 'Teacher' }}</h4>
                <p class="text-xs text-slate-500 truncate">{{ editProfileData.email }}</p>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg mt-1 inline-block">{{ editProfileData.specialization || t[lang].teacher }}</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].fullName }} <span class="text-rose-500">*</span></label>
              <input type="text" [(ngModel)]="editProfileData.fullName" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].specialization }} <span class="text-rose-500">*</span></label>
              <input type="text" [(ngModel)]="editProfileData.specialization" [placeholder]="t[lang].specPlaceholder" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].email }}</label>
              <input type="email" [(ngModel)]="editProfileData.email" disabled class="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm font-medium">
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
              <button (click)="saveProfile()" [disabled]="isSaving || !editProfileData.specialization || editProfileData.specialization.trim() === '' || !editProfileData.fullName || editProfileData.fullName.trim() === ''" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-md disabled:opacity-50">
                {{ isSaving ? t[lang].saving : t[lang].saveBtn }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CREATE COURSE MODAL (Placed at root level with z-[100] to cover entire screen) -->
      <div *ngIf="showCreateForm" class="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-extrabold text-xl text-slate-900">{{ t[lang].createCourse }}</h3>
              <p class="text-slate-500 text-xs mt-0.5">{{ t[lang].fillDetails }}</p>
            </div>
            <button (click)="cancelCreateCourse()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold">✕</button>
          </div>
          <form [formGroup]="courseForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].courseTitle }}</label>
              <input type="text" formControlName="title" placeholder="{{ lang === 'ar' ? 'عنوان الكورس...' : 'Course Title...' }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ lang === 'ar' ? 'الوصف (اختياري)' : 'Description (Optional)' }}</label>
              <textarea formControlName="description" rows="3" placeholder="{{ lang === 'ar' ? 'وصف وتفاصيل الكورس...' : 'Course description & details...' }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].courseType }}</label>
              <div class="flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input type="radio" formControlName="isFree" [value]="true" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                  <span>{{ t[lang].freeCourse }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input type="radio" formControlName="isFree" [value]="false" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                  <span>{{ t[lang].paidCourse }}</span>
                </label>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3" *ngIf="!courseForm.get('isFree')?.value">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].price }}</label>
                <div class="relative">
                  <input type="number" formControlName="price" placeholder="0" class="w-full pl-3 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-left" style="direction: ltr;">
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                </div>
                <p class="text-[11px] text-amber-600 mt-1.5 font-medium leading-tight">
                  {{ lang === 'ar' ? 'تنبيه: تخصم المنصة نسبة 20% من سعر الكورس.' : 'Notice: Platform deducts 20% of the price.' }}
                </p>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].discount }}</label>
                <div class="relative">
                  <input type="number" formControlName="discountPercentage" placeholder="0" class="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none text-left" style="direction: ltr;">
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t[lang].uploadCover }}</label>
              <div class="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition cursor-pointer relative overflow-hidden group">
                <input type="file" (change)="onFileSelected($event)" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                <div *ngIf="!imagePreview" class="text-center pointer-events-none py-2">
                  <p class="text-xs font-bold text-indigo-600">{{ t[lang].clickToUpload }}</p>
                </div>
                <div *ngIf="imagePreview" class="w-full h-32 relative rounded-xl overflow-hidden pointer-events-none">
                  <img [src]="imagePreview" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="text-white font-bold text-xs bg-black/50 px-3 py-1.5 rounded-lg">✏️ {{ t[lang].changeImage }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex gap-3 pt-3">
              <button type="button" (click)="cancelCreateCourse()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition">{{ t[lang].cancel }}</button>
              <button type="submit" [disabled]="!courseForm.valid || isSaving" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md">{{ isSaving ? t[lang].saving : t[lang].publishBtn }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- SCHEDULE EVENT CREATION MODAL (Placed at root level with z-[100] to cover entire screen) -->
      <div *ngIf="showEventForm" class="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-extrabold text-xl text-slate-900">{{ lang === 'ar' ? 'إضافة موعد جديد في الجدول' : 'Add New Schedule Event' }}</h3>
            <button (click)="cancelCreateEvent()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition">✕</button>
          </div>

          <div *ngIf="eventFormError" class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <svg class="w-4 h-4 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{{ eventFormError }}</span>
          </div>

          <form [formGroup]="eventForm" (ngSubmit)="submitEvent()" class="space-y-4">
            <div class="relative">
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ lang === 'ar' ? 'الكورس المرتبط' : 'Related Course' }}</label>
              <button type="button" 
                      (click)="isCourseDropdownOpen = !isCourseDropdownOpen" 
                      class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none flex items-center justify-between text-start cursor-pointer hover:bg-slate-100/70 transition">
                <span class="truncate" [ngClass]="eventForm.get('courseId')?.value ? 'text-slate-900 font-semibold' : 'text-slate-400'">
                  {{ getSelectedCourseTitle() || (lang === 'ar' ? 'اختر الكورس...' : 'Select course...') }}
                </span>
                <svg class="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200" [ngClass]="{'rotate-180': isCourseDropdownOpen}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>

              <!-- Dropdown List limited to ~3 items with clean scrollbar -->
              <div *ngIf="isCourseDropdownOpen" class="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fade-in">
                <div class="max-h-36 overflow-y-auto divide-y divide-slate-100">
                  <div *ngFor="let c of courses; trackBy: trackById" 
                       (click)="selectEventCourse(c.id)" 
                       class="px-4 py-2.5 hover:bg-indigo-50/60 cursor-pointer text-sm font-medium transition flex items-center justify-between"
                       [ngClass]="eventForm.get('courseId')?.value == c.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'">
                    <span class="truncate">{{ c.title }}</span>
                    <svg *ngIf="eventForm.get('courseId')?.value == c.id" class="w-4 h-4 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div *ngIf="courses.length === 0" class="px-4 py-3 text-xs text-slate-400 text-center">
                    {{ lang === 'ar' ? 'لا توجد كورسات متاحة' : 'No courses available' }}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ lang === 'ar' ? 'عنوان الحدث' : 'Event Title' }}</label>
              <input type="text" formControlName="title" placeholder="{{ lang === 'ar' ? 'مثال: محاضرة مراجعة البلاغة' : 'e.g. Grammar Review Session' }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ lang === 'ar' ? 'نوع الحدث' : 'Event Type' }}</label>
              <input type="text" formControlName="eventType" placeholder="{{ lang === 'ar' ? 'مثال: Live, Deadline, Workshop...' : 'e.g. Live, Deadline, Workshop...' }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ lang === 'ar' ? 'تاريخ ووقت الحدث' : 'Event Date & Time' }}</label>
              <input type="datetime-local" formControlName="eventDate" [min]="minDate" (click)="$any($event.target).showPicker?.()" (keydown)="preventDateKeyboardTyping($event)" (input)="validateEventDate($event)" (change)="validateEventDate($event)" style="accent-color: #4f46e5 !important;" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none accent-indigo-600">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ lang === 'ar' ? 'الوصف (اختياري)' : 'Description (Optional)' }}</label>
              <textarea formControlName="description" rows="3" placeholder="{{ lang === 'ar' ? 'ملاحظات وتفاصيل إضافية للطلاب...' : 'Additional notes for students...' }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none"></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button type="button" (click)="cancelCreateEvent()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition">{{ t[lang].cancel }}</button>
              <button type="submit" [disabled]="!eventForm.valid || isSaving" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md">
                {{ isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'إضافة الحدث' : 'Add Event') }}
              </button>
            </div>
          </form>
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
          <div *ngIf="!isSidebarCollapsed" class="text-xs uppercase tracking-wider text-white/40 px-3 mb-2">{{ t[lang].menu }}</div>
          <a (click)="switchTab('dashboard')" [title]="t[lang].dashboard" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'dashboard', 'text-white/70 hover:bg-white/5': activeTab !== 'dashboard', 'justify-center px-2': isSidebarCollapsed}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="2"></rect><rect x="14" y="3" width="7" height="7" rx="2"></rect><rect x="14" y="14" width="7" height="7" rx="2"></rect><rect x="3" y="14" width="7" height="7" rx="2"></rect></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].dashboard }}</span>
          </a>
          <a (click)="switchTab('courses')" [title]="t[lang].myCourses" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'courses', 'text-white/70 hover:bg-white/5': activeTab !== 'courses', 'justify-center px-2': isSidebarCollapsed}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].myCourses }}</span>
          </a>
          <a (click)="switchTab('students')" [title]="t[lang].students" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'students', 'text-white/70 hover:bg-white/5': activeTab !== 'students', 'justify-center px-2': isSidebarCollapsed}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].students }}</span>
          </a>
          <a (click)="switchTab('live')" [title]="t[lang].liveSessions" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'live', 'text-white/70 hover:bg-white/5': activeTab !== 'live', 'justify-center px-2': isSidebarCollapsed}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].liveSessions }}</span>
          </a>
          <a (click)="switchTab('schedule')" [title]="t[lang].schedule" [ngClass]="{'bg-indigo-600/40 text-white': activeTab === 'schedule', 'text-white/70 hover:bg-white/5': activeTab !== 'schedule', 'justify-center px-2': isSidebarCollapsed}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span *ngIf="!isSidebarCollapsed" class="truncate">{{ t[lang].schedule }}</span>
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
            <img [src]="userData?.profileImage ? 'http://localhost:5162' + userData.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + (userData?.username || 'Teacher'))" class="w-9 h-9 rounded-full bg-white/10 object-cover shrink-0" />
            <div *ngIf="!isSidebarCollapsed" class="min-w-0">
              <p class="text-sm font-semibold truncate">{{ userData?.username || 'Loading...' }}</p>
              <p class="text-xs text-indigo-300 truncate">{{ userData?.specialization || t[lang].teacher }}</p>
            </div>
          </div>
        </div>
      </aside>
      
      <!-- Main Content -->
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
              <input type="text" [(ngModel)]="searchQuery" [placeholder]="lang === 'ar' ? 'ابحث...' : 'Search...'" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all dir-ltr text-left">
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
                  <div *ngFor="let notif of notifications; trackBy: trackById" (click)="onNotificationClick(notif)" 
                       [ngClass]="{'bg-indigo-50/40': !notif.isRead}"
                       class="p-4 hover:bg-slate-50 transition cursor-pointer flex items-start justify-between gap-3 group">
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

        <main class="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          
          <!-- DASHBOARD TAB -->
          <ng-container *ngIf="activeTab === 'dashboard'">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 class="text-2xl lg:text-3xl font-extrabold text-slate-900">{{ t[lang].welcome }}, {{ userData?.username || 'Instructor' }} 👋</h1>
                <p class="text-slate-500 mt-1">{{ t[lang].streak }}</p>
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
                  <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].activeCourses }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35]">{{ courses.length }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].totalQuizzes }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35]">{{ totalQuizzesCount }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t[lang].totalLessons }}</p>
                    <div *ngIf="isLoadingTopMetrics" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2"></div>
                    <p *ngIf="!isLoadingTopMetrics" class="mt-2 text-3xl font-black text-[#130E35]">{{ totalLessonsCount }}</p>
                  </div>
                  <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Revenue, Growth, Rating Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
                <div class="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div class="flex items-center justify-between mb-4 relative z-10">
                  <h3 class="font-bold text-emerald-50">{{ t[lang].totalRevenue }}</h3>
                  <span class="p-2 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  </span>
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
                  <span class="p-2 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                  </span>
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
                  <span class="p-2 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </span>
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

            <!-- New Enrollments & Completions Chart Section (Req 2) -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h3 class="font-bold text-lg text-slate-900 flex items-center gap-2.5">
                  <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                  <span>{{ lang === 'ar' ? 'التسجيلات وإتمام الكورسات' : 'Enrollments & Course Completions' }}</span>
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

            <!-- YOUR TOP COURSES WIDGET (Req 2) -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
              <!-- Card Header -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center shadow-xs">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </div>
                  <div>
                    <h3 class="font-extrabold text-lg text-slate-900 tracking-tight">{{ t[lang].yourTopCourses }}</h3>
                    <p class="text-xs text-slate-400 font-medium">{{ lang === 'ar' ? 'الكورسات الأكثر نشاطاً ونسبة إتمام الطلاب' : 'Most engaged courses & student completion' }}</p>
                  </div>
                </div>

                <!-- Toggle Extend View All / View Less Button -->
                <button *ngIf="topCourses && topCourses.length > 3" 
                        (click)="showAllTopCourses = !showAllTopCourses" 
                        type="button"
                        class="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1.5 cursor-pointer px-3.5 py-1.5 rounded-xl bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100/50">
                  <span>{{ showAllTopCourses ? (lang === 'ar' ? 'عرض أقل' : 'View Less') : (lang === 'ar' ? 'عرض الكل' : 'View All') }}</span>
                  <svg [ngClass]="{'rotate-180': showAllTopCourses}" class="w-4 h-4 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
              </div>

              <!-- Skeleton Loader while dashboard stats load -->
              <div *ngIf="isLoadingDashboard" class="space-y-4">
                <div *ngFor="let i of [1, 2, 3]" class="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 animate-pulse">
                  <div class="flex justify-between items-center">
                    <div class="h-4 bg-slate-200 rounded w-14"></div>
                    <div class="h-4 bg-slate-200 rounded w-40"></div>
                  </div>
                  <div class="w-full bg-slate-200 h-2.5 rounded-full"></div>
                  <div class="flex justify-end">
                    <div class="h-3 bg-slate-200 rounded w-20"></div>
                  </div>
                </div>
              </div>

              <!-- Courses List -->
              <div class="space-y-3.5" *ngIf="!isLoadingDashboard && topCourses && topCourses.length > 0">
                <div *ngFor="let course of (showAllTopCourses ? topCourses : topCourses.slice(0, 3)); trackBy: trackById" 
                     class="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all duration-200 space-y-2.5">
                  <!-- Row 1: Percentage on left, Course Title on right -->
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 shadow-xs">{{ course.completionPercentage }}%</span>
                    <span class="text-sm sm:text-base font-bold text-slate-800 truncate max-w-[75%] text-start">{{ course.title }}</span>
                  </div>

                  <!-- Row 2: Progress Track (filled with emerald gradient) -->
                  <div class="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden flex justify-end">
                    <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-xs" [style.width.%]="course.completionPercentage"></div>
                  </div>

                  <!-- Row 3: Students count on right -->
                  <div class="flex items-center justify-end gap-1.5 text-xs text-slate-500 font-semibold">
                    <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                    <span>{{ course.studentsCount }} {{ t[lang].studentsCountText }}</span>
                  </div>
                </div>
              </div>

              <!-- Empty state if no courses -->
              <div *ngIf="!isLoadingDashboard && (!topCourses || topCourses.length === 0)" class="text-center py-8 text-slate-400 text-sm font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                {{ lang === 'ar' ? 'لا توجد كورسات منشورة حالياً لعرضها هنا.' : 'No published courses available yet.' }}
              </div>
            </div>

            <!-- Transactions & Activity Feed Row (Req 4: Filter by Month and Year) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <!-- Recent Transactions Box -->
              <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                <div class="flex items-center justify-between mb-6 flex-wrap gap-2">
                  <h3 class="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    <span>{{ t[lang].recentTransactions }}</span>
                  </h3>
                  <div class="flex items-center gap-2 flex-wrap" *ngIf="!isLoadingDashboard">
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
                    <select [(ngModel)]="selectedTransactionYear" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="all">{{ lang === 'ar' ? 'كل السنوات' : 'All Years' }}</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
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
                             <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                               <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                             </div>
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
                <div class="flex items-center justify-between mb-6 flex-wrap gap-2">
                  <h3 class="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    <span>{{ t[lang].activityFeed }}</span>
                  </h3>
                  <div class="flex items-center gap-2 flex-wrap" *ngIf="!isLoadingDashboard">
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
                    <select [(ngModel)]="selectedActivityYear" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="all">{{ lang === 'ar' ? 'كل السنوات' : 'All Years' }}</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
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
                       <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                         <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                       </div>
                      <p class="text-xs text-slate-400 font-medium">{{ lang === 'ar' ? 'لا يوجد نشاط مطابق لعوامل التصفية.' : 'No activity found for these filters.' }}</p>
                    </div>
                  </ng-container>

                </div>
              </div>

            </div>

          </ng-container>

          <ng-container *ngIf="activeTab === 'courses'">
            <div>
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900">{{ t[lang].myPublished }}</h2>
                  <p class="text-slate-500 text-sm mt-1">{{ t[lang].manageCourses }}</p>
                </div>
                <button (click)="openCreateCourse()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm text-sm">
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
                    <img *ngIf="c.coverImageUrl" [src]="getCoverImageUrl(c.coverImageUrl)" class="w-full h-full object-cover">
                    <span *ngIf="!c.coverImageUrl" class="text-4xl font-bold text-slate-300">{{ c.title.substring(0,2) | uppercase }}</span>
                    </div>
                  <div class="p-5 flex-1 flex flex-col">
                    <div class="flex items-center justify-between mb-2 gap-2">
                      <div class="flex items-center gap-2 flex-1 min-w-0">
                        <h3 class="font-bold text-lg text-slate-900 truncate" [title]="c.title">{{ c.title }}</h3>
                        <div class="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg shrink-0" [title]="lang === 'ar' ? 'تقييم الكورس' : 'Course Rating'">
                          <span class="text-amber-500 text-xs">★</span>
                          <span class="text-xs font-bold text-amber-700">{{ c.rating || '0.0' }}</span>
                        </div>
                      </div>
                      <button (click)="openEditCourseModal(c)" class="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition shadow-sm shrink-0" [title]="lang === 'ar' ? 'تعديل الكورس' : 'Edit Course'">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                    </div>
                    <div class="flex items-center gap-2 mb-4">
                      <span *ngIf="c.isFree" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span>{{ lang === 'ar' ? 'مجاني' : 'Free' }}</span>
                      </span>
                      <span *ngIf="!c.isFree" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <span>{{ lang === 'ar' ? 'مدفوع' : 'Paid' }}</span>
                        <span class="text-indigo-300">•</span>
                        <span class="dir-ltr font-extrabold">{{ c.price }} {{ lang === 'ar' ? 'ج.م' : 'EGP' }}</span>
                      </span>
                    </div>
                    <div class="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                      <button (click)="onViewCourse(c)" class="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        <span>{{ t[lang].view }}</span>
                      </button>
                      <button (click)="openDeleteModal(c.id)" class="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5" [title]="t[lang].deleteCourseBtn">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                        <span>{{ lang === 'ar' ? 'حذف' : 'Delete' }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div *ngIf="filteredCourses.length === 0 && courses.length > 0" class="col-span-full bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">{{ t[lang].noSearchResults }}</div>
              </div>

              <!-- EMPTY STATE: NO COURSES PUBLISHED -->
              <div *ngIf="courses.length === 0 && !isLoading" class="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center animate-fade-in mt-6">
                <div class="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
                <p class="text-slate-500 font-semibold text-lg">{{ lang === 'ar' ? 'لم تقم بنشر أي كورسات حتى الآن.' : 'No courses published yet.' }}</p>
              </div>

            </div>
          </ng-container>
          <ng-container *ngIf="activeTab === 'students'">
            
            <div *ngIf="studentViewMode === 'select-course'" class="animate-fade-in">
              <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900">{{ t[lang].selectCourseToView }}</h2>
                  <p class="text-slate-500 text-sm mt-1">{{ t[lang].selectCourseDesc }}</p>
                </div>
                <button (click)="viewAllPlatformStudents()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm text-sm flex items-center gap-2 self-start sm:self-auto transition">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>{{ lang === 'ar' ? 'عرض جميع طلابي' : 'View All My Students' }}</span>
                </button>
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
                    <img *ngIf="c.coverImageUrl" [src]="getCoverImageUrl(c.coverImageUrl)" class="w-full h-full object-cover">
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
                <div class="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <p class="text-slate-500 font-semibold text-lg">
                  {{ lang === 'ar' ? 'لم تقم بنشر أي كورسات حتى الآن لعرض طلابها.' : 'You haven\'t published any courses yet to view students.' }}
                </p>
              </div>

            </div>

            <!-- VIEW ALL PLATFORM STUDENTS (Req 10) -->
            <div *ngIf="studentViewMode === 'all-platform-students'" class="animate-fade-in">
              <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div class="flex items-center gap-4">
                  <button (click)="goBackToCourseSelection()" class="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition text-slate-600">
                    <span class="rtl:rotate-180">←</span>
                  </button>
                  <div>
                    <h2 class="text-2xl font-extrabold text-slate-900">{{ lang === 'ar' ? 'جميع طلاب المنصة' : 'All Platform Students' }}</h2>
                    <p class="text-slate-500 text-sm mt-1">{{ lang === 'ar' ? 'عرض شامل لكافة الطلاب المسجلين في منصة Fluency First.' : 'Overview of all registered students on the Fluency First platform.' }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="px-4 py-2 bg-indigo-50 text-indigo-700 font-black rounded-xl text-sm border border-indigo-100">
                    {{ filteredAllPlatformStudents.length }} {{ lang === 'ar' ? 'طالب' : 'Students' }}
                  </div>
                </div>
              </div>

              <!-- Search Bar -->
              <div class="bg-white p-3.5 rounded-2xl border border-slate-200 mb-6 flex items-center gap-3 shadow-sm">
                <svg class="w-5 h-5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" [(ngModel)]="allStudentsSearchQuery" [placeholder]="lang === 'ar' ? 'ابحث عن طالب بالاسم، البريد أو الهاتف...' : 'Search student by name, email or phone...'" class="w-full bg-transparent focus:outline-none text-sm font-medium">
              </div>

              <!-- Loading Skeleton -->
              <div *ngIf="isLoadingAllStudents" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div *ngFor="let i of [1,2,3,4,5,6,7,8]; trackBy: trackById" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-pulse flex items-center gap-4">
                  <div class="w-14 h-14 rounded-full bg-slate-200 shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div class="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
              </div>

              <!-- Students Grid -->
              <div *ngIf="!isLoadingAllStudents" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div *ngFor="let s of filteredAllPlatformStudents; trackBy: trackById" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between group">
                  <div class="flex items-start gap-3.5 mb-3">
                    <img [src]="s.profileImage ? 'http://localhost:5162' + s.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + s.name)" class="w-12 h-12 rounded-full bg-slate-100 object-cover border border-slate-200 shrink-0">
                    <div class="min-w-0 flex-1">
                      <h4 class="font-extrabold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{{ s.name }}</h4>
                      <p class="text-xs text-slate-500 truncate mt-0.5" *ngIf="s.email">{{ s.email }}</p>
                      <p class="text-[11px] text-slate-400 dir-ltr text-left rtl:text-right font-mono mt-0.5" *ngIf="s.phoneNumber">{{ s.phoneNumber }}</p>
                    </div>
                  </div>
                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span class="inline-flex items-center gap-1.5 text-indigo-600">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                      <span>{{ s.enrolledCoursesCount || 0 }} {{ lang === 'ar' ? 'كورس مسجل' : 'Courses' }}</span>
                    </span>
                    <span class="text-[11px] text-slate-400 font-medium">{{ s.createdAt | date:'MMM y' }}</span>
                  </div>
                </div>

                <div *ngIf="filteredAllPlatformStudents.length === 0" class="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <p class="text-slate-500 font-bold text-sm">{{ t[lang].noSearchResults }}</p>
                </div>
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
                    <p class="text-[11px] text-emerald-600 font-semibold mt-1">{{ t[lang].viewResults }}</p>
                  </div>
                </div>
                
                <div *ngIf="enrolledStudents.length === 0" class="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
                  <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
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
                       <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                         <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                       </div>
                       <div>
                         <h3 class="font-bold text-slate-800 text-base">{{ group.lessonTitle }}</h3>
                         <div class="flex gap-3 mt-1">
                           <p *ngIf="group.attempts.length > 0" class="text-xs text-slate-500 font-semibold">{{ group.attempts.length }} {{ t[lang].attemptsText }}</p>
                           <p *ngIf="group.assignment && group.assignment.givenScore === null" class="text-xs text-amber-600 font-bold flex items-center gap-1">
                             <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                             <span>{{ lang === 'ar' ? 'يحتاج للتقييم' : 'Needs Grading' }}</span>
                           </p>
                           <p *ngIf="group.assignment && group.assignment.givenScore !== null" class="text-xs text-emerald-600 font-bold flex items-center gap-1">
                             <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                             <span>{{ lang === 'ar' ? 'تم التقييم' : 'Graded' }}</span>
                           </p>
                         </div>
                       </div>
                    </div>
                    <button class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-transform" [ngClass]="{'rotate-180': group.expanded}">▼</button>
                  </div>
                  
                  <div *ngIf="group.expanded" class="border-t border-slate-100 bg-slate-50/50 p-5 animate-fade-in">
                     
                     <div *ngIf="group.attempts.length > 0" class="overflow-x-auto">
                       <h4 class="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                         <svg class="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                         <span>{{ lang === 'ar' ? 'نتائج الاختبار (Quiz)' : 'Quiz Results' }}</span>
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
                            <svg class="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                            <span>{{ lang === 'ar' ? 'حل الواجب (Assignment)' : 'Assignment Submission' }}</span>
                          </h4>
                          <span *ngIf="group.assignment.givenScore === null" class="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <span>{{ lang === 'ar' ? 'يحتاج للتقييم' : 'Needs Grading' }}</span>
                          </span>
                          <span *ngIf="group.assignment.givenScore !== null" class="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>{{ lang === 'ar' ? 'تم التقييم' : 'Graded' }}</span>
                          </span>
                        </div>
                        
                        <div class="space-y-4 mb-6">
                          <div *ngFor="let q of group.assignment.answers; let i = index" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
                            <div class="absolute top-4 rtl:left-4 ltr:right-4">
                              <span *ngIf="q.type === 'mcq'" class="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md">{{ lang === 'ar' ? 'اختياري (تلقائي)' : 'MCQ (Auto)' }}</span>
                              <span *ngIf="q.type !== 'mcq'" class="text-[10px] font-bold px-2 py-1 bg-purple-50 text-purple-600 rounded-md">{{ lang === 'ar' ? 'مقالي (للتقييم)' : 'Essay (Manual)' }}</span>
                            </div>
                            <p class="text-sm font-bold text-slate-800 mb-3 pr-24 rtl:pl-24 ltr:pr-24">{{ lang === 'ar' ? 'س' : 'Q' }}{{ i+1 }}: {{ q.question }}</p>
                            <div class="p-4 rounded-xl border text-sm font-medium"
                                 [ngClass]="q.type === 'mcq' ? (q.isCorrect ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-rose-50/60 border-rose-200 text-rose-900') : 'bg-slate-50 border-slate-100 text-slate-700'">
                              <span class="text-xs font-bold block mb-1" [ngClass]="q.type === 'mcq' ? (q.isCorrect ? 'text-emerald-700' : 'text-rose-700') : 'text-slate-500'">
                                {{ lang === 'ar' ? 'إجابة الطالب:' : "Student's Answer:" }}
                              </span>
                              {{ q.answer || (lang === 'ar' ? '(لم تتم الإجابة)' : '(No answer provided)') }}
                            </div>
                            <div *ngIf="q.type === 'mcq'" class="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                              <span *ngIf="q.isCorrect" class="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                                <svg class="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>{{ lang === 'ar' ? 'إجابة صحيحة' : 'Correct Answer' }}</span>
                              </span>
                              <span *ngIf="!q.isCorrect" class="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 shadow-sm">
                                <svg class="w-4 h-4 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                <span>{{ lang === 'ar' ? 'إجابة خاطئة' : 'Incorrect Answer' }}</span>
                              </span>
                              <span *ngIf="!q.isCorrect && q.correctAnswer" class="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                                <span class="text-slate-400">{{ lang === 'ar' ? 'الإجابة النموذجية:' : 'Expected Answer:' }}</span>
                                <span class="text-emerald-700">{{ q.correctAnswer }}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div class="flex items-center justify-between bg-white p-4 lg:px-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                          <p class="text-sm font-bold text-slate-500 hidden sm:block">{{ lang === 'ar' ? 'التقييم النهائي للواجب المقالي:' : 'Final Assignment Grade:' }}</p>
                          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <div class="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                              <span class="px-3 py-2 text-sm font-bold text-slate-600 bg-slate-100 border-l border-slate-200">{{ lang === 'ar' ? 'الدرجة:' : 'Score:' }}</span>
                              <input type="number" min="0" [max]="group.assignment.totalScore" [(ngModel)]="group.assignment.givenScore" placeholder="-" class="w-16 px-2 py-2 bg-white focus:outline-none text-center font-black text-indigo-600">
                              <span class="px-3 py-2 text-slate-400 font-bold bg-slate-50 border-r border-slate-200">/ {{ group.assignment.totalScore }}</span>
                            </div>
                            <button (click)="saveAssignmentGrade(group.assignment)" [disabled]="isSaving" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition shadow-md shadow-emerald-200 flex items-center gap-2 disabled:opacity-50">
                              <svg *ngIf="!isSaving" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                              <svg *ngIf="isSaving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle></svg>
                              <span>{{ isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ' : 'Save') }}</span>
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

          <!-- ================= LIVE SESSIONS TAB (Req 6b) ================= -->
          <ng-container *ngIf="activeTab === 'live'">
            <div class="space-y-8 animate-fade-in">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
                    <svg class="w-6 h-6 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    <span>{{ t[lang].liveSessions }}</span>
                  </h2>
                  <p class="text-slate-500 text-sm mt-1">{{ lang === 'ar' ? 'اختر الكورس المستهدف لبدء البث المباشر وإشعار الطلاب المشتركين فورياً.' : 'Select a course to broadcast a live session and instantly notify enrolled students.' }}</p>
                </div>

                <div *ngIf="isLiveActive" class="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center gap-2 font-bold text-xs animate-pulse">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>{{ lang === 'ar' ? 'البث المباشر قيد التشغيل حالياً' : 'Live Session is currently ACTIVE' }}</span>
                </div>
              </div>

              <!-- Course Selection for Live -->
              <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 class="font-bold text-base text-slate-800 mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  <span>{{ lang === 'ar' ? '1. اختر الكورس لبدء الجلسة:' : '1. Select Course for the Session:' }}</span>
                </h3>

                <div *ngIf="courses.length === 0" class="text-center py-8 text-slate-400 text-sm">
                  {{ lang === 'ar' ? 'لم تقم بنشر أي كورسات حتى الآن.' : 'No courses published yet.' }}
                </div>

                <div *ngIf="courses.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div *ngFor="let c of courses; trackBy: trackById"
                       (click)="selectCourseForLiveSession(c)"
                       [ngClass]="selectedCourseForLive?.id === c.id ? 'border-2 border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20' : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'"
                       class="p-4 rounded-2xl cursor-pointer transition flex items-center gap-3.5 group">
                    <div class="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
                      <img *ngIf="c.coverImageUrl" [src]="getCoverImageUrl(c.coverImageUrl)" class="w-full h-full object-cover">
                      <span *ngIf="!c.coverImageUrl" class="font-extrabold text-indigo-600 text-sm">{{ c.title.substring(0,2) | uppercase }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <h4 class="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{{ c.title }}</h4>
                      <p class="text-xs text-slate-400 mt-0.5">{{ lang === 'ar' ? 'اضغط لتحديد الكورس' : 'Click to select' }}</p>
                    </div>
                    <div *ngIf="selectedCourseForLive?.id === c.id" class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </div>
                  </div>
                </div>
              </div>

              <!-- Selected Course Live Session Panel -->
              <div *ngIf="selectedCourseForLive" class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                <!-- Left: Broadcast Controls -->
                <div class="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                      <div>
                        <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider">{{ lang === 'ar' ? 'الكورس المحدد' : 'Selected Course' }}</span>
                        <h3 class="text-xl font-black text-slate-900 mt-1">{{ selectedCourseForLive.title }}</h3>
                      </div>
                      <span class="px-3 py-1 rounded-full text-xs font-bold"
                            [ngClass]="isLiveActive ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'">
                        {{ isLiveActive ? (lang === 'ar' ? 'مباشر الآن' : 'Live Now') : (lang === 'ar' ? 'غير نشط' : 'Idle') }}
                      </span>
                    </div>

                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">
                          {{ lang === 'ar' ? 'رابط الاجتماع (Google Meet / Zoom / Microsoft Teams):' : 'Meeting Link (Google Meet / Zoom / Microsoft Teams):' }}
                        </label>
                        <div class="relative">
                          <span class="absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                          </span>
                          <input type="url" [(ngModel)]="meetUrlInput"
                                 [disabled]="isLiveActive"
                                 placeholder="https://meet.google.com/xyz-abcd-efg"
                                 class="w-full bg-slate-50 border border-slate-200 rounded-xl px-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium dir-ltr text-left">
                        </div>
                      </div>

                      <div class="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                        <svg class="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        <p class="text-xs text-indigo-900 leading-relaxed font-medium">
                          {{ lang === 'ar' ? 'بمجرد الضغط على "بدء البث المباشر"، سيتم إرسال إشعار فوري لجميع الطلاب المشتركين في هذا الكورس، وسيظهر شريط البث المباشر في لوحات تحكمهم مع زر للانضمام فوراً.' : 'Once you click "Start Live Session", an instant notification will be delivered to all students enrolled in this course, and a live banner with a Join button will activate on their dashboard.' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="pt-8 border-t border-slate-100 flex flex-wrap gap-3 mt-6">
                    <button *ngIf="!isLiveActive" (click)="startLiveSession()" [disabled]="!meetUrlInput"
                            class="flex-1 py-3.5 px-6 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                      <span>{{ lang === 'ar' ? 'بدء البث المباشر وإشعار الطلاب' : 'Start Live & Broadcast Link' }}</span>
                    </button>

                    <button *ngIf="isLiveActive" (click)="openActiveMeeting()"
                            class="flex-1 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      <span>{{ lang === 'ar' ? 'فتح رابط الاجتماع كمعلم' : 'Open Meeting as Host' }}</span>
                    </button>

                    <button *ngIf="isLiveActive" (click)="endLiveSession()"
                            class="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center justify-center gap-2">
                      <span>{{ lang === 'ar' ? 'إنهاء البث المباشر' : 'End Live Session' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Right: Enrolled Students in Selected Course -->
                <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col max-h-[550px]">
                  <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <h4 class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <svg class="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <span>{{ lang === 'ar' ? 'الطلاب المشتركون' : 'Enrolled Students' }}</span>
                    </h4>
                    <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-lg">
                      {{ enrolledStudentsForLive.length }}
                    </span>
                  </div>

                  <div *ngIf="isLoadingStudentsForLive" class="space-y-3">
                    <div *ngFor="let i of [1,2,3,4]; trackBy: trackById" class="p-3 bg-slate-50 rounded-xl animate-pulse flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-slate-200"></div>
                      <div class="flex-1 space-y-1.5">
                        <div class="h-3 bg-slate-200 rounded w-3/4"></div>
                        <div class="h-2 bg-slate-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="!isLoadingStudentsForLive" class="flex-1 overflow-y-auto space-y-2 pr-1">
                    <div *ngFor="let student of enrolledStudentsForLive; trackBy: trackById" class="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl transition flex items-center gap-3">
                      <img [src]="student.profileImage ? 'http://localhost:5162' + student.profileImage : ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + student.name)" class="w-10 h-10 rounded-full bg-white object-cover border border-slate-200 shrink-0">
                      <div class="min-w-0 flex-1">
                        <p class="font-bold text-slate-800 text-xs truncate">{{ student.name }}</p>
                        <p class="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{{ lang === 'ar' ? 'مؤهل لتلقي البث' : 'Eligible for session' }}</span>
                        </p>
                      </div>
                    </div>

                    <div *ngIf="enrolledStudentsForLive.length === 0" class="py-12 text-center text-slate-400 text-xs">
                      <svg class="w-8 h-8 mx-auto mb-2 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <span>{{ lang === 'ar' ? 'لا يوجد طلاب مشتركون في هذا الكورس بعد.' : 'No students enrolled in this course yet.' }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </ng-container>

          <!-- ================= SCHEDULE TAB (Req 5) ================= -->
          <ng-container *ngIf="activeTab === 'schedule'">
            <div class="space-y-6 animate-fade-in">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
                    <svg class="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>{{ t[lang].schedule }}</span>
                  </h2>
                  <p class="text-slate-500 text-sm mt-1">{{ lang === 'ar' ? 'جدول المواعيد والجلسات المباشرة ومواعيد تسليم الواجبات.' : 'Manage your upcoming lectures, live sessions, and assignment deadlines.' }}</p>
                </div>

                <button (click)="openCreateEvent()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm text-sm flex items-center gap-2 self-start sm:self-auto">
                  <span>+</span>
                  <span>{{ lang === 'ar' ? 'إضافة موعد جديد' : 'New Event' }}</span>
                </button>
              </div>

              <!-- Calendar Container Card -->
              <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                
                <!-- Calendar Controls Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div class="flex items-center gap-3">
                    <h3 class="text-xl font-black text-slate-900 min-w-[150px]">
                      {{ getMonthYearTitle() }}
                    </h3>
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
                    <div *ngIf="day.hasEvents" class="w-1.5 h-1.5 rounded-full absolute bottom-1.5" [ngClass]="day.isSelected ? 'bg-emerald-300' : 'bg-indigo-600'"></div>
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
                              {{ ev.eventType === 'Live' ? (lang === 'ar' ? 'بث مباشر' : 'Live Session') : (ev.eventType === 'Deadline' ? (lang === 'ar' ? 'موعد تسليم' : 'Deadline') : (lang === 'ar' ? 'حدث عام' : 'General')) }}
                            </span>
                            <span class="text-xs font-bold opacity-75 dir-ltr">
                              {{ ev.eventDate | date:'h:mm a' }}
                            </span>
                          </div>

                          <h4 class="font-black text-base mb-1 break-words line-clamp-2">{{ ev.title }}</h4>
                          <p class="text-xs opacity-75 font-semibold mb-2">{{ ev.courseTitle }}</p>
                          <p *ngIf="ev.description" class="text-xs opacity-80 line-clamp-2 mt-2 leading-relaxed">{{ ev.description }}</p>
                        </div>

                        <div class="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-end">
                          <button (click)="deleteEvent(ev.id)" class="p-1.5 rounded-lg bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shadow-sm" [title]="lang === 'ar' ? 'حذف الموعد' : 'Delete Event'">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
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
                                'bg-purple-50/70 border-purple-200 text-purple-950': ev.eventType !== 'Live' && ev.eventType !== 'Deadline'
                             }"
                             class="rounded-3xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between relative group">
                          
                          <div>
                            <div class="flex items-center justify-between mb-3">
                              <span [ngClass]="{
                                      'bg-blue-600 text-white': ev.eventType === 'Live',
                                      'bg-amber-500 text-white': ev.eventType === 'Deadline',
                                      'bg-purple-600 text-white': ev.eventType !== 'Live' && ev.eventType !== 'Deadline'
                                    }"
                                    class="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                {{ ev.eventType === 'Live' ? (lang === 'ar' ? 'بث مباشر' : 'Live Session') : (ev.eventType === 'Deadline' ? (lang === 'ar' ? 'موعد تسليم' : 'Deadline') : ev.eventType) }}
                              </span>
                              <span class="text-xs font-bold opacity-75 dir-ltr">
                                {{ ev.eventDate | date:'h:mm a' }}
                              </span>
                            </div>

                            <h4 class="font-black text-base mb-1 break-words line-clamp-2">{{ ev.title }}</h4>
                            <p class="text-xs opacity-75 font-semibold mb-2">{{ ev.courseTitle }}</p>
                            <p *ngIf="ev.description" class="text-xs opacity-80 line-clamp-2 mt-2 leading-relaxed">{{ ev.description }}</p>
                          </div>

                          <div class="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-end">
                            <button (click)="deleteEvent(ev.id)" class="p-1.5 rounded-lg bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shadow-sm" [title]="lang === 'ar' ? 'حذف الموعد' : 'Delete Event'">
                              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div *ngIf="selectedDayEvents.length === 0" class="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <div class="w-12 h-12 rounded-2xl bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto mb-3">
                          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <p class="text-slate-500 font-bold text-sm">{{ lang === 'ar' ? 'لا توجد مواعيد أو أحداث مجدولة في هذا اليوم.' : 'No events scheduled for this day.' }}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </ng-container>

          <!-- ================= HELP & SUPPORT TAB (Req 6a) ================= -->
          <ng-container *ngIf="activeTab === 'support'">
            <div class="space-y-8 animate-fade-in max-w-5xl mx-auto">
              
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

              <!-- Contact Cards Row -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <!-- Phone Support Card -->
                <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </div>
                    <h3 class="font-extrabold text-lg text-slate-900 mb-1">{{ lang === 'ar' ? 'الاتصال الهاتفي المباشر' : 'Direct Phone Support' }}</h3>
                    <p class="text-xs text-slate-500 mb-4">{{ lang === 'ar' ? 'للتواصل العاجل مع المشرف الأكاديمي' : 'Urgent queries with platform staff' }}</p>
                    <p class="text-xl font-black text-indigo-600 dir-ltr text-left rtl:text-right font-mono mb-4">01020653195</p>
                  </div>
                  <a href="tel:01020653195" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center text-xs font-bold transition shadow-sm block">
                    {{ lang === 'ar' ? 'اتصل الآن' : 'Call Now' }}
                  </a>
                </div>

                <!-- WhatsApp Support Card -->
                <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </div>
                    <h3 class="font-extrabold text-lg text-slate-900 mb-1">{{ lang === 'ar' ? 'محادثة واتساب الفورية' : 'Instant WhatsApp' }}</h3>
                    <p class="text-xs text-slate-500 mb-4">{{ lang === 'ar' ? 'إرسال لقطات شاشة واستفسارات تقنية' : 'Send screenshots and technical tickets' }}</p>
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
                    <h3 class="font-extrabold text-lg text-slate-900 mb-1">{{ lang === 'ar' ? 'مواعيد العمل والدعم' : 'Support Working Hours' }}</h3>
                    <p class="text-xs text-slate-500 mb-4">{{ lang === 'ar' ? 'ساعات تواجد المشرفين للرد والمساعدة' : 'Availability for instructor assistance' }}</p>
                    <p class="text-sm font-bold text-slate-800 leading-relaxed mb-4">
                      {{ lang === 'ar' ? 'يومياً من 9:00 صباحاً حتى 11:00 مساءً بتوقيت القاهرة' : 'Daily from 9:00 AM to 11:00 PM (Cairo Time)' }}
                    </p>
                  </div>
                  <div class="w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-center text-xs font-bold">
                    {{ lang === 'ar' ? 'طوال أيام الأسبوع' : '7 Days a Week' }}
                  </div>
                </div>
              </div>

              <!-- Instructor FAQ Section -->
              <div class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 class="font-extrabold text-xl text-slate-900 mb-6 flex items-center gap-2">
                  <svg class="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>{{ lang === 'ar' ? 'الأسئلة الشائعة للمعلمين' : 'Instructor Frequently Asked Questions' }}</span>
                </h3>
                <div class="space-y-4">
                  <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 class="font-bold text-slate-900 text-sm mb-2">{{ lang === 'ar' ? 'كيف يتم احتساب نسبة المنصة (20%) وصرف الأرباح؟' : 'How does the 20% platform deduction and payout work?' }}</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">{{ lang === 'ar' ? 'تخصم المنصة 20% لتغطية خوادم الاستضافة، البث المباشر، وتكاليف بوابات الدفع الإلكتروني. يتم تحويل صافي أرباحك دورياً عبر فودافون كاش، إنستاباي، أو التحويل البنكي.' : 'The platform deducts 20% to cover cloud hosting, video streaming, and secure payment gateway processing. Net profits are disbursed periodically via Vodafone Cash, InstaPay, or direct bank transfer.' }}</p>
                  </div>
                  <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 class="font-bold text-slate-900 text-sm mb-2">{{ lang === 'ar' ? 'كيف أقوم ببث جلسة مباشرة لطلابي عبر Google Meet أو Zoom؟' : 'How do I broadcast live sessions via Google Meet or Zoom?' }}</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">{{ lang === 'ar' ? 'من القائمة الجانبية، اختر تبويب "البث المباشر"، ثم حدد الكورس وأدخل رابط الاجتماع واضغط "بدء البث المباشر". سيتلقى جميع الطلاب المشتركين إشعاراً فورياً ورابط الانضمام.' : 'From the sidebar, open the "Live Sessions" tab, select your course, paste the meeting URL, and click "Start Live & Broadcast Link". All enrolled students will receive an instant notification with the direct join link.' }}</p>
                  </div>
                  <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 class="font-bold text-slate-900 text-sm mb-2">{{ lang === 'ar' ? 'كيف يتم تصحيح الواجبات المقالية والاختبارات التلقائية؟' : 'How are MCQ quizzes and manual assignments graded?' }}</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">{{ lang === 'ar' ? 'يتم تصحيح أسئلة الاختيار من متعدد تلقائياً ومنح النقاط للطلاب، بينما تظهر الأسئلة المقالية تحت تبويب "الطلاب" داخل ملف كل طالب مع حقل لوضع الدرجة وحفظها بنقرة واحدة.' : 'Multiple-choice questions are auto-graded and reward XP automatically. Essay assignments appear under the "Students" tab inside each student profile for manual score entry and saving.' }}</p>
                  </div>
                </div>
              </div>

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
  isSidebarCollapsed: boolean = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  showCreateForm = false;
  showEventForm = false;

  showAssignmentModal = false;
  assignmentData = { courseId: null, title: '', dueDate: '', questions: [''] };

  showEditCourseModal = false;
  selectedCourseToEdit: any = null;
  editCourseForm: FormGroup;
  editCourseImagePreview: string | ArrayBuffer | null = null;
  editCourseError: string | null = null;

  imagePreview: string | ArrayBuffer | null = null;
  courseForm: FormGroup;
  eventForm: FormGroup;
  eventFormError: string | null = null;
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
  topCourses: any[] = [];
  showAllTopCourses: boolean = false;
  isCourseDropdownOpen: boolean = false;

  showAllTransactions = false;
  showAllActivities = false;
  
  selectedTransactionMonth: string = 'all';
  selectedTransactionYear: string = 'all';
  selectedActivityMonth: string = 'all';
  selectedActivityYear: string = 'all';
  selectedChartTimeframe: string = '7days';

  allPlatformStudents: any[] = [];
  isLoadingAllStudents: boolean = false;
  allStudentsSearchQuery: string = '';

  groupedStudentResults: any[] = [];

  selectedCourseForLive: any = null;
  meetUrlInput: string = '';
  isLiveActive: boolean = false;
  activeLiveTitle: string = '';
  enrolledStudentsForLive: any[] = [];
  isLoadingStudentsForLive: boolean = false;

  selectedDate: Date = new Date();
  currentCalendarMonth: Date = new Date();
  calendarView: 'week' | 'month' = 'week';
  calendarSearch: string = '';

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
      view: 'View', deleteCourseBtn: 'Delete Course', cancel: 'Cancel', viewAll: 'View All', liveSessions: 'Live Sessions',
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
      studentName: 'Student Name', course: 'Course', amount: 'Amount', activityFeed: 'Activity Feed',
      support: 'Help & Support',
      yourTopCourses: 'Your Top Courses',
      viewAllCourses: 'View all',
      studentsCountText: 'students'
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
      view: 'عرض', deleteCourseBtn: 'حذف الكورس', cancel: 'إلغاء', viewAll: 'عرض الكل', liveSessions: 'البث المباشر',
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
      studentName: 'اسم الطالب', course: 'الكورس', amount: 'Amount', activityFeed: 'نشاط الطلاب',
      support: 'المساعدة والدعم',
      yourTopCourses: 'أفضل كورساتك',
      viewAllCourses: 'عرض الكل',
      studentsCountText: 'طالب'
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
      description: [''],
      isFree: [false],
      price: [0],
      discountPercentage: [0],
      coverImageUrl: ['']
    });

    this.editCourseForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
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
      eventType: ['', Validators.required]
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

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] || 'dashboard';
      
      this.activeTab = tab as string;
      
      this.showCreateForm = false;
      this.showEventForm = false;
      this.studentViewMode = 'select-course';

      if (tab === 'dashboard') {
         this.loadDashboardStats();
      }
      
      if (tab === 'schedule' && this.events.length === 0) {
         this.fetchSchedule();
      }

      if (this.courses.length === 0) {
         this.loadMyCourses();
      }
    });

    this.fetchUserProfile();
    this.fetchNotifications();
    this.signalrService.startConnection();

    this.minDate = this.getLocalDateTimeString();
  }

  getLocalDateTimeString(d: Date = new Date()): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  preventDateKeyboardTyping(event: KeyboardEvent) {
    if (['Tab', 'Escape', 'Enter'].includes(event.key)) {
      return;
    }
    event.preventDefault();
  }

  validateEventDate(event?: any) {
    const nowStr = this.getLocalDateTimeString();
    this.minDate = nowStr;
    const currentVal = this.eventForm.get('eventDate')?.value;
    if (currentVal && currentVal < nowStr) {
      this.eventForm.patchValue({ eventDate: nowStr });
      const msg = this.lang === 'ar' ? 'لا يمكن اختيار تاريخ أو وقت في الماضي.' : 'Cannot select a date or time in the past.';
      this.showMessage(msg, 'error');
    }
  }

  switchTab(tab: string) {
    this.searchQuery = '';
    if (tab === 'students') {
       this.router.navigate(['/teacher-dashboard'], { queryParams: { tab: tab, view: 'select-course' } });
    } else {
       this.router.navigate(['/teacher-dashboard'], { queryParams: { tab: tab } });
    }
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
    this.activeTab = 'courses';
  }

  cancelCreateCourse() {
    this.showCreateForm = false;
  }

  openCreateEvent() {
    this.minDate = this.getLocalDateTimeString();
    this.showEventForm = true;
    this.isCourseDropdownOpen = false;
    this.eventFormError = null;
    this.eventForm.reset({ eventType: '', eventDate: this.minDate });
    if (this.courses.length === 0) {
      this.loadMyCourses();
    }
  }

  cancelCreateEvent() {
    this.showEventForm = false;
    this.isCourseDropdownOpen = false;
    this.eventFormError = null;
  }

  selectEventCourse(courseId: number) {
    this.eventForm.patchValue({ courseId: courseId });
    this.isCourseDropdownOpen = false;
  }

  getSelectedCourseTitle(): string {
    const id = this.eventForm?.get('courseId')?.value;
    if (!id) return '';
    const c = this.courses.find(x => x.id == id);
    return c ? c.title : '';
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
    if (this.selectedTransactionYear !== 'all') {
      filtered = filtered.filter(tr => {
        if (!tr.date) return true;
        const date = new Date(tr.date);
        return date.getFullYear().toString() === this.selectedTransactionYear;
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
    if (this.selectedActivityYear !== 'all') {
      filtered = filtered.filter(feed => {
        if (!feed.date) return true;
        const date = new Date(feed.date);
        return date.getFullYear().toString() === this.selectedActivityYear;
      });
    }
    return this.showAllActivities ? filtered : filtered.slice(0, 5);
  }

  get filteredAllPlatformStudents() {
    if (!this.allStudentsSearchQuery) return this.allPlatformStudents;
    const q = this.allStudentsSearchQuery.toLowerCase();
    return this.allPlatformStudents.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phoneNumber && s.phoneNumber.includes(q))
    );
  }

  viewAllPlatformStudents() {
    this.studentViewMode = 'all-platform-students';
    this.loadAllPlatformStudents();
  }

  loadAllPlatformStudents() {
    this.isLoadingAllStudents = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>('http://localhost:5162/api/user/students', { headers }).subscribe({
      next: (data) => {
        this.allPlatformStudents = data || [];
        this.isLoadingAllStudents = false;
      },
      error: () => {
        this.allPlatformStudents = [];
        this.isLoadingAllStudents = false;
      }
    });
  }

  selectCourseForLiveSession(course: any) {
    this.selectedCourseForLive = course;
    this.isLoadingStudentsForLive = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(`http://localhost:5162/api/quiz/course/${course.id}/students`, { headers }).subscribe({
      next: (data) => {
        this.enrolledStudentsForLive = data || [];
        this.isLoadingStudentsForLive = false;
      },
      error: () => {
        this.enrolledStudentsForLive = [];
        this.isLoadingStudentsForLive = false;
      }
    });
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
        
        this.totalStudentsCount = data?.totalStudents || 0;
        this.totalLessonsCount = data?.totalLessons || 0;
        this.totalQuizzesCount = data?.totalQuizzes || 0;
        
        this.recentTransactions = data?.recentTransactions || [];
        this.activityFeed = data?.activityFeed || [];
        this.topCourses = (data?.topCourses || []).sort((a: any, b: any) => {
          const diff = (b.completionPercentage || 0) - (a.completionPercentage || 0);
          if (diff !== 0) return diff;
          return (b.studentsCount || 0) - (a.studentsCount || 0);
        });
        if ((!this.topCourses || this.topCourses.length === 0) && this.courses && this.courses.length > 0) {
          this.topCourses = this.courses.slice(0, 10).map(c => ({
            id: c.id,
            title: c.title,
            studentsCount: c.studentsCount || c.enrollmentsCount || 0,
            completionPercentage: c.completionPercentage || 0,
            coverImageUrl: c.coverImageUrl
          })).sort((a, b) => {
            const diff = (b.completionPercentage || 0) - (a.completionPercentage || 0);
            if (diff !== 0) return diff;
            return (b.studentsCount || 0) - (a.studentsCount || 0);
          });
        }

        this.isLoadingDashboard = false;
        this.isLoadingTopMetrics = false;

        if (data?.chartData) {
          this.renderChart(data.chartData);
        }
      },
      error: () => {
        this.isLoadingDashboard = false;
        this.isLoadingTopMetrics = false;
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
              label: this.lang === 'ar' ? 'تسجيلات جديدة' : 'New Enrollments',
              data: chartData.newEnrollments || chartData.ongoing || [],
              borderColor: '#4F46E5',
              backgroundColor: '#4F46E5',
              tension: 0.3,
              borderWidth: 2
            },
            {
              label: this.lang === 'ar' ? 'إتمام الكورسات' : 'Course Completions',
              data: chartData.courseCompletions || chartData.submitted || [],
              borderColor: '#10B981',
              backgroundColor: '#10B981',
              tension: 0.3,
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
              min: 0,
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

    if (assign.givenScore < 0) {
      this.showMessage(this.lang === 'ar' ? 'لا يمكن أن تكون الدرجة بالسالب.' : 'Grade cannot be negative.', 'error');
      return;
    }

    if (assign.totalScore && assign.givenScore > assign.totalScore) {
      this.showMessage(this.lang === 'ar' ? `لا يمكن أن تتجاوز الدرجة إجمالي درجة الواجب (${assign.totalScore}).` : `Grade cannot exceed assignment total score (${assign.totalScore}).`, 'error');
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

  onNotificationClick(notif: any) {
    this.markAsRead(notif);
    this.showNotificationsDropdown = false;
    const rawMsg = notif.message || '';
    const parts = rawMsg.split('||');
    const type = parts[0];
    const msg = rawMsg.toLowerCase();
    const title = (notif.title || '').toLowerCase();
    const text = msg + ' ' + title;

    if (type === 'ASSIGNMENT_SUBMITTED' || text.includes('submitted') || text.includes('تسليم')) {
      this.switchTab('students');
      const courseId = parts[4];
      const studentId = parts[5];
      if (courseId) {
        const targetCourse = this.courses.find(c => c.id == courseId);
        if (targetCourse) {
          this.selectCourseForStudents(targetCourse);
          if (studentId) {
            setTimeout(() => {
              const targetStudent = this.enrolledStudents.find(s => (s.studentId || s.id) == studentId);
              if (targetStudent) {
                this.selectStudentDetails(targetStudent);
              } else {
                this.selectStudentDetails({ id: +studentId, studentId: +studentId, username: parts[1] || 'Student', studentName: parts[1] || 'Student' });
              }
            }, 350);
          }
        }
      }
      return;
    }

    if (text.includes('enrolled') || text.includes('انضم') || text.includes('طالب جديد')) {
      this.switchTab('students');
      return;
    }

    if (type === 'NEW_SCHEDULE' || text.includes('schedule') || text.includes('موعد') || text.includes('حدث') || text.includes('event')) {
      this.switchTab('schedule');
      return;
    }

    if (text.includes('live') || text.includes('بث') || text.includes('مباشر')) {
      this.switchTab('live');
      return;
    }

    if (type === 'NEW_LESSON' || type === 'NEW_QUIZ' || text.includes('lesson') || text.includes('quiz') || text.includes('كويز') || text.includes('اختبار') || text.includes('درس')) {
      this.switchTab('courses');
      return;
    }

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
      
      if (message.includes('A new schedule event') || message.includes('A new event has been added')) return message.replace('A new schedule event', 'تم إضافة موعد جديد').replace('A new event has been added', 'تم إضافة موعد جديد').replace('titled', 'بعنوان').replace('has been added for course', 'لكورس').replace('for course', 'لكورس');
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
    this.isLoading = true;
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
      const val = this.eventForm.value;
      if (val.title && val.title.startsWith(' ')) {
        const msg = this.lang === 'ar' ? 'لا يمكن أن يبدأ عنوان الحدث بمسافة فارغة.' : 'Event title cannot begin with a space.';
        this.eventFormError = msg;
        this.showMessage(msg, 'error');
        return;
      }
      if (val.description && val.description.startsWith(' ')) {
        const msg = this.lang === 'ar' ? 'لا يمكن أن يبدأ وصف الحدث بمسافة فارغة.' : 'Description cannot begin with a space.';
        this.eventFormError = msg;
        this.showMessage(msg, 'error');
        return;
      }
      if (val.eventType && val.eventType.startsWith(' ')) {
        const msg = this.lang === 'ar' ? 'لا يمكن أن يبدأ نوع الحدث بمسافة فارغة.' : 'Event type cannot begin with a space.';
        this.eventFormError = msg;
        this.showMessage(msg, 'error');
        return;
      }

      const nowStr = this.getLocalDateTimeString();
      if (val.eventDate && val.eventDate < nowStr) {
        const msg = this.lang === 'ar' ? 'لا يمكن تحديد موعد حدث في الماضي.' : 'Cannot set an event date/time in the past.';
        this.eventFormError = msg;
        this.showMessage(msg, 'error');
        return;
      }

      this.isSaving = true;
      this.eventFormError = null;
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      let payload = { ...val };
      payload.courseId = Number(payload.courseId);
      if (!payload.eventDate.includes('Z')) {
        payload.eventDate = new Date(payload.eventDate).toISOString();
      }
      this.http.post('http://localhost:5162/api/schedule', payload, { headers }).subscribe({
        next: () => {
          this.showEventForm = false;
          this.eventForm.reset({ eventType: '' });
          this.eventFormError = null;
          this.fetchSchedule();
          this.isSaving = false;
          this.showMessage(this.lang === 'ar' ? 'تمت إضافة الحدث بنجاح' : 'Event added successfully', 'success');
        },
        error: (err: any) => {
          this.isSaving = false;
          const msg = err?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء إضافة الحدث' : 'Error adding event');
          this.eventFormError = msg;
          this.showMessage(msg, 'error');
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

  getCoverImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `http://localhost:5162${url.startsWith('/') ? '' : '/'}${url}`;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            this.imagePreview = compressed;
            this.courseForm.patchValue({ coverImageUrl: compressed });
          } else {
            this.imagePreview = e.target.result;
            this.courseForm.patchValue({ coverImageUrl: e.target.result });
          }
        };
        img.src = e.target.result;
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
        if ((!this.topCourses || this.topCourses.length === 0) && this.courses.length > 0) {
          this.topCourses = this.courses.slice(0, 10).map(c => ({
            id: c.id,
            title: c.title,
            studentsCount: c.studentsCount || c.enrollmentsCount || 0,
            completionPercentage: c.completionPercentage || 0,
            coverImageUrl: c.coverImageUrl
          })).sort((a, b) => {
            const diff = (b.completionPercentage || 0) - (a.completionPercentage || 0);
            if (diff !== 0) return diff;
            return (b.studentsCount || 0) - (a.studentsCount || 0);
          });
        }
        this.isLoading = false;
        this.isLoadingTopMetrics = false;
      },
      error: () => {
        this.courses = [];
        this.isLoadingTopMetrics = false;
        this.isLoading = false;
      }
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
                        answers: (sub.answers || []).map((a: any) => {
                          const isMcq = (a.questionType || '').toLowerCase() === 'mcq' || (a.questionType || '').toLowerCase() === 'quiz';
                          const isCorrect = a.isCorrect !== undefined && a.isCorrect !== null
                            ? !!a.isCorrect
                            : (isMcq
                                ? (a.score !== null && a.score !== undefined
                                    ? a.score > 0
                                    : (a.correctAnswer && a.answerText ? a.answerText.trim().toLowerCase() === a.correctAnswer.trim().toLowerCase() : false))
                                : null);
                          return {
                            question: a.questionText,
                            answer: a.answerText,
                            type: (a.questionType || '').toLowerCase(),
                            score: a.score,
                            correctAnswer: a.correctAnswer,
                            isCorrect: isCorrect
                          };
                        })
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

  openEditCourseModal(course: any) {
    this.selectedCourseToEdit = course;
    this.editCourseError = null;
    this.editCourseImagePreview = course.coverImageUrl ? this.getCoverImageUrl(course.coverImageUrl) : null;
    this.editCourseForm.patchValue({
      title: course.title,
      description: course.description,
      isFree: course.isFree,
      price: course.price,
      discountPercentage: course.discountPercentage,
      coverImageUrl: course.coverImageUrl || ''
    });
    this.showEditCourseModal = true;
  }

  closeEditCourseModal() {
    this.showEditCourseModal = false;
    this.editCourseError = null;
    this.selectedCourseToEdit = null;
    this.editCourseImagePreview = null;
    this.editCourseForm.reset();
  }

  onEditFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            this.editCourseImagePreview = compressedBase64;
            this.editCourseForm.patchValue({ coverImageUrl: compressedBase64 });
          } else {
            this.editCourseImagePreview = e.target.result;
            this.editCourseForm.patchValue({ coverImageUrl: e.target.result });
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveCourseEdit() {
    if (!this.selectedCourseToEdit || !this.editCourseForm.valid) return;
    const val = this.editCourseForm.value;
    if (val.title && val.title.startsWith(' ')) {
      const msg = this.lang === 'ar' ? 'لا يمكن أن يبدأ عنوان الكورس بمسافة فارغة.' : 'Course title cannot begin with a space.';
      this.editCourseError = msg;
      this.showMessage(msg, 'error');
      return;
    }
    if (val.description && val.description.startsWith(' ')) {
      const msg = this.lang === 'ar' ? 'لا يمكن أن يبدأ وصف الكورس بمسافة فارغة.' : 'Course description cannot begin with a space.';
      this.editCourseError = msg;
      this.showMessage(msg, 'error');
      return;
    }
    if (!val.isFree) {
      if (val.price === null || val.price === undefined || val.price <= 0) {
        const msg = this.lang === 'ar' ? 'يجب أن يكون سعر الكورس المدفوع أكبر من صفر.' : 'Paid course price must be greater than zero.';
        this.editCourseError = msg;
        this.showMessage(msg, 'error');
        return;
      }
      if (val.discountPercentage !== null && val.discountPercentage !== undefined && val.discountPercentage !== '') {
        const disc = Number(val.discountPercentage);
        if (disc < 0 || disc > 100) {
          const msg = this.lang === 'ar' ? 'نسبة الخصم يجب أن تكون بين 0 و 100%.' : 'Discount percentage must be between 0 and 100%.';
          this.editCourseError = msg;
          this.showMessage(msg, 'error');
          return;
        }
      }
    }

    this.isSaving = true;
    this.editCourseError = null;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const payload = this.editCourseForm.value;
    this.http.put<any>(`http://localhost:5162/api/course/${this.selectedCourseToEdit.id}`, payload, { headers }).subscribe({
      next: (updatedCourse) => {
        this.isSaving = false;
        this.editCourseError = null;
        this.showMessage(this.lang === 'ar' ? 'تم تحديث بيانات الكورس بنجاح!' : 'Course details updated successfully!', 'success');
        const index = this.courses.findIndex(c => c.id === this.selectedCourseToEdit.id);
        if (index !== -1 && updatedCourse) {
          this.courses[index] = { ...this.courses[index], ...updatedCourse };
        }
        this.closeEditCourseModal();
        this.loadMyCourses();
      },
      error: (err: any) => {
        this.isSaving = false;
        const msg = err?.error?.message || (this.lang === 'ar' ? 'حدث خطأ أثناء تحديث بيانات الكورس.' : 'Error updating course details.');
        this.editCourseError = msg;
        this.showMessage(msg, 'error');
      }
    });
  }

  onSubmit() {
    if (this.courseForm.valid) {
      const val = this.courseForm.value;
      if (val.title && val.title.startsWith(' ')) {
        this.showMessage(this.lang === 'ar' ? 'لا يمكن أن يبدأ عنوان الكورس بمسافة فارغة.' : 'Course title cannot begin with a space.', 'error');
        return;
      }
      if (val.description && val.description.startsWith(' ')) {
        this.showMessage(this.lang === 'ar' ? 'لا يمكن أن يبدأ وصف الكورس بمسافة فارغة.' : 'Course description cannot begin with a space.', 'error');
        return;
      }
      if (!val.isFree) {
        if (val.price === null || val.price === undefined || val.price <= 0) {
          this.showMessage(this.lang === 'ar' ? 'يجب أن يكون سعر الكورس المدفوع أكبر من صفر.' : 'Paid course price must be greater than zero.', 'error');
          return;
        }
        if (val.discountPercentage !== null && val.discountPercentage !== undefined && val.discountPercentage !== '') {
          const disc = Number(val.discountPercentage);
          if (disc < 0 || disc > 100) {
            this.showMessage(this.lang === 'ar' ? 'نسبة الخصم يجب أن تكون بين 0 و 100%.' : 'Discount percentage must be between 0 and 100%.', 'error');
            return;
          }
        }
      }

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
            this.router.navigate(['/teacher-dashboard'], { queryParams: { tab: 'courses' } });
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