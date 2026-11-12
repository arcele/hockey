/** Portable simulation: no DOM, wall clock, randomness, rendering, or network I/O. */
export const DT=1/120, W=400, H=720, PUCK_RADIUS=6;
// Tabletop sliding friction: rink units / second²; stops rather than coasting forever.
export const PUCK_FRICTION=160;
export const ASSISTED_GOALIE_SPEED=60;
export const GOALIE_REACTION_TICKS=36; // 300 ms at 120 Hz
export type Team=0|1;
export type Difficulty='novice'|'hard';
export interface Command {seq:number;tick:number;team:Team;player:number;axis:number;spin:number;target?:number;bump?:boolean;assisted?:boolean}
export interface Skater {team:Team;slot:number;x:number;y:number;angle:number;min:number;max:number;goalie:boolean}
export interface State {difficulty:Difficulty;botSelected:number|null;botCommitTicks:number;goaliePuckHistory:number[];bumpCooldown:number;bumpCount:number;tick:number;remaining:number;phase:'ready'|'playing'|'goal'|'finished';wait:number;score:[number,number];lastGoal:Team|null;puck:{x:number;y:number;vx:number;vy:number};players:Skater[]}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export function createState(difficulty:Difficulty='hard'):State {
 const players:Skater[]=[];
 const slots=[[48,220,40,350],[352,220,40,350],[200,255,150,350],[120,480,390,680],[280,480,390,680],[200,650,155,245]];
 for(const team of [0,1] as Team[]) slots.forEach(([x,y,min,max],slot)=>players.push({team,slot,x:team?W-x:x,y:team?H-y:y,angle:team?Math.PI:0,min:team&&slot!==5?H-max:min,max:team&&slot!==5?H-min:max,goalie:slot===5}));
 return {difficulty,botSelected:null,botCommitTicks:0,goaliePuckHistory:Array(GOALIE_REACTION_TICKS).fill(200),bumpCooldown:0,bumpCount:0,tick:0,remaining:180,phase:'ready',wait:0,score:[0,0],lastGoal:null,puck:{x:200,y:360,vx:0,vy:0},players};
}
export function serve(s:State){s.goaliePuckHistory=Array(GOALIE_REACTION_TICKS).fill(200);s.puck={x:200,y:360,vx:55,vy:s.lastGoal===0?140:-140};s.phase='playing';}
export function goalCrossing(x0:number,y0:number,x1:number,y1:number):Team|null {
 for(const team of [0,1] as Team[]){const y=team===0?49:671;
 if(team===0?y0>y&&y1<=y:y0<y&&y1>=y){const x=x0+(x1-x0)*(y-y0)/(y1-y0);if(Math.abs(x-200)<=37)return team;}}
 return null;
}
function boards(p:State['puck']){
 const r=36,cx=clamp(p.x,58,342),cy=clamp(p.y,58,662),dx=p.x-cx,dy=p.y-cy,d=Math.hypot(dx,dy);
 if(d>r){const nx=dx/d,ny=dy/d;p.x=cx+nx*r;p.y=cy+ny*r;const dot=p.vx*nx+p.vy*ny;if(dot>0){p.vx-=1.94*dot*nx;p.vy-=1.94*dot*ny;}}
}
function contact(p:State['puck'],x:number,y:number,r:number,ux:number,uy:number){
 const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d>=r)return;
 const nx=d>1e-8?dx/d:1,ny=d>1e-8?dy/d:0;p.x=x+nx*(r+.001);p.y=y+ny*(r+.001);
 const dot=(p.vx-ux)*nx+(p.vy-uy)*ny;if(dot<0){p.vx-=1.78*dot*nx;p.vy-=1.78*dot*ny;}
 const speed=Math.hypot(p.vx,p.vy);if(speed>520){p.vx*=520/speed;p.vy*=520/speed;}
}
export function step(s:State,commands:Command[]){
 s.tick++;if(s.phase==='ready'||s.phase==='finished')return;
 if(s.phase==='goal'){if(--s.wait<=0)serve(s);return;}
 s.remaining=Math.max(0,s.remaining-DT);if(s.remaining<=0){s.phase='finished';return;}
 s.goaliePuckHistory.push(s.puck.x);s.goaliePuckHistory.shift();
 s.bumpCooldown=Math.max(0,s.bumpCooldown-1);
 if(commands.some(c=>c.bump) && s.bumpCooldown===0 && Math.hypot(s.puck.vx,s.puck.vy)<45){
    // Nudge inward, with alternating sideways bias to escape rails and repeated traps.
    const dx=200-s.puck.x,dy=360-s.puck.y;
    const angle=(Math.hypot(dx,dy)>10?Math.atan2(dy,dx):-Math.PI/2)+(s.bumpCount%2===0?.4:-.4);
    s.puck.vx=180*Math.cos(angle);s.puck.vy=180*Math.sin(angle);
    s.bumpCount++;s.bumpCooldown=180;
 }
 if(s.difficulty==='novice'){
    if(s.botCommitTicks<=0){s.botSelected=commands.find(c=>c.team===1)?.player??null;s.botCommitTicks=36;}
    s.botCommitTicks--;
 }
 const motions=s.players.map(p=>{
 const c=p.team===1&&s.difficulty==='novice'&&p.slot!==s.botSelected?undefined:commands.find(c=>c.team===p.team&&c.player===p.slot);
 const old=p.goalie?p.x:p.y;
 const pace=p.team===1&&s.difficulty==='novice'?.75:1;
 const speed=(p.goalie&&c?.assisted?ASSISTED_GOALIE_SPEED:225)*pace;
 const dest=c?.target===undefined?old+clamp(c?.axis??0,-1,1)*speed*DT:c.target;
 const next=clamp(old+clamp(dest-old,-speed*DT,speed*DT),p.min,p.max);
 return {p,old,delta:next-old,angle:p.angle,da:p.goalie?0:clamp(c?.spin??0,-1,1)*12*DT*pace};
 });
 // Relative puck and rotating tip travel stays below one pixel per substep.
 const count=Math.ceil((520*DT+225*DT+12*DT*43)/.75),dt=DT/count;
 for(let i=1;i<=count;i++){
 const p=s.puck,x=p.x,y=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;
 const goal=goalCrossing(x,y,p.x,p.y);
 if(goal!==null){s.score[goal]++;s.lastGoal=goal;s.phase='goal';s.wait=150;s.puck={x:200,y:360,vx:0,vy:0};return;}
 boards(p);
 for(let pass=0;pass<2;pass++){
 motions.forEach(m=>{const sk=m.p;const pos=m.old+m.delta*i/count;sk.goalie?sk.x=pos:sk.y=pos;sk.angle=m.angle+m.da*i/count;
 const ux=sk.goalie?m.delta/DT:0,uy=sk.goalie?0:m.delta/DT;
 contact(p,sk.x,sk.y,sk.goalie?24:19,ux,uy);
 if(!sk.goalie){const ex=Math.sin(sk.angle),ey=-Math.cos(sk.angle);const along=clamp((p.x-sk.x)*ex+(p.y-sk.y)*ey,17,43);const qx=ex*along,qy=ey*along;contact(p,sk.x+qx,sk.y+qy,8,ux-m.da/DT*qy,uy+m.da/DT*qx);}
 });boards(p);}
 }
 s.players.forEach(p=>p.angle=((p.angle%(2*Math.PI))+2*Math.PI)%(2*Math.PI));
 const speed=Math.hypot(s.puck.vx,s.puck.vy);
 const nextSpeed=Math.max(0,speed-PUCK_FRICTION*DT);
 if(nextSpeed===0){s.puck.vx=0;s.puck.vy=0;}
 else {const scale=nextSpeed/speed;s.puck.vx*=scale;s.puck.vy*=scale;}
}
export function botCommands(s:State):Command[]{
 let opponents=s.players.filter(p=>p.team===1);
 if(s.difficulty==='novice'){
    // Commit for 300 ms, then choose the player best positioned to reach the puck.
    let active=s.botCommitTicks>0?opponents.find(p=>p.slot===s.botSelected):undefined;
    if(!active){
        const distance=(p:Skater)=>{
            const x=p.goalie?clamp(s.puck.x,p.min,p.max):p.x;
            const y=p.goalie?p.y:clamp(s.puck.y,p.min,p.max);
            return Math.hypot(x-s.puck.x,y-s.puck.y)+.35*Math.hypot(p.x-s.puck.x,p.y-s.puck.y);
        };
        active=opponents.sort((a,b)=>distance(a)-distance(b)||a.slot-b.slot)[0];
    }
    opponents=active?[active]:[];
 }
 return opponents.map(p=>p.goalie?autoGoalieCommand(s,1):({seq:s.tick,tick:s.tick,team:1,player:p.slot,axis:0,target:s.puck.y,spin:Math.hypot(p.x-s.puck.x,p.y-s.puck.y)<65?1:Math.sin(s.tick/100+p.slot)*.15}));
}

/** Feed through the same movement limits and collision solver as human input. */
export function autoGoalieCommand(s:State,team:Team):Command {
 return {seq:s.tick,tick:s.tick,team,player:5,axis:0,spin:0,target:s.goaliePuckHistory[0],assisted:true};
}
