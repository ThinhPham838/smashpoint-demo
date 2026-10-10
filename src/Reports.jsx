import {useMemo,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {motion} from 'motion/react';
import {ComposedChart,Bar,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell} from 'recharts';
import {Printer,FileSpreadsheet,FileText,ChevronDown,Banknote,UserRound,Coffee,Gauge,RefreshCw,Trophy,Lightbulb,Wrench,Package,Hand,Lock,CalendarDays,CircleCheck,Triangle} from 'lucide-react';
import {db,fmt} from './db';
import {Num,download,Modal,Toast,useToast,IconBox} from './ui';

const rnd=(i,s)=>{const x=Math.sin(i*12.9898+s*78.233)*43758.5453;return x-Math.floor(x)};
const norm=(a,t)=>{const r=a.map(v=>Math.round(v/a.reduce((x,y)=>x+y,0)*t/1000)*1000);r[r.length-1]+=t-r.reduce((x,y)=>x+y,0);return r};
const D=28,PEAK=18;
const MONTH=(()=>{const w=i=>((2+i)%7>=5?1.35:1);const c=[...Array(D)].map((_,i)=>(.6+rnd(i,1)*.8)*w(i)),f=[...Array(D)].map((_,i)=>(.6+rnd(i,2)*.8)*w(i)*.45);
  const rc=norm(c.filter((_,i)=>i!==PEAK),128900000-9850000),rf=norm(f.filter((_,i)=>i!==PEAK),57550000-4210000);
  return[...Array(D)].map((_,i)=>{const k=i<PEAK?i:i-1,court=i===PEAK?9850000:rc[k],fb=i===PEAK?4210000:rf[k];return{day:String(i+1).padStart(2,'0')+'/10',court,fb,total:court+fb}})})();
const HEAT=[[35,50,40,25,20,15,25,20,45,60,85,100,100,100,95,75,40,10],[40,55,45,30,25,20,30,25,50,65,90,100,100,100,100,80,45,15],[35,50,35,25,20,20,30,20,45,60,85,100,100,100,95,75,35,10],[40,55,40,25,25,20,25,25,50,65,90,100,100,100,100,85,40,15],[45,60,50,35,30,25,35,30,55,75,95,100,100,100,100,90,50,20],[60,85,100,100,85,60,50,65,80,95,100,100,100,100,100,95,75,40],[55,85,100,100,85,65,50,60,75,90,95,100,100,100,96,70,35,10]];
const DOW=['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];
const hc=v=>v>=90?'h4':v>=70?'h3':v>=30?'h2':'h1';
const COURTS=[['Sân VIP 07','Thảm BWF Pro',240,88.2,28500000,'Top Doanh Thu'],['Sân VIP 08','Thảm BWF Pro',218,80.1,25850000],['Sân Tiêu Chuẩn 01','Sàn Cao Su Enlio',195,71.6,17550000],['Sân Tiêu Chuẩn 02','Sàn Cao Su Enlio',188,69.1,16920000],['Sân Tiêu Chuẩn 03','Sàn Cao Su Enlio',176,64.7,15840000],['Sân Tiêu Chuẩn 04','Sàn Cao Su Enlio',162,59.5,14580000],['Sân Tiêu Chuẩn 05','Sàn Gỗ Thể Thao',135,49.6,12150000],['Sân Tiêu Chuẩn 06','Sàn Gỗ Thể Thao',121,44.5,10890000]];
const SORTS=[['Doanh thu cao nhất',4],['Hiệu suất cao nhất',3],['Giờ chơi nhiều nhất',2]];
const TOP=[['Nước Revive Chanh Muối (500ml)','920 chai','Đơn giá: 15.000đ • Biên lãi 48%',13800000,Coffee],['Ống Cầu Thành Công (Hộp Đỏ)','184 ống','Đơn giá: 250.000đ • Cầu thi đấu',46000000,Package],['Căng Cước Vợt Yonex BG65 / 66','45 cây','Máy điện tử Yonex Precision 9.0',6750000,Wrench],['Quấn Cán Vợt Yonex Super Grap','112 cái','Đơn giá: 35.000đ/cuộn',3920000,Hand],['Nước Điện Giải Pocari Sweat (500ml)','340 chai','Đơn giá: 18.000đ',6120000,Coffee]];
const COMP=[['Sân cố định tháng',89500000,'#006948','48%','#d8f1e6'],['Khách lẻ vãng lai',46612000,'#00a86b','25%','#d8f1e6'],['Nước giải khát & Cầu',37290000,'#825100','20%','#ffddb8'],['Căng cước & Thuê đồ',13048000,'#565e74','7%','#dce9ff']];
const RANGES=[['today','Hôm nay'],['7d','7 ngày qua'],['month','Tháng này (10/2025)'],['custom','Tùy chỉnh khoảng ngày']];
const money=n=>n.toLocaleString('vi-VN');

export default function Reports(){
  const orders=useLiveQuery(()=>db.orders.where('status').equals('paid').toArray(),[],[]);
  const[rg,setRg]=useState('month'),[sort,setSort]=useState(0),[spin,setSpin]=useState(0),[closed,setClosed]=useState(false),[confirm,setConfirm]=useState(false),[toast,note]=useToast();
  const data=useMemo(()=>{if(rg==='7d')return MONTH.slice(-7);if(rg==='today'){const l=MONTH[D-1],w=HEAT[1],s=w.reduce((a,b)=>a+b,0);return w.map((v,i)=>({day:String(i+6).padStart(2,'0')+'h',court:Math.round(l.court*v/s/1000)*1000,fb:Math.round(l.fb*v/s/1000)*1000})).map(x=>({...x,total:x.court+x.fb}))}return MONTH},[rg]);
  const court=data.reduce((a,d)=>a+d.court,0),fb=data.reduce((a,d)=>a+d.fb,0),tot=court+fb,fac=tot/186450000,lab={today:'HÔM NAY',['7d']:'7 NGÀY',month:'THÁNG',custom:'THÁNG'}[rg];
  const occ={today:82.1,['7d']:79.6,month:74.8,custom:74.8}[rg],dl={today:'+4.1%',['7d']:'+9.6%',month:'+14.2%',custom:'+14.2%'}[rg];
  const pk=MONTH[PEAK],cash=orders.filter(o=>o.pm==='cash').reduce((a,o)=>a+o.due,0),qr=orders.filter(o=>o.pm==='qr').reduce((a,o)=>a+o.due,0),wl=orders.filter(o=>o.pm==='wallet').reduce((a,o)=>a+o.due,0);
  const rank=[...COURTS].sort((a,b)=>b[SORTS[sort][1]]-a[SORTS[sort][1]]);
  const exp=()=>download('bao-cao-doanh-thu.csv',[['Mốc','Tiền sân','F&B','Tổng'],...data.map(d=>[d.day,d.court,d.fb,d.total])]);
  const kp=[[`TỔNG DOANH THU ${lab}`,tot,Banknote,<><b className="up">↗ {dl}</b> so với kỳ trước</>],['DOANH THU TIỀN SÂN',court,UserRound,<><em className="pl g">Chiếm {(court/tot*100).toFixed(1)}% tổng thu</em><span>{money(Math.round(1432*fac))} giờ chơi</span></>],['F&B & DỊCH VỤ PHỤ TRỢ',fb,Coffee,<><em className="pl o">Chiếm {(fb/tot*100).toFixed(1)}% tổng thu</em><span>+8.4% F&B</span></>]];
  return(<div className="pgm rp">
    <div className="card rbar"><div className="seg">{RANGES.map(([k,l])=><button key={k} className={rg===k?'on':''} onClick={()=>setRg(k)}>{k==='custom'&&<CalendarDays size={14}/>}{l}</button>)}</div>
      <button className="sel2">CN Tân Bình (8 sân) <ChevronDown size={14}/></button><span className="sp"/>
      <button className="wbtn" onClick={()=>window.print()}><Printer size={16}/> In ca làm việc</button><button className="wbtn" onClick={exp}><FileSpreadsheet size={16}/> Xuất Excel</button><button className="gbtn" onClick={()=>window.print()}><FileText size={16}/> Xuất Báo cáo PDF</button></div>
    <motion.div className="hero" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}><div><div className="htag"><em>BÁO CÁO TĂNG TRƯỞNG</em><small>Dữ liệu chốt: 28/10/2025 • 22:30</small></div><h1>Hiệu Suất Vận Hành & Tài Chính Sân</h1><p>Hệ thống ghi nhận tỷ lệ khai thác vượt 12.4% so với trung bình quý 3, doanh thu F&B và dịch vụ bảo dưỡng vợt duy trì biên lợi nhuận cao.</p></div>
      <div className="glass"><div><small>Số lượt check-in hôm nay</small><b><Num to={418}/> <i>lượt</i></b></div><div><small>Tỷ lệ hủy/đổi lịch</small><b>1.8% <i className="gr">Rất thấp</i></b></div></div></motion.div>
    <div className="rk">{kp.map(([t,v,I,f],i)=><motion.div key={t} className="card rkc" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.05*i}}><div className="rkt"><span>{t}</span><IconBox I={I} c={["#006948","#00855d","#825100"][i]} size={34} icon={17}/></div><h2><Num to={v} money/></h2><div className="rkf">{f}</div></motion.div>)}
      <motion.div className="card rkc" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.15}}><div className="rkt"><span>TỶ LỆ LẤP ĐẦY TRUNG BÌNH</span><IconBox I={Gauge} c="#565e74" size={34} icon={17}/></div><h2><Num to={occ} dec={1} suffix="%"/> <small>/ngày</small></h2><div className="rkf"><em className="pl r">Giờ cao điểm: 94.2%</em><span>Khung 17-21h</span></div></motion.div></div>
    <div className="rg1"><div className="card rc">
      <div className="rch"><div><h3>{rg==='today'?'Biến Động Doanh Thu Theo Giờ':'Biến Động Doanh Thu Theo Ngày'}</h3><small>Phân tách nguồn thu giữa Tiền thuê sân và Dịch vụ phụ trợ (F&B, cước, cầu)</small></div><span className="chip">Tháng 10/2025</span></div>
      <div className="lg"><span><i style={{background:'#006948'}}/>Tiền thuê sân</span><span><i style={{background:'#ffb95f'}}/>F&B / Dịch vụ</span><span><i className="ln"/>Xu hướng</span></div>
      <div style={{height:210}}><ResponsiveContainer><ComposedChart data={data} margin={{top:10,right:8,left:-8,bottom:0}}><CartesianGrid vertical={false} stroke="#e5eeff"/><XAxis dataKey="day" tick={{fontSize:11,fill:'#57657a'}} axisLine={false} tickLine={false} interval={rg==='month'?3:0}/><YAxis tick={{fontSize:11,fill:'#57657a'}} axisLine={false} tickLine={false} tickFormatter={v=>Math.round(v/(rg==='today'?1e5:1e6))/(rg==='today'?10:1)+'M'}/>
        <Tooltip formatter={(v,n)=>[fmt(v),{court:'Tiền sân',fb:'F&B / Dịch vụ',total:'Tổng'}[n]]} contentStyle={{borderRadius:12,border:'none',boxShadow:'0 6px 20px #0002'}}/>
        <Bar dataKey="court" stackId="a" fill="#006948" radius={[0,0,4,4]} barSize={rg==='month'?16:26} animationDuration={900}/><Bar dataKey="fb" stackId="a" fill="#ffb95f" radius={[4,4,0,0]} barSize={rg==='month'?16:26} animationDuration={900}/>
        <Line dataKey="total" type="monotone" stroke="#0b1c30" strokeWidth={2} dot={{r:3}} animationDuration={1200}/></ComposedChart></ResponsiveContainer></div>
      <div className="rcf"><span><Trophy size={15}/> Ngày đỉnh điểm: 19/10 (Giải SmashPoint Cup)</span><span>Tiền sân: <b>{fmt(pk.court)}</b></span><span>Dịch vụ: <b>{fmt(pk.fb)}</b></span></div></div>
    <div className="card rc"><div className="rch"><div><h3>Cơ Cấu Doanh Thu</h3><small>Tỷ trọng theo mô hình khách hàng & loại dịch vụ</small></div><button className="rbtn" onClick={()=>setSpin(spin+1)}><RefreshCw size={16}/></button></div>
      <div className="don"><ResponsiveContainer><PieChart><Pie key={spin} data={COMP.map(c=>({n:c[0],v:c[1]*fac}))} dataKey="v" innerRadius={62} outerRadius={92} paddingAngle={2} startAngle={90} endAngle={-270} stroke="none" animationDuration={900}>{COMP.map(c=><Cell key={c[0]} fill={c[2]}/>)}</Pie></PieChart></ResponsiveContainer><div className="dc"><b>{(tot/1e6).toFixed(1)}M</b><small>TỔNG THU</small></div></div>
      <div className="dl">{COMP.map(([n,v,c,p,bg])=><div key={n}><i style={{background:c}}/><span>{n}</span><b>{money(Math.round(v*fac))}đ</b><em style={{background:bg,color:c}}>{p}</em></div>)}</div></div></div>
    <div className="card hm"><div className="rch"><div><h3>Bản Đồ Nhiệt Khai Thác Sân (Utilization Heatmap)</h3><small>Phân tích mật độ đặt sân theo khung giờ trong ngày (6h - 23h) và các ngày trong tuần</small></div><span className="chip g">Toàn bộ 8 sân</span>
      <div className="hlg">Mật độ: <i className="h1"/>&lt;30% <i className="h2"/>30-60% <i className="h3"/>60-85% <i className="h4"/>90-100% (Cao điểm)</div></div>
      <div className="hg"><span/>{[...Array(18)].map((_,i)=><span key={i} className={'hhd'+(i>=11&&i<=15?' pk':'')}>{String(i+6).padStart(2,'0')}h</span>)}
        {HEAT.map((r,ri)=><><span key={'l'+ri} className={'hdl'+(ri===6?' cn':'')}>{DOW[ri]}</span>{r.map((v,ci)=><motion.span key={ri+'-'+ci} title={`${DOW[ri]} ${ci+6}h: ${v}%`} className={'hcl '+hc(v)} initial={{opacity:0,scale:.6}} animate={{opacity:1,scale:1}} transition={{delay:(ri*18+ci)*.004}}>{v}%</motion.span>)}</>)}</div>
      <div className="tip2"><Lightbulb size={20}/><p><b>Gợi ý tối ưu khai thác:</b> Khung 09:00 - 14:00 ngày thường tỷ lệ trống trung bình 72%. Đề xuất kích hoạt chính sách Happy Hours giảm 25% hoặc gói tập học sinh - sinh viên.</p><button onClick={()=>note('Đã tạo khuyến mãi Giờ Vàng 09:00 - 14:00 (-25%)')}>Tạo khuyến mãi giờ vàng</button></div></div>
    <div className="rg2"><div className="card rc"><div className="rch"><div><h3>Xếp Hạng Hiệu Suất 8 Sân</h3><small>Doanh thu và thời gian khai thác thực tế trong tháng</small></div><button className="sortb" onClick={()=>setSort((sort+1)%3)}>Sắp xếp: <b>{SORTS[sort][0]}</b></button></div>
      <div className="rr rh"><span>TÊN SÂN</span><span>LOẠI MẶT SÂN</span><span className="rt">GIỜ CHƠI</span><span className="rt">HIỆU SUẤT</span><span className="rt">DOANH THU</span></div>
      {rank.map((c,i)=><motion.div layout key={c[0]} className="rr" transition={{type:'spring',stiffness:300,damping:30}}><span className="cn2"><i className={i===0?'top':''}>{i+1}</i><div><b>{c[0]}</b>{i===0&&<small>{SORTS[sort][0].split(' ')[0]==='Doanh'?'Top Doanh Thu':'Top 1'}</small>}</div></span><span><em className="sf">{c[1]}</em></span><span className="rt">{Math.round(c[2]*Math.max(.1,fac))} giờ</span><span className={'rt'+(i===0?' gr':'')}>{c[3]}%</span><span className={'rt'+(i===0?' gr b':'')}>{money(Math.round(c[4]*fac))}đ</span></motion.div>)}</div>
    <div className="card rc"><div className="rch"><div><h3>Top 5 Mặt Hàng & Dịch Vụ</h3><small>Sản lượng tiêu thụ F&B và quầy tiện ích tháng 10</small></div><Trophy size={20} color="#006948"/></div>
      <div className="t5">{TOP.map(([n,q,s,r,I],i)=><motion.div key={n} className="ti" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:i*.06}}><span className="tic"><I size={18}/></span><div><b>{n}</b><small>{s}</small></div><div className="tr"><b>{q}</b><small className="gr">{money(Math.round(r*fac))}đ</small></div></motion.div>)}</div>
      <p className="warn"><i/>Cảnh báo tồn kho: Ống cầu Thành Công chỉ còn 16 ống <u onClick={()=>note('Đã tạo phiếu nhập hàng')}>Nhập hàng ngay</u></p></div></div>
    <div className="card cls"><span className="clic"><Banknote size={24}/></span><div className="clt"><h3>Chốt Két & Đối Soát Tiền Mặt Ca Trực Hiện Tại <em>Khớp 100%</em></h3><small>Ca chiều (14:00 - 22:00) • Thu ngân: <b>Admin Dev</b></small></div>
      <div><small>Tiền mặt trong két</small><b><Num to={8420000+cash} money/></b></div><div><small>Chuyển khoản VietQR</small><b><Num to={24680000+qr} money/></b></div><div><small>Quẹt thẻ POS</small><b><Num to={3150000+wl} money/></b></div>
      <button className="navy" disabled={closed} onClick={()=>setConfirm(true)}><Lock size={15}/> {closed?'Đã đóng ca':'Bàn Giao & Đóng Ca'}</button></div>
    <Modal open={confirm} onClose={()=>setConfirm(false)} title="Bàn giao & đóng ca?"><p className="mute">Tổng thu ca: <b>{fmt(8420000+cash+24680000+qr+3150000+wl)}</b>. Số liệu khớp 100% với hệ thống POS.</p><button className="gbtn wide" onClick={()=>{setClosed(true);setConfirm(false);note('Đã bàn giao và đóng ca chiều')}}>Xác nhận đóng ca</button></Modal>
    <Toast msg={toast}/></div>);
}
