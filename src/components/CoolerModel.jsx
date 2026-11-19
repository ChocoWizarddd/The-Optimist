import{useEffect,useRef,useState}from'react';
import*as THREE from'three';
import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import{OrbitControls}from'three/addons/controls/OrbitControls.js';

function makeWallTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');
 const base=ctx.createLinearGradient(0,0,0,512);base.addColorStop(0,'#827b6d');base.addColorStop(.5,'#6b675d');base.addColorStop(1,'#56584f');ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
 for(let x=0;x<512;x+=18){ctx.fillStyle=x%36===0?'rgba(20,28,29,.22)':'rgba(211,192,151,.08)';ctx.fillRect(x,0,3,512);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x+4,0,1,512)}
 for(let y=45;y<512;y+=118){ctx.fillStyle='rgba(20,25,24,.25)';ctx.fillRect(0,y,512,5);ctx.fillStyle='rgba(224,201,158,.08)';ctx.fillRect(0,y+5,512,2)}
 for(let i=0;i<1600;i++){const x=Math.random()*512,y=Math.random()*512,a=Math.random()*.08;ctx.fillStyle=`rgba(${Math.random()>.5?'220,205,175':'24,29,28'},${a})`;ctx.fillRect(x,y,1+Math.random()*5,1)}
 const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2.5,1.5);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function makeFloorTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#45463f';ctx.fillRect(0,0,512,512);
 for(let y=0;y<512;y+=96){ctx.fillStyle='rgba(196,184,155,.12)';ctx.fillRect(0,y,512,2);ctx.fillStyle='rgba(12,16,16,.22)';ctx.fillRect(0,y+3,512,3)}
 for(let x=0;x<512;x+=128){ctx.fillStyle='rgba(15,18,18,.2)';ctx.fillRect(x,0,2,512)}
 for(let i=0;i<2400;i++){const x=Math.random()*512,y=Math.random()*512,a=Math.random()*.07;ctx.fillStyle=`rgba(210,197,167,${a})`;ctx.fillRect(x,y,1+Math.random()*3,1+Math.random()*2)}
 const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2.3,2.3);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function createWarehouse(scene,floorY){
 const room=new THREE.Group();scene.add(room);
 const steel=new THREE.MeshStandardMaterial({color:0x3c4a4b,metalness:.56,roughness:.62});
 const edgeSteel=new THREE.MeshStandardMaterial({color:0x67706a,metalness:.5,roughness:.58});
 const wood=new THREE.MeshStandardMaterial({color:0x725033,roughness:.9});
 const woodLight=new THREE.MeshStandardMaterial({color:0x9a7145,roughness:.88});
 const produceMat=[new THREE.MeshStandardMaterial({color:0x9a4630,roughness:.82}),new THREE.MeshStandardMaterial({color:0x82904c,roughness:.8}),new THREE.MeshStandardMaterial({color:0xb18a42,roughness:.86})];
 const addBox=(size,pos,mat,group=room)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
 const wall=new THREE.Mesh(new THREE.PlaneGeometry(24,14),new THREE.MeshStandardMaterial({map:makeWallTexture(),roughness:.96,metalness:.08}));wall.position.set(0,floorY+7,-5.8);room.add(wall);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,26),new THREE.MeshStandardMaterial({map:makeFloorTexture(),roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.set(0,floorY,-1);floor.receiveShadow=true;room.add(floor);
 for(const x of[-9,-5,0,5,9])addBox([.16,8.2,.22],[x,floorY+4.1,-5.55],steel);
 for(const y of[.55,3.2,6.5])addBox([19,.16,.24],[0,floorY+y,-5.52],edgeSteel);
 for(const z of[-4.8,-1.3,2.2])addBox([18,.13,.14],[0,floorY+7.05,z],steel);
 for(const x of[-7,-3,3,7]){const brace=addBox([.09,4.9,.1],[x,floorY+4.25,-5.36],edgeSteel);brace.rotation.z=x<0?-.18:.18}
 const glass=new THREE.MeshStandardMaterial({color:0x77949a,emissive:0x354e4e,emissiveIntensity:.45,roughness:.32,metalness:.12});
 for(const x of[-7.4,7.4]){addBox([2.2,1.7,.12],[x,floorY+4.65,-5.48],steel);const pane=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.4),glass);pane.position.set(x,floorY+4.65,-5.39);room.add(pane);addBox([.07,1.45,.08],[x,floorY+4.65,-5.32],edgeSteel);addBox([1.95,.07,.08],[x,floorY+4.65,-5.32],edgeSteel)}
 const doorMat=new THREE.MeshStandardMaterial({color:0x292f2e,roughness:.95});addBox([2.4,5.2,.18],[10,floorY+2.6,-5.45],doorMat);addBox([2.65,.14,.2],[10,floorY+5.25,-5.3],edgeSteel);addBox([.14,5.3,.2],[8.7,floorY+2.6,-5.3],edgeSteel);addBox([.14,5.3,.2],[11.3,floorY+2.6,-5.3],edgeSteel);
 const makeCrate=(x,z,level)=>{
  const y=floorY+.38+level*.92;addBox([1.5,.72,1.05],[x,y,z],woodLight);
  for(let yy of[-.25,-.06,.13,.31])addBox([1.42,.075,.055],[x,y+yy,z+.55],wood);
  for(const dx of[-.68,.68])addBox([.09,.72,.08],[x+dx,y,z+.56],woodLight);
  for(let i=0;i<6;i++){const angle=i*1.05;const fruit=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),produceMat[(i+level)%produceMat.length]);fruit.scale.set(1,.85,1);fruit.position.set(x-.55+(i%3)*.54,y+.35,z-.1+Math.sin(angle)*.12);fruit.castShadow=true;room.add(fruit)}
 };
 for(const side of[-1,1]){
  const x=side*3.35;for(const dx of[-.9,.9])addBox([.12,3.4,.14],[x+dx,floorY+1.7,-3.7],steel);
  for(const y of[.25,1.15,2.05,2.95])addBox([2.05,.12,.65],[x,floorY+y,-3.7],edgeSteel);
  makeCrate(x,-3.35,0);makeCrate(x,-3.35,1);
 }
 const lamp=new THREE.MeshStandardMaterial({color:0xd6c8a6,emissive:0x9b7441,emissiveIntensity:.75,roughness:.4});
 for(const x of[-4,0,4]){addBox([1.1,.13,.55],[x,floorY+7.0,-.8],steel);const lightPanel=new THREE.Mesh(new THREE.BoxGeometry(.78,.035,.34),lamp);lightPanel.position.set(x,floorY+6.91,-.8);room.add(lightPanel)}
 return room;
}
function disposeTree(root){if(!root)return;root.traverse(object=>{object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.filter(Boolean).forEach(material=>{Object.values(material).forEach(value=>{if(value?.isTexture)value.dispose()});material.dispose()})})}

export default function CoolerModel(){
 const host=useRef(null),[status,setStatus]=useState('Loading 3D model'),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const root=host.current;if(!root)return;let disposed=false,frame=0,model=null,warehouse=null;let renderer,controls,resizeObserver;
  try{
   renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setSize(root.clientWidth,root.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   renderer.domElement.className='cooler-canvas';renderer.domElement.setAttribute('aria-label','Interactive 3D cooler model. Drag to rotate and scroll to zoom.');root.prepend(renderer.domElement);
   const scene=new THREE.Scene();scene.background=new THREE.Color(0x202b2d);
   const camera=new THREE.PerspectiveCamera(34,root.clientWidth/root.clientHeight,.01,1000);camera.position.set(4,2.5,5);
   scene.add(new THREE.HemisphereLight(0xcbe8ee,0x1a252d,2.1));
   const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(4,7,5);key.castShadow=true;scene.add(key);
   const fill=new THREE.DirectionalLight(0x72c8d7,1.6);fill.position.set(-5,2,-4);scene.add(fill);
   const rim=new THREE.DirectionalLight(0x78a9ec,1.1);rim.position.set(-4,3,5);scene.add(rim);
   const warm=new THREE.PointLight(0xffcf91,9,18,1.8);warm.position.set(-5,4,-.5);scene.add(warm);
   const warm2=new THREE.PointLight(0xffd6a4,6,15,1.8);warm2.position.set(5,4,-2);scene.add(warm2);
   controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.autoRotate=true;controls.autoRotateSpeed=.25;controls.minDistance=.2;controls.maxDistance=40;controls.target.set(0,0,0);
   new GLTFLoader().load('/models/cooler3Dmodel1.glb',gltf=>{
    if(disposed)return;model=gltf.scene;model.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    const maxDim=Math.max(size.x,size.y,size.z),scale=maxDim>0?4.8/maxDim:1;model.scale.setScalar(scale);model.position.copy(center).multiplyScalar(-scale);model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true}});
    scene.add(model);model.updateMatrixWorld(true);const finalBox=new THREE.Box3().setFromObject(model);warehouse=createWarehouse(scene,finalBox.min.y-.04);
    const distance=3.25/Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*.53;camera.position.set(distance*.85,distance*.48,distance);camera.near=Math.max(.01,distance/100);camera.far=distance*100;camera.updateProjectionMatrix();controls.target.set(0,0,0);controls.update();setStatus('INTERACTIVE 3D MODEL');
   },xhr=>{if(xhr.total&& !disposed)setStatus(`Loading model · ${Math.round(xhr.loaded/xhr.total*100)}%`)},()=>{if(!disposed){setFailed(true);setStatus('Model could not be loaded')}});
   const draw=()=>{if(disposed)return;frame=requestAnimationFrame(draw);controls.update();renderer.render(scene,camera)};draw();
   resizeObserver=new ResizeObserver(()=>{if(!renderer||!root.clientWidth||!root.clientHeight)return;renderer.setSize(root.clientWidth,root.clientHeight);camera.aspect=root.clientWidth/root.clientHeight;camera.updateProjectionMatrix()});resizeObserver.observe(root);
   return()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();controls?.dispose();disposeTree(model);disposeTree(warehouse);renderer?.dispose();renderer?.domElement.remove()};
  }catch(e){setFailed(true);setStatus('WebGL is unavailable in this browser');return()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();controls?.dispose();disposeTree(model);disposeTree(warehouse);renderer?.dispose();renderer?.domElement.remove()}}
 },[]);
 return <section className={`cooler-model panel ${failed?'model-error':''}`}><div className="model-heading"><div><small>PROTOTYPE VISUALIZATION</small><b>OPT-001 · Cold storage unit</b></div><span className="model-live"><i/>{status}</span></div><div className="model-stage warehouse-stage" ref={host}>{failed&&<div className="model-fallback"><span>3D PREVIEW UNAVAILABLE</span><small>Check WebGL support or refresh the model asset.</small></div>}<div className="model-caption">Drag to rotate <span>·</span> Scroll to zoom</div></div></section>
}


