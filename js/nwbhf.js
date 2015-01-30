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
					var shotSpeed = Math.min( 10, (collision.rotationSpeed + _hockey.puck.velocity + collision.rotationSpeed) * 2 + 1)
					if(this.puck.velocity == 0) { // stationary puck
						shotSpeed = 3 * collision.rotationSpeed + 2 * collision.movementSpeed;
					} else if ( Math.abs(collision.movementSpeed) + collision.rotationSpeed == 0) { // stationary player
						shotSpeed = this.puck.velocity * .2;
					}
					if(shotSpeed > 1) {  // don't bother trying to shoot w/o velocity					
						this.puck.shoot(shotSpeed, shotAngle);
					}
				} else if(collision.collisionType == Player.CONSTANTS.collisionTypes.BUMP) {
					// Body Stroke direction should depend on the angle where the puck hits the circle of the body.  This is just a placeholder
					if(console) console.log("Bump off player", collision.player.position.positionId, " on team ", collision.player.team.id);
					var bumpSpeed = Math.max(2, this.puck.velocity * .2);
					this.puck.shoot(bumpSpeed, Math.random() * Math.PI * 2);
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
				selectedPlayer.rotate( Math.max(5, x - _hockey.lastPosition.x) / 10);
			}

			_hockey.handleCollisions();
			
		}
		_hockey.lastPosition = {x: x, y: y};
	});
})();