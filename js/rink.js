
function Rink (stage) {
    this.stage = stage;
    this.offset = { x: 200, y: 75 };
    this.size = { x: 221, y: 520 };
    this.layer = new Kinetic.Layer({ id: 'rink'});
    this.render();
}

Rink.prototype.render = function() {

    var rink = new Kinetic.Rect(
	// Ice Surface -- Proper Scale
	{ x: this.offset.x,
	  y: this.offset.y,
	  width: this.size.x,
	  height: this.size.y,
	  fill: '#EFEAF7',
	  stroke: 'black',
	  strokeWidth: 2
	}
    );
    this.layer.add(rink);
    
    var rinkHeight = rink.getHeight();
    var rinkWidth = rink.getWidth();
    
    // Round out the boards -- Proper Scale
    var curves = [
	{ x: (200 + rinkHeight * .07), y: (75 + rinkHeight * .07), startAngle: Math.PI, endAngle: 1.5 * Math.PI },
	{ x: (200 + rinkWidth) - (rinkHeight * .07), y: (75 + rinkHeight * .07), startAngle: 1.5 * Math.PI, endAngle: 0 },
	{ x: (200 + rinkHeight * .07), y: (75 + rinkHeight * .93), startAngle:.5 * Math.PI, endAngle: Math.PI },
	{ x: (200 + rinkWidth) - (rinkHeight * .07), y: (75 + rinkHeight * .93), startAngle: 0, endAngle: .5 * Math.PI }
    ];
    
    var rinkRounding = new Kinetic.Shape( 
	{
	    drawFunc: function(canvas) {
		var context = canvas.getContext();
		for(var i = 0; i < curves.length; i++) {
		    context.beginPath();	    
		    context.arc(curves[i].x, curves[i].y, (rinkHeight * .07), curves[i].startAngle, curves[i].endAngle, false);
		    canvas.fillStroke(this);
		}
	    },
	    stroke:'black',
	    strokeWidth: 2
	}
    );
    this.layer.add(rinkRounding);
    
    // Add Red Line / Blue Lines / Goal Lines -- Proper Scale
    var redLine = new Kinetic.Line( 
	{ points: [200, 75 + rinkHeight/2, 200 + rinkWidth, 75 + rinkHeight/2],
	  stroke: 'red',
	  dashArray: [5, 1],
	  strokeWidth: 2
	}
    );
    this.layer.add(redLine);
    
    var blueLines = [ 75 + rinkHeight * .375, 75 + rinkHeight * .625 ];
    for (var i = 0; i < blueLines.length; i++) {
	var blueLine = new Kinetic.Line( { points: [200, blueLines[i], 200 + rinkWidth, blueLines[i]], stroke: 'blue', strokeWidth: 4 } );
	this.layer.add(blueLine);
    }
    
    var goalLines = [ (75 + rink.getHeight() * .055), (75 + rink.getHeight() * .945) ];
    for (var i = 0; i < goalLines.length; i++) {
	var goalLine = new Kinetic.Line( { points: [ 200, goalLines[i], 200 + rinkWidth, goalLines[i]], stroke: 'red', strokeWidth: 2 } );
	this.layer.add(goalLine);
    }
    
    // Add Faceoff Circles -- ESTIMATED
    var circles = [ 
	{ x: (200 + rinkHeight * .1), y: (75 + rinkHeight * .2) },
	{ x: (200 + rinkWidth - rinkHeight * .1), y: (75 + rinkHeight * .2) },
	{ x: (200 + rinkHeight * .1), y: (75 + rinkHeight * .8) },
	{ x: (200 + rinkWidth - rinkHeight * .1), y: (75 + rinkHeight * .8) },
	{ x: (200 + rinkWidth/2), y: (75 + rinkHeight / 2), stroke: 'blue' }
    ];
    
    for(var i = 0; i < circles.length; i++) {
	var circle = new Kinetic.Circle( { x: circles[i].x, y : circles[i].y, radius: (rinkHeight * .15 /2), stroke: circles[i].stroke? circles[i].stroke : 'red', strokeWidth:2 } );
	var dot = new Kinetic.Circle( { x: circles[i].x, y: circles[i].y, radius: (rinkHeight * .01), fill: 'red'});
	
	this.layer.add(circle);
	this.layer.add(dot);
    }
    
    // Creases - To Scale
    var creases = [ {y: 75 + rinkHeight * .055, rotationDeg: 0 }, { y: 75 + rinkHeight * .945, rotationDeg: 180 } ];
    
    for(var i = 0; i < creases.length; i++) {
	var crease = new Kinetic.Wedge( { x: 200 + rinkWidth / 2, y: creases[i].y, radius: rinkHeight * .04, angleDeg: 180, rotationDeg: creases[i].rotationDeg, strokeWidth: 2, fill: '#aadddd', stroke: 'red' } );
	this.layer.add(crease);
    }
    
    this.stage.add(this.layer);
}
