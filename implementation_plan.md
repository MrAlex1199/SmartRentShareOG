# แผนแก้ไข User Feedback — SmartRent&Share

## สรุปปัญหา 8 ข้อ + วิเคราะห์สาเหตุ

---

## 🐛 Issue #1: Footer แสดงในหน้า Admin

**สาเหตุ:** `Footer` ถูก render ใน `apps/web/src/app/layout.tsx` (Root Layout) ซึ่งครอบคลุมทุกหน้ารวมถึง `/admin`

**แนวทางแก้ไข:** เพิ่ม `usePathname()` ใน `Footer.tsx` แล้ว return `null` ถ้า pathname เริ่มต้นด้วย `/admin`

> [!NOTE]
> Footer มี `'hidden lg:block'` อยู่แล้ว (ซ่อนบน mobile) แต่หน้า admin ใช้ dark theme
> วิธีนี้ clean กว่าการแยก layout ซ้อนกัน

---

## 🐛 Issue #2: ลิงก์ Footer ไม่มีหน้าจริง

**หน้าที่ขาด:**
- `/help` — วิธีใช้งาน
- `/help/safety` — ความปลอดภัย
- `/contact` — ติดต่อเรา
- `/privacy` — นโยบายความเป็นส่วนตัว
- `/terms` — เงื่อนไขการใช้งาน
- `/cookies` — นโยบาย Cookies

**แนวทางแก้ไข:** สร้างหน้า static ทั้ง 6 หน้า เนื้อหาเป็น placeholder ที่ผู้ใช้ปรับแก้เองทีหลัง ออกแบบให้ดูดี

---

## 🐛 Issue #3: /dashboard/payouts ยอดไม่แสดงหรือผิด

**สาเหตุคาดการณ์:**
1. `totalReleased` และ `totalPending` คำนวณจาก `ownerReceivesAmount` ซึ่งในข้อมูลเก่าอาจเป็น `undefined/null`
2. API `GET /payments/my-payouts` อาจ populate ข้อมูลไม่ครบ หรือ renter/item เป็น null
3. ข้อมูล legacy (payment ที่สร้างก่อน schema เพิ่ม `ownerReceivesAmount`) ไม่มีค่านี้

**แนวทางแก้ไข:**
- Backend: ปรับ `getOwnerPayouts()` ให้ fallback คำนวณ `ownerReceivesAmount` ถ้าเป็น null
- Frontend: ออกแบบหน้าใหม่ให้ดีขึ้น — เพิ่ม breakdown GP ชัดเจน, revenue chart สรุปรวม

---

## 🐛 Issue #4: Header "การจองของฉัน" ไฮไลท์เหลืองตอนอยู่ที่ /bookings/requests

**สาเหตุ:** `navLink('/bookings', 'การจองของฉัน')` ใช้ `pathname.startsWith('/bookings')` ซึ่ง path `/bookings/requests` ก็ขึ้นต้นด้วย `/bookings` ทำให้ active ทั้งคู่

**แนวทางแก้ไข:** แก้ navLink สำหรับ `/bookings` ให้ match แบบ exact หรือ exclude path ที่ยาวกว่า

```tsx
// เปลี่ยนจาก:
{navLink('/bookings', 'การจองของฉัน')}
// เป็น:
{navLink('/bookings', 'การจองของฉัน', false, ['/bookings/requests'])}
```

หรือวิธีง่ายกว่า: ใช้ `exact = true` → `pathname === '/bookings'` เท่านั้น

---

## 🐛 Issue #5: /bookings/requests ต้องปรับ Filter + Pagination + Retention

**ปัญหาปัจจุบัน:**
- Filter มีแค่ `all | pending | active` — ขาดสถานะ `completed, rejected, cancelled`
- ไม่มี pagination — โหลดทุก record
- ไม่มี retention policy — เก็บข้อมูลเก่าไว้ทั้งหมด

**แนวทางแก้ไข:**

**Frontend `/bookings/requests`:**
- เปลี่ยน filter เป็น: รอยืนยัน | ยืนยันแล้ว | ดำเนินการอยู่ | กำลังเช่า | เสร็จสิ้น | ปฏิเสธ | ยกเลิก
- เพิ่ม pagination (10 ต่อหน้า)
- เพิ่มการแสดงวันที่เช่า (startDate → endDate) ในการ์ด

**Backend `/bookings/my-requests`:**
- เพิ่ม query param `status`, `page`, `limit`
- เพิ่ม retention: default แสดงเฉพาะ 6 เดือนล่าสุด (completed/cancelled/rejected)
- เพิ่ม query param `includeArchived=true` สำหรับดูเก่า

> [!IMPORTANT]
> ไม่ลบข้อมูลจาก DB — ใช้ query filter เพื่อซ่อนของเก่า เก็บ audit trail ไว้

---

## 🐛 Issue #6: ข้อมูลเก่าทำให้แสดงผลผิด

**วิธีแนะนำ (ไม่ลบถาวร):**

**Option A: Soft Archive (แนะนำ)**
- เพิ่ม script ดู bookings ที่ `status = completed/cancelled/rejected` และ `createdAt < 6 เดือน`
- Frontend query แสดงแค่ข้อมูล active + 6 เดือนล่าสุด
- ยังไม่ต้อง migrate หรือลบ DB

**Option B: Hard Delete (รุนแรงกว่า)**
- ให้ user กด "ล้างประวัติ" เอง (soft delete — set `isArchived = true`)
- Admin มีปุ่มลบ bulk

> [!CAUTION]
> ห้ามลบ booking ที่ status = PAID, ACTIVE, CONFIRMED เด็ดขาด — ยังมี escrow อยู่

**สิ่งที่จะทำ:** สร้าง admin script + frontend filter ซ่อนของเก่า (> 6 เดือน)

---

## 🐛 Issue #7: Notification กดไปหน้าไม่ได้ + ไม่มีปุ่มล้าง

**วิเคราะห์โค้ดปัจจุบัน:**
- `handleNotificationClick` มี navigate logic แล้ว (`router.push`) แต่ **ทำงานเฉพาะเมื่อ `notification.bookingId` มีค่า**
- notification ที่ไม่มี bookingId (เช่น system notifications) จะไม่ navigate
- ยังไม่มีปุ่ม "ล้างทั้งหมด" (มีแค่ "อ่านทั้งหมด")

**แนวทางแก้ไข:**
- เพิ่มปุ่ม "ล้างทั้งหมด" (delete notifications เก่า)
- Backend: เพิ่ม `DELETE /notifications/clear-old` — ลบที่อ่านแล้ว > 30 วัน
- แก้ navigation สำหรับ notification ที่ไม่มี bookingId (นำไปหน้า dashboard แทน)
- เพิ่ม cursor-pointer styling ชัดเจน

---

## 🐛 Issue #8: ลงประกาศ — ต้องการจังหวัด/เขต + delivery options bug

### 8A: เพิ่มฟิลด์จังหวัด/เขต

**สาเหตุ:** Location schema มีแค่ `university` และ `area` — ไม่มี `province` / `district`

**แนวทางแก้ไข:**
- Backend: เพิ่ม `province` (จังหวัด) และ `district` (เขต/อำเภอ) ใน `item.schema.ts`
- Frontend Create Item: เพิ่ม dropdown จังหวัด (77 จังหวัด) → เขต/อำเภอ
- Frontend Search: เพิ่ม filter จังหวัด

### 8B: Delivery Options Bug

**สาเหตุที่แท้จริง:** เมื่อเลือก `delivery_only` หรือ `both` form ต้องการ `area` (required) แต่ area ถูก required เฉพาะตอน pickup — ตรวจสอบ validation ใน backend

**จากโค้ด** `CreateItemDto` ไม่มี validation ที่ชัดเจนว่า deliveryOptions ต้องมีอะไร ปัญหาอาจมาจาก:
1. Schema validation reject เมื่อ deliveryOptions เป็น `['delivery']` (ไม่มี 'pickup')
2. `location.area` ยัง required ใน schema แต่ frontend ไม่ส่ง

**แนวทางแก้ไข:**
- ตรวจสอบ DTO validation ใน backend
- แก้ frontend: ถ้าเลือก `delivery_only` ให้ส่ง `area = ''` หรือ `area = 'จัดส่งพัสดุ'`

---

## 📋 ไฟล์ที่ต้องแก้ไข

### 🔧 Frontend (apps/web)

#### [MODIFY] [Footer.tsx](file:///e:/Web/SmartRentShareOG/apps/web/src/components/Layout/Footer.tsx)
- เพิ่ม pathname check → ซ่อนใน `/admin`

#### [MODIFY] [Header.tsx](file:///e:/Web/SmartRentShareOG/apps/web/src/components/Layout/Header.tsx)
- แก้ active state ของ `/bookings` ไม่ให้ตรงกับ `/bookings/requests`

#### [NEW] `apps/web/src/app/help/page.tsx`
#### [NEW] `apps/web/src/app/help/safety/page.tsx`
#### [NEW] `apps/web/src/app/contact/page.tsx`
#### [NEW] `apps/web/src/app/privacy/page.tsx`
#### [NEW] `apps/web/src/app/terms/page.tsx`
#### [NEW] `apps/web/src/app/cookies/page.tsx`

#### [MODIFY] [payouts/page.tsx](file:///e:/Web/SmartRentShareOG/apps/web/src/app/dashboard/payouts/page.tsx)
- ออกแบบใหม่ + แก้ summary calculation

#### [MODIFY] [bookings/requests/page.tsx](file:///e:/Web/SmartRentShareOG/apps/web/src/app/bookings/requests/page.tsx)
- เพิ่ม filter ครบทุกสถานะ + pagination 10/หน้า

#### [MODIFY] [NotificationBell.tsx](file:///e:/Web/SmartRentShareOG/apps/web/src/components/Notifications/NotificationBell.tsx)
- เพิ่มปุ่มล้างการแจ้งเตือน + แก้ navigate

#### [MODIFY] [items/create/page.tsx](file:///e:/Web/SmartRentShareOG/apps/web/src/app/items/create/page.tsx)
- เพิ่ม dropdown จังหวัด/เขต
- แก้ delivery options validation

---

### 🔧 Backend (apps/api)

#### [MODIFY] [item.schema.ts](file:///e:/Web/SmartRentShareOG/apps/api/src/items/schemas/item.schema.ts)
- เพิ่ม `province` และ `district` ใน location object

#### [MODIFY] [items.service.ts](file:///e:/Web/SmartRentShareOG/apps/api/src/items/items.service.ts)
- เพิ่ม `province` filter ใน `findAll()`

#### [MODIFY] [bookings.service.ts](file:///e:/Web/SmartRentShareOG/apps/api/src/bookings/bookings.service.ts)
- เพิ่ม pagination + date filter ใน `findMyRequests()` และ `findMyBookings()`

#### [MODIFY] payments.service.ts
- แก้ `getOwnerPayouts()` ให้ fallback คำนวณ ownerReceivesAmount

#### Backend: เพิ่ม endpoint `DELETE /notifications/clear-read`

---

## ⚠️ Open Questions

> [!IMPORTANT]
> **ข้อ 6 (ข้อมูลเก่า):** ต้องการ **ลบข้อมูลเก่าออกจาก DB จริงๆ** หรือแค่ **ซ่อนในหน้าแสดงผล**?
> - ถ้าลบจริง: ต้องเขียน migration script และระวัง booking ที่ยังมี payment
> - ถ้าซ่อน: แก้แค่ query filter ใน frontend/backend (safe กว่า)

> [!IMPORTANT]
> **ข้อ 8A (จังหวัด):** `university` field ในปัจจุบันเป็น string อิสระ (เช่น `'CU'`)
> ต้องการเปลี่ยนให้ required ระบุจังหวัด/เขต ด้วย **แทนที่** university หรือ **เพิ่มเติม**?

---

## 🔢 ลำดับการทำงานที่แนะนำ

```
Phase 1 (Quick Wins — 1 วัน):
  1. Footer ซ่อนใน Admin          ← 5 นาที
  2. Header active bug fix        ← 5 นาที
  3. Notification ล้าง + navigate ← 30 นาที

Phase 2 (Pages — 1 วัน):
  4. สร้างหน้า Static 6 หน้า      ← 2-3 ชั่วโมง
  5. Payouts redesign             ← 1 ชั่วโมง
  6. Bookings requests pagination  ← 1 ชั่วโมง

Phase 3 (Backend + Location — 1-2 วัน):
  7. เพิ่ม province/district schema ← 30 นาที
  8. แก้ delivery validation bug   ← 30 นาที
  9. Booking pagination API        ← 1 ชั่วโมง
 10. Clear old data strategy       ← ตามที่ user ตัดสินใจ
```

---

## ✅ Verification Plan

- ทดสอบ Footer ไม่แสดงในทุก `/admin/*` page
- ทดสอบ Header: กด `/bookings/requests` → แค่ "คำขอจอง" เหลือง ไม่ใช่ "การจองของฉัน"
- ทดสอบลิงก์ทั้ง 6 หน้าใน Footer คลิกได้
- ทดสอบ Payouts: ยอดสรุปถูกต้อง (released = โอนแล้ว, pending = รอโอน)
- ทดสอบ Requests: pagination 10 ชิ้น + filter ทุกสถานะ
- ทดสอบ Notification: กดแล้ว navigate ได้ + ปุ่มล้างทำงาน
- ทดสอบ Create Item: เลือก Delivery Only → ลงประกาศได้
