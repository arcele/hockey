const assert = require('node:assert/strict');
const {move} = require('../js/board-physics');
const step = (x,y,vx,vy,dt=1) => move(x,y,vx,vy,dt,221,520,30,3);
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-5, `${a} != ${b}`);
for (const [x,y,vx,vy,expectedX,expectedY] of [
    [217,200,5,0,214,200], [4,200,-5,0,7,200],
    [100,4,0,-5,100,7], [100,516,0,5,100,513]
]) { const p=step(x,y,vx,vy); near(p.x,expectedX); near(p.y,expectedY); near(p.vx,-vx); near(p.vy,-vy); }
// All four corner arcs reverse a shot along their radius.
for(const sx of [-1,1]) for(const sy of [-1,1]) {
    const cx=sx<0?30:191, cy=sy<0?30:490;
    const p=step(cx,cy,sx*30,sy*30);
    near(p.vx,-sx*30); near(p.vy,-sy*30);
}
function inside(p) {
    const cx=Math.max(30,Math.min(191,p.x)), cy=Math.max(30,Math.min(490,p.y));
    assert.ok(Math.hypot(p.x-cx,p.y-cy)<=27+1e-5, JSON.stringify(p));
}
// High speeds, repeated rebounds, shallow contacts, and arc/straight joins.
for(const speed of [0.1,5,30,500,2000]) for(let angle=0;angle<360;angle+=7) {
    let p={x:110,y:260,vx:speed*Math.cos(angle*Math.PI/180),vy:speed*Math.sin(angle*Math.PI/180)};
    for(let i=0;i<50;i++) {p=step(p.x,p.y,p.vx,p.vy);inside(p);near(Math.hypot(p.vx,p.vy),speed);}
}
for(const p of [step(30,3,0,-10),step(218,30,10,0),step(-10,-10,5,5)]) inside(p);
// Splitting a time interval must give the same flight and velocity.
const whole=step(110,260,700,900), half=step(110,260,700,900,.5);
const split=step(half.x,half.y,half.vx,half.vy,.5);
for(const k of ['x','y','vx','vy']) near(whole[k],split[k]);
console.log('Board physics regression checks passed');

// Exercise the Kinetic-facing puck adapter without a browser.
const vm=require('node:vm'), fs=require('node:fs'), path=require('node:path');
const context={Math, BoardPhysics:require('../js/board-physics'),
    Kinetic:{Animation:function(){this.start=()=>{};this.stop=()=>{};}}, console};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/puck.js'),'utf8'),context);
function puck() {
    const p=Object.create(context.Puck.prototype);
    let x=115,y=285;
    Object.assign(p,{radius:3,velocity:5,angle:Math.PI/2,layer:{},
        puck:{getX:()=>x,getY:()=>y,setX:v=>x=v,setY:v=>y=v},
        hockey:{rink:{offset:{x:5,y:25},size:{x:221,y:520},cornerRadius:30,
            simplifyRadians:a=>(a%(2*Math.PI)+2*Math.PI)%(2*Math.PI)},handleCollisions(){} }});
    return p;
}
const a=puck(), b=puck();
for(let i=0;i<60;i++) a.advance(1000/60);
for(let i=0;i<120;i++) b.advance(1000/120);
near(a.getLocation().x,b.getLocation().x);near(a.velocity,b.velocity);
const corrected=puck();
corrected.hockey.handleCollisions=()=>{corrected.puck.setX(105);corrected.puck.setY(125);};
corrected.advance(1000/60);near(corrected.getLocation().x,100);near(corrected.getLocation().y,100);
const zero=puck();zero.shoot(0,0);near(zero.velocity,0);near(zero.angle,0);
console.log('Puck integration checks passed');
