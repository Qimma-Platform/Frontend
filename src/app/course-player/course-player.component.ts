import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { CourseService } from '../services/course.service';
import { LanguageService } from '../services/language.service';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  styles: [`
    #youtubePlayerElement, #youtubePlayerElement iframe {
      width: 100% !important;
      height: 100% !important;
      display: block;
      border: 0;
    }
  `],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col font-sans" [dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      
      <div *ngIf="showRatingModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md px-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md text-center transform transition-all animate-scale-in">
          <div class="w-20 h-20 bg-amber-50 dark:bg-amber-950/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
            👨‍🏫
          </div>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-2">{{ t[lang].ratingTitle }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">{{ t[lang].ratingDesc }}</p>
          
          <div class="flex justify-center gap-3 mb-8 cursor-pointer text-4xl dir-ltr flex-row-reverse" (mouseleave)="hoveredRating = 0">
            <span *ngFor="let star of [5, 4, 3, 2, 1]" 
                  (mouseenter)="hoveredRating = star"
                  (click)="selectedRating = star"
                  [ngClass]="(hoveredRating >= star || selectedRating >= star) ? 'text-amber-400 drop-shadow-md' : 'text-slate-200 dark:text-slate-700'"
                  class="transition-all hover:scale-110 hover:text-amber-300">
              ★
            </span>
          </div>

          <div class="flex gap-3">
            <button (click)="skipRatingAndFinish()" class="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition">
              {{ t[lang].skipBtn }}
            </button>
            <button (click)="submitRatingAndFinish()" [disabled]="selectedRating === 0" class="flex-1 py-3.5 bg-[#130E35] dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50">
              {{ t[lang].submitRatingBtn }}
            </button>
          </div>
        </div>
      </div>

      <header class="bg-[#130E35] dark:bg-slate-900 border-b border-indigo-900/50 dark:border-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-md z-10 relative">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="text-slate-400 hover:text-white transition flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10">
            <span class="rtl:rotate-180 text-xl">←</span>
          </button>
          <div>
            <h1 class="text-lg font-bold line-clamp-1" *ngIf="!isLoading">{{ course?.title }}</h1>
            <div *ngIf="isLoading" class="h-5 w-48 bg-white/20 rounded animate-pulse"></div>
            
            <p class="text-xs text-indigo-300 dark:text-indigo-400 mt-1" *ngIf="!isLoading">
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
        
        <div class="flex-1 flex flex-col bg-white dark:bg-slate-900 lg:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-full">
          
          <div class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 flex flex-col pb-16">
            
            <!-- Loading Skeleton -->
            <div *ngIf="isLoading" class="space-y-6">
              <div class="space-y-4">
                <div class="h-6 w-24 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg animate-pulse"></div>
                <div class="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                <div class="space-y-2 mt-4">
                  <div class="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                  <div class="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>
              <div class="w-full aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center animate-pulse">
                <span class="text-5xl text-slate-300 dark:text-slate-600">▶</span>
              </div>
            </div>

            <!-- Active Lesson View: Instructions & Details FIRST, Video BELOW -->
            <ng-container *ngIf="!isLoading && currentLesson">
              <!-- 1. Lesson Header, Description & Completion Actions (First at Top) -->
              <div class="space-y-4">
                <div class="flex items-center justify-between flex-wrap gap-3">
                  <span class="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold text-xs rounded-lg inline-block">
                    {{ t[lang].lessonDetails }}
                  </span>
                  
                  <button (click)="openRatingModal()" 
                          [disabled]="currentLesson.isCompleted"
                          [ngClass]="currentLesson.isCompleted ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer'"
                          class="px-5 py-2.5 font-bold rounded-xl transition flex items-center gap-2 text-xs sm:text-sm">
                    <span *ngIf="!currentLesson.isCompleted">✅ {{ t[lang].finishBtn }}</span>
                    <span *ngIf="currentLesson.isCompleted">✔️ {{ t[lang].completedBtn }}</span>
                  </button>
                </div>

                <h2 class="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {{ currentLesson.title }}
                </h2>

                <div *ngIf="currentLesson.description" class="p-4 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                  <p class="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                    {{ currentLesson.description }}
                  </p>
                </div>
              </div>

              <!-- 2. Video Player Container (Below the Instructions and Details) -->
              <div #videoContainer class="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group select-none shadow-md mt-2" (contextmenu)="$event.preventDefault()">
                
                <!-- YouTube Video Mount Target -->
                <div *ngIf="isYoutube" class="w-full h-full relative">
                  <div id="youtubePlayerElement" class="w-full h-full"></div>
                </div>

                <!-- Standard HTML5 Video Player -->
                <video *ngIf="videoUrl && !isYoutube" #mediaPlayer [src]="videoUrl" 
                       class="w-full h-full object-contain cursor-pointer"
                       controlsList="nodownload noplaybackrate"
                       disablePictureInPicture
                       (timeupdate)="onTimeUpdate()" 
                       (ended)="onEnded()" 
                       (click)="togglePlay()">
                </video>

                <!-- Clickable overlay on video when playing to pause by clicking anywhere on video -->
                <div *ngIf="videoUrl && isPlaying" (click)="togglePlay()" class="absolute inset-0 z-[5] cursor-pointer"></div>

                <!-- Central Play Button when Paused -->
                <div *ngIf="!isPlaying && videoUrl" (click)="togglePlay()" class="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-opacity z-10 group/play">
                  <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center text-2xl sm:text-3xl shadow-2xl transform group-hover/play:scale-110 transition-all pl-1">
                    ▶
                  </div>
                </div>
                
                <!-- Unified Custom Control Bar (For BOTH HTML5 and YouTube) -->
                <div *ngIf="videoUrl" class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 flex flex-col gap-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-20 pointer-events-none group-hover:pointer-events-auto">
                  
                  <input type="range" min="0" [max]="duration || 100" [value]="currentTime" (input)="onSeek($event)" class="w-full h-1.5 bg-slate-600/80 hover:bg-slate-500 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all pointer-events-auto" dir="ltr">
                  
                  <div class="flex items-center justify-between text-white dir-ltr">
                    <div class="flex items-center gap-3 sm:gap-4 pointer-events-auto">
                      <button (click)="togglePlay()" class="hover:text-indigo-400 transition w-8 flex justify-center text-2xl cursor-pointer" [title]="lang === 'ar' ? (isPlaying ? 'إيقاف مؤقت' : 'تشغيل') : (isPlaying ? 'Pause' : 'Play')">
                        <span *ngIf="!isPlaying">▶</span>
                        <span *ngIf="isPlaying">⏸</span>
                      </button>
                      
                      <button (click)="skip(-5)" class="hover:text-indigo-400 transition text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer" [title]="lang === 'ar' ? 'تقديم 5 ثوانٍ للخلف' : 'Rewind 5s'">
                        <span class="text-base sm:text-lg">↺</span> -5s
                      </button>
                      <button (click)="skip(5)" class="hover:text-indigo-400 transition text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer" [title]="lang === 'ar' ? 'تقديم 5 ثوانٍ للأمام' : 'Skip 5s'">
                        <span class="text-base sm:text-lg">↻</span> +5s
                      </button>

                      <button (click)="toggleMute()" class="hover:text-indigo-400 transition text-lg sm:text-xl ml-1 cursor-pointer" [title]="lang === 'ar' ? (isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت') : (isMuted ? 'Unmute' : 'Mute')">
                        <span *ngIf="!isMuted">🔊</span>
                        <span *ngIf="isMuted">🔇</span>
                      </button>
                      
                      <span class="text-xs font-medium ml-1 text-slate-300">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
                    </div>

                    <div class="flex items-center gap-2 sm:gap-4 pointer-events-auto">
                      <button (click)="toggleSpeed()" class="hover:text-indigo-400 transition text-xs sm:text-sm font-bold bg-white/10 px-2 py-1 rounded cursor-pointer" [title]="lang === 'ar' ? 'سرعة التشغيل' : 'Playback Speed'">
                        {{ playbackRate }}x
                      </button>
                      
                      <button (click)="toggleFullScreen()" class="hover:text-indigo-400 transition text-xl sm:text-2xl cursor-pointer" [title]="lang === 'ar' ? 'ملء الشاشة' : 'Full Screen'">
                        ⛶
                      </button>
                    </div>
                  </div>
                </div>
                
                <div *ngIf="!videoUrl" class="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center absolute inset-0 z-10">
                  <span class="text-6xl mb-4">📺</span>
                  <h2 class="text-xl font-bold text-white">{{ t[lang].noVideoForLesson }}</h2>
                </div>
              </div>
            </ng-container>

            <!-- No Lesson Selected Placeholder -->
            <div *ngIf="!isLoading && !currentLesson" class="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center flex-1 my-auto">
              <span class="text-6xl mb-4">📖</span>
              <h2 class="text-2xl font-bold text-slate-500 dark:text-slate-400">{{ t[lang].selectLesson }}</h2>
            </div>

          </div>

        </div>

        <div class="w-full lg:w-[400px] bg-white dark:bg-slate-900 lg:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden h-full shrink-0 mt-6 lg:mt-0">
          <div class="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <h2 class="font-extrabold text-lg text-slate-900 dark:text-white">{{ t[lang].courseContent }}</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1" *ngIf="!isLoading">{{ lessons.length }} {{ t[lang].lessonsCount }}</p>
            <div *ngIf="isLoading" class="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse"></div>
          </div>
          
          <div class="flex-1 overflow-y-auto">
            
            <div *ngIf="isLoading" class="p-4 space-y-6">
              <div *ngFor="let i of [1,2,3,4,5,6]" class="flex gap-4">
                <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 animate-pulse"></div>
                <div class="flex-1 space-y-3 py-1">
                  <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                  <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            </div>

            <ng-container *ngIf="!isLoading">
              <div *ngFor="let lesson of lessons; let i = index" 
                   (click)="selectLesson(lesson)"
                   [ngClass]="{'bg-indigo-50 dark:bg-indigo-950/40 border-s-4 border-indigo-600': currentLesson?.id === lesson.id, 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-s-4 border-transparent': currentLesson?.id !== lesson.id}"
                   class="p-4 cursor-pointer transition flex items-start gap-4 border-b border-slate-50 dark:border-slate-800/60">
                
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold mt-0.5 transition-colors"
                     [ngClass]="currentLesson?.id === lesson.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'">
                  {{ i + 1 }}
                </div>
                
                <div class="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <div class="flex flex-col">
                    <h3 class="font-bold text-sm transition-colors" [ngClass]="currentLesson?.id === lesson.id ? 'text-indigo-800 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-200'">
                      {{ lesson.title }}
                      <span *ngIf="lesson.isCompleted" class="text-emerald-600 dark:text-emerald-400 font-bold ml-1">✓</span>
                    </h3>
                  </div>

                  <button *ngIf="currentLesson?.id === lesson.id && hasQuiz" 
                          (click)="openQuiz($event)" 
                          class="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-lg text-xs transition shadow-sm shrink-0">
                     {{ t[lang].takeQuiz }}
                  </button>

                </div>
              </div>

              <div *ngIf="lessons.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 m-4 rounded-xl">
                {{ t[lang].noLessons }}
              </div>

              <!-- Comprehensive Assessments in Playlist -->
              <div *ngIf="hasComprehensiveQuiz || comprehensiveAssignment" class="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/70 dark:bg-slate-900/70">
                <div *ngIf="hasComprehensiveQuiz" class="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-base">📝</span>
                    <span class="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">{{ lang === 'ar' ? 'الاختبار الشامل للكورس' : 'Comprehensive Exam' }}</span>
                  </div>
                  <button (click)="openComprehensiveQuiz()" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-sm shrink-0">
                    {{ lang === 'ar' ? 'بدء الاختبار' : 'Start Exam' }}
                  </button>
                </div>

                <div *ngIf="comprehensiveAssignment" class="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-base shrink-0">📚</span>
                    <span class="text-xs font-extrabold text-purple-800 dark:text-purple-300 truncate">{{ comprehensiveAssignment.title || (lang === 'ar' ? 'الواجب الشامل للكورس' : 'Comprehensive Assignment') }}</span>
                  </div>
                  <button (click)="openComprehensiveAssignment()" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition shadow-sm shrink-0">
                    {{ lang === 'ar' ? 'حل الواجب' : 'Solve' }}
                  </button>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </main>
    </div>
  `
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
  @ViewChild('mediaPlayer') mediaPlayer?: ElementRef<HTMLVideoElement>;
  @ViewChild('videoContainer') videoContainer!: ElementRef<HTMLDivElement>;

  courseId!: number;
  course: any = null;
  lessons: any[] = [];
  currentLesson: any = null;
  hasQuiz: boolean = false;
  hasComprehensiveQuiz: boolean = false;
  comprehensiveAssignment: any = null;
  isLoading: boolean = true;
  lang: 'en' | 'ar' = 'en';

  videoUrl: string | null = null;
  isYoutube: boolean = false;
  safeYoutubeUrl: SafeResourceUrl | null = null;
  isPlaying = false;
  isMuted = false;
  currentTime = 0;
  duration = 0;
  playbackRate = 1;

  ytPlayer: any = null;
  private timeTrackerInterval: any = null;

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
    private langService: LanguageService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.langService.currentLang$.subscribe(l => this.lang = l);
    this.route.params.subscribe(params => {
      this.courseId = +params['id'];
      this.isLoading = true;
      this.verifyEnrollmentAndLoad();
    });
  }

  ngOnDestroy() {
    this.stopTimeTracker();
    if (this.ytPlayer && typeof this.ytPlayer.destroy === 'function') {
      try { this.ytPlayer.destroy(); } catch (e) {}
      this.ytPlayer = null;
    }
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
          const targetLessonId = this.route.snapshot.queryParams['lessonId'];
          const targetLesson = targetLessonId ? this.lessons.find(l => l.id == targetLessonId) : null;
          if (targetLesson) {
            this.selectLesson(targetLesson);
          } else if (this.lessons.length > 0) {
            this.selectLesson(this.lessons[0]);
          }
        });

        // Check for comprehensive course exam
        this.http.get<any>(`https://qimma.runasp.net/api/quiz/course-exam/${this.courseId}`).subscribe({
          next: (quiz: any) => {
            this.hasComprehensiveQuiz = quiz && quiz.questions && quiz.questions.length > 0;
          },
          error: () => {
            this.hasComprehensiveQuiz = false;
          }
        });

        // Check for comprehensive course assignment
        const token = localStorage.getItem('token');
        const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
        this.http.get<any[]>(`https://qimma.runasp.net/api/assignments/course/${this.courseId}`, { headers }).subscribe({
          next: (assignments: any[]) => {
            const comp = assignments ? assignments.find((a: any) => !a.lessonId || a.lessonId === 0) : null;
            this.comprehensiveAssignment = comp || null;
          },
          error: () => {
            this.comprehensiveAssignment = null;
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
    this.isMuted = false;
    this.stopTimeTracker();

    if (this.mediaPlayer?.nativeElement) {
      try { this.mediaPlayer.nativeElement.pause(); } catch (_) {}
    }

    if (lesson.videoUrl && lesson.videoUrl.trim() !== '') {
      const trimmed = lesson.videoUrl.trim();
      const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);

      if (ytMatch && ytMatch[1]) {
        this.isYoutube = true;
        this.videoUrl = trimmed;
        this.initOrLoadYoutube(ytMatch[1]);
      } else {
        this.isYoutube = false;
        if (this.ytPlayer && typeof this.ytPlayer.destroy === 'function') {
          try { this.ytPlayer.destroy(); } catch (_) {}
          this.ytPlayer = null;
        }
        const baseUrl = 'https://qimma.runasp.net';
        const rawUrl = trimmed.startsWith('http') ? trimmed : `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
        this.videoUrl = encodeURI(decodeURI(rawUrl));
      }
    } else {
      this.isYoutube = false;
      this.videoUrl = null;
      if (this.ytPlayer && typeof this.ytPlayer.destroy === 'function') {
        try { this.ytPlayer.destroy(); } catch (_) {}
        this.ytPlayer = null;
      }
    }
  }

  initOrLoadYoutube(ytId: string) {
    const setup = () => {
      if (typeof (window as any).YT === 'undefined' || !(window as any).YT.Player) {
        setTimeout(setup, 150);
        return;
      }

      const containerEl = document.getElementById('youtubePlayerElement');
      if (!containerEl) {
        setTimeout(setup, 150);
        return;
      }

      if (this.ytPlayer && typeof this.ytPlayer.cueVideoById === 'function') {
        try {
          this.ytPlayer.cueVideoById(ytId);
          this.startTimeTracker();
          return;
        } catch (e) {
          try { this.ytPlayer.destroy(); } catch (_) {}
          this.ytPlayer = null;
        }
      }

      try {
        this.ytPlayer = new (window as any).YT.Player('youtubePlayerElement', {
          videoId: ytId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 0,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              this.duration = event.target.getDuration() || 0;
              this.startTimeTracker();
            },
            onStateChange: (event: any) => {
              if (event.data === 1) {
                this.isPlaying = true;
                const dur = event.target.getDuration();
                if (dur && dur > 0) this.duration = dur;
              } else if (event.data === 2) {
                this.isPlaying = false;
              } else if (event.data === 0) {
                this.isPlaying = false;
                this.currentTime = 0;
              }
            }
          }
        });
      } catch (err) {
        console.warn('YT.Player init error:', err);
      }
    };

    setTimeout(setup, 100);
  }

  startTimeTracker() {
    this.stopTimeTracker();
    this.timeTrackerInterval = setInterval(() => {
      if (this.isYoutube && this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
        try {
          const cur = this.ytPlayer.getCurrentTime();
          const dur = this.ytPlayer.getDuration();
          if (typeof cur === 'number' && !isNaN(cur)) {
            this.currentTime = cur;
          }
          if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
            this.duration = dur;
          }
          if (typeof this.ytPlayer.getPlayerState === 'function') {
            const st = this.ytPlayer.getPlayerState();
            this.isPlaying = (st === 1);
            if (st === 0) this.currentTime = 0;
          }
        } catch (e) {}
      }
    }, 250);
  }

  stopTimeTracker() {
    if (this.timeTrackerInterval) {
      clearInterval(this.timeTrackerInterval);
      this.timeTrackerInterval = null;
    }
  }

  togglePlay() {
    if (this.isYoutube && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      try {
        if (this.isPlaying) {
          this.ytPlayer.pauseVideo();
          this.isPlaying = false;
        } else {
          this.ytPlayer.playVideo();
          this.isPlaying = true;
          this.startTimeTracker();
        }
        return;
      } catch (e) {}
    }

    if (this.mediaPlayer?.nativeElement) {
      const video = this.mediaPlayer.nativeElement;
      if (video.paused) {
        video.play().catch(() => {});
        this.isPlaying = true;
      } else {
        video.pause();
        this.isPlaying = false;
      }
    }
  }

  onTimeUpdate() {
    if (this.mediaPlayer?.nativeElement) {
      const video = this.mediaPlayer.nativeElement;
      this.currentTime = video.currentTime;
      this.duration = video.duration || 0;
    }
  }

  onEnded() {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  onSeek(event: any) {
    const target = +event.target.value;
    this.currentTime = target;
    if (this.isYoutube && this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
      try {
        this.ytPlayer.seekTo(target, true);
        return;
      } catch (e) {}
    }
    if (this.mediaPlayer?.nativeElement) {
      this.mediaPlayer.nativeElement.currentTime = target;
    }
  }

  skip(seconds: number) {
    const target = Math.max(0, Math.min(this.duration || 999999, this.currentTime + seconds));
    this.currentTime = target;
    if (this.isYoutube && this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
      try {
        this.ytPlayer.seekTo(target, true);
        return;
      } catch (e) {}
    }
    if (this.mediaPlayer?.nativeElement) {
      this.mediaPlayer.nativeElement.currentTime = target;
    }
  }

  toggleSpeed() {
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(this.playbackRate) + 1) % rates.length;
    this.playbackRate = rates[nextIndex];
    if (this.isYoutube && this.ytPlayer && typeof this.ytPlayer.setPlaybackRate === 'function') {
      try {
        this.ytPlayer.setPlaybackRate(this.playbackRate);
      } catch (e) {}
    }
    if (this.mediaPlayer?.nativeElement) {
      this.mediaPlayer.nativeElement.playbackRate = this.playbackRate;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isYoutube && this.ytPlayer) {
      try {
        if (this.isMuted) this.ytPlayer.mute();
        else this.ytPlayer.unMute();
      } catch (e) {}
    }
    if (this.mediaPlayer?.nativeElement) {
      this.mediaPlayer.nativeElement.muted = this.isMuted;
    }
  }

  toggleFullScreen() {
    const container = this.videoContainer?.nativeElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
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

    this.http.get(`https://qimma.runasp.net/api/quiz/lesson/${lessonId}`, { headers }).subscribe({
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

    this.http.post(`https://qimma.runasp.net/api/course/${this.courseId}/rate`, this.selectedRating, { headers }).subscribe();

    this.showRatingModal = false;
    this.executeLessonCompletion();
  }

  executeLessonCompletion() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post(`https://qimma.runasp.net/api/course/lesson/${this.currentLesson.id}/complete`, {}, { headers }).subscribe({
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
      this.router.navigate(['/quiz-solver', this.currentLesson.id], { queryParams: { courseId: this.courseId }, replaceUrl: true });
    }
  }

  openComprehensiveQuiz() {
    this.router.navigate(['/quiz-solver', 0], { queryParams: { courseId: this.courseId } });
  }

  openComprehensiveAssignment() {
    if (this.comprehensiveAssignment) {
      this.router.navigate(['/assignment-solver', this.comprehensiveAssignment.id]);
    }
  }

  toggleLang() {
    this.langService.toggleLanguage();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}