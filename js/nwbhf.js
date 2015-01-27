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
			}
		}
		return playerCollisions.length > 0 ? playerCollisions : null;		
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
				selectedPlayer.rotate((x - _hockey.lastPosition.x) / 6);
			}

			var collisions = _hockey.detectCollisions();
			if(collisions != null) {
				for(var i = 0; i < collisions.length; i++) {
					var collision = collisions[i];
					if(collision.collisionType == Player.CONSTANTS.collisionTypes.SHOT) {
						var shotAngle = (collision.player.stickAngle + (Math.PI / 2 * collision.player.rotationDirection));
						if(console) console.log("Puck was:" + collision.collisionDirection + " of stick -- Shot  :" + shotAngle);
						_hockey.puck.shoot(8, shotAngle);	
					} else if(collision.collisionType == Player.CONSTANTS.collisionTypes.BUMP) {
						// Body Stroke direction should depend on the angle where the puck hits the circle of the body.  This is just a placeholder
						if(console) console.log("Bump");
						_hockey.puck.shoot(3, Math.random() * Math.PI * 2);
					}
				}
			}
		}
		_hockey.lastPosition = {x: x, y: y};
	});
})();