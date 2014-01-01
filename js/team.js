function Team(hockey, id, playersLayer) {
    this.id = id;
    this.players = new Array();
    this.layer = playersLayer;
    for(var j = 0; j <= 5; ++j) {
        this.players.push(new Player(Hockey, this, j));
    }
}

Team.prototype.resetSelectors = function() {
    for(var i = 0; i < this.players.length-1; i++) {
        this.players[i].player.selected = false;
        this.players[i].player.playerSelector.wrapper.setFill("#ccc");
    }
    this.layer.draw();
}