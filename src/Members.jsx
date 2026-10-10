import {useMemo,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {motion,AnimatePresence} from 'motion/react';
import {Download,CalendarPlus,UserPlus,ScanLine,SlidersHorizontal,RefreshCw,Search,UsersRound,CalendarDays,Banknote,Wallet,TrendingUp,ArrowUp,BadgeCheck,Pencil,Repeat,Info,UserCheck,ShoppingBag,CircleDollarSign,Gem,Crown,Medal,Users,Gift,ShieldCheck,Plus} from 'lucide-react';
import {db,ensureCustomer,seedMembers,patchMember,addMember,SEED_WALLET,fmt} from './db';
import {Num,download,Modal,Toast,useToast,IconBox} from './ui';
import {useEffect} from 'react';
import avatar from './assets/m1.jpg';

const T={diamond:{l:'VIP DIAMOND',card:'Hội Viên Kim Cương',I:Gem,cls:'dia'},gold:{l:'VIP GOLD',card:'Hội Viên Vàng',I:Crown,cls:'gold'},silver:{l:'THÀNH VIÊN BẠC',card:'Hội Viên Bạc',I:Medal,cls:'silver'},club:{l:'THẺ CLB ĐOÀN',card:'Thẻ CLB Đoàn',I:Users,cls:'club'}};
const COLORS=['#dff3ea','#ffe7c9','#dce9ff','#e6defa','#fde0e0'];
const HI={court:UserCheck,buy:ShoppingBag,topup:CircleDollarSign};
const PAGE=4;
export function QR({id}){let h=[...id].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);const n=21,cells=[];
  const fin=(x,y)=>(x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(fin(x,y)){const a=x%14,b=y%14,on=a===0||a===6||b===0||b===6||(a>=2&&a<=4&&b>=2&&b<=4);if(on)cells.push([x,y])}else{h=(h*1103515245+12345)>>>0;if(h>>>16&1)cells.push([x,y])}}
  return<svg viewBox="0 0 21 21" width="76" height="76">{cells.map(([x,y])=><rect key={x+'-'+y} x={x} y={y} width="1" height="1" fill="#0b1c30"/>)}</svg>}

export default function Members(){
  const all=useLiveQuery(()=>db.members.toArray(),[]);
  const[sel,setSel]=useState('KH0012'),[q,setQ]=useState(''),[tier,setTier]=useState('all'),[debt,setDebt]=useState(false),[page,setPage]=useState(1),[modal,setModal]=useState(null),[f,setF]=useState({}),[amt,setAmt]=useState(500000),[toast,note]=useToast();
  useEffect(()=>{seedMembers().then(ensureCustomer)},[]);
  const list=useMemo(()=>(all||[]).filter(m=>(tier==='all'||(tier==='fixed'?m.fixed:m.tier===tier))&&(!debt||m.debt>0)&&(m.name+m.phone+m.id).toLowerCase().replace(/\./g,'').includes(q.toLowerCase().replace(/\./g,''))),[all,q,tier,debt]);
  if(!all)return null;
  const extra=all.filter(m=>!m.seed),cur=all.find(m=>m.id===sel)||all[0];
  const pages=Math.max(1,Math.ceil(list.length/PAGE)),pg=Math.min(page,pages),rows=list.slice((pg-1)*PAGE,pg*PAGE);
  const base={diamond:18,gold:64,silver:145},cnt=t=>base[t]+extra.filter(m=>m.tier===t).length;
  const walletTotal=32150000+all.reduce((a,m)=>a+m.wallet,0)-SEED_WALLET;
  const submit=async()=>{if(!f.name)return note('Vui lòng nhập tên');const n=300+extra.length,id='KH'+String(n).padStart(4,'0'),g=modal==='group';
    await addMember({id,name:f.name,phone:f.phone||'—',sub:g?`Trưởng nhóm: ${f.name}`:f.phone||'—',tier:g?'club':f.tier||'silver',wallet:0,points:0,debt:0,tags:[],history:[],
      fixed:g?{short:'N'+n%10,court:f.court||'Sân 1',days:f.days||'T2-T4-T6',daysLong:f.days||'T2-T4-T6',time:f.time||'17:00 - 19:00',dur:'2h/buổi',price:2400000,left:12,expire:'30/11/2025'}:null});
    setModal(null);setF({});setSel(id);note('Đã tạo '+id)};
  const topup=async()=>{await patchMember(cur.id,m=>{m.wallet+=amt;m.history.unshift({k:'topup',t:'Nạp tiền vào ví điện tử (Tiền mặt)',s:'Vừa xong • GD: #TOP'+Math.floor(Math.random()*90000+10000),r:'+'+fmt(amt)});return m});setModal(null);note('Đã nạp '+fmt(amt))};
  const redeem=async()=>{if(cur.points<1000)return note('Cần tối thiểu 1.000 điểm');await patchMember(cur.id,m=>{m.points-=1000;m.wallet+=50000;m.history.unshift({k:'topup',t:'Đổi 1.000 điểm thưởng sang ví',s:'Vừa xong',r:'+50.000đ'});return m});note('Đổi 1.000 điểm = 50.000đ vào ví')};
  const renew=async()=>{const x=cur.fixed;if(cur.wallet<x.price)return note('Số dư ví không đủ để gia hạn');await patchMember(cur.id,m=>{m.wallet-=x.price;m.fixed.left+=12;m.fixed.expire='30/11/2025';m.history.unshift({k:'buy',t:'Gia hạn lịch cố định Tháng 11',s:'Vừa xong • Trừ vào ví',r:'-'+fmt(x.price)});return m});note('Đã gia hạn tháng 11')};
  const scan=()=>{const m=all[Math.floor(Math.random()*all.length)];setSel(m.id);note('Quét thẻ: '+m.name)};
  const exp=()=>download('hoi-vien.csv',[['Mã KH','Tên','SĐT','Hạng','Ví','Điểm','Công nợ'],...all.map(m=>[m.id,m.name,m.phone,T[m.tier].l,m.wallet,m.points,m.debt])]);
  const T2=T[cur.tier];
  return(<div className="pgm">
    <div className="pgh"><div><p className="crumb">QUẢN LÝ HỆ THỐNG <i>›</i> <b>KHÁCH HÀNG & GÓI THÀNH VIÊN</b></p><h1>Hồ sơ Hội viên & Lịch Đánh Cố Định</h1><p className="sub">Theo dõi hạn mức thẻ nạp, phân quyền lịch vĩnh viễn và kiểm soát công nợ quầy bar trực tiếp.</p></div>
      <div className="acts"><button className="wbtn" onClick={exp}><Download size={17}/> Xuất Excel</button><button className="bbtn" onClick={()=>setModal('group')}><CalendarPlus size={17}/> + Thêm nhóm cố định</button><button className="gbtn" onClick={()=>setModal('member')}><UserPlus size={18}/> + Đăng ký hội viên mới</button></div></div>
    <div className="mk">{[['TỔNG SỐ HỘI VIÊN',<Num to={342+extra.length}/>,UsersRound,'#006948','#e5f0ec','+18 mới tháng này','92% active'],['KHÁCH CỐ ĐỊNH TUẦN',<><Num to={46}/> <small>nhóm</small></>,CalendarDays,'#825100','#ffddb8','Phủ kín 78% khung 18h-21h','8 sân'],['DOANH THU THẺ THÁNG NÀY',<Num to={58400000} money/>,Banknote,'#00855d','#d8f1e6','+14.2% so với T9','Mục tiêu 65M'],['SỐ DƯ VÍ KÝ GỬI TRẢ TRƯỚC',<Num to={walletTotal} money/>,Wallet,'#565e74','#dce9ff','112 tài khoản có số dư > 0','Đảm bảo dòng tiền']].map(([t,v,I,c,bg,a,b],i)=>
      <motion.div key={t} className="card mkc" style={{'--c':c}} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.07}}><div className="mkt"><span>{t}</span><IconBox I={I} c={c} size={38} icon={19}/></div><h2>{v}</h2><div className="mkf"><em>{i<3&&<TrendingUp size={14}/>} {a}</em><span>{b}</span></div></motion.div>)}</div>
    <div className="m2">
      <div>
        <div className="card ms"><div className="sr"><div className="sbox"><Search size={20}/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Tìm theo Tên, SĐT, Mã thẻ RFID / Barcode"/><button className="scanb" onClick={scan}><ScanLine size={14}/> QUÉT THẺ</button></div>
          <button className={'fbtn'+(debt?' on':'')} onClick={()=>setDebt(!debt)}><SlidersHorizontal size={16}/> Lọc nâng cao</button><button className="fbtn sq" onClick={()=>{setQ('');setTier('all');setDebt(false);setPage(1)}}><RefreshCw size={17}/></button></div>
          <div className="tchips">{[['all',`Tất cả (${342+extra.length})`],['diamond',`Hạng Kim Cương (${cnt('diamond')})`],['gold',`Hạng Vàng (${cnt('gold')})`],['silver',`Hạng Bạc (${cnt('silver')})`],['fixed','Khách đánh cố định']].map(([k,l])=><button key={k} className={tier===k?'on':''} onClick={()=>{setTier(k);setPage(1)}}>{['diamond','gold','silver'].includes(k)&&<i className={'tdot '+k}/>}{l}</button>)}</div></div>
        <div className="card mt"><div className="mr mh"><span>MÃ KH</span><span>KHÁCH HÀNG / SĐT</span><span>HẠNG THẺ</span><span>LỊCH CỐ ĐỊNH</span><span className="rt">SỐ DƯ VÍ / ĐIỂM</span><span className="rt">CÔNG NỢ</span></div>
          <AnimatePresence mode="popLayout">{rows.map((m,i)=>{const t=T[m.tier];return<motion.div layout key={m.id} initial={{opacity:0,x:-14}} animate={{opacity:1,x:0}} exit={{opacity:0}} transition={{delay:i*.04}} className={'mr mrow'+(sel===m.id?' sel':'')+(m.debt?' debt':'')} onClick={()=>setSel(m.id)}>
            <b className="mid">{m.debt>0?<em>!</em>:<i/>}{m.id}</b>
            <div className="mc"><span className="mav" style={{background:COLORS[m.id.charCodeAt(5)%5]}}>{m.name.replace('CLB ','')[0]}</span><div><b>{m.name}</b><small>{m.sub}</small></div></div>
            <span><em className={'tb '+t.cls}><t.I size={14}/>{t.l}</em></span>
            <span className="fx">{m.fixed?<><b><i className={'fd '+t.cls}/>{m.fixed.court}</b>{m.fixed.days} • {m.fixed.time.replace(' - ','-')}</>:<i>Khách vãng lai thân thiết</i>}</span>
            <span className="rt"><b className="gr">{fmt(m.wallet)}</b><small>{m.points.toLocaleString('vi-VN')} pts</small></span>
            <span className="rt">{m.debt>0?<><b className="rd">-{fmt(m.debt)}</b><small className="rd">{m.debtNote}</small></>:'0đ'}</span></motion.div>})}</AnimatePresence>
          {!rows.length&&<p className="mute" style={{padding:24}}>Không tìm thấy hội viên phù hợp.</p>}
          <div className="mf"><span>Hiển thị <b>{list.length?(pg-1)*PAGE+1:0} - {Math.min(pg*PAGE,list.length)}</b> của <b>{list.length}</b> khách hàng</span>
            <div className="pgn"><button onClick={()=>setPage(Math.max(1,pg-1))}>Trước</button>{[...Array(pages)].map((_,i)=><button key={i} className={pg===i+1?'on':''} onClick={()=>setPage(i+1)}>{i+1}</button>)}<button onClick={()=>setPage(Math.min(pages,pg+1))}>Sau</button></div></div></div>
      </div>
      <AnimatePresence mode="wait"><motion.aside key={cur.id} className="card mp" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
        <div className="mph">{cur.id==='KH0012'?<span className="pa"><img src={avatar} alt=""/><i/></span>:<span className="pa l" style={{background:COLORS[cur.id.charCodeAt(5)%5]}}>{cur.name.replace('CLB ','')[0]}</span>}
          <div><h3>{cur.name} <BadgeCheck size={18} color="#006948"/></h3><small>{cur.phone}</small><strong>{T2.l} • ID: {cur.id}</strong></div><Pencil size={16}/></div>
        <div className={'pass '+T2.cls}><small>SMASHPOINT ARENA PASS</small><h4>{T2.card}</h4><span className="qr"><QR id={cur.id}/></span>
          <div className="pb2"><div><small>Số dư ví trả trước</small><b>{cur.wallet.toLocaleString('vi-VN')}<i>vnd</i></b></div><div className="r"><small>Tích điểm thưởng</small><b className="s">{cur.points.toLocaleString('vi-VN')} pts</b></div></div></div>
        <div className="two2"><button className="gbtn" onClick={()=>setModal('topup')}><Wallet size={17}/> Nạp tiền ví</button><button className="bbtn" onClick={redeem}><Gift size={17}/> Đổi quà điểm</button></div>
        {cur.fixed&&<div className="fxc"><div className="fxh"><span><Repeat size={16}/> Lịch đánh cố định (Tháng 10/2025)</span><em>Còn {cur.fixed.left} buổi</em></div>
          <div className="fxi"><span className="s1b">{cur.fixed.short}</span><div><b>{cur.fixed.daysLong}</b><small>{cur.fixed.time} ({cur.fixed.dur})</small></div><strong>{fmt(cur.fixed.price)}/tháng</strong></div>
          <div className="fxf"><span><Info size={14}/> Hết hạn: {cur.fixed.expire}</span><button onClick={renew}>Gia hạn Tháng 11</button></div></div>}
        <div className="hh"><b>LỊCH SỬ SÂN & CHECK-IN GẦN NHẤT</b><u>Xem tất cả ({142})</u></div>
        <div className="hl">{cur.history.slice(0,4).map((h,i)=>{const I=HI[h.k];return<motion.div key={i+h.t} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="hi"><span className={'hic '+h.k}><I size={17}/></span><div><b>{h.t}</b><small>{h.s}</small></div><em className={h.r.startsWith('+')?'gr':h.r.startsWith('-')?'':'ok2'}>{h.r}</em></motion.div>})}</div>
        <div className="tg2">{cur.tags.map(t=><span key={t}>{t}</span>)}</div>
      </motion.aside></AnimatePresence>
    </div>
    <Modal open={modal==='member'||modal==='group'} onClose={()=>setModal(null)} title={modal==='group'?'Thêm nhóm cố định':'Đăng ký hội viên mới'}>
      <input className="inp" placeholder={modal==='group'?'Tên CLB / nhóm':'Họ và tên'} onChange={e=>setF({...f,name:e.target.value})}/><input className="inp" placeholder="Số điện thoại" onChange={e=>setF({...f,phone:e.target.value})}/>
      {modal==='group'?<><input className="inp" placeholder="Sân (vd: Sân 4 & Sân 5)" onChange={e=>setF({...f,court:e.target.value})}/><input className="inp" placeholder="Ngày (vd: T2-T4-T6)" onChange={e=>setF({...f,days:e.target.value})}/><input className="inp" placeholder="Giờ (vd: 17:00 - 19:00)" onChange={e=>setF({...f,time:e.target.value})}/></>
        :<select className="inp" onChange={e=>setF({...f,tier:e.target.value})}><option value="silver">Hạng Bạc</option><option value="gold">Hạng Vàng</option><option value="diamond">Hạng Kim Cương</option></select>}
      <button className="gbtn wide" onClick={submit}>Lưu</button></Modal>
    <Modal open={modal==='topup'} onClose={()=>setModal(null)} title={`Nạp ví • ${cur.name}`}>
      <div className="chipsr">{[100000,200000,500000,1000000].map(a=><button key={a} className={amt===a?'on':''} onClick={()=>setAmt(a)}>{fmt(a)}</button>)}</div><button className="gbtn wide" onClick={topup}>Xác nhận nạp {fmt(amt)}</button></Modal>
    <Toast msg={toast}/>
  </div>);
}
