var server = require('http').createServer(),
		wss = new require('ws').Server({ server: server }),
		express = require('express'),
		app = express(),
		port = 80,
		Dungeon = require('./dungeon'),
		bodyParser = require('body-parser'),
		cp = require('child_process'),
		url = require('url');
var app = express();
var pages = [];
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static('static'));

// Page for the lobby of rooms
app.get('/', function(req, res) {
    res.render('lobby');
});

// Page for creating new dungeons
app.get('/new', function(req, res) {
    res.render('create');
});

// Post for getting all the current dungeons and their statues
app.post('/status', function(req, res) {
  var status = {url: [], name: [], area: [], players: [], loading: []};
  for(var name in pages){
    if (!pages.hasOwnProperty(name) || pages[name]==null) continue;
    status.url.push('/dungeon/'+name);
    status.name.push(pages[name].name);
    status.area.push(pages[name].area);
    status.players.push(pages[name].players.length);
    status.loading.push(pages[name].loading);  
  }
  res.send(status);
});

// Post for vaildating dungeon params
app.post('/attempt', function(req, res) {
	var data = req.body;
  var name = data.name.toLowerCase().replace(/ /g, '_');
	if(pages[name]){
		res.json({stats: -1, message: 'That dungeon already exists! Please delete the one with the same name before making a new one!'});
	}
	else{
		if(Dungeon.canRoomsFit(parseInt(data.width), parseInt(data.height), parseInt(data.numRooms), {width:parseInt(data.roomMaxWidth), height:parseInt(data.roomMaxHeight)}))
			res.json({stats: 1, message:''});
		else
			res.json({stats: -1, message: "I can't seem to fit that many rooms of that size in a dungeon of that size!"});
	}
});

// Post for creating a dungeon page
app.post('/create', function(req, res) {
	var data = req.body;
  var name = data.name.toLowerCase().replace(/ /g, '_');
	var newPage = cp.fork('./createPage.js', [name, data.width, data.height, data.numRooms, data.roomMinWidth, data.roomMaxWidth, data.roomMinHeight, data.roomMaxHeight]);
	pages[name] = {loading:true, name:data.name, area:parseInt(data.width)*parseInt(data.height), players:[], waiting:[]};
	newPage.on('message', function(dungeon) {
		pages[name].dungeon = dungeon;
	  for(var i=0;i<pages[name].waiting.length;i++)
      pages[name].waiting[i].send("DONE");
	  pages[name].loading = false;
	});
  res.send();
});

// Post for deleting a dungeon page
app.post('/delete', function(req, res) {
  var data = req.body;
  var name = data.name.toLowerCase().replace(/ /g, '_');
  if(pages[name] && !pages[name].loading){
    cp.fork('./deletePage.js', [name]);
    for(var i=0;i<pages[name].players.length;i++)
      pages[name].players[i].send({action: "delete"});
    pages[name] = null;
    res.send({status: 1, message:''});
  }
  else if(pages[name])
    res.send({status: -1, message:'That dungeon is still being created! please wait for it to be finished before you delete it.'});
  else
    res.send({status: -1, message:"That dungeon doesn't exist!"});
});

// Every dungeon page is handled here
app.get(/\/dungeon\/[^\/]+?\/?$/, function(req, res) {
	var name = req.url.match(/^.*\/(.+?)\/?$/)[1].toLowerCase().replace(/ /g, '_');
	if(pages[name]){
		if(pages[name].loading)
			res.render('loading', {title: pages[name].name});
		else
			res.render('dungeon', {collisionGrid: JSON.stringify(pages[name].dungeon.collisionGrid), start: JSON.stringify(pages[name].dungeon.start), title: pages[name].name});
	}
	else{
		res.render('noroom', {title: req.url.match(/^.*\/(.+?)\/?$/)[1]});
	}

});

// Websocket connections are handled here (For dungeon pages, loading and live)
wss.on('connection', function(ws){
	var name = url.parse(ws.upgradeReq.url, true).pathname.substr(1).toLowerCase().replace(/ /g, '_');
	if(pages[name] && !pages[name].loading){
		
		var id = 0;
		while(pages[name].players[id]!=null) id++;
		pages[name].players[id] = ws;
		ws.send(JSON.stringify({action:'connect', id:id}));
		
		wss.clients.forEach(function each(client) {
			if(client!=ws && pages[name].players.indexOf(client)!=-1)
				client.send(JSON.stringify({action:'update'}));
		});
		
		ws.on('message', function incoming(message, flags) {
			var data = JSON.parse(message);
			data.id = id;
			if(data.action==='move' || data.action==='text'){
				wss.clients.forEach(function each(client) {
					if(client!=ws && pages[name].players.indexOf(client)!=-1)
						client.send(JSON.stringify(data));
				});
			}
		});

		ws.on('close', function close(e, f) {
			pages[name].players[id] = null;
			wss.clients.forEach(function each(client) {
				if(client!=ws && pages[name].players.indexOf(client)!=-1)
					client.send(JSON.stringify({action:'delete', id:id}));
			});
		});

	}
  else if(pages[name]){

    pages[name].waiting.push(ws);
    ws.on('close', function close(e, f) {
        pages[name].waiting.splice(pages[name].waiting.indexOf(ws), 1);
    });

  }
});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
