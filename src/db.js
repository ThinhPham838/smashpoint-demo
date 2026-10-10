import Dexie from 'dexie';
// Database chạy trong trình duyệt (IndexedDB) – không cần server, không cần MySQL.
export const db = new Dexie('smashpoint-v2');
db.version(1).stores({ courts: 'id,st', revenue: '++id,at' });
db.version(2).stores({ courts: 'id,st', revenue: '++id,at', products: 'id,cat', orders: '++id,at,status' });

export const MENU = [
  { name: 'Ống Cầu Thành Công (12 quả)', price: 250000 },
  { name: 'Nước điện giải Revive Chanh Muối', price: 15000 },
  { name: 'Thuê vợt Yonex Astrox 77', price: 40000 },
];
export const fmt = n => n.toLocaleString('vi-VN') + 'đ';
export const total = (s, rent) => (rent ?? s.rate * s.hours) + s.items.reduce((a, i) => a + i.price * i.qty, 0);
export const endAt = s => s.start + s.hours * 3600000;
export const hhmm = t => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

const H = 3600000;
const seedSession = {
  customer: 'CLB Tân Sơn Nhất', avatar: 'TS', phone: '0988.234.567', tier: 'Khách Thân Thiết (Cấp Bạc)',
  start: Date.now() - (2 * H - (28 * 60 + 14) * 1000), hours: 2, rate: 180000, checkedIn: true,
  items: [
    { name: 'Ống Cầu Thành Công (12 quả)', price: 250000, qty: 1 },
    { name: 'Nước điện giải Revive Chanh Muối', price: 15000, qty: 5 },
    { name: 'Thuê vợt Yonex Astrox 77', price: 40000, qty: 2 },
  ],
};
const mini = (customer, minLeft) => ({ customer, avatar: customer.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase(), phone: '0903.000.111', tier: 'Khách lẻ', start: Date.now() - (2 * H - minLeft * 60000), hours: 2, rate: 180000, checkedIn: true, items: [] });

export async function seedDb() {
  if (await db.courts.count()) return;
  await db.courts.bulkAdd([
    { id: 1, name: 'Sân 1', tag: 'Enlio Pro', st: 'playing', sub: 'Đang thi đấu', evening: true, blocks: [{ f: 7, t: 15, k: 'note', l: 'Các ca sáng & chiều đã hoàn tất' }], session: seedSession },
    { id: 2, name: 'Sân 2', tag: 'Enlio', st: 'ready', sub: 'Sẵn sàng ca tối', evening: true, blocks: [{ f: 7.8, t: 15, k: 'note', l: 'Lớp Năng khiếu Trẻ (08:00 - 16:30)' }] },
    { id: 3, name: 'Sân 3', tag: 'Cố định', st: 'playing', sub: 'Đang chơi (Ca cố định)', evening: true, blocks: [{ f: 9, t: 15, k: 'empty', l: 'Trống ca trưa' }], session: mini('Nhóm anh Tuấn', 45) },
    { id: 4, name: 'Sân 4', tag: 'Enlio', st: 'waiting', sub: 'Chờ khách tới (19:00)', evening: true, blocks: [{ f: 11, t: 15, k: 'note', l: 'Đã kết thúc ca chiều' }] },
    { id: 5, name: 'Sân 5', tag: 'Enlio', st: 'free', sub: 'Sân đang trống', evening: false, blocks: [{ f: 8, t: 15, k: 'empty', l: 'Trống ca ban ngày' }] },
    { id: 6, name: 'Sân 6', tag: 'Bảo dưỡng', st: 'maint', sub: 'Bảo trì giàn đèn LED', evening: true, blocks: [{ f: 7, t: 15, k: 'maint', l: 'Tạm ngưng phục vụ đến 22:00: Kỹ thuật thay mới 4 chóa đèn chống chói' }] },
    { id: 7, name: 'Sân VIP 7', tag: 'Yonex Pro', st: 'playing', sub: 'Đang thi đấu bán kết', evening: true, vip: true, blocks: [{ f: 7, t: 15, k: 'note', l: 'Giải phong trào Tân Bình (08:00 - 17:00)' }], session: mini('Giải Tân Bình', 50) },
    { id: 8, name: 'Sân VIP 8', tag: 'Camera AI', st: 'booked', sub: 'Đã cọc ca tối', evening: true, vip: true, blocks: [{ f: 8, t: 15, k: 'note', l: 'Huấn luyện cá nhân 1-kèm-1' }] },
  ]);
}
export const startSession = (c, customer) => db.courts.update(c.id, { st: 'playing', sub: 'Đang thi đấu', session: { customer: customer || 'Khách lẻ', avatar: (customer || 'KL').slice(0, 2).toUpperCase(), phone: '—', tier: 'Khách lẻ', start: Date.now(), hours: 2, rate: 180000, checkedIn: false, items: [] } });
export const extend = c => db.courts.update(c.id, { 'session.hours': c.session.hours + 0.5 });
export const toggleCheckin = c => db.courts.update(c.id, { 'session.checkedIn': !c.session.checkedIn });
export const addItem = (c, m) => {
  const items = c.session.items.map(i => ({ ...i })); const f = items.find(i => i.name === m.name);
  f ? f.qty++ : items.push({ ...m, qty: 1 });
  return db.courts.update(c.id, { 'session.items': items });
};
export const checkout = (c, amount) => db.transaction('rw', db.courts, db.revenue, async () => {
  await db.revenue.add({ at: Date.now(), amount: amount ?? total(c.session), court: c.name });
  await db.courts.update(c.id, { st: 'free', sub: 'Sân đang trống', evening: false, session: undefined });
});
export const swapCourt = async (c, target) => db.transaction('rw', db.courts, async () => {
  await db.courts.update(target.id, { st: 'playing', sub: 'Đang thi đấu', session: c.session });
  await db.courts.update(c.id, { st: 'free', sub: 'Sân đang trống', session: undefined });
});
export const resetDemo = async () => { await db.delete(); location.reload(); };

export const PRODUCTS = [
  { id: 'p1', cat: 'drink', name: 'Revive Chanh Muối', sub: 'Nước tăng lực & bù khoáng', price: 15000, unit: 'chai', stock: 48 },
  { id: 'p2', cat: 'drink', name: 'Pocari Sweat 500ml', sub: 'Bù điện giải', price: 20000, unit: 'chai', stock: 36 },
  { id: 'p3', cat: 'drink', name: 'Nước suối Aura', sub: 'Nước khoáng tinh khiết', price: 10000, unit: 'chai', stock: 120 },
  { id: 'p4', cat: 'drink', name: 'Red Bull Thái', sub: 'Nước tăng lực', price: 20000, unit: 'lon', stock: 54 },
  { id: 'p5', cat: 'shuttle', name: 'Ống cầu Thành Công Đỏ', sub: 'Ống 12 quả cầu', price: 260000, unit: 'ống', stock: 30, badge: 'Bán chạy', hot: 1 },
  { id: 'p6', cat: 'shuttle', name: 'Victor Champion No.1', sub: 'Tiêu chuẩn thi đấu', price: 310000, unit: 'ống', stock: 18 },
  { id: 'p7', cat: 'shuttle', name: 'Quả cầu lẻ từng quả', sub: 'Cầu lẻ từng quả', price: 25000, unit: 'quả', badge: 'Bán lẻ', lt: 1 },
  { id: 'p8', cat: 'service', name: 'Thuê vợt Astrox 77', sub: 'Thuê thiết bị', price: 40000, unit: 'giờ', badge: 'Dịch vụ', per: '/h' },
  { id: 'p9', cat: 'acc', name: 'Quấn cán Yonex', sub: 'Phụ kiện vợt', price: 25000, unit: 'cuộn', badge: 'Free size', hot: 1 },
  { id: 'p10', cat: 'service', name: 'Dịch vụ căng vợt', sub: 'Dịch vụ đan vợt', price: 80000, unit: 'lần', badge: 'Kỹ thuật', hot: 1 },
  { id: 'p11', cat: 'drink', name: 'Thanh năng lượng', sub: 'Năng lượng tức thì', price: 25000, unit: 'thanh', badge: 'Snack', lt: 1 },
  { id: 'p12', cat: 'acc', name: 'Tất thể thao dệt kim', sub: 'Tất dày dặn', price: 45000, unit: 'đôi', stock: 24 },
];
export const seedProducts = async () => { if (!(await db.products.count())) await db.products.bulkAdd(PRODUCTS); };
export const placeOrder = (o) => db.transaction('rw', db.orders, db.products, db.revenue, async () => {
  await db.orders.add({ ...o, status: 'paid', at: Date.now() });
  for (const l of o.lines) { const p = await db.products.get(l.id); if (p && p.stock != null) await db.products.update(l.id, { stock: Math.max(0, p.stock - l.qty) }); }
  await db.revenue.add({ at: Date.now(), amount: o.due, court: 'POS' });
});
export const saveDraft = o => db.orders.add({ ...o, status: 'draft', at: Date.now() });

db.version(3).stores({ courts: 'id,st', revenue: '++id,at', products: 'id,cat', orders: '++id,at,status', members: 'id,tier' });
const H0 = (t, s, r, k = 'court') => ({ k, t, s, r });
export const MEMBERS = [
  { id: 'KH0012', seed: 1, name: 'Trần Quang Minh', phone: '0912.334.556', sub: '0912.334.556', tier: 'diamond', wallet: 1850000, points: 3820, debt: 0, tags: ['Đánh cầu tay trái', 'Thích cầu Hải Yến đỏ', 'Ưu tiên sân thảm Yonex'],
    fixed: { short: 'S1', court: 'Sân 1', days: '3-5-7', daysLong: 'Thứ 3 - Thứ 5 - Thứ 7', time: '19:00 - 21:00', dur: '2h/buổi', price: 2400000, left: 6, expire: '31/10/2025' },
    history: [H0('Sân 1 • 19:00 - 21:00', 'Hôm nay, 24/10/2025 (Lịch cố định)', 'Đã Check-in'), H0('1x Ống Cầu Hải Yến S90 + 2 Nước', '22/10/2025 • Trừ vào ví trả trước', '-290.000đ', 'buy'), H0('Sân 1 • 19:00 - 21:00', '22/10/2025 (Lịch cố định)', 'Hoàn thành'), H0('Nạp tiền vào ví điện tử (Chuyển khoản)', '15/10/2025 • GD: #TOP99201', '+2.000.000đ', 'topup')] },
  { id: 'KH0045', seed: 1, name: 'CLB Tân Bình Bad', phone: '0903.882.119', sub: 'Trưởng nhóm: Lê Hoàng (0903.882.119)', tier: 'club', wallet: 4200000, points: 8900, debt: 0, tags: ['Nhóm 12 người', 'Xuất hóa đơn công ty'],
    fixed: { short: 'S4', court: 'Sân 4 & Sân 5', days: 'T2-T4-T6', daysLong: 'Thứ 2 - Thứ 4 - Thứ 6', time: '17:00 - 19:00', dur: '2h/buổi', price: 9600000, left: 9, expire: '31/10/2025' },
    history: [H0('Sân 4 & Sân 5 • 17:00 - 19:00', '23/10/2025 (Lịch cố định)', 'Hoàn thành'), H0('Nạp tiền vào ví điện tử (Chuyển khoản)', '10/10/2025 • GD: #TOP98110', '+5.000.000đ', 'topup')] },
  { id: 'KH0089', seed: 1, name: 'Nguyễn Thùy Linh', phone: '0988.223.111', sub: '0988.223.111', tier: 'gold', wallet: 150000, points: 1450, debt: 0, tags: ['Chơi đôi nam nữ'], fixed: null,
    history: [H0('Sân 3 • 20:00 - 21:00', '20/10/2025', 'Hoàn thành'), H0('2x Nước Revive', '20/10/2025 • Trừ vào ví', '-30.000đ', 'buy')] },
  { id: 'KH0102', seed: 1, name: 'Vũ Đức Cường', phone: '0977.112.443', sub: '0977.112.443', tier: 'silver', wallet: 0, points: 310, debt: 240000, debtNote: 'Nợ nước & cầu hôm qua', tags: ['Hay đến sớm'],
    fixed: { short: 'S2', court: 'Sân 2', days: 'T7-CN', daysLong: 'Thứ 7 - Chủ Nhật', time: '08:00 - 10:00', dur: '2h/buổi', price: 1600000, left: 4, expire: '31/10/2025' },
    history: [H0('Sân 2 • 08:00 - 10:00', '19/10/2025 (Lịch cố định)', 'Hoàn thành'), H0('Ống cầu + 3 Nước (ghi nợ)', '23/10/2025', '-240.000đ', 'buy')] },
  { id: 'KH0120', seed: 1, name: 'Phạm Gia Hân', phone: '0935.667.201', sub: '0935.667.201', tier: 'gold', wallet: 620000, points: 2100, debt: 0, tags: ['Đánh cầu tay phải'], fixed: null, history: [H0('Sân 5 • 18:00 - 19:00', '21/10/2025', 'Hoàn thành')] },
  { id: 'KH0133', seed: 1, name: 'Đặng Quốc Bảo', phone: '0966.554.320', sub: '0966.554.320', tier: 'silver', wallet: 80000, points: 540, debt: 0, tags: ['Thuê vợt thường xuyên'], fixed: null, history: [H0('Sân 6 • 19:00 - 20:00', '18/10/2025', 'Hoàn thành')] },
  { id: 'KH0150', seed: 1, name: 'CLB Phú Nhuận Smash', phone: '0918.772.003', sub: 'Trưởng nhóm: Ngô Phát (0918.772.003)', tier: 'club', wallet: 2300000, points: 5200, debt: 0, tags: ['Nhóm 8 người'],
    fixed: { short: 'S3', court: 'Sân 3', days: 'T3-T5', daysLong: 'Thứ 3 - Thứ 5', time: '20:00 - 22:00', dur: '2h/buổi', price: 3200000, left: 7, expire: '31/10/2025' }, history: [H0('Sân 3 • 20:00 - 22:00', '23/10/2025 (Lịch cố định)', 'Hoàn thành')] },
  { id: 'KH0171', seed: 1, name: 'Lê Thanh Tâm', phone: '0902.118.889', sub: '0902.118.889', tier: 'diamond', wallet: 3100000, points: 6400, debt: 0, tags: ['Ưu tiên sân VIP'], fixed: null, history: [H0('Sân VIP 7 • 19:00 - 21:00', '22/10/2025', 'Hoàn thành')] },
];
export const SEED_WALLET = MEMBERS.reduce((a, m) => a + m.wallet, 0) + 1250000;
export const seedMembers = async () => { if (!(await db.members.count())) await db.members.bulkAdd(MEMBERS); };
export const patchMember = (id, fn) => db.transaction('rw', db.members, async () => { const m = await db.members.get(id); await db.members.put(fn(JSON.parse(JSON.stringify(m)))); });
export const addMember = m => db.members.add(m);

// Hội viên gắn với tài khoản Customer demo (Minh Tuấn)
export const CUSTOMER_MEMBER = { id: 'KH0201', seed: 1, name: 'Minh Tuấn', phone: '0908.***.892', sub: '0908.***.892', tier: 'gold', wallet: 1250000, points: 2450, debt: 0, tags: ['Chơi đôi nam nữ', 'Hay đặt ca tối'],
  fixed: { short: 'S2', court: 'Sân 2', days: 'T3-T5', daysLong: 'Thứ 3 - Thứ 5', time: '19:00 - 21:00', dur: '2h/buổi', price: 1800000, left: 4, expire: '31/10/2025' },
  history: [{ k: 'court', t: 'Sân 2 • 19:00 - 21:00', s: '21/10/2025 (Lịch cố định)', r: 'Hoàn thành' }, { k: 'buy', t: '2x Nước Revive + 1 Ống cầu', s: '21/10/2025 • Trừ vào ví', r: '-280.000đ' }, { k: 'topup', t: 'Nạp tiền vào ví (VietQR)', s: '15/10/2025 • GD: #TOP88120', r: '+1.000.000đ' }, { k: 'court', t: 'Sân 2 • 19:00 - 21:00', s: '16/10/2025 (Lịch cố định)', r: 'Hoàn thành' }] };
export const ensureCustomer = async () => { if (!(await db.members.get('KH0201'))) await db.members.add(CUSTOMER_MEMBER); };
