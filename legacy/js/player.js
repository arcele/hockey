function Player(hockey, team, positionId) {
    this.hockey = hockey;
    this.team = team;
    this.position = Player.CONSTANTS.positions[positionId];
    this.bodyRadius = 8;
    this.stickReach = 7;
    this.stickLength = 15;
    this.speed = 1.5;  // "Skating Speed" -- Speed with which the player is capable of moving
    this.layer = team.layer;
    this.location = {
	    x: this.startingPoint('x'),
	    y: this.startingPoint('y')
    };
    this.stickAngle = Math.random() * Math.PI * 2;
    this.selected = false;
    this.rotationDirection = null;
    this.rotationSpeed = 0;
    this.movementSpeed = 0;
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

	this.player.numeral = new Kinetic.Text({
		fontSize:this.bodyRadius * 2,
		x:-8,
		y:-8,
		width:this.bodyRadius * 2,
		align:'center',
		text:this.position.positionId,
		fill:'black',
		fontStyle: 'bold'
	});
    this.player.group.add(this.player.numeral);

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
    this.target = {x:x,y:y};
};

Player.prototype.rotate = function(rad) {
    // Queue signed rotation, avoiding angle-wrap ambiguity and event-rate impulses.
    this.pendingRotation = (this.pendingRotation || 0) + rad;
    this.pendingRotation = Math.max(-Math.PI*2,Math.min(Math.PI*2,this.pendingRotation));
};

Player.prototype.advance = function() {
    var start = {x:this.location.x,y:this.location.y,angle:this.stickAngle,
        radius:this.bodyRadius,reach:this.bodyRadius/2+this.stickReach,
        length:this.stickLength,hasStick:this.position.hasStick};
    var target=this.target || this.location;
    for(var axis of ['x','y']) {
        var bounds=this.position.boundaries[axis];
        var low=Math.min(bounds[0],bounds[1]),high=Math.max(bounds[0],bounds[1]);
        if(this.team.id>1) {var oldLow=low;low=this.hockey.rink.size[axis]-high;high=this.hockey.rink.size[axis]-oldLow;}
        var dest=Math.max(low,Math.min(high,target[axis]));
        this.location[axis]+=Math.max(-this.speed,Math.min(this.speed,dest-this.location[axis]));
    }
    start.dx=this.location.x-start.x;start.dy=this.location.y-start.y;
    start.da=Math.max(-.35,Math.min(.35,this.pendingRotation || 0));
    this.pendingRotation=(this.pendingRotation || 0)-start.da;
    this.stickAngle=this.hockey.rink.simplifyRadians(this.stickAngle+start.da);
    this.player.group.setX(this.location.x+this.hockey.rink.offset.x);
    this.player.group.setY(this.location.y+this.hockey.rink.offset.y);
    this.player.group.setRotation(this.stickAngle);
    return start;
};

Player.prototype.select = function() {
    this.team.resetSelectors();
    this.player.playerSelector.icon.setFill('red');
    this.layer.draw();
    this.selected = true;
};

Player.prototype.stopMovement = function() {
    this.target = null;
    this.pendingRotation = 0;
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
    collisionTolerance : .175, // Basically equiv to the size of the puck

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
