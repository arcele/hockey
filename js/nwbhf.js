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
     for(var i = 1; i <= 2; ++i) {
        Hockey.teams.push(new Team(Hockey, i, playersLayer));
     }

     Hockey.stage.add(playersLayer);
     
})();
