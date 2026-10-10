import {Canvas,useFrame} from '@react-three/fiber';import {useRef} from 'react';
function Bird(){const g=useRef();
  useFrame(({clock,pointer})=>{const t=clock.elapsedTime;g.current.rotation.y=t*.7;g.current.rotation.x=pointer.y*.4;g.current.position.y=Math.sin(t*1.6)*.12;});
  return(<group ref={g} rotation={[0,0,.5]}>
    <mesh position={[0,-1.1,0]}><sphereGeometry args={[.42,32,32]}/><meshStandardMaterial color="#e9c27a"/></mesh>
    <mesh position={[0,-.1,0]}><cylinderGeometry args={[1.1,.38,1.7,24,1,true]}/><meshStandardMaterial color="#fff" side={2} transparent opacity={.92}/></mesh>
    <mesh position={[0,.75,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.1,.03,8,48]}/><meshStandardMaterial color="#14b87f"/></mesh>
  </group>);}
export default function Shuttle(){return(<Canvas dpr={[1,2]} camera={{position:[0,.4,5],fov:40}}>
  <ambientLight intensity={.7}/><directionalLight position={[3,4,5]} intensity={.9}/><Bird/></Canvas>);}
