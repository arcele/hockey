// TO DO
//  Take into account the angle of the boards when deflecting
//  Change position -> location
//  Need universal variable naming convention for Kinetic shapes on object to replace Puck.puck & Player.player


function Puck (hockey) {
    this.hockey = hockey;
    this.stage = hockey.stage;
    this.velocity = 0.0;
    this.angle = 0.0;
    this.position = { x:110, y:260 };
    this.shot = null;
    this.layer = new Kinetic.Layer({ id: 'puck'});
    this.render();
}

Puck.prototype.render = function() {
    this.puck = new Kinetic.Circle( // Hockey.puck.puck is probably a terrible name
	{
	    x: this.position.x + this.hockey.rink.offset.x,
	    y: this.position.y + this.hockey.rink.offset.y,
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

Puck.prototype.advance = function() {
    this.position.x = this.position.x + this.velocity * Math.sin(this.angle);
    this.position.y = this.position.y + this.velocity * Math.cos(this.angle);

    if(this.velocity > 0) {
	this.velocity -= 0.012; // Drag
    } else {
	this.shot.stop();
    }

    if(this.position.x > 220) {
	this.position.x = 220 - (this.position.x - 220);
	this.deflect('x');
    } else if(this.position.x < 0) {
	this.position.x = Math.abs(this.position.x);
	this.deflect('x');
    }

    if(this.position.y > 520) {
	this.position.y = 520 - (this.position.y - 520);
	this.deflect('y');
    } else if (this.position.y < 0) {
	this.position.y = Math.abs(this.position.y);
	this.deflect('y');
    }

    this.puck.setX(this.position.x + this.hockey.rink.offset.x);
    this.puck.setY(this.position.y + this.hockey.rink.offset.y);
};

Puck.prototype.deflect = function(axis) {
    // Assumes completly vertical/horizontal deflections, need to take into account rounded corners of rink and angled sticks
    if(axis == 'x') {
	this.angle = 3 * Math.PI  / 2 - (this.angle - Math.PI / 2);
    } else if(axis == 'y') {
	this.angle = Math.PI / 2 + (Math.PI / 2 - this.angle);
    }
    if(this.angle > 2 * Math.PI) {
	this.angle -= 2 * Math.PI;
    }
};

Puck.prototype.stopShot = function() {
    if(this.shot) this.shot.stop();
};

