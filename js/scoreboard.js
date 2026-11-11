function Scoreboard(element) {
    var glyphs=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
    this.render=function(home,away,message) {
        [home,away].forEach(function(score,index){
            var target=element.querySelector(index===0?'#home-score':'#away-score');
            target.textContent='';
            String(score).padStart(2,'0').split('').forEach(function(number){
                var digit=document.createElement('span');digit.className='led-digit';
                glyphs[Number(number)].split('').forEach(function(on){
                    var dot=document.createElement('i');dot.className=on==='1'?'lit':'';digit.appendChild(dot);
                });target.appendChild(digit);
            });
        });
        element.querySelector('.score-status').textContent=message;
        element.querySelector('.score-announcement').textContent='Home '+home+', Away '+away+'. '+message;
    };
}
