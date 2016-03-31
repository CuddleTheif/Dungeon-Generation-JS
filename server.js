const http = require('http'),
		express = require('express'),
		ws = require('ws'),
		dungeon = require('./dungeon');
var app = express();

app.set('view engine', 'ejs');
app.use(express.static('static'));

app.get('/', function(req, res) {
	
	var rooms = [];
	for(var i=0;i<10;i++)
		rooms[i] = {width:randInt(4)+4, height:randInt(4)+4};
	rooms.push({width:4, height:4, tiles:[[0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]]});
	var grid = dungeon.generate(200, 100, 20, rooms);
    res.render('dungeon', {dungeon: JSON.stringify(grid)});
});

http.createServer(app).listen(8080);
console.log('serving at https://localhost:8080/');

// Gets a random integer between 0 and the given number
function randInt(max){
	return Math.floor(Math.random() * max);
}