const assert=require('node:assert/strict');
const {crossing}=require('../js/scoring');
const rink={size:{x:221,y:520},offset:{x:5,y:25},cornerRadius:30,goalLines:[53.6,516.4]};
const at=(x,y)=>({x,y});
assert.equal(crossing(at(110,30),at(110,20),3,rink),0);
assert.equal(crossing(at(110,490),at(110,500),3,rink),1);
assert.equal(crossing(at(110,30),at(110,27),3,rink),null,'Whole puck must cross');
assert.equal(crossing(at(110,20),at(110,30),3,rink),null,'Wrong direction');
assert.equal(crossing(at(110,20),at(110,19),3,rink),null,'Already across');
assert.equal(crossing(at(130,30),at(130,20),3,rink),null,'Puck clips post');
assert.equal(crossing(at(50,100),at(200,0),3,rink),null,'Interpolate x at crossing');
assert.equal(crossing(at(110,100),at(110,4),3,rink),0,'Fast shot');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function Shape(o={}){this.x=o.x||0;this.y=o.y||0;this.add=()=>{};this.on=()=>{};this.setX=v=>this.x=v;this.setY=v=>this.y=v;this.getX=()=>this.x;this.getY=()=>this.y;}
let reset,display;
const ctx={Math,window:{innerHeight:800},document:{getElementById:id=>id==='new-game'?{addEventListener:(type,fn)=>reset=fn}:{}},
 Kinetic:{Stage:Shape,Layer:Shape,Circle:Shape,Animation:function(){this.start=()=>{};this.stop=()=>{};}},
 Rink:function(){Object.assign(this,rink);this.simplifyRadians=a=>(a+2*Math.PI)%(2*Math.PI);},Team:function(h,id){this.id=id;this.goals=0;this.players=[];this.layer={};},
 Scoreboard:function(){this.render=(h,a,message)=>display={h,a,message};}};
vm.createContext(ctx);
for(const file of ['board-physics','player-physics','scoring','puck','nwbhf']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+file+'.js'),'utf8'),ctx);
const h=ctx.Hockey,p=h.puck;
function fire(y,angle){h.goalPause=0;p.puck.setX(115.5);p.puck.setY(y+25);p.shoot(10,angle);p.advance(1000/60);}
fire(27,Math.PI);assert.equal(h.teams[0].goals,1);assert.equal(display.h,1);assert.equal(p.velocity,0);assert.equal(h.goalPause,90);
for(let i=0;i<180;i++)p.advance(1000/60);
assert.equal(h.teams[0].goals,1,'Goal must count once');assert.equal(display.message,'PLAY');
fire(493,0);assert.equal(h.teams[1].goals,1);assert.equal(display.a,1);
reset();assert.equal(h.teams[0].goals,0);assert.equal(h.teams[1].goals,0);assert.equal(display.h,0);assert.equal(display.a,0);
console.log('Scoring and scoreboard integration checks passed');
// Exercise the real LED renderer, including scores beyond two digits.
function node(){return {children:[],className:'',appendChild(c){this.children.push(c);},set textContent(v){this.text=v;this.children=[];},get textContent(){return this.text;}};}
const nodes={'#home-score':node(),'#away-score':node(),'.score-status':node(),'.score-announcement':node()};
ctx.document.createElement=()=>node();
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/scoreboard.js'),'utf8'),ctx);
const board=new ctx.Scoreboard({querySelector:s=>nodes[s]});
board.render(12,3,'PLAY');assert.equal(nodes['#home-score'].children.length,2);
assert.equal(nodes['#home-score'].children[0].children.length,15);
assert.ok(nodes['.score-announcement'].textContent.includes('Home 12, Away 3'));
board.render(100,0,'PLAY');assert.equal(nodes['#home-score'].children.length,3);
console.log('LED renderer checks passed');
