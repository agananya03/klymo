# Klymo Chat 🚀

> **The Secure, Anonymous Connection Platform.**  
> No Logins. No Trace. Just Vibes.

Klymo is a modern, privacy-focused anonymous chat application operated entirely without user accounts. It uses device-based identity and AI verification to ensure a safe, bot-free environment while maintaining complete anonymity.

## ✨ Key Features

## 4. Core Features Implementation

### 4.1 Device Fingerprinting & Anonymity
We utilize a robust device fingerprinting mechanism to generate persistent, unique identities without collecting personal data (PII). This ensures users can be banned or rate-limited based on their device rather than an easily disposable email address, maintaining high anonymity while enforcing accountability.

### 4.2 Pseudonymous Profiles
Users are assigned pseudonymous profiles upon verification. These profiles are linked to their device fingerprint but contain no real-world identifiers. This allows for a sense of continuity and reputation within the platform without compromising privacy.

### 4.3 Camera-Only Gender Verification
To prevent catfishing and improved match quality, we implement a strict camera-only verification process.
-   **Real-time Analysis:** Images are processed instantly by our AI models (ViT).
-   **No Storage:** Verification images are processed in-memory and immediately discarded. They are never saved to a database or disk.
-   **Liveness:** The system is designed to reject pre-recorded videos or static uploads.

### 4.4 Intelligent Matching Engine
Our matching algorithm (Priority Queue based) pairs users based on:
-   **Gender Preference:** Strict filtering to ensuring requested matches.
-   **Queue Fairness:** FIFO (First-In-First-Out) ordering to minimize wait times.
-   **Karma/Trust Score:** (Future) Matching users with similar reputation scores.

### 4.5 Real-Time Chat System
Built on `Python-SocketIO` and `Next.js`, the chat system delivers:
-   **Low Latency:** <100ms message delivery.
-   **Bidirectional:** Full duplex communication for typing status and read receipts.
-   **Resilience:** Automatic reconnection and state recovery.

### 4.6 Ephemeral Chat Experience
Privacy is paramount.
-   **RAM-Only Handling:** Messages are relayed through memory (Redis).
-   **No Persistence:** Once a session ends, the chat transcript is permanently obliterated. No logs, no backups, no history.

## 5. Database Schema
Our PostgreSQL schema is designed for minimalism and performance:
-   **Users Table:** Stores Device Hash, Gender, Verification Status, and Ban Status.
-   **Sessions Table:** Tracks active connections for analytics (anonymized).
-   **Reports Table:** Logs abuse reports against device hashes for moderation.

## 6. Abuse Prevention System
A multi-layered defense system:
-   **AI Toxicity Filter:** Real-time scanning of messages for hate speech and harassment.
-   **Report System:** Users can report abusive behavior, triggering automated bans after a threshold is reached.
-   **Ban Enforcement:** Device-level bans prevent bad actors from simply creating a new account.

## 7. Fairness & Usage Limits
To ensure quality of service for all users:
-   **Verification Limits:** Cap on daily verification attempts to prevent API abuse.
-   **Match Cooldowns:** Brief cooldowns between matches to prevent "skipping" spam.
-   **Daily Caps:** Reasonable limits on daily usage to discourage bot activity.

---

## 🛠️ Technology Stack

**Frontend**
-   **Framework:** Next.js 14 (App Router)
-   **Styling:** Tailwind CSS (Custom Neobrutal Preset)
-   **State:** React Hooks & Context
-   **Deployment:** Vercel

**Backend**
-   **Framework:** FastAPI (Python)
-   **Real-time:** Python-SocketIO
-   **Database:** PostgreSQL (SQLAlchemy ORM)
-   **Cache/Queue:** Redis
-   **AI:** Hugging Face Inference API
-   **Deployment:** Railway (Dockerized)

---

## 🚀 Getting Started

### Prerequisites
-   Node.js 18+
-   Python 3.10+
-   Docker (optional, for local Redis/Postgres)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/agananya03/klymo.git
    cd klymo
    ```

2.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    # Create .env.local with NEXT_PUBLIC_API_URL
    npm run dev
    ```

3.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows
    pip install -r requirements.txt
    # Create .env with DATABASE_URL, REDIS_URL, HUGGINGFACE_API_KEY
    uvicorn app.main:app --reload
    ```

---

## 📸 Screen Previews

| Identity Check | Dashboard | Chat Interface |
|:---:|:---:|:---:|
| *AI Camera Verification* | *Polls & real-time stats* | *Secure anonymous messaging* |

---

Built with ❤️ by the **Klymo Team**.
