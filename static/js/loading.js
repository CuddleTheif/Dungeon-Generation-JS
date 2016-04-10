var multiplayerSocket;

document.addEventListener('DOMContentLoaded', function() {
	multiplayerSocket = new WebSocket("ws:"+document.location.hostname+":"+document.location.port+"/"+name);
	multiplayerSocket.onmessage = function(event){
    if(event.data==="DONE")
      document.location.reload();
  };
  multiplayerSocket.onclose = function(event) {
    alert('You have been disconnected from the server! You are being moved back to the lobby!');
    document.location = '/';
  }
});
