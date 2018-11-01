/* Project Browser Based on Windows Like Desktop Design 
inspired by http://daydun.com/'s terminal portfolio and other projects
*/

//save windows array between sessions (contains all programs local vars too)

//cannot create windows quickly without loading issues
//should have terminal program with special perms to manage other window content (same as un-unmaximizable desktop program behind everything)
//perms work through special windowcontent messages that only work if the id's window has that flag set? or only if it has a certian program type
//opening the site should yeild a boot screen and the whole thing should feel fluid and consistent between sessions
//log in program that loads your session from the server and saves it to it too.

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

var tempVar = 4;

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
}

var tileScale = 64;

var windows = [];

function getWindowsByProgram(program) {
	output = [];
	for (i = windows.length-1; i > -1; i--) {
		if (windows[i].program == program) {
			output.push(windows[i]);
		}
	}
	return windows;
}

function getWindowIndexByID(id) {
	id = parseFloat(id);
	for (i = windows.length-1; i > -1; i--) {
		if (windows[i].id == id) {
			return i;
		}
	}
}

function createWindow(x,y,sx,sy,mx,mn,program) {
	windows.push({
		x:x,
		y:y,
		sx:sx,
		sy:sy,
		mx:mx,
		mn:mn,
		id:Math.random(),
		program:program,
		iframe:document.createElement("iframe"),
		initiated:false,
		active:false,
	});
	
	setActiveWindow(windows.length-1);
	
	windows[windows.length-1].iframe.src = "programs/"+program+"/index.html";
	windows[windows.length-1].iframe.style = "top:"+(y)+"px;left:"+(x+(tileScale/8))+"px;position: fixed;";
	windows[windows.length-1].iframe.setAttribute("id",windows[windows.length-1].id+"");
	windows[windows.length-1].iframe.frameBorder = "0";
	windows[windows.length-1].iframe.width = sx*tileScale-(tileScale/4); 
	windows[windows.length-1].iframe.height = sy*tileScale-(tileScale/8);

	document.body.appendChild(windows[windows.length-1].iframe);

	windowPointerEvents(true);
}

function drawWindows() {
	//start by sorting windows by their z
	for (i = windows.length-1; i > -1; i--) {
		drawWindow(i);
	}
	if (active != undefined && active != -1) {
		drawWindow(active);
	}
}

function drawWindow(i) {
	//context.fillStyle = "#999";
	//context.fillRect(windows[i].x,windows[i].y,windows[i].sx*tileScale,windows[i].sy*tileScale);
	
	
	//tl
	context.drawImage(spritesheet,textureMap["tl"][0],textureMap["tl"][1],textureMap["tl"][2],textureMap["tl"][3],windows[i].x,windows[i].y-tileScale,tileScale,tileScale);
	
	//l+r
	for (piy = 0; piy < (windows[i].sy * tileScale) - tileScale; piy+=tileScale) {
		for (pix = 0; pix < (windows[i].sx * tileScale)+1; pix+=(windows[i].sx * tileScale)) {
			if (pix == 0) {
				context.drawImage(spritesheet,textureMap["l"][0],textureMap["l"][1],textureMap["l"][2],textureMap["l"][3],windows[i].x,windows[i].y+piy,tileScale,tileScale);
			} else {
				context.drawImage(spritesheet,textureMap["r"][0],textureMap["r"][1],textureMap["r"][2],textureMap["r"][3],windows[i].x+pix-tileScale,windows[i].y+piy,tileScale,tileScale);
			}
		}
	}
	pix = (windows[i].sx * tileScale);
	
	//tr
	context.drawImage(spritesheet,textureMap["tr"][0],textureMap["tr"][1],textureMap["tr"][2],textureMap["tr"][3],windows[i].x+pix-tileScale,windows[i].y-tileScale,tileScale,tileScale);
	
	//bl
	context.drawImage(spritesheet,textureMap["bl"][0],textureMap["bl"][1],textureMap["bl"][2],textureMap["bl"][3],windows[i].x,windows[i].y+piy,tileScale,tileScale);		
	
	//br
	context.drawImage(spritesheet,textureMap["br"][0],textureMap["br"][1],textureMap["br"][2],textureMap["br"][3],windows[i].x+pix-tileScale,windows[i].y+piy,tileScale,tileScale);
	
	//b+t
	for (pix = tileScale; pix < (windows[i].sx * tileScale) - tileScale; pix+=tileScale) {
		for (piy = 0; piy < (windows[i].sy * tileScale)+1; piy+=(windows[i].sy * tileScale)) {
			if (piy == 0) {			
				context.drawImage(spritesheet,textureMap["t"][0],textureMap["t"][1],textureMap["t"][2],textureMap["t"][3],windows[i].x+pix,windows[i].y+piy-tileScale,tileScale,tileScale);
			} else {
				context.drawImage(spritesheet,textureMap["b"][0],textureMap["b"][1],textureMap["b"][2],textureMap["b"][3],windows[i].x+pix,windows[i].y+piy-tileScale,tileScale,tileScale);
			}
		}
	}
	
	//title
	context.globalAlpha = 0.4;
	context.textAlign = "left";
	context.fillStyle = "#fff";
	context.font = "24px font";
	context.fillText(windows[i].program,windows[i].x+35,windows[i].y-7);
	context.fillText(windows[i].program+" "+windows[i].id,windows[i].x+35,windows[i].y-7);
	context.globalAlpha = 1;
	
	
	//Seeded Random colored rect for bg of windows based on their id
	Math.seed = windows[i].id * 1000;
	context.fillStyle = "#"+Math.seededRandom(2,9)+""+Math.seededRandom(2,9)+""+Math.seededRandom(2,9)+"";
	context.fillRect(windows[i].x+(tileScale/8),windows[i].y,windows[i].sx*tileScale-(tileScale/4),windows[i].sy*tileScale-(tileScale/8));
		
		
	if (!windows[i].active) {
		//draw screenshot for inactive windows
		try {
			context.drawImage(windows[i].image,windows[i].x+(tileScale/8),windows[i].y,windows[i].sx*tileScale-(tileScale/4),windows[i].sy*tileScale-(tileScale/8));
		} catch (e) {}
	}
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


//Main Program Loop
setInterval(function() {
	context.clearRect(0,0,canvas.width,canvas.height);
	context.imageSmoothingEnabled = false;

	mainLoop();
//1000/fps
},1000/60);


function tickWindows() {
	for (wi = windows.length-1; wi > -1; wi--) {		
		windows[wi].iframe.style.top = windows[wi].y+"px";
		windows[wi].iframe.style.left = (windows[wi].x+(tileScale/8))+"px";
		if (!windows[wi].initiated) {
			try {
				windows[wi].iframe.contentWindow.postMessage({type:"init",id:windows[wi].id}, '*'); 
			} catch (e) {
				console.log(e);
			}
		} else {
			if (windows[wi].active) {
				try {
					windows[wi].iframe.contentWindow.postMessage({type:"tick"}, '*'); 
				} catch (e) {
					console.log(e);
				}
			}
		}
	}
}


function mainLoop() {
	tickWindows();
	drawWindows();
	globalTimer++;
	
	//Generating start windows
	if (tempVar > 0) {
		if (tempVar % 1 == 0) {
			if (tempVar == 4) {
				createWindow(100+((5-tempVar)*100),50+((5-tempVar)*50),8-(5-tempVar),Math.round(7-(5-tempVar)/0.75),false,false,"terminal");
			} else {
				if (tempVar != 1) {
					createWindow(100+((5-tempVar)*100),50+((5-tempVar)*50),8-(5-tempVar),Math.round(7-(5-tempVar)/0.75),false,false,"demo");
				} else {
					createWindow(100+((5-tempVar)*100),50+((3-tempVar)*50),8-(3-tempVar),Math.round(7-(3-tempVar)/0.75),false,false,"demoError");
				}
			}
		}
		tempVar-=0.25;
	}
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
		if (mouseCollide(windows[i].x,windows[i].y-tileScale/2,windows[i].sx * tileScale,tileScale/2)) {
			return i;
		}
	}
	return -1;
}

function hoverWindow() {
	//if hover on active, don't click through
	if (mouseCollide(windows[active].x,windows[active].y,windows[active].sx * tileScale,windows[active].sy * tileScale)) {
		return true;
	}
	for (i = 0; i < windows.length; i++) {
		if (active != i) {
			if (mouseCollide(windows[i].x,windows[i].y,windows[i].sx * tileScale,windows[i].sy * tileScale)) {
				setActiveWindow(i);
				return true;
			}
		}
	}
	return false;
}

function setActiveWindow(index) {
	active = index;
	for (i = windows.length-1; i > -1; i--) {
		if (i != index) {
			windows[i].iframe.style.pointerEvents = "none";
			windows[i].iframe.style.display = "none";
			windows[i].active = false;
			
			//Request Image
			windows[i].iframe.contentWindow.postMessage({type:"image"}, '*'); 
		} else {
			windows[i].iframe.style.pointerEvents = "auto";
			windows[i].iframe.style.display = "block";
			windows[i].active = true;
		}
	}
}

function windowPointerEvents(mode) {
	for (i = windows.length-1; i > -1; i--) {
		windows[i].iframe.style.pointerEvents = (mode) ? "auto" : "none";
	}
}

//Recive data from windows
window.addEventListener('message', function(event) { 
	if (event.data.type == "image") {
		windowIndex = getWindowIndexByID(event.data.id);
		
		windows[windowIndex].image = new Image();
		windows[windowIndex].image.src = event.data.data;
	}
	if (event.data.type == "init") {
		windows[getWindowIndexByID(event.data.data)].initiated = true;
	}
	if (event.data.type == "terminal") {
		if (windows[getWindowIndexByID(event.data.id)].program == "terminal") {
			if (event.data.request == "new") {
				createWindow(100,50,8,7,false,false,event.data.data);
				windows[getWindowIndexByID(event.data.id)].iframe.contentWindow.postMessage({type:"history",data:"   started program "+event.data.data}, '*'); 
			}
		}
	}
}); 

//Mouse Input

//idea (turn canvas into image, hide canvas while held and then draw it again when placed? damn it the window has to stay there...)
//only allow one window active at a time, the rest are images? not bad, would prevent lag

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
		
		held = hoverHeld();
		if (held != -1) {
			setActiveWindow(held);
			windowPointerEvents(false);
			return;
		}
		
		hoverWindow();
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