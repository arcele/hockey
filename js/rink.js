
function Rink (hockey) {
	this.hockey = hockey;
	this.offset = { x:5, y:25 }; 
//	this.offset = { x: 200, y: 75 };
	this.size = { x: 221, y: 520 };
	this.layer = new Kinetic.Layer({ id: 'rink'});
	this.render();
}

Rink.prototype.render = function() {

	var rink = new Kinetic.Rect({
	// Ice Surface -- Proper Scale
		x: this.offset.x,
		y: this.offset.y,
		width: this.size.x,
		height: this.size.y,
		fill: '#EFEAF7',
		stroke: 'black',
		strokeWidth: 2,
		cornerRadius: 30

	});
	this.layer.add(rink);

	var rinkHeight = rink.getHeight();
	var rinkWidth = rink.getWidth();

	// Add Red Line / Blue Lines / Goal Lines -- Proper Scale
	var redLine = new Kinetic.Line({
		points: [this.offset.x, this.offset.y + rinkHeight/2, this.offset.x + rinkWidth, this.offset.y + rinkHeight/2],
		stroke: 'red',
		dashArray: [5, 1],
		strokeWidth: 2
	});
	this.layer.add(redLine);

	var blueLines = [ this.offset.y + rinkHeight * .375, this.offset.y + rinkHeight * .625 ];
	for (var i = 0; i < blueLines.length; i++) {
		var blueLine = new Kinetic.Line( { points: [this.offset.x, blueLines[i], this.offset.x + rinkWidth, blueLines[i]], stroke: 'blue', strokeWidth: 4 } );
		this.layer.add(blueLine);
	}

	var goalLines = [ (this.offset.y + rink.getHeight() * .055), (this.offset.y + rink.getHeight() * .945) ];
	for (var i = 0; i < goalLines.length; i++) {
		var goalLine = new Kinetic.Line( { points: [ this.offset.x, goalLines[i], this.offset.x + rinkWidth, goalLines[i]], stroke: 'red', strokeWidth: 2 } );
		this.layer.add(goalLine);
	}

	// Add Faceoff Circles -- ESTIMATED
	var circles = [ 
		{ x: (this.offset.x + rinkHeight * .1), y: (this.offset.y + rinkHeight * .2) },
		{ x: (this.offset.x + rinkWidth - rinkHeight * .1), y: (this.offset.y + rinkHeight * .2) },
		{ x: (this.offset.x + rinkHeight * .1), y: (this.offset.y + rinkHeight * .8) },
		{ x: (this.offset.x + rinkWidth - rinkHeight * .1), y: (this.offset.y + rinkHeight * .8) },
		{ x: (this.offset.x + rinkWidth/2), y: (this.offset.y + rinkHeight / 2), stroke: 'blue' }
	];

	for(var i = 0; i < circles.length; i++) {
		var circle = new Kinetic.Circle( { x: circles[i].x, y : circles[i].y, radius: (rinkHeight * .15 /2), stroke: circles[i].stroke? circles[i].stroke : 'red', strokeWidth:2 } );
		var dot = new Kinetic.Circle( { x: circles[i].x, y: circles[i].y, radius: (rinkHeight * .01), fill: 'red'});
		this.layer.add(circle);
		this.layer.add(dot);
	}

	// Creases - To Scale
	var creases = [ {y: this.offset.y + rinkHeight * .055, rotationDeg: 0 }, { y: this.offset.y + rinkHeight * .945, rotationDeg: 180 } ];

	for(var i = 0; i < creases.length; i++) {
		var crease = new Kinetic.Wedge( { x: this.offset.x + rinkWidth / 2, y: creases[i].y, radius: rinkHeight * .04, angleDeg: 180, rotationDeg: creases[i].rotationDeg, strokeWidth: 2, fill: '#aadddd', stroke: 'red' } );
		this.layer.add(crease);
	}


	// Bumper
	var bumper = new Kinetic.Rect({
		x: this.offset.x + rinkWidth - (rinkWidth * .9),
		y: this.offset.y + rinkHeight + 25,
		width: rinkWidth * .8,
		height: 35,
		fill: '#f4f4f4',
		stroke:'black',
		strokeWidth:2,
		cornerRadius:10,
		opacity: .7
	});
	bumperText = new Kinetic.Text({
		x: this.offset.x * 1.1,
		y: this.offset.y + rinkHeight + 25,
		width: rinkWidth * .8,
		height:275,
		align:'center',
		text: 'BUMP',
		fontSize:35,
		fill: 'black'
	});
	var _this = this;
	bumper.on('mouseover touchstart', function() {
		_this.hockey.puck.shoot(2.5 + Math.random() * 2, (3 / 4 * Math.PI) + Math.random() * 2 * Math.PI);
	});

	this.layer.add(bumperText);
	this.layer.add(bumper);
	

	this.hockey.stage.add(this.layer);
}

Rink.prototype.simplifyRadians = function(radians) {
	// Moving this higher to the rink, should be higher. BUT, it simplifies radians to always be a between 0 and 2 * Math.PI
	while(radians < 0) { radians += 2 * Math.PI; }
	while(radians > 2 * Math.PI) { radians -= 2 * Math.PI; }
	return radians;
};