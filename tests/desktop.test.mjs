import test from 'node:test';
import assert from 'node:assert/strict';
import {DesktopControls,hoverSlot} from '../.test/src/desktop-controls.js';
test('hover zones select all skaters and goalie',()=>{assert.deepEqual([[48,200],[352,200],[200,200],[120,480],[280,480],[200,650]].map(([x,y])=>hoverSlot(x,y)),[0,1,2,3,4,5]);});
test('mouse slides vertically, goalie horizontally, without click',()=>{const c=new DesktopControls();c.move(50,250);assert.equal(c.target,250);assert.equal(c.consumeSpin(),0);c.move(50,300);assert.equal(c.target,300);assert.equal(c.consumeSpin(),0);c.move(210,650);assert.equal(c.target,210);});
test('mouse speed controls spin magnitude, direction, and maximum',()=>{
 for(const dir of [-1,1]){
  const slow=new DesktopControls(),fast=new DesktopControls(),capped=new DesktopControls();
  for(const c of [slow,fast,capped])c.move(180,200,false,0);
  slow.move(180+dir*2,200,false,50);fast.move(180+dir*10,200,false,50);capped.move(180+dir*25,200,false,50);
  const a=slow.consumeSpin(50),b=fast.consumeSpin(50),c=capped.consumeSpin(50);
  assert.ok(a*dir>0);assert.ok(Math.abs(b)>Math.abs(a)*4.9);assert.ok(Math.abs(c)<=1);
 }
});
test('constant velocity is consistent across pointer event rates',()=>{
 const a=new DesktopControls(),b=new DesktopControls();a.move(180,200,false,0);b.move(180,200,false,0);
 for(let t=10;t<=100;t+=10)a.move(180+t*.1,200,false,t);
 for(let t=25;t<=100;t+=25)b.move(180+t*.1,200,false,t);
 assert.ok(Math.abs(a.consumeSpin(100)-b.consumeSpin(100))<1e-8);
});
test('mouse stop, lane changes and clear discard spin without queued revolutions',()=>{
 const c=new DesktopControls();c.move(180,200,false,0);c.move(220,200,false,50);assert.ok(c.consumeSpin(50)>0);
 assert.ok(c.consumeSpin(130)<c.consumeSpin(50)*.1);assert.equal(c.consumeSpin(210),0);
 c.move(320,200,false,220);assert.equal(c.consumeSpin(220),0);
 c.move(340,200,false,240);c.clear();assert.equal(c.target,undefined);assert.equal(c.consumeSpin(240),0);
 c.move(50,200,false,300);assert.equal(c.consumeSpin(300),0);
});

test('auto goalie removes goalie hover lane without changing manual mode',()=>{
 const c=new DesktopControls();assert.equal(c.move(180,650,true),3);
 assert.equal(c.move(220,650,true),4);assert.equal(c.target,650);
 assert.equal(c.move(220,650,false),5);assert.equal(c.target,220);
});

test('deep defender hover remains selectable with manual goalie enabled',()=>{
 assert.equal(hoverSlot(120,680,false),3);
 assert.equal(hoverSlot(280,680,false),4);
 assert.equal(hoverSlot(200,680,false),5);
});
