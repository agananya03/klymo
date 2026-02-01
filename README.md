# Klymo Project

This project consists of a Next.js 14 frontend and a FastAPI backend.

## Structure

- `frontend/`: Next.js 14 application (TypeScript, Tailwind CSS)
- `backend/`: FastAPI application

## Getting Started

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   The API will be available at http://localhost:8000.
   Docs: http://localhost:8000/docs

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:3000.
