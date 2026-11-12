import test from 'node:test';import assert from 'node:assert/strict';
import {createState,step,serve,goalCrossing,botCommands,autoGoalieCommand,DT} from '../.test/src/simulation.js';
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

test('auto goalie tracks puck through normal speed and rail limits',()=>{
 const s=createState();serve(s);s.players=s.players.filter(p=>p.team===0&&p.goalie);
 s.puck={x:350,y:360,vx:0,vy:0};const goalie=s.players[0];
 step(s,[autoGoalieCommand(s,0)]);assert.equal(goalie.x,200+225*DT);
 for(let i=0;i<120;i++)step(s,[autoGoalieCommand(s,0)]);
 assert.equal(goalie.x,245);
 s.puck.x=50;for(let i=0;i<120;i++)step(s,[autoGoalieCommand(s,0)]);
 assert.equal(goalie.x,155);
 step(s,[{seq:s.tick,tick:s.tick,team:0,player:5,axis:1,spin:0}]);
 assert.equal(goalie.x,155+225*DT,'Manual control still works without auto command');
});
