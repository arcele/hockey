function Team(hockey, id, playersLayer) {
    this.id = id;
    this.players = new Array();
    this.layer = playersLayer;
    this.goals = 0;
    for(var j = 0; j <= 5; ++j) {
        this.players.push(new Player(Hockey, this, j));
    }
}

Team.prototype.resetSelectors = function() {
    for(var i = 0; i < this.players.length-1; i++) {
        this.players[i].selected = false;
        this.players[i].stopMovement();
        this.players[i].player.playerSelector.icon.setFill("#ccc");
    }
    this.layer.draw();
};

Team.prototype.getSelectedPlayer = function() {
    var selected = null;
    for(var i = 0; i < this.players.length; i++) {
        if(this.players[i].selected == true) {
            selected = this.players[i];
            break
        }
    }
    return selected;
};