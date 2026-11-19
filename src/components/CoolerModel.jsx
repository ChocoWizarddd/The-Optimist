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
function makeGrassTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#496a39';ctx.fillRect(0,0,512,512);
 for(let i=0;i<5200;i++){const x=Math.random()*512,y=Math.random()*512,a=.025+Math.random()*.12;ctx.fillStyle=`rgba(${Math.random()>.5?'165,181,101':'24,55,30'},${a})`;ctx.fillRect(x,y,1+Math.random()*4,1+Math.random()*3)}
 const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(18,18);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function makeCloudTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');
 for(let i=0;i<28;i++){const x=45+Math.random()*420,y=55+Math.random()*140,r=24+Math.random()*56,g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,'rgba(255,255,255,.8)');g.addColorStop(.55,'rgba(250,253,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function createFarmEnvironment(scene,floorY){
 const farm=new THREE.Group();scene.add(farm);
 const sky=new THREE.Mesh(new THREE.SphereGeometry(400,32,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:'varying vec3 vWorld; void main(){vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',fragmentShader:'varying vec3 vWorld; void main(){float h=normalize(vWorld).y;float blend=smoothstep(-0.12,0.72,h);vec3 horizon=vec3(0.76,0.85,0.86);vec3 zenith=vec3(0.22,0.49,0.69);vec3 high=vec3(0.35,0.60,0.77);vec3 sky=mix(horizon,high,smoothstep(-0.12,0.18,h));sky=mix(sky,zenith,smoothstep(0.18,0.9,h)*0.65);gl_FragColor=vec4(sky,1.0);}'}));sky.frustumCulled=false;farm.add(sky);
 const cloudTexture=makeCloudTexture(),cloudMaterial=new THREE.SpriteMaterial({map:cloudTexture,transparent:true,opacity:.64,depthWrite:false});
 for(const [x,y,z,scale] of[[-18,13,-72,18],[-2,17,-88,23],[19,12,-75,17]]){const cloud=new THREE.Sprite(cloudMaterial);cloud.position.set(x,y,z);cloud.scale.set(scale,scale*.34,1);farm.add(cloud)}
 const grassTexture=makeGrassTexture(),grass=new THREE.Mesh(new THREE.PlaneGeometry(500,500),new THREE.MeshStandardMaterial({map:grassTexture,roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.set(0,floorY-.22,-35);grass.receiveShadow=true;farm.add(grass);
 const concrete=new THREE.Mesh(new THREE.PlaneGeometry(8,9),new THREE.MeshStandardMaterial({map:makeFloorTexture(),roughness:.95}));concrete.rotation.x=-Math.PI/2;concrete.position.set(0,floorY-.08,.4);concrete.receiveShadow=true;farm.add(concrete);
 const soil=new THREE.MeshStandardMaterial({color:0x51432e,roughness:1}),leafMat=new THREE.MeshStandardMaterial({color:0x537738,roughness:.9}),leafLight=new THREE.MeshStandardMaterial({color:0x78954c,roughness:.92});
 const cropXs=[-11,-9,-7,-5.35,5.35,7,9,11],plantMatrices=[];
 for(const x of cropXs){const bed=new THREE.Mesh(new THREE.BoxGeometry(.9,.12,38),soil);bed.position.set(x,floorY-.04,-13);bed.receiveShadow=true;farm.add(bed);for(let z=4;z>-30;z-=1.05){for(const offset of[-.2,.2]){const obj=new THREE.Object3D();obj.position.set(x+offset,floorY+.18,z+(Math.random()-.5)*.15);obj.rotation.y=Math.random()*Math.PI;const scale=.55+Math.random()*.5;obj.scale.set(scale,.55+Math.random()*.25,scale);obj.updateMatrix();plantMatrices.push({matrix:obj.matrix.clone(),light:Math.random()>.72})}}}
 for(const light of[false,true]){const instances=plantMatrices.filter(p=>p.light===light),mesh=new THREE.InstancedMesh(new THREE.SphereGeometry(.3,7,6),light?leafLight:leafMat,instances.length);instances.forEach((p,i)=>mesh.setMatrixAt(i,p.matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;farm.add(mesh)}
 const addBox=(size,pos,mat,group=farm)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
 const barnRed=new THREE.MeshStandardMaterial({color:0x8c4030,roughness:.86}),barnDark=new THREE.MeshStandardMaterial({color:0x66362c,roughness:.9}),trim=new THREE.MeshStandardMaterial({color:0xd8d0b7,roughness:.78}),roofMat=new THREE.MeshStandardMaterial({color:0x394a4a,metalness:.48,roughness:.68}),doorMat=new THREE.MeshStandardMaterial({color:0x5b342c,roughness:.9});
 const barnX=2.7,barnZ=-15,barnW=10,barnD=6,barnH=4.1,frontZ=barnZ+barnD/2;
 addBox([barnW,barnH,barnD],[barnX,floorY+barnH/2,barnZ],barnRed);
 const gableShape=new THREE.Shape();gableShape.moveTo(-barnW/2,0);gableShape.lineTo(barnW/2,0);gableShape.lineTo(0,2.3);gableShape.closePath();const gable=new THREE.Mesh(new THREE.ShapeGeometry(gableShape),barnDark);gable.position.set(barnX,floorY+barnH,frontZ+.03);farm.add(gable);
 const roofLeft=addBox([5.65,.22,barnD+.45],[barnX-2.72,floorY+5.24,barnZ],roofMat);roofLeft.rotation.z=.43;const roofRight=addBox([5.65,.22,barnD+.45],[barnX+2.72,floorY+5.24,barnZ],roofMat);roofRight.rotation.z=-.43;
 addBox([3.2,3.35,.15],[barnX,floorY+1.72,frontZ+.12],doorMat);for(const x of[barnX-1.67,barnX,barnX+1.67])addBox([.13,3.55,.19],[x,floorY+1.8,frontZ+.23],trim);addBox([3.45,.14,.2],[barnX,floorY+3.52,frontZ+.23],trim);addBox([3.25,.1,.18],[barnX,floorY+.2,frontZ+.23],trim);
 for(const x of[barnX-3.7,barnX+3.7]){const win=new THREE.Mesh(new THREE.BoxGeometry(1.05,1.05,.12),new THREE.MeshStandardMaterial({color:0x8eb8c1,emissive:0x47636a,emissiveIntensity:.35,roughness:.4}));win.position.set(x,floorY+2.6,frontZ+.12);farm.add(win);for(const dx of[-.58,.58])addBox([.09,1.18,.16],[x+dx,floorY+2.6,frontZ+.23],trim);addBox([1.2,.09,.16],[x,floorY+2.6,frontZ+.23],trim)}
 const shedX=-7.7,shedZ=-12.7,shedW=6.1,shedD=4.7,shedH=3.2,greenMetal=new THREE.MeshStandardMaterial({color:0x53665a,metalness:.38,roughness:.76});
 addBox([shedW,shedH,shedD],[shedX,floorY+1.6,shedZ],greenMetal);
 const shedRoof=addBox([3.55,.2,shedD+.4],[shedX-1.7,floorY+3.45,shedZ],roofMat);shedRoof.rotation.z=.25;const shedRoof2=addBox([3.55,.2,shedD+.4],[shedX+1.7,floorY+3.45,shedZ],roofMat);shedRoof2.rotation.z=-.25;
 const opening=new THREE.Mesh(new THREE.BoxGeometry(3.25,2.5,.18),new THREE.MeshStandardMaterial({color:0x252d2c,roughness:1}));opening.position.set(shedX,floorY+1.3,shedZ+shedD/2+.1);farm.add(opening);
 const wood=new THREE.MeshStandardMaterial({color:0x765233,roughness:.92}),woodLight=new THREE.MeshStandardMaterial({color:0x9b7145,roughness:.9}),produceMat=[new THREE.MeshStandardMaterial({color:0xb6472d,roughness:.8}),new THREE.MeshStandardMaterial({color:0x84964e,roughness:.82}),new THREE.MeshStandardMaterial({color:0xd2a04a,roughness:.85})];
 const crate=(x,z,level=0)=>{const y=floorY+.35+level*.82;addBox([1.35,.66,.9],[x,y,z],woodLight);for(const yy of[-.22,-.04,.14,.28])addBox([1.3,.07,.05],[x,y+yy,z+.48],wood);for(let i=0;i<5;i++){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),produceMat[(i+level)%produceMat.length]);fruit.position.set(x-.45+i*.22,y+.36,z-.05+Math.sin(i*1.8)*.08);fruit.castShadow=true;farm.add(fruit)}};
 for(const side of[-1,1]){const x=side*3.35;crate(x,-3.35,0);crate(x,-3.35,1)}
 for(const x of[-12.5,12.5]){for(let z of[3,-3,-9,-15,-21]){const post=addBox([.16,1.25,.16],[x,floorY+.62,z],trim);post.receiveShadow=true}for(const y of[.45,1.05])addBox([.12,.12,27],[x,floorY+y,-9],woodLight)}
 const trunk=new THREE.MeshStandardMaterial({color:0x59412d,roughness:1}),treeMat=new THREE.MeshStandardMaterial({color:0x496b3b,roughness:.95}),treeLight=new THREE.MeshStandardMaterial({color:0x66834a,roughness:.95});
 for(const [x,z,s] of[[-15,-6,1.25],[15,-8,1.45],[-17,-18,1.15],[17,-20,1.2]]){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.3*s,2.8*s,8),trunk);stem.position.set(x,floorY+1.4*s,z);farm.add(stem);for(const [dx,dy,dz,k] of[[0,2.9,0,1.4],[-.8,2.5,.2,1],[.75,2.55,-.1,1.08],[.1,3.45,.25,.92]]){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),Math.random()>.5?treeMat:treeLight);crown.position.set(x+dx*s,floorY+dy*s,z+dz*s);crown.scale.set(k*s,.85*k*s,k*s);crown.castShadow=true;farm.add(crown)}}
 return farm;
}
function disposeTree(root){if(!root)return;root.traverse(object=>{object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.filter(Boolean).forEach(material=>{Object.values(material).forEach(value=>{if(value?.isTexture)value.dispose()});material.dispose()})})}

export default function CoolerModel(){
 const host=useRef(null),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const root=host.current;if(!root)return;let disposed=false,frame=0,model=null,farm=null;let renderer,controls,resizeObserver;
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
    scene.add(model);model.updateMatrixWorld(true);const finalBox=new THREE.Box3().setFromObject(model);farm=createFarmEnvironment(scene,finalBox.min.y-.04);
    const distance=3.25/Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*.53;camera.position.set(distance*.85,distance*.48,distance);camera.near=Math.max(.01,distance/100);camera.far=distance*100;camera.updateProjectionMatrix();controls.target.set(0,0,0);controls.update();
   },()=>{if(!disposed)setFailed(true)});
   const draw=()=>{if(disposed)return;frame=requestAnimationFrame(draw);controls.update();renderer.render(scene,camera)};draw();
   resizeObserver=new ResizeObserver(()=>{if(!renderer||!root.clientWidth||!root.clientHeight)return;renderer.setSize(root.clientWidth,root.clientHeight);camera.aspect=root.clientWidth/root.clientHeight;camera.updateProjectionMatrix()});resizeObserver.observe(root);
   return()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();controls?.dispose();disposeTree(model);disposeTree(farm);renderer?.dispose();renderer?.domElement.remove()};
  }catch(e){setFailed(true);return()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();controls?.dispose();disposeTree(model);disposeTree(farm);renderer?.dispose();renderer?.domElement.remove()}}
 },[]);
 return <section className={`cooler-model panel ${failed?'model-error':''}`}><div className="model-stage warehouse-stage" ref={host}>{failed&&<div className="model-fallback"><span>3D PREVIEW UNAVAILABLE</span><small>Check WebGL support or refresh the model asset.</small></div>}<div className="model-caption">Drag to rotate <span>·</span> Scroll to zoom</div></div></section>
}


