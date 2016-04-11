// Packages
var Dungeon = require('./dungeon'), fs = require('fs');
var tasks = [], running = false;


process.on('message', function(dungeonParams){
  tasks.push(dungeonParams);
  if(!running)
    nextTask();
});

// Loads a dungeon
function loadDungeon(name, width, height, numRooms, roomMinWidth, roomMaxWidth, roomMinHeight, roomMaxHeight){
        
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
    fs.access('./static/dungeon/'+name+'/', fs.F_OK, (err) => {
      var saveImgs = function(err) {
        if(err) throw err;
        fs.writeFile('./static/dungeon/'+name+'/dungeon_back.png', backBuffer, function(err) {
          if (err) throw err;
          if(!saving)
            saving = true;
          else{
            process.send({name:name, dungeon:dungeon});
            nextTask();
          }
        });
        fs.writeFile('./static/dungeon/'+name+'/dungeon_top.png', topBuffer, function(err) {
          if (err) throw err;
          if(!saving)
            saving = true;
          else{
            process.send({name:name, dungeon:dungeon});
            nextTask();
          }
        });
      };
      if(err)
        fs.mkdir('./static/dungeon/'+name+'/', saveImgs);
      else
        saveImgs();
    });
  };

  dungeon.draw(serveBuffers);

}

// Starts the next task
function nextTask(){
  running = false;
  if(tasks.length>0){
    running = true;
    loadDungeon(tasks[0].name, tasks[0].width, tasks[0].height, tasks[0].numRooms, tasks[0].roomMinWidth, tasks[0].roomMaxWidth, tasks[0].roomMinHeight, tasks[0].roomMaxHeight);
    tasks.splice(0, 1);
  }
}
    
// Gets a random integer between 0 and the given number
function randInt(max){
        return Math.floor(Math.random() * max);
}
