(function () {
	// Commenting out proper scoping for console access     var Hockey = {};
	Hockey = {};
	Hockey.stage = new Kinetic.Stage({
		container: 'container',
		width:800,
		height:800
	});

	Hockey.lastPosition = { x: 0, y: 0 };
	Hockey.rink = new Rink(Hockey);
	Hockey.puck = new Puck(Hockey);
	Hockey.teams = [];
	var playersLayer = new Kinetic.Layer( {id: 'players'} );
	for(var i = 1; i <= 2; ++i) {
		Hockey.teams.push(new Team(Hockey, i, playersLayer));
	}

	Hockey.detectCollisions = function() {
		var playerCollisions = [];
		for(i = 0; i < this.teams.length; i++) {
			for(j = 0; j < this.teams[i].players.length; j++) {
				playerCollision = this.teams[i].players[j].detectCollision();
				if(playerCollision && playerCollision.collisionType) {
					playerCollisions.push(playerCollision);
				}
				this.teams[i].players[j].rotationSpeed = 0; // Reset the rotation speed after every detection, I think
			}
		}
		return playerCollisions.length > 0 ? playerCollisions : null;		
	}

	Hockey.handleCollisions = function() {
		var collisions = this.detectCollisions();
		if(collisions != null) {
			for(var i = 0; i < collisions.length; i++) {
				var collision = collisions[i];
				if(collision.collisionType == Player.CONSTANTS.collisionTypes.SHOT) {
					var shotAngle = (collision.player.stickAngle + (Math.PI / 2 * collision.player.rotationDirection));
					// Important factors for determining shot speed:
					// this.puck.velocity
					// collision.rotationSpeed
					// collision.movementSpeed
					// TO DO: Fix shot speed
					var shotSpeed = Math.min( 10, (collision.rotationSpeed + _hockey.puck.velocity) * 3 + 1)
					if(console) console.log("Shot by player ", collision.player.position.positionId, " on team ", collision.player.team.id, shotSpeed, shotAngle);
					this.puck.shoot(shotSpeed, shotAngle);
				} else if(collision.collisionType == Player.CONSTANTS.collisionTypes.BUMP) {
					// Body Stroke direction should depend on the angle where the puck hits the circle of the body.  This is just a placeholder
					if(console) console.log("Bump off player", collision.player.position.positionId, " on team ", collision.player.team.id);
					this.puck.shoot(3, Math.random() * Math.PI * 2);
				}
			}
		}
	}

	Hockey.stage.add(playersLayer);
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
			if(Math.abs(x - _hockey.lastPosition.x) > 1) {
				selectedPlayer.rotate((x - _hockey.lastPosition.x) / 15);
			}

			_hockey.handleCollisions();
			
		}
		_hockey.lastPosition = {x: x, y: y};
	});
})();