(function() {
	
	var Dungeon = require('./dungeon');
	
	var Page = function(app, name, width, height, numRooms, roomMinWidth, roomMaxWidth, roomMinHeight, roomMaxHeight) {
		
		this.setupPage(app, name, width, height, numRooms, roomMinWidth, roomMaxWidth, roomMinHeight, roomMaxHeight);
		
	};
	
	// Setups a basic dungeon page
	Page.prototype.setupPage = function(app, name, width, height, numRooms, roomMinWidth, roomMaxWidth, roomMinHeight, roomMaxHeight){
		
		// Set class variables
		this.name = name;
		this.players = [];
		console.log(name);
		// First create the rooms and the dungeon
		var rooms = [];
		for(var i=0;i<numRooms;i++)
			rooms[i] = {width:randInt(roomMaxWidth-roomMinWidth)+roomMinWidth, height:randInt(roomMaxHeight-roomMinHeight)+roomMinHeight};
		rooms[rooms.length-1].entrance = {x:randInt(rooms[rooms.length-1].width),y:randInt(rooms[rooms.length-1].height)};
		var dungeon = new Dungeon.Dungeon(width, height, {x:5, y:1}, {x:3, y:3}, {x:3, y:2});
		
		// Next display the loading screen (and dungeon when done loading)
		var loading = true;
		app.get('/dungeon/'+name, function(req, res) {
			if(loading)
				res.render('loading', {title: name});
			else
		    	res.render('dungeon', {collisionGrid: JSON.stringify(dungeon.collisionGrid), start: JSON.stringify(dungeon.start), title: name});
		});
		
		// Then generate and draw the dungeon (And mark as done loading)
		dungeon.generate(numRooms, rooms);
		var serveBuffers = function(backBuffer, topBuffer){
																app.get('/dungeon/'+name+'/dungeon_back.png', function(req, res) {
																	res.writeHead(200, {'Content-Type': 'image/png'});
		    														res.end(backBuffer);
																});
																app.get('/dungeon/'+name+'/dungeon_top.png', function(req, res) {
																	res.writeHead(200, {'Content-Type': 'image/png'});
		    														res.end(topBuffer);
																});
																loading = false;
																console.log(name+" Dungeon Loaded!");
															};
		dungeon.draw(serveBuffers);
	}
	
	Page.prototype.createWSConnection = function(wss, ws) {
		console.log("Connected on "+this.name);
		var page = this;
		var id = 0;
		while(page.players[id]!=null) id++;
		page.players[id] = ws;
		ws.send(JSON.stringify({action:'connect', id:id}));
	  	
	  	wss.clients.forEach(function each(client) {
			if(client!=ws && page.players.indexOf(client)!=-1)
				client.send(JSON.stringify({action:'update'}));
		});
	  	
		ws.on('message', function incoming(message, flags) {
			
			var data = JSON.parse(message);
			data.id = id;
			if(data.action==='move' || data.action==='text'){
				wss.clients.forEach(function each(client) {
					if(client!=ws && page.players.indexOf(client)!=-1)
						client.send(JSON.stringify(data));
				});
			}
		});

		ws.on('close', function close(e, f) {
			page.players[id] = null;
			wss.clients.forEach(function each(client) {
				if(client!=ws && page.players.indexOf(client)!=-1)
					client.send(JSON.stringify({action:'delete', id:id}));
			});
		});
	}
	
	// Gets a random integer between 0 and the given number
	function randInt(max){
		return Math.floor(Math.random() * max);
	}
	
	module.exports.Page = Page;
	
}());