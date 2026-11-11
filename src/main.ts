import './style.css';
import {DesktopControls} from './desktop-controls.js';
import {createState,step,serve,botCommands,DT,W,H,type Command} from './simulation.js';
import {render} from './render.js';
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<header><a class="brand" href="./"><span class="brand-icon">N<span>W</span></span><span>NORTHWEST<small>BUBBLE HOCKEY FEDERATION</small></span></a><span class="edition">THE TABLETOP CLASSIC, REIMAGINED <b>02 / 2026</b></span></header>
<main><section class="arena"><div class="arena-label"><span><i></i> NORTHWEST ARENA</span><span>HOME ICE / 01</span></div><div class="table"><canvas tabindex="0" aria-label="Bubble hockey rink. Hover a lane to select a player, move vertically to slide and horizontally to spin. Keyboard: 1 through 6, arrows, A and D. Use the touch controls below on mobile."></canvas><div class="overlay" id="overlay"><span class="eyebrow">WELCOME TO THE FEDERATION</span><h1>Small rink.<br>Big rivalry.</h1><p>All the spin. All the ricochets.<br>Your favorite tabletop game, back on ice.</p><button id="start" class="primary">DROP THE PUCK <span>↗</span></button><small>YOU PLAY ORANGE · RED IS THE PRACTICE BOT</small></div></div><div class="rink-caption"><span>● ORANGE ATTACKS ↑</span><span>120 HZ · PRECISION ICE</span></div></section>
<aside><div class="intro"><span class="eyebrow">EST. IN THE PACIFIC NORTHWEST</span><h2>A little spin.<br>A lot of hockey.</h2><p>Pull the rod. Wind up. Find the gap.</p></div><section class="scoreboard" aria-label="Match scoreboard"><div class="board-top">NWBHF <span>● LIVE FROM THE TABLE</span></div><div class="scores"><div><h3>HOME <i class="orange"></i></h3><output id="home">00</output><small>NORTHWEST</small></div><span class="separator">:</span><div><h3>AWAY <i class="red"></i></h3><output id="away">00</output><small>VISITORS</small></div></div><div class="clock-row"><span>EXHIBITION<br><b>3 MIN MATCH</b></span><output id="clock">3:00</output><span>PERIOD<br><b>01</b></span></div><div id="status" role="status">READY FOR FACEOFF</div></section>
<div class="match-actions"><button id="pause" disabled>Ⅱ PAUSE</button><button id="reset">↺ NEW MATCH</button></div>
<section class="controls"><div class="section-title">YOUR SIDE OF THE TABLE <span>HOW TO PLAY</span></div><div class="player-select" aria-label="Select player">${['LW','RW','C','LD','RD','G'].map((s,i)=>`<button data-player="${i}" aria-pressed="${i===2}"><b>${i+1}</b>${s}</button>`).join('')}</div><div class="touch-controls"><div class="move-pad"><button data-hold="up" aria-label="Move up">↑</button><span>SLIDE</span><button data-hold="down" aria-label="Move down">↓</button></div><div class="spin-pad"><button data-hold="left" aria-label="Spin counterclockwise">↶</button><span>SPIN</span><button data-hold="right" aria-label="Spin clockwise">↷</button></div></div><p class="instructions"><kbd>1–6</kbd> select a player <kbd>↑ ↓</kbd> slide<br><kbd>A D</kbd> spin your stick <kbd>Space</kbd> pause</p><p class="mouse-tip"><span class="desktop-tip">Hover a lane to select. Move up/down to slide, left/right to spin. No clicking needed.</span><span class="mobile-tip">Drag a player to slide. Use the spin buttons with your other hand.</span></p></section><div class="footnote"><span class="seal">NW</span><p>Made for good rivalries.<br><span>One player + practice bot · Local play</span></p></div></aside></main><footer><span>NORTHWEST BUBBLE HOCKEY FEDERATION</span><span>LESS SCROLL. MORE SPIN.</span></footer>`;
const canvas=document.querySelector('canvas')!,ctx=canvas.getContext('2d')!;
let state=createState(),selected=2,paused=false,seq=0,target:number|undefined,dragging:number|null=null,last=0,acc=0,lastUI='';
const held=new Set<string>();
const desktop=new DesktopControls();
let mouseActive=false;
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(canvas.clientWidth*dpr);canvas.height=Math.round(canvas.clientWidth*H/W*dpr);render(ctx,state,selected);}
new ResizeObserver(resize).observe(canvas);
function select(n:number){selected=n;target=undefined;document.querySelectorAll<HTMLButtonElement>('[data-player]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.player)===n)));}
function clear(){held.clear();target=undefined;dragging=null;desktop.clear();mouseActive=false;}
function pause(){if(state.phase==='ready'||state.phase==='finished')return;paused=!paused;clear();sync();}
function sync(){
 const clock=`${Math.floor(Math.ceil(state.remaining)/60)}:${String(Math.ceil(state.remaining)%60).padStart(2,'0')}`;
 const status=paused?'PLAY PAUSED':state.phase==='goal'?`${state.lastGoal===0?'HOME':'AWAY'} GOAL · FACEOFF`:state.phase==='finished'?(state.score[0]===state.score[1]?'FULL TIME · TIE GAME':`${state.score[0]>state.score[1]?'HOME':'AWAY'} WINS · FULL TIME`):state.phase==='ready'?'READY FOR FACEOFF':'EXHIBITION · IN PLAY';
 const key=clock+status+state.score.join();if(key===lastUI)return;lastUI=key;
 document.querySelector('#clock')!.textContent=clock;document.querySelector('#home')!.textContent=String(state.score[0]).padStart(2,'0');document.querySelector('#away')!.textContent=String(state.score[1]).padStart(2,'0');document.querySelector('#status')!.textContent=status;
 const button=document.querySelector<HTMLButtonElement>('#pause')!;button.disabled=['ready','finished'].includes(state.phase);button.textContent=paused?'▶ RESUME':'Ⅱ PAUSE';
 const overlay=document.querySelector<HTMLDivElement>('#overlay')!;overlay.hidden=state.phase!=='ready'&&!paused&&state.phase!=='finished';
 if(state.phase!=='ready'){overlay.innerHTML=`<span class="eyebrow">NORTHWEST ARENA</span><h1>${paused?'Take a breather.':'That’s hockey.'}</h1><p>${paused?'Your table will be right here.':status}</p><button class="primary" id="continue">${paused?'BACK TO THE ICE':'PLAY AGAIN'} ↗</button>`;document.querySelector('#continue')?.addEventListener('click',()=>paused?pause():reset(true));}
}
function reset(start=false){state=createState();paused=false;clear();if(start)serve(state);lastUI='';if(!start){reset(true);return;}sync();}
document.querySelector('#start')!.addEventListener('click',()=>{serve(state);sync();canvas.focus();});
document.querySelector('#pause')!.addEventListener('click',pause);document.querySelector('#reset')!.addEventListener('click',()=>reset(true));
document.querySelectorAll<HTMLButtonElement>('[data-player]').forEach(b=>b.addEventListener('click',()=>{desktop.clear();mouseActive=false;select(Number(b.dataset.player));}));
document.querySelectorAll<HTMLButtonElement>('[data-hold]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(b.dataset.hold!);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>held.delete(b.dataset.hold!));});
const keyMap:Record<string,string>={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'up',ArrowRight:'down',a:'left',d:'right'};
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLButtonElement&&[' ','Enter'].includes(e.key))return;if(keyMap[e.key]){e.preventDefault();held.add(keyMap[e.key]);target=undefined;desktop.clear();mouseActive=false;}if(e.code==='Space'){e.preventDefault();if(!e.repeat)pause();}if(/^[1-6]$/.test(e.key)){desktop.clear();mouseActive=false;select(Number(e.key)-1);}});
window.addEventListener('keyup',e=>held.delete(keyMap[e.key]));window.addEventListener('blur',()=>{clear();if(!paused&&state.phase==='playing')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();if(!paused&&state.phase==='playing')pause();}});
function point(e:PointerEvent){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function mouseMove(e:PointerEvent){
    if(paused||state.phase!=='playing'){desktop.clear();mouseActive=false;return;}
    const q=point(e),slot=desktop.move(q.x,q.y);
    if(slot!==selected)select(slot);
    target=desktop.target;mouseActive=true;
}
canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'){mouseMove(e);return;}
    const q=point(e);const nearest=state.players.filter(p=>p.team===0).sort((a,b)=>Math.hypot(a.x-q.x,a.y-q.y)-Math.hypot(b.x-q.x,b.y-q.y))[0];
    desktop.clear();mouseActive=false;select(nearest.slot);canvas.setPointerCapture(e.pointerId);dragging=e.pointerId;target=nearest.goalie?q.x:q.y;
});
canvas.addEventListener('pointermove',e=>{
    if(e.pointerType==='mouse'){mouseMove(e);return;}
    if(dragging===e.pointerId){const q=point(e);target=selected===5?q.x:q.y;}
});
canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){desktop.clear();mouseActive=false;target=undefined;}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{
    if((e as PointerEvent).pointerType==='mouse'&&event==='pointerup')return;
    dragging=null;target=undefined;desktop.clear();mouseActive=false;
});
function frame(now:number){acc+=Math.min((now-last)/1000,.1);last=now;while(acc>=DT){if(!paused){const command:Command={seq:seq++,tick:state.tick,team:0,player:selected,axis:Number(held.has('down'))-Number(held.has('up')),spin:Math.max(-1,Math.min(1,Number(held.has('right'))-Number(held.has('left'))+(mouseActive?desktop.consumeSpin():0))),target};step(state,[command,...botCommands(state)]);}acc-=DT;}render(ctx,state,selected);sync();requestAnimationFrame(frame);}
select(2);sync();requestAnimationFrame(now=>{last=now;requestAnimationFrame(frame);});
