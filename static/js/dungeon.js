var dungeonStage, backgroundLayer, backgroundImage, characterLayer, topgroundLayer, topgroundImage, chatLayer, player, gameLoaded = false;
var tileSize=32, virtualSize = {x:30*tileSize,y:17*tileSize}, zoom = 1;

// Gets a sprite's current width
Konva.Sprite.prototype.getWidth = function(){
	return this.animations()[this.animation()][this.frameIndex()*4+2]*this.scaleX();
}

// Gets a sprite's current height
Konva.Sprite.prototype.getHeight = function(){
	return this.animations()[this.animation()][this.frameIndex()*4+3]*this.scaleY();
}

// Handle window resizing
function resize(){
	if(dungeonStage!=null){
		dungeonStage.width(window.innerWidth);
		dungeonStage.height(window.innerHeight);
		var scale = window.innerWidth/virtualSize.x*virtualSize.y < window.innerHeight ? window.innerHeight/virtualSize.y : window.innerWidth/virtualSize.x;
		dungeonStage.scale({x:scale*zoom, y:scale*zoom});
		dungeonStage.draw();
		updateViewport();
	}
}
window.onresize = resize;

// Create the basic grid with the player after the page has loaded
document.addEventListener('DOMContentLoaded', function() {
	
	// Create the dungeon layers
	backgroundLayer = new Konva.FastLayer();
	characterLayer = new Konva.Layer({hitGraphEnabled : false});
	topgroundLayer = new Konva.FastLayer();
	chatLayer = new Konva.Layer({hitGraphEnabled : false});
	
	// Load the background and topground images
	var backImg = new Image();
    backImg.onload = function() {
		var topImg = new Image();
		topImg.onload = function() {
			
			// Create the konva images that are just the viewport's view
			backgroundImage = new Konva.Image({
							x: 0,
							y: 0,
							width:virtualSize.x,
							height:virtualSize.y,
							image: backImg
						});
			topgroundImage = new Konva.Image({
							x: 0,
							y: 0,
							width:virtualSize.x,
							height:virtualSize.y,
							image:topImg
						});
							
			// Add the konva image's to the layers and mark the the background has been loaded
			backgroundLayer.add(backgroundImage);
			topgroundLayer.add(topgroundImage);
			loadGame();
			
		};
    	topImg.src = 'dungeon_top.png';
    };
    backImg.src = 'dungeon_back.png';
    
	// Create the sprite for the player
	var playerImg = new Image();
    playerImg.onload = function() {

	  // Actually create the player's sprite with animations
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
    playerImg.src = '/images/placeholder_player.png';
}, false);

// After everything has been loaded update the viewport add the layers to the screen
function loadGame(){
	if(!gameLoaded)
		gameLoaded = true;
	else{

		// Connect to the server
		connectToServer();
		
		// Create the stage and add all the layers
		dungeonStage = new Konva.Stage({
		  container: 'grid'
		});
		dungeonStage.add(backgroundLayer, characterLayer, topgroundLayer, chatLayer);
		
		// Load the animations, viewport, and server at the last step
		loadAnimations();
		resize();
		updateServer('move');
	}
}

// Move the given sprite a certain direction with checking for invaild spaces
function move(sprite, dir, distance) {
	var x = dir==1 ? -distance : (dir==2 ? distance : 0);
	var y = dir==0 ? distance : (dir==3 ? -distance : 0);
	sprite.x(sprite.x()+x);
	sprite.y(sprite.y()+y);
	if(collisionGrid[Math.trunc(sprite.x()/tileSize)][Math.trunc((sprite.y()+sprite.getHeight()/2)/tileSize)] || 
		collisionGrid[Math.trunc((sprite.x()+sprite.getWidth())/tileSize)][Math.trunc((sprite.y()+sprite.getHeight()/2)/tileSize)] ||
		collisionGrid[Math.trunc(sprite.x()/tileSize)][Math.trunc((sprite.y()+sprite.getHeight())/tileSize)] ||
		collisionGrid[Math.trunc((sprite.x()+sprite.getWidth())/tileSize)][Math.trunc((sprite.y()+sprite.getHeight())/tileSize)]){
		found = true;
		sprite.x(sprite.x()-x);
		sprite.y(sprite.y()-y);
	}
}

// Update the player's viewport onto the player
function updateViewport(){
	
	if(backgroundImage==null || topgroundImage==null)
		return;
	
	var x = player.x()-dungeonStage.width()/dungeonStage.scale().x/2;
	var y = player.y()-dungeonStage.height()/dungeonStage.scale().y/2;
	
	backgroundImage.crop({
						x:x,
						y:y,
						width:virtualSize.x*(1/zoom),
						height:virtualSize.y*(1/zoom)
					});
	topgroundImage.crop({
						x:x,
						y:y,
						width:virtualSize.x*(1/zoom),
						height:virtualSize.y*(1/zoom)
					});
	
	characterLayer.setX(-x);
	characterLayer.setY(-y);
	chatLayer.setX(-x);
	chatLayer.setY(-y);
	dungeonStage.draw();
}
