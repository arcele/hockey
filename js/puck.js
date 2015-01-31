// TO DO
//  Take into account the angle of the boards when deflecting
//  Need universal variable naming convention for Kinetic shapes on object to replace Puck.puck & Player.player


function Puck (hockey) {
    this.hockey = hockey;
    this.stage = hockey.stage;
    this.velocity = 0.0;
    this.angle = 0.0;
    this.initialLocation = { x:110, y:260 }; // this should be a constant
    this.shot = null;
    this.layer = new Kinetic.Layer({ id: 'puck'});
    this.render();
}

Puck.prototype.render = function() {
    this.puck = new Kinetic.Circle( // Hockey.puck.puck is probably a terrible name
	{
	    x: this.initialLocation.x + this.hockey.rink.offset.x,
	    y: this.initialLocation.y + this.hockey.rink.offset.y,
	    radius: 3,
	    fill: '#111',
	    stroke: '#000'
	}
    );
    this.layer.add(this.puck);
    this.stage.add(this.layer);
};

Puck.prototype.shoot = function(velocity, angle) {
    this.stopShot();
    this.velocity = velocity? velocity : Math.random() * 10;
    this.angle = angle? angle : Math.random() * 2 * Math.PI;
    var _this = this;
    this.shot = new Kinetic.Animation(
	function(frame) {
	        _this.advance();
        }, _this.layer
    );
    this.shot.start();
};

Puck.prototype.getLocation = function() {
	// Returns the x-y location of the puck relative to the rink.
	return {x: this.puck.getX() - this.hockey.rink.offset.x, y: this.puck.getY() - this.hockey.rink.offset.y };
}

Puck.prototype.advance = function() {
    // Why are we tracking the location manually, when it's automatically on the puck.puck??
    var puckLocation = this.getLocation();

    var newX = puckLocation.x + this.velocity * Math.sin(this.angle);
    var newY = puckLocation.y + this.velocity * Math.cos(this.angle);

    if(this.velocity > 0) {
        this.velocity -= .05; // Drag
    } else {
    	this.velocity = 0;
        this.shot.stop();
    }


    if(puckLocation.x > 220) {
        newX = 220 - (puckLocation.x - 220);
        this.deflect(0, 1, 0);
    } else if(puckLocation.x < 0) {
        newX = Math.abs(puckLocation.x);
        this.deflect(0, 1, 0);
    }

    if(puckLocation.y > 520) {
        newY = 520 - (puckLocation.y - 520);
        this.deflect(Math.PI, 1, 0);
    } else if (puckLocation.y < 0) {
        newY = Math.abs(puckLocation.y);
        this.deflect(Math.PI, 1, 0);
    }
    this.hockey.handleCollisions();
    this.puck.setX(newX + this.hockey.rink.offset.x);
    this.puck.setY(newY + this.hockey.rink.offset.y);

};

Puck.prototype.deflect = function(deflectionAngle, rotationDirection, rotationSpeed) {
	// Basic x-axis deflection
	this.angle = 2 * Math.PI - this.angle;
	// Add the angle of deflection
	this.angle += deflectionAngle;
	// Factor in rotation direction

    // Rotation Direction isn't really what matters most.  What matters is which surface of the stick is hit.
	// This should come through with the deflectionAngle.

	//this.angle *= rotationDirection;

	// Simplify
	this.angle = this.hockey.rink.simplifyRadians(this.angle);
	if(console) console.log('deflection');
};

Puck.prototype.stopShot = function() {
    if(this.shot) this.shot.stop();
};

