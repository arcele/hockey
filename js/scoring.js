// Whole-puck, outward crossings; all coordinates relative to the rink.
(function(root){
    function crossing(from,to,radius,rink) {
        var center=rink.size.x/2, half=rink.size.y*.04;
        for(var end=0;end<2;end++) {
            var line=rink.goalLines[end]-rink.offset.y;
            var threshold=line+(end===0?-radius:radius);
            if(end===0 ? !(from.y>threshold && to.y<=threshold) : !(from.y<threshold && to.y>=threshold)) continue;
            var t=(threshold-from.y)/(to.y-from.y);
            var x=from.x+(to.x-from.x)*t;
            if(Math.abs(x-center)+radius<=half) return end; // top goal belongs to home
        }
        return null;
    }
    root.Scoring={crossing:crossing};
    if(typeof module!=='undefined' && module.exports) module.exports=root.Scoring;
})(typeof globalThis!=='undefined'?globalThis:this);
