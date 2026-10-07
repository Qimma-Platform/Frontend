import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { CourseService } from '../services/course.service';
import { LanguageService } from '../services/language.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      
      <div *ngIf="showRatingModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md px-4 animate-fade-in">
        <div class="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md text-center transform transition-all animate-scale-in">
          <div class="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
            👨‍🏫
          </div>
          <h3 class="text-2xl font-black text-slate-900 mb-2">{{ t[lang].ratingTitle }}</h3>
          <p class="text-sm text-slate-500 mb-8 font-medium">{{ t[lang].ratingDesc }}</p>
          
          <div class="flex justify-center gap-3 mb-8 cursor-pointer text-4xl dir-ltr flex-row-reverse" (mouseleave)="hoveredRating = 0">
            <span *ngFor="let star of [5, 4, 3, 2, 1]" 
                  (mouseenter)="hoveredRating = star"
                  (click)="selectedRating = star"
                  [ngClass]="(hoveredRating >= star || selectedRating >= star) ? 'text-amber-400 drop-shadow-md' : 'text-slate-200'"
                  class="transition-all hover:scale-110 hover:text-amber-300">
              ★
            </span>
          </div>

          <div class="flex gap-3">
            <button (click)="skipRatingAndFinish()" class="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition">
              {{ t[lang].skipBtn }}
            </button>
            <button (click)="submitRatingAndFinish()" [disabled]="selectedRating === 0" class="flex-1 py-3.5 bg-[#130E35] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-200 disabled:opacity-50">
              {{ t[lang].submitRatingBtn }}
            </button>
          </div>
        </div>
      </div>

      <header class="bg-[#130E35] text-white px-6 py-4 flex items-center justify-between shadow-md z-10 relative">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="text-slate-400 hover:text-white transition flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10">
            <span class="rtl:rotate-180 text-xl">←</span>
          </button>
          <div>
            <h1 class="text-lg font-bold line-clamp-1" *ngIf="!isLoading">{{ course?.title }}</h1>
            <div *ngIf="isLoading" class="h-5 w-48 bg-white/20 rounded animate-pulse"></div>
            
            <p class="text-xs text-indigo-300 mt-1" *ngIf="!isLoading">
              {{ t[lang].instructor }}: <span class="text-white font-semibold">{{ course?.instructorName }}</span>
            </p>
            <div *ngIf="isLoading" class="h-3 w-32 bg-white/10 rounded mt-1 animate-pulse"></div>
          </div>
        </div>
        <button (click)="toggleLang()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition">
          {{ lang === 'ar' ? 'English' : 'عربي' }}
        </button>
      </header>

      <main class="flex-1 max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row gap-0 lg:gap-6 p-0 lg:p-6 h-[calc(100vh-76px)]">
        
        <div class="flex-1 flex flex-col bg-white lg:rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-full">
          <div class="flex-1 overflow-y-auto flex flex-col">
            
            <div *ngIf="isLoading" class="p-6 lg:p-8 space-y-4">
              <div class="h-6 w-24 bg-indigo-50 rounded-lg animate-pulse"></div>
              <div class="h-10 w-3/4 bg-slate-200 rounded-xl animate-pulse"></div>
              <div class="space-y-3 mt-6">
                <div class="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                <div class="h-4 w-5/6 bg-slate-100 rounded animate-pulse"></div>
                <div class="h-4 w-4/6 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>

            <div class="p-6 lg:p-8 flex flex-col items-start" *ngIf="!isLoading && currentLesson">
              <span class="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg inline-block mb-3">{{ t[lang].lessonDetails }}</span>
              <h2 class="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-4">{{ currentLesson.title }}</h2>
              <p class="text-slate-600 leading-relaxed whitespace-pre-wrap text-base mb-6">{{ currentLesson.description }}</p>
              
              <div class="w-full pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <p class="text-sm font-semibold text-slate-500">{{ t[lang].finishedPrompt }}</p>
                <button (click)="openRatingModal()" 
                        [disabled]="currentLesson.isCompleted"
                        [ngClass]="currentLesson.isCompleted ? 'bg-slate-300 text-slate-600 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'"
                        class="px-6 py-3 font-bold rounded-xl transition flex items-center gap-2">
                  <span *ngIf="!currentLesson.isCompleted">✅ {{ t[lang].finishBtn }}</span>
                  <span *ngIf="currentLesson.isCompleted">✔️ {{ t[lang].completedBtn }}</span>
                </button>
              </div>
            </div>

            <div *ngIf="!isLoading && !currentLesson" class="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center flex-1">
              <span class="text-6xl mb-4"></span>
              <h2 class="text-2xl font-bold text-slate-500">{{ t[lang].selectLesson }}</h2>
            </div>

            <div *ngIf="isLoading" class="w-full aspect-video bg-slate-200 mt-auto border-t border-slate-200 flex items-center justify-center animate-pulse">
              <span class="text-5xl text-slate-300">▶</span>
            </div>

            <!-- Custom HTML5 Secure Video Player -->
            <div *ngIf="!isLoading && currentLesson" #videoContainer class="relative w-full aspect-video bg-black mt-auto border-t border-slate-200 flex items-center justify-center overflow-hidden group" (contextmenu)="$event.preventDefault()">
              
              <video *ngIf="videoUrl" #mediaPlayer [src]="videoUrl" 
                     class="w-full h-full object-contain cursor-pointer"
                     controlsList="nodownload noplaybackrate"
                     disablePictureInPicture
                     (timeupdate)="onTimeUpdate()" 
                     (ended)="isPlaying = false" 
                     (click)="togglePlay()">
              </video>
              
              <!-- Custom Control Bar -->
              <div *ngIf="videoUrl" class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 flex flex-col gap-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                
                <input type="range" min="0" [max]="duration" [value]="currentTime" (input)="onSeek($event)" class="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500" dir="ltr">
                
                <div class="flex items-center justify-between text-white dir-ltr">
                  <div class="flex items-center gap-4">
                    <button (click)="togglePlay()" class="hover:text-indigo-400 transition w-8 flex justify-center">
                      <span *ngIf="!isPlaying" class="text-2xl">▶</span>
                      <span *ngIf="isPlaying" class="text-2xl">⏸</span>
                    </button>
                    
                    <button (click)="skip(-5)" class="hover:text-indigo-400 transition text-sm font-bold flex items-center gap-1" title="Rewind 5s">
                      <span class="text-lg">↺</span> -5s
                    </button>
                    <button (click)="skip(5)" class="hover:text-indigo-400 transition text-sm font-bold flex items-center gap-1" title="Skip 5s">
                      <span class="text-lg">↻</span> +5s
                    </button>
                    
                    <span class="text-xs font-medium ml-2">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
                  </div>

                  <div class="flex items-center gap-4">
                    <button (click)="toggleSpeed()" class="hover:text-indigo-400 transition text-sm font-bold bg-white/10 px-2 py-1 rounded" title="Playback Speed">
                      {{ playbackRate }}x
                    </button>
                    
                    <button (click)="toggleFullScreen()" class="hover:text-indigo-400 transition text-2xl" title="Full Screen">
                      ⛶
                    </button>
                  </div>
                </div>
              </div>
              
              <div *ngIf="!videoUrl" class="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center absolute inset-0 z-10">
                <span class="text-6xl mb-4"></span>
                <h2 class="text-2xl font-bold text-white">{{ t[lang].noVideoForLesson }}</h2>
              </div>
            </div>

          </div>
        </div>

        <div class="w-full lg:w-[400px] bg-white lg:rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full shrink-0 mt-6 lg:mt-0">
          <div class="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 class="font-extrabold text-lg text-slate-900">{{ t[lang].courseContent }}</h2>
            <p class="text-sm text-slate-500 mt-1" *ngIf="!isLoading">{{ lessons.length }} {{ t[lang].lessonsCount }}</p>
            <div *ngIf="isLoading" class="h-3 w-16 bg-slate-200 rounded mt-2 animate-pulse"></div>
          </div>
          
          <div class="flex-1 overflow-y-auto">
            
            <div *ngIf="isLoading" class="p-4 space-y-6">
              <div *ngFor="let i of [1,2,3,4,5,6]" class="flex gap-4">
                <div class="w-8 h-8 rounded-full bg-slate-200 shrink-0 animate-pulse"></div>
                <div class="flex-1 space-y-3 py-1">
                  <div class="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                  <div class="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            </div>

            <ng-container *ngIf="!isLoading">
              <div *ngFor="let lesson of lessons; let i = index" 
                   (click)="selectLesson(lesson)"
                   [ngClass]="{'bg-indigo-50 border-s-4 border-indigo-600': currentLesson?.id === lesson.id, 'hover:bg-slate-50 border-s-4 border-transparent': currentLesson?.id !== lesson.id}"
                   class="p-4 cursor-pointer transition flex items-start gap-4 border-b border-slate-50">
                
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold mt-0.5 transition-colors"
                     [ngClass]="currentLesson?.id === lesson.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'">
                  {{ i + 1 }}
                </div>
                
                <div class="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <div class="flex flex-col">
                    <h3 class="font-bold text-sm transition-colors" [ngClass]="currentLesson?.id === lesson.id ? 'text-indigo-800' : 'text-slate-900'">
                      {{ lesson.title }}
                      <span *ngIf="lesson.isCompleted" class="text-emerald-600 font-bold ml-1">✓</span>
                    </h3>
                  </div>

                  <button *ngIf="currentLesson?.id === lesson.id && hasQuiz" 
                          (click)="openQuiz($event)" 
                          class="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-lg text-xs transition shadow-sm shrink-0">
                     {{ t[lang].takeQuiz }}
                  </button>

                </div>
              </div>

              <div *ngIf="lessons.length === 0" class="p-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 m-4 rounded-xl">
                {{ t[lang].noLessons }}
              </div>
            </ng-container>
          </div>
        </div>
      </main>
    </div>
  `
})
export class CoursePlayerComponent implements OnInit {
  @ViewChild('mediaPlayer') mediaPlayer!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoContainer') videoContainer!: ElementRef<HTMLDivElement>;

  courseId!: number;
  course: any = null;
  lessons: any[] = [];
  currentLesson: any = null;
  hasQuiz: boolean = false;
  isLoading: boolean = true;
  lang: 'en' | 'ar' = 'en';

  videoUrl: string | null = null;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  playbackRate = 1;

  showRatingModal: boolean = false;
  selectedRating: number = 0;
  hoveredRating: number = 0;

  t = {
    en: {
      instructor: 'Instructor', loadingName: 'Loading...', selectLesson: 'Select a lesson to start learning',
      courseContent: 'Course Content', lessonsCount: 'lessons',
      noLessons: 'No lessons available for this course yet.', lessonDetails: 'Instructions & Details',
      noVideoForLesson: 'No Video Provided', takeQuiz: 'Quiz',
      finishedPrompt: 'Have you finished reading this lesson?', finishBtn: 'Mark as Completed', completedBtn: 'Completed',
      ratingTitle: 'Rate the Instructor', ratingDesc: 'Your feedback helps improve the course content!',
      skipBtn: 'Skip', submitRatingBtn: 'Submit & Finish'
    },
    ar: {
      instructor: 'المعلم', loadingName: 'جاري التحميل...', selectLesson: 'اختر درساً للبدء',
      courseContent: 'محتوى الكورس', lessonsCount: 'دروس',
      noLessons: 'لا توجد دروس متاحة في هذا الكورس حالياً.', lessonDetails: 'التعليمات والتفاصيل',
      noVideoForLesson: 'لا يوجد فيديو لهذا الدرس', takeQuiz: 'اختبار',
      finishedPrompt: 'هل أنهيت قراءة ومشاهدة هذا الدرس؟', finishBtn: 'تم إنهاء الدرس', completedBtn: 'مكتمل',
      ratingTitle: 'قيّم أداء المعلم', ratingDesc: 'تقييمك يساعد المعلم على تحسين محتواه باستمرار!',
      skipBtn: 'تخطي', submitRatingBtn: 'إرسال وإنهاء'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private courseService: CourseService,
    private langService: LanguageService
  ) { }

  ngOnInit() {
    this.langService.currentLang$.subscribe(l => this.lang = l);
    this.route.params.subscribe(params => {
      this.courseId = +params['id'];
      this.isLoading = true;
      this.verifyEnrollmentAndLoad();
    });
  }

  verifyEnrollmentAndLoad() {
    this.courseService.getMyCourses().subscribe({
      next: (myCourses: any[]) => {
        const matchedCourse = myCourses.find(c => c.id === this.courseId);

        if (!matchedCourse) {
          this.router.navigate(['/dashboard']);
          return;
        }

        this.courseService.getCourseById(this.courseId).subscribe(data => {
          this.course = data;
          this.course.instructorName = matchedCourse.instructorName;
        });

        this.courseService.getCourseLessons(this.courseId).subscribe(data => {
          this.lessons = data;

          const storageKey = `completed_lessons_${this.courseId}`;
          const completed: number[] = JSON.parse(localStorage.getItem(storageKey) || '[]');

          this.lessons.forEach(l => {
            if (completed.includes(l.id)) {
              l.isCompleted = true;
            }
          });

          this.isLoading = false;
          if (this.lessons.length > 0) {
            this.selectLesson(this.lessons[0]);
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      }
    });
  }

  selectLesson(lesson: any) {
    if (this.currentLesson?.id === lesson.id) return;
    this.currentLesson = lesson;
    this.checkLessonQuiz(lesson.id);

    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.playbackRate = 1;

    if (lesson.videoUrl && lesson.videoUrl.trim() !== '') {
      const baseUrl = 'http://localhost:5162';
      this.videoUrl = lesson.videoUrl.startsWith('http') ? lesson.videoUrl : `${baseUrl}${lesson.videoUrl}`;
    } else {
      this.videoUrl = null;
    }
  }

  togglePlay() {
    const video = this.mediaPlayer.nativeElement;
    if (video.paused) {
      video.play();
      this.isPlaying = true;
    } else {
      video.pause();
      this.isPlaying = false;
    }
  }

  onTimeUpdate() {
    const video = this.mediaPlayer.nativeElement;
    this.currentTime = video.currentTime;
    this.duration = video.duration || 0;
  }

  onSeek(event: any) {
    const video = this.mediaPlayer.nativeElement;
    video.currentTime = event.target.value;
  }

  skip(seconds: number) {
    const video = this.mediaPlayer.nativeElement;
    video.currentTime += seconds;
  }

  toggleSpeed() {
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(this.playbackRate) + 1) % rates.length;
    this.playbackRate = rates[nextIndex];
    this.mediaPlayer.nativeElement.playbackRate = this.playbackRate;
  }

  toggleFullScreen() {
    const container = this.videoContainer.nativeElement;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  }

  formatTime(seconds: number) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  checkLessonQuiz(lessonId: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get(`http://localhost:5162/api/quiz/lesson/${lessonId}`, { headers }).subscribe({
      next: (quiz: any) => {
        this.hasQuiz = quiz && quiz.questions && quiz.questions.length > 0;
      },
      error: () => {
        this.hasQuiz = false;
      }
    });
  }

  openRatingModal() {
    if (this.currentLesson && !this.currentLesson.isCompleted) {
      this.selectedRating = 0;
      this.hoveredRating = 0;
      this.showRatingModal = true;
    }
  }

  skipRatingAndFinish() {
    this.showRatingModal = false;
    this.executeLessonCompletion();
  }

  submitRatingAndFinish() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post(`http://localhost:5162/api/course/${this.courseId}/rate`, this.selectedRating, { headers }).subscribe();

    this.showRatingModal = false;
    this.executeLessonCompletion();
  }

  executeLessonCompletion() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post(`http://localhost:5162/api/course/lesson/${this.currentLesson.id}/complete`, {}, { headers }).subscribe({
      next: () => {
        this.saveCompletedAndRedirect(this.currentLesson.id);
      },
      error: () => {
        this.saveCompletedAndRedirect(this.currentLesson.id);
      }
    });
  }

  saveCompletedAndRedirect(lessonId: number) {
    const storageKey = `completed_lessons_${this.courseId}`;
    let completed: number[] = JSON.parse(localStorage.getItem(storageKey) || '[]');

    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      localStorage.setItem(storageKey, JSON.stringify(completed));
    }

    if (this.currentLesson) {
      this.currentLesson.isCompleted = true;
    }

    this.router.navigate(['/dashboard']);
  }

  openQuiz(event: Event) {
    event.stopPropagation();
    if (this.currentLesson) {
      this.router.navigate(['/quiz-solver', this.currentLesson.id]);
    }
  }

  toggleLang() {
    this.langService.toggleLanguage();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}