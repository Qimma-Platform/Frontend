import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  public darkMode$ = this.darkModeSubject.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initTheme();
  }

  private initTheme() {
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      this.applyTheme(isDark);
    }
  }

  public get isDark(): boolean {
    return this.darkModeSubject.value;
  }

  public toggleTheme() {
    this.applyTheme(!this.darkModeSubject.value);
  }

  public setTheme(isDark: boolean) {
    this.applyTheme(isDark);
  }

  private applyTheme(isDark: boolean) {
    this.darkModeSubject.next(isDark);
    if (this.isBrowser) {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
}
