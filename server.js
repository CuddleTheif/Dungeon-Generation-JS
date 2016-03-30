const http = require('http'),
		express = require('express'),
		ws = require('ws'),
		dungeon = require('dungeon');
var app = express();

app.set('view engine', 'ejs');
app.use(express.static('static'));

app.get('/', function(req, res) {
    res.render('dungeon', {dungeon: JSON.stringify(dungeon.generate()), playerX: 1, playerY: 2});
});

http.createServer(app).listen(8080);
console.log('serving at https://localhost:8080/');