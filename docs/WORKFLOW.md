# Sell OWL - User Workflows

This document outlines the complete user journeys for all major features of the Sell OWL platform.

## Table of Contents

1. [User Registration Flow](#user-registration-flow)
2. [User Login Flow](#user-login-flow)
3. [Marketplace Buying Flow](#marketplace-buying-flow)
4. [Marketplace Selling Flow](#marketplace-selling-flow)
5. [Sublease Searching Flow](#sublease-searching-flow)
6. [Sublease Posting Flow](#sublease-posting-flow)
7. [Messaging Flow](#messaging-flow)
8. [Order Management Flow](#order-management-flow)

---

## User Registration Flow

### Goal
New student creates an account with verified university email.

### Prerequisites
- User has valid .edu email address
- User has access to email inbox for verification

### Steps

1. **Landing Page**
   - User visits Sell OWL homepage
   - Clicks "Sign Up" button

2. **Sign Up Form**
   - User enters:
     - Full name
     - University email (.edu address)
     - Password (min 8 characters)
     - University name (dropdown)
   - System validates:
     - Email format (.edu domain)
     - Password strength
     - All required fields completed

3. **Firebase Registration**
   - Frontend calls Firebase Authentication
   - Firebase creates user account
   - Firebase sends verification email

4. **Email Verification**
   - User receives email with verification link
   - User clicks link in email
   - Firebase marks email as verified

5. **Profile Creation**
   - Backend receives Firebase webhook (or login trigger)
   - Backend creates user profile in PostgreSQL
   - Stores:
     - Firebase UID
     - Email
     - Full name
     - University
     - Created timestamp

6. **Redirect to Platform**
   - User redirected to login page
   - Success message: "Account created! Please log in."

### Error Handling

- **Email already exists**: "This email is already registered. Please log in."
- **Invalid .edu email**: "Please use a valid university email address (.edu)"
- **Weak password**: "Password must be at least 8 characters with letters and numbers"
- **Verification timeout**: User can resend verification email

---

## User Login Flow

### Goal
Existing user authenticates and accesses platform.

### Prerequisites
- User has registered account
- Email is verified

### Steps

1. **Login Page**
   - User navigates to login page
   - Enters email and password

2. **Firebase Authentication**
   - Frontend calls Firebase Authentication
   - Firebase verifies credentials
   - Firebase returns ID token

3. **Email Verification Check**
   - Frontend checks `emailVerified` status
   - If not verified:
     - Show message: "Please verify your email"
     - Provide "Resend verification email" button
     - Block platform access

4. **Backend Token Verification**
   - Frontend sends token to backend `/api/auth/verify-token`
   - Backend verifies token with Firebase Admin SDK
   - Backend retrieves user profile from PostgreSQL

5. **Session Management**
   - Frontend stores token in memory (not localStorage for security)
   - Frontend stores user profile in React state/context
   - Token auto-refreshes before expiration (Firebase SDK handles)

6. **Redirect to Feed**
   - User redirected to marketplace feed
   - Navigation bar shows user profile

### Error Handling

- **Invalid credentials**: "Incorrect email or password"
- **Unverified email**: "Please verify your email before logging in"
- **Account disabled**: "Your account has been disabled. Contact support."
- **Token expired**: Automatic refresh or prompt to re-login

---

## Marketplace Buying Flow

### Goal
Buyer finds products, places order request, and coordinates pickup.

### Prerequisites
- User is logged in
- Email is verified

### Steps

#### 1. Browse Feed

- **Feed Display**
  - Default: Show all recent listings
  - Instagram-style grid of listing cards
  - Each card shows:
    - First product image
    - Number of products in listing
    - Price range
    - Seller name
    - University
    - Time posted

#### 2. Apply Filters

- **Filter Panel**
  - Type: Products Zone / Sublease Zone
  - University: Dropdown or multi-select
  - Location: Enter location + radius
  - Price Range: Min and max sliders
  - Category: Furniture, Electronics, Books, etc.
  - Condition: New, Like-New, Good, Fair
  - Availability: Available now, Upcoming

- **Filter Application**
  - Frontend sends filter parameters to backend API
  - Backend queries PostgreSQL with WHERE clauses
  - Results update in real-time

#### 3. View Listing Details

- **Select Listing Card**
  - User clicks on listing card
  - Navigate to seller's profile page

- **Seller Profile View**
  - Instagram-style product grid
  - Each product thumbnail clickable
  - Seller info:
    - Name
    - University
    - Member since
    - Number of listings

#### 4. View Product Details

- **Product Detail Modal/Page**
  - Large image gallery
  - Product information:
    - Title
    - Description
    - Price
    - Category
    - Condition
  - "Add to Cart" button
  - "Message Seller" button

#### 5. Add to Cart

- **Cart Management**
  - User clicks "Add to Cart"
  - Product added to cart (React state)
  - User can:
    - Add more products from same listing
    - Add all products with "Add All" button
    - View cart icon with item count

#### 6. Review Cart

- **Cart Page**
  - List of selected products
  - Each product shows:
    - Image thumbnail
    - Title
    - Price
    - Seller name
  - Total price calculation
  - "Remove" button for each item
  - "Place Order Request" button

#### 7. Place Order Request

- **Order Request Form**
  - Optional message to seller
  - Confirm products and total
  - "Submit Request" button

- **Backend Processing**
  - Create order record in `orders` table
  - Set status = "pending"
  - Set expiration = current_time + 3 days
  - Link to buyer, seller, listing, products

- **Confirmation**
  - Success message: "Order request sent!"
  - "View My Requests" link
  - Clear cart

#### 8. Seller Review Period

- **Wait for Seller**
  - Seller has 3 days to respond
  - Buyer can view request status in "My Orders"
  - Status: "Pending Seller Response"

#### 9. Seller Accepts Order

- **Notification**
  - Buyer receives in-app notification (future: email/SMS)
  - Order status updated to "accepted"

- **Coordinate Pickup**
  - "Message Seller" button available
  - Navigate to messaging thread
  - Discuss:
    - Pickup time and location
    - Payment method (cash/Venmo/etc.)
    - Any questions about products

#### 10. Complete Transaction

- **Offline Transaction**
  - Buyer and seller meet in person
  - Buyer inspects products
  - Buyer pays seller
  - Seller transfers products

- **Mark Complete (Optional - Future)**
  - Buyer marks order as "completed"
  - Seller confirms completion
  - Both can leave reviews

### Alternative Flows

#### Seller Declines Order

- Buyer receives notification
- Order status updated to "declined"
- Buyer can:
  - Browse other listings
  - Place request for different products

#### Seller Accepts Partial Order

- **Automatic Relisting**
  - Backend creates new listing with remaining unsold products
  - New listing ID generated
  - Original listing status updated

- **Buyer Notification**
  - Original buyer's order status: "partially accepted"
  - Other interested buyers receive notification:
    - "Products you were interested in are now available!"
    - Link to new listing

#### Order Expires

- **After 3 Days**
  - If seller hasn't responded
  - Order status automatically updated to "expired"
  - Buyer receives notification
  - Products remain available for other buyers

---

## Marketplace Selling Flow

### Goal
Seller lists products, manages order requests, and completes sales.

### Prerequisites
- User is logged in
- Email is verified

### Steps

#### 1. Create Listing

- **Navigate to "Sell" Section**
  - Click "Create Listing" button in navigation
  - Navigate to listing creation form

#### 2. Upload Media

- **Photo/Video Upload**
  - Drag-and-drop or click to upload
  - Support:
    - Multiple images per product
    - Videos (future)
  - Preview thumbnails
  - Reorder images

#### 3. AI Auto-Generation (Future)

- **AI Processing**
  - Backend sends images to AI service
  - AI detects items in images
  - AI generates for each item:
    - Product title
    - Description
    - Suggested category
    - Estimated condition

- **Seller Review**
  - Seller reviews AI-generated data
  - Can edit any field
  - Can merge/split detected items

#### 4. Manual Product Entry (Current MVP)

- **For Each Product**
  - Title (required)
  - Description (required)
  - Price (required)
  - Category (dropdown)
  - Condition (dropdown)
  - Assign images to product

- **AI Price Suggestion (Future)**
  - AI analyzes similar listings
  - Suggests price based on:
    - Category
    - Condition
    - Location
    - Market trends
  - Seller can accept/modify/ignore

#### 5. Review and Publish

- **Listing Preview**
  - View listing as buyers will see it
  - All products displayed
  - Edit button for each product

- **Publish**
  - Click "Publish Listing" button
  - Backend creates listing + products in database
  - Listing appears in marketplace feed

#### 6. Receive Order Requests

- **Notification**
  - In-app notification badge
  - "Offers" section shows pending requests

- **View Requests**
  - List of order requests for seller's listings
  - Each request shows:
    - Buyer name and profile
    - Products requested
    - Total price
    - Buyer's message
    - Time remaining (countdown from 3 days)

#### 7. Review Buyer Profile

- **Buyer Information**
  - Click on buyer name
  - View:
    - University
    - Member since
    - Previous transactions (future: ratings)

#### 8. Accept/Decline Order

##### Accept Full Order

- Click "Accept Order" button
- Order status updated to "accepted"
- Listing status updated to "sold"
- Products marked as unavailable
- Buyer notified
- Messaging thread opened

##### Accept Partial Order

- Select which products to accept
- Click "Accept Selected" button
- Order status: "partially accepted"
- **Automatic Relisting**:
  - Backend creates new listing
  - Includes remaining unsold products
  - Same images and descriptions
  - New listing appears in feed
- **Buyer Notifications**:
  - Original buyer: order partially accepted
  - Previous interested buyers: updated availability

##### Decline Order

- Click "Decline" button
- Optional: Add reason
- Order status: "declined"
- Buyer notified
- Listing remains active

#### 9. Coordinate Pickup

- **Messaging**
  - Discuss pickup details:
    - Date and time
    - Location (on campus, at apartment, etc.)
    - Payment method preferences
  - Answer buyer questions

#### 10. Complete Transaction

- **Meet Buyer**
  - Meet at agreed location and time
  - Buyer inspects products
  - Receive payment
  - Transfer products

- **Mark Complete (Future)**
  - Seller marks order as completed
  - Buyer confirms
  - Leave reviews for each other

### Optimization: Notifying Previous Buyers

**Scenario**: Seller partially accepts an order, leaving some items unsold.

**System Behavior**:
1. Identify buyers who previously placed requests including now-available products
2. Send notifications: "Items you were interested in are now available!"
3. Include direct link to new listing
4. Increases likelihood of selling remaining items quickly

---

## Sublease Searching Flow

### Goal
Student finds short-term housing and coordinates lease transfer.

### Prerequisites
- User is logged in
- Email is verified

### Steps

#### 1. Navigate to Sublease Zone

- Click "Sublease" in navigation
- Switch from "Products Zone" to "Sublease Zone"

#### 2. Apply Filters

- **Filter Options**
  - University
  - Location + radius
  - Rent range (min/max)
  - Start date (earliest acceptable)
  - End date (latest acceptable)
  - Room type (studio, 1BR, 2BR, etc.)
  - Furnished: Yes/No/Any
  - Verification status:
    - All listings
    - Verified only
    - With rental agreement
    - With payment proof

#### 3. Browse Listings

- **Feed View**
  - Card-based layout
  - Each card shows:
    - Property image
    - Rent per month
    - Duration (dates)
    - Room type
    - Approximate location
    - Verification badge (if verified)
    - Furnished status

- **Map View (Future)**
  - Interactive map with pins
  - Approximate locations (not exact addresses)
  - Click pin to see listing details
  - Cluster nearby listings

#### 4. View Listing Details

- **Detail Page**
  - Image gallery
  - Property information:
    - Rent amount
    - Duration
    - Room type
    - Furnished status
    - Description
  - Approximate location on map
  - Amenities list:
    - Parking
    - Laundry
    - WiFi
    - Utilities included
    - Pet-friendly
  - Verification status and documents

#### 5. Review Verification Documents

- **Verified Listings**
  - "Verified Post" badge displayed
  - View uploaded documents:
    - Rental agreement (PDF/image)
    - Payment proof (screenshot)
    - Walkthrough video

- **Build Trust**
  - Verified listings more trustworthy
  - Reduces scam risk

#### 6. Message Property Owner

- Click "Message Owner" button
- Opens messaging thread

- **Common Questions**:
  - Exact address for Google Maps
  - Nearby amenities and transportation
  - Reason for sublease
  - Lease transfer process and requirements
  - Security deposit details
  - Utilities included/excluded
  - Pet policy
  - Move-in/move-out flexibility

#### 7. Request Additional Information

- Ask for:
  - More photos
  - Video walkthrough
  - Neighborhood information
  - Proximity to campus/work

#### 8. Negotiate Terms

- **Discussion Points**:
  - Rent amount (some flexibility)
  - Duration (exact dates)
  - Security deposit
  - Lease transfer requirements
  - Landlord approval process

#### 9. Mutual Agreement

- **Confirmation**
  - Both parties agree to proceed
  - Click "Confirm Arrangement" in messaging
  - System sends confirmation message to both

- **Information Exchange**
  - Exact address shared
  - Phone numbers exchanged
  - Schedule property viewing

#### 10. Property Viewing

- **In-Person Visit**
  - Meet at property
  - Tour apartment/room
  - Inspect condition
  - Meet current landlord (if possible)
  - Review neighborhood safety

#### 11. Finalize Lease Transfer (Offline)

- **Legal Process**
  - Review rental agreement
  - Contact landlord for approval
  - Sign lease transfer documents
  - Pay security deposit and first month rent
  - Schedule move-in date

**Platform Disclaimer**: Sell OWL facilitates connection but does not handle legal agreements. Users responsible for lease compliance.

---

## Sublease Posting Flow

### Goal
Current tenant posts sublease to find qualified subtenant.

### Prerequisites
- User is logged in
- User has property to sublease

### Steps

#### 1. Navigate to Post Sublease

- Click "Post Sublease" in navigation or profile
- Navigate to sublease creation form

#### 2. Enter Property Details

- **Required Fields**:
  - Monthly rent ($)
  - Start date
  - End date
  - Room type (dropdown)
  - Furnished: Yes/No
  - Description (text area)

- **Optional Fields**:
  - Approximate location:
    - Click on map to set pin
    - Or enter neighborhood name
  - Amenities (checkboxes):
    - Parking
    - Laundry in unit
    - Laundry in building
    - WiFi
    - Utilities included
    - Pet-friendly
    - Gym
    - Pool

#### 3. Upload Media

- **Photos**
  - Living room
  - Bedroom(s)
  - Kitchen
  - Bathroom
  - Building exterior
  - Nearby amenities

- **Video (Optional)**
  - Walkthrough video (max 2 minutes)
  - Shows property condition
  - Increases trust

#### 4. Map Location

- **Approximate Location**
  - Drag pin on map
  - Shows general area (0.2 mile radius)
  - Exact address NOT displayed publicly
  - Protects privacy

#### 5. Verification Documents (Optional)

- **Upload for "Verified" Badge**:

  a) **Rental Agreement**
     - PDF or photo of signed lease
     - Shows lease is legitimate

  b) **Payment Proof**
     - Screenshot of recent rent payment
     - Bank statement or receipt
     - Proves current tenancy

  c) **Walkthrough Video**
     - Short video tour
     - Shows current condition
     - Date stamp visible

- **Verification Review**
  - Backend checks document validity
  - Manual review (for MVP)
  - Future: AI document verification

#### 6. Review and Publish

- **Preview Listing**
  - See how listing appears to seekers
  - Check all information
  - "Verified Post" badge shown if documents uploaded

- **Publish**
  - Click "Publish Listing"
  - Listing goes live immediately
  - Appears in Sublease Zone feed

#### 7. Receive Inquiries

- **Notifications**
  - In-app notifications for new messages
  - Badge on messaging icon

#### 8. Respond to Messages

- **Answer Questions**
  - Property details
  - Neighborhood information
  - Lease transfer process
  - Availability for viewing

#### 9. Share Additional Information

- **After Initial Interest**
  - More photos if requested
  - Exact address (via messaging)
  - Landlord contact information
  - Lease agreement copy

#### 10. Schedule Viewings

- Coordinate viewing times
- Meet interested subtenants at property
- Multiple viewings possible

#### 11. Select Subtenant

- **Evaluate Candidates**
  - Compatibility
  - Reliability (profile, university)
  - Lease duration match

- **Mutual Confirmation**
  - Agree to proceed in messaging
  - Click "Confirm Arrangement"
  - System sends confirmation

#### 12. Coordinate Lease Transfer

- **Offline Process**
  - Introduce subtenant to landlord
  - Submit lease transfer application
  - Pay any transfer fees
  - Sign documents
  - Schedule move-out/move-in

#### 13. Mark Listing as Filled (Future)

- Once sublease secured
- Mark listing as "No Longer Available"
- Listing archived
- Remove from active feed

---

## Messaging Flow

### Goal
Buyers and sellers communicate securely within platform.

### Features

- In-app messaging
- Real-time or near-real-time updates
- Conversation history
- Image sharing (future)

### Steps

#### 1. Initiate Conversation

**From Product Listing**:
- Click "Message Seller" button
- Opens messaging interface

**From Order Request**:
- After seller accepts order
- "Message Seller" button enabled

**From Sublease Listing**:
- Click "Message Owner" button

#### 2. Messaging Interface

- **Left Panel**: List of conversations
  - Contact name
  - Last message preview
  - Timestamp
  - Unread indicator

- **Right Panel**: Active conversation
  - Message thread (chronological)
  - Each message shows:
    - Sender name
    - Message content
    - Timestamp
    - Read/unread status (future)

- **Input Area**:
  - Text input box
  - "Send" button
  - Image attachment button (future)

#### 3. Send Message

- Type message
- Press Enter or click "Send"
- Message appears in thread
- Backend stores in `messages` table
- Recipient receives notification

#### 4. Receive Message

- **Real-time Update** (Future: WebSockets)
  - New message appears in conversation
  - Conversation list updates
  - Badge on messaging icon

- **Polling** (Current MVP)
  - Frontend polls backend every 5 seconds
  - Fetches new messages
  - Updates UI

#### 5. View Conversation History

- All messages in conversation stored
- Scroll up to view older messages
- Infinite scroll loads more (future)

#### 6. Notifications

- **In-App**:
  - Badge on messaging icon
  - Unread count

- **Email** (Future):
  - "You have a new message from [Name]"
  - Link back to platform

- **Push Notifications** (Future):
  - Mobile app
  - Desktop notifications

---

## Order Management Flow

### For Buyers: "My Orders"

#### View Order Requests

- **Order List**
  - All placed order requests
  - Status for each:
    - Pending (waiting for seller)
    - Accepted
    - Partially Accepted
    - Declined
    - Expired
    - Completed

- **Order Details**
  - Listing information
  - Products requested
  - Total price
  - Seller name
  - Order date
  - Expiration date (if pending)
  - Status

#### Actions

- **Pending Orders**:
  - View countdown timer
  - "Message Seller" (if needed)
  - "Cancel Request" (future)

- **Accepted Orders**:
  - "Message Seller" to coordinate pickup
  - "Mark as Completed" (future)

- **Declined/Expired Orders**:
  - View reason (if provided)
  - "Browse Similar Listings"

### For Sellers: "My Offers"

#### View Incoming Requests

- **Request List**
  - Pending requests requiring action
  - Countdown timer for each
  - Buyer information
  - Products requested
  - Total price

#### Actions

- **Accept Full Order**
- **Accept Partial Order**
  - Select which products
  - Remaining items auto-relisted
- **Decline Order**
  - Optional: Provide reason

#### View Active Sales

- Accepted orders in progress
- Awaiting pickup completion
- "Message Buyer" for coordination

---

## Summary

These workflows cover the complete user experience for:

1. **Authentication**: Secure account creation and login
2. **Marketplace**: Buying and selling products
3. **Subleasing**: Finding and posting short-term housing
4. **Messaging**: Secure communication
5. **Order Management**: Tracking requests and sales

For technical implementation details, see:
- [API Documentation](API.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [Architecture Overview](ARCHITECTURE.md)
