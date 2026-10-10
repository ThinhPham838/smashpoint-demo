import React from 'react';import {createRoot} from 'react-dom/client';import App from './App';import './styles.css';
createRoot(document.getElementById('root')).render(<App/>);

addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.card');if(c){const r=c.getBoundingClientRect();c.style.setProperty('--mx',e.clientX-r.left+'px');c.style.setProperty('--my',e.clientY-r.top+'px')}},{passive:true});
