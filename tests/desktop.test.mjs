import test from 'node:test';
import assert from 'node:assert/strict';
import {DesktopControls,hoverSlot} from '../.test/src/desktop-controls.js';
import {DT} from '../.test/src/simulation.js';
test('hover zones select all skaters and goalie',()=>{assert.deepEqual([[48,200],[352,200],[200,200],[120,480],[280,480],[200,650]].map(([x,y])=>hoverSlot(x,y)),[0,1,2,3,4,5]);});
test('mouse slides vertically, goalie horizontally, without click',()=>{const c=new DesktopControls();c.move(50,250);assert.equal(c.target,250);assert.equal(c.consumeSpin(),0);c.move(50,300);assert.equal(c.target,300);assert.equal(c.consumeSpin(),0);c.move(210,650);assert.equal(c.target,210);});
test('horizontal travel produces bounded signed swing once, independent of event count',()=>{for(const dir of [-1,1]){const a=new DesktopControls(),b=new DesktopControls();a.move(200,200);b.move(200,200);a.move(200+dir*30,200);for(let i=1;i<=10;i++)b.move(200+dir*i*3,200);let ta=0,tb=0;for(let i=0;i<30;i++){const sa=a.consumeSpin(),sb=b.consumeSpin();assert.ok(Math.abs(sa)<=1);ta+=sa*12*DT;tb+=sb*12*DT;}assert.ok(Math.abs(ta-dir*1.8)<1e-8);assert.ok(Math.abs(ta-tb)<1e-8);assert.equal(a.consumeSpin(),0);}});
test('lane changes and leaving clear queued swings',()=>{const c=new DesktopControls();c.move(180,200);c.move(220,200);assert.ok(c.consumeSpin()>0);c.move(320,200);assert.equal(c.consumeSpin(),0);c.move(340,200);c.clear();assert.equal(c.target,undefined);assert.equal(c.consumeSpin(),0);c.move(50,200);assert.equal(c.consumeSpin(),0);});
