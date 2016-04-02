var dungeonStage, dungeonLayer, dungeonImage, characterLayer, parallaxLayer, parallaxImage, chatLayer, player, gameLoaded = false, loadingStage;
var tileSize=32, virtualSize = {x:30*tileSize,y:17*tileSize};

// Gets a sprite's current width
Konva.Sprite.prototype.getWidth = function(){
	return this.animations()[this.animation()][this.frameIndex()*4+2]*this.scaleX();
}

// Gets a sprite's current height
Konva.Sprite.prototype.getHeight = function(){
	return this.animations()[this.animation()][this.frameIndex()*4+3]*this.scaleY();
}

// Handle window resizing
window.onresize = function(){
	if(dungeonStage!=null){
		document.getElementById('loading').style.display = 'flex';
		dungeonStage.width(window.innerWidth);
		dungeonStage.height(window.innerHeight);
		var scale = window.innerWidth/virtualSize.x*virtualSize.y < window.innerHeight ? window.innerHeight/virtualSize.y : window.innerWidth/virtualSize.x;
		dungeonStage.scale({x:scale, y:scale});
		dungeonStage.draw();
		updateViewport();
		document.getElementById('loading').style.display = 'none';
	}
}

// Create the basic grid with the player after the page has loaded
document.addEventListener('DOMContentLoaded', function() {
	
	// Create the dungeon layers
	dungeonLayer = new Konva.FastLayer();
	characterLayer = new Konva.Layer({hitGraphEnabled : false});
	parallaxLayer = new Konva.FastLayer();
	chatLayer = new Konva.Layer({hitGraphEnabled : false});
	
	// Create groups for images of layers
	dungeonGroup = new Konva.Group();
	parallaxGroup = new Konva.Group();
	
	// Load the tilesheets before making any tiles
	var floorTileSheet = new Image();
    floorTileSheet.onload = function() {
		var wallTileSheet = new Image();
		wallTileSheet.onload = function() {
    	
    		// Draw the tiles in the grid
    		for(var x=0;x<dungeon[0].length;x++){
    			for(var y=0;y<dungeon[0][x].length;y++){
    				switch(dungeon[0][x][y]){
    					case 0: // nothing = roof tile
    						addTile(parallaxGroup, {x:x,y:y}, {x:wallTile.x*64, y:wallTile.y*160}, wallTileSheet, function(x, y){return x<0 || y<0 || x>=dungeon[0].length || y>=dungeon[0][x].length || dungeon[0][x][y]==0 || dungeon[0][x][y+1]<=1;}, true);
    						if(y>0 && dungeon[0][x][y-1]!=0)
    							addTile(parallaxGroup, {x:x,y:y-1}, {x:wallTile.x*64, y:wallTile.y*160}, wallTileSheet, function(x, y){return x<0 || y<0 || x>=dungeon[0].length || y>=dungeon[0][x].length || dungeon[0][x][y]==0 || dungeon[0][x][y+1]<=1;}, true);
    						break;
    					case 1: // wall tile
    						addTile(dungeonGroup, {x:x,y:y}, {x:wallTile.x*64, y:wallTile.y*160+64}, wallTileSheet, function(x, y){return x>=0 && y>=0 && x<dungeon[0].length && y<dungeon[0][x].length && dungeon[0][x][y]==1;}, false);
    						if(y>0 && dungeon[0][x][y-1]!=0)
    							addTile(parallaxGroup, {x:x,y:y-1}, {x:wallTile.x*64, y:wallTile.y*160}, wallTileSheet, function(x, y){return x<0 || y<0 || x>=dungeon[0].length || y>=dungeon[0][x].length || dungeon[0][x][y]==0 || dungeon[0][x][y+1]<=1;}, true);
    						break;
    					case 2: // room tile
    						addTile(dungeonGroup, {x:x,y:y}, {x:roomTile.x*64, y:roomTile.y*96}, floorTileSheet, function(x, y){return dungeon[0][x][y]==2;}, true);
    						break;
    					case 3: // path tile
    						addTile(dungeonGroup, {x:x,y:y}, {x:pathTile.x*64, y:pathTile.y*96}, floorTileSheet, function(x, y){return dungeon[0][x][y]==3;}, true);
    						break;
    				}
    			}
    		}
    		
    		// Cache the dungeon group and parallax group and then add the images (cropped) to the layer
    		dungeonGroup.toImage({
    		  x:0,
    		  y:0,
    		  width:dungeon[0].length*tileSize,
    		  height:dungeon[0][0].length*tileSize,
			  callback: function(img) {
			    dungeonImage = new Konva.Image({
					x: 0,
					y: 0,
					width:virtualSize.x,
					height:virtualSize.y,
					image: img,
				crop: {x:0,y:0,width:virtualSize.x,height:virtualSize.y}
				});
				dungeonLayer.add(dungeonImage);
				updateViewport();
			  }
			});
			parallaxGroup.toImage({
    		  x:0,
    		  y:0,
    		  width:dungeon[0].length*tileSize,
    		  height:dungeon[0][0].length*tileSize,
			  callback: function(img) {
			    parallaxImage = new Konva.Image({
					x: 0,
					y: 0,
					width:virtualSize.x,
					height:virtualSize.y,
					image: img,
				crop: {x:0,y:0,width:virtualSize.x,height:virtualSize.y}
				});
				parallaxLayer.add(parallaxImage);
				updateViewport();
			  }
			});
    		
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
	  var start = {};
	  for(var x=0;x<dungeon[1].length;x++)
	  	  for(var y=0;y<dungeon[1][x].length;y++)
	  	  	if(dungeon[1][x][y]==1)
				start = {x:x, y:y};
      player = new Konva.Sprite({
        x: start.x*tileSize,
        y: start.y*tileSize,
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
		scale: { x:1/2, y:1/2 }
      });
      
      // If player id already set, set it in the sprite
      if(playerId!=null)
      	  player.id('player'+playerId);
      
      // add the shape to the layer
	  characterLayer.add(player);
	  
	  // Mark that the player has been loaded
	  loadGame();
    };
    playerImg.src = 'images/placeholder_player.png';
}, false);

// Gets and adds the tile at the given position with the given variables
function addTile(layer, position, tilePosition, tileSheet, tester, corners){
	var subTiles = getSubTiles(position, tilePosition, tester, corners);
	var img = new Konva.Image({
		x: position.x*tileSize,
		y: position.y*tileSize,
		image: tileSheet,
		crop: {x:subTiles.topLeft.x,y:subTiles.topLeft.y,width:16,height:16},
		width: tileSize/2,
		height: tileSize/2
	});
	img.transformsEnabled('position');
	layer.add(img);
	img = new Konva.Image({
		x: position.x*tileSize,
		y: position.y*tileSize+tileSize/2,
		image: tileSheet,
		crop: {x:subTiles.bottomLeft.x,y:subTiles.bottomLeft.y,width:16,height:16},
		width: tileSize/2,
		height: tileSize/2
	});
	img.transformsEnabled('position');
	layer.add(img);
	img = new Konva.Image({
		x: position.x*tileSize+tileSize/2,
		y: position.y*tileSize,
		image: tileSheet,
		crop: {x:subTiles.topRight.x,y:subTiles.topRight.y,width:16,height:16},
		width: tileSize/2,
		height: tileSize/2
	});
	img.transformsEnabled('position');
	layer.add(img);
	img = new Konva.Image({
		x: position.x*tileSize+tileSize/2,
		y: position.y*tileSize+tileSize/2,
		image: tileSheet,
		crop: {x:subTiles.bottomRight.x,y:subTiles.bottomRight.y,width:16,height:16},
		width: tileSize/2,
		height: tileSize/2
	});
	img.transformsEnabled('position');
	layer.add(img);
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
		
		// remove loading message
		document.getElementById('loading').style.display = 'none';
		
		// Create the stage and add all the layers
		var scale = window.innerWidth/virtualSize.x*virtualSize.y < window.innerHeight ? window.innerHeight/virtualSize.y : window.innerWidth/virtualSize.x;
		dungeonStage = new Konva.Stage({
		  container: 'grid',
		  width: window.innerWidth,
		  height: window.innerHeight,
      	  scale: {x:scale, y:scale}
		});
		dungeonStage.add(dungeonLayer, characterLayer, parallaxLayer, chatLayer);
		
		// Load the animations, viewport, and server at the last step
		loadAnimations();
		updateViewport();
		updateServer('move');
	}
}

// Move the given sprite a certain direction with checking for invaild spaces
function move(sprite, dir, distance) {
	var x = dir==1 ? -distance : (dir==2 ? distance : 0);
	var y = dir==0 ? distance : (dir==3 ? -distance : 0);
	sprite.x(sprite.x()+x);
	sprite.y(sprite.y()+y);
	if(dungeon[0][Math.trunc(sprite.x()/tileSize)][Math.trunc((sprite.y()+sprite.getHeight()/2)/tileSize)]<=1 || 
		dungeon[0][Math.trunc((sprite.x()+sprite.getWidth())/tileSize)][Math.trunc((sprite.y()+sprite.getHeight()/2)/tileSize)]<=1 ||
		dungeon[0][Math.trunc(sprite.x()/tileSize)][Math.trunc((sprite.y()+sprite.getHeight())/tileSize)]<=1 ||
		dungeon[0][Math.trunc((sprite.x()+sprite.getWidth())/tileSize)][Math.trunc((sprite.y()+sprite.getHeight())/tileSize)]<=1){
		found = true;
		sprite.x(sprite.x()-x);
		sprite.y(sprite.y()-y);
	}
}

// Udate the player's viewport onto the player
function updateViewport(){
	
	if(dungeonImage==null || parallaxImage==null)
		return;
	
	var x = player.x()-window.innerWidth/dungeonStage.scale().x/2;
	var y = player.y()-window.innerHeight/dungeonStage.scale().y/2;
	
	dungeonImage.crop({
						x:x,
						y:y,
						width:virtualSize.x,
						height:virtualSize.y
					});
	parallaxImage.crop({
						x:x,
						y:y,
						width:virtualSize.x,
						height:virtualSize.y
					});
	
	characterLayer.setX(-x);
	characterLayer.setY(-y);
	chatLayer.setX(-x);
	chatLayer.setY(-y);
	dungeonStage.draw();
}