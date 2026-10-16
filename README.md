# 🚀 Qimmah Smart Educational Platform — Frontend Web App

[![Angular 19](https://img.shields.io/badge/Angular-19.2-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bilingual RTL/LTR](https://img.shields.io/badge/i18n-Arabic%20RTL%20%2F%20English-success)](https://angular.dev/)
[![Dark Mode](https://img.shields.io/badge/Theme-Dark%20%26%20Light-blue)](https://tailwindcss.com/)
[![Paymob Integrated](https://img.shields.io/badge/Payments-Paymob%20EGP-0052CC)](https://paymob.com/)

> A modern, ultra-responsive, bilingual (Arabic RTL & English LTR) Single-Page Application (SPA) for the **Qimmah Smart Educational Platform** (منصة قمة التعليمية الذكية). Engineered with Angular 19, Tailwind CSS, TypeScript, and RxJS to deliver an intuitive and fluid learning experience across Mobile, Tablet, and Desktop screens.

---

## 🌟 Key Portals & Platform Features

### 1. 🎓 Student Experience & Course Player
- **Interactive Course Player**: Re-engineered vertical flow presenting lesson overview, instructions, and completion milestones first, followed by an aspect-locked video player.
- **Unified Video Player**: Supports YouTube IFrame API and native HTML5 MP4/WebM video with custom controls (play/pause, $\pm 5s$ scrubbers, playback speed, volume, and fullscreen).
- **Gamification & XP**: Visual level progressions, XP milestone points, and achievement badges on course completions.
- **Interactive Quizzes & Assignments**: Seamless multi-question solver with immediate scoring and teacher feedback.

### 2. 👨‍🏫 Instructor Workspace
- **Curriculum & Lesson Builder**: Rapid lesson publishing with direct video URL inputs (YouTube, Vimeo, MP4).
- **Assessment Creator**: Intuitive Quiz and Assignment builder with customizable question weights and answer keys (`✓ Correct Answer` markers).
- **Student Grading**: Review student submissions question-by-question with clear correct/incorrect comparisons.
- **Financial Wallet**: Real-time balance ledger reflecting the 80% instructor revenue share from paid enrollments.

### 3. 🛡️ Admin Management Portal
- **Executive Analytics**: Real-time KPI summary cards and interactive Chart.js visualizations (student enrollments, revenue trends, instructor performance).
- **Course & User Control**: Drill down into specific teachers or students to inspect enrolled/assigned courses (`viewStudentCourses`).
- **Financial & Payment Ledger**: Complete Paymob transaction history with automated 80/20 platform-to-instructor breakdown.
- **System Audit Logs**: Detailed activity logging tracking all administrative interventions.

### 4. 🌐 Internationalization & Responsive Design
- **Bilingual Support (AR / EN)**: Dynamic bidirectional layout switching (`dir="rtl"` $\leftrightarrow$ `dir="ltr"`) with contextual iconography.
- **Dark & Light Mode**: Fluid theme engine with WCAG-compliant contrast tokens and custom dark mode styling across all cards, modals, and tables.
- **Responsive Continuum**: Tailored responsive layouts across phones (`xs`), phablets (`sm`), tablets (`md`), laptops (`lg`), and large displays (`xl/2xl`).

---

## 📁 Project Architecture

```
src/
├── app/
│   ├── admin-dashboard/       # Complete Admin Management suite & charts
│   ├── admin-portal/          # Isolated Admin authentication & guards
│   ├── assignment-creator/    # Teacher Assignment generation tool
│   ├── assignment-solver/     # Student Assignment submission interface
│   ├── course-catalog/        # Public and student course exploration
│   ├── course-details/        # Teacher course & curriculum manager
│   ├── course-landing/        # Course overview, syllabus, & checkout
│   ├── course-player/         # High-performance lesson player
│   ├── landing-page/          # High-converting platform homepage
│   ├── leaderboard/           # Public & student XP ranking leaderboard
│   ├── login/                 # Student & Instructor authentication
│   ├── quiz-creator/          # Teacher Quiz creation suite
│   ├── quiz-solver/           # Student interactive assessment solver
│   ├── reset-password/        # Secure password reset flow
│   ├── services/              # Shared singleton services (Auth, Theme, Language)
│   ├── student-dashboard/     # Student home, profile & enrolled courses
│   └── teacher-dashboard/     # Teacher control center & wallet
├── assets/                    # Platform logos, default covers, & brand icons
└── styles.scss                # Global Tailwind CSS directives & KaTeX styles
```

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.19+ or v20.x recommended)
- [npm](https://www.npmjs.com/) (v9+)
- [Angular CLI](https://angular.dev/tools/cli) (v19.x): `npm install -g @angular/cli`

### 1. Installation
```bash
git clone https://github.com/Qimma-Platform/Frontend.git
cd Frontend
npm install
```

### 2. Development Server
Run the local dev server:
```bash
ng serve
```
Navigate to `http://localhost:4200/`. The app will automatically reload on source changes.

### 3. Production Build
```bash
ng build
```
Build artifacts are compiled into `dist/elearning-frontend/` with full tree-shaking, minification, and CSS extraction.

---

## 🚀 Cloud Deployment (Vercel / Cloudflare Pages)

The frontend is ready for instant Zero-Configuration CI/CD:

### Deploying to Vercel
1. Sign in to [Vercel](https://vercel.com/) with your GitHub account.
2. Select **Add New Project** $\rightarrow$ Import `Qimma-Platform/Frontend`.
3. Framework Preset: **Angular**.
4. Output Directory: `dist/elearning-frontend/browser` (or `dist/elearning-frontend`).
5. Click **Deploy**. Any future `git push` will automatically trigger a new live deployment in ~30 seconds!

---

## 🛡️ License
Private and proprietary. Designed and maintained for the **Qimmah Educational Platform**. All rights reserved.
