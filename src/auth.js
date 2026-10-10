// Phân quyền tạm thời: dữ liệu giả, chỉ lưu trong bộ nhớ (F5 là về màn đăng nhập), chưa ghi database.
import {useSyncExternalStore} from 'react';
export const ROLES={root:'Root',admin:'Admin',customer:'Customer'};
export const USERS=[
  {id:'root',name:'Root Dev',email:'root@smashpoint.vn',pw:'root123',role:'root',avatar:'RD',desc:'Thấy tất cả: trang quản trị, website khách hàng, tài khoản & phân quyền'},
  {id:'admin',name:'Admin Dev',email:'admin@smashpoint.vn',pw:'admin123',role:'admin',avatar:'AD',desc:'Thấy các trang quản trị: sân, POS, hội viên, báo cáo, giá, audit'},
  {id:'customer',name:'Minh Tuấn',email:'customer@smashpoint.vn',pw:'customer123',role:'customer',avatar:'MT',desc:'Chỉ thấy website khách hàng: đặt sân, bảng giá, ví hội viên'},
];
export const PERMS={root:['root','admin','customer'],admin:['admin'],customer:['customer']};
let state={user:null};const subs=new Set();const emit=()=>subs.forEach(f=>f());
export const useAuth=()=>useSyncExternalStore(f=>{subs.add(f);return()=>subs.delete(f)},()=>state);
export const login=id=>{state={user:USERS.find(u=>u.id===id)};emit()};
export const tryLogin=(k,pw)=>{const u=USERS.find(x=>(x.email===k.trim().toLowerCase()||x.id===k.trim().toLowerCase())&&x.pw===pw);if(!u)return false;login(u.id);return true};
export const logout=()=>{state={user:null};emit()};
export const can=p=>!!state.user&&PERMS[state.user.role].includes(p);
