// Packages
var fs = require('fs');

// Parameters
var name = process.argv[2];
var dir = './static/dungeon/'+name+'/';
        
// Delete the folder of this page
var files = fs.readdirSync(dir);
for(var i=0;i<files.length;i++)
  fs.unlinkSync(dir+files[i]);
fs.rmdirSync(dir);
