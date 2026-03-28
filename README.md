# India Innovates | Civic Matrix 3D Analytical Galaxy

A premium, AI-driven civic grievance and electoral management system. This project features a 3D visualization of city-wide issues, automated AI categorization using Google Gemini, and a robust voter identification portal.

## 🌟 Key Features
- **3D Analytical Galaxy**: A high-performance visualization of civic complaints using React Three Fiber.
- **AI-Driven Categorization**: Automatic department assignment and issue classification via Google Gemini.
- **Voter Portal**: Secure login and electoral roll management for citizens and administrators.
- **Department Workflow**: Dedicated dashboard for civic departments to resolve and track issues.

## 🏗️ System Architecture
The project consists of three main components that need to run simultaneously:
1. **Public/Voter Portal**: Python FastAPI serving the frontend and electoral APIs.
2. **Civic Backend**: Node.js Express server handling core logic and database.
3. **Advanced 3D Dashboard**: Vite/React application for analytical visualization.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18 or higher
- **Python**: v3.10 or higher
- **SQLite3**: Installed on your system

### 2. Configuration
Copy the environment templates and add your API keys:
```bash
# In the root directory
cp .env.example .env

# In the backend directory
cd civic-viz-system/backend
cp .env.example .env
```
*Required Keys*: `GEMINI_API_KEY` and `GMAIL_PASS` (Gmail App Password).

### 3. Installation & Database Setup
```bash
# Install Python dependencies
pip install fastapi uvicorn pydantic google-generativeai

# Install Backend dependencies
cd civic-viz-system/backend
npm install

# Initialize and Seed Database
# (If civic_viz.db is missing)
node seed_mock_data.js

# Install Frontend dependencies
cd ../civic-frontend
npm install
```

### 4. Running the Project
Open three terminals and run the following commands:

**Terminal 1: Voter Portal (FastAPI)**
```bash
python -m uvicorn main:app --port 8000 --host 0.0.0.0
# Access at: http://localhost:8000
```

**Terminal 2: Civic Backend (Express)**
```bash
cd civic-viz-system/backend
node index.js
# Runs on: http://localhost:5000
```

**Terminal 3: 3D Dashboard (Vite)**
```bash
cd civic-viz-system/civic-frontend
npm run dev
# Access at: http://localhost:5173
```

---

## 📊 Demo Credentials
- **Admin Login**: `admin@mcd.gov.in` (OTP: any 4 digits)
- **Department Logins**:
  - Jal Board: `jal@delhi.gov.in` (Pwd: `admin`)
  - Power Dept: `power@delhi.gov.in` (Pwd: `admin`)
  - PWD: `pwd@delhi.gov.in` (Pwd: `admin`)

## 🛠️ Technologies
- **Frontend**: React, Three.js, React Three Fiber, Framer Motion, TailwindCSS.
- **Backend**: Node.js, Express, FastAPI.
- **Database**: SQLite (via better-sqlite3).
- **AI**: Google Gemini API.

---
Created with ❤️ by the India Innovates Team.
