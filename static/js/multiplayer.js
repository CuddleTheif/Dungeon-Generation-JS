var multiplayerSocket, players = {}, connected = false, chatBoxes = {}, chatTime = 5000, playerId;

function connectToServer(){
	multiplayerSocket = new WebSocket("ws:"+document.location.hostname+":"+document.location.port+"/"+name);
	multiplayerSocket.onmessage = serverUpdate;
	multiplayerSocket.onopen = function(event) { connected = true; };
        multiplayerSocket.onclose = function(event) {
          alert('You have been disconnected from the server! You are being moved back to the lobby!');
          document.location = '/';
        };
}

function updateServer(action){
	if(connected && player!=null){
		if(action==='move')
			multiplayerSocket.send(JSON.stringify({action:action, x:player.x(), y:player.y(), dir:DIRECTIONS.indexOf(player.animation().substr(4, player.animation().length)), move:player.animation().startsWith('move')}));
		else if(action==='text')
			multiplayerSocket.send(JSON.stringify({action:action, text: arguments[1]}));
	}
}

function serverUpdate(event){
	var data = JSON.parse(event.data);
console.log(data);
	if(data.id==playerId)
		return;
	
	if(data.action==="move"){
		if(players[data.id]==null){
			players[data.id] = {sprite:player.clone({id:'player'+data.id})};
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
	else if(data.action==="text" && chatBoxes[players[data.id].sprite.id()]==null)
		displayChat(data.text, players[data.id].sprite);
	else if(data.action==="delete"){
		if(players[data.id].curMovement)
			players[data.id].curMovement.stop();
		players[data.id].sprite.destroy();
		players[data.id]=null;
		characterLayer.draw();
	}
	else if(data.action==="update")
		updateServer('move');
	else if(data.action==="connect"){
		playerId = data.id;
		if(player!=null)
			player.id('player'+data.id);
	}
        else if(data.action==="disconnect"){
          alert('The Dungeon you are currently in has been deleted! You are being moved back to the lobby!');
          document.location = '/';
        }
}

// Send a chat to the server and display it on client
function sendChat(text){
	// Make sure there isn't already a chat displayed
	if(chatBoxes[player.id()]!=null)
		return false;
	
	// Display the chat on the client
	displayChat(text, player);
	
	// Send the text to the server
	updateServer('text', text);
}

// Display the given text from the given sprite
function displayChat(text, sprite){
	var chatBox = createChatBox(text);
	chatBox.x(sprite.x()+tileSize/4);
	chatBox.y(sprite.y());
	chatBoxes[sprite.id()] = chatBox;
	chatLayer.add(chatBox);
	chatLayer.draw();
	setTimeout(function(){ chatBox.destroyChildren(); chatBox.destroy(); chatLayer.draw(); chatBoxes[sprite.id()] = null; }, chatTime);
}

// Creates a chat box with the given text with a position of the player saying it
function createChatBox(text){
	
	// Draw the text itself
	var textBox = new Konva.Text({
	  text: text,
	  fontSize: tileSize/2,
	  fontFamily: 'Calibri',
	  fill: 'black',
	  width: tileSize*10,
	  padding: tileSize/4,
	  align: 'left'
	});
	textBox.transformsEnabled('position');
	
	// Set the text position based on the player pos
	if(textBox.getTextWidth()<textBox.width())
		textBox.width(textBox.getTextWidth()+tileSize/2);
	textBox.x(-textBox.width()+tileSize*3/4);
	textBox.y(-textBox.height()-tileSize/3);
	if(textBox.width()<tileSize*3/2)
		textBox.x(-tileSize/3);
	
	// Draw the base background of the text
	var background = new Konva.Rect({
	  x: textBox.x(),
	  y: textBox.y(),
	  width: textBox.width(),
	  height: textBox.height(),
	  fill: 'white',
	  stroke: 'black',
	  strokeWidth: tileSize/10
	});
	background.transformsEnabled('position');
	  
	// Draw the tab from the player to the text box
	var tabFill = new Konva.Line({
	  points: [-tileSize/4, textBox.y()+textBox.height()-tileSize/10, 0, 0, tileSize/4, textBox.y()+textBox.height()-tileSize/10],
	  fill: 'white',
	  stroke: 'black',
	  strokeWidth: 0,
	  closed : true
	});
	tabFill.transformsEnabled('position');
	var tabTop = new Konva.Line({
	  points: [-tileSize/4, textBox.y()+textBox.height()-tileSize/10, tileSize/4, textBox.y()+textBox.height()-tileSize/10],
	  stroke: 'white',
	  strokeWidth: tileSize/10
	});
 	tabTop.transformsEnabled('position');
	var tabOutline = tabFill.clone({
		closed: false,
	  strokeWidth: tileSize/10
	});
	tabOutline.transformsEnabled('position');
		
	// Add all the shapes to a group and return the group
	var group = new Konva.Group();
	group.add(background, tabFill, tabTop, tabOutline, textBox);
	return group;
}
