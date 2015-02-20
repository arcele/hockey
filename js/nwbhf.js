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
					var shotSpeed = 5 * collision.rotationSpeed + collision.movementSpeed; // init value for a stationary puck
					if ( Math.abs(collision.movementSpeed) + collision.rotationSpeed == 0) { // stationary player
						shotSpeed = this.puck.velocity * .2;
					} else if (this.puck.velocity > 0) { // moving puck, stationary player
						var shotSpeed = Math.min( 10, (collision.rotationSpeed + _hockey.puck.velocity + collision.rotationSpeed) * 2 + 1); // 
					}
					if(shotSpeed > 1) {  // don't bother trying to shoot w/o velocity					
						if(console) console.log('Shot by Player', collision.player.position.positionId, ' on team ', collision.player.team.id);
						this.puck.shoot(shotSpeed, shotAngle);
					}
				} else if(collision.collisionType == Player.CONSTANTS.collisionTypes.BUMP) {
					// Body Stroke direction should depend on the angle where the puck hits the circle of the body.  This is just a placeholder
					var bumpSpeed = Math.max(1.2, this.puck.velocity * .3);
					if(console) console.log("Bump off player", collision.player.position.positionId, " on team ", collision.player.team.id, collision.deflectionAngle, this.puck.velocity, bumpSpeed);
					// move the puck out of the range of another bump before moving to prevent the dreaded double/triple/infiniti-bump
					// new x and y positions are out of wack, let's revisit this
					this.puck.puck.setX(collision.newX + this.rink.offset.x);
					this.puck.puck.setY(collision.newY + this.rink.offset.y);
					this.puck.layer.draw();
					this.puck.shoot(bumpSpeed, collision.deflectionAngle);
				}
			}
		}
	}

	
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

			_hockey.handleCollisions();
			
		}
		_hockey.lastPosition = {x: x, y: y};
	});

	// assume 600px height rink for meow
	var scale = window.innerHeight / 600
	//console.log(document.getElementById("zoom-wrapper").style["-webkit-transform"] = "scale("+scale + ")");
})();