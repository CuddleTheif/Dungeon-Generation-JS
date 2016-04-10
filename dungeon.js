(function() {
	
	var lwip = require('lwip');
	
	var Dungeon = function(width, height, wallTile, roomTile, pathTile) {
		this.width = width;
		this.height = height;
		this.wallTile = wallTile;
		this.roomTile = roomTile;
		this.pathTile = pathTile;
	};
	
	const MAX_PATHS = 4, UNITS_PER_SEG = 1, NUM_LAYERS = 2, TILE_SIZE = 32;
	
	var TILE_ARRAY = [{name:'nothing', solid:true}, {name:'wall', solid:true}, {name:'room', solid:false}, {name:'path', solid:false}];
	
	// Generates the dungeon with the given number of rooms choosing from the given presets
	// numRooms - The number of rooms in the dungeon (>= 2 if both entrance and exit otherwise >= 1)
	// possibleRooms - Array of rooms to choose from when making a new room (Each room MUST have at least a width and height)
	Dungeon.prototype.generate = function(numRooms, possibleRooms) {
		
		// Create the rooms
		this.generateRooms(numRooms, possibleRooms.slice());
		
		// Create the paths
		this.generatePaths();
		
		// Create the collision grid
		this.createCollisionGrid();
	}
	
	// Generates paths between the given rooms
	Dungeon.prototype.generatePaths = function(){
		// Create array for holding paths
		this.paths = [];
		
		// Create array for tracking number of paths in rooms
		var numPaths = Array(this.rooms.length).fill(0);
		
		// Create paths until every room has at least one path
		var curRoom = randInt(this.rooms.length), prevRoom = -1;
		while(numPaths.indexOf(0)!=-1){
			var nextRoom = randInt(this.rooms.length);
			while(nextRoom==curRoom || nextRoom==prevRoom || numPaths[nextRoom] >= MAX_PATHS-1)
				nextRoom = randInt(this.rooms.length);
			this.paths.push(createPath(this.rooms[curRoom], this.rooms[nextRoom]));
			numPaths[curRoom]++;
			numPaths[nextRoom]++;
			prevRoom = curRoom;
			curRoom = nextRoom;
		}
	}
	
	// Creates a path from given room to the next
	function createPath(room1, room2){
		
		// Determine the start and end points of the path
		var startX, startY, endX, endY;
		if (randInt(2) == 0){
			startX = room1.x + randInt(2)*room1.width;
			startY = room1.y + randInt(room1.height-2) + 1;
		} else {
			startX = room1.x + randInt(room1.width-2) + 1;
			startY = room1.y + randInt(2)*room1.height;
		}
		if (randInt(2) == 0){
			endX = room2.x + randInt(2)*room2.width;
			endY = room2.y + randInt(room2.height-2) + 1;
		} else {
			endX = room2.x + randInt(room2.width-2) + 1;
			endY = room2.y + randInt(2)*room2.height;
		}
		
		// Determine the number of segments in the path and the direction of the path
		var xSeg = startX==endX ? 0 : randInt(Math.abs(startX-endX)/UNITS_PER_SEG)+1;
		var ySeg = startY==endY ? 0 : randInt(Math.abs(startY-endY)/UNITS_PER_SEG)+1;
		var dirX = startX<endX ? 1 : -1, dirY = startY<endY ? 1 : -1;
		
		// Create the segments of the path with a random order and lengths
		path = [];
		var numSeg = xSeg+ySeg;
		for(var i=0, curX=startX, curY=startY;i<numSeg;i++){
			path[i] = {startX:curX, startY:curY};
			if((randInt(2)==0 && xSeg>0) || ySeg<=0){
				path[i].distance = xSeg==1 ? Math.abs(curX - endX)*dirX : (randInt(Math.abs(curX-endX)-(xSeg-1)+1)+1)*dirX;
				xSeg--;
				path[i].direction = false;
				curX += path[i].distance;
			}
			else {
				path[i].distance = ySeg==1 ? Math.abs(curY - endY)*dirY : (randInt(Math.abs(curY-endY)-(ySeg-1)+1)+1)*dirY;
				ySeg--;
				path[i].direction = true;
				curY += path[i].distance;
			}
		}
		
		// Return the path
		return path;
	}
	
	// Generates and returns room placement for a dungeon with the given params
	Dungeon.prototype.generateRooms = function(numRooms, possibleRooms){
		
		// Create array for holding rooms
		this.rooms = [];
		
		// Check if there are entrance rooms and/or exit rooms and grab them
		var entrances = [], exits = [];
		for(var i=0;i<possibleRooms.length;i++){
			if(possibleRooms[i].entrance!=null)
				entrances.push(possibleRooms[i]);
			if(possibleRooms[i].exit!=null)
				exits.push(possibleRooms[i]);
		}
		
		// If any entrances and/or exits pick one of each to use
		if(entrances.length>0){
			this.rooms[0] = JSON.parse(JSON.stringify(entrances[randInt(entrances.length)]));
			this.rooms[0].x = randInt(this.width-this.rooms[0].width-2)+1;
			this.rooms[0].y = randInt(this.height-this.rooms[0].height-2)+1;
			this.start = {
				x:this.rooms[0].entrance.x+this.rooms[0].x,
				y:this.rooms[0].entrance.y+this.rooms[0].y
			};
		}
		if(exits.length>0){
			this.rooms[this.rooms.length] = JSON.parse(JSON.stringify(exits[randInt(exits.length)]));
			do{
				this.rooms[this.rooms.length-1].x = randInt(width-this.rooms[this.rooms.length-1].width-2)+1;
				this.rooms[this.rooms.length-1].y = randInt(height-this.rooms[this.rooms.length-1].height-2)+1;
			}while(this.rooms.length==2 && roomsIntersect(this.rooms[0], this.rooms[1]));
			this.exit = {
				x:this.rooms[this.rooms.length-1].exit.x+this.rooms[this.rooms.length-1].x,
				y:this.rooms[this.rooms.length-1].exit.y+this.rooms[this.rooms.length-1].y
			};
		}
		
		// Remove all entrances and exits since ones have been choosen
		for(var i=0;i<entrances.length;i++){
			var curEntrance = possibleRooms.indexOf(entrances[i]);
			if(curEntrance!=-1)
				possibleRooms.splice(curEntrance, 1);
		}
		for(var i=0;i<exits.length;i++){
			var curExit = possibleRooms.indexOf(exits[i]);
			if(curExit!=-1)
				possibleRooms.splice(curExit, 1);
		}
		
		// Add the rest of the rooms
		for(var i=this.rooms.length;i<numRooms;i++) {
			
			// Get a (deep) copy of a random room from the possibleRooms
			this.rooms[i] = JSON.parse(JSON.stringify(possibleRooms[randInt(possibleRooms.length)]));
			
			// Place the room so it doesn't intersect any other (previously placed) rooms
			var intersects = true
			while(intersects) {
				intersects = false
				this.rooms[i].x = randInt(this.width-this.rooms[i].width-2)+1
				this.rooms[i].y = randInt(this.height-this.rooms[i].height-2)+1
				for(var j = 0; j < this.rooms.length && !intersects; j++)
					if(j!=i && roomsIntersect(this.rooms[j], this.rooms[i]))
						intersects = true;
			}
		}
	}
	
	
	// Checks if the given room can fit in the given size
	function canRoomsFit(width, height, numRooms, room){
		return (room.width+2)*(room.height+2)*numRooms<width*height;
	}
	
	// Checks if the two given rooms intersect
	function roomsIntersect(room1, room2){
		return room1.x <= room2.x+room2.width && room1.x+room1.width >= room2.x && room1.y <= room2.y+room2.height && room1.y+room1.height >= room2.y;
	}
	
	// Gets a random integer between 0 and the given number
	function randInt(max){
		return Math.floor(Math.random() * max);
	}
	
	
	// Calculates creates the collision this.collisionGrid for the dungeon
	Dungeon.prototype.createCollisionGrid = function(){
		
		// Create grid for collision
		this.collisionGrid = [];
		for(var x=0;x<this.width;x++)
			this.collisionGrid[x] = Array(this.height).fill(TILE_ARRAY[0].solid);
		
		// Add paths to grid
		for(var i=0;i<this.paths.length;i++){
			for(var j=0;j<this.paths[i].length;j++){
				for(var k=0;Math.abs(k)<=Math.abs(this.paths[i][j].distance);k+=this.paths[i][j].distance/Math.abs(this.paths[i][j].distance)){
					if(this.paths[i][j].direction)
						this.collisionGrid[this.paths[i][j].startX][this.paths[i][j].startY + k] = TILE_ARRAY[3].solid;
					else
						this.collisionGrid[this.paths[i][j].startX + k][this.paths[i][j].startY] = TILE_ARRAY[3].solid;
				}
			}
		}
		
		// Add rooms to grid
		for(var i=0;i<this.rooms.length;i++)
		{
			
			for(var x=0;x<this.rooms[i].width;x++)
				for(var y=0;y<this.rooms[i].height;y++)
					this.collisionGrid[x+this.rooms[i].x][y+this.rooms[i].y] = TILE_ARRAY[2].solid;
		}
	}
	
	// Draws the current dungeon and returns buffers of the final images (first is background and second is topground) to the given callback
	Dungeon.prototype.draw = function(callback) {
		
		// Create grid for drawing
		var grid = [];
		for(var x=0;x<this.width;x++)
			grid[x] = Array(this.height).fill(0);
		
		// Add paths to grid
		for(var i=0;i<this.paths.length;i++){
			for(var j=0;j<this.paths[i].length;j++){
				for(var k=0;Math.abs(k)<=Math.abs(this.paths[i][j].distance);k+=this.paths[i][j].distance/Math.abs(this.paths[i][j].distance)){
					if(this.paths[i][j].direction)
						grid[this.paths[i][j].startX][this.paths[i][j].startY + k] = 3;
					else
						grid[this.paths[i][j].startX + k][this.paths[i][j].startY] = 3;
				}
			}
		}
		
		// Add rooms to grid
		for(var i=0;i<this.rooms.length;i++)
		{
			for(var x=0;x<this.rooms[i].width;x++)
				for(var y=0;y<this.rooms[i].height;y++)
					grid[x+this.rooms[i].x][y+this.rooms[i].y] = 2;
		}
		
		// Build and add walls to grid (walls are for visuals only)
		for(var x=0;x<grid.length;x++)
			for(var y=0;y<grid[x].length;y++)
				if(y<grid[x].length-1 && grid[x][y]==0 && grid[x][y+1]>0)
					grid[x][y] = 1;
		
		// Get the tiles as local variables and size
		var wallTile = this.wallTile;
		var pathTile = this.pathTile;
		var roomTile = this.roomTile;
		var width = this.width;
		var height = this.height;
		
		// Load the tilesheets before making any tiles
		lwip.open("images/placeholder_floors.png", function (err, floorTileSheet) {
		    if (err) throw err;
		    lwip.open("images/placeholder_walls.png", function (err, wallTileSheet) {
			    if (err) throw err;
			    
			    // Load the images for the dungeon
				lwip.create(width*TILE_SIZE, height*TILE_SIZE, function (err, backimage) {
					if (err) throw err;
					var background = backimage.batch();
					lwip.create(width*TILE_SIZE, height*TILE_SIZE, function (err, topimage) {
						if (err) throw err;
						var topground = topimage.batch();
						
						// Create methods for determining neighbor tiles
					var isWallNeighbor = function(x, y){
															return x>=0 && y>=0 && x<grid.length && y<grid[x].length && 
																grid[x][y]==1;
														};
					var isRoofNeighbor = function(x, y){
															return x<0 || y<0 || x>=grid.length || y>=grid[x].length ||
																grid[x][y]==0 || grid[x][y+1]<=1;
														};
					var isRoomNeighbor = function(x, y){
															return grid[x][y]==2;
														};
					var isPathNeighbor = function(x, y){
															return grid[x][y]==3;
														};
					
					// Create function for counting tiles drawn
					var tileCount = 0;
					var realTileCount = 0;
					var countTile = function(){
						if(++tileCount>=realTileCount){
							// Save the created images to the server
							var loadedBuffer;
							background.toBuffer('png', function(err, buffer){
								if (err) throw err;
								if(!loadedBuffer)
									loadedBuffer = buffer;
								else if(callback)
									callback(buffer, loadedBuffer);
							});
							topground.toBuffer('png', function(err, buffer){
								if (err) throw err;
								if(!loadedBuffer)
									loadedBuffer = buffer;
								else if(callback)
									callback(loadedBuffer, buffer);
							});
						}
					};
					
					// Draw the tiles in the grid
					for(var x=0;x<grid.length;x++){
						for(var y=0;y<grid[x].length;y++){
							realTileCount++;
							switch(grid[x][y]){
								case 0: // nothing = roof tile
									addTile(topground, {x:x,y:y}, {x:wallTile.x*64, y:wallTile.y*160}, wallTileSheet, isRoofNeighbor, true, countTile);
									if(y>0 && grid[x][y-1]!=0){
										realTileCount++;
										addTile(topground, {x:x,y:y-1}, {x:wallTile.x*64, y:wallTile.y*160}, wallTileSheet, isRoofNeighbor, true, countTile);
									}
									break;
								case 1: // wall tile
									addTile(background, {x:x,y:y}, {x:wallTile.x*64, y:wallTile.y*160+64}, wallTileSheet, isWallNeighbor, false, countTile);
									if(y>0 && grid[x][y-1]!=0){
										realTileCount++;
										addTile(topground, {x:x,y:y-1}, {x:wallTile.x*64, y:wallTile.y*160}, wallTileSheet, isRoofNeighbor, true, countTile);
									}
									break;
								case 2: // room tile
									addTile(background, {x:x,y:y}, {x:roomTile.x*64, y:roomTile.y*96}, floorTileSheet, isRoomNeighbor, true, countTile);
									break;
								case 3: // path tile
									addTile(background, {x:x,y:y}, {x:pathTile.x*64, y:pathTile.y*96}, floorTileSheet, isPathNeighbor, true, countTile);
									break;
							}
						}
					}
						
					});
				});
			    
			});
		});
		
	}
	
	// Gets and adds the tile at the given position with the given variables
	function addTile(layerBatch, position, tilePosition, tileSheet, tester, corners, callback){
		var subTiles = getSubTiles(position, tilePosition, tester, corners);
		var topLeft = function(){
									tileSheet.extract(subTiles.topLeft.x, subTiles.topLeft.y,
														subTiles.topLeft.x+TILE_SIZE/2-1, subTiles.topLeft.y+TILE_SIZE/2-1, 
														function(err, img) {
															if (err) throw err;
															layerBatch.paste(position.x*TILE_SIZE, position.y*TILE_SIZE, img);
															if(callback)
																callback();
														});
		};
		var bottomLeft = function(){
										tileSheet.extract(subTiles.bottomLeft.x, subTiles.bottomLeft.y,
															subTiles.bottomLeft.x+TILE_SIZE/2-1, subTiles.bottomLeft.y+TILE_SIZE/2-1, 
															function(err, img) {
																if (err) throw err;
																layerBatch.paste(position.x*TILE_SIZE, position.y*TILE_SIZE+TILE_SIZE/2, img);
																topLeft();
															});
		};
		var topRight = function(){
									tileSheet.extract(subTiles.topRight.x, subTiles.topRight.y,
														subTiles.topRight.x+TILE_SIZE/2-1, subTiles.topRight.y+TILE_SIZE/2-1, 
														function(err, img) {
															if (err) throw err;
															layerBatch.paste(position.x*TILE_SIZE+TILE_SIZE/2, position.y*TILE_SIZE, img);
															bottomLeft();
														});
		};
		var bottomRight = function(){
										tileSheet.extract(subTiles.bottomRight.x, subTiles.bottomRight.y,
															subTiles.bottomRight.x+TILE_SIZE/2-1, subTiles.bottomRight.y+TILE_SIZE/2-1, 
															function(err, img) {
																if (err) throw err;
																layerBatch.paste(position.x*TILE_SIZE+TILE_SIZE/2, position.y*TILE_SIZE+TILE_SIZE/2, img);
																topRight();
															});
		};
		bottomRight();
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
	
	module.exports.canRoomsFit = canRoomsFit;
	module.exports.TILE_ARRAY = TILE_ARRAY;
	module.exports.Dungeon = Dungeon;
	
}());
