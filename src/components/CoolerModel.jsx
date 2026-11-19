import{useEffect,useRef,useState}from'react';
import*as THREE from'three';
import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import{OrbitControls}from'three/addons/controls/OrbitControls.js';

export default function CoolerModel(){
 const host=useRef(null),[status,setStatus]=useState('Loading 3D model'),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const root=host.current;if(!root)return;let disposed=false,frame=0,model=null;let renderer,controls,resizeObserver;
  try{
   renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setSize(root.clientWidth,root.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
   renderer.domElement.className='cooler-canvas';renderer.domElement.setAttribute('aria-label','Interactive 3D cooler model. Drag to rotate and scroll to zoom.');root.prepend(renderer.domElement);
   const scene=new THREE.Scene();scene.background=null;
   const camera=new THREE.PerspectiveCamera(34,root.clientWidth/root.clientHeight,.01,1000);camera.position.set(4,2.5,5);
   scene.add(new THREE.HemisphereLight(0xcbe8ee,0x1a252d,2.1));
   const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(4,7,5);scene.add(key);
   const fill=new THREE.DirectionalLight(0x72c8d7,1.6);fill.position.set(-5,2,-4);scene.add(fill);
   const rim=new THREE.DirectionalLight(0x78a9ec,1.1);rim.position.set(-4,3,5);scene.add(rim);
   controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.autoRotate=true;controls.autoRotateSpeed=.25;controls.minDistance=.2;controls.maxDistance=40;controls.target.set(0,0,0);
   new GLTFLoader().load('/models/cooler3Dmodel1.glb',gltf=>{
    if(disposed)return;model=gltf.scene;model.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    const maxDim=Math.max(size.x,size.y,size.z);if(maxDim>0){model.position.sub(center);model.scale.setScalar(4.8/maxDim)}
    scene.add(model);
    const distance=3.25/Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*.53;camera.position.set(distance*.85,distance*.48,distance);camera.near=Math.max(.01,distance/100);camera.far=distance*100;camera.updateProjectionMatrix();controls.target.set(0,0,0);controls.update();setStatus('INTERACTIVE 3D MODEL');
   },xhr=>{if(xhr.total&& !disposed)setStatus(`Loading model · ${Math.round(xhr.loaded/xhr.total*100)}%`)},()=>{if(!disposed){setFailed(true);setStatus('Model could not be loaded')}});
   const draw=()=>{if(disposed)return;frame=requestAnimationFrame(draw);controls.update();renderer.render(scene,camera)};draw();
   resizeObserver=new ResizeObserver(()=>{if(!renderer||!root.clientWidth||!root.clientHeight)return;renderer.setSize(root.clientWidth,root.clientHeight);camera.aspect=root.clientWidth/root.clientHeight;camera.updateProjectionMatrix()});resizeObserver.observe(root);
   return()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();controls?.dispose();if(model)model.traverse(o=>{o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.filter(Boolean).forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose()});m.dispose()})});renderer?.dispose();renderer?.domElement.remove()};
  }catch(e){setFailed(true);setStatus('WebGL is unavailable in this browser');return()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();controls?.dispose();renderer?.dispose();renderer?.domElement.remove()}}
 },[]);
 return <section className={`cooler-model panel ${failed?'model-error':''}`}><div className="model-heading"><div><small>PROTOTYPE VISUALIZATION</small><b>OPT-001 · Cold storage unit</b></div><span className="model-live"><i/>{status}</span></div><div className="model-stage" ref={host}>{failed&&<div className="model-fallback"><span>3D PREVIEW UNAVAILABLE</span><small>Check WebGL support or refresh the model asset.</small></div>}<div className="model-caption">Drag to rotate <span>·</span> Scroll to zoom</div></div></section>
}



