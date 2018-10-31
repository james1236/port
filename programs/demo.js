(function() {
	
	//Window specific code	
	windows[getWindowIndexByID(document.currentScript.id)].context = windows[getWindowIndexByID(document.currentScript.id)].canvas.getContext('2d');

	windows[getWindowIndexByID(document.currentScript.id)].init = function () {
		//Blue BG
		this.context.fillStyle = "#66f";
		this.context.fillRect(0,0,this.canvas.width,this.canvas.height);
		
		//Init Banner
		this.context.globalAlpha = 0.5;
		this.context.fillStyle = "#000";
		this.context.fillRect(0,0,this.canvas.width,100);
		this.context.globalAlpha = 1;
		
		//Text
		this.context.fillStyle = "#fff";
		this.context.font = "24px font";
		this.context.textAlign = "center";
		this.context.fillText("Program Initialized! "+this.program,this.canvas.width/2,50);
		this.context.fillStyle = "#000";
		
		//Create Tick Counter
		this.tickCounter = 0;
	}

	windows[getWindowIndexByID(document.currentScript.id)].tick = function () {
		//Tick Banner
		this.context.fillRect(0,this.canvas.height-100,this.canvas.width,100);
		
		//Text
		this.context.fillStyle = "#fff";
		this.context.font = "24px font";
		this.context.textAlign = "center";
		this.context.fillText("Program Ticked! "+this.tickCounter,this.canvas.width/2,this.canvas.height-50);
		this.context.fillStyle = "#000";
		
		//Tick Counter
		this.tickCounter++;
		
		/*
		if (globalTimer % 100 == 50) {
			//only change when scaling
			//scaleCanvas(this.canvas,this.sx*tileScale,this.sy*tileScale,true);
		}*/
	}

	$(windows[getWindowIndexByID(document.currentScript.id)].canvas)
		.bind('touchstart mousedown',function(e){
			alert("touch");
		});

})();