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

app.get('/', function(req, res) {
    res.render('create');
});

app.post('/attempt', function(req, res) {
	var data = req.body;
	if(pages[data.name]){
		res.json({stats: -1, message: 'That dungeon already exists'});
	}
	else{
		if(Dungeon.canRoomsFit(parseInt(data.width), parseInt(data.height), parseInt(data.numRooms), {width:parseInt(data.roomMaxWidth), height:parseInt(data.roomMaxHeight)}))
			res.json({stats: 1, message:''});
		else
			res.json({stats: -1, message: "I can't seem to fit that many rooms of that size in a dungeon of that size!"});
	}
});

app.post('/create', function(req, res) {
	var data = req.body;
  var name = data.name.toLowerCase();
	var newPage = cp.fork('./dungeonPage.js', [name, data.width, data.height, data.numRooms, data.roomMinWidth, data.roomMaxWidth, data.roomMinHeight, data.roomMaxHeight]);
	pages[name] = {loading:true, name:data.name, players:[], waiting:[]};
	newPage.on('message', function(dungeon) {
		pages[name].dungeon = dungeon;
		pages[name].loading = false;
    for(var i=0;i<pages[name].waiting.length;i++)
      pages[name].waiting[i].send("DONE");
	});
    res.send();
});

app.get(/\/dungeon\/[^\/]+?\/?$/, function(req, res) {
	var name = req.url.match(/^.*\/(.+?)\/?$/)[1].toLowerCase();
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

wss.on('connection', function(ws){
	var name = url.parse(ws.upgradeReq.url, true).pathname.substr(1).toLowerCase();
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
