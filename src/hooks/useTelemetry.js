import{useEffect,useMemo,useState}from'react';import{createDemoProvider}from'../services/dataProviders/demoProvider';import{createHardwareProvider}from'../services/dataProviders/hardwareProvider';
const rangeDuration={'1h':3600000,'6h':21600000,'24h':86400000,'7d':604800000};
export function useTelemetry(mode,interval=3000,range='1h'){
 const provider=useMemo(()=>mode==='demo'?createDemoProvider():createHardwareProvider(),[mode]);
 const[reading,setReading]=useState(null),[fleet,setFleet]=useState([]),[samples,setSamples]=useState([]),[error,setError]=useState(''),[historyError,setHistoryError]=useState(''),[lastSuccess,setLastSuccess]=useState(null);
 useEffect(()=>{let active=true;setReading(null);setFleet([]);setLastSuccess(null);setError('');const poll=async()=>{try{const next=await provider.getStatus();const nextFleet=provider.getFleet?await provider.getFleet(next):Array.isArray(next.units)?next.units:[next];if(active){setReading(next);setFleet(nextFleet);setLastSuccess(Date.now());setError('')}}catch(e){if(active)setError(e.message||'Connection unavailable')}};poll();const id=setInterval(poll,interval);return()=>{active=false;clearInterval(id)}},[provider,interval]);
 useEffect(()=>{let active=true;setSamples([]);setHistoryError('');if(!provider.getHistory)return()=>{active=false};provider.getHistory(range).then(points=>{if(active)setSamples(Array.isArray(points)?points:[]) }).catch(e=>{if(active)setHistoryError(e.message||'History unavailable')});return()=>{active=false}},[provider,range]);
 useEffect(()=>{if(!reading)return;const cutoff=Date.now()-(rangeDuration[range]||rangeDuration['1h']);setSamples(prev=>[...prev,reading].filter(x=>new Date(x.timestamp).getTime()>=cutoff).slice(-2500))},[reading,range]);
 return{reading,fleet,samples,error,historyError,lastSuccess,stale:mode==='live'&&!!reading&&Date.now()-lastSuccess>10000};
}
