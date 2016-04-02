var server = require('http').createServer(),
		wss = new require('ws').Server({ server: server }),
		express = require('express'),
		app = express(),
		port = 8080,
		dungeon = require('./dungeon');
var app = express();
var players = [];

var rooms = [];
for(var i=0;i<10;i++)
	rooms[i] = {width:randInt(4)+4, height:randInt(4)+4};
rooms.push({width:4, height:4, tiles:[[0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]]});
var grid = dungeon.generate(200, 100, 20, rooms);
console.log('Dungeon Loaded!');

app.set('view engine', 'ejs');
app.use(express.static('static'));

app.get('/', function(req, res) {
    res.render('dungeon', {dungeon: JSON.stringify(grid)});
    console.log('Page Loaded!');
});

wss.on('connection', function connection(ws) {
  
	var id = 0;
	while(players.indexOf(id)!=-1) id++;
	players.push(id);
	ws.send(JSON.stringify({action:'connect', id:id}));
  	
  	wss.clients.forEach(function each(client) {
		if(client!=ws){
			try{
				client.send(JSON.stringify({action:'update'}));
			} catch (e){
				console.log(e);
			}
		}
	});
  	
	ws.on('message', function incoming(message, flags) {
		var data = JSON.parse(message);
		data.id = id;
		if(data.action==='move' || data.action==='text'){
			wss.clients.forEach(function each(client) {
				if(client!=ws){
					try{
						client.send(JSON.stringify(data));
					} catch (e){
						console.log(e);
					}
				}
			});
		}
	});

	ws.on('close', function close(e, f) {
		players.splice(players.indexOf(id), 1);
		wss.clients.forEach(function each(client) {
			if(client!=ws){
				try{
					client.send(JSON.stringify({action:'delete', id:id}));
				} catch (e){
					console.log(e);
				}
			}
		});
	});
  
});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });

// Gets a random integer between 0 and the given number
function randInt(max){
	return Math.floor(Math.random() * max);
}