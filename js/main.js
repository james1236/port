/* 
	Mock operating system in browser
	
	inspired by http://daydun.com/'s terminal portfolio and other projects
*/

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var spritesheet = document.getElementById("spritesheet");

var touch = false;
var mouseX = 0;
var mouseY = 0;
var keysPressed = {};
var held;
var heldStart;
var active = -1;

var taskBarOpacity = 0;

var globalTimer = 0;

var textureMap = {
	"tl":[0,0,16,16],
	"tr":[16,0,16,16],
	"t":[32,0,16,16],
	"l":[48,0,16,16],
	"bl":[64,0,16,16],
	"br":[128,0,16,16],
	"r":[144,0,16,16],
	"b":[160,0,16,16],
	"bar":[176,0,16,16],
	"task":[192,0,48,16],
	"hide":[240,0,16,16],
}

var tileScale = 64;

var windows = [];

var deletions = [];

var programPermissions = {
	"terminal":{
		level:"super",
	},	
	"system":{
		level:"super",
	},
};

var permissionRequirements = {
	"init":"basic",
	"image":"basic",
	"programs":"basic",
	
	"updatePermissions":"super",
	"failPermissions":"super",
	"kill":"super",
	"run":"super",
}

var permissionDictionary = {
	"ultra":-1,
	"super":0,
	"basic":1,
}

var exampleWindowId = -1;

//Create some example windows
setTimeout(function () {
	createWindow(-1,-1,8,7,false,false,"demo");
	setTimeout(function () {
		exampleWindowId = createWindow(-1,-1,8,7,false,true,"system");
		setTimeout(function () {
			minimizeWindow(exampleWindowId);
		},400);
	},400);
},1000);

function getWindowIndiciesByProgram(program) {
	output = [];
	for (i = windows.length-1; i > -1; i--) {
		if (windows[i].program == program || program == "*") {
			output.push(windows[i].id);
		}
	}
	return output;
}

function getWindowIndexByID(id) {
	id = parseFloat(id);
	for (i = windows.length-1; i > -1; i--) {
		if (windows[i].id == id) {
			return i;
		}
	}
}

function createWindow(x,y,sx,sy,maximized,minimized,program,initInfo) {
	if (x == -1) {
		x = randInt(Math.round(canvas.width-sx*tileScale-25))+25;
	}	
	if (y == -1) {
		y = randInt(Math.round(canvas.height-sy*tileScale-25))+25;
	}
	
	windows.push({
		x:x,
		y:y,
		sx:sx,
		sy:sy,
		maximized:maximized,
		minimized:minimized,
		id:Math.random(),
		program:program,
		iframe:document.createElement("iframe"),
		initiated:false,
		active:false,
		escapable:true,
		tangible:true,
		stateChangeTime:globalTimer,
		creationTime:globalTimer,
		initInfo:initInfo,
	});
	
	setActiveWindow(windows.length-1);
	if (!(program.substring(0,4) == "http" || program.substring(0,5) == "data:")) {
		windows[windows.length-1].iframe.src = "programs/"+program+"/index.html";
	} else {
		windows[windows.length-1].iframe.src = program;
	}
	
	if (program.substring(0,5) == "data:") {
		windows[windows.length-1].program = "custom";
	}
	
	if (programPermissions[windows[windows.length-1].program] == undefined) {
		programPermissions[windows[windows.length-1].program] = {level:"basic"};
	}
	
	windows[windows.length-1].iframe.style = "top:"+(y)+"px;left:"+(x+(tileScale/8))+"px;position: fixed; opacity: 1;";
	windows[windows.length-1].iframe.setAttribute("id",windows[windows.length-1].id+"");
	windows[windows.length-1].iframe.frameBorder = "0";
	windows[windows.length-1].iframe.width = sx*tileScale-(tileScale/4); 
	windows[windows.length-1].iframe.height = sy*tileScale-(tileScale/8);

	document.body.appendChild(windows[windows.length-1].iframe);

	windowPointerEvents(true);
	
	return windows[windows.length-1].id;
}

function drawWindows() {
	for (i = windows.length-1; i > -1; i--) {
		if (i != active) {
			drawWindow(i);
		}
	}
	if (active != undefined && active != -1 && windows[active]) {
		drawWindow(active, true);
	}
}

function drawWindow(i,windowActive) {
	if (!windows[i].tangible) {return;}
	activeTexture = 0;
	if (windowActive) {
		activeTexture = 16;
	}

	if (!windows[i].maximized) {
		//tl
		context.drawImage(spritesheet,textureMap["tl"][0],textureMap["tl"][1]+activeTexture,textureMap["tl"][2],textureMap["tl"][3],windows[i].x,windows[i].y-tileScale,tileScale,tileScale);
		
		//l+r
		for (piy = 0; piy < (windows[i].sy * tileScale) - tileScale; piy+=tileScale) {
			for (pix = 0; pix < (windows[i].sx * tileScale)+1; pix+=(windows[i].sx * tileScale)) {
				if (pix == 0) {
					context.drawImage(spritesheet,textureMap["l"][0],textureMap["l"][1]+activeTexture,textureMap["l"][2],textureMap["l"][3],windows[i].x,windows[i].y+piy,tileScale,tileScale);
				} else {
					context.drawImage(spritesheet,textureMap["r"][0],textureMap["r"][1]+activeTexture,textureMap["r"][2],textureMap["r"][3],windows[i].x+pix-tileScale,windows[i].y+piy,tileScale,tileScale);
				}
			}
		}
		pix = (windows[i].sx * tileScale);
		
		//tr
		context.drawImage(spritesheet,textureMap["tr"][0],textureMap["tr"][1]+activeTexture,textureMap["tr"][2],textureMap["tr"][3],windows[i].x+pix-tileScale,windows[i].y-tileScale,tileScale,tileScale);
		
		//bl
		context.drawImage(spritesheet,textureMap["bl"][0],textureMap["bl"][1]+activeTexture,textureMap["bl"][2],textureMap["bl"][3],windows[i].x,windows[i].y+piy,tileScale,tileScale);		
		
		//br
		context.drawImage(spritesheet,textureMap["br"][0],textureMap["br"][1]+activeTexture,textureMap["br"][2],textureMap["br"][3],windows[i].x+pix-tileScale,windows[i].y+piy,tileScale,tileScale);
		
		//b+t
		for (pix = tileScale; pix < (windows[i].sx * tileScale) - tileScale; pix+=tileScale) {
			for (piy = 0; piy < (windows[i].sy * tileScale)+1; piy+=(windows[i].sy * tileScale)) {
				if (piy == 0) {			
					context.drawImage(spritesheet,textureMap["t"][0],textureMap["t"][1]+activeTexture,textureMap["t"][2],textureMap["t"][3],windows[i].x+pix,windows[i].y+piy-tileScale,tileScale,tileScale);
				} else {
					context.drawImage(spritesheet,textureMap["b"][0],textureMap["b"][1]+activeTexture,textureMap["b"][2],textureMap["b"][3],windows[i].x+pix,windows[i].y+piy-tileScale,tileScale,tileScale);
				}
			}
		}
		
		//title
		context.globalAlpha = 0.2;
		context.textAlign = "left";
		context.fillStyle = "#fff";
		context.font = "24px font";
		context.fillText(windows[i].program,windows[i].x+35,windows[i].y-7);
		
		permString = "  "+programPermissions[windows[i].program].level;
		
		for (rep = 0; rep < 2; rep++) {
			if (windows[i].sx > 5) {
				context.fillText(windows[i].program+" "+windows[i].id+permString,windows[i].x+35,windows[i].y-7);
			} else {
				context.fillText(windows[i].program+" "+(windows[i].id+permString).substr(0,12)+"...",windows[i].x+35,windows[i].y-7);
			}
			permString = "";
		}
	} else {
		context.globalAlpha = 0.4;
		for (pix = 0; pix < canvas.width + tileScale + 1; pix+=tileScale) {
			context.drawImage(spritesheet,textureMap["bar"][0],textureMap["bar"][1]+activeTexture,textureMap["bar"][2],textureMap["bar"][3],windows[i].x+pix,windows[i].y-tileScale,tileScale,tileScale);
		}
	}
	
	//Window Management
	context.globalAlpha = 0.8;
	context.fillStyle = "#fff";
	context.textAlign = "right";
	if (!windows[i].maximized) {
		if (!windows[i].initiated && globalTimer - windows[i].creationTime > 10) {
			context.font = "20px font";
			context.fillText("!            ",windows[i].x+windows[i].sx*tileScale-40,windows[i].y-9);
		}
		context.font = "24px font";
		context.fillText("- \u25A1 x",windows[i].x+windows[i].sx*tileScale-40,windows[i].y-9);
	} else {
		if (!windows[i].initiated && globalTimer - windows[i].creationTime > 10) {
			context.font = "20px font";
			context.fillText("!            ",canvas.width-tileScale/8,windows[i].y-tileScale/20);
		}
		context.font = "24px font";
		context.fillText("- \u25A1 x",canvas.width-tileScale/8,windows[i].y-tileScale/20);
	}
	
	context.globalAlpha = 1;
	
	//Seeded Random colored rect for bg of windows based on their id
	Math.seed = windows[i].id * 1000;
	context.fillStyle = "#"+Math.seededRandom(2,9)+""+Math.seededRandom(2,9)+""+Math.seededRandom(2,9)+"";
	context.fillRect(windows[i].x+(tileScale/8),windows[i].y,windows[i].iframe.width,windows[i].iframe.height);
		
		
	if (!windows[i].active) {
		//Draw screenshot for inactive windows
		try {
			context.drawImage(windows[i].image,windows[i].x+(tileScale/8),windows[i].y,windows[i].iframe.width,windows[i].iframe.height);
		} catch (e) {
			if (globalTimer - windows[i].stateChangeTime < 10) {
				context.globalAlpha = (globalTimer - windows[i].stateChangeTime)/10;
			}
			context.drawImage(spritesheet,textureMap["hide"][0],textureMap["hide"][1],textureMap["hide"][2],textureMap["hide"][3],Math.round(windows[i].x+windows[i].iframe.width/2)-tileScale/2,Math.round(windows[i].y+windows[i].iframe.height/2)-tileScale/2,tileScale,tileScale);
			
			context.globalAlpha = 1;
		}
	}
}

function drawTaskbar() {
	draw = false;
	for (wi = 0; wi < windows.length; wi++) {
		if (windows[wi].minimized) {
			draw = true;
			break;
		}
	}
	if (!draw) {
		if (taskBarOpacity == 0) {
			return;
		} else {
			taskBarOpacity-=2;
		}
	}
	if (taskBarOpacity < 10) {
		taskBarOpacity+=1;
	}
	
	context.globalAlpha = taskBarOpacity/10;
	for (pix = 0; pix < canvas.width; pix+=tileScale) {
		context.drawImage(spritesheet,textureMap["bar"][0],textureMap["bar"][1],textureMap["bar"][2],textureMap["bar"][3],pix,canvas.height-tileScale/1.1,tileScale,tileScale);
	}
	task = 0;
	for (wi = 0; wi < windows.length; wi++) {
		if (windows[wi].minimized) {
			context.drawImage(spritesheet,textureMap["task"][0],textureMap["task"][1],textureMap["task"][2],textureMap["task"][3],task*(tileScale*3),canvas.height-tileScale/1.1,tileScale*3,tileScale);
			
			if (taskBarOpacity >= 2) {
				context.globalAlpha = (taskBarOpacity-2)/10;
			} else {
				context.globalAlpha = 0;
			}
			context.globalAlpha = 0.8;
			context.textAlign = "center";
			context.fillStyle = "#fff";
			context.font = "24px font";
			context.fillText(windows[wi].program,task*(tileScale*3)+tileScale*1.5,canvas.height-tileScale/1.1+tileScale/1.7);
			
			context.globalAlpha = taskBarOpacity/10;
			
			task++;
		}
	}
	context.globalAlpha = 1;
}


function scaleCanvas(canvasElem,sx,sy,light) {
	if (canvasElem == undefined) {
		canvas.width = window.innerWidth; 
		canvas.height = window.innerHeight;

		canvas.style.width = Math.round(canvas.width)+"px";
		canvas.style.height = Math.round(canvas.height)+"px";
	} else {
		canvasElem.width = sx-(tileScale/4); 
		canvasElem.height = sy-(tileScale/8);


		canvasElem.style.width = Math.round(canvasElem.width)+"px";
		canvasElem.style.height = Math.round(canvasElem.height)+"px";
	}
}

scaleCanvas();

function deleteWindows() {
	while (deletions.length > 0) {
		if (windows[getWindowIndexByID(deletions[0])]) {
			windows[getWindowIndexByID(deletions[0])].iframe.remove();
			windows.splice(getWindowIndexByID(deletions[0]),1);
		}
		deletions.shift();
		
		if (active > windows.length-1) {
			setActiveWindow(0);
		} else {
			setActiveWindow(active);
		}
	}
}

function minimizeWindow(id) {
	windows[getWindowIndexByID(id)].minimized = true;
	windows[getWindowIndexByID(id)].tangible = false;
	windows[getWindowIndexByID(id)].iframe.style.pointerEvents = "none";
	windows[getWindowIndexByID(id)].iframe.style.display = "none";
	if (windows[getWindowIndexByID(id)].active) {
		setActiveWindow(0);
	}
}

function maximizeWindow(id) {
	windows[getWindowIndexByID(id)].maximized = true;
	windows[getWindowIndexByID(id)].iframe.width = canvas.width; 
	windows[getWindowIndexByID(id)].iframe.height = canvas.height-tileScale/4;	
	windows[getWindowIndexByID(id)].y = tileScale/4; 
	windows[getWindowIndexByID(id)].x = 0-tileScale/8;
	setActiveWindow(getWindowIndexByID(id));
	
	windows[getWindowIndexByID(id)].iframe.contentWindow.postMessage({request:"scale"}, '*'); 
	
}

function restoreWindow(id) {
	if (id == -1) {return};
	if (windows[getWindowIndexByID(id)].minimized) {
		windows[getWindowIndexByID(id)].minimized = false;
		windows[getWindowIndexByID(id)].tangible = true;
		windows[getWindowIndexByID(id)].iframe.style.pointerEvents = "auto";
		windows[getWindowIndexByID(id)].iframe.style.display = "block";
		setActiveWindow(getWindowIndexByID(id));
	} else {
		if (windows[getWindowIndexByID(id)].maximized) {
			windows[getWindowIndexByID(id)].maximized = false;
			windows[getWindowIndexByID(id)].iframe.width = windows[getWindowIndexByID(id)].sx*tileScale-(tileScale/4); 
			windows[getWindowIndexByID(id)].iframe.height = windows[getWindowIndexByID(id)].sy*tileScale-(tileScale/8);
			
			windows[getWindowIndexByID(id)].x = randInt(Math.round(canvas.width-windows[getWindowIndexByID(id)].sx*tileScale-25))+25;
			windows[getWindowIndexByID(id)].y = randInt(Math.round(canvas.height-windows[getWindowIndexByID(id)].sy*tileScale-25))+25;
			
			windows[getWindowIndexByID(id)].iframe.contentWindow.postMessage({request:"scale"}, '*'); 
			setActiveWindow(getWindowIndexByID(id));
		}
	}
}

//Main Program Loop
setInterval(function() {
	context.clearRect(0,0,canvas.width,canvas.height);
	context.imageSmoothingEnabled = false;

	try {
		context.drawImage(document.getElementById("background"),0,0,canvas.width,canvas.height);
	} catch (e) {}
	
	mainLoop();
//1000/fps
},1000/60);


function tickWindows() {
	for (wi = windows.length-1; wi > -1; wi--) {		
		windows[wi].iframe.style.top = windows[wi].y+"px";
		windows[wi].iframe.style.left = (windows[wi].x+(tileScale/8))+"px";
		
		//Fade in iframe 
		if (parseFloat(windows[wi].iframe.style.opacity) < 1) {
			windows[wi].iframe.style.opacity = parseFloat(windows[wi].iframe.style.opacity) + 0.1;
		}
		if (!windows[wi].initiated) {
			try {
				windows[wi].iframe.contentWindow.postMessage({request:"init",id:windows[wi].id,initInfo:windows[wi].initInfo}, '*'); 
			} catch (e) {
				console.log(e);
			}
		} else {
			if (windows[wi].active) {
				try {
					windows[wi].iframe.contentWindow.postMessage({request:"tick"}, '*'); 
				} catch (e) {
					console.log(e);
				}
			}
		}
	}
}

function mainLoop() {	
	tickWindows();
	drawTaskbar();
	drawWindows();
	
	deleteWindows();
	
	if (windows.length == 0) {
		createWindow(100,50,7,6,false,false,"terminal");
	}
	
	globalTimer++;
}

function mouseCollide(x,y,width,height) {
	if (height == undefined) {
		height = width;
	}
	
	if (mouseX > x && 
		mouseX < x+width && 
		mouseY > y && 
		mouseY < y+height) {
		return true;
	}
	return false;
}

function hoverHeld() {
	for (i = windows.length-1; i > -1; i--) {
		if (windows[i].tangible) {
			if (mouseCollide(windows[i].x,windows[i].y-tileScale/2,windows[i].sx * tileScale,tileScale/2)) {
				return i;
			}
		}
	}
	return -1;
}

function hoverWindowManagement() {
	for (i = windows.length-1; i > -1; i--) {
		if (windows[i].tangible) {
			if ((!windows[i].maximized && mouseCollide(windows[i].x+windows[i].sx * tileScale-50,windows[i].y-tileScale/3,10,tileScale/4)) || (windows[i].maximized && mouseCollide(canvas.width-tileScale/3.8,windows[i].y-tileScale/4.5,12,12))) {
				deletions.push(windows[i].id);
				return true;
			}
			if ((!windows[i].maximized && mouseCollide(windows[i].x+windows[i].sx*tileScale-40-tileScale/1.5,windows[i].y-9-tileScale/6,12,12)) || (windows[i].maximized && mouseCollide(canvas.width-tileScale/1.25,windows[i].y-tileScale/4.5,12,12))) {
				minimizeWindow(windows[i].id);
				return true;
			}
			if ((!windows[i].maximized && mouseCollide(windows[i].x+windows[i].sx*tileScale-40-tileScale/2.4,windows[i].y-9-tileScale/6,12,12)) || (windows[i].maximized && mouseCollide(canvas.width-tileScale/1.85,windows[i].y-tileScale/4.5,12,12))) {
				if (!windows[i].maximized) {
					maximizeWindow(windows[i].id);
				} else {
					restoreWindow(windows[i].id);
				}
				return true;
			}
			if (!windows[i].initiated && globalTimer - windows[i].creationTime > 10 && ((!windows[i].maximized && mouseCollide(windows[i].x+windows[i].sx*tileScale-40-tileScale/1.19,windows[i].y-9-tileScale/5.5,12,12)) || (windows[i].maximized && mouseCollide(canvas.width-tileScale,windows[i].y-tileScale/4.5,12,12)))) {
				createWindow(-1,-1,7,4,false,false,"system","externalInfo");
				return true;
			}
		}
	}
	return false;
}

function hoverWindow() {
	//if hover on active, don't click through
	if (windows[active] && windows[active].tangible) {
		if (mouseCollide(windows[active].x,windows[active].y,windows[active].sx * tileScale,windows[active].sy * tileScale) || windows[active].maximized) {
			return true;
		}
	}
	for (i = 0; i < windows.length; i++) {
		if (windows[i].tangible) {
			if (active != i) {
				if (mouseCollide(windows[i].x,windows[i].y,windows[i].sx * tileScale,windows[i].sy * tileScale) || windows[i].maximized) {
					setActiveWindow(i);
					return true;
				}
			}
		}
	}
	return false;
}


function hoverTaskbar() {
	task = 0;
	for (wi = 0; wi < windows.length; wi++) {
		if (windows[wi].minimized) {
			if (mouseCollide(task*(tileScale*3),canvas.height-tileScale/1.1,tileScale*3,tileScale)) {
				return windows[wi].id;
			}
			task++;
		}
	}
	return -1;
}

function setActiveWindow(index) {
	if (!windows[index].tangible) {return false;}
	if (windows[index].active) {return false;}
	active = index;
	for (i = windows.length-1; i > -1; i--) {
		if (i != index) {
			if (windows[i].active) {
				windows[i].iframe.style.pointerEvents = "none";
				windows[i].iframe.style.display = "none";
				windows[i].active = false;
				windows[i].stateChangeTime = globalTimer;
				
				//Request Image
				windows[i].iframe.contentWindow.postMessage({request:"image"}, '*'); 
			}
		} else {
			windows[i].iframe.style.pointerEvents = "auto";
			windows[i].iframe.style.display = "block";
			if (windows[i].image == undefined) {
				windows[i].iframe.style.opacity = "0";
			}
			windows[i].active = true;
		}
	}
	return true;
}

function windowPointerEvents(mode) {
	for (i = windows.length-1; i > -1; i--) {
		windows[i].iframe.style.pointerEvents = (mode) ? "auto" : "none";
	}
}

function requestPermissions(program,level,confirmPostData,currentLevel) {
	createWindow(-1,-1,7,5,false,false,"system",{page:"permissions",program:program,level:level,confirmPostData:confirmPostData,currentLevel:currentLevel});
}

//Recive data from windows
window.addEventListener('message', function(event) { 
	//Program ID validity check
	if (event.data.id && windows[getWindowIndexByID(event.data.id)] && windows[getWindowIndexByID(event.data.id)].program) {
		var programName = windows[getWindowIndexByID(event.data.id)].program;
	} else {
		return false; //No ID provided for authentication
	}	
	
	//Permissions eligibility check
	if (event.data.request) {
		if (permissionRequirements[event.data.request]) {
			if (programPermissions[programName] == undefined) {
				programPermissions[programName] = {
					level:"basic"
				};
			}
			if (permissionDictionary[permissionRequirements[event.data.request]] < permissionDictionary[programPermissions[programName].level]) {
						
				windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({request:"error",data:"   '"+programPermissions[programName].level+"' perm is insufficient ('"+permissionRequirements[event.data.request]+"' needed for '"+event.data.request+"')"}, '*');
				
				if (programPermissions[programName].count == undefined || programPermissions[programName].count < 2) {
					requestPermissions(programName,permissionRequirements[event.data.request],event.data,programPermissions[programName].level);
				} else {
					windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({request:"error",data:"   '"+programPermissions[programName].level+"' max session failed perm requests reached"}, '*');
				}
				
				return false; //Elevated permissions required
			}
		} else {
			windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({request:"error",data:"   Error: perms not set for '"+event.data.request+"'"}, '*');
			return false; //Permissions not set up for attempted request
		}
	} else {
		return false; //No valid request made
	}
	
	//-------------------
	//By here all permissions and checks are met for the given request
	//-------------------
	
	if (event.data.request == "init") {
		windows[getWindowIndexByID(event.data.id)].initiated = true;
		return;
	}
	
	if (event.data.request == "image") {
		windowIndex = getWindowIndexByID(event.data.id);
		
		windows[windowIndex].image = new Image();
		windows[windowIndex].image.src = event.data.data;
		return;
	}
	
	if (event.data.request == "run") {
		//Accept
		if (event.data.data.split(" ").length == 1) {
			createWindow(-1,-1,8,7,false,false,event.data.data);
			windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({request:"error",data:"   ran program '"+event.data.data+"'"}, '*');
		} else {
			createWindow(-1,-1,8,7,false,false,event.data.data.split(" ")[0],event.data.data.split(" ")[1]);
			windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({request:"error",data:"   ran program '"+event.data.data.split(" ")[0]+"' with parameter '"+event.data.data.split(" ")[1]+"'"}, '*');
		}
		return;
	}
	
	if (event.data.request == "updatePermissions") {
		if (programPermissions[event.data.targetProgram] == undefined) {
			programPermissions[event.data.targetProgram] = {level:event.data.targetLevel};
		} else {
			programPermissions[event.data.targetProgram].level = event.data.targetLevel;
		}
		return;
	}	
	
	if (event.data.request == "failPermissions") {
		if (programPermissions[event.data.targetProgram].count == undefined) {
			programPermissions[event.data.targetProgram].count = 1;
		} else {
			programPermissions[event.data.targetProgram].count++;
		}
		return;
	}
	
	if (event.data.request == "kill") {
		//Single window selected by ID or *
		if (!isNaN(event.data.data+"") && (event.data.data+"").toString().indexOf('.') != -1) {
			deletions.push(event.data.data);
			windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({request:"error",data:"   killed program of id '"+event.data.data+"'"}, '*');
		} else {
			//Multiple windows selected by program type
			kills = getWindowIndiciesByProgram(event.data.data);
			deletions = deletions.concat(kills)
			windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({request:"error",data:"   killed all programs of type '"+event.data.data+"'"}, '*');
		}
		return;
	}
	
	if (event.data.request == "programs") {
		var programListRaw = [];
		var programList = [];
		try {
			programListRaw = loadFile("data/programList.txt").trim().split(",");
			for (program of programListRaw) {
				program = program.trim();
				if (program.length > 1) {
					programList.push({
						"program":program,
						"description":loadFile("programs/"+program+"/description.txt"),
					});
				}
			}
			
			windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({request:"programs",data:programList}, '*');
		} catch (e) {
			windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({request:"error",data:"   Error: "+e}, '*'); 
		}
		return;
	}		
	
	//Fail
	windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({request:"error",data:"   Error: '"+event.data.request+"' request incompletable"}, '*');
}); 

//Mouse Input
$(canvas)
	.bind('touchstart mousedown',function(e){
		e.preventDefault()
		if (e.touches == undefined) {
			mouseX = e.clientX;
			mouseY = e.clientY;
		} else {
			mouseX = parseInt(e.touches[0].pageX);
			mouseY = parseInt(e.touches[0].pageY);
		}
		touch = true;
		
		if (hoverWindowManagement()) {
			return;
		}
		
		held = hoverHeld();
		if (held != -1) {
			setActiveWindow(held);
			windowPointerEvents(false);
			return;
		}
		
		if (!hoverWindow()) {
			restoreWindow(hoverTaskbar());
		}
	})
	
	.bind('touchend mouseup',function(e){
		e.preventDefault()
		touch = false;
		
		if (held != -1) {
			windowPointerEvents(true);
		}
		held = -1;
	})
	
	.bind('touchmove mousemove',function(e){
		e.preventDefault()
		if (e.touches == undefined) {
			mouseX = e.clientX;
			mouseY = e.clientY;
		} else {
			mouseX = parseInt(e.touches[0].pageX);
			mouseY = parseInt(e.touches[0].pageY);
		}
		
		if (touch && held != -1) {
			if (heldStart) {
				windows[held].x+= mouseX-heldStart.x;
				windows[held].y+= mouseY-heldStart.y;
			}
			heldStart = {x:mouseX,y:mouseY}
		} else {
			heldStart = undefined;
		}
	});
	
	$('body').on('contextmenu', '#myCanvas', function(e){ return false; });
	
	
	//Keyboard Input
	window.addEventListener("keydown",
		function(e){
			//e.preventDefault();
			keysPressed[e.keyCode] = true;
		},
	false);

	window.addEventListener('keyup',
		function(e){
			//e.preventDefault();
			keysPressed[e.keyCode] = false;
		},
	false);
	
canvas.addEventListener("mousewheel", function() {
	var e = window.event || e; // old IE support
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	if (delta > 0) {
		if (inventory.slot != 0) {
			inventory.slot--;
		} else {
			inventory.slot = inventory.slotMax-1;
		}
	} else {
		if (inventory.slot < inventory.slotMax-1) {
			inventory.slot++;
		} else {
			inventory.slot = 0;
		}
	}
}, false);
	

function randInt(max){
	return Math.trunc(Math.random() * (max - 0));
}

Math.seededRandom = function(max, min) {
	max = max || 1;
	min = min || 0;
 
	Math.seed = (Math.seed * 9301 + 49297) % 233280;
	var rnd = Math.seed / 233280;
 
	return Math.trunc(min + rnd * (max - min));
}

function loadFile(filePath) {
	var result = null;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", filePath, false);
	xmlhttp.send();
	if (xmlhttp.status==200) {
		result = xmlhttp.responseText;
	}
	return result;
}