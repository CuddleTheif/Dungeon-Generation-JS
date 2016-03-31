(function() {
	
	const MAX_PATHS = 2, UNITS_PER_SEG = 1, NUM_LAYERS = 2;
	
	module.exports.TILE_ARRAY = [['nothing', 'wall', 'room', 'path'], ['nothing', 'entrance', 'exit']];
	
	// Generates a dungeon of the given size with the given number of rooms choosing from the given presets
	// width - THe width of the dungeon
	// height - the height of the dungeon
	// numRooms - The number of rooms in the dungeon (>= 2 if both entrance and exit otherwise >= 1)
	// possibleRooms - Array of rooms to choose from when making a new room (Each room MUST have at least a width and height)
	// return - dungeon array of array of numbers (each array is a layer and each number is a tile: see TILE_ARRAY)
	module.exports.generate = function(width, height, numRooms, possibleRooms) {
		
		// Create the rooms
		var rooms = generateRooms(width, height, numRooms, possibleRooms.slice());
		
		// Create the paths
		var paths = generatePaths(rooms)
		
		// Create grid of the dungeon (currently empty)
		dungeon = [];
		for(var i=0;i<NUM_LAYERS;i++){
			dungeon[i] = [];
			for(var x=0;x<width;x++)
				dungeon[i][x] = Array(height).fill(0);
		}
		
		// Add paths to grid
		for(var i=0;i<paths.length;i++){
			for(var j=0;j<paths[i].length;j++){
				for(var k=0;Math.abs(k)<Math.abs(paths[i][j].distance);k+=paths[i][j].distance/Math.abs(paths[i][j].distance)){
					if(paths[i][j].direction)
						dungeon[0][paths[i][j].startX][paths[i][j].startY + k] = 3;
					else
						dungeon[0][paths[i][j].startX + k][paths[i][j].startY] = 3;
				}
			}
		}
		
		// Add rooms to grid
		for(var i=0;i<rooms.length;i++)
		{
			if(rooms[i].tiles!=null)
				for(var x=0;x<rooms[i].tiles.length;x++)
					for(var y=0;y<rooms[i].tiles[x].length;y++)
						dungeon[1][x+rooms[i].x][y+rooms[i].y] = rooms[i].tiles[x][y];
			
			for(var x=0;x<rooms[i].width;x++)
				for(var y=0;y<rooms[i].height;y++)
					dungeon[0][x+rooms[i].x][y+rooms[i].y] = 2;
		}
		// Build and add walls to grid (walls are for visuals only)
		for(var x=0;x<dungeon[0].length;x++)
			for(var y=0;y<dungeon[0][x].length;y++)
				if(y<dungeon[0][x].length-1 && dungeon[0][x][y]==0 && dungeon[0][x][y+1]>0)
					dungeon[0][x][y] = 1;
		
		// Return the final grid
		return dungeon;
	}
	
	// Generates paths between the given rooms
	function generatePaths(rooms){
		// Create array for holding paths
		var paths = [];
		
		// Create array for tracking number of paths in rooms
		var numPaths = Array(rooms.length).fill(0);
		
		// Create paths until every room has at least one path
		while(numPaths.indexOf(0)!=-1){
			var room1 = randInt(rooms.length), room2 = room1;
			while(numPaths[room1] >= MAX_PATHS)
				room1 = randInt(rooms.length);
			while(room1==room2 || numPaths[room2] >= MAX_PATHS)
				room2 = randInt(rooms.length);
			paths.push(createPath(rooms[room1], rooms[room2]));
			numPaths[room1]++;
			numPaths[room2]++;
		}
		
		// Return the paths created
		return paths;
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
		return path;
	}
	
	// Generates and returns room placement for a dungeon with the given params
	function generateRooms(width, height, numRooms, possibleRooms){
		
		// Create array for holding rooms
		var rooms = [];
		
		// Check if there are entrance rooms and/or exit rooms and grab them
		var entrances = [], exits = [];
		for(var i=0;i<possibleRooms.length;i++){
			if(possibleRooms[i].tiles!=null){
				for(var j=0,entrance=false,exit=false; j<possibleRooms[i].tiles.length && !exit && !entrance;j++){
					if(!entrance && possibleRooms[i].tiles[j].indexOf(1)!=-1){
						entrances.push(possibleRooms[i]);
						entrance=true;
					}
					if(!exit && possibleRooms[i].tiles[j].indexOf(2)!=-1){
						exits.push(possibleRooms[i]);
						exit=true;
					}
				}
			}
		}
		
		// If any entrances and/or exits pick one of each to use
		if(entrances.length>0){
			rooms[0] = JSON.parse(JSON.stringify(entrances[randInt(entrances.length)]));
			rooms[0].x = randInt(width-rooms[0].width-2)+1;
			rooms[0].y = randInt(height-rooms[0].height-2)+1;
		}
		if(exits.length>0){
			rooms[rooms.length] = JSON.parse(JSON.stringify(exits[randInt(exits.length)]));
			do{
				rooms[rooms.length-1].x = randInt(width-rooms[rooms.length-1].width-2)+1;
				rooms[rooms.length-1].y = randInt(height-rooms[rooms.length-1].height-2)+1;
			}while(rooms.length==2 && roomsIntersect(rooms[0], rooms[1]));
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
		for(var i=rooms.length;i<numRooms;i++) {
			
			// Get a (deep) copy of a random room from the possibleRooms
			rooms[i] = JSON.parse(JSON.stringify(possibleRooms[randInt(possibleRooms.length)]));
			
			// Place the room so it doesn't intersect any other (previously placed) rooms
			var intersects = true
			while(intersects) {
				intersects = false
				rooms[i].x = randInt(width-rooms[i].width-2)+1
				rooms[i].y = randInt(height-rooms[i].height-2)+1
				for(var j = 0; j < rooms.length && !intersects; j++)
					if(j!=i && roomsIntersect(rooms[j], rooms[i]))
						intersects = true;
			}
		}
		
		// Return all the rooms acquired
		return rooms;
	}
	
	// Checks if the two given rooms intersect
	function roomsIntersect(room1, room2){
		return room1.x <= room2.x+room2.width && room1.x+room1.width >= room2.x && room1.y <= room2.y+room2.height && room1.y+room1.height >= room2.y;
	}
	
	// Gets a random integer between 0 and the given number
	function randInt(max){
		return Math.floor(Math.random() * max);
	}
	
}());