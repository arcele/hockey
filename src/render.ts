import {W,H,type State} from './simulation.js';
const orange='#ef9650',red='#dc555b';
export function render(ctx:CanvasRenderingContext2D,s:State,selected:number){
 const c=ctx;const scale=c.canvas.width/W;c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,W,H);
 c.save();c.shadowColor='#0009';c.shadowBlur=14;c.fillStyle='#293d48';c.beginPath();c.roundRect(4,4,392,712,55);c.fill();c.restore();
 c.fillStyle='#a8b8ba';c.beginPath();c.roundRect(12,12,376,696,49);c.fill();
 const ice=c.createLinearGradient(0,0,400,720);ice.addColorStop(0,'#f4fbf7');ice.addColorStop(.5,'#dfedf0');ice.addColorStop(1,'#f5faf7');c.fillStyle=ice;c.beginPath();c.roundRect(16,16,368,688,42);c.fill();
 c.save();c.beginPath();c.roundRect(16,16,368,688,42);c.clip();
 c.strokeStyle='#55778412';c.lineWidth=1;for(let i=0;i<65;i++){c.beginPath();c.moveTo((i*73)%400,(i*131)%720);c.lineTo((i*73)%400+65,(i*131)%720-15);c.stroke();}
 function line(y:number,color:string,width:number){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(16,y);c.lineTo(384,y);c.stroke();}
 line(360,'#ce646b',3);line(265,'#6d9aba',6);line(455,'#6d9aba',6);line(55,'#d28184',1.5);line(665,'#d28184',1.5);
 function circle(x:number,y:number,r:number,color:string){c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();}
 for(const y of [160,560])for(const x of [100,300]){circle(x,y,45,'#ce646b88');c.fillStyle='#ce646b';c.beginPath();c.arc(x,y,3,0,7);c.fill();}circle(200,360,52,'#6d9aba');
 c.save();c.translate(200,360);c.rotate(-Math.PI/2);c.textAlign='center';c.fillStyle='#30536520';c.font='900 24px system-ui';c.fillText('NORTHWEST',0,-7);c.font='600 9px system-ui';c.fillText('B U B B L E   H O C K E Y',0,12);c.restore();
 for(const y of [55,665]){c.fillStyle='#82bcc83d';c.beginPath();c.arc(200,y,43,0,Math.PI*2);c.fill();c.strokeStyle='#d05560';c.stroke();c.fillStyle='#ccd4cf';c.fillRect(157,y===55?27:665,86,28);c.strokeStyle='#7b8c8a';c.lineWidth=.7;for(let x=160;x<243;x+=7){c.beginPath();c.moveTo(x,y===55?27:665);c.lineTo(x,y===55?55:693);c.stroke();}c.strokeStyle='#d4535d';c.lineWidth=4;c.strokeRect(157,y===55?27:665,86,28);}
 s.players.forEach(p=>{c.strokeStyle='#31515d22';c.lineWidth=3;c.beginPath();p.goalie?(c.moveTo(p.min,p.y),c.lineTo(p.max,p.y)):(c.moveTo(p.x,p.min),c.lineTo(p.x,p.max));c.stroke();});c.restore();
 s.players.forEach(p=>{
 if(p.team===0&&p.slot===selected){c.strokeStyle=orange;c.lineWidth=2;c.setLineDash([4,4]);c.beginPath();c.arc(p.x,p.y,23,0,7);c.stroke();c.setLineDash([]);}
 c.save();c.translate(p.x,p.y);c.rotate(p.angle);
 if(!p.goalie){c.strokeStyle='#22333b';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(0,-17);c.lineTo(0,-43);c.stroke();c.strokeStyle='#bf9c6d';c.lineWidth=2;c.stroke();}
 c.shadowColor='#19313f55';c.shadowBlur=5;c.shadowOffsetY=4;c.fillStyle=p.team===0?orange:red;c.strokeStyle=p.team===0?'#b4602e':'#9e343f';c.lineWidth=2;c.beginPath();c.ellipse(0,0,p.goalie?18:13,13,0,0,7);c.fill();c.stroke();c.shadowBlur=0;c.shadowOffsetY=0;c.fillStyle='#fff9';c.fillRect(-9,-4,18,3);c.fillStyle='#203440';c.beginPath();c.arc(0,0,7,0,7);c.fill();c.restore();c.fillStyle='#fff';c.textAlign='center';c.font='bold 8px system-ui';c.fillText(String(p.slot+1),p.x,p.y+3);
 });
 c.save();c.shadowColor='#0007';c.shadowBlur=4;c.shadowOffsetY=3;c.fillStyle='#17252e';c.beginPath();c.ellipse(s.puck.x,s.puck.y,6,6,0,0,7);c.fill();c.restore();c.strokeStyle='#fff6';c.lineWidth=1;c.beginPath();c.arc(s.puck.x,s.puck.y,3,Math.PI,Math.PI*1.7);c.stroke();
 // Subtle bubble edge reflection.
 c.strokeStyle='#ffffff70';c.lineWidth=2;c.beginPath();c.roundRect(21,21,358,678,39);c.stroke();
}
