const sample=(t,h,v,compressor,device_id='OPT-001',timestamp=new Date().toISOString())=>({device_id,temperature:+t.toFixed(1),humidity:+h.toFixed(1),battery_voltage:+v.toFixed(2),compressor_running:compressor,timestamp,uptime_seconds:86400+Math.floor(Math.random()*9000),sensor_health:{temperature:true,humidity:true,battery:true},source:'DEMO'});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const historyRanges={'1h':{count:120,minutes:30,cycles:2.2},'6h':{count:108,minutes:200/60,cycles:2.7},'24h':{count:144,minutes:10,cycles:1.8},'7d':{count:168,minutes:60,cycles:5.2}};
export function createDemoProvider(){
 const primary={t:7.8,h:72,v:12.46,c:true};
 const secondary=[{t:5.8,h:69,v:12.38,c:false},{t:8.6,h:74,v:12.31,c:true},{t:6.9,h:78,v:12.52,c:true},{t:10.2,h:67,v:12.19,c:false},{t:7.3,h:82,v:12.44,c:true}];
 return{
  mode:'demo',
  async getStatus(){primary.t=clamp(primary.t+(Math.random()-.5)*.35,5,13);primary.h=clamp(primary.h+(Math.random()-.5)*1.4,62,84);primary.v=clamp(primary.v+(Math.random()-.5)*.025,11.8,12.8);if(Math.random()<.05)primary.c=!primary.c;return sample(primary.t,primary.h,primary.v,primary.c)},
  async getFleet(status){return[status,...secondary.map((unit,index)=>{unit.t=clamp(unit.t+(Math.random()-.5)*.28,4,13);unit.h=clamp(unit.h+(Math.random()-.5)*1.1,60,88);unit.v=clamp(unit.v+(Math.random()-.5)*.02,11.8,12.8);if(Math.random()<.035)unit.c=!unit.c;return sample(unit.t,unit.h,unit.v,unit.c,`OPT-00${index+2}`)})]},
  async getHistory(range='1h',deviceId='OPT-001'){
   const spec=historyRanges[range]||historyRanges['1h'],now=Date.now(),duration=spec.count*spec.minutes*60000,phaseOffset=Math.random()*Math.PI*2,bumpCenter=.23+Math.random()*.5;
   const unitIndex=Math.max(0,Number(deviceId.slice(-1))-1),unitOffset=unitIndex*.91;
   return Array.from({length:spec.count},(_,index)=>{
    const progress=index/(spec.count-1),phase=progress*Math.PI*2*spec.cycles+phaseOffset+unitOffset;
    const excursion=Math.exp(-Math.pow((progress-bumpCenter)/.045,2));
    const temperature=clamp(7.7+unitIndex*.42+1.35*Math.sin(phase)+.48*Math.sin(phase*2.4+.8)+excursion*.9,4,13);
    const humidity=clamp(72+unitIndex*1.4+8*Math.sin(phase-1.1)+2.7*Math.sin(phase*1.7)+excursion*3,58,90);
    const battery=clamp(12.44-unitIndex*.035+.105*Math.sin(phase*.72+.3)+.035*Math.sin(phase*2.1)-progress*(range==='7d'?.09:.025),11.8,12.8);
    const timestamp=new Date(now-duration+(progress*duration)).toISOString();
    return sample(temperature,humidity,battery,(index+unitIndex*3)%24<14,deviceId,timestamp);
   });
  }
 }
}
