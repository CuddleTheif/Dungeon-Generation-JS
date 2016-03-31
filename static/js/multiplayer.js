var multiplayerSocket, players = {}, connected = false;

document.addEventListener('DOMContentLoaded', function() {
	multiplayerSocket = new WebSocket("ws:"+document.location.hostname+":"+document.location.port);
	multiplayerSocket.onmessage = serverUpdate;
	multiplayerSocket.onopen = function(event) { connected = true; };
});

function updateServer(){
	if(connected)
		multiplayerSocket.send(JSON.stringify({x:player.x(), y:player.y(), dir:DIRECTIONS.indexOf(player.animation().substr(4, player.animation().length)), move:player.animation().startsWith('move')}));
}

function serverUpdate(event){
	console.log(event.data);
	var data = JSON.parse(event.data);
	
	if(data.action==="move"){
		if(players[data.id]==null){
			players[data.id] = {sprite:player.clone()};
			players[data.id].movements = createAnimations(players[data.id].sprite, false);
			characterLayer.add(players[data.id].sprite);
			player.moveToTop();
		}
		players[data.id].sprite.x(data.x);
		players[data.id].sprite.y(data.y);
		if(players[data.id].curMovement)
			players[data.id].curMovement.stop();
		if(data.move){
			players[data.id].movements[data.dir].start();
			players[data.id].sprite.setAnimation('move'+DIRECTIONS[data.dir]);
			players[data.id].curMovement = players[data.id].movements[data.dir];
		}
		else{
			players[data.id].sprite.setAnimation('idle'+DIRECTIONS[data.dir]);
			players[data.id].sprite.stop();
		}
		characterLayer.draw();
	}
	else if(data.action==="delete"){
		if(players[data.id].curMovement)
			players[data.id].curMovement.stop();
		players[data.id].sprite.destroy();
		players[data.id]=null;
		characterLayer.draw();
	}
	else if(data.action==="update")
		updateServer();
}