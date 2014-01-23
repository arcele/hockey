function Player(hockey, team, positionId) {
    this.hockey = hockey;
    this.team = team;
    this.position = Player.CONSTANTS.positions[positionId];
    this.bodyRadius = 8;
    this.stickReach = 7;
    this.stickLength = 15;
    this.speed = 1;
    this.layer = team.layer;
    this.location = {
	    x: this.startingPoint('x'),
	    y: this.startingPoint('y')
    };
    this.stickAngle = Math.random() * Math.PI * 2;
    this.selected = false;
    this.collided = false;
    this.collisionType = null;
    this.rotationDirection = null;
    this.render();
}

Player.prototype.startingPoint = function(axis) {
    // Randomize player starting point
    var random = Math.random() * Math.abs(this.position.boundaries[axis][1] - this.position.boundaries[axis][0]);
    var position = random + this.position.boundaries[axis][0];
    if(this.team.id > 1) {
    	position = this.hockey.rink.size[axis] - Math.min(this.position.boundaries[axis][1], this.position.boundaries[axis][0]) - random;
    }
    return position;
};

Player.prototype.render = function() {
    this.player = {};
    this.player.group = new Kinetic.Group({
        x: this.location.x + this.hockey.rink.offset.x,
        y: this.location.y + this.hockey.rink.offset.y,
        rotation: this.stickAngle
    });

    this.player.body = new Kinetic.Circle({
	    radius: this.bodyRadius,
	    stroke: '#000',
	    fill: (this.team.id == 1)? '#F47940': '#E13A3E'
	});
    this.player.group.add(this.player.body);

    if(this.position.hasStick) {
        var stickStart = this.bodyRadius / 2 + this.stickReach;
        this.player.stick = new Kinetic.Line({
            points: [[0, (-.5 * this.bodyRadius) - this.stickReach], [0, (-1 * this.stickLength - this.stickReach - .5 * this.bodyRadius)]],
            stroke: '#452200',
            strokeWidth: 3
        });
        this.player.group.add(this.player.stick);
    }

    this.player.boundary = new Kinetic.Line({
	// assumes all skaters can only go straight, you know, like in bubble hockey
	    points: this.team.id == 1? [
		    [this.hockey.rink.offset.x + this.position.boundaries.x[0], this.hockey.rink.offset.y + this.position.boundaries.y[0]],
		    [this.hockey.rink.offset.x + this.position.boundaries.x[1], this.hockey.rink.offset.y + this.position.boundaries.y[1]]
	    ] : [
		    [this.hockey.rink.offset.x + this.hockey.rink.size.x - Math.min(this.position.boundaries.x[1], this.position.boundaries.x[0]),
		    this.hockey.rink.offset.y + this.hockey.rink.size.y - Math.min(this.position.boundaries.y[1], this.position.boundaries.y[0])],
		    [this.hockey.rink.offset.x + this.hockey.rink.size.x - Math.max(this.position.boundaries.x[1], this.position.boundaries.x[0]),
		    this.hockey.rink.offset.y + this.hockey.rink.size.y - Math.max(this.position.boundaries.y[1], this.position.boundaries.y[0])]
	    ],
	    stroke: '#333',
	    opacity: '.3',
	    strokeWidth: 2,
	}
    );

    if(this.team.id == 1) {
        this.player.playerSelector = new PlayerSelector(this);
    }

    this.layer.add(this.player.boundary);
    this.hockey.rink.layer.add(this.player.boundary);
    this.layer.add(this.player.group);
};

Player.prototype.move = function(x,y) {
    var _this = this;
    this.stopMovement();    // One animation movement at a time people
    this.movement = new Kinetic.Animation(
	    function(frame) {
	        _this.advance(x, y);
	    }, _this.layer
    );
    this.movement.start();
};

Player.prototype.rotate = function(rad) {
    // This would be neater as an animation
	var newRotation = this.hockey.rink.simplifyRadians(this.player.group.getRotation() + rad);
	this.rotationDirection = (rad > 0)? Player.CONSTANTS.rotationDirection.CLOCKWISE : Player.CONSTANTS.rotationDirection.COUNTER_CLOCKWISE;
	this.player.group.setRotation(newRotation);
	this.stickAngle = newRotation;
	this.detectCollision();
};

Player.prototype.detectCollision = function() {
	var xOffset = this.location.x - this.hockey.puck.location.x, xDistance = Math.abs(xOffset);
	var yOffset = this.location.y - this.hockey.puck.location.y, yDistance = Math.abs(yOffset);
	if(xDistance < this.bodyRadius && yDistance < this.bodyRadius) {
		// Body Bump
		this.collisionType = Player.CONSTANTS.collisionTypes.BUMP;
	} else if(xDistance < (this.bodyRadius + this.stickLength + this.stickReach) && yDistance < (this.bodyRadius + this.stickLength + this.stickReach)) {
		// Potential for Shot, depending on stick angle (ignore possibility of puck going between stick & body for now)
		var puckAngle = this.getPuckAngle();
		if(Math.abs(puckAngle - this.stickAngle) < Player.CONSTANTS.collisionTolerance) { // If the stick is reasonably close
			this.collisionType = Player.CONSTANTS.collisionTypes.SHOT;
		}
	}
};

Player.prototype.getPuckAngle = function() {
	var xOffset = this.hockey.puck.location.x - this.location.x, xDistance = Math.abs(xOffset);
	var yOffset = this.hockey.puck.location.y - this.location.y, yDistance = Math.abs(yOffset);
	// atan2 is relative to x axis, our stick angle is relative to y axis.  This madness must be fixed -- returning relative to the y axis for now.
	return this.hockey.rink.simplifyRadians(Math.atan2(yOffset, xOffset) + Math.PI / 2);
};

Player.prototype.advance = function(x, y) {
    // This works fine for team 0, but the locations on team 2 are jacked.  need to figure out how to handle drawing dots better, perhaps two boundaries objects for each position, one per team?
    if(this.location.x != x) {
        // Goalie movement
        this.location.x = this.location.x + this.speed;
    }
    if(this.location.y != y) {
        // Vertical Movement of skaters
		this.location.y = this.location.y < y ? (this.location.y + Math.min(this.speed, (y - this.location.y))) : (this.location.y - Math.min(this.speed, (this.location.y - y)));
    }
    // Ensure that we're within the dimensions allowed
    if(this.location.y > this.position.boundaries.y[1]) {
        this.location.y = this.position.boundaries.y[1];
    } else if(this.location.y < this.position.boundaries.y[0]) {
        this.location.y = this.position.boundaries.y[0];
    }
    if( (this.location.x == x || this.location.x == this.position.boundaries.x[0] || this.location.x == this.position.boundaries.x[1]) && (this.location.y == y || this.location.y == this.position.boundaries.y[0] || this.location.y == this.position.boundaries.y[1]) ) {
        this.stopMovement();
        return false;
    }
    this.player.group.setX(this.location.x + this.hockey.rink.offset.x);
    this.player.group.setY(this.location.y + this.hockey.rink.offset.y);
    this.advance(x,y);
};

Player.prototype.select = function() {
    this.team.resetSelectors();
    this.player.playerSelector.icon.setFill('red');
    this.layer.draw();
    this.selected = true;
};

Player.prototype.stopMovement = function() {
    if(this.movement) this.movement.stop();
};

Player.prototype.resetCollisions = function() {
    this.collisionType = null;
};

Player.CONSTANTS = {
    positions: [ {positionId: 1, abbreviation: 'LW', name: 'Left Wing', boundaries : { x: [25, 25], y: [20, 250]}, hasStick: true, wrapperWidth: 50, wrapperTop: 0, wrapperLeft: 0 },
		{positionId: 2, abbreviation: 'RW', name: 'Right Wing', boundaries : { x: [196, 196], y: [20, 250]}, hasStick: true, wrapperWidth: 50, wrapperTop: 0, wrapperLeft: 0 },
		{positionId: 3, abbreviation: 'C', name: 'Center', boundaries: { x:[110, 110], y:[65, 250]}, hasStick: true, wrapperWidth: 50, wrapperTop: 0, wrapperLeft: 0 },
		{positionId: 4, abbreviation: 'LD', name: 'Left Defenseman', boundaries: { x:[67, 67], y:[280, 500]}, hasStick: true, wrapperWidth: 80, wrapperTop: 265, wrapperLeft: -15 },
		{positionId: 5, abbreviation: 'RD', name: 'Right Defenseman', boundaries: { x:[154, 154], y:[280, 500]}, hasStick: true, wrapperWidth: 80, wrapperTop: 265, wrapperLeft: -15 },
		{positionId: 6, abbreviation: 'G', name: 'Goalie', boundaries: {x:[90,130], y:[485, 485]}, hasStick: false }
    ],
    collisionTypes: {
            "SHOT": 1,
            "BUMP": 2
    },
    collisionTolerance : .32, // Basically equiv to the size of the puck

    rotationDirection: {
    	"COUNTER_CLOCKWISE": -1,
    	"CLOCKWISE": 1
    }

};


function PlayerSelector(player) {
    this.player = player;
    this.hockey = player.hockey;
    if(this.player.position && player.position.abbreviation != 'G') {
        this.group = new Kinetic.Group({
            x: this.hockey.rink.offset.x + this.player.position.boundaries.x[0] - 25,
            y: this.hockey.rink.offset.y - 2,
            height:600
        });

        this.wrapper = new Kinetic.Rect({
            width: this.player.position.wrapperWidth,
            height: 260,
            x: this.player.position.wrapperLeft,
            y: this.player.position.wrapperTop,
            stroke: 'black',
            fill: 'blue',
            opacity: 0
        })
        this.group.add(this.wrapper);

        this.icon = new Kinetic.Circle({
            x: 25,
            radius: 15,
            stroke: 'black',
            strokeWidth:2,
            fill: '#ccc'
        });

        var _this = this;
        this.group.on('mouseover touchstart', function() {
            _this.player.select();
        });


        this.group.add(this.icon);

        this.character = new Kinetic.Text({
            fontSize: 15,
            x: 0,
            y: -8,
            width:50,
            align: 'center',
            text: this.player.position.abbreviation,
            fill: 'black',
            fontStyle: 'bold'
        });
        this.group.add(this.character);
        this.player.layer.add(this.group);
    }
};
