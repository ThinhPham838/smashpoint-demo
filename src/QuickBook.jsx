import {useEffect,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {Banknote,QrCode} from 'lucide-react';
import {db,fmt} from './db';
import {CFG} from './pricedb';
import {OPEN,CLOSE,fh,ymd,priceFor,tierOf,isBusy,createBooking} from './booking';
import {Modal,Toast,useToast} from './ui';
const nowH=()=>{const n=new Date();return n.getHours()+n.getMinutes()/60};
export default function QuickBook({open,preset,onClose}){
  const cfg=useLiveQuery(()=>db.pricing.get('cfg'),[])||CFG,courts=useLiveQuery(()=>db.courts.toArray(),[],[]),books=useLiveQuery(()=>db.bookings.toArray(),[],[]),mems=useLiveQuery(()=>db.members.toArray(),[],[]);
  const[f,setF]=useState({date:ymd(new Date()),cid:null,start:17,hours:1,name:'',phone:'',pay:'cash'}),[toast,note]=useToast();
  useEffect(()=>{if(!open)return;const today=ymd(new Date()),d=preset?.date||today,ns=Math.min(22,Math.max(OPEN,Math.ceil(nowH()*2)/2));
    setF(x=>({...x,date:d,start:d===today?Math.max(preset?.start??ns,ns):Math.max(preset?.start??17,OPEN),cid:preset?.courtId??null,hours:1,name:'',phone:''}))},[open]);
  const today=ymd(new Date()),minS=f.date===today?Math.max(OPEN,Math.ceil(nowH()*2)/2):OPEN,starts=[];for(let h=OPEN;h<=CLOSE-1;h+=.5)if(h>=minS)starts.push(h);
  const S=starts.includes(f.start)?f.start:(starts[0]??OPEN),H=Math.min(f.hours,CLOSE-S),avail=courts.filter(c=>c.st!=='maint');
  const cid=f.cid??avail.find(c=>!isBusy(c,f.date,S,H,books,mems))?.id??avail[0]?.id,court=courts.find(c=>c.id===cid);
  const busy=court?isBusy(court,f.date,S,H,books,mems):true,amount=court?priceFor(tierOf(court,cfg),cfg,f.date,S,H):0;
  const submit=async()=>{try{const b=await createBooking({court,me:null,name:f.name||'Khách lẻ',phone:f.phone,date:f.date,start:S,hours:H,amount,pay:f.pay,src:'counter'});onClose();note(`Đã tạo lịch ${court.name} ${fh(S)}-${fh(S+H)} • mã ${b.code}`)}catch(e){note(e.message)}};
  return(<><Modal open={open} onClose={onClose} title="Đặt sân nhanh tại quầy"><div className="qb">
    <div className="qb-row"><label><small>Ngày</small><select value={f.date} onChange={e=>setF({...f,date:e.target.value})}>{[...Array(7)].map((_,i)=>{const d=new Date(Date.now()+i*864e5);return<option key={i} value={ymd(d)}>{i?d.toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit'}):'Hôm nay - '+d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}</option>})}</select></label>
      <label><small>Sân</small><select value={cid??''} onChange={e=>setF({...f,cid:+e.target.value})}>{avail.map(c=><option key={c.id} value={c.id}>{c.name}{isBusy(c,f.date,S,H,books,mems)?' (kín)':''}</option>)}</select></label></div>
    <div className="qb-row"><label><small>Giờ bắt đầu</small><select value={S} onChange={e=>setF({...f,start:+e.target.value})}>{starts.map(h=><option key={h} value={h}>{fh(h)}</option>)}</select></label>
      <label><small>Số giờ</small><select value={H} onChange={e=>setF({...f,hours:+e.target.value})}>{[1,1.5,2,2.5,3].filter(x=>S+x<=CLOSE).map(x=><option key={x} value={x}>{x} giờ</option>)}</select></label></div>
    <div className="qb-row"><input className="inp" placeholder="Tên khách" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input className="inp" placeholder="Số điện thoại" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div>
    <div className="cs-pm"><button className={f.pay==='cash'?'on':''} onClick={()=>setF({...f,pay:'cash'})}><Banknote size={16}/> Tiền mặt</button><button className={f.pay==='transfer'?'on':''} onClick={()=>setF({...f,pay:'transfer'})}><QrCode size={16}/> Chuyển khoản</button></div>
    {busy&&<p className="qb-warn">Khung giờ này đã có lịch. Chọn giờ hoặc sân khác.</p>}
    <div className="qb-sum"><span>{court?.name} • {fh(S)} - {fh(S+H)} ({H} giờ)</span><b>{fmt(amount)}</b></div>
    <button className="gbtn wide" disabled={busy||!court} onClick={submit}>Xác nhận đặt sân</button></div></Modal><Toast msg={toast}/></>);
}
