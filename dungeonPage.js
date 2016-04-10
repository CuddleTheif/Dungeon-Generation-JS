// Packages
var Dungeon = require('./dungeon'), fs = require('fs');

// Parameters
var name = process.argv[2],
        width = parseInt(process.argv[3]),
        height = parseInt(process.argv[4]),
        numRooms = parseInt(process.argv[5]),
        roomMinWidth = parseInt(process.argv[6]),
        roomMaxWidth = parseInt(process.argv[7]),
        roomMinHeight = parseInt(process.argv[8]),
        roomMaxHeight = parseInt(process.argv[9]);
        
// First create the rooms and the dungeon
var rooms = [];
for(var i=0;i<numRooms;i++)
        rooms[i] = {width:randInt(roomMaxWidth-roomMinWidth)+roomMinWidth, height:randInt(roomMaxHeight-roomMinHeight)+roomMinHeight};
rooms[rooms.length-1].entrance = {x:randInt(rooms[rooms.length-1].width),y:randInt(rooms[rooms.length-1].height)};
var dungeon = new Dungeon.Dungeon(width, height, {x:5, y:1}, {x:3, y:3}, {x:3, y:2});

// Generate the dungeon
dungeon.generate(numRooms, rooms);
        
// Perform dungeon draw next
var serveBuffers = function(backBuffer, topBuffer){
  var saving = false;
  fs.access('./static/dungeon/'+name, fs.F_OK, (err) => {
    var saveImgs = function(err) {
      if(err) throw err;
      fs.writeFile('./static/dungeon/'+name+'/dungeon_back.png', backBuffer, function(err) {
        if (err) throw err;
        if(!saving)
          saving = true;
        else{
          process.send(dungeon);
          process.exit();
        }
      });
      fs.writeFile('./static/dungeon/'+name+'/dungeon_top.png', topBuffer, function(err) {
        if (err) throw err;
        if(!saving)
          saving = true;
        else{
          process.send(dungeon);
          process.exit();
        }
      });
    };
    if(err)
      fs.mkdir('./static/dungeon/'+name, saveImgs);
    else
      saveImgs();
  });
};

dungeon.draw(serveBuffers);

// Gets a random integer between 0 and the given number
function randInt(max){
        return Math.floor(Math.random() * max);
}
