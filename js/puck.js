// TO DO
//  Need universal variable naming convention for Kinetic shapes on object to replace Puck.puck & Player.player


function Puck (hockey) {
    this.hockey = hockey;
    this.stage = hockey.stage;
    this.radius = 3;
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
	    radius: this.radius,
	    fill: '#111',
	    stroke: '#000'
	}
    );
    this.layer.add(this.puck);
    this.stage.add(this.layer);
};

Puck.prototype.shoot = function(velocity, angle) {
    this.stopShot();
    this.elapsed = 0;
    this.velocity = velocity == null ? Math.random() * 10 : Math.max(0, velocity);
    this.angle = angle == null ? Math.random() * 2 * Math.PI : angle;
    var _this = this;
	this.shot = new Kinetic.Animation(
		function(frame) {
			_this.advance(frame.timeDiff);
		}, this.hockey.teams ? [_this.layer, this.hockey.teams[0].layer] : _this.layer
	);
    this.shot.start();
};

Puck.prototype.getLocation = function() {
	// Returns the x-y location of the puck relative to the rink.
	return {x: this.puck.getX() - this.hockey.rink.offset.x, y: this.puck.getY() - this.hockey.rink.offset.y };
}

// Keep legacy speed units (pixels per 60 Hz tick), but simulate fixed steps.
Puck.prototype.advance = function(timeDiff) {
    var tick = 1000 / 60;
    this.elapsed = (this.elapsed || 0) + Math.min(250, Math.max(0, timeDiff == null ? tick : timeDiff));
    while (this.elapsed >= tick && (this.velocity > 0 || this.hockey.teams)) {
        this.elapsed -= tick;
        var location = this.getLocation();
        var rink = this.hockey.rink;
        var travelScale = 0.5; // Half-speed puck travel, including after stick contacts.
        var next;
        if (this.hockey.teams) {
            var players=[];
            this.hockey.teams.forEach(function(team) {
                team.players.forEach(function(player) { players.push(player.advance()); });
            });
            next=PlayerPhysics.step({x:location.x,y:location.y,
                vx:this.velocity*Math.sin(this.angle),vy:this.velocity*Math.cos(this.angle),radius:this.radius},players,rink,travelScale);
        } else {
            next=BoardPhysics.move(location.x,location.y,this.velocity*Math.sin(this.angle),
                this.velocity*Math.cos(this.angle),travelScale,rink.size.x,rink.size.y,rink.cornerRadius,this.radius);
        }
        this.angle = rink.simplifyRadians(Math.atan2(next.vx, next.vy));
        this.velocity = Math.max(0, Math.hypot(next.vx,next.vy) - .05);
        this.puck.setX(next.x + rink.offset.x);
        this.puck.setY(next.y + rink.offset.y);
        // Resolve players after committing board movement so corrections survive.
        this.hockey.handleCollisions();
    }
    if (this.velocity === 0 && !this.hockey.teams) { this.elapsed = 0; this.stopShot(); }
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

