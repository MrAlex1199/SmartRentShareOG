# Smart Rent & Share - Development Roadmap

**เป้าหมายหลัก**: สร้างแพลตฟอร์มให้เช่า-ยืมของระหว่างนักศึกษา (Peer-to-Peer) ที่รองรับทั้ง LINE LIFF และ External Web Browser โดยใช้ Stack Next.js, NestJS และ MongoDB

## 🎯 Project Overview

**วิสัยทัศน์**: เป็นแพลตฟอร์มหลักสำหรับนักศึกษาในการแบ่งปันทรัพยากรและสร้างชุมชนที่ยั่งยืน

**กลุ่มเป้าหมาย**: นักศึกษามหาวิทยาลัย ที่ต้องการเช่า-ให้เช่าอุปกรณ์การเรียน เครื่องใช้ไฟฟ้า และของใช้ต่างๆ

## 🛠 Tech Stack

### Core Technologies
- **Frontend**: Next.js 14+ (App Router + TypeScript + Tailwind CSS)
- **Backend**: NestJS (TypeScript + Express)
- **Database**: MongoDB Atlas (Cloud) + Mongoose ODM
- **Authentication**: Hybrid (LINE LIFF + LINE Login OAuth 2.0)

### Infrastructure & Services
- **File Storage**: Cloudinary (รูปภาพ + video)
- **Real-time**: Socket.io + Redis (notifications & chat)
- **Payment**: PromptPay QR + Slip Verification
- **Deployment**: 
  - Frontend: Vercel
  - Backend: Railway / Render
  - Database: MongoDB Atlas

### Development Tools
- **Monorepo**: Turborepo
- **Testing**: Jest + Cypress
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + Vercel Analytics

**ระยะเวลารวมโดยประมาณ**: 10 สัปดาห์ (ปรับเพิ่มเพื่อความสมบูรณ์)

## 📋 Development Phases

### Phase 1: Foundation & Project Setup (สัปดาห์ 1-2) ⭐⭐⭐⭐⭐

**เป้าหมาย**: วางโครงสร้างโปรเจกต์และระบบพื้นฐาน

#### Week 1: Project Structure & Environment
- [ ] **Monorepo Setup**: 
  ```
  /
  ├── apps/
  │   ├── web/          # Next.js Frontend
  │   └── api/          # NestJS Backend
  ├── packages/
  │   ├── shared/       # Shared types & utilities
  │   ├── ui/           # Shared UI components
  │   └── config/       # Shared configurations
  └── tools/            # Build tools & scripts
  ```
- [ ] **Development Environment**:
  - Docker Compose สำหรับ local development
  - Environment variables management
  - ESLint + Prettier configuration
  - Husky pre-commit hooks

#### Week 2: Authentication System
- [ ] **LINE Developers Setup**: 
  - สร้าง LINE Channel (Messaging API + Login)
  - ตั้งค่า LIFF Application
  - Webhook URL configuration
- [ ] **Hybrid Authentication Logic**:
  - **ใน LINE LIFF**: `liff.init()` → `liff.getProfile()` → auto login
  - **ใน Browser**: "Login with LINE" button → OAuth redirect
  - JWT token generation & validation
  - Session management with Redis

#### Database Schema Design
```typescript
// User Schema
interface User {
  _id: ObjectId;
  lineId: string;           // Unique LINE ID
  displayName: string;
  pictureUrl?: string;
  email?: string;
  phoneNumber?: string;
  role: 'student' | 'admin';
  
  // Verification
  isVerified: boolean;
  studentCard?: {
    imageUrl: string;
    university: string;
    studentId: string;
    verifiedAt?: Date;
  };
  
  // Trust & Rating
  trustScore: number;       // 0-100
  totalRentals: number;
  totalListings: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}
```

**Deliverables**: 
- ✅ Working authentication flow
- ✅ User registration & profile management
- ✅ Student verification system

### Phase 2: Item Management & Discovery (สัปดาห์ 3-4) ⭐⭐⭐⭐

**เป้าหมาย**: ระบบจัดการสินค้าและการค้นหา

#### Week 3: Item CRUD & Media Management
- [ ] **Item Schema Design**:
```typescript
interface Item {
  _id: ObjectId;
  owner: ObjectId;          // ref: User
  
  // Basic Info
  title: string;
  description: string;
  category: ItemCategory;
  tags: string[];
  
  // Pricing
  dailyPrice: number;
  weeklyPrice?: number;     // Discount for weekly rental
  monthlyPrice?: number;    // Discount for monthly rental
  deposit: number;
  
  // Media
  images: string[];         // Cloudinary URLs
  videos?: string[];        // Optional demo videos
  
  // Availability
  isAvailable: boolean;
  availableFrom: Date;
  availableTo?: Date;       // Optional end date
  
  // Location & Delivery
  location: {
    university: string;
    building?: string;
    area: string;
  };
  deliveryOptions: ('pickup' | 'delivery')[];
  deliveryFee?: number;
  
  // Metadata
  condition: 'new' | 'like-new' | 'good' | 'fair';
  views: number;
  favorites: number;
  
  createdAt: Date;
  updatedAt: Date;
}

enum ItemCategory {
  ELECTRONICS = 'electronics',
  BOOKS = 'books', 
  FURNITURE = 'furniture',
  KITCHEN = 'kitchen',
  SPORTS = 'sports',
  TOOLS = 'tools',
  CLOTHING = 'clothing',
  OTHER = 'other'
}
```

- [ ] **Media Upload System**:
  - Cloudinary integration with Next.js
  - Image optimization & compression
  - Multiple image upload with drag & drop
  - Video upload support (optional)

#### Week 4: Search & Discovery Features
- [ ] **Advanced Search System**:
  - Full-text search with MongoDB Atlas Search
  - Category filtering
  - Price range filtering
  - Location-based filtering
  - Availability date filtering
  
- [ ] **Discovery Features**:
  - Trending items
  - Recently added
  - Recommended for you (based on previous rentals)
  - Favorites system
  
- [ ] **Owner Dashboard**:
  - My listings management
  - Analytics (views, inquiries, bookings)
  - Bulk operations (enable/disable multiple items)

**Deliverables**:
- ✅ Complete item management system
- ✅ Advanced search & filtering
- ✅ Media upload & optimization

### Phase 3: Booking Engine & Availability Management (สัปดาห์ 5-6) ⭐⭐⭐⭐⭐

**เป้าหมาย**: หัวใจของระบบเช่า - ป้องกันการจองซ้อนและจัดการ workflow ด้วย Escrow Model

> **⚠️ UPDATED WORKFLOW (Feb 2026)** — ดู Escrow & GP section ด้านล่าง

#### Week 5: Core Booking System
- [ ] **Booking Schema**:
```typescript
interface Booking {
  _id: ObjectId;
  item: ObjectId;           // ref: Item
  renter: ObjectId;         // ref: User
  owner: ObjectId;          // ref: User (denormalized for quick access)
  
  // Rental Period
  startDate: Date;
  endDate: Date;
  totalDays: number;
  
  // Pricing
  dailyPrice: number;       // Snapshot at booking time
  totalPrice: number;
  deposit: number;
  deliveryFee?: number;
  
  // Status Management
  status: BookingStatus;
  statusHistory: {
    status: BookingStatus;
    timestamp: Date;
    note?: string;
  }[];
  
  // Delivery & Pickup
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  pickupLocation?: string;
  
  // Communication
  messages: ObjectId[];     // ref: Message
  
  // Documentation
  itemConditionBefore?: {
    images: string[];
    notes: string;
    timestamp: Date;
  };
  itemConditionAfter?: {
    images: string[];
    notes: string;
    timestamp: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

enum BookingStatus {
  PENDING = 'pending',     // รอเจ้าของยืนยัน (auto-reject 24h)
  CONFIRMED = 'confirmed', // ยืนยันแล้ว รอผู้เช่าโอนเงิน
  PAID = 'paid',           // เงิน hold ใน escrow รอนัดรับของ
  ACTIVE = 'active',       // รับของสำเร็จ (ทั้งคู่ยืนยัน) กำลังเช่า
  COMPLETED = 'completed', // คืนของสำเร็จ escrow released GP 10%
  CANCELLED = 'cancelled', // ยกเลิก (ก่อน PAID เท่านั้น)
  REJECTED = 'rejected',   // ปฏิเสธโดยเจ้าของ
  OVERDUE = 'overdue'      // เกินกำหนดคืน
}

// BOOKING STATUS TRANSITION FLOW (Escrow Model — Feb 2026):
// PENDING → CONFIRMED → PAID → ACTIVE → COMPLETED
//        ↘ REJECTED      ↘ CANCELLED
//
// Booking Schema เพิ่มเติม (Feb 2026):
// appointmentDate?        — วันเวลานัดรับของ
// contractAgreedByRenter  — ผู้เช่า checkbox ยอมรับเงื่อนไข
// contractAgreedByOwner   — เจ้าของ checkbox ยอมรับเงื่อนไข
// renterConfirmedHandover — ผู้เช่ายืนยันรับของ
// ownerConfirmedHandover  — เจ้าของยืนยันส่งของ → ACTIVE
// renterConfirmedReturn   — ผู้เช่ายืนยันคืนของ
// ownerConfirmedReturn    — เจ้าของยืนยันรับคืน → COMPLETED
```

- [ ] **Availability Logic**:
  - Complex date range conflict detection
  - Buffer time between bookings (cleaning/maintenance)
  - Bulk availability updates
  - Calendar integration

#### Week 6: Advanced Booking Features
- [ ] **Smart Calendar System**:
  - Interactive calendar with react-day-picker
  - Visual availability indicators
  - Bulk date selection
  - Price calculation in real-time
  
- [ ] **Booking Workflow Automation**:
  - Auto-rejection after 24 hours (configurable)
  - Reminder notifications
  - Status transition validation
  - Conflict resolution

- [ ] **Booking Management Dashboard**:
  - Owner: Incoming requests, active rentals, history
  - Renter: My bookings, upcoming rentals, past rentals
  - Admin: All bookings overview, dispute resolution

**Deliverables**:
- ✅ Robust booking system with conflict prevention
- ✅ Interactive calendar interface
- ✅ Automated workflow management

### Phase 4: Communication & Real-time Features (สัปดาห์ 7) ⭐⭐⭐⭐

**เป้าหมาย**: ระบบสื่อสารและการแจ้งเตือนแบบ real-time

#### In-App Messaging System
- [ ] **Message Schema**:
```typescript
interface Message {
  _id: ObjectId;
  booking: ObjectId;        // ref: Booking
  sender: ObjectId;         // ref: User
  recipient: ObjectId;      // ref: User
  
  content: string;
  messageType: 'text' | 'image' | 'system';
  attachments?: string[];   // Image URLs
  
  isRead: boolean;
  readAt?: Date;
  
  createdAt: Date;
}
```

- [ ] **Real-time Features**:
  - Socket.io integration
  - Live chat between renter & owner
  - Real-time booking status updates
  - Online/offline status indicators

#### LINE Integration & Notifications
- [ ] **LINE Messaging API**:
  - Push notifications for booking updates
  - Daily/weekly rental reminders
  - Payment due notifications
  - Return reminders

- [ ] **Notification System**:
  - In-app notifications
  - Email notifications (backup)
  - LINE push messages
  - SMS notifications (critical only)

#### Mobile-First UI/UX
- [ ] **Responsive Design**:
  - Environment detection (`liff.isInClient()`)
  - LINE LIFF: Full-screen native-like experience
  - Browser: Complete web experience with navigation
  - Progressive Web App (PWA) features

**Deliverables**:
- ✅ Real-time messaging system
- ✅ Comprehensive notification system
- ✅ Optimized mobile experience

### Phase 5: Trust & Safety System (สัปดาห์ 8) ⭐⭐⭐⭐

**เป้าหมาย**: สร้างความปลอดภัยและความน่าเชื่อถือ

#### Trust Score & Rating System
- [ ] **Review Schema**:
```typescript
interface Review {
  _id: ObjectId;
  booking: ObjectId;        // ref: Booking
  reviewer: ObjectId;       // ref: User
  reviewee: ObjectId;       // ref: User
  
  // Ratings (1-5 scale)
  overallRating: number;
  itemCondition?: number;   // For item reviews
  communication: number;
  punctuality: number;
  
  comment: string;
  images?: string[];        // Optional photos
  
  // Moderation
  isVerified: boolean;
  reportCount: number;
  
  createdAt: Date;
}
```

- [ ] **Trust Score Calculation**:
  - Weighted average of all ratings
  - Recency factor (newer reviews weighted more)
  - Volume factor (more reviews = more reliable)
  - Verification bonus

#### Safety Features
- [ ] **Item Condition Documentation**:
  - Before/after photos requirement
  - Condition notes and timestamps
  - Damage reporting system
  - Insurance claim support

- [ ] **User Verification Enhancements**:
  - Student ID verification with OCR
  - Phone number verification
  - Social media linking (optional)
  - Reference system

- [ ] **Dispute Resolution**:
  - Report system for issues
  - Admin mediation tools
  - Automated resolution for common issues
  - Escalation procedures

**Deliverables**:
- ✅ Comprehensive trust & rating system
- ✅ Safety documentation features
- ✅ Dispute resolution framework

### Phase 6: Payment & Financial Management (สัปดาห์ 9) ⭐⭐⭐

**เป้าหมาย**: ระบบการเงิน Escrow ที่ปลอดภัย พร้อม GP platform fee 10%

> **✅ IMPLEMENTED (Feb 2026)** — Escrow model พร้อม GP 10%, Before/After photos, Digital agreement checkbox

#### Payment Schema (Actual Implementation)
```typescript
interface Payment {
  _id: ObjectId;
  booking: ObjectId;          // ref: Booking

  // Amounts
  payer: ObjectId;            // ref: User (renter)
  amount: number;             // total paid by renter (rent + deposit + delivery)

  // Escrow Status
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'released';
  slipImageUrl?: string;      // Cloudinary URL ของสลิป
  slipPublicId?: string;
  submittedAt?: Date;
  resolvedAt?: Date;
  escrowReleasedAt?: Date;    // เมื่อ COMPLETED + escrow released

  // Platform GP (10%)
  platformFeePercent: number; // default: 10
  platformFeeAmount: number;  // rent × 10%
  ownerReceivesAmount: number;// amount - platformFeeAmount

  // Other
  rejectionReason?: string;
  promptpayAccount?: string;
}
```

#### ตัวอย่างการคำนวณ GP
```
ค่าเช่า: ฿1,000 | มัดจำ: ฿500 | ค่าส่ง: ฿50
ผู้เช่าจ่าย:   ฿1,550 (รวมทุกอย่าง)
Platform GP:   ฿100  (10% ของค่าเช่า ฿1,000 เท่านั้น)
เจ้าของได้รับ: ฿1,450 (เมื่อ COMPLETED)
มัดจำคืน:     ไม่หัก GP (คืนเต็ม ฿500 ให้เจ้าของ)
```

#### New Booking Endpoints (Feb 2026)
| Endpoint | Method | หน้าที่ |
|----------|--------|---------|
| `/bookings/:id/appointment` | PATCH | ตั้งวัน/เวลานัดรับของ |
| `/bookings/:id/agree-contract` | PATCH | checkbox ยอมรับเงื่อนไข |
| `/bookings/:id/condition-photos` | PATCH | อัปโหลด before/after photos |
| `/bookings/:id/confirm-handover` | PATCH | ทั้งคู่ยืนยันรับของ → ACTIVE |
| `/bookings/:id/confirm-return` | PATCH | ทั้งคู่ยืนยันคืนของ → COMPLETED + release |

#### PromptPay Integration
- QR code display ตาม PromptPay account
- ผู้เช่าอัปโหลดสลิปผ่าน Cloudinary
- เจ้าของ verify/reject สลิป
- เมื่อ verified → booking เป็น PAID (escrow hold)

#### Digital Agreement (Checkbox)
- ไม่ใช้ PDF signature (ซับซ้อนเกิน)
- ใช้ checkbox "ยอมรับเงื่อนไข" ทั้ง renter และ owner
- บันทึก `contractAgreedByRenter` / `contractAgreedByOwner` ใน Booking schema

**Deliverables**:
- ✅ Escrow payment system พร้อม GP 10%
- ✅ Before/After condition photo upload
- ✅ Digital agreement checkbox (both parties)
- ✅ Appointment date/time picker
- ✅ Owner สรุปยอดรับเงินสุทธิหลัง GP


### Phase 7: Performance & Optimization (สัปดาห์ 10) ⭐⭐⭐

**เป้าหมาย**: เพิ่มประสิทธิภาพและเตรียมพร้อมสำหรับการใช้งานจริง

#### Performance Optimization
- [ ] **Frontend Optimization**:
  - Next.js Image optimization
  - Code splitting & lazy loading
  - Bundle size optimization
  - Service Worker for offline support
  
- [ ] **Backend Optimization**:
  - Database indexing strategy
  - Query optimization
  - Caching with Redis
  - API rate limiting

- [ ] **Monitoring & Analytics**:
  - Performance monitoring with Sentry
  - User analytics with Vercel Analytics
  - Business metrics dashboard
  - Error tracking & alerting

#### Testing & Quality Assurance
- [ ] **Automated Testing**:
  - Unit tests (Jest)
  - Integration tests
  - E2E tests (Cypress)
  - Load testing

- [ ] **Security Audit**:
  - Authentication security review
  - Data validation & sanitization
  - OWASP compliance check
  - Penetration testing

#### Deployment & DevOps
- [ ] **Production Deployment**:
  - Docker containerization
  - CI/CD pipeline with GitHub Actions
  - Environment management
  - Database migration strategy

- [ ] **Infrastructure Setup**:
  - CDN configuration
  - SSL certificates
  - Domain setup
  - Backup strategies

**Deliverables**:
- ✅ Optimized, production-ready application
- ✅ Comprehensive testing suite
- ✅ Robust deployment pipeline

---

## 🎯 Success Metrics & KPIs

### User Engagement
- **Daily Active Users (DAU)**: Target 500+ within first month
- **Monthly Active Users (MAU)**: Target 2,000+ within 3 months
- **User Retention**: 70% week-1, 40% month-1
- **Session Duration**: Average 8+ minutes

### Business Metrics
- **Total Listings**: 1,000+ items within 2 months
- **Booking Conversion**: 15%+ from view to booking
- **Trust Score**: Average 4.2+ stars
- **Dispute Rate**: <2% of total bookings

### Technical Performance
- **Page Load Time**: <2 seconds (mobile)
- **API Response Time**: <500ms (95th percentile)
- **Uptime**: 99.9%
- **Error Rate**: <0.1%

## 🚀 Future Enhancements (Post-Launch)

### Phase 8: Advanced Features
- [ ] **AI-Powered Recommendations**
- [ ] **Dynamic Pricing Algorithm**
- [ ] **Multi-language Support**
- [ ] **Advanced Analytics Dashboard**

### Phase 9: Ecosystem Expansion
- [ ] **Mobile Native Apps** (React Native)
- [ ] **University Partnerships**
- [ ] **Corporate Rental Program**
- [ ] **Insurance Integration**

### Phase 10: Scale & Growth
- [ ] **Multi-city Expansion**
- [ ] **B2B Rental Solutions**
- [ ] **Marketplace Features**
- [ ] **API for Third-party Integration**

---

## 📚 Technical Documentation

### API Documentation
- RESTful API with OpenAPI 3.0 specification
- GraphQL endpoint for complex queries
- Webhook documentation for integrations
- SDK for mobile app development

### Database Design
- Comprehensive ERD documentation
- Data migration scripts
- Backup and recovery procedures
- Performance tuning guidelines

### Security Guidelines
- Authentication & authorization flows
- Data encryption standards
- Privacy policy compliance
- GDPR/PDPA compliance checklist

---

*Last Updated: February 2026*
*Version: 2.0*
