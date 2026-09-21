# FIC Assessment Platform (MERN Stack)

The **FIC Assessment Platform** is an internal, full-stack candidate assessment and evaluation system built strictly using the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).

## 🚀 Key Features

### 1. Admin Management Portal

- **Secure Authentication**: JWT-based Admin authentication with bcrypt password hashing (`admin@fic.com` / `admin123`).
- **Dynamic Job Positions**: Create, edit, and toggle any job position (HR Executive, Software Developer, QA Engineer, Finance, etc.). No hardcoded jobs.
- **Job Question Bank**: Manage multiple-choice questions (MCQs) specific to each job position.
- **Bulk Question Import**: Paste raw MCQs (50+ questions) from external documents with automatic validation parser and error preview.
- **Candidate Roster & Resume Storage**: Add candidates manually with Multer resume uploads (PDF/DOCX/TXT) and dynamic job assignment.
- **Cryptographically Secure Assessment Token Links**: Generate secure assessment URLs (`/assessment/:token`) per candidate.
- **Results & Evaluation Reports**: Real-time automated score evaluation, percentage calculation, time taken tracking, and itemized question-by-question breakdown.

### 2. Candidate Assessment Interface

- **Token-based Access**: Direct secure access without public registration.
- **Assessment Landing Page**: Displays candidate details, position title, duration (30 mins), question count, and instructions.
- **Demo Practice Sandbox**: 5 sample demo questions for practice navigation without affecting actual scores.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, React Router v6, Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, Multer.

---

## 📂 Project Structure

```text
FIC Assessment/
│
├── client/
│   ├── src/
│   │   ├── components/       # AdminLayout, ProtectedRoute, Badge, etc.
│   │   ├── context/          # AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/        # Login, Dashboard, Jobs, Questions, Bulk, Candidates, Results
│   │   │   └── candidate/    # Landing, Demo, Actual Assessment, Completed
│   │   ├── services/         # api.js (Axios instance)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/               # db.js (Mongoose connection)
│   ├── controllers/          # auth, job, question, candidate, assessment, result controllers
│   ├── middleware/           # authMiddleware, uploadMiddleware, errorMiddleware
│   ├── models/               # Admin, Job, Question, Candidate, Assessment, AssessmentQuestion, Answer
│   ├── routes/               # Express REST route handlers
│   ├── utils/                # bulkQuestionParser, tokenGenerator
│   ├── uploads/              # Local resume file storage
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites

- **Node.js**: v18+
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas.

### 2. Backend Setup

```bash
cd server
npm install
node server.js
```

The server will start on `http://localhost:5000` and automatically seed the default admin:

- **Email**: `admin@fic.com`
- **Password**: `admin123`

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

The Vite development server will start on `http://localhost:5173`.

---

## 🔒 Default Credentials & Verification Workflow

1. Open `http://localhost:5173/admin/login`.
2. Login with `admin@fic.com` / `admin123`.
3. Create a Job Position (e.g. `Software Developer`).
4. Go to **Bulk Import**, select `Software Developer`, and paste sample questions.
5. Create candidate `Rahul Kumar`, upload resume, and assign `Software Developer`.
6. Click **Generate Assessment Link** and copy the token URL.
7. Open the generated link in a browser tab to complete the candidate assessment workflow!
