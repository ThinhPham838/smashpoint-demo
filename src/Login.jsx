import {useState} from 'react';
import {motion} from 'motion/react';
import {Crown,ShieldCheck,UserRound,LogIn,KeyRound,Mail} from 'lucide-react';
import {USERS,ROLES,login,tryLogin} from './auth';
import Shuttle from './Shuttle';
import {IconBox} from './ui';
const IC={root:[Crown,'#ba1a1a'],admin:[ShieldCheck,'#006948'],customer:[UserRound,'#825100']};
export default function Login(){
  const[k,setK]=useState(''),[pw,setPw]=useState(''),[err,setErr]=useState('');
  const submit=e=>{e.preventDefault();if(!tryLogin(k,pw))setErr('Sai tài khoản hoặc mật khẩu (xem tài khoản demo bên dưới)')};
  return(<div className="lgp"><div className="lg-l"><div className="lg-3d"><Shuttle/></div><motion.h1 initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>SmashPoint PRO</motion.h1><p>Hệ thống quản lý cụm sân cầu lông chuẩn thi đấu. Đăng nhập để vào khu vực theo đúng vai trò của bạn.</p><small>Demo: dữ liệu giả, chưa lưu database</small></div>
    <motion.div className="lg-r" initial={{opacity:0,x:24}} animate={{opacity:1,x:0}}><h2>Đăng nhập hệ thống</h2><p className="mute">Chọn nhanh một tài khoản demo hoặc nhập thủ công.</p>
      <div className="lg-acc">{USERS.map((u,i)=>{const[I,c]=IC[u.role];return<motion.button key={u.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.1+i*.07}} whileHover={{y:-3}} whileTap={{scale:.98}} onClick={()=>login(u.id)}><IconBox I={I} c={c} size={40} icon={19}/><div><b>{u.name} <em className={'rb '+u.role}>{ROLES[u.role]}</em></b><small>{u.desc}</small><code>{u.email} • {u.pw}</code></div><LogIn size={16}/></motion.button>})}</div>
      <div className="lg-or"><span>hoặc nhập thủ công</span></div>
      <form onSubmit={submit}><label><Mail size={15}/><input value={k} onChange={e=>{setK(e.target.value);setErr('')}} placeholder="Email hoặc tên đăng nhập (root / admin / customer)"/></label><label><KeyRound size={15}/><input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr('')}} placeholder="Mật khẩu"/></label>{err&&<p className="lg-er">{err}</p>}<button className="gbtn wide" type="submit"><LogIn size={16}/> Đăng nhập</button></form></motion.div></div>);
}
