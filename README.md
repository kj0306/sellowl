# Sell OWL

Student marketplace for products and subleases. React + Vite + Tailwind frontend with Flask + Firebase + PostgreSQL backend.

## Features

- **Firebase Authentication** – .edu email only, email verification required
- **PostgreSQL (Supabase)** – User profiles stored in database
- **Modern UI** – Feed, profiles, messages, bag, checkout, chatbot

## Setup

### Prerequisites

- Node.js 18+
- Python 3.12+
- PostgreSQL (Supabase free tier recommended)
- Firebase project with Email/Password auth

### Backend

1. `cd backend`
2. `cp .env.example .env`
3. Edit `.env` with:
   - `FLASK_SECRET_KEY` – random string
   - `DATABASE_URL` – Supabase connection string
   - `FIREBASE_SERVICE_ACCOUNT_JSON` – full Firebase service account JSON (or use `FIREBASE_CREDENTIALS_PATH` to a JSON file)
4. `pip install -r requirements.txt`
5. `python app.py` (runs on port 5000)

### Frontend

1. `npm install`
2. `npm run dev` (runs on port 5173, proxies `/api` to backend)

### Run Both

```bash
npm run dev:all
```

Runs frontend and backend together.

## Project Structure

```
sell_owl/
├── backend/           # Flask API (auth)
│   ├── app.py
│   ├── config.py
│   ├── db.py
│   └── firebase_auth.py
├── src/
│   ├── components/    # React UI
│   ├── lib/           # Firebase, API client
│   └── data/          # Dummy data (marketplace)
└── public/
    └── Logos/
```
