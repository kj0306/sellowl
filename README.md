# SELL OWL

A platform where students can sell used items and buy — textbooks, furniture, electronics, and more. Simple, safe, and built for campus life.

## Features

- 🔐 **Firebase Authentication** - Secure student-only access
- ✅ **Email Verification** - Only verified @wisc.edu emails allowed
- 📊 **PostgreSQL Database** - User profiles stored in Supabase
- 🎨 **Modern UI** - Clean, responsive design

## Setup

### Prerequisites

- Python 3.12+
- PostgreSQL database (Supabase free tier recommended)
- Firebase project with Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kj0306/sellowl.git
   cd sellowl
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   - `SECRET_KEY` - Flask secret key (generate a random string)
   - `DATABASE_URL` - PostgreSQL connection string from Supabase
   - Firebase credentials (see Firebase setup below)

4. **Initialize the database**
   ```bash
   python -c "from db import init_db; init_db()"
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password authentication
3. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" and add a web app
   - Copy the Firebase config object
4. For backend (Firebase Admin SDK):
   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Download the JSON file or use environment variables

### Update Firebase Config in Login Page

Edit `templates/login.html` and replace the Firebase config:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    // ... rest of config
};
```

## Database Setup (Supabase)

1. Create a free account at [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Project Settings > Database
4. Copy the connection string (URI format)
5. Add it to your `.env` as `DATABASE_URL`

The `users` table will be created automatically on first run.

## Deployment (Render)

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard:
   - `SECRET_KEY`
   - `DATABASE_URL`
   - Firebase credentials (as environment variables)
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn app:app`
5. Deploy!

## Project Structure

```
sellowl/
├── app.py              # Flask application
├── config.py           # Configuration
├── db.py               # Database setup
├── firebase_auth.py    # Firebase authentication
├── requirements.txt    # Python dependencies
├── Dockerfile          # Docker configuration
├── templates/
│   ├── index.html      # Homepage
│   ├── login.html      # Login page
│   └── dashboard.html  # Student dashboard
└── README.md
```

## License

MIT
