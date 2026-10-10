import {Fragment,memo,useCallback,useEffect,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {motion,AnimatePresence} from 'motion/react';
import {Trophy,ShieldCheck,Globe,PanelLeft,LayoutGrid,Store,Users,TrendingUp,SlidersHorizontal,Search,ChevronDown,ChevronLeft,ChevronRight,PlusCircle,Bell,Pencil,Timer,ArrowLeftRight,QrCode,UserCheck,CalendarDays,Wrench,Phone,Lightbulb,DoorOpen,Clock,Headset,RefreshCw,CirclePlus,Plus} from 'lucide-react';
import {db,seedDb,startSession,extend,addItem,checkout,swapCourt,toggleCheckin,resetDemo,fmt,total,endAt,hhmm,MENU} from './db';
import Shuttle from './Shuttle';
import {IconBox,Modal,Toast,useToast} from './ui';
import Pos from './Pos';
import Customer from './Customer';
const MCustomer=memo(Customer);
import {can,useAuth} from './auth';
import Login from './Login';
import QuickBook from './QuickBook';
import {courtBlocks,fh,ymd,rentFor,cancelBooking} from './booking';
import {CFG,seedPricing} from './pricedb';
import OnlineBookings from './OnlineBookings';
import UserMenu from './UserMenu';
import Roles,{Denied} from './Roles';
import Members from './Members';
import Reports from './Reports';
import Pricing from './Pricing';
import Audit from './Audit';
import Approvals from './Approvals';

const COL={playing:'#0b6b4a',waiting:'#b45309',maint:'#b91c1c',ready:'#5d7068',booked:'#5d7068',free:'#5d7068'};
const hms=ms=>{const s=Math.max(0,Math.floor(ms/1000));return [s/3600|0,(s%3600)/60|0,s%60].map(x=>String(x).padStart(2,'0')).join(':')};
const NAV=[['Sơ đồ & Lịch sân',LayoutGrid],['Bán hàng & POS',Store],['Hội viên & Khách hàng',Users],['Báo cáo & Thống kê',TrendingUp],['Cài đặt giá & Sân',SlidersHorizontal]];
const SLOTS=['07:00 - 09:00','09:00 - 11:00','11:00 - 13:00','13:00 - 15:00'];
const TABS=[['Tất cả 8 sân',()=>true],['Sân Thường (1-6)',c=>!c.vip],['VIP Yonex Pro (7-8)',c=>c.vip]];

function Count({to,suffix='',money}){const[v,setV]=useState(0);
  useEffect(()=>{let r,t0=performance.now();const f=n=>{const p=Math.min((n-t0)/800,1);setV(Math.round(to*(1-(1-p)**3)));if(p<1)r=requestAnimationFrame(f)};r=requestAnimationFrame(f);return()=>cancelAnimationFrame(r)},[to]);
  return (money?fmt(v):v)+suffix}

export default function App(){
  const{user}=useAuth();const courts=useLiveQuery(()=>db.courts.toArray(),[]);const books=useLiveQuery(()=>db.bookings.toArray(),[],[]);const mems=useLiveQuery(()=>db.members.toArray(),[],[]);const cfg=useLiveQuery(()=>db.pricing.get('cfg'),[])||CFG;const[tmsg,tnote]=useToast();
  const[mini,setMini]=useState(innerWidth<1300&&innerWidth>900),[drawer,setDrawer]=useState(false),[narrow,setNarrow]=useState(innerWidth<=820),[win,setWin]=useState(()=>new Date().getHours()<14?'am':'pm'),[qb,setQb]=useState(null),[bi,setBi]=useState(null),[sel,setSel]=useState(1),[now,setNow]=useState(Date.now()),[tab,setTab]=useState(0),[nav,setNav]=useState(0),[off,setOff]=useState(0),[menu,setMenu]=useState(false),[name,setName]=useState('');
  useEffect(()=>{seedDb();seedPricing()},[]);useEffect(()=>{setNav(user?.role==='customer'?7:0)},[user?.role]);
  useEffect(()=>{const h=()=>{setNarrow(innerWidth<=820);if(innerWidth>820)setDrawer(false)};addEventListener('resize',h);return()=>removeEventListener('resize',h)},[]);
  const goAdmin=useCallback(()=>setNav(0),[]);useEffect(()=>{if(nav!==0)return;const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[nav]);
  if(!user)return <Login/>;
  if(!courts)return null;
  if(user.role==='customer'||(nav===7&&can('customer')))return <MCustomer onBack={can('admin')?goAdmin:null}/>;
  const c=courts.find(x=>x.id===sel),list=courts.filter(TABS[tab][1]);
  const active=courts.filter(x=>x.st!=='maint'&&x.st!=='free').length,playing=courts.filter(x=>x.st==='playing').length,soon=courts.filter(x=>x.st==='waiting'||x.st==='booked').length;
  const full=courts.filter(x=>x.evening).length,free=courts.filter(x=>!x.evening),pct=Math.round(full/courts.length*100);
  const d=new Date(Date.now()+off*864e5);let dl=new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}).format(d);dl=dl[0].toUpperCase()+dl.slice(1);
  const quick=()=>{setNav(0);setQb({preset:{}})};
  const s=c?.session,left=s?endAt(s)-now:0,freeTarget=courts.find(x=>x.st==='free');const rent=c&&s?rentFor(c,s,cfg):0;const[wa,wb]={am:[6,14],pm:[14,23],all:[6,23]}[win],dateStr=ymd(new Date(Date.now()+off*864e5));
  const pick=(e,k)=>{if(k.st==='maint')return tnote('Sân đang bảo trì, không thể đặt');const r=e.currentTarget.getBoundingClientRect(),h=wa+Math.floor(((e.clientX-r.left)/r.width)*(wb-wa)*2)/2;setQb({preset:{courtId:k.id,date:dateStr,start:Math.min(h,22)}})};
  const KINDL={playing:'Đang chơi trực tiếp',busy:'Đã đặt trước (dữ liệu demo)',online:'Khách đặt online qua website',counter:'Khách đặt tại quầy',fixed:'Lịch cố định tháng của hội viên',maint:'Sân đang bảo trì'};
  return(<div className={'shell'+(mini&&!narrow?' mini':'')+(drawer?' drawer':'')}>
    {drawer&&<div className="scrim" onClick={()=>setDrawer(false)}/>}<aside className="side">
      <div className="brand"><div className="mark"><Trophy size={20}/></div><div><b>SmashPoint</b><em>PRO</em><small>CN Tân Bình • 8 Sân</small></div></div>
      <p className="cap">ĐIỀU HÀNH SÂN</p>
      {NAV.map(([t,I],i)=><Fragment key={t}><a className={nav===i?'on':''} onClick={()=>{setNav(i);setDrawer(false)}}>{nav===i&&<motion.span layoutId="pill" className="pill"/>}<I size={18}/><i>{t}</i></a>{i===4&&nav>=4&&[[5,'Xét duyệt đề xuất giá'],[6,'Lịch sử giá & Audit Log']].map(([n,l])=><a key={n} className={'subl'+(nav===n?' on':'')} onClick={()=>{setNav(n);setDrawer(false)}}>{l}</a>)}</Fragment>)}
      {can('customer')&&<><p className="cap">KHÁCH HÀNG</p><a className="cus" onClick={()=>{setNav(7);setDrawer(false)}}><Globe size={18}/><i>Trang khách hàng</i></a></>}{can('root')&&<><p className="cap">ROOT</p><a className={'cus'+(nav===8?' on':'')} onClick={()=>{setNav(8);setDrawer(false)}}><ShieldCheck size={18}/><i>Tài khoản & Phân quyền</i></a></>}<div className="shift"><div className="r"><span><i className="dot"/> Ca Chiều (14:00 - 22:00)</span><u>Đổi ca</u></div><small>NV trực: {user.name}</small><div className="r hot"><span><Headset size={14}/> Hotline kỹ thuật</span><b>1900 6886</b></div></div>
    </aside>
    <div className="body">
      <div className="top">
        <button className="burger" onClick={()=>narrow?setDrawer(d=>!d):setMini(m=>!m)}><PanelLeft size={17}/></button><div className="search"><Search size={16}/><input placeholder="Tìm kiếm ..."/></div>
        <button className="fsel">Cơ sở 1: Tân Bình (8 sân) <ChevronDown size={14}/></button>
        <span className="livepill"><i className="dot"/>{active}/8<span className="ctl2">&nbsp;Sân đang hoạt động</span></span>
        <motion.button whileHover={{y:-2}} whileTap={{scale:.96}} className="cta" onClick={quick}><PlusCircle size={18}/><span className="ctl">Đặt Sân Nhanh</span></motion.button>
        <span className="sp"/><span className="bell"><Bell size={20}/><i/></span>
        <UserMenu/>
      </div>
      <motion.div key={nav} className="pgw" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.28}}>{nav===1?<Pos/>:nav===2?<Members/>:nav===3?<Reports/>:nav===8?(can('root')?<Roles/>:<Denied/>):nav===4?<Pricing go={setNav}/>:nav===5?<Approvals/>:nav===6?<Audit go={setNav}/>:<div className="content">
        <div className="left">
          <div className="card datebar">
            <div className="dn"><div className="nav2"><button onClick={()=>setOff(off-1)}><ChevronLeft size={16}/></button><span className="dt"><CalendarDays size={16}/> {dl} {off===0&&<em>HÔM NAY</em>}</span><button onClick={()=>setOff(off+1)}><ChevronRight size={16}/></button></div>
              <div className="tabs">{TABS.map(([t],i)=><button key={t} className={tab===i?'on':''} onClick={()=>setTab(i)}>{i===2&&<i className="bd"/>}{t}</button>)}</div></div>
            <div className="legend"><span><i style={{background:'#e8eef8'}}/>Sân trống</span><span><i style={{background:'#0b6b4a'}}/>Đang chơi (Trực tiếp)</span><span><i style={{background:'#4b5568'}}/>Đã cọc / Đặt trước</span><span><i style={{background:'#dbe4fb'}}/>Cố định tháng</span><span><i style={{background:'#dfe9e3'}}/>Bảo trì / Vệ sinh</span></div>
          </div>
          <div className="card tl">
            <div className="tlh"><h2>Lưới điều phối sân trực tiếp</h2><em className="rtb">THỜI GIAN THỰC</em><span className="seg3">{[['am','06–14h'],['pm','14–23h'],['all','Cả ngày']].map(([k,l])=><button key={k} className={win===k?'on':''} onClick={()=>setWin(k)}>{l}</button>)}</span><span className="chip"><RefreshCw size={13}/> Đồng bộ (15s)</span><button className="ghost" onClick={resetDemo}>Reset demo</button></div>
            <div className="tlr head"><div>SÂN / MẶT SÂN</div><div className="hrs" style={{gridTemplateColumns:`repeat(${wb-wa},1fr)`}}>{[...Array(wb-wa)].map((_,i)=><span key={i}>{String(wa+i).padStart(2,'0')}h</span>)}</div></div>
            {list.map((k,i)=>{const bl=courtBlocks(k,dateStr,books,mems,off===0);return<motion.div key={k.id} layout initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{type:'spring',stiffness:260,damping:26,delay:i*.05}} className={'tlr row'+(sel===k.id?' sel':'')} onClick={()=>setSel(sel===k.id?null:k.id)}>
              <div className="cn"><h4>{k.vip&&<span className="vipi">♛</span>}{k.name}<span className={'tg'+(k.vip?' vip':'')}>{k.tag}</span></h4><small style={{color:COL[k.st]}}>{k.st==='playing'&&<i className="dot"/>}{k.sub}</small></div>
              <div className="track" style={{'--n':wb-wa}} title="Bấm vào ô trống để đặt sân" onClick={e=>{e.stopPropagation();pick(e,k)}}>{bl.map((b,j)=>{const f=Math.max(b.f,wa),t=Math.min(b.t,wb);if(t<=f)return null;return<div key={j} className={'blk '+b.k} title={`${b.l} • ${fh(b.f)}-${fh(b.t)}`} style={{left:(f-wa)/(wb-wa)*100+'%',width:(t-f)/(wb-wa)*100+'%'}} onClick={e=>{e.stopPropagation();setBi({b,court:k})}}>{b.k==='maint'&&<Wrench size={13}/>}<span className="bt">{b.l}</span></div>})}</div>
            </motion.div>})}
            <div className="foot"><span><DoorOpen size={15}/> Hiện đang đánh: <b>{playing} Sân</b></span><span><Clock size={15}/> Sắp nhận sân trong 30p: <b>{soon} Lượt</b></span><p>Ghi chú vận hành: <strong>Nhắc nhở khách thay giày cầu lông để kếp bảo vệ thảm trước khi vào sân.</strong></p></div>
          </div>
        </div>
        <div className="right">
          <div className="card panel"><div className="ph"><h2><i className="dot"/> Chi tiết lượt chơi</h2>{c&&<em className="rtb">{c.name.toUpperCase()} {c.st==='playing'?'ĐANG ĐẤU':c.sub.toUpperCase()}</em>}</div>
            <AnimatePresence mode="wait"><motion.div key={(c?.id||0)+(c?.st||'')} initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-18}} className="pb">
              {!c&&<div className="empty"><div className="s3"><Shuttle/></div><p>Chọn một sân để xem chi tiết</p></div>}
              {c&&c.st==='free'&&<div><input className="inp" placeholder="Tên khách / đội" value={name} onChange={e=>setName(e.target.value)}/><button className="cta wide" onClick={()=>{startSession(c,name);setName('')}}>Bắt đầu lượt chơi (2 giờ)</button></div>}
              {c&&!s&&c.st!=='free'&&<p className="mute">{c.sub}</p>}
              {s&&<>
                <div className="cust"><span className="tsav">{s.avatar}</span><div><b>{s.customer}</b><small><Phone size={12}/> {s.phone} (Đại diện)</small><strong>{s.tier}</strong></div><Pencil size={15}/></div>
                <div className="two"><div className="mini"><small>Khung giờ đặt</small><b>{hhmm(s.start)} - {hhmm(endAt(s))}</b><small>{s.hours.toFixed(1)} giờ tiêu chuẩn</small></div>
                  <div className="mini"><small>Thời gian còn lại</small><b className={'cd'+(left<6e5?' bad':'')}><Timer size={18}/> {hms(left)}</b><small className="red">Hết giờ lúc {hhmm(endAt(s))}</small></div></div>
                <div className="sv"><b>Dịch vụ & Đồ uống đã gọi</b><u onClick={()=>setMenu(!menu)}>+ Gọi thêm đồ</u></div>
                <AnimatePresence>{menu&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="chips">{MENU.map(m=><button key={m.name} onClick={()=>addItem(c,m)}><Plus size={12}/>{m.name}</button>)}</motion.div>}</AnimatePresence>
                <ul className="bill"><li><span>Tiền thuê {c.name} ({s.hours} giờ • bq {fmt(Math.round(rent/s.hours))}/giờ)</span><b>{fmt(rent)}</b></li>
                  {s.items.map(i=><li key={i.name}><span>{i.qty}x {i.name}</span><b>{fmt(i.price*i.qty)}</b></li>)}
                  <li className="tot"><span>Tổng tạm tính</span><h3><Count to={total(s,rent)} money/></h3></li></ul>
                <div className="act"><button className="soft" onClick={()=>extend(c)}><Timer size={15}/> +30p Gia hạn</button><button className="soft" disabled={!freeTarget} onClick={async()=>{await swapCourt(c,freeTarget);setSel(freeTarget.id)}}><ArrowLeftRight size={15}/> Đổi sân</button>
                  <button className="slate" onClick={()=>toggleCheckin(c)}><UserCheck size={16}/> {s.checkedIn?'Đã Check-in':'Check-in'}</button><button className="pay" onClick={()=>checkout(c,total(s,rent))}><QrCode size={18}/> Thanh toán ngay</button></div></>}
            </motion.div></AnimatePresence></div>
          <OnlineBookings/><div className="card occ"><div className="oh"><div><h3>Tỷ lệ lấp đầy hôm nay</h3><small>Giờ cao điểm tối (17:00 - 22:00)</small></div><b><Count to={pct} suffix="%"/></b></div>
            <div className="bar"><motion.i initial={{width:0}} animate={{width:pct+'%'}} transition={{duration:1.2,ease:'easeOut'}}/></div>
            <div className="ol"><span>{full}/8 Sân kín chỗ</span><span className="br">{free.length?`Chỉ còn ${free.length} sân trống (${free.map(f=>f.name).join(', ')})`:'Hết sân trống'}</span></div>
            <div className="cam"><div className="ln"/><span className="lv"><i/>LIVE</span><small>CAMERA TOÀN CẢNH ARENA</small><b>Tân Binh Court #1 - #8</b></div>
            <div className="tip"><Lightbulb size={20}/><div><b>Gợi ý thu ngân:</b><p>Sân VIP 7 có nhu cầu gia hạn thêm 30 phút sau 20:00. Ưu tiên liên hệ khách ca kế tiếp để linh hoạt sắp xếp Sân VIP 8.</p></div></div></div>
        </div>
      </div>}</motion.div>
    </div><QuickBook open={!!qb} preset={qb?.preset} onClose={()=>setQb(null)}/>
    <Modal open={!!bi} onClose={()=>setBi(null)} title={bi?`${bi.court.name} • ${fh(bi.b.f)} - ${fh(bi.b.t)}`:''}>{bi&&<><p><b>{bi.b.l}</b></p><p className="mute">{KINDL[bi.b.k]}</p>{bi.b.bid&&<button className="rjb wide" onClick={async()=>{await cancelBooking(bi.b.bid,{force:true});setBi(null);tnote('Đã hủy lịch đặt, hoàn tiền đầy đủ cho khách (nếu đã trả qua ví)')}}>Hủy lịch này</button>}{bi.b.k==='fixed'&&<p className="mute">Lịch cố định hàng tuần, quản lý tại trang Hội viên.</p>}</>}</Modal>
    <Toast msg={tmsg}/></div>);
}
