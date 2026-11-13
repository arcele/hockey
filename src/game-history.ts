import type {State,Difficulty} from './simulation.js';
export type GameStatus='in_progress'|'paused'|'completed'|'abandoned'|'interrupted';
export interface GameRecord {
 schemaVersion:1;gameId:string;browserId:string;startedAt:string;updatedAt:string;endedAt:string|null;
 status:GameStatus;result:'win'|'loss'|'draw'|null;score:{home:number;away:number};
 remainingSeconds:number;playedSeconds:number;initialDifficulty:Difficulty;difficulty:Difficulty;
 initialAutoGoalie:boolean;autoGoalie:boolean;
}
export interface StoragePort {getItem(key:string):string|null;setItem(key:string,value:string):void;readonly length:number;key(index:number):string|null}
/** Replace this port with a remote repository later; gameId is the upsert key. */
export interface GameRepository {readonly browserId:string;list():GameRecord[];save(record:GameRecord):void}
const PREFIX='nwbhf:v1:game:',IDENTITY='nwbhf:v1:browser';
function valid(value:unknown):value is GameRecord {
 const r=value as GameRecord|null;
 return !!r&&r.schemaVersion===1&&typeof r.gameId==='string'&&typeof r.browserId==='string'&&
 typeof r.startedAt==='string'&&typeof r.updatedAt==='string'&&
 ['in_progress','paused','completed','abandoned','interrupted'].includes(r.status)&&
 !!r.score&&Number.isInteger(r.score.home)&&r.score.home>=0&&Number.isInteger(r.score.away)&&r.score.away>=0;
}
export class LocalGameRepository implements GameRepository {
 readonly browserId:string;
 private memory=new Map<string,GameRecord>();
 constructor(private storage:StoragePort|null,uuid:()=>string,private onError:()=>void=()=>{}){
  let id:string|null=null;
  try{id=storage?.getItem(IDENTITY)??null;}catch{onError();}
  this.browserId=id&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)?id:uuid();
  try{if(storage)storage.setItem(IDENTITY,this.browserId);else onError();}catch{onError();}
 }
 save(record:GameRecord){
  this.memory.set(record.gameId,structuredClone(record));
  try{if(!this.storage)throw new Error('Storage unavailable');this.storage.setItem(PREFIX+record.gameId,JSON.stringify(record));}catch{this.onError();}
 }
 list(){
  const records=new Map<string,GameRecord>();
  try{if(this.storage)for(let i=0;i<this.storage.length;i++){
   const key=this.storage.key(i);if(!key?.startsWith(PREFIX))continue;
   try{const record:unknown=JSON.parse(this.storage.getItem(key)??'null');if(valid(record))records.set(record.gameId,record);}catch{/* Preserve malformed entries without blocking other games. */}
  }}catch{this.onError();}
  for(const [id,r] of this.memory)if(!records.has(id)||records.get(id)!.updatedAt<=r.updatedAt)records.set(id,r);
  return [...records.values()].sort((a,b)=>b.startedAt.localeCompare(a.startedAt));
 }
}
export class GameHistory {
 private current:GameRecord|null=null;
 private signature='';
 constructor(readonly repository:GameRepository,private uuid:()=>string,private now:()=>string,private changed:()=>void=()=>{}){}
 begin(state:State,autoGoalie:boolean){
  if(state.phase==='ready')return;
  const time=this.now();
  this.current={schemaVersion:1,gameId:this.uuid(),browserId:this.repository.browserId,startedAt:time,updatedAt:time,endedAt:null,status:'in_progress',result:null,score:{home:0,away:0},remainingSeconds:state.remaining,playedSeconds:0,initialDifficulty:state.difficulty,difficulty:state.difficulty,initialAutoGoalie:autoGoalie,autoGoalie};
  this.signature='';this.checkpoint(state,false,autoGoalie);
 }
 observe(state:State,paused:boolean,autoGoalie:boolean){
  const signature=JSON.stringify([state.phase,state.score,paused,state.difficulty,autoGoalie]);
  if(signature!==this.signature)this.checkpoint(state,paused,autoGoalie);
 }
 checkpoint(state:State,paused:boolean,autoGoalie:boolean,ending?:'abandoned'|'interrupted'){
  if(!this.current||this.current.status==='completed'||this.current.status==='abandoned')return;
  const completed=state.phase==='finished',time=this.now();
  this.current={...this.current,updatedAt:time,endedAt:completed||ending?time:null,
   status:completed?'completed':ending??(paused?'paused':'in_progress'),
   result:completed?(state.score[0]===state.score[1]?'draw':state.score[0]>state.score[1]?'win':'loss'):null,
   score:{home:state.score[0],away:state.score[1]},remainingSeconds:state.remaining,
   playedSeconds:Math.max(0,180-state.remaining),difficulty:state.difficulty,autoGoalie};
  this.signature=JSON.stringify([state.phase,state.score,paused,state.difficulty,autoGoalie]);
  this.repository.save(this.current);this.changed();
 }
}
/** UUID v4 on HTTPS and HTTP/LAN previews; no insecure Math.random fallback. */
export function browserUuid():string {
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
