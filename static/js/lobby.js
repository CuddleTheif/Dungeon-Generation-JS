function refresh(){
  var table = document.getElementById("rooms");
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200) {
      
      var status = JSON.parse(request.responseText);
      var table = document.getElementById("rooms");
      table.innerHTML = '<tr><th>Dungeon Name</th><th>Area</th><th>Number of Players</th><th>Loading</th><th></th></tr>';
      for(var i=0;i<status.name.length;i++){
        var curRow = document.createElement("tr");
        curRow.innerHTML += '<td><a href="'+status.url[i]+'">'+status.name[i]+
                            '</a></td><td>'+status.area[i]+
                            '</td><td>'+status.players[i]+
                            '</td><td>'+status.loading[i]+
                            '</td>';
        var deleteButton = document.createElement("button");
        deleteButton.innerHTML = 'Delete';
        deleteButton.name = status.name[i];
        deleteButton.onclick = function() {
          var request2 = new XMLHttpRequest();
          request2.onreadystatechange = function() {
            if (request2.readyState == 4 && request2.status == 200){
              var data = JSON.parse(request2.responseText);
              if(parseInt(data.status)==-1)
                alert(data.message);
              refresh();
            }
          };
          request2.open("POST", "delete", true);
          request2.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
          request2.send(JSON.stringify({name: this.name}));
        };
        var deleteCell = document.createElement("td");
        deleteCell.appendChild(deleteButton);
        curRow.appendChild(deleteCell);
        table.appendChild(curRow);
      }
      
    }
  };
  request.open("POST", "status", true);
  request.send();
}

document.addEventListener("DOMContentLoaded", function(){
  refresh();
  setInterval(refresh, 5000);
});

