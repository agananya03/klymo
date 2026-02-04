# Klymo Chat 🚀

> **The Secure, Anonymous Connection Platform.**  
> No Logins. No Trace. Just Vibes.

Klymo is a modern, privacy-focused anonymous chat application operated entirely without user accounts. It uses device-based identity and AI verification to ensure a safe, bot-free environment while maintaining complete anonymity.

## ✨ Key Features

### 🔒 Core Security & Privacy
-   **No Sign-up Required:** friction-less entry using unique Device IDs generated locally.
-   **Anonymous Identity:** Users are identified by their device, not their email or phone number.
-   **Ephemeral Data:** Chat history and verification images are not permanently stored.

### 🤖 AI-Powered Safety
-   **Gender Verification System:** Prevents catfishing using AI-based real-time camera verification.
-   **Toxicity Detection:** (In Progress) Automated filtering of harmful content.
-   **Anti-Spam Rate Limiting:** Redis-backed rate limits for matching, reporting, and verification attempts to prevent abuse.

### 🎨 Neobrutalist UI/UX
-   **Distinctive Design:** High-contrast, bold borders, and vibrant "Neobrutalism" aesthetic.
-   **Responsive Layout:** optimized for both desktop and mobile experiences.
-   **Interactive Dashboard:**
    -   **Daily Poll:** Community engagement feature.
    -   **Mood Check:** Daily vibe tracking.
    -   **Live User Count:** Real-time visibility of online users.

### 💬 Real-Time Experience
-   **Instant Matching:** Intelligent queue system to pair users based on gender preference.
-   **WebSocket Chat:** Low-latency, bidirectional real-time messaging.
-   **Typing Indicators & Read Receipts:** Modern chat features.

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
