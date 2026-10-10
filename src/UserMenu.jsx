import {useState} from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {LogOut,Check,ChevronDown} from 'lucide-react';
import {useAuth,USERS,ROLES,login,logout} from './auth';
export default function UserMenu(){const{user}=useAuth();const[o,setO]=useState(false);if(!user)return null;
  return(<div className="um"><button className="user" onClick={()=>setO(!o)}><span className="av">{user.avatar}</span><div><b>{user.name}</b><small><em className={'rb '+user.role}>{ROLES[user.role]}</em></small></div><ChevronDown size={14}/></button>
    <AnimatePresence>{o&&<><div className="umbg" onClick={()=>setO(false)}/><motion.div className="umm" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}><p>ĐỔI VAI TRÒ (DEMO)</p>
      {USERS.map(u=><button key={u.id} className={u.id===user.id?'on':''} onClick={()=>{login(u.id);setO(false)}}><em className={'rb '+u.role}>{ROLES[u.role]}</em><span>{u.name}</span>{u.id===user.id&&<Check size={14}/>}</button>)}<hr/><button onClick={logout}><LogOut size={14}/><span>Đăng xuất</span></button></motion.div></>}</AnimatePresence></div>);}
