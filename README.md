# PDF Merger & Editor Platform

**Intelligent PDF Merger & Editor**: A Full-Stack Web Application for Document Management

![Status](https://img.shields.io/badge/status-MVP_Ready-success)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Overview

A comprehensive full-stack web application that enables users to seamlessly merge multiple PDF files, manage documents securely, and track merge history with a beautiful, modern interface.

### Key Features

✨ **User Authentication** - Secure JWT-based registration and login  
📁 **PDF Upload** - Drag-and-drop file upload with validation  
🔀 **Smart Merging** - Combine multiple PDFs with custom ordering  
📊 **Dashboard** - View statistics, recent files, and merge history  
🕒 **History Tracking** - Complete audit trail of all merge operations  
⬇️ **Easy Downloads** - Download original or merged files anytime  

---

## 🏗️ Architecture

### Three-Tier Design

```
Frontend (React + Vite)
      ↕
Backend API (Express + Node.js)
      ↕
Database (MongoDB)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+ installed
- MongoDB installed and running locally
- npm or yarn package manager

### Installation

#### 1. Clone the Repository

```bash
cd "p:/Merging PDFS"
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (use `.env.example` as template):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pdf-merger
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

Start MongoDB (in a separate terminal):
```bash
mongod
```

Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

#### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📖 Usage Guide

### 1. Register/Login
- Create a new account or login with existing credentials
- Secure JWT authentication keeps you logged in

### 2. Upload PDFs
- Navigate to the Merge page
- Drag and drop PDF files or click to browse
- Upload multiple files at once

### 3. Merge Documents
- Arrange files in desired order
- Give your merged document a name
- Click "Merge" to combine all files

### 4. View Dashboard
- See statistics (total files, merges, storage)
- Browse recent files
- Access merge history
- Download any document

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **pdf-lib** - PDF manipulation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **pdf-lib** - PDF processing
- **Joi** - Validation

---

## 📁 Project Structure

```
p:/Merging PDFS/
├── backend/
│   ├── models/           # MongoDB schemas
│   │   ├── User.js
│   │   ├── File.js
│   │   └── MergeOperation.js
│   ├── routes/           # API endpoints
│   │   ├── auth.js
│   │   ├── files.js
│   │   └── merge.js
│   ├── middleware/       # Custom middleware
│   │   └── auth.js
│   ├── uploads/          # File storage
│   ├── server.js         # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/        # Page components
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── Merger.jsx
    │   ├── context/      # React context
    │   │   └── AuthContext.jsx
    │   ├── services/     # API services
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## 🔌 API Endpoints

### Authentication
```
POST /api/v1/auth/register  - Register new user
POST /api/v1/auth/login     - Login user
POST /api/v1/auth/logout    - Logout user
```

### Files
```
POST   /api/v1/files/upload     - Upload PDFs
GET    /api/v1/files            - Get all user files
GET    /api/v1/files/:fileId    - Get file by ID
DELETE /api/v1/files/:fileId    - Delete file
PUT    /api/v1/files/:fileId    - Update file metadata
```

### Merge Operations
```
POST /api/v1/merge                    - Merge PDFs
GET  /api/v1/merge/history            - Get merge history
GET  /api/v1/merge/:mergeId           - Get merge details
POST /api/v1/merge/:mergeId/annotate  - Add annotations
```

---

## 🎨 Design Highlights

- **Modern Gradients** - Eye-catching color schemes
- **Smooth Animations** - Fade-in, slide-up transitions
- **Responsive Layout** - Works on desktop, tablet, mobile
- **Intuitive UX** - Clear visual hierarchy and workflows
- **Loading States** - User feedback for all operations
- **Error Handling** - Helpful error messages

---

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Protected API routes
- File type validation
- File size limits
- User-specific data isolation
- Secure file storage

---

## 📈 Future Enhancements

### Phase 2
- Cloud storage integration (AWS S3/Cloudinary)
- Email verification
- Advanced PDF editor with annotations
- Share links with expiration
- PDF compression
- Premium subscriptions

### Phase 3
- Real-time collaboration
- OCR for scanned PDFs
- Digital signatures
- Mobile applications
- Browser extension
- API for third-party integrations

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
mongod

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/pdf-merger
```

### Port Already in Use
```bash
# Change port in backend/.env
PORT=5001

# Change port in frontend/vite.config.js
server: { port: 5174 }
```

### File Upload Fails
- Check file size is under 10MB
- Ensure file is PDF format
- Verify uploads folder exists in backend directory

---

## 👨‍💻 Development

### Run in Development Mode

Backend:
```bash
cd backend
npm run dev     # Uses nodemon for auto-reload
```

Frontend:
```bash
cd frontend
npm run dev     # Vite dev server with HMR
```

### Build for Production

Frontend:
```bash
cd frontend
npm run build   # Creates optimized build in dist/
```

---

## 📄 License

MIT License - feel free to use this project for learning or production!

---

## 🙏 Acknowledgments

- Built with React, Express, and MongoDB
- Icons by Lucide React
- PDF processing by pdf-lib
- Styling with Tailwind CSS

---

## 📧 Support

For questions or issues:
1. Check the troubleshooting section
2. Review API documentation
3. Inspect browser console for errors
4. Check backend logs for server errors

---

**Happy PDF Merging! 🎉**
