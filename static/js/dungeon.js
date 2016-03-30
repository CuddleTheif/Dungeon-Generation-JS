var dungeonStage, dungeonLayer, characterLayer, parallaxLayer, player, gameLoaded = false;
var scale=32;

// Gets a sprite's current width
Konva.Sprite.prototype.getWidth = function(){
	return this.animations()[this.animation()][this.frameIndex()*4+2]*this.scaleX();
}

// Gets a sprite's current height
Konva.Sprite.prototype.getHeight = function(){
	return this.animations()[this.animation()][this.frameIndex()*4+3]*this.scaleY();
}

// Create the basic grid with the player after the page has loaded
document.addEventListener('DOMContentLoaded', function() {
	
	// Set all keys to false
	keys = [];
	for(var i=0;i<=222;i++)
		keys[i] = false;
	
	// Create the stage and layers
	dungeonStage = new Konva.Stage({
	  container: 'grid',
	  width: dungeon.length*scale,
	  height: dungeon[0].length*scale
	});
	dungeonLayer = new Konva.Layer();
	characterLayer = new Konva.Layer();
	parallaxLayer = new Konva.Layer();
	
	// Load the tilesheets before making any tiles
	var floorTileSheet = new Image();
    floorTileSheet.onload = function() {
		var wallTileSheet = new Image();
		wallTileSheet.onload = function() {
    	
    		// Draw the tiles in the grid
    		for(var x=0;x<dungeon.length;x++){
    			for(var y=0;y<dungeon[x].length;y++){
    				switch(dungeon[x][y]){
    					case -1: // nothing = roof tile
    						addTile(parallaxLayer, {x:x,y:y}, {x:wallTile.x*64, y:wallTile.y*160}, wallTileSheet, function(x, y){return x<0 || y<0 || x>=dungeon.length || y>=dungeon[x].length || dungeon[x][y]==-1 || dungeon[x][y+1]<=0;}, true);
    						if(dungeon[x][y-1]!=-1)
    							addTile(parallaxLayer, {x:x,y:y-1}, {x:wallTile.x*64, y:wallTile.y*160}, wallTileSheet, function(x, y){return x<0 || y<0 || x>=dungeon.length || y>=dungeon[x].length || dungeon[x][y]==-1 || dungeon[x][y+1]<=0;}, true);
    						break;
    					case 0: // wall tile
    						addTile(dungeonLayer, {x:x,y:y}, {x:wallTile.x*64, y:wallTile.y*160+64}, wallTileSheet, function(x, y){return x>=0 && y>=0 && x<dungeon.length && y<dungeon[x].length && dungeon[x][y]==0;}, false);
    						if(dungeon[x][y-1]!=-1)
    							addTile(parallaxLayer, {x:x,y:y-1}, {x:wallTile.x*64, y:wallTile.y*160}, wallTileSheet, function(x, y){return x<0 || y<0 || x>=dungeon.length || y>=dungeon[x].length || dungeon[x][y]==-1 || dungeon[x][y+1]<=0;}, true);
    						break;
    					case 1: // room tile
    						addTile(dungeonLayer, {x:x,y:y}, {x:roomTile.x*64, y:roomTile.y*96}, floorTileSheet, function(x, y){return dungeon[x][y]==1;}, true);
    						break;
    					case 2: // path tile
    						addTile(dungeonLayer, {x:x,y:y}, {x:pathTile.x*64, y:pathTile.y*96}, floorTileSheet, function(x, y){return dungeon[x][y]==2;}, true);
    						break;
    				}
    			}
    		}
    		
    		// Mark that the tiles have loaded
    		loadGame();
    	
		};
    	wallTileSheet.src = 'images/placeholder_walls.png';
    };
    floorTileSheet.src = 'images/placeholder_floors.png';
						    
	// Create the sprite for the player
	var playerImg = new Image();
    playerImg.onload = function() {

	  // Actually create the player's sprite with animations
      player = new Konva.Sprite({
        x: xPos*scale,
        y: yPos*scale,
        image: playerImg,
        animation: 'idleDown',
        animations: {
				      idleDown: [
				        32, 0, 32, 32
				      ],
				      moveDown: [
				      	0, 0, 32, 32,
				        32, 0, 32, 32,
				        64, 0, 32, 32,
				        32, 0, 32, 32
				      ],
				      idleLeft: [
				      	32, 32, 32, 32
				      ],
				      moveLeft: [
				      	0, 32, 32, 32,
				        32, 32, 32, 32,
				        64, 32, 32, 32,
				        32, 32, 32, 32
				      ],
				      idleRight: [
				      	32, 64, 32, 32
				      ],
				      moveRight: [
				      	0, 64, 32, 32,
				        32, 64, 32, 32,
				        64, 64, 32, 32,
				        32, 64, 32, 32
				      ],
				      idleUp: [
				      	32, 96, 32, 32
				      ],
				      moveUp: [
				      	0, 96, 32, 32,
				        32, 96, 32, 32,
				        64, 96, 32, 32,
				        32, 96, 32, 32
				      ]
				    },
        frameRate: 10,
        frameIndex: 0,
		          scale: { x:scale/48, y:scale/48 }
      });
      
      // add the shape to the layer
	  characterLayer.add(player);
	  
	  // Mark that the player has been loaded
	  loadGame();
      
	  // Update the viewport
	  updateViewport();
    };
    playerImg.src = 'images/placeholder_player.png';
	
}, false);

// Gets and adds the tile at the given position with the given variables
function addTile(layer, position, tilePosition, tileSheet, tester, corners){
	var subTiles = getSubTiles(position, tilePosition, tester, corners);
	layer.add(new Konva.Image({
		x: position.x*scale,
		y: position.y*scale,
		image: tileSheet,
		crop: {x:subTiles.topLeft.x,y:subTiles.topLeft.y,width:16,height:16},
		width: scale/2,
		height: scale/2
	}));
	layer.add(new Konva.Image({
		x: position.x*scale,
		y: position.y*scale+scale/2,
		image: tileSheet,
		crop: {x:subTiles.bottomLeft.x,y:subTiles.bottomLeft.y,width:16,height:16},
		width: scale/2,
		height: scale/2
	}));
	layer.add(new Konva.Image({
		x: position.x*scale+scale/2,
		y: position.y*scale,
		image: tileSheet,
		crop: {x:subTiles.topRight.x,y:subTiles.topRight.y,width:16,height:16},
		width: scale/2,
		height: scale/2
	}));
	layer.add(new Konva.Image({
		x: position.x*scale+scale/2,
		y: position.y*scale+scale/2,
		image: tileSheet,
		crop: {x:subTiles.bottomRight.x,y:subTiles.bottomRight.y,width:16,height:16},
		width: scale/2,
		height: scale/2
	}));
}

// Gets the relative position of the subtiles of a tile using autotile
function getSubTiles(pos, tilePos, tester, corners){
	var subTiles = {topLeft: {x:tilePos.x, y:tilePos.y}, topRight: {x:tilePos.x, y:tilePos.y}, bottomLeft: {x:tilePos.x, y:tilePos.y}, bottomRight: {x:tilePos.x, y:tilePos.y}};
	// Check for similar tile to left
	if(tester(pos.x-1,pos.y)){
	  subTiles.topLeft.x += 32;
	  subTiles.bottomLeft.x += 32;
	}
	else{
	  subTiles.topLeft.x += 0;
	  subTiles.bottomLeft.x += 0;
	}
	
	// Check for similar tile above
	if(tester(pos.x,pos.y-1)){
	  subTiles.topLeft.y += 64;
	  subTiles.topRight.y += 64;
	}
	else{
	  subTiles.topLeft.y += 32;
	  subTiles.topRight.y += 32;
	}
	
	// Check for similar tile to the right
	if(tester(pos.x+1,pos.y)){
	  subTiles.bottomRight.x += 16;
	  subTiles.topRight.x += 16;
	}
	else{
	  subTiles.bottomRight.x += 48;
	  subTiles.topRight.x += 48;
	}
	
	// Check for similar tile below
	if(tester(pos.x,pos.y+1)){
	  subTiles.bottomRight.y += 48;
	  subTiles.bottomLeft.y += 48;
	}
	else{
	  subTiles.bottomRight.y += 80;
	  subTiles.bottomLeft.y += 80;
	}
	
	//Check if corners if needed
	if(corners){
	
		// Check for top left corner
		if(subTiles.topLeft.x==tilePos.x+32 && subTiles.topLeft.y==tilePos.y+64 && !tester(pos.x-1,pos.y-1))
			subTiles.topLeft = {x:tilePos.x+32, y:tilePos.y};
		
		// Check for top right corner
		if(subTiles.topRight.x==tilePos.x+16 && subTiles.topRight.y==tilePos.y+64 && !tester(pos.x+1,pos.y-1))
			subTiles.topRight = {x:tilePos.x+48, y:tilePos.y};
		
		// Check for bottom left corner
		if(subTiles.bottomLeft.x==tilePos.x+32 && subTiles.bottomLeft.y==tilePos.y+48 && !tester(pos.x-1,pos.y+1))
			subTiles.bottomLeft = {x:tilePos.x+32, y:tilePos.y+16};
		
		// Check for bottom right corner
		if(subTiles.bottomRight.x==tilePos.x+16 && subTiles.bottomRight.y==tilePos.y+48 && !tester(pos.x+1,pos.y+1))
			subTiles.bottomRight = {x:tilePos.x+48, y:tilePos.y+16};
	}
	
	return subTiles;
}

// After everything has been loaded update the viewport add the layers to the screen
function loadGame(){
	if(!gameLoaded)
		gameLoaded = true;
	else{
		updateViewport();
		dungeonStage.add(dungeonLayer, characterLayer, parallaxLayer);
	}
}

// Move the given sprite a certain direction with checking for invaild spaces
function move(sprite, dir, distance) {
	var x = dir==1 ? -distance : (dir==2 ? distance : 0);
	var y = dir==0 ? distance : (dir==3 ? -distance : 0);
	sprite.x(sprite.x()+x);
	sprite.y(sprite.y()+y);
	if(dungeon[Math.trunc(sprite.x()/scale)][Math.trunc((sprite.y()+sprite.getHeight()/2)/scale)]<=0 || 
		dungeon[Math.trunc((sprite.x()+sprite.getWidth())/scale)][Math.trunc((sprite.y()+sprite.getHeight()/2)/scale)]<=0 ||
		dungeon[Math.trunc(sprite.x()/scale)][Math.trunc((sprite.y()+sprite.getHeight())/scale)]<=0 ||
		dungeon[Math.trunc((sprite.x()+sprite.getWidth())/scale)][Math.trunc((sprite.y()+sprite.getHeight())/scale)]<=0){
		found = true;
		sprite.x(sprite.x()-x);
		sprite.y(sprite.y()-y);
	}
}

// Udate the player's viewport onto the player
function updateViewport(){
	var viewport = document.getElementById("viewport");
	viewport.scrollLeft = player.getAbsolutePosition().x-viewport.clientWidth/2;
	viewport.scrollTop = player.getAbsolutePosition().y-viewport.clientHeight/2;
}