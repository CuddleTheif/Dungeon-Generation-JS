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
	var newPage = cp.fork('./dungeonPage.js', [data.name, data.width, data.height, data.numRooms, data.roomMinWidth, data.roomMaxWidth, data.roomMinHeight, data.roomMaxHeight]);
	pages[data.name] = {loading:true, players:[]};
	newPage.on('message', function(dungeon) {
		console.log('Created dungeon '+data.name+'!');
		pages[data.name].dungeon = dungeon;
		pages[data.name].loading = false;
	});
    res.send();
});

app.get(/\/dungeon\/[^\/]+?\/?$/, function(req, res) {
	var name = req.url.match(/^.*\/(.+?)\/?$/)[1];
	if(pages[name]){
		if(pages[name].loading)
			res.render('loading', {title: name});
		else
			res.render('dungeon', {collisionGrid: JSON.stringify(pages[name].dungeon.collisionGrid), start: JSON.stringify(pages[name].dungeon.start), title: name});
	}
	else{
		res.render('noroom', {title: name});
	}

});

wss.on('connection', function(ws){
	var name = url.parse(ws.upgradeReq.url, true).pathname.substr(1);
	if(pages[name]){
		
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
});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
