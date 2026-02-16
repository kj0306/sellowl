# Sell OWL 🦉

**Student Marketplace & Sublease Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange.svg)](https://firebase.google.com/)

> **A trusted, student-exclusive marketplace for buying/selling products and finding short-term housing during relocations.**

## 🎯 Problem We're Solving

Students waste usable furniture and struggle to resell during move-outs. Incoming students overpay for essentials and short-term housing. Current platforms are:

- ❌ **Fragmented** (WhatsApp groups, Facebook, Craigslist)
- ❌ **Unverified** (prone to scams, fake listings)
- ❌ **Not student-focused** (generic marketplaces)
- ❌ **Time-consuming** (manual relisting, poor communication)

## ✨ Solution: Sell OWL

### Core Features

#### 🎓 **Student-Only Authentication**
- Verified university email (.edu) required
- Email verification before platform access
- Trust foundation for scam-free transactions

#### 🛒 **Smart Marketplace**
- Create listings with multiple products at once
- Instagram-style feed with advanced filtering
- Order request system (not instant purchase)
- **Automatic relisting** of unsold items after partial sales
- AI auto-listing generation from photos (coming soon)
- AI price suggestions (coming soon)
- In-person payment only (MVP)

#### 🏠 **Sublease Module**
- Short-term housing for internships, study abroad, co-ops
- Approximate location (exact address hidden initially)
- Document verification system (rental agreements, payment proof)
- Map view with privacy protection
- "Verified Post" badges

#### 💬 **In-App Messaging**
- Secure communication between buyers/sellers
- Conversation history maintained
- Coordinate pickups and negotiate terms

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.12+ ([Download](https://www.python.org/))
- **PostgreSQL** via [Supabase](https://supabase.com/) (free tier)
- **Firebase** project with Email/Password auth ([Console](https://console.firebase.google.com/))

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/kj0306/sellowl.git
cd sellowl
```

#### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials (see below)
pip install -r requirements.txt
python app.py
```

**Backend runs on:** `http://localhost:5000`

#### 3. Frontend Setup

```bash
# From project root
npm install
npm run dev
```

**Frontend runs on:** `http://localhost:5173`

#### 4. Run Both Together

```bash
npm run dev:all
```

Runs frontend and backend concurrently in one terminal.

### Environment Variables

#### Backend `.env`

```env
# Flask
FLASK_SECRET_KEY=your-random-secret-key-here
FLASK_ENV=development

# Database (Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/database

# Firebase (choose one method)
# Method 1: Full JSON as string
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# Method 2: Path to JSON file
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
```

#### Frontend (if needed - optional)

Create `.env` in root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## 📚 Documentation

### Complete Guides

- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Problem statement, solution features, competitive analysis
- **[Architecture](docs/ARCHITECTURE.md)** - System design, technology stack, data flow
- **[Workflows](docs/WORKFLOW.md)** - Complete user journeys for all features
- **[API Documentation](docs/API.md)** - Endpoint reference with examples
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Table structures and relationships
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

### Quick Links

- [Setup Instructions](#installation)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## 💻 Project Structure

```
sellowl/
├── docs/                    # Documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── WORKFLOW.md
│   ├── API.md
│   ├── DATABASE_SCHEMA.md
│   └── DEPLOYMENT.md
├── backend/                # Flask REST API
│   ├── api/                # API routes (organized by feature)
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   ├── app.py              # Main Flask app
│   ├── config.py           # Configuration
│   ├── db.py               # Database connection
│   ├── firebase_auth.py    # Firebase auth handler
│   ├── requirements.txt
│   └── Dockerfile
├── src/                    # React Frontend
│   ├── components/         # React components
│   │   ├── auth/           # Login, Signup
│   │   ├── marketplace/    # Feed, Products, Checkout
│   │   ├── sublease/       # Sublease listings
│   │   ├── messaging/      # Messages, ChatThread
│   │   ├── profile/        # User profiles
│   │   └── shared/         # Shared components
│   ├── lib/                # Firebase, API client, utilities
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React context providers
│   ├── data/               # Mock data (development)
│   ├── assets/             # Images, icons
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── tests/                  # Test files
├── package.json
├── vite.config.js
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Firebase SDK** - Authentication

### Backend
- **Python 3.12** - Language
- **Flask** - Web framework
- **psycopg2** - PostgreSQL adapter
- **Firebase Admin SDK** - Token verification

### Database & Auth
- **PostgreSQL** - Database (via Supabase)
- **Firebase Authentication** - User management

### Future Integrations
- **OpenAI API** - AI listing generation, chatbot
- **AWS S3 / Cloudinary** - Image/video storage
- **Google Maps API** - Location services

## 🚦 Development Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Student authentication (.edu email)
- [x] Basic marketplace listing and browsing
- [x] Order request system
- [x] In-app messaging
- [x] Simple sublease listings
- [ ] Manual listing creation (in progress)

### 🔄 Phase 2: AI Integration (Q2 2026)
- [ ] AI-powered listing generation from photos
- [ ] AI price suggestion engine
- [ ] AI chatbot assistant for buyers
- [ ] Image recognition for product categorization

### 📊 Phase 3: Enhanced Features (Q3 2026)
- [ ] Advanced filtering and search
- [ ] Map-based sublease browsing
- [ ] Document verification for subleases
- [ ] Rating and review system
- [ ] Push notifications
- [ ] Mobile app development (React Native)

### 🚀 Phase 4: Scaling (Q4 2026)
- [ ] Payment integration options
- [ ] Advanced analytics dashboard
- [ ] Multi-university expansion
- [ ] Performance optimization
- [ ] Admin dashboard
- [ ] Security enhancements

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Quick Contribution Steps

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style (ESLint for frontend, PEP 8 for backend)
- Write tests for new features
- Update documentation for API changes
- Keep commits atomic and descriptive

## 🐛 Issues and Support

- **Bug Reports**: [Open an issue](https://github.com/kj0306/sellowl/issues/new?template=bug_report.md)
- **Feature Requests**: [Request a feature](https://github.com/kj0306/sellowl/issues/new?template=feature_request.md)
- **Questions**: [Discussions](https://github.com/kj0306/sellowl/discussions)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: [@kj0306](https://github.com/kj0306)
- **University**: University of Wisconsin-Madison

## 🌟 Acknowledgments

- Thanks to the UW-Madison student community for feedback and inspiration
- Inspired by the need for a better student marketplace experience

## 📧 Contact

For questions or collaboration:

- **GitHub**: [@kj0306](https://github.com/kj0306)
- **Project Link**: [https://github.com/kj0306/sellowl](https://github.com/kj0306/sellowl)

---

**Made with ❤️ by students, for students**

---

## 📖 Additional Resources

- [API Endpoint Documentation](docs/API.md)
- [Database Schema Diagram](docs/DATABASE_SCHEMA.md)
- [User Journey Workflows](docs/WORKFLOW.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
