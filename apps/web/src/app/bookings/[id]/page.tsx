'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Booking, BookingStatus } from '@repo/shared';
import { Header } from '@/components/Layout/Header';
import { BookingStatusBadge } from '@/components/Booking/BookingStatusBadge';
import { PaymentUpload } from '@/components/Payment/PaymentUpload';
import { ReviewForm } from '@/components/Reviews/ReviewForm';
import { ConditionPhotoUpload } from '@/components/Booking/ConditionPhotoUpload';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import Cookies from 'js-cookie';

/* ─── Types ─── */
interface CurrentUser { _id: string; displayName: string; pictureUrl?: string; }
interface PaymentInfo {
  status: string;
  slipImageUrl?: string;
  amount: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  ownerReceivesAmount: number;
  rejectionReason?: string;
}
interface ReviewStatus { canReview: boolean; alreadyReviewed: boolean; }

/* ─── Small helpers ─── */
function Avatar({ user }: { user: { displayName: string; pictureUrl?: string } }) {
  return user.pictureUrl ? (
    <img src={user.pictureUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
      <span className="text-sm font-bold text-gray-900">{user.displayName.charAt(0)}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>

  );
}

/* ─── Main Page ─── */
export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const token = Cookies.get('token');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment verify modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Appointment picker
  const [showAppointmentPicker, setShowAppointmentPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>();
  const [appointmentTime, setAppointmentTime] = useState('10:00');

  // Review
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    if (!token) { router.push('/'); return; }
    try {
      setLoading(true);
      const [bookingRes, meRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { headers }),
      ]);
      if (!bookingRes.ok) throw new Error('ไม่พบข้อมูลการจอง');
      const bookingData = await bookingRes.json();
      setBooking(bookingData);
      if (meRes.ok) setCurrentUser(await meRes.json());

      const statusesNeedingPayment = ['confirmed', 'paid', 'active', 'completed'];
      if (statusesNeedingPayment.includes(bookingData.status)) {
        const payRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/booking/${bookingId}`, { headers });
        if (payRes.ok) setPayment(await payRes.json());
      }
      if (bookingData.status === 'completed') {
        const rvRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/booking/${bookingId}/status`, { headers });
        if (rvRes.ok) setReviewStatus(await rvRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── Derived ─── */
  const bOwner = typeof booking?.owner === 'object' ? (booking.owner as any) : null;
  const bRenter = typeof booking?.renter === 'object' ? (booking.renter as any) : null;
  const item = typeof booking?.item === 'object' ? (booking.item as any) : null;

  const isOwner = currentUser && bOwner ? bOwner._id === currentUser._id : false;
  const isRenter = currentUser && bRenter ? bRenter._id === currentUser._id : false;

  const grandTotal = booking ? booking.totalPrice + (booking.deliveryFee || 0) + (item?.deposit || 0) : 0;
  const daysRemaining = booking?.endDate ? differenceInDays(new Date(booking.endDate), new Date()) : 0;

  const fmtDate = (d: string) => format(new Date(d), 'd MMMM yyyy', { locale: th });
  const fmtDateTime = (d: string) =>
    format(new Date(d), 'd MMMM yyyy เวลา HH:mm น.', { locale: th });

  const revieweeId = isRenter ? bOwner?._id : bRenter?._id;
  const revieweeName = isRenter ? bOwner?.displayName : bRenter?.displayName;
  const revieweeType: 'owner' | 'renter' = isRenter ? 'owner' : 'renter';

  /* ─── Actions ─── */
  const callApi = async (url: string, method = 'PATCH', body?: object) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'เกิดข้อผิดพลาด'); }
    return res.json();
  };

  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    setActionLoading(true);
    try { await callApi(`/bookings/${bookingId}/status`, 'PATCH', { status: newStatus }); await fetchAll(); }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้?')) return;
    setActionLoading(true);
    try { await callApi(`/bookings/${bookingId}`, 'DELETE'); router.push('/bookings'); }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleVerifyPayment = async (action: 'verify' | 'reject') => {
    setActionLoading(true);
    try {
      await callApi(`/payments/booking/${bookingId}/${action}`, 'PATCH',
        action === 'reject' ? { reason: rejectReason } : undefined,
      );
      setShowRejectModal(false);
      await fetchAll();
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleSetAppointment = async () => {
    if (!selectedDay) { alert('กรุณาเลือกวันที่'); return; }
    const [h, m] = appointmentTime.split(':').map(Number);
    const dt = new Date(selectedDay);
    dt.setHours(h, m, 0, 0);
    setActionLoading(true);
    try { await callApi(`/bookings/${bookingId}/appointment`, 'PATCH', { appointmentDate: dt.toISOString() }); setShowAppointmentPicker(false); await fetchAll(); }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleAgreeContract = async () => {
    setActionLoading(true);
    try { await callApi(`/bookings/${bookingId}/agree-contract`); await fetchAll(); }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleConfirmHandover = async () => {
    setActionLoading(true);
    try { await callApi(`/bookings/${bookingId}/confirm-handover`); await fetchAll(); }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleConfirmReturn = async () => {
    setActionLoading(true);
    try { await callApi(`/bookings/${bookingId}/confirm-return`); await fetchAll(); }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  /* ─── Loading / Error ─── */
  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    </div>
  );
  if (error || !booking) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-xl font-semibold text-gray-700 mb-4">{error || 'ไม่พบข้อมูลการจอง'}</p>
        <button onClick={() => router.push('/bookings')} className="px-6 py-2.5 bg-primary text-gray-900 rounded-lg font-semibold">กลับ</button>
      </div>
    </div>
  );

  const bk = booking as any; // shorthand for extended fields

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          ย้อนกลับ
        </button>

        {/* ── Header ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">รายละเอียดการจอง</h1>
              <p className="text-xs text-gray-400 font-mono mt-0.5">#{booking._id}</p>
              <p className="text-xs text-gray-500 mt-1">{isOwner ? '👑 คุณเป็นเจ้าของสินค้า' : '🧑 คุณเป็นผู้เช่า'}</p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
        </div>

        {/* ── Item ── */}
        {item && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">ข้อมูลสินค้า</h2>
            <div className="flex gap-4">
              {item.images?.length > 0 && <img src={item.images[0]} alt={item.title} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />}
              <div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                <p className="text-sm text-gray-500 mt-1">📍 {item.location?.area}</p>
                <p className="text-sm font-medium text-primary mt-1">฿{item.dailyPrice?.toLocaleString()}/วัน</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Booking Details + Price ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">รายละเอียดการเช่า</h2>
            <div className="space-y-2">
              <InfoRow label="วันที่เริ่ม" value={fmtDate(booking.startDate)} />
              <InfoRow label="วันที่สิ้นสุด" value={fmtDate(booking.endDate)} />
              <InfoRow label="จำนวนวัน" value={`${booking.totalDays} วัน`} />
              <InfoRow label="วิธีรับสินค้า" value={booking.deliveryMethod === 'pickup' ? '🚶 รับเอง' : '🚚 จัดส่ง'} />
              {booking.deliveryAddress && <InfoRow label="ที่อยู่" value={booking.deliveryAddress} />}
              {bk.appointmentDate && (
                <InfoRow
                  label="📅 นัดรับของ"
                  value={<span className="text-primary font-semibold">{fmtDateTime(bk.appointmentDate)}</span>}
                />
              )}
              {booking.status === 'active' && daysRemaining >= 0 && (
                <InfoRow label="⏱️ เหลือเวลา" value={<span className={`font-bold ${daysRemaining <= 1 ? 'text-red-600' : 'text-green-600'}`}>{daysRemaining} วัน</span>} />
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">รายละเอียดราคา</h2>
            <div className="space-y-2 text-sm">
              <InfoRow label={`ค่าเช่า (${booking.totalDays}วัน × ฿${item?.dailyPrice?.toLocaleString()})`} value={`฿${booking.totalPrice.toLocaleString()}`} />
              {(booking.deliveryFee || 0) > 0 && <InfoRow label="ค่าจัดส่ง" value={`฿${booking.deliveryFee!.toLocaleString()}`} />}
              <InfoRow label="ค่ามัดจำ" value={`฿${(item?.deposit || 0).toLocaleString()}`} />
              <div className="border-t border-gray-200 pt-2 mt-1">
                <InfoRow label={<span className="font-semibold text-gray-900">ยอดรวม</span>} value={<span className="text-xl font-bold text-primary">฿{grandTotal.toLocaleString()}</span>} />
              </div>
              {/* GP breakdown (owner only, completed) */}
              {isOwner && payment && ['verified', 'released'].includes(payment.status) && (
                <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">สรุปการได้รับเงิน</p>
                  <InfoRow label="ยอดที่ผู้เช่าจ่าย" value={`฿${payment.amount.toLocaleString()}`} />
                  <InfoRow label={`ค่าบริการแพลตฟอร์ม (${payment.platformFeePercent}%)`} value={<span className="text-red-500">-฿{payment.platformFeeAmount.toLocaleString()}</span>} />
                  <InfoRow label="💰 คุณได้รับ" value={<span className="text-green-600 font-bold text-base">฿{payment.ownerReceivesAmount.toLocaleString()}</span>} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Users ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">ผู้เกี่ยวข้อง</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bRenter && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar user={bRenter} />
                <div><p className="text-xs text-gray-500">ผู้เช่า</p><p className="font-medium text-gray-900">{bRenter.displayName}</p></div>
              </div>
            )}
            {bOwner && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar user={bOwner} />
                <div><p className="text-xs text-gray-500">เจ้าของ</p><p className="font-medium text-gray-900">{bOwner.displayName}</p></div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════ CONFIRMED = ผู้เช่าจ่ายเงิน ══════════════ */}
        {booking.status === 'confirmed' && isRenter && (
          <PaymentUpload bookingId={bookingId} totalAmount={grandTotal} onSuccess={fetchAll} />
        )}
        {booking.status === 'confirmed' && isOwner && payment?.status === 'submitted' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">💳 ตรวจสอบหลักฐานชำระเงิน</h2>
            {payment.slipImageUrl && <img src={payment.slipImageUrl} alt="slip" className="max-h-64 rounded-lg border object-contain mx-auto" />}
            <p className="text-sm text-gray-500">ยอดที่ผู้เช่าโอน: <strong>฿{payment.amount.toLocaleString()}</strong></p>
            <div className="flex gap-3">
              <button onClick={() => handleVerifyPayment('verify')} disabled={actionLoading} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">✅ ยืนยันการชำระเงิน</button>
              <button onClick={() => setShowRejectModal(true)} disabled={actionLoading} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">❌ ปฏิเสธ</button>
            </div>
          </div>
        )}
        {booking.status === 'confirmed' && isOwner && (!payment || payment.status === 'pending') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-blue-800 font-medium">⏳ รอผู้เช่าโอนเงินและส่งสลิป</p>
          </div>
        )}

        {/* ══════════════ PAID = เงิน hold ใน escrow ══════════════ */}
        {booking.status === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-semibold text-green-800">🔒 เงิน ฿{grandTotal.toLocaleString()} ถูก hold ในระบบเรียบร้อย</p>
            <p className="text-sm text-green-700 mt-1">จะ release ให้เจ้าของหลังยืนยันคืนของสำเร็จทั้ง 2 ฝั่ง</p>
          </div>
        )}

        {/* Appointment Picker (PAID) */}
        {booking.status === 'paid' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">📅 นัดรับ/ส่งของ</h2>
              {!bk.appointmentDate && (
                <button onClick={() => setShowAppointmentPicker(!showAppointmentPicker)} className="text-sm px-3 py-1.5 bg-primary text-gray-900 rounded-lg font-medium hover:bg-primary/90">
                  {showAppointmentPicker ? 'ยกเลิก' : 'ตั้งนัด'}
                </button>
              )}
            </div>
            {bk.appointmentDate ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold text-gray-900">{fmtDateTime(bk.appointmentDate)}</p>
                  <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(bk.appointmentDate), { locale: th, addSuffix: true })}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">ยังไม่มีนัดหมาย — ทั้งสองฝั่งสามารถตั้งนัดได้</p>
            )}
            {showAppointmentPicker && (
              <div className="mt-4 border-t pt-4 space-y-3">
                <DayPicker
                  mode="single"
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  fromDate={new Date()}
                  locale={th}
                  className="!font-sans"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">เวลา</label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={e => setAppointmentTime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleSetAppointment}
                  disabled={!selectedDay || actionLoading}
                  className="w-full py-2.5 bg-primary text-gray-900 rounded-lg font-semibold disabled:opacity-50"
                >
                  ยืนยันนัดหมาย
                </button>
              </div>
            )}
          </div>
        )}

        {/* Condition Photos — Before (PAID) */}
        {booking.status === 'paid' && (
          <ConditionPhotoUpload
            bookingId={bookingId}
            phase="before"
            existingImages={bk.itemConditionBefore?.images || []}
            onSuccess={fetchAll}
          />
        )}

        {/* Agreement Checkbox (PAID) */}
        {booking.status === 'paid' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">📝 ยอมรับเงื่อนไขการเช่า</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1 mb-4">
              <p>1. ผู้เช่าต้องดูแลสินค้าให้อยู่ในสภาพดี</p>
              <p>2. หากสินค้าเสียหาย ผู้เช่าต้องรับผิดชอบค่าซ่อม</p>
              <p>3. คืนสินค้าตามวันและเวลาที่ตกลงไว้</p>
              <p>4. หากคืนช้า อาจมีค่าปรับตามข้อตกลง</p>
              <p>5. มัดจำจะคืนหลังจากตรวจสอบสภาพสินค้าแล้ว</p>
            </div>
            {isRenter && (
              bk.contractAgreedByRenter ? (
                <p className="text-green-700 font-medium">✅ คุณยอมรับเงื่อนไขแล้ว</p>
              ) : (
                <button onClick={handleAgreeContract} disabled={actionLoading} className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50">
                  ☑️ ยอมรับเงื่อนไขการเช่า
                </button>
              )
            )}
            {isOwner && (
              bk.contractAgreedByOwner ? (
                <p className="text-green-700 font-medium">✅ คุณยอมรับเงื่อนไขแล้ว</p>
              ) : (
                <button onClick={handleAgreeContract} disabled={actionLoading} className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50">
                  ☑️ ยอมรับเงื่อนไขการเช่า
                </button>
              )
            )}
            {/* Show other party status */}
            <div className="mt-3 flex gap-4 text-sm">
              <span className={bk.contractAgreedByRenter ? 'text-green-600' : 'text-gray-400'}>
                {bk.contractAgreedByRenter ? '✅' : '⏳'} ผู้เช่า
              </span>
              <span className={bk.contractAgreedByOwner ? 'text-green-600' : 'text-gray-400'}>
                {bk.contractAgreedByOwner ? '✅' : '⏳'} เจ้าของ
              </span>
            </div>
          </div>
        )}

        {/* Confirm Handover Button (PAID) */}
        {booking.status === 'paid' && (() => {
          const renterReady = bk.contractAgreedByRenter && (bk.itemConditionBefore?.images?.length > 0);
          const ownerReady = bk.contractAgreedByOwner;
          const myConfirmed = isRenter ? bk.renterConfirmedHandover : bk.ownerConfirmedHandover;
          const canConfirm = isRenter ? (renterReady && !myConfirmed) : (ownerReady && !myConfirmed);
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                {isRenter ? '📦 ยืนยันรับของ' : '🤝 ยืนยันส่งของ'}
              </h2>
              {!isRenter && !bk.itemConditionBefore?.images?.length && (
                <p className="text-sm text-amber-600 mb-3">⚠️ รอผู้เช่าอัปโหลดรูปสภาพสินค้าก่อน</p>
              )}
              <div className="flex gap-4 text-sm mb-3">
                <span className={bk.renterConfirmedHandover ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {bk.renterConfirmedHandover ? '✅' : '⏳'} ผู้เช่ายืนยัน
                </span>
                <span className={bk.ownerConfirmedHandover ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {bk.ownerConfirmedHandover ? '✅' : '⏳'} เจ้าของยืนยัน
                </span>
              </div>
              {myConfirmed ? (
                <p className="text-green-700 font-medium">✅ คุณยืนยันแล้ว รอฝั่งตรงข้าม...</p>
              ) : canConfirm ? (
                <button onClick={handleConfirmHandover} disabled={actionLoading} className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                  {isRenter ? '✅ ยืนยันรับของสำเร็จ' : '✅ ยืนยันส่งของสำเร็จ'}
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  {isRenter
                    ? 'กรุณาอัปโหลดรูปสินค้าและยอมรับเงื่อนไขก่อน'
                    : 'กรุณายอมรับเงื่อนไขก่อน'}
                </p>
              )}
            </div>
          );
        })()}

        {/* ══════════════ ACTIVE = กำลังเช่า ══════════════ */}
        {booking.status === 'active' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-semibold text-blue-800">🟢 กำลังเช่าอยู่</p>
              <p className="text-sm text-blue-700 mt-1">
                เหลือเวลาอีก <strong>{Math.max(0, daysRemaining)} วัน</strong> ครบกำหนดคืนวันที่ {fmtDate(booking.endDate)}
              </p>
            </div>

            {/* After condition photos — owner uploads */}
            {isOwner && (
              <ConditionPhotoUpload
                bookingId={bookingId}
                phase="after"
                existingImages={bk.itemConditionAfter?.images || []}
                onSuccess={fetchAll}
              />
            )}

            {/* Confirm Return */}
            {(() => {
              const ownerReady = bk.itemConditionAfter?.images?.length > 0;
              const myConfirmed = isRenter ? bk.renterConfirmedReturn : bk.ownerConfirmedReturn;
              const canConfirm = isRenter ? !myConfirmed : (ownerReady && !myConfirmed);
              return (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-3">
                    {isRenter ? '🔄 ยืนยันคืนของ' : '✅ ยืนยันรับของคืน'}
                  </h2>
                  {isOwner && !ownerReady && (
                    <p className="text-sm text-amber-600 mb-3">⚠️ กรุณาอัปโหลดรูปสภาพสินค้าหลังรับคืนก่อน</p>
                  )}
                  <div className="flex gap-4 text-sm mb-3">
                    <span className={bk.renterConfirmedReturn ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      {bk.renterConfirmedReturn ? '✅' : '⏳'} ผู้เช่า
                    </span>
                    <span className={bk.ownerConfirmedReturn ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      {bk.ownerConfirmedReturn ? '✅' : '⏳'} เจ้าของ
                    </span>
                  </div>
                  {myConfirmed ? (
                    <p className="text-green-700 font-medium">✅ คุณยืนยันแล้ว รอฝั่งตรงข้าม...</p>
                  ) : canConfirm ? (
                    <button onClick={handleConfirmReturn} disabled={actionLoading} className="w-full py-3 bg-primary text-gray-900 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50">
                      {isRenter ? '🔄 ยืนยันการคืนของ' : '✅ ยืนยันรับของคืนสำเร็จ'}
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">กรุณาอัปโหลดรูปสภาพสินค้าก่อน</p>
                  )}
                </div>
              );
            })()}
          </>
        )}

        {/* ══════════════ COMPLETED ══════════════ */}
        {booking.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-semibold text-green-800">🎉 การเช่าเสร็จสมบูรณ์!</p>
            {isOwner && payment && (
              <p className="text-sm text-green-700 mt-1">💰 คุณได้รับ ฿{payment.ownerReceivesAmount.toLocaleString()} (หักค่าบริการ {payment.platformFeePercent}% แล้ว)</p>
            )}
          </div>
        )}

        {/* ── Review (COMPLETED) ── */}
        {booking.status === 'completed' && reviewStatus && !reviewDone && (
          reviewStatus.alreadyReviewed ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-800 font-semibold">⭐ คุณให้คะแนนแล้ว ขอบคุณ!</p>
            </div>
          ) : reviewStatus.canReview && !showReviewForm ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-yellow-900">อย่าลืมให้คะแนน ⭐</p>
                <p className="text-sm text-yellow-700">ช่วยสร้างความน่าเชื่อถือในชุมชน</p>
              </div>
              <button onClick={() => setShowReviewForm(true)} className="ml-4 px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 whitespace-nowrap">
                ให้คะแนน ⭐
              </button>
            </div>
          ) : showReviewForm && revieweeId ? (
            <ReviewForm
              bookingId={bookingId}
              revieweeId={revieweeId}
              revieweeType={revieweeType}
              revieweeName={revieweeName || ''}
              onSuccess={() => { setShowReviewForm(false); setReviewDone(true); }}
              onCancel={() => setShowReviewForm(false)}
            />
          ) : null
        )}

        {/* ── Action Buttons ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-wrap gap-3">
            {booking.status === BookingStatus.PENDING && isOwner && (
              <>
                <button onClick={() => handleStatusUpdate(BookingStatus.CONFIRMED)} disabled={actionLoading} className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">✅ ยืนยันการจอง</button>
                <button onClick={() => handleStatusUpdate(BookingStatus.REJECTED)} disabled={actionLoading} className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">❌ ปฏิเสธการจอง</button>
              </>
            )}
            {[BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status) && (
              <button onClick={handleCancel} disabled={actionLoading} className="px-5 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50">ยกเลิกการจอง</button>
            )}
            <button onClick={() => router.push('/bookings')} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">กลับไปหน้าการจอง</button>
          </div>
        </div>
      </div>

      {/* ── Payment Reject Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">ปฏิเสธหลักฐานชำระเงิน</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผล (ไม่บังคับ)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="เช่น: ยอดเงินไม่ถูกต้อง" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium">ยกเลิก</button>
              <button onClick={() => handleVerifyPayment('reject')} disabled={actionLoading} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50">ยืนยันปฏิเสธ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
