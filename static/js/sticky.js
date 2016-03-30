function positionStickies() {
    var stickies = document.getElementsByClassName("sticky");
    for(var sticky in stickies){
    	if(stickies[sticky].style.position !== "sticky" && stickies[sticky].style.position !== "-webkit-sticky"){
    		var top = getTop(stickies[sticky].parentNode);
   	    	if (document.documentElement.scrollTop > top || document.body.scrollTop > top) 
            	stickies[sticky].style.position = "fixed";
        	else 
            	stickies[sticky].style.position = "relative";
    	}
    }
}

function loadStickies(){
	var stickies = document.getElementsByClassName("sticky");
    for(var sticky in stickies){
		stickies[sticky].style.position = "-webkit-sticky";
	    stickies[sticky].style.position = "sticky";
	}
    positionStickies();
}

function getTop(element){
	var top = 0;
	
	while(element){
		top += element.offsetTop;
		element = element.offsetParent;
	}
	
	return top;
}

window.onload = loadStickies;
window.onresize = positionStickies;
window.onscroll = positionStickies;
