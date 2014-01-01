(function () {
     // Commenting out proper scoping for console access     var Hockey = {};
     Hockey = {};
     Hockey.stage = new Kinetic.Stage(
	 { container: 'container',
	   width:800,
	   height:800
	 }
     );

     Hockey.rink = new Rink(Hockey.stage);
     Hockey.puck = new Puck(Hockey);

     Hockey.teams = new Array();

     var playersLayer = new Kinetic.Layer( {id: 'players'} );
     for(var i = 0; i < 2; ++i) {
	 var team = { 
	     id: i+1,
	     players : new Array(),
	     layer: playersLayer 
	 };
	 for(var j = 0; j <= 5; ++j) {
	     team.players.push(new Player(Hockey, team, j));
	 }
	 Hockey.teams.push(team);
     }
     Hockey.stage.add(playersLayer);
     
})();
