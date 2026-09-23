# Tushar Shivade — Portfolio & Professional Admin Panel

A modern, responsive DevOps & Software Engineering portfolio website integrated with a dedicated, secure, full-stack **Admin Panel** and **SQLite** database.

---

## 🚀 Live URLs

- **Public Portfolio**: `http://localhost:5000` (or your production domain `https://shivade.in`)
- **Admin Panel**: `http://localhost:5000/admin`
- **Default Admin Account**:
  - **Email**: `admin@shivade.in`
  - **Password**: `admin123456`

---

## 📑 Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Schema](#4-database-schema)
5. [Admin Panel Features](#5-admin-panel-features)
6. [Security & Authentication](#6-security--authentication)
7. [REST API Endpoints](#7-rest-api-endpoints)
8. [Environment Variables](#8-environment-variables)
9. [How to Run Locally](#9-how-to-run-locally)
10. [How to Manage Admin Accounts](#10-how-to-manage-admin-accounts)
11. [How Content Management Works](#11-how-content-management-works)
12. [File & Media Uploads](#12-file--media-uploads)
13. [Deployment Guide](#13-deployment-guide)

---

## 1. Project Architecture

The application adopts a clean, modular full-stack architecture that keeps the public portfolio extremely fast while giving the administrator full dynamic control over every section.

```
Public Visitor                      Administrator
     │                                    │
     ▼                                    ▼
http://localhost:5000/             http://localhost:5000/admin
(Preserved Static HTML + CSS)       (Modern Dashboard SPA)
     │                                    │
     ▼ (Dynamic Hydration)                ▼ (JWT Auth)
┌──────────────────────────────────────────────┐
│             Express.js REST API              │
│       (/api/portfolio, /api/admin, etc.)     │
└──────────────────────┬───────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────┐              ┌──────────────┐
│   SQLite     │              │   Uploads/   │
│ portfolio.db │              │ Media Files  │
└──────────────┘              └──────────────┘
```

- **Zero Breaking Changes**: If JavaScript is disabled or the backend is loading, the public portfolio still gracefully displays the original hardcoded HTML.
- **Dynamic Hydration**: `portfolio-dynamic.js` fetches `/api/portfolio/content` on page load and dynamically updates text, typing animations, skills, projects, certificates, and stats.

---

## 2. Frontend Architecture

### Public Portfolio (`/`)
- **Structure**: `index.html` (semantic HTML5 with embedded custom styling and dark mode variables).
- **Styling**: Vanilla CSS with custom properties (`--navy`, `--orange`, `--card-bg`, etc.).
- **Animations**:
  - Interactive canvas particle network (`#particles-canvas`) responding to mouse proximity and theme.
  - Role typing effect with rotating titles.
  - IntersectionObserver scroll reveal animations.
- **Dynamic Client**: `portfolio-dynamic.js` loads active items and binds the contact form to `/api/messages`.

### Admin Panel (`/admin`)
- **Structure**: `admin/index.html` (Single Page Application architecture).
- **Styling**: `admin/css/admin.css` (custom design system with responsive drawer, dark/light themes, tables, stat cards, and modals).
- **Controllers**:
  - `admin/js/api.js`: JWT token management, automatic session verification, and API service layer.
  - `admin/js/admin.js`: Navigation routing, view state management, CRUD modals, delete confirmation dialogs, toast notifications, and file upload handlers.

---

## 3. Backend Architecture

- **Runtime**: Node.js (v20+)
- **Server Framework**: Express.js
- **Routing Structure**:
  - `server.js`: Server bootstrap, static file serving, route mounting.
  - `server/routes/auth.js`: Admin login, token verification, password change.
  - `server/routes/portfolio.js`: Fast public endpoint for live portfolio hydration.
  - `server/routes/admin.js`: Protected CRUD operations for all portfolio sections.
  - `server/routes/messages.js`: Contact form message handling & inbox management.
  - `server/routes/resume.js`: Resume upload, active resume selection, and direct downloads.
  - `server/routes/upload.js`: Image and media upload pipeline.

---

## 4. Database Schema

The database uses **SQLite** stored at `server/data/portfolio.db` (configurable via `DATABASE_PATH`). All entities are separated into dedicated relational tables:

1. `admins`: ID, username, email, password_hash, timestamps.
2. `profile`: Full name, professional title, typing roles (JSON array), short intro, bio, avatar, resume URL, contact info, availability, about heading, and stats counters.
3. `skills`: Name, category, level, icon class (Devicon/FontAwesome), color hex, external link, display order, active status.
4. `projects`: Title, description, technologies, banner image, GitHub URL, live demo URL, category, featured flag, display order, active status.
5. `experience`: Company, role, start date, end date, currently working flag, description, technologies, display order, active status.
6. `education`: Degree, institution, location, start/end years, description, grade/CGPA, active status.
7. `certifications`: Name, issuer, issue date, credential ID, file URL (PDF or image), active status.
8. `testimonials`: Person name, role, company, quote content, star rating, active status.
9. `pipeline_steps`: The 4 sequential About cards (01 Code, 02 CI/CD, 03 Containers, 04 Cloud), title, description, display order, active status.
10. `social_links`: Platform, URL, FontAwesome icon class, brand color, display order, active status.
11. `messages`: Name, email, subject, message text, read/unread status, timestamp.
12. `resumes`: Original filename, disk filename, path, size, active status.
13. `website_settings`: Key-value configuration for site title, meta description, copyright, and maintenance flags.
14. `media_files`: Filename, original name, path, file size, mime type, category.

---

## 5. Admin Panel Features

- 📊 **Dashboard Overview**: Instant metrics for total projects, skills, certifications, and unread contact messages.
- 👤 **Profile & Hero**: Edit greeting text, full name, professional title, and the words that rotate in the Hero typing animation.
- ⚡ **Skills Management**: Add new skills with Devicon/FontAwesome icons, custom brand colors, category tags, and instant active/inactive switches.
- 📁 **Project Management**: Showcase DevOps and cloud projects with GitHub links, demo links, tech tags, and featured badges.
- 💼 **Experience & Education**: Manage work history and degree credentials.
- 🏆 **Certifications**: Upload or update certificate files (PDF or images) with live modal preview.
- 📄 **Resume CV Management**: Drag-and-drop new PDF resumes. Setting a resume as active automatically connects it to the public portfolio download button.
- ✉️ **Messages Inbox**: Read incoming inquiries, toggle read/unread status, or delete messages with unread counter badges.
- 🖼️ **Media Library**: Upload and browse images, copy asset URLs to clipboard, or delete files.
- ⚙️ **Settings & Security**: Update website metadata, copyright notice, and change admin password.

---

## 6. Security & Authentication

- **Password Hashing**: Passwords are encrypted using `bcryptjs` with salt rounds.
- **Session Tokens**: Stateless `jsonwebtoken` (JWT) signed with `JWT_SECRET` (24-hour expiration).
- **Route Protection**: `authenticateToken` middleware guards all `/api/admin/*` and management endpoints.
- **Input Validation**: Sanitization and validation on contact submissions and CRUD operations.
- **File Upload Protection**: Multer whitelist filtering restricted to safe formats (`.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, `.pdf`) with a 10MB limit.

---

## 7. REST API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/portfolio/content` | Fetches all active portfolio content |
| `POST` | `/api/messages` | Submits public contact form message |
| `GET` | `/api/resume/active` | Retrieves active resume information |
| `GET` | `/api/resume/download` | Downloads active resume PDF directly |

### Authentication Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Admin login; returns signed JWT |
| `GET` | `/api/auth/verify` | Validates session token |
| `POST` | `/api/auth/change-password` | Updates admin password |

### Protected Admin CRUD Endpoints (Requires Bearer Token)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Dashboard counts and recent messages |
| `GET / PUT` | `/api/admin/profile` | Read / update profile and hero data |
| `GET / POST` | `/api/admin/skills` | List / create skills |
| `PUT / DELETE` | `/api/admin/skills/:id` | Update / delete skill |
| `PATCH` | `/api/admin/skills/:id/toggle` | Toggle skill active status |
| `GET / POST` | `/api/admin/projects` | List / create projects |
| `PUT / DELETE` | `/api/admin/projects/:id` | Update / delete project |
| `PATCH` | `/api/admin/projects/:id/toggle` | Toggle project active status |
| `GET / POST` | `/api/admin/experience` | List / create experience entries |
| `GET / POST` | `/api/admin/education` | List / create education entries |
| `GET / POST` | `/api/admin/certifications`| List / create certifications |
| `GET / POST` | `/api/admin/testimonials` | List / create testimonials |
| `GET / POST` | `/api/admin/social-links` | List / create social links |
| `GET / POST` | `/api/admin/pipeline-steps`| List / create About pipeline cards |
| `GET / PUT` | `/api/admin/settings` | Read / update site settings |
| `GET / DELETE` | `/api/messages/:id` | Inbox management |
| `POST` | `/api/resume/upload` | Upload resume and set active |
| `POST` | `/api/upload` | General file upload |

---

## 8. Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
DATABASE_PATH=./server/data/portfolio.db
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@shivade.in
ADMIN_PASSWORD=admin123456
```

---

## 9. How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation & Launch

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize database & seed portfolio content**:
   ```bash
   npm run seed
   ```
   *(This automatically migrates all 11 existing skills, certificates, pipeline cards, profile photo, and social links into the SQLite database).*

3. **Start the application**:
   ```bash
   npm start
   ```

4. **Access the application**:
   - Open [http://localhost:5000](http://localhost:5000) for the public portfolio.
   - Open [http://localhost:5000/admin](http://localhost:5000/admin) for the Admin Panel.

---

## 10. How to Manage Admin Accounts

To create a new admin or reset an existing admin's password via CLI:

```bash
node server/scripts/createAdmin.js <username> <email> <password>
```

Example:
```bash
node server/scripts/createAdmin.js tushar tushar@shivade.in MySecurePassword123!
```

---

## 11. How Content Management Works

1. Log in to `/admin` using your admin credentials.
2. Select any section from the sidebar (e.g., **Projects**, **Skills**, **Profile**).
3. Make additions or edits using the clean modal forms.
4. Click **Save**.
5. The changes are immediately saved to the SQLite database.
6. Open or refresh the public portfolio at `/` to see your updates live!

---

## 12. File & Media Uploads

- **Resumes**: Navigate to **Resume CV** in the admin sidebar. Drop your latest PDF resume. The public portfolio download button automatically routes visitors to the latest active file.
- **Images**: Navigate to **Media Library** or use the **Upload** button beside any image input in project/profile forms.

---

## 13. Deployment Guide

### Deploying to Linux VPS (DigitalOcean / AWS EC2 / Ubuntu)

1. Clone repository to server:
   ```bash
   git clone https://github.com/tusharshivade/TusharPortFolio.git
   cd TusharPortFolio
   npm install
   npm run seed
   ```
2. Set production environment in `.env`:
   ```env
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=strong_random_secret_generated_for_production
   ```
3. Run with **PM2** for high-availability process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "tushar-portfolio"
   pm2 save
   pm2 startup
   ```
4. Configure **Nginx** reverse proxy:
   ```nginx
   server {
       server_name shivade.in www.shivade.in;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
5. Secure with SSL via Certbot:
   ```bash
   sudo certbot --nginx -d shivade.in -d www.shivade.in
   ```
