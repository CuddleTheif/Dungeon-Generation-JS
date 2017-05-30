var dirKeyStack = [], playerMovements = [], curMovement, touches = [];
var playerSpeed = 3;
const DIRECTIONS = ['Down', 'Left', 'Right', 'Up'], CONTROLS = {'0': 0, '1':1, '2':2, '3':3, '38': 3, '87': 3, '40': 0, '83': 0, '37': 1, '65': 1, '39': 2, '68': 2};

// Loads the player's animations
function loadAnimations(){	
	// Create the player movement animations
	playerMovements = createAnimations(player, true);
}

// Creates the 4 animations need for a basic sprite's movement
function createAnimations(sprite, updateView){
	var animations = [];
	for(var i=0;i<DIRECTIONS.length;i++){
		var addAnimation = function(i){
			animations.push(new Konva.Animation(function(frame) {
		        move(sprite, i, frame.timeDiff*playerSpeed/tileSize);
		        
		        if(chatBoxes[sprite.id()]!=null){
					chatBoxes[sprite.id()].x(sprite.x()+tileSize/4);
					chatBoxes[sprite.id()].y(sprite.y());
					chatLayer.draw();
		        }
		        
		        if(updateView){
		        	updateViewport();
		        	return false;
		        }
		        
			}, characterLayer));
		};
		addAnimation(i);
	}
	return animations;
}

// Move the player a certain direction with checking for invaild spaces and playing an animation (0 - down, 1 - left, 2 - right, 3 - down)
function movePlayer(dir){
	
	// if not animation set to moving direction set it and start the animation
	if(player.animation()!='move'+DIRECTIONS[dir]){
		var start = player.animation().startsWith('idle');
		player.setAnimation('move'+DIRECTIONS[dir]);
		if(start)
			player.start();
		if(curMovement)
			curMovement.stop();
		curMovement = playerMovements[dir];
		playerMovements[dir].start();
		updateServer('move');
	}
}

// Stop the player moving in the given direction
function stopPlayer(){
	if(curMovement){
		curMovement.stop();
		curMovement = null;
	}
	player.setAnimation('idle'+player.animation().substring('move'.length, player.animation().length));
	player.stop();
	characterLayer.draw();
	updateServer('move');
}

// Zoom the view by the given value
function changeZoom(change){
  if(zoom+change>0.25 && zoom+change<2)
    zoom += change;
  resize();
  updateViewport();
}

// Add Key input
document.addEventListener('keydown', function(event) {
	
	if(event.keyCode==13 && chatBoxes[player.id()]==null){
		event.preventDefault();
		setTimeout(function() { 
			var text = prompt("Enter text to say.", "");
			if(text!==null && text.trim()!=="")
				sendChat(text);
		}, 1);
	}
	
  
	if(CONTROLS[event.keyCode.toString()]!=null){
		event.preventDefault();
		addKeyToStack(event.keyCode);
	}
});

document.addEventListener('touchstart', touchStart);
document.addEventListener('touchend', touchDone);
document.addEventListener('touchcancel', touchDone);

function touchStart(event){
	event.preventDefault();
	for(var i=0;i<event.changedTouches.length;i++){
		if(event.changedTouches[i].pageX<=window.innerWidth/5 && dirKeyStack.indexOf(1)==-1)
			addKeyToStack(1);
		if(event.changedTouches[i].pageX>=window.innerWidth*4/5 && dirKeyStack.indexOf(2)==-1)
			addKeyToStack(2);
		if(event.changedTouches[i].pageY<=window.innerHeight/5 && dirKeyStack.indexOf(3)==-1)
			addKeyToStack(3);
		if(event.changedTouches[i].pageY>=window.innerHeight*4/5 && dirKeyStack.indexOf(0)==-1)
			addKeyToStack(0);
	}
}

function touchDone(event){
	event.preventDefault();
  	for(var i=0;i<event.changedTouches.length;i++){
		if(event.changedTouches[i].pageX<=window.innerWidth/5 && dirKeyStack.indexOf(1)!=-1)
			removeKeyFromStack(1);
		if(event.changedTouches[i].pageX>=window.innerWidth*4/5 && dirKeyStack.indexOf(2)!=-1)
			removeKeyFromStack(2);
		if(event.changedTouches[i].pageY<=window.innerHeight/5 && dirKeyStack.indexOf(3)!=-1)
			removeKeyFromStack(3);
		if(event.changedTouches[i].pageY>=window.innerHeight*4/5 && dirKeyStack.indexOf(0)!=-1)
			removeKeyFromStack(0);
	}
}

document.addEventListener('keyup', function(event) {
	if(CONTROLS[event.keyCode.toString()]!=null){
    	event.preventDefault();
		removeKeyFromStack(event.keyCode);
	}
  
  if(event.keyCode==69){
    changeZoom(.1);
  }
  else if(event.keyCode==81){
    changeZoom(-.1);
  }

});
;
function addKeyToStack(key){
	if(dirKeyStack.indexOf(key)==-1)
		dirKeyStack.push(key);
	if(CONTROLS[key.toString()]!=CONTROLS[dirKeyStack[dirKeyStack.length-2]])
		movePlayer(CONTROLS[key.toString()]);
}

function removeKeyFromStack(key){
	if(dirKeyStack.indexOf(key)==-1)
		return;
	if(dirKeyStack.indexOf(key)==dirKeyStack.length-1 && dirKeyStack.length>1)
		movePlayer(CONTROLS[dirKeyStack[dirKeyStack.length-2]]);
	dirKeyStack.splice(dirKeyStack.indexOf(key), 1);
	if(dirKeyStack.length==0)
		stopPlayer();
}
