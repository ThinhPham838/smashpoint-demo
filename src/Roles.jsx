import {motion} from 'motion/react';
import {Check,X,Users,Crown,ShieldCheck,UserRound,Activity,Lock} from 'lucide-react';
import {IconBox} from './ui';
import {PERMS,ROLES} from './auth';
const MODS=[['Sơ đồ & Lịch sân','admin'],['Bán hàng & POS','admin'],['Hội viên & Khách hàng','admin'],['Báo cáo & Thống kê','admin'],['Cài đặt giá & Sân','admin'],['Xét duyệt đề xuất giá','admin'],['Lịch sử giá & Audit Log','admin'],['Website khách hàng','customer'],['Tài khoản & Phân quyền','root']];
const FAKE=[['Root Dev','root@smashpoint.vn','root','Hoạt động','Vừa xong','192.168.1.2'],['Admin Dev','admin@smashpoint.vn','admin','Hoạt động','5 phút trước','192.168.1.104'],['Bùi Anh Khoa','khoa.ba@smashpoint.vn','admin','Hoạt động','1 giờ trước','192.168.1.31'],['Trần Thúy Nga','nga.tt@smashpoint.vn','admin','Hoạt động','Hôm qua 17:40','192.168.1.18'],['Minh Tuấn','0908.***.892','customer','Hoạt động','Hôm nay 14:20','113.161.x.x'],['Hoàng Long','0912.***.450','customer','Hoạt động','Hôm qua','27.64.x.x'],['Đặng Khoa','0933.***.017','customer','Tạm khóa','3 ngày trước','14.186.x.x']];
export const Denied=()=><div className="pgm"><div className="card" style={{padding:40,textAlign:'center'}}><Lock size={30}/><h2>Bạn không có quyền truy cập trang này</h2><p className="mute">Liên hệ tài khoản Root để được cấp quyền.</p></div></div>;
export default function Roles(){
  return(<div className="pgm">
    <div className="pgh"><div><p className="crumb">CÀI ĐẶT HỆ THỐNG <i>›</i> <b>TÀI KHOẢN & PHÂN QUYỀN</b></p><h1>Tài khoản & Phân quyền truy cập</h1><p className="sub">Quản lý vai trò Root, Admin, Customer và phạm vi trang được phép truy cập. <b>Dữ liệu minh họa, chưa lưu database.</b></p></div></div>
    <div className="mk">{[['TỔNG TÀI KHOẢN','12',Users,'#006948','3 vai trò'],['ROOT','1',Crown,'#ba1a1a','Toàn quyền'],['ADMIN','4',ShieldCheck,'#00855d','Quản trị vận hành'],['CUSTOMER','7',UserRound,'#825100','Khách hàng website']].map(([t,v,I,c,s],i)=><motion.div key={t} className="card mkc" style={{'--c':c}} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}><div className="mkt"><span>{t}</span><IconBox I={I} c={c} size={36} icon={18}/></div><h2>{v}</h2><div className="mkf"><span>{s}</span></div></motion.div>)}</div>
    <div className="rl-g"><div className="card rl-t"><div className="rl-h"><h3>Danh sách tài khoản</h3><small className="mute">7 / 12 tài khoản hiển thị</small></div>
      <div className="rl-r rl-hd"><span>NGƯỜI DÙNG</span><span>VAI TRÒ</span><span>TRẠNG THÁI</span><span>ĐĂNG NHẬP GẦN NHẤT</span></div>
      {FAKE.map(([n,e,r,s,l,ip],i)=><motion.div key={e} className="rl-r" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:.05*i}}><span className="rl-u"><i className={'rl-av '+r}>{n[0]}</i><div><b>{n}</b><small>{e}</small></div></span><span><em className={'rb '+r}>{ROLES[r]}</em></span><span className={s==='Hoạt động'?'ok':'lk'}>{s==='Hoạt động'&&<i className="dot"/>}{s}</span><span><small>{l}<br/>{ip}</small></span></motion.div>)}</div>
    <div className="card rl-m"><div className="rl-h"><h3>Ma trận phân quyền</h3></div>
      <div className="rl-x rl-hd"><span>TRANG / CHỨC NĂNG</span>{Object.keys(ROLES).map(r=><span key={r}><em className={'rb '+r}>{ROLES[r]}</em></span>)}</div>
      {MODS.map(([m,p])=><div key={m} className="rl-x"><span>{m}</span>{Object.keys(ROLES).map(r=><span key={r}>{PERMS[r].includes(p)?<Check size={16} color="#006948"/>:<X size={15} color="#b9c2d0"/>}</span>)}</div>)}
      <p className="mute rl-n"><Activity size={13}/> Root kế thừa mọi quyền. Admin chỉ thấy trang quản trị. Customer chỉ thấy website khách hàng.</p></div></div></div>);
}
