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

	Hockey.detectCollisions = function() {
		var playerCollisions = [];
		var puckLocation = this.puck.getLocation();
		// Detect Goals
		for(var i = 0; i < this.rink.goalLines.length; i++) {
			if(Math.abs(puckLocation.y + this.rink.offset.y - this.rink.goalLines[i]) < Math.abs(this.puck.velocity)) {
				// Puck is at / crossing the goalline on the y plane, make sure it's between the pipes
				if(Math.abs(puckLocation.x - (Hockey.rink.size.x / 2)) < (Hockey.rink.size.y * .04)) {
					// Puck is between the pipes, make sure it's traveling in the right direction
					if(i == 0 && this.puck.angle > Math.PI / 2 && this.puck.angle < 3 * Math.PI / 2) {
						if(console) console.log('top goal.');
						this.teams[1].goals++;
					} else if (i != 0 && this.puck.angle < Math.PI / 2 || this.puck.angle > 3 * Math.PI / 2) {
						if(console) console.log('bottom goal.');
						this.teams[0].goals++;
					}
					// Hockey.puck.shot.stop();  Goal detection isn't perfect yet, so don't stop the shot yet.
				}
			}
		}
		return playerCollisions.length > 0 ? playerCollisions : null;		
	}

	Hockey.handleCollisions = function() {
        this.detectCollisions(); // Legacy scoring only; contacts run in the fixed simulation.
    };
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