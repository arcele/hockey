// Circle bodies and capsule sticks, sampled at <= 0.5 px of relative travel.
(function(root) {
    'use strict';
    function step(p, players, rink, travelScale) {
        travelScale = travelScale == null ? 1 : travelScale;
        var travel = Math.max(30, Math.hypot(p.vx, p.vy));
        players.forEach(function(s) {
            travel = Math.max(travel, Math.hypot(p.vx,p.vy) + Math.hypot(s.dx,s.dy) + Math.abs(s.da) * (s.reach+s.length));
        });
        var count = Math.max(1, Math.ceil(travel / .5));
        function contact(cx,cy,radius,ux,uy,fallbackX,fallbackY) {
            var dx=p.x-cx, dy=p.y-cy, d=Math.hypot(dx,dy);
            if(d > radius) return;
            var nx=d>1e-9?dx/d:fallbackX, ny=d>1e-9?dy/d:fallbackY;
            p.x=cx+nx*(radius+1e-7); p.y=cy+ny*(radius+1e-7);
            var closing=(p.vx-ux)*nx+(p.vy-uy)*ny;
            if(closing<0) {p.vx-=1.8*closing*nx;p.vy-=1.8*closing*ny;}
            var speed=Math.hypot(p.vx,p.vy);
            if(speed>30){p.vx*=30/speed;p.vy*=30/speed;}
        }
        for(var i=1;i<=count;i++) {
            var before={x:p.x,y:p.y};
            var b=BoardPhysics.move(p.x,p.y,p.vx,p.vy,travelScale/count,rink.size.x,rink.size.y,rink.cornerRadius,p.radius);
            Object.assign(p,b);
            if (p.onTravel && p.onTravel(before,p)) return p;
            // Several passes settle simultaneous body/stick/board contacts.
            for(var pass=0;pass<3;pass++) {
                players.forEach(function(s) {
                    var x=s.x+s.dx*i/count,y=s.y+s.dy*i/count,a=s.angle+s.da*i/count;
                    contact(x,y,s.radius+p.radius,s.dx,s.dy,1,0);
                    if(!s.hasStick) return;
                    var ex=Math.sin(a),ey=-Math.cos(a);
                    var along=Math.max(s.reach,Math.min(s.reach+s.length,(p.x-x)*ex+(p.y-y)*ey));
                    var qx=ex*along,qy=ey*along;
                    contact(x+qx,y+qy,p.radius+1.5,s.dx-s.da*qy,s.dy+s.da*qx,-ey,ex);
                });
                var corrected=BoardPhysics.move(p.x,p.y,p.vx,p.vy,0,rink.size.x,rink.size.y,rink.cornerRadius,p.radius);
                p.x=corrected.x;p.y=corrected.y;
            }
        }
        return p;
    }
    root.PlayerPhysics={step:step};
    if(typeof module!=='undefined' && module.exports) module.exports=root.PlayerPhysics;
})(typeof globalThis!=='undefined'?globalThis:this);
