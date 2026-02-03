# Klymo - Anonymous Video Chat Platform

Klymo is a secure, anonymous video chat application built with a focus on privacy, fairness, and a distinct Neobrutal design identity.

## 🚀 Key Features

### 🔒 Privacy & Security
- **Ephemeral Messaging**: Chats are relayed via WebSocket and never stored on a server. History exists only in your browser session.
- **Anonymous Identity**: Device-based authentication using `FingerprintJS`. No emails or passwords required.
- **Strict Verification**: AI-powered gender verification (Hugging Face) ensures accurate matching filters (90% confidence required). Images are processed in-memory and discarded immediately.

### 🛡️ Abuse Prevention
- **Cooldown System**: 5-minute cooldown between matches to prevent spam.
- **Daily Limits**: Users are limited to 5 filtered matches per day (resets at midnight). "Any" matching is always free/unlimited.
- **Ban System**: Automated blocking of banned device fingerprints.
- **Reporting**: Integrated reporting system for harassment or inappropriate behavior.

### 🎨 Neobrutal Design (UI/UX)
- High-contrast, bold aesthetics with hard shadows and thick borders.
- Interactive, responsive components using Tailwind CSS.
- Mobile-first approach.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + Context API
- **Real-time**: Socket.IO Client

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (SQLAlchemy ORM)
- **Caching/Queues**: Redis
- **AI Integration**: Hugging Face API (Gender Detection)
- **Real-time**: Python-SocketIO

## 🏗️ Project Structure
- `frontend/`: Next.js application
    - `src/components/`: Reusable UI components (Toast, Card, Button)
    - `src/app/`: App Router pages and layouts
- `backend/`: FastAPI application
    - `app/api/`: REST API Endpoints
    - `app/websocket/`: Socket.IO Event Handlers
    - `app/services/`: Core logic (Matching, Verification)
    - `app/models/`: Database Models

## 🏃‍♂️ Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.10+ (for local backend dev)

### Quick Start (Docker)
Run the entire stack with one command:
```bash
docker-compose up --build
```
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Valid User Flows**:
    1. **Verification**: Upload a selfie to verify gender.
    2. **Profile**: Set a nickname (optional).
    3. **Dashboard**: Access matching queues.
    4. **Matching**: Select preference -> Join Queue -> Chat.

## 📄 License
This project is for educational purposes.

