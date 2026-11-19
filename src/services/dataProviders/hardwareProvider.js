const BASE=import.meta.env.VITE_API_BASE_URL||'http://localhost:8000';
export function createHardwareProvider(){
 return{
  mode:'live',
  async getStatus(deviceId='OPT-001'){const r=await fetch(`${BASE}/api/status?device_id=${encodeURIComponent(deviceId)}`,{signal:AbortSignal.timeout(2500)});if(!r.ok)throw new Error(`Backend returned ${r.status}`);const data=await r.json();return{...data,source:'LIVE',received_at:new Date().toISOString()}},
  async getHistory(range,deviceId='OPT-001'){const params=new URLSearchParams({range,device_id:deviceId});const r=await fetch(`${BASE}/api/history?${params}`,{signal:AbortSignal.timeout(4000)});if(!r.ok)throw new Error(`History endpoint returned ${r.status}`);const body=await r.json(),points=Array.isArray(body)?body:body.history||body.items||body.data||[];return Array.isArray(points)?points.map(point=>({...point,source:'LIVE'})):[]}
 }
}
