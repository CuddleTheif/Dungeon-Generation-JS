
function createLayer(layer){
	return {
		objects: [],
		konvaLayer: layer,
		draw: function(area){
			this.konvaLayer.removeChildren();
			for(var i=0;i<this.objects.length;i++)
				if(isInArea(this.objects[i], area))
					this.konvaLayer.add(this.objects[i].clone({
																x:this.objects[i].x()-area.x,
																y:this.objects[i].y()-area.y
															}));
			this.konvaLayer.draw();
		},
		add: function(){
			for(var i=0;i<arguments.length;i++)
				this.objects.push(arguments[i]);
		}
	};
}

function isInArea(object, area){
	return object.x()+object.width()>=area.x && 
				object.y()+object.height()>=area.y && 
				object.x()<=area.x+area.width && 
				object.y()<=area.y+area.height;
}

function getViewport(){
	return { 
				x:player.x()-virtualSize*tileSize/2,
				y:player.y()-virtualSize*tileSize/2,
				width:virtualSize*tileSize,
				height:virtualSize*tileSize
			}
}