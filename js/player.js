function Player(hockey, team, positionId) {
    this.hockey = hockey;
    this.team = team;
    this.position = Player.CONSTANTS.positions[positionId];
    this.bodyRadius = 8;
    this.stickReach = 7;
    this.stickLength = 15;
    this.speed = 5;
    this.layer = team.layer;
    this.location = {
	    x: this.startingPoint('x'),
	    y: this.startingPoint('y')
    };
    this.stickAngle = Math.random() * 360; //Math.PI * 2;
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
        rotationDeg: this.stickAngle
    });

    this.player.body = new Kinetic.Circle({
	    radius: this.bodyRadius,
	    stroke: '#000',
	    fill: (this.team.id == 1)? '#F47940': '#E13A3E'
	});
    this.player.group.add(this.player.body);

    var stickStart = this.bodyRadius / 2 + this.stickReach;
    this.player.stick = new Kinetic.Line({
        points: [[stickStart, 0],[stickStart + this.stickLength, 0]],
        stroke: '#452200',
        strokeWidth: 3
    });
    this.player.group.add(this.player.stick);

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
    this.layer.add(this.player.boundary);
    this.hockey.rink.layer.add(this.player.boundary);
    this.layer.add(this.player.group);
};

Player.prototype.move = function(x,y) {
    var _this = this;
    this.movement = new Kinetic.Animation(
	function(frame) {
	    _this.advance(x, y);
	}, _this.layer
    );    
    this.movement.start();
};

Player.prototype.advance = function(x, y) {
    // This works fine for team 0, but the locations on team 2 are jacked.  need to figure out how to handle drawing dots better, perhaps two boundaries objects for each position, one per team?

    if(this.location.x != x) {
	// Goalie movement
	this.location.x = this.location.x + this.speed;
    } 
    if(this.location.y != y) {
	this.location.y = this.location.y < y ? (this.location.y + Math.min(this.speed, (y - this.location.y))) : (this.location.y - Math.min(this.speed, (this.location.y - y)));
	// Move player stick
	var stickPoints = this.player.stick.getPoints();
    }
    // Ensure that we're within the dimensions allowed
    if(this.location.y > this.position.boundaries.y[1]) {
	this.location.y = this.position.boundaries.y[1];
    } else if(this.location.y < this.position.boundaries.y[0]) {
	this.location.y = this.position.boundaries.y[0];
    }


    if(
	(this.location.x == x || this.location.x == this.position.boundaries.x[0] || this.location.x == this.position.boundaries.x[1])
	&& 
	(this.location.y == y || this.location.y == this.position.boundaries.y[0] || this.location.y == this.position.boundaries.y[1])
    ) {
	console.log('stopping player movement.');
	this.movement.stop()
	return false;
    }
    this.player.body.setX(this.location.x + this.hockey.rink.offset.x);
    this.player.body.setY(this.location.y + this.hockey.rink.offset.y);
    // Move the sticks -- Offset is copy and pasted from this.location.y math, needs to be functioned off
    stickPoints[0].y = this.location.y < y ? (stickPoints[0].y + Math.min(this.speed, (y - this.location.y))) : (stickPoints[0].y - Math.min(this.speed, (this.location.y - y)));
    stickPoints[1].y = this.location.y < y ? (stickPoints[1].y + Math.min(this.speed, (y - this.location.y))) : (stickPoints[1].y - Math.min(this.speed, (this.location.y - y)));

};


Player.CONSTANTS = {
    positions: [ {positionId: 1, abbreviation: 'LW', name: 'Left Wing', boundaries : { x: [25, 25], y: [20, 250]}, hasStick: true }, 
		 {positionId: 2, abbreviation: 'RW', name: 'Right Wing', boundaries : { x: [196, 196], y: [20, 250]}, hasStick: true },
		 {positionId: 3, abbreviation: 'C', name: 'Center', boundaries: { x:[110, 110], y:[65, 250]}, hasStick: true},
		 {positionId: 4, abbreviation: 'LD', name: 'Left Defenseman', boundaries: { x:[67, 67], y:[280, 500]}, hasStick: true },
		 {positionId: 5, abbreviation: 'RD', name: 'Right Defenseman', boundaries: { x:[154, 154], y:[280, 500]}, hasStick: true },
		 {positionId: 6, abbreviation: 'G', name: 'Goalie', boundaries: {x:[90,130], y:[485, 485]}, hasStick: false }
	       ]
};
