const assert=require('node:assert/strict');
global.BoardPhysics=require('../js/board-physics');
const {step}=require('../js/player-physics');
const rink={size:{x:221,y:520},cornerRadius:30};
const body={x:110,y:260,dx:0,dy:0,da:0,angle:0,radius:8,reach:11,length:15,hasStick:false};
function puck(x,y,vx=0,vy=0){return {x,y,vx,vy,radius:3};}
let p=step(puck(80,260,60,0),[body],rink);
assert.ok(p.vx<0 && p.x<99,'Fast body hit must rebound');
p=step(puck(98,270,10,0),[body],rink);
assert.ok(p.vy>0,'Glancing contact must use radial normal');
p=step(puck(99,260,-2,0),[body],rink);
assert.equal(p.vx,-2,'Separating contact must not bounce again');
p=step(puck(110,260),[body],rink);
assert.ok(Number.isFinite(p.x) && Math.hypot(p.x-110,p.y-260)>=11,'Coincident centers must separate safely');
const stick={...body,hasStick:true};
p=step(puck(90,240,30,0),[stick],rink);
assert.ok(p.vx<0,'Stationary stick must rebound a fast puck');
p=step(puck(90,229,30,0),[stick],rink);
assert.ok(Math.abs(p.vx-30)<1e-8,'Puck beyond stick tip must pass');
for(const direction of [-1,1]) {
 const swing={...stick,angle:-direction*.175,da:direction*.35};
 p=step(puck(110,240),[swing],rink);
 assert.ok(p.vx*direction>0,'Both swing directions must launch a resting puck');
 const wrapped=step(puck(110,240),[{...swing,angle:swing.angle+Math.PI*2}],rink);
 assert.ok(Math.hypot(p.x-wrapped.x,p.y-wrapped.y)<1e-6,'Angle wrap must preserve contact');
}
p=step(puck(122,260),[{...body,dx:1}],rink);
assert.ok(p.vx>0,'Moving body must transfer velocity');
// Player movement advances one tick and mirrors opponent tracks.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx={Math};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/player.js'),'utf8'),ctx);
function player(teamId){const p=Object.create(ctx.Player.prototype);Object.assign(p,{team:{id:teamId},hockey:{rink:{size:{x:221,y:520},offset:{x:5,y:25},simplifyRadians:a=>a}},position:{boundaries:{x:[110,110],y:[65,250]},hasStick:true},location:{x:110,y:teamId===1?100:300},target:{x:110,y:teamId===1?200:400},speed:1,bodyRadius:8,stickReach:7,stickLength:15,stickAngle:0,player:{group:{setX(){},setY(){},setRotation(){}}}});return p;}
let a=player(1);a.advance();assert.equal(a.location.y,101);
a=player(2);a.advance();assert.equal(a.location.y,301);
console.log('Player and stick regression checks passed');
