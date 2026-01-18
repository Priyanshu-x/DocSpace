# FileVault - Secure File Storage Server

FileVault is a feature-rich, self-hosted file storage solution featuring a modern React frontend and a powerful Node.js/Express backend. It supports secure file uploads, folder management, file previews, and public sharing.

## 🚀 Features

### Core features
-   **User Authentication**: Secure Login/Registration with JWT and Cookies.
-   **Guest Mode**: **Use immediately** without registration (auto-created guest sessions).
-   **File Storage**: Upload multiple files (Cloudinary integration).
-   **File Management**: Grid/List views, sorting, and bulk delete actions.
-   **Folder Support**: Organize files into nested folders.

### Advanced Capabilities
-   **Preview Engine**: Instantly preview Images (JPG, PNG), Videos (MP4), Audio, and PDFs directly in the browser.
-   **Public Sharing**: Generate unique, shareable links to files for external users.
-   **Public Download Page**: Dedicated page for recipients to view and download shared files securely.

### UI/UX
-   **Responsive Design**: Mobile-friendly layout.
-   **Toast Notifications**: Real-time feedback for all actions.
-   **Drag & Drop**: Intuitive upload zone with progress tracking.
-   **Dark Mode**: Sleek, professional monochromatic dark theme.

### Administration
-   **Admin Panel**: Dedicated dashboard for administrators.
-   **User Management**: Block/Unblock users.
-   **Global File Access**: Admins can view and delete any user's files.

---

## 🛠 Tech Stack

### Frontend (`/client`)
-   **Framework**: React 18 (Vite)
-   **Styling**: Vanilla CSS (Variables, Responsive Grid)
-   **Routing**: React Router DOM (Protected Routes)
-   **HTTP Client**: Axios

### Backend (`/server`)
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: SQLite (Default) or PostgreSQL (via Prisma ORM)
-   **Authentication**: JSON Web Tokens (JWT), BCrypt, Cookie-based sessions
-   **File Storage**: Cloudinary (via `multer-storage-cloudinary`)

---

## 📦 Installation & Setup

### Prerequisites
-   Node.js (v18+ recommended)
-   Cloudinary Account (for file storage)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd server
```

### 2. Backend Setup
```bash
cd server
npm install
# Generate Prisma Client
npx prisma generate
# Push Schema to DB (Creates local dev.db by default)
npx prisma db push
# Start Server
node src/server.js
```
The backend runs on `http://localhost:3000`.

### 3. Frontend Setup
Open a new terminal:
```bash
cd client
npm install
# Start Development Server
npm run dev
```
The frontend runs on `http://localhost:5173`.

---

## ⚙️ Configuration

Create a `.env` file in the `server/` directory.

### Env File Template

```env
# Database (SQLite by default)
DATABASE_URL="file:./dev.db"

# Cloudinary (Required)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# App Secrets
JWT_SECRET="super_secret_random_string"
CLIENT_URL="http://localhost:5173"
PORT=3000
```

---

## 🔗 API Reference

### Auth
-   `POST /auth/guest` - Create anonymous session
-   `POST /auth/register` - Create new account
-   `POST /auth/login` - Login user
-   `POST /auth/logout` - Logout user
-   `GET /auth/me` - Get current session info

### Files & Folders
-   `POST /api/upload` - Upload files (supports `folderId`)
-   `GET /api/files` - List files (supports pagination, sorting, `folderId`)
-   `POST /api/folders` - Create folder
-   `GET /api/folders` - List folders
-   `DELETE /api/folders/:id` - Delete folder (cascade)
-   `POST /api/files/:id/share` - Generate share link

### Public
-   `GET /share/:token` - Get info for shared file (Public Access)

### Admin
-   `GET /api/admin/users` - List all users
-   `PATCH /api/admin/users/:id` - Block/Unblock user

---

## 🛡 Security Notes
-   **Access Control**: Files are protected; only the owner or an admin can access them.
-   **Validation**: Input validation for file types and sizes.
-   **Secure Cookies**: HTTPOnly cookies prevent XSS attacks on tokens.
-   **Rate Limiting**: API throttling enabled.
