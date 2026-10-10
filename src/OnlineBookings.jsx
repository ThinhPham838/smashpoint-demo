import {useLiveQuery} from 'dexie-react-hooks';
import {Globe} from 'lucide-react';
import {db,fmt} from './db';
import {fh,ts} from './booking';
export default function OnlineBookings(){
  const bs=useLiveQuery(()=>db.bookings.toArray(),[],[]);
  const up=bs.filter(b=>b.status==='confirmed'&&ts(b)+b.hours*36e5>Date.now()).sort((a,b)=>ts(a)-ts(b));
  return(<div className="card ob"><div className="oh"><div><h3>Lịch đặt sắp tới</h3><small>{up.length} lượt (website + quầy)</small></div><Globe size={18} color="#006948"/></div>
    {!up.length?<p className="mute" style={{margin:'10px 0 0'}}>Chưa có lịch đặt mới.</p>:up.slice(0,3).map(b=><div key={b.id} className="obr"><div><b>{b.courtName} • {fh(b.start)}-{fh(b.start+b.hours)}</b><small>{b.date.split('-').reverse().slice(0,2).join('/')} • {b.name} • {b.src==='counter'?'Quầy':'Online'} • {b.code}</small></div><em>{fmt(b.amount)}</em></div>)}
    {up.length>3&&<small className="mute">+{up.length-3} lượt khác</small>}</div>);
}
