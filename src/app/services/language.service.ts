import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLang = new BehaviorSubject<'en' | 'ar'>('en');
  currentLang$ = this.currentLang.asObservable();
  language$ = this.currentLang$;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initLanguage();
  }

  private initLanguage() {
    if (this.isBrowser) {
      const savedLang = localStorage.getItem('lang') as 'en' | 'ar';
      const lang = savedLang ? savedLang : 'en';
      this.setLanguage(lang);
    }
  }

  setLanguage(lang: 'en' | 'ar') {
    this.currentLang.next(lang);
    if (this.isBrowser) {
      localStorage.setItem('lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }

  toggleLanguage() {
    const newLang = this.currentLang.value === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }

  get isArabic(): boolean {
    return this.currentLang.value === 'ar';
  }

  get currentLanguage(): 'en' | 'ar' {
    return this.currentLang.value;
  }
}