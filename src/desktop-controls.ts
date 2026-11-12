import {DT} from './simulation.js';

/** Legacy hover lanes; no click/drag required. Coordinates are rink units. */
export function hoverSlot(x:number,y:number,autoGoalie=false):number {
    if(y>=620 && !autoGoalie) return 5;
    if(y>=360) return x<200?3:4;
    if(x<124) return 0;
    if(x>276) return 1;
    return 2;
}

export class DesktopControls {
    private lastX:number|undefined;
    private rotation=0;
    private slot:number|undefined;
    target:number|undefined;

    clear(){this.lastX=undefined;this.rotation=0;this.slot=undefined;this.target=undefined;}
    move(x:number,y:number,autoGoalie=false){
        const slot=hoverSlot(x,y,autoGoalie);
        // Crossing a selector lane starts a fresh swing, not an impulse on the new player.
        if(this.slot!==slot){this.rotation=0;this.lastX=x;}
        const dx=x-(this.lastX??x);
        if(Math.abs(dx)>1.5){
            this.rotation=Math.max(-Math.PI*2,Math.min(Math.PI*2,this.rotation+dx*.06));
            this.lastX=x;
        }
        this.slot=slot;
        this.target=slot===5?x:y;
        return slot;
    }
    consumeSpin(){
        const angle=Math.max(-12*DT,Math.min(12*DT,this.rotation));
        this.rotation-=angle;
        return angle/(12*DT);
    }
}
