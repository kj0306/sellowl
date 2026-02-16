# Sell OWL — Project Overview

**Version:** 1.0.0  
**Last Updated:** February 15, 2026

## What is Sell OWL?

Sell OWL is a student-exclusive marketplace platform designed to solve the inefficiencies in student reselling and subleasing. The platform creates a trusted ecosystem where students can buy and sell furniture, essentials, and sublease accommodations during temporary relocations.

### Key Statistics

- **Target Users:** University students (.edu email verified)
- **Primary Use Cases:** Graduation move-outs, internships, study abroad, semester relocations
- **Platform Type:** Web application with mobile-responsive design
- **Payment Method:** In-person peer-to-peer transactions (MVP)

## Problem Statement

### Student Move-Out Challenges

Students frequently relocate due to:
- Graduation
- Short-term internships and co-op programs
- Study abroad and exchange programs
- Temporary academic or personal relocations

These relocations may be permanent or last only one semester.

### Current Pain Points

#### 1. Time Constraints

During move-out, students have **very limited time** to:
- Sell furniture and essential items
- Find trustworthy buyers
- Coordinate pickups and negotiations

**Result:** Many usable items are discarded despite being in good condition.

#### 2. Fragmented Platforms

There is **no fast, student-focused resale platform**. Students must rely on:
- WhatsApp groups
- Facebook Marketplace
- Informal community posts

These channels are **fragmented, inefficient, and hard to manage**.

#### 3. Short-Term Housing Difficulties

Students seeking temporary accommodation face:
- Difficulty finding reliable sublease listings
- Lack of platforms designed for temporary stays
- Poor verification of listings and landlords

#### 4. Scam Vulnerability

Common issues include:
- Fake listings
- Misleading photos and pricing
- Unresponsive or fraudulent sellers/lessors
- No accountability or trust mechanism

**International students** are at higher risk because:
- Unfamiliar with local neighborhoods and pricing norms
- Lack reliable guidance on safe housing areas
- Many apartment websites and listings are overpriced or misleading

### The Current Ecosystem Problem

The existing environment for student resale and subleasing is:
- ❌ Fragmented across multiple platforms
- ❌ Unverified and prone to scams
- ❌ Time-consuming and stressful
- ❌ Not built specifically for student needs

## Our Solution

Sell OWL addresses these problems through:

### 🎓 Feature 0: Student-Only Authentication

**Trust Foundation**

- Verified university email (.edu or institution domain) required
- Email verification before platform access
- User profiles tagged with university and student status
- No anonymous access
- Base layer for trust, scam reduction, and accountability

### 🛒 Feature 1: Marketplace (Products)

**For Sellers:**
- Create single listing with multiple products
- AI auto-generates listing from photos/videos
- AI suggests pricing based on market data
- Accept/reject buyer order requests
- Choose preferred buyer among multiple requests
- Automatic relisting of remaining unsold items

**For Buyers:**
- Instagram-style feed interface
- Advanced filtering (location, price, category, condition)
- Add products to cart (all or selective)
- Place order requests (not instant orders)
- In-app messaging with sellers
- Payment in-person only (MVP)

**Smart Order Flow:**
- Buyers place order requests
- Sellers have 3 days to accept/decline
- Partial orders automatically create new listing with remaining items
- Previous interested buyers notified of updated availability

### 🏠 Feature 2: Subleasing Module

**For Property Owners:**
- Post sublease listings with approximate location
- Upload verification documents (rental agreement, payment proof, walkthrough video)
- Verified listings get "Verified Post" badge
- In-app messaging with potential subtenants
- Confirmation system when both parties agree

**For Sublease Seekers:**
- Filter by verification status, documentation, price, dates
- Map view showing general area (exact address hidden initially)
- View verification status and documents
- Message property owners
- Confirmed arrangements unlock exact address

**Platform Disclaimer:** Facilitates discovery, not legal enforcement. Users responsible for legal agreements.

### 🤖 Feature 3: AI Chat Assistant (Optional)

**Buyer Support Throughout Platform:**
- Answer questions about buying/subleasing processes
- Explain safety guidelines and verification badges
- Help choose between listings
- Understand pricing norms
- Navigate platform features
- Context-aware responses based on current page and user role

## Key Differentiators

### 1. Student-Exclusive Ecosystem
- Only verified students can access platform
- University-specific communities
- Builds trust through shared identity

### 2. Smart Listing Management
- Automatic relisting of unsold items
- Buyer notification optimization
- Saves time during stressful move-out periods

### 3. AI-Powered Convenience
- Auto-generate listings from photos
- Market-based price suggestions
- 24/7 chatbot assistance

### 4. Verification System
- Document verification for subleases
- Visual badges for verified posts
- Reduces scam risk significantly

### 5. Privacy-First Approach
- Approximate locations until confirmation
- Email addresses not publicly visible
- Controlled information disclosure

## Target Users

### Primary Users

**Outgoing Students:**
- Graduating seniors
- Students going on internships/co-ops
- Study abroad participants
- Students relocating between semesters

**Incoming Students:**
- New freshmen
- Transfer students
- International students
- Students returning from study abroad

### User Needs by Segment

| User Segment | Primary Need | Secondary Need |
|--------------|--------------|----------------|
| Graduating Seniors | Quick furniture sale | Reliable buyers |
| Internship Students | Short-term sublease income | Fast transactions |
| Incoming Students | Affordable furniture | Trusted sellers |
| International Students | Short-term housing | Safe neighborhoods |
| Local Students | Furniture for apartment | Budget-friendly options |

## Success Metrics

### Phase 1 (MVP) Targets
- 500+ registered users from UW-Madison
- 100+ active listings
- 50+ successful transactions
- <5% reported scam attempts
- 80%+ email verification rate

### Long-Term Goals
- Expand to 10+ universities
- 10,000+ active users
- 1,000+ monthly transactions
- <1% scam rate
- 4.5+ star average rating

## Competitive Analysis

### Existing Solutions

| Platform | Pros | Cons |
|----------|------|------|
| Facebook Marketplace | Large user base | Not student-focused, prone to scams |
| Craigslist | Wide reach | Outdated UI, high scam risk |
| WhatsApp Groups | Direct communication | Unorganized, no accountability |
| University Forums | Campus-specific | Fragmented, poor UX |

### Sell OWL Advantages

✅ **Student-only verification** - Facebook/Craigslist open to anyone  
✅ **Smart listing management** - No competitor offers automatic relisting  
✅ **AI-powered features** - Unique to our platform  
✅ **Sublease verification** - More robust than existing platforms  
✅ **Modern UX** - Instagram-style feed vs outdated interfaces  

## Roadmap Overview

### Phase 1: MVP (Current) - Q1 2026
- Student authentication
- Basic marketplace
- Order request system
- In-app messaging
- Simple sublease listings

### Phase 2: AI Integration - Q2 2026
- AI listing generation
- AI price suggestions
- Chatbot assistant
- Image recognition

### Phase 3: Enhanced Features - Q3 2026
- Advanced filtering
- Map-based browsing
- Document verification
- Rating system
- Push notifications

### Phase 4: Scaling - Q4 2026
- Payment integration
- Multi-university expansion
- Mobile apps
- Analytics dashboard
- Admin tools

## Getting Started

Ready to contribute or run the project locally?

1. Read the [Setup Instructions](../README.md#setup)
2. Review the [Architecture Documentation](ARCHITECTURE.md)
3. Check the [API Documentation](API.md)
4. See [Contributing Guidelines](../CONTRIBUTING.md)

## Questions?

- Check the [FAQ section](../README.md#faq)
- Open an [issue on GitHub](https://github.com/kj0306/sellowl/issues)
- Review existing documentation in `/docs`
