// Đặt sân thật: bảng bookings, lịch cố định hội viên, tính giá theo bảng giá, kiểm tra trùng lịch, hủy & hoàn ví.
import {db,patchMember,fmt,endAt} from './db';
db.version(5).stores({ courts: 'id,st', revenue: '++id,at', products: 'id,cat', orders: '++id,at,status', members: 'id,tier', pricing: 'id', proposals: 'id,status', audit: 'id,status', bookings: '++id,courtId,memberId,date,status' });
export const OPEN = 5.5, CLOSE = 23.5;
// Lịch bận cố định của từng sân (dữ liệu demo, lặp mỗi ngày). Sân bảo trì được xử lý theo trạng thái sân.
export const DEMO_BUSY = { 1: [[17, 21, 'Nhóm Tân Sơn Nhất']], 2: [[8, 16.5, 'Lớp Năng khiếu Trẻ'], [18, 20, 'Khách đặt trước']], 3: [[18, 22, 'Nhóm anh Tuấn']], 4: [[19, 21, 'Khách chờ 19:00']], 5: [], 6: [], 7: [[8, 21, 'Giải phong trào Tân Bình']], 8: [[8, 9, 'Huấn luyện 1-kèm-1'], [17.5, 22, 'Đã cọc ca tối']] };
const p2 = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const fh = h => `${p2(Math.floor(h))}:${h % 1 ? '30' : '00'}`;
const ov = (a, b, c, d) => a < d && c < b;
export const dow = s => new Date(s + 'T00:00').getDay();
export const ts = b => new Date(b.date + 'T00:00').getTime() + b.start * 36e5;
export const hoursUntil = b => (ts(b) - Date.now()) / 36e5;
const hrOf = t => { const d = new Date(t); return d.getHours() + d.getMinutes() / 60; };
// ---- Giá theo bảng giá (Cài đặt giá) ----
export const tierOf = (c, cfg) => (c.vip && cfg.tiers[1]) || cfg.tiers[0];
export function priceFor(t, cfg, date, start, hours) {
  const we = [0, 6].includes(dow(date)); let sum = 0;
  for (let h = start; h < start + hours - 1e-9; h += .5) sum += (we ? t.weekend : h >= cfg.peak.from && h < cfg.peak.to ? t.peak : h < 14 ? t.low : t.std) / 2;
  return Math.round(sum / 1000) * 1000;
}
export const rentFor = (c, s, cfg) => priceFor(tierOf(c, cfg), cfg, ymd(new Date(s.start)), Math.floor(hrOf(s.start) * 2) / 2, s.hours);
// ---- Lịch cố định của hội viên ----
const DW = { T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6, CN: 0 };
export const fdays = m => m?.fixed ? m.fixed.days.split('-').map(x => DW[x]).filter(x => x !== undefined) : [];
export const ftime = m => m.fixed.time.split(' - ').map(x => { const [a, b] = x.split(':'); return +a + (+b) / 60; });
const fcourts = m => [...m.fixed.court.matchAll(/\d+/g)].map(x => +x[0]);
// ---- Các khối thời gian của một sân trong ngày: nguồn duy nhất cho lưới admin và website khách ----
export function courtBlocks(court, date, books, members = [], live = false) {
  if (court.st === 'maint') return [{ f: 6, t: 23, k: 'maint', l: court.sub || 'Bảo trì' }];
  const out = [];
  (DEMO_BUSY[court.id] || []).forEach(([a, b, l]) => out.push({ f: a, t: b, k: 'busy', l: l || 'Đã đặt' }));
  members.forEach(m => { if (m.fixed && fcourts(m).includes(court.id) && fdays(m).includes(dow(date))) { const [a, b] = ftime(m); out.push({ f: a, t: b, k: 'fixed', l: `${m.name} • Cố định` }); } });
  books.filter(b => b.status === 'confirmed' && b.courtId === court.id && b.date === date).forEach(b => out.push({ f: b.start, t: b.start + b.hours, k: b.src === 'counter' ? 'counter' : 'online', l: `${b.name} • ${b.code}`, bid: b.id }));
  if (live && court.session) { const f = hrOf(court.session.start), t = hrOf(endAt(court.session)); if (t > f) out.push({ f, t, k: 'playing', l: `${court.session.customer} • Đang chơi` }); }
  return out.sort((a, b) => a.f - b.f);
}
export const isBusy = (c, date, s, h, books, members = []) => courtBlocks(c, date, books, members, date === ymd(new Date())).some(b => ov(s, s + h, b.f, b.t));
export function memberConflict(m, date, s, h, books) {
  const own = books.find(b => b.status === 'confirmed' && b.memberId === m.id && b.date === date && ov(s, s + h, b.start, b.start + b.hours));
  if (own) return `Bạn đã có lịch đặt khác trùng giờ này (${own.courtName}, mã ${own.code}).`;
  if (m.fixed && fdays(m).includes(dow(date))) { const [a, b] = ftime(m); if (ov(s, s + h, a, b)) return `Trùng lịch cố định ${m.fixed.court} (${m.fixed.time}) của bạn.`; }
  return null;
}
export function fixedNext(m, n) {
  const out = [], days = fdays(m); if (!m?.fixed) return out; const [a, b] = ftime(m);
  for (let i = 0; i < 28 && out.length < n; i++) { const d = new Date(Date.now() + i * 864e5); if (!days.includes(d.getDay())) continue; const date = ymd(d); if (new Date(date + 'T00:00').getTime() + b * 36e5 > Date.now()) out.push({ date, start: a, end: b, court: m.fixed.court }); }
  return out;
}
export const createBooking = ({ court, me, name, phone, date, start, hours, amount, pay, src = 'online' }) => db.transaction('rw', db.bookings, db.courts, db.members, async () => {
  const all = await db.bookings.toArray(), mem = await db.members.toArray();
  if (isBusy(court, date, start, hours, all, mem)) throw new Error('Rất tiếc, khung giờ này vừa có người đặt. Vui lòng chọn giờ khác.');
  if (me) { const c = memberConflict(me, date, start, hours, all); if (c) throw new Error(c); const m = await db.members.get(me.id); if (pay === 'wallet' && m.wallet < amount) throw new Error('Số dư ví không đủ.'); }
  const code = 'SP-' + Math.floor(Math.random() * 9000 + 1000);
  await db.bookings.add({ courtId: court.id, courtName: court.name, memberId: me?.id || null, name, phone, date, start, hours, amount, pay, src, status: 'confirmed', code, createdAt: Date.now() });
  const cur = await db.courts.get(court.id);
  if (date === ymd(new Date())) await db.courts.update(court.id, { evening: true, ...(cur.st === 'free' ? { st: 'booked', sub: `Đặt trước ${fh(start)} • ${name}` } : {}) });
  if (me) await patchMember(me.id, m => { if (pay === 'wallet') m.wallet -= amount; m.points += Math.round(amount / 1000);
    m.history.unshift({ k: 'court', t: `${court.name} • ${fh(start)} - ${fh(start + hours)}`, s: `${date.split('-').reverse().slice(0, 2).join('/')} • ${pay === 'wallet' ? 'Trừ vào ví' : 'VietQR'} • ${code}`, r: pay === 'wallet' ? '-' + fmt(amount) : 'Đã đặt' }); return m; });
  return { code };
});
export const cancelBooking = (id, opts = {}) => db.transaction('rw', db.bookings, db.courts, db.members, async () => {
  const b = await db.bookings.get(id); if (!b || b.status !== 'confirmed') return { refund: 0 };
  const refund = (opts.force || hoursUntil(b) >= 4) ? b.amount : 0;
  await db.bookings.update(id, { status: 'cancelled', refund, cancelledAt: Date.now() });
  if (b.memberId) await patchMember(b.memberId, m => { if (refund) { m.wallet += refund; m.points = Math.max(0, m.points - Math.round(b.amount / 1000)); }
    m.history.unshift({ k: refund ? 'topup' : 'court', t: `${refund ? 'Hoàn tiền hủy sân' : 'Hủy sân (không hoàn)'} • ${b.courtName}`, s: `${b.code} • ${fh(b.start)}`, r: refund ? '+' + fmt(refund) : 'Đã hủy' }); return m; });
  const left = await db.bookings.where('courtId').equals(b.courtId).filter(x => x.status === 'confirmed' && x.date === b.date).count(); const c = await db.courts.get(b.courtId);
  if (!left && b.date === ymd(new Date()) && c.st === 'booked' && c.sub?.startsWith('Đặt trước')) await db.courts.update(b.courtId, { st: 'free', sub: 'Sân đang trống', evening: false });
  return { refund };
});
