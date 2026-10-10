import {useEffect,useState} from 'react';
import {motion,AnimatePresence} from 'motion/react';
import {fmt} from './db';
export function Num({to,money,suffix='',dec=0,skip=false}){const[v,setV]=useState(skip?to:0);
  useEffect(()=>{if(skip){setV(to);return}let r,t0=performance.now();const f=n=>{const p=Math.min((n-t0)/900,1);setV(to*(1-(1-p)**3));if(p<1)r=requestAnimationFrame(f)};r=requestAnimationFrame(f);return()=>cancelAnimationFrame(r)},[to]);
  return money?fmt(Math.round(v)):v.toLocaleString('vi-VN',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suffix}
export const download=(name,rows)=>{const csv='\ufeff'+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=name;a.click()};
export function Modal({open,onClose,title,children}){return<AnimatePresence>{open&&<motion.div className="mbg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
  <motion.div className="mdl card" initial={{y:30,scale:.96}} animate={{y:0,scale:1}} exit={{y:20,opacity:0}} onClick={e=>e.stopPropagation()}><h3>{title}</h3>{children}</motion.div></motion.div>}</AnimatePresence>}
export function Toast({msg}){return<AnimatePresence>{msg&&<motion.div className="toast" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}>{msg}</motion.div>}</AnimatePresence>}
export const useToast=()=>{const[m,setM]=useState(null);return[m,t=>{setM(t);setTimeout(()=>setM(null),2600)}]};

export function IconBox({I,c='#006948',size=36,icon=18}){return<span className="ibx" style={{width:size,height:size,'--c':c}}><I size={icon} strokeWidth={2}/></span>}
