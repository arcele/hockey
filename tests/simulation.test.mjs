import test from 'node:test';import assert from 'node:assert/strict';
import {createState,step,serve,goalCrossing,botCommands,autoGoalieCommand,ASSISTED_GOALIE_SPEED,GOALIE_REACTION_TICKS,DT} from '../.test/src/simulation.js';
test('whole puck crossing, posts, wrong way and team attribution',()=>{assert.equal(goalCrossing(200,60,200,45),0);assert.equal(goalCrossing(200,660,200,680),1);assert.equal(goalCrossing(200,60,200,50),null);assert.equal(goalCrossing(238,60,238,45),null);assert.equal(goalCrossing(200,45,200,60),null);});
test('a goal counts once and serves after the pause',()=>{const s=createState();serve(s);s.players=[];s.puck={x:200,y:50,vx:0,vy:-400};step(s,[]);assert.deepEqual(s.score,[1,0]);assert.equal(s.phase,'goal');for(let i=0;i<150;i++)step(s,[]);assert.equal(s.phase,'playing');assert.deepEqual(s.score,[1,0]);});
test('input movement and rotation are bounded',()=>{const s=createState();serve(s);const x=s.players[0].x,y=s.players[0].y;step(s,[{team:0,player:0,axis:100,spin:100}]);assert.equal(s.players[0].x,x);assert.ok(s.players[0].y-y<=225*DT+.0001);assert.ok(s.players[0].angle<=12*DT+.0001);});
test('same seed state and input sequence replay identically',()=>{const a=createState(),b=createState();serve(a);serve(b);for(let tick=0;tick<3600;tick++){const c={seq:tick,tick,team:0,player:tick%6,axis:Math.sin(tick*.05),spin:1};step(a,[c,...botCommands(a)]);step(b,[c,...botCommands(b)]);}assert.deepEqual(a,b);});
test('high speed wall and corner shots remain in rounded rink',()=>{for(let angle=0;angle<360;angle+=13){const s=createState();serve(s);s.players=[];s.puck={x:200,y:360,vx:520*Math.cos(angle),vy:520*Math.sin(angle)};for(let i=0;i<300;i++){step(s,[]);const {x,y}=s.puck,cx=Math.max(58,Math.min(342,x)),cy=Math.max(58,Math.min(662,y));assert.ok(Math.hypot(x-cx,y-cy)<=36.01);}}});
test('body and capsule stick reflect moving puck',()=>{for(const y of [300,270]){const s=createState();serve(s);s.players=[{team:0,slot:0,x:200,y:300,angle:0,min:300,max:300,goalie:false}];s.puck={x:170,y,vx:500,vy:0};for(let i=0;i<20;i++)step(s,[]);assert.ok(s.puck.vx<0);}});
test('both stick directions launch a resting puck across angle wrap',()=>{for(const dir of [-1,1]){const s=createState();serve(s);s.players=[{team:0,slot:0,x:200,y:300,angle:-dir*.2,min:300,max:300,goalie:false}];s.puck={x:200,y:270,vx:0,vy:0};for(let i=0;i<5;i++)step(s,[{team:0,player:0,axis:0,spin:dir}]);assert.ok(s.puck.vx*dir>0);}});
test('match expires and cannot keep scoring',()=>{const s=createState();serve(s);s.remaining=DT/2;step(s,[]);assert.equal(s.phase,'finished');s.puck={x:200,y:50,vx:0,vy:-500};step(s,[]);assert.deepEqual(s.score,[0,0]);});

test('tabletop friction slows a free puck without changing its heading, then stops it',()=>{
 const s=createState();serve(s);s.players=[];s.puck={x:100,y:350,vx:90,vy:120};
 for(let i=0;i<60;i++)step(s,[]);
 assert.ok(Math.abs(Math.hypot(s.puck.vx,s.puck.vy)-70)<1e-7);
 assert.ok(Math.abs(s.puck.vx/s.puck.vy-.75)<1e-7);
 for(let i=0;i<60;i++)step(s,[]);
 assert.equal(s.puck.vx,0);assert.equal(s.puck.vy,0);
 const position={...s.puck};for(let i=0;i<120;i++)step(s,[]);
 assert.deepEqual(s.puck,position,'A resting puck must not drift or reverse');
});

test('both assisted goalies react late and move slowly within their rails',()=>{
 for(const team of [0,1]){
  const s=createState();serve(s);s.players=s.players.filter(p=>p.team===team&&p.goalie);
  s.puck={x:350,y:360,vx:0,vy:0};const goalie=s.players[0];
  const commands=()=>team===0?[autoGoalieCommand(s,0)]:botCommands(s);
  for(let i=0;i<GOALIE_REACTION_TICKS;i++)step(s,commands());
  assert.equal(goalie.x,200,'Must not react before the delay');
  step(s,commands());assert.equal(goalie.x,200+ASSISTED_GOALIE_SPEED*DT);
  for(let i=0;i<120;i++)step(s,commands());assert.equal(goalie.x,245);
  s.puck.x=50;
  for(let i=0;i<GOALIE_REACTION_TICKS;i++)step(s,commands());
  assert.equal(goalie.x,245,'Direction changes also require reaction time');
  for(let i=0;i<200;i++)step(s,commands());assert.equal(goalie.x,155);
 }
});
test('manual goalie retains immediate full-speed movement',()=>{
 const s=createState();serve(s);s.players=s.players.filter(p=>p.team===0&&p.goalie);
 step(s,[{seq:0,tick:0,team:0,player:5,axis:1,spin:0}]);
 assert.equal(s.players[0].x,200+225*DT);
});
test('faceoff clears stale goalie tracking and quick shots can beat delayed tracking',()=>{
 const s=createState();serve(s);s.players=s.players.filter(p=>p.team===1&&p.goalie);
 s.goaliePuckHistory.fill(350);serve(s);assert.ok(s.goaliePuckHistory.every(x=>x===200));
 s.puck={x:230,y:130,vx:0,vy:-400};
 for(let i=0;i<60&&s.phase==='playing';i++)step(s,botCommands(s));
 assert.equal(s.score[0],1,'Fast off-center shot should beat slow reaction');
});

const bumpInput={seq:0,tick:0,team:0,player:0,axis:0,spin:0,bump:true};
test('bump nudges a resting puck inward once and respects cooldown',()=>{
 const s=createState();serve(s);s.players=[];s.puck={x:50,y:360,vx:0,vy:0};
 step(s,[bumpInput,bumpInput]);assert.equal(s.bumpCount,1);assert.ok(s.puck.vx>0);assert.ok(s.puck.x>50);assert.equal(s.bumpCooldown,180);
 s.puck.vx=0;s.puck.vy=0;step(s,[bumpInput]);assert.equal(s.bumpCount,1);assert.equal(s.puck.vx,0);
 for(let i=0;i<179;i++)step(s,[]);
 step(s,[bumpInput]);assert.equal(s.bumpCount,2);assert.ok(Math.hypot(s.puck.vx,s.puck.vy)>170);
 assert.deepEqual(s.score,[0,0]);
});
test('bump cannot alter fast shots or inactive phases',()=>{
 const s=createState();step(s,[bumpInput]);assert.equal(s.bumpCount,0);
 serve(s);s.players=[];s.puck={x:200,y:360,vx:100,vy:0};step(s,[bumpInput]);assert.equal(s.bumpCount,0);
 s.phase='goal';s.wait=100;step(s,[bumpInput]);assert.equal(s.bumpCount,0);
 s.phase='finished';step(s,[bumpInput]);assert.equal(s.bumpCount,0);
});

test('both teams defenders reach end boards with their sticks',()=>{
 for(const team of [0,1])for(const slot of [3,4]){
  const s=createState();serve(s);const defender=s.players.find(p=>p.team===team&&p.slot===slot);
  const end=team===0?680:40, wallY=team===0?698:22;
  assert.equal(team===0?defender.max:defender.min,end);
  defender.y=end;
  defender.angle=Math.atan2(28,-(wallY-end))-.2;
  s.players=[defender];s.puck={x:defender.x+28,y:wallY,vx:0,vy:0};
  for(let i=0;i<5;i++)step(s,[{seq:i,tick:s.tick,team,player:slot,axis:team===0?1:-1,spin:1}]);
  assert.equal(defender.y,end,'Movement must clamp to extended rail');
  assert.ok(Math.hypot(s.puck.vx,s.puck.vy)>0,'Stick must dislodge a puck against the end board');
  assert.ok(s.puck.y>=22 && s.puck.y<=698);
 }
});

test('both teams wing forwards can sweep pucks off the attacking corner boards',()=>{
 for(const team of [0,1])for(const slot of [0,1]){
  const s=createState();serve(s);const forward=s.players.find(p=>p.team===team&&p.slot===slot);
  const end=team===0?40:680;
  assert.equal(team===0?forward.min:forward.max,end);
  forward.y=end;
  const puckX=forward.x<200?58-36*Math.cos(Math.PI/6):342+36*Math.cos(Math.PI/6);
  forward.angle=Math.atan2(puckX-forward.x,0)-.25;
  s.players=[forward];s.puck={x:puckX,y:end,vx:0,vy:0};
  for(let i=0;i<7;i++)step(s,[{seq:i,tick:s.tick,team,player:slot,axis:team===0?-1:1,spin:1}]);
  assert.equal(forward.y,end,'Forward must clamp to the extended attacking rail');
  assert.ok(Math.hypot(s.puck.vx,s.puck.vy)>0,'Swing must dislodge puck from rounded corner');
  const cx=Math.max(58,Math.min(342,s.puck.x)),cy=Math.max(58,Math.min(662,s.puck.y));
  assert.ok(Math.hypot(s.puck.x-cx,s.puck.y-cy)<=36.01);
 }
});

test('faster stick rotation transfers more speed to a stationary puck',()=>{
 function shot(spin){
  const s=createState();serve(s);s.players=[{team:0,slot:0,x:200,y:300,angle:-.25,min:300,max:300,goalie:false}];
  s.puck={x:200,y:270,vx:0,vy:0};let peak=0;
  for(let i=0;i<60;i++){step(s,[{seq:i,tick:s.tick,team:0,player:0,axis:0,spin}]);peak=Math.max(peak,Math.hypot(s.puck.vx,s.puck.vy));}
  return peak;
 }
 const slow=shot(.15),fast=shot(.6);
 assert.ok(slow>0);assert.ok(fast>slow*2,'Faster swing should produce a harder shot');
});

test('Novice moves and spins only one opponent at 75 percent speed',()=>{
 const s=createState('novice');serve(s);s.puck={x:200,y:360,vx:0,vy:0};
 const before=structuredClone(s.players);
 const commands=s.players.filter(p=>p.team===1).map(p=>({seq:0,tick:0,team:1,player:p.slot,axis:1,spin:1}));
 step(s,commands);
 const moved=s.players.filter((p,i)=>p.team===1&&(p.x!==before[i].x||p.y!==before[i].y||p.angle!==before[i].angle));
 assert.equal(moved.length,1);const p=moved[0],old=before.find(q=>q.team===1&&q.slot===p.slot);
 assert.ok(Math.abs(p.y-old.y-225*.75*DT)<1e-8);
 assert.ok(Math.abs(p.angle-old.angle-12*.75*DT)<1e-8);
});
test('Novice bot commits to one player including goalie; Hard controls full team',()=>{
 const s=createState('novice');serve(s);s.puck={x:100,y:450,vx:0,vy:0};
 const first=botCommands(s);assert.equal(first.length,1);step(s,first);
 s.puck={x:200,y:80,vx:0,vy:0};
 for(let i=0;i<35;i++){const c=botCommands(s);assert.equal(c.length,1);assert.equal(c[0].player,first[0].player);step(s,c);}
 assert.equal(botCommands(s)[0].player,5,'Can switch to goalie after commitment');
 s.difficulty='hard';assert.equal(botCommands(s).length,6);
});
test('Hard keeps normal opponent speed and concurrent movement',()=>{
 const s=createState('hard');serve(s);const before=structuredClone(s.players);
 step(s,s.players.filter(p=>p.team===1&&!p.goalie).map(p=>({seq:0,tick:0,team:1,player:p.slot,axis:1,spin:1})));
 for(const p of s.players.filter(p=>p.team===1&&!p.goalie)){
  const old=before.find(q=>q.team===1&&q.slot===p.slot);
  assert.ok(Math.abs(p.y-old.y-225*DT)<1e-8);
 }
});
