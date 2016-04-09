var server = require('http').createServer(),
		wss = new require('ws').Server({ server: server }),
		express = require('express'),
		app = express(),
		port = 80,
		Dungeon = require('./dungeon'),
		bodyParser = require('body-parser'),
	 	url = require('url')
		Page = require('./dungeonPage');
var app = express();
var dungeons = [];
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static('static'));

app.get('/', function(req, res) {
    res.render('create');
});

app.post('/attempt', function(req, res) {
	var dungeon, data = req.body;
	for(var i=0;i<dungeons.length && !dungeon;i++)
		if(dungeons[i].name === data.name)
			dungeon = dungeons[i];
	if(dungeon){
		/*var player = false
		for(var i=0;i<dungeon.players.length && !player;i++)
			if(dungeon.players[i]!=null)
				player = true;
		if(player)
			res.json({stats: -1, message: 'That dungeon already exists and their are people in it!'});
		else if(Dungeon.canRoomsFit(parseInt(data.width), parseInt(data.height), parseInt(data.numRooms), {width:parseInt(data.roomMaxWidth), height:parseInt(data.roomMaxHeight)}))
			res.json({stats: 0, message: 'That dungeon already exists but there is no one in it. Do you want to delete it and make a new one?'});
		else
			res.json({stats: -1, message: "I can't seem to fit that many rooms of that size in a dungeon of that size!"});*/
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
	var dungeon, data = req.body;
	//for(var i=0;i<dungeons.length && !dungeon;i++)
	//	if(dungeons[i].name === data.name)
	//		dungeon = dungeons[i];
	//if(dungeon)
	//	dungeon.setupPage(app, wss, data.name, parseInt(data.width), parseInt(data.height), parseInt(data.numRooms), parseInt(data.roomMinWidth), parseInt(data.roomMaxWidth), parseInt(data.roomMinHeight), parseInt(data.roomMaxHeight));
	//else
	setTimeout(function(){
		dungeons.push(new Page.Page(app, data.name, parseInt(data.width), parseInt(data.height), parseInt(data.numRooms), parseInt(data.roomMinWidth), parseInt(data.roomMaxWidth), parseInt(data.roomMinHeight), parseInt(data.roomMaxHeight)));
	}, 1);
    res.send();
});

wss.on('connection', function(ws){
	var location = url.parse(ws.upgradeReq.url, true);
	for(var i=0;i<dungeons.length;i++)
		if(location.pathname==='/'+dungeons[i].name)
			dungeons[i].createWSConnection(wss, ws);
});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
