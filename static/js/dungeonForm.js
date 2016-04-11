function createDungeon(){
	var form = document.getElementById("dungeon-form");
	setFormDisabled(form, true);
	
	if(form.elements["width"].value*form.elements["height"].value>45000){
		alert('The area of the dungeon must be less than 45000!');
		setFormDisabled(form, false);
    return false;
	}
	
	if(parseInt(form.elements["roomMinWidth"].value)>=parseInt(form.elements["roomMaxWidth"].value) || parseInt(form.elements["roomMinHeight"].value)>=parseInt(form.elements["roomMaxHeight"].value)){
		alert("The room's min sizes must be less than their respective max size!");
		setFormDisabled(form, false);
    return false;
	}

  if(form.elements["name"].value!=form.elements["name"].value.match(/[\w0-9]+/)){
    alert("The dungeon's name can only be letters, numbers, and underscores!");
    setFormDisabled(form, false);
    return false;
  }
	
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			var response = JSON.parse(xhttp.responseText), send = false;
			switch(response.stats){
				case -1:
					send = false;
					alert(response.message);
					break;
				case 1:
					send = true;
					break;
			}
			if(send){
				var xhttp2 = new XMLHttpRequest();
				xhttp2.onreadystatechange = function() {
					if (xhttp2.readyState == 4 && xhttp2.status == 200) {
						document.location = "/dungeon/"+form.elements["name"].value.toLowerCase();
					}
				};
				xhttp2.open("POST", "/create", true);
				xhttp2.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
				var message = {};
				for(var ele in form.elements){
					if (parseInt(ele)==ele || !form.elements.hasOwnProperty(ele)) continue;
					message[ele] = form.elements[ele].value;
				}console.log(JSON.stringify(message));
				xhttp2.send(JSON.stringify(message));
			}
			else
				setFormDisabled(form, false);
		}
	};
	xhttp.open("POST", "/attempt", true);
	xhttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	var message = {};
	for(var ele in form.elements){
		if (parseInt(ele)==ele || !form.elements.hasOwnProperty(ele)) continue;
		message[ele] = form.elements[ele].value;
	}
	xhttp.send(JSON.stringify(message));
  return false;
}

function setFormDisabled(form, val){
	form.elements["width"].disabled = val;
	form.elements["height"].disabled = val;
	form.elements["numRooms"].disabled = val;
	form.elements["roomMinWidth"].disabled = val;
	form.elements["roomMaxWidth"].disabled = val;
	form.elements["roomMinHeight"].disabled = val;
	form.elements["roomMaxHeight"].disabled = val;
	form.elements["name"].disabled = val;
  document.getElementById("submit").disabled = val;
}
