# Sell OWL - System Architecture

## Overview

Sell OWL follows a modern **three-tier architecture** separating presentation, business logic, and data storage for maintainability, scalability, and security.

## Architecture Diagram

```
┌────────────────────────┐
│   PRESENTATION LAYER    │
│   (React + Vite)       │
│                        │
│  - Components (UI)     │
│  - State Management    │
│  - Routing             │
│  - API Client          │
└─────────┬─────────────┘
          │
          │ REST API (HTTPS)
          │
┌─────────┴─────────────┐
│   APPLICATION LAYER    │
│   (Flask Backend)      │
│                        │
│  - API Routes          │
│  - Business Logic      │
│  - Authentication      │
│  - AI Services         │
└─────┬────────┬────────┘
      │        │
      │        │
┌─────┴─────┐  ┌─┴───────────┐
│  Firebase   │  │  PostgreSQL  │
│    Auth     │  │  (Supabase)  │
│            │  │             │
│  - Users    │  │  - Listings  │
│  - Tokens   │  │  - Products  │
│  - Verify   │  │  - Orders    │
└────────────┘  │  - Messages  │
                 │  - Subleases │
                 └─────────────┘
```

## Technology Stack

### Frontend Layer

#### Core Technologies
- **React 18** - Component-based UI library
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework

#### Supporting Libraries
- **React Router** - Client-side routing and navigation
- **Axios** - HTTP client for API requests
- **Firebase SDK** - Client-side authentication

#### Development Tools
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Vite Dev Server** - Hot module replacement (HMR)

### Backend Layer

#### Core Technologies
- **Python 3.12+** - Programming language
- **Flask** - Lightweight web framework
- **Flask-CORS** - Cross-Origin Resource Sharing

#### Supporting Libraries
- **psycopg2** - PostgreSQL database adapter
- **Firebase Admin SDK** - Token verification
- **python-dotenv** - Environment variable management

#### Future Integrations
- **OpenAI API** - AI listing generation and chatbot
- **Google Maps API** - Location services for subleases
- **AWS S3 / Cloudinary** - Image and video storage

### Data Layer

#### Database
- **PostgreSQL 15+** - Relational database
- **Supabase** - Managed PostgreSQL hosting

#### Authentication
- **Firebase Authentication** - User management and verification
- **Email/Password Provider** - .edu email authentication

## Component Architecture

### Frontend Structure

```
src/
├── components/
│   ├── auth/              # Authentication components
│   │   ├── LoginPage.jsx
│   │   └── SignupPage.jsx
│   ├── marketplace/       # Marketplace features
│   │   ├── Feed.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductDetail.jsx
│   │   └── Checkout.jsx
│   ├── sublease/          # Sublease features
│   ├── messaging/         # Messaging features
│   ├── profile/           # User profiles
│   └── shared/            # Shared components
├── lib/                   # Utilities
│   ├── firebase.js       # Firebase configuration
│   ├── api.js            # API client
│   └── utils.js          # Helper functions
├── hooks/                 # Custom React hooks
├── context/               # React context providers
├── data/                  # Mock data
└── assets/                # Static assets
```

### Backend Structure

```
backend/
├── api/                   # API routes
│   ├── auth.py           # Authentication endpoints
│   ├── marketplace.py    # Marketplace endpoints
│   ├── sublease.py       # Sublease endpoints
│   ├── messages.py       # Messaging endpoints
│   └── ai.py             # AI feature endpoints
├── models/                # Database models
│   ├── user.py
│   ├── product.py
│   ├── listing.py
│   ├── order.py
│   ├── sublease.py
│   └── message.py
├── services/              # Business logic
│   ├── auth_service.py
│   ├── marketplace_service.py
│   ├── sublease_service.py
│   ├── ai_service.py
│   └── notification_service.py
├── utils/                 # Utilities
│   ├── validators.py
│   ├── helpers.py
│   └── constants.py
├── app.py                 # Main application
├── config.py              # Configuration
├── db.py                  # Database connection
└── firebase_auth.py       # Firebase auth handler
```

## Data Flow

### Authentication Flow

```
1. User enters credentials in React frontend
   ↓
2. Frontend calls Firebase Authentication SDK
   ↓
3. Firebase verifies credentials and returns ID token
   ↓
4. Frontend stores token and includes in API requests
   ↓
5. Backend receives request with Authorization header
   ↓
6. Backend verifies token with Firebase Admin SDK
   ↓
7. If valid, backend checks/creates user in PostgreSQL
   ↓
8. Backend returns user profile data
   ↓
9. Frontend updates UI with authenticated state
```

### Marketplace Listing Flow

```
1. User uploads product images in React
   ↓
2. Frontend sends images to backend API
   ↓
3. Backend uploads images to cloud storage (future)
   ↓
4. Backend calls AI service for auto-generation (future)
   ↓
5. Backend creates listing + products in PostgreSQL
   ↓
6. Backend returns listing ID and details
   ↓
7. Frontend displays success and redirects to listing
```

### Order Request Flow

```
1. Buyer selects products and clicks "Place Order Request"
   ↓
2. Frontend sends order request to backend API
   ↓
3. Backend creates order record with status="pending"
   ↓
4. Backend sets expiration time (current_time + 3 days)
   ↓
5. Backend sends notification to seller (future)
   ↓
6. Backend returns order confirmation
   ↓
7. Frontend shows success message
   ↓
8. Seller reviews order in "Offers" section
   ↓
9. Seller accepts/declines order
   ↓
10. Backend updates order status
    ↓
11. If partial accept, backend creates new listing
    ↓
12. Backend notifies buyer and other interested buyers
    ↓
13. Buyer and seller coordinate via messaging
```

## Security Architecture

### Authentication Security

1. **Firebase ID Tokens**
   - Short-lived (1 hour expiration)
   - Cryptographically signed by Firebase
   - Verified on every backend request

2. **Email Verification**
   - Required before platform access
   - .edu domain validation
   - Prevents fake accounts

3. **Backend Token Verification**
   ```python
   # Every protected route verifies token
   @app.route('/api/protected')
   def protected_route():
       token = request.headers.get('Authorization')
       user = verify_firebase_token(token)
       if not user:
           return {"error": "Unauthorized"}, 401
       # Process request
   ```

### Data Security

1. **SQL Injection Prevention**
   - Parameterized queries with psycopg2
   - Never concatenate user input in SQL

2. **XSS Protection**
   - Input sanitization on backend
   - React automatically escapes JSX
   - Content Security Policy headers

3. **Privacy Controls**
   - Exact addresses hidden until confirmation
   - Email addresses not publicly visible
   - User data encrypted at rest (PostgreSQL)

4. **Rate Limiting** (Future)
   - API request throttling
   - Prevents abuse and DoS attacks

## Scalability Considerations

### Current MVP Architecture

- **Users:** Up to 1,000 concurrent users
- **Database:** Supabase free tier (500MB, 2GB bandwidth)
- **Backend:** Single Flask instance
- **Frontend:** Static hosting (Vercel/Netlify)

### Future Scaling Strategy

#### Phase 1: Vertical Scaling
- Upgrade Supabase plan
- Increase backend server resources
- Add database indexes
- Implement caching (Redis)

#### Phase 2: Horizontal Scaling
- Load balancer for backend
- Multiple Flask instances
- Database read replicas
- CDN for static assets

#### Phase 3: Microservices
- Separate services for:
  - Authentication
  - Marketplace
  - Sublease
  - Messaging
  - AI features
- Message queue (RabbitMQ/Kafka)
- Service mesh (Istio)

## Deployment Architecture

### Development Environment

```
Local Machine
├── Frontend: localhost:5173 (Vite dev server)
├── Backend: localhost:5000 (Flask development server)
└── Database: Supabase cloud PostgreSQL
```

### Production Environment (Planned)

```
Cloud Infrastructure
├── Frontend: Vercel/Netlify (Static hosting + CDN)
├── Backend: AWS/GCP/Azure (Container service)
├── Database: Supabase production tier
├── File Storage: AWS S3 / Cloudinary
└── Authentication: Firebase (production project)
```

## API Design Principles

### RESTful Conventions

- **GET** - Retrieve resources
- **POST** - Create new resources
- **PUT/PATCH** - Update existing resources
- **DELETE** - Remove resources

### Response Format

```json
// Success response
{
  "data": { /* resource data */ },
  "message": "Operation successful"
}

// Error response
{
  "error": "Error message",
  "details": "Additional context",
  "code": "ERROR_CODE"
}
```

### Status Codes

- **200 OK** - Successful GET/PUT/PATCH
- **201 Created** - Successful POST
- **204 No Content** - Successful DELETE
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **500 Internal Server Error** - Server error

## Database Design Principles

### Normalization

- **Third Normal Form (3NF)** for most tables
- Minimize data redundancy
- Ensure data integrity

### Indexes

- Primary keys (automatic)
- Foreign keys for relationships
- Frequently queried columns (user_id, university, status)
- Geographic indexes for location-based queries (future)

### Constraints

- NOT NULL for required fields
- UNIQUE for email addresses
- CHECK constraints for data validation
- Foreign key constraints for referential integrity

## Monitoring and Observability (Future)

### Logging

- Application logs (Flask)
- Database query logs
- Error tracking (Sentry)
- User activity logs

### Metrics

- Request rate and latency
- Error rates
- Database query performance
- User engagement metrics

### Alerting

- Server downtime alerts
- Error rate thresholds
- Database performance issues
- Security incidents

## Technology Choices - Rationale

### Why React?

- Component-based architecture for reusability
- Large ecosystem and community support
- Excellent developer experience
- Easy to learn for team members

### Why Flask?

- Lightweight and flexible
- Python ecosystem (future AI integration)
- Easy to get started
- Good documentation

### Why PostgreSQL?

- Robust relational database
- ACID compliance
- Complex query support
- Scalable and reliable

### Why Firebase Auth?

- Handles authentication complexity
- Email verification built-in
- Secure token management
- Free tier sufficient for MVP

### Why Supabase?

- Managed PostgreSQL hosting
- Free tier for development
- Built-in features (future use)
- Easy to scale

## Next Steps

To understand how to use the system:

1. Review [API Documentation](API.md)
2. Check [Database Schema](DATABASE_SCHEMA.md)
3. See [Workflow Documentation](WORKFLOW.md)
4. Read [Deployment Guide](DEPLOYMENT.md)
