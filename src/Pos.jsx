import {useEffect,useRef,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {motion,AnimatePresence} from 'motion/react';
import {Calculator,Receipt,Banknote,ScanBarcode,X,SlidersHorizontal,Timer,Clock,Lightbulb,Sparkles,ChevronDown,Lock,Minus,Plus,Trash2,Percent,CheckCircle2,QrCode,Wallet,Printer,Save,XCircle,Keyboard,LayoutGrid,CupSoda,Feather,Wrench,Shirt,Zap,Crown,UserRound,CircleCheck} from 'lucide-react';
import {db,seedProducts,placeOrder,saveDraft,fmt} from './db';
import {priceFor,ymd} from './booking';
import {CFG} from './pricedb';
import Shuttle from './Shuttle';
import {IconBox} from './ui';

const IMG=import.meta.glob('./assets/p*.jpg',{eager:true,query:'?url',import:'default'});
const img=id=>IMG[`./assets/${id}.jpg`];
const SUR=[{id:'s30',name:'+30 phút sân',price:60000,I:Timer},{id:'s60',name:'+60 phút sân',price:120000,I:Clock},{id:'den',name:'Bật đèn đêm',price:20000,I:Lightbulb},{id:'vs',name:'Vệ sinh sân',price:30000,I:Sparkles}];
const CATS=[['all','Tất cả',LayoutGrid],['drink','Nước giải khát & Năng lượng',CupSoda],['shuttle','Cầu lông (Ống/Quả)',Feather],['service','Thuê vợt & Giày',Wrench],['acc','Phụ kiện',Shirt]];
const CTX=[
  {id:'s2',label:'Sân 2 • Anh Tuấn',time:'Khung giờ: 18:00 - 20:00 (Đang chơi)',court:'Sân 2',rent:240000,note:'120.000đ × 2 giờ',vip:true,tier:'Hội viên VIP Gold',phone:'0908.***.892',deposit:100000},
  {id:'s1',label:'Sân 1 • CLB Tân Sơn Nhất',time:'Khung giờ: 17:00 - 19:00 (Đang chơi)',court:'Sân 1',rent:360000,note:'180.000đ × 2 giờ',vip:false,tier:'Khách Thân Thiết (Cấp Bạc)',phone:'0988.***.567',deposit:0},
  {id:'walk',label:'Khách lẻ (không gắn sân)',time:'Bán hàng trực tiếp tại quầy',court:'',rent:0,note:'',vip:false,tier:'Khách vãng lai',phone:'—',deposit:0},
];
const START={p1:4,p5:1,p9:2};

export default function Pos(){
  const prods=useLiveQuery(()=>db.products.toArray(),[]);
  const paid=useLiveQuery(async()=>(await db.orders.where('status').equals('paid').toArray()),[],[]);
  const all=useLiveQuery(()=>db.orders.count(),[],0);
  const[cart,setCart]=useState(START),[cat,setCat]=useState('all'),[q,setQ]=useState(''),[stockOnly,setSO]=useState(false),[ci,setCi]=useState(0),[open,setOpen]=useState(false),[pm,setPm]=useState('cash'),[given,setGiven]=useState(500000),[toast,setToast]=useState(null);
  const sref=useRef();
  useEffect(()=>{seedProducts()},[]);
  const cfg=useLiveQuery(()=>db.pricing.get('cfg'),[])||CFG;
  const PR={s2:{st0:18,hours:2},s1:{st0:17,hours:2}},c0=CTX[ci],pr=PR[c0.id],tier=cfg.tiers[0],today=ymd(new Date());
  const rent0=pr?priceFor(tier,cfg,today,pr.st0,pr.hours):0,gp=cfg.tiering.gold||10;
  const ctx={...c0,rent:rent0,gp,note:pr?`${fmt(Math.round(rent0/pr.hours))} × ${pr.hours} giờ`:''};
  const extS=pr?pr.st0+pr.hours:Math.ceil((new Date().getHours()+new Date().getMinutes()/60)*2)/2;
  const SURD=SUR.map(s=>s.id==='s30'?{...s,price:priceFor(tier,cfg,today,extS,.5)}:s.id==='s60'?{...s,price:priceFor(tier,cfg,today,extS,1)}:s.id==='den'?{...s,price:cfg.night.amount}:s);
  const P=Object.fromEntries([...(prods||[]),...SURD.map(s=>({...s,sub:'Phụ thu sân',unit:'lần'}))].map(p=>[p.id,p]));
  const lines=Object.entries(cart).filter(([id,n])=>n>0&&P[id]).map(([id,n])=>({id,qty:n,name:P[id].name,price:P[id].price,unit:P[id].unit}));
  const sub=ctx.rent+lines.reduce((a,l)=>a+l.price*l.qty,0),vip=ctx.vip?Math.round(sub*ctx.gp/100):0,due=Math.max(0,sub-vip-ctx.deposit),change=Math.max(0,given-due);
  const sugg=[...new Set([Math.ceil(due/5e4)*5e4,Math.ceil(due/1e5)*1e5,1e6])].filter(x=>x>=due).slice(0,3);
  const add=(id,d=1)=>setCart(c=>({...c,[id]:Math.max(0,(c[id]||0)+d)}));
  const note=m=>{setToast(m);setTimeout(()=>setToast(null),2600)};
  const order={lines,ctx:ctx.label,sub,vip,deposit:ctx.deposit,due,pm};
  const pay=async()=>{if(!lines.length&&!ctx.rent)return note('Giỏ hàng đang trống');await placeOrder(order);note(`Đã in hóa đơn #HD-${8921+all} • ${fmt(due)}`);setCart({})};
  const draft=async()=>{await saveDraft(order);note('Đã lưu tạm đơn hàng')};
  const ref=useRef();ref.current={pay,draft};
  useEffect(()=>{const h=e=>{const m={F2:()=>sref.current?.focus(),F4:()=>ref.current.draft(),F8:()=>setPm('qr'),F9:()=>ref.current.pay()}[e.key];if(m){e.preventDefault();m()}};addEventListener('keydown',h);return()=>removeEventListener('keydown',h)},[]);
  if(!prods)return null;
  const shown=[...prods].sort((a,b)=>+a.id.slice(1)-+b.id.slice(1)).filter(p=>(cat==='all'||p.cat===cat)&&p.name.toLowerCase().includes(q.toLowerCase())&&(!stockOnly||p.stock==null||p.stock>0));
  const inv=42+paid.length,rev=14850000+paid.reduce((a,o)=>a+o.due,0);
  return(<div className="content pos">
    <div className="left">
      <div className="card phead"><IconBox I={Calculator} c="#006948" size={46} icon={22}/>
        <div><h1>Thu Ngân & Quầy Dịch Vụ POS <em className="rtb">TRỰC TIẾP</em></h1><p>Hệ thống đồng bộ tiền sân, dịch vụ nước, cầu lông và phụ kiện thể thao.</p></div>
        <div className="stat"><Receipt size={20}/><div><small>Hóa đơn trong ca:</small><b>{inv} đơn</b></div></div>
        <div className="stat"><Banknote size={20}/><div><small>Doanh thu thu quầy:</small><b className="g"><motion.span key={rev} initial={{opacity:.3}} animate={{opacity:1}}>{fmt(rev)}</motion.span></b></div></div></div>
      <div className="card scan"><div className="sr"><div className="sbox"><ScanBarcode size={22}/><input ref={sref} value={q} onChange={e=>setQ(e.target.value)} placeholder="Quét mã vạch sản phẩm (Barcode) hoặc gõ tên món hàng"/>{q&&<button onClick={()=>setQ('')}><X size={18}/></button>}</div>
        <button className={'fbtn'+(stockOnly?' on':'')} onClick={()=>setSO(!stockOnly)}><SlidersHorizontal size={16}/> Bộ lọc</button></div>
        <div className="sur"><b><Zap size={14}/> PHỤ THU SÂN:</b><div>{SURD.map(({id,name,price,I})=><motion.button whileTap={{scale:.95}} key={id} onClick={()=>add(id)}><I size={16}/>{name} ({fmt(price)})</motion.button>)}</div></div></div>
      <div className="ctabs">{CATS.map(([k,l,I])=><button key={k} className={cat===k?'on':''} onClick={()=>setCat(k)}><I size={16}/>{l}{k==='all'&&` (${prods.length})`}</button>)}</div>
      <motion.div layout className="pg"><AnimatePresence>{shown.map((p,i)=>
        <motion.button layout key={p.id} className="prod" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{delay:i*.03}} whileHover={{y:-4}} whileTap={{scale:.97}} onClick={()=>add(p.id)}>
          <div className="pimg"><img src={img(p.id)} alt=""/><span className={'bdg'+(p.hot?' hot':'')+(p.lt?' lt':'')}>{p.badge||`Còn ${p.stock}`}</span></div>
          <small>{p.sub}</small><h4>{p.name}</h4>
          <div className="pf"><b>{fmt(p.price)}<i>{p.per||''}</i></b><span className="plus"><Plus size={20}/></span></div>
        </motion.button>)}</AnimatePresence></motion.div>
    </div>
    <div className="right">
      <div className="card keys"><h5>PHÍM TẮT THAO TÁC NHANH</h5><div className="kr"><div>F2:<span>Tìm</span></div><div>F4:<span>Lưu tạm</span></div><div>F8:<span>VietQR</span></div><div>F9:<span>Thanh toán</span></div><Keyboard size={20}/></div></div>
      <div className="card asg"><div className="t"><span className="cap2">GÁN ĐƠN THANH TOÁN</span><span className="ok"><i className="dot"/>Đang khớp dữ liệu</span></div>
        <button className="ctx" onClick={()=>setOpen(!open)}><span className="i"><UserRound size={22}/></span><div><b>{ctx.label}</b><small>{ctx.time}</small></div><motion.span animate={{rotate:open?180:0}}><ChevronDown size={18}/></motion.span></button>
        <AnimatePresence>{open&&<motion.div className="ctxl" initial={{height:0}} animate={{height:'auto'}} exit={{height:0}}>{CTX.map((c,i)=><button key={c.id} onClick={()=>{setCi(i);setOpen(false)}}>{c.label}</button>)}</motion.div>}</AnimatePresence>
        <div className="vipr"><Crown size={20}/><b>{ctx.tier}</b>{ctx.vip&&<em>-{ctx.gp}% Phụ thu</em>}<span>SĐT: {ctx.phone}</span></div></div>
      <div className="card inv"><div className="invh"><h3>Chi tiết hóa đơn (#HD-{8921+all})</h3><small>{lines.length+(ctx.rent?1:0)} mục hàng</small></div>
        <div className="cl">
          {ctx.rent>0&&<div className="ln2 rent"><span className="ri"><Clock size={18}/></span><div className="nm"><b>Thuê {ctx.court} ({ctx.note.split('×')[1]?.trim()||''})</b><small>{ctx.note}</small></div><b>{fmt(ctx.rent)}</b><Lock size={14} color="#9aa7b8"/></div>}
          <AnimatePresence initial={false}>{lines.map(l=><motion.div layout key={l.id} className="ln2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
            <div className="qty"><button onClick={()=>add(l.id,-1)}><Minus size={14}/></button><span>{l.qty}</span><button onClick={()=>add(l.id)}><Plus size={14}/></button></div>
            <div className="nm"><b>{l.name}</b><small>{fmt(l.price)} / {l.unit}</small></div><b>{fmt(l.price*l.qty)}</b><button className="del" onClick={()=>setCart(c=>({...c,[l.id]:0}))}><Trash2 size={17}/></button></motion.div>)}</AnimatePresence>
          {!lines.length&&!ctx.rent&&<div className="empty"><div className="s3 sm"><Shuttle/></div><p>Chạm vào món hàng để thêm vào hóa đơn</p></div>}
        </div>
        <div className="sum2"><div className="r"><span>Tổng tiền dịch vụ & sân:</span><b>{fmt(sub)}</b></div>
          {vip>0&&<div className="r g"><span><Percent size={13}/> Ưu đãi Hội viên VIP (-{ctx.gp}%):</span><b>-{fmt(vip)}</b></div>}
          {ctx.deposit>0&&<div className="r"><span><CircleCheck size={13}/> Khách đã cọc trước (App):</span><b>-{fmt(ctx.deposit)}</b></div>}
          <div className="due"><div><small>KHÁCH CẦN THANH TOÁN</small><em>Đã gồm VAT & phụ phí</em></div><motion.b key={due} initial={{scale:1.12}} animate={{scale:1}}>{fmt(due)}</motion.b></div></div>
        <p className="cap2" style={{margin:'16px 0 0'}}>PHƯƠNG THỨC THANH TOÁN</p>
        <div className="pm">{[['qr','VietQR Tự Động',QrCode],['cash','Tiền Mặt',Banknote],['wallet','Ví Hội Viên',Wallet]].map(([k,l,I])=><button key={k} className={pm===k?'on':''} onClick={()=>setPm(k)}><I size={20}/>{l}</button>)}</div>
        {pm==='cash'&&<div className="cash"><div className="r"><span>Gợi ý tiền mặt khách đưa:</span><div className="sg">{sugg.map(x=><button key={x} className={given===x?'on':''} onClick={()=>setGiven(x)}>{x>=1e6?x/1e6*1000:x/1000}k</button>)}</div></div><div className="r"><span>Tiền thừa trả khách:</span><b className="red">{fmt(change)}</b></div></div>}
        <motion.button whileTap={{scale:.98}} className="print" onClick={pay}><Printer size={22}/>IN HÓA ĐƠN & HOÀN TẤT [F9]</motion.button>
        <div className="two2"><button onClick={draft}><Save size={17}/>Lưu tạm đơn [F4]</button><button className="d" onClick={()=>setCart({})}><XCircle size={17}/>Hủy đơn</button></div>
      </div>
    </div>
    <AnimatePresence>{toast&&<motion.div className="toast" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}><CheckCircle2 size={18} color="#5fe0ae"/>{toast}</motion.div>}</AnimatePresence>
  </div>);
}
