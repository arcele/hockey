/** Legacy hover lanes; no click/drag required. Coordinates are rink units. */
export function hoverSlot(x:number,y:number,autoGoalie=false):number {
    // Reserve only the central goalie lane; defenders can hover behind the goal.
    if(y>=620 && x>=155 && x<=245 && !autoGoalie) return 5;
    if(y>=360) return x<200?3:4;
    if(x<124) return 0;
    if(x>276) return 1;
    return 2;
}

export class DesktopControls {
    private lastX:number|undefined;
    private lastTime:number|undefined;
    private velocity=0;
    private slot:number|undefined;
    target:number|undefined;

    clear(){this.lastX=undefined;this.lastTime=undefined;this.velocity=0;this.slot=undefined;this.target=undefined;}
    move(x:number,y:number,autoGoalie=false,time=performance.now()){
        const slot=hoverSlot(x,y,autoGoalie);
        const elapsed=time-(this.lastTime??time);
        if(this.slot!==slot || elapsed>120 || elapsed<0){this.velocity=0;}
        else if(elapsed>0){
            // Rink units per second -> angular velocity. Time-based smoothing
            // reduces event-rate noise without queuing rotations after a flick.
            const speed=(x-(this.lastX??x))*1000/Math.max(1,elapsed);
            const alpha=1-Math.exp(-elapsed/20);
            this.velocity+=(Math.max(-12,Math.min(12,speed*.04))-this.velocity)*alpha;
        }
        this.lastX=x;this.lastTime=time;this.slot=slot;
        this.target=slot===5?x:y;
        return slot;
    }
    consumeSpin(time=performance.now()){
        if(this.lastTime===undefined)return 0;
        const age=Math.max(0,time-this.lastTime);
        if(age>=160)return 0;
        // No events arrive once the mouse stops: fade the last measured speed.
        return this.velocity/12*Math.exp(-Math.max(0,age-25)/20);
    }
}
