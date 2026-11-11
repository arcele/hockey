(function () {
	// Commenting out proper scoping for console access     var Hockey = {};
	Hockey = {};

	// Create Stage
	Hockey.stage = new Kinetic.Stage({
		container: 'container',
		width:235,
		height:620
	});

	// Last mouse position captured by event handlers
	Hockey.lastPosition = { x: 0, y: 0 }; 
	
	Hockey.rink = new Rink(Hockey);
	
	Hockey.teams = [];
	var playersLayer = new Kinetic.Layer( {id: 'players'} );
	for(var i = 1; i <= 2; ++i) {
		Hockey.teams.push(new Team(Hockey, i, playersLayer));
	}
	Hockey.stage.add(playersLayer);
	
	Hockey.puck = new Puck(Hockey);

    Hockey.scoreboard = new Scoreboard(document.getElementById('scoreboard'));
    Hockey.updateScoreboard = function(message) {
        this.scoreboard.render(this.teams[0].goals,this.teams[1].goals,message);
    };
    Hockey.checkGoal = function(from,to) {
        var end=Scoring.crossing(from,to,Hockey.puck.radius,Hockey.rink);
        if(end===null) return false;
        Hockey.teams[end].goals++;
        Hockey.goalScored=true;
        return true;
    };
    Hockey.faceoff = function() {
        this.puck.puck.setX(this.rink.offset.x+this.rink.size.x/2);
        this.puck.puck.setY(this.rink.offset.y+this.rink.size.y/2);
        this.puck.velocity=0;
        this.teams.forEach(function(team){team.players.forEach(function(player){player.stopMovement();});});
        this.goalPause=90;
    };
    Hockey.handleCollisions = function() {
        if(!this.goalScored) return;
        this.goalScored=false;
        this.faceoff();
        this.updateScoreboard('GOAL!  •  FACEOFF');
    };
    document.getElementById('new-game').addEventListener('click',function(){
        Hockey.teams.forEach(function(team){team.goals=0;});
        Hockey.faceoff();
        Hockey.updateScoreboard('NEW GAME  •  FACEOFF');
    });
    Hockey.updateScoreboard('PLAY');
    Hockey.puck.shoot(0, 0); // Keep simulation active so players can strike a resting puck.


	var _hockey = Hockey;
	Hockey.stage.on('mousemove touchmove', function(event) {
		var eventPosition = this.getPointerPosition();
		var x = eventPosition.x;
		var y = eventPosition.y - _hockey.rink.offset.y;

		// Control team 0
		var selectedPlayer = _hockey.teams[0].getSelectedPlayer();
		if(selectedPlayer != null) {
			if(!selectedPlayer.animation || !selectedPlayer.animation.isRunning()) {
				// Move vertically only 
				selectedPlayer.move(selectedPlayer.location.x, y);
			}
			if(Math.abs(x - _hockey.lastPosition.x) > 1) { // Don't rotate on slight deviations
				var rotationRads = (x - _hockey.lastPosition.x)
				if(Math.abs(rotationRads) < 5) { // rotate at least the 5 px of movement worth
					rotationRads = rotationRads < 0 ? -5 : 5;
				}
				selectedPlayer.rotate( rotationRads / 10);
			}


			
		}
		_hockey.lastPosition = {x: x, y: y};
	});

	// assume 600px height rink for meow
	var scale = window.innerHeight / 600
	//console.log(document.getElementById("zoom-wrapper").style["-webkit-transform"] = "scale("+scale + ")");
})();