(function () {
     // Commenting out proper scoping for console access     var Hockey = {};
    Hockey = {};
    Hockey.stage = new Kinetic.Stage({
        container: 'container',
        width:800,
        height:800
	});

    Hockey.rink = new Rink(Hockey);
    Hockey.puck = new Puck(Hockey);
    Hockey.mouseMovements = [];
    Hockey.teams = [];
    var playersLayer = new Kinetic.Layer( {id: 'players'} );
    for(var i = 1; i <= 2; ++i) {
    Hockey.teams.push(new Team(Hockey, i, playersLayer));
    }

    Hockey.stage.add(playersLayer);

    var _hockey = Hockey;
    Hockey.stage.on('mousemove touchmove', function(event) {
        var eventPosition = this.getPointerPosition();
        var x = eventPosition.x;
        var y = eventPosition.y;
        _hockey.mouseMovements.push({x: x, y: y});
        if(_hockey.mouseMovements.length > 10) {
            var dump = _hockey.mouseMovements.shift();
        }

        if(_hockey.mouseMovements.length > 1) {
            var selectedPlayer = _hockey.teams[0].getSelectedPlayer();
            if(selectedPlayer != null) {
                var lastMovement = _hockey.mouseMovements[_hockey.mouseMovements.length - 1];
                var secondLastMovement = _hockey.mouseMovements[_hockey.mouseMovements.length - 2];
                if(!selectedPlayer.animation || !selectedPlayer.animation.isRunning()) {
                    selectedPlayer.move(selectedPlayer.location.x, selectedPlayer.location.y + ((lastMovement.y - secondLastMovement.y)));
                }
                selectedPlayer.rotate((lastMovement.x - secondLastMovement.x) / 3);
                // Collision?
                //if(selectedPlayer.collided) {
				if(selectedPlayer.collisionType != null) {
					if(selectedPlayer.collisionType == Player.CONSTANTS.collisionTypes.SHOT) {
						if(console) console.log("Shot");
						_hockey.puck.shoot(8, selectedPlayer.stickAngle);

					} else if(selectedPlayer.collisionType == Player.CONSTANTS.collisionTypes.BUMP) {
						// Body Stroke direction should depend on the angle where the puck hits the circle of the body.  This is just a placeholder
						if(console) console.log("Bump");
						_hockey.puck.shoot(3, Math.random() * Math.PI * 2); 
					}
					selectedPlayer.resetCollisions();
				}
			}
		}
	});
})();