/* Project Browser Based on Windows Like Desktop Design */

//give new windows those random colors if their content hasn't been loaded yet (no canvas screenshot)
//save all window position and data between sessions

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

function createWindow(x,y,z,sx,sy,mx,mn,program) {
	windows.push({
		x:x,
		y:y,
		z:z,
		sx:sx,
		sy:sy,
		mx:mx,
		mn:mn,
		id:Math.random(),
		program:program,
		canvas:document.createElement("canvas"),
		script:document.createElement("script"),
		initiated:false,
		active:false,
	});
	
	windows[windows.length-1].script.addEventListener("onload",this.init);
	windows[windows.length-1].script.src = "programs/"+program+".js";
	windows[windows.length-1].canvas.style = "top:"+(y)+"px;left:"+(x+(tileScale/8))+"px;position: fixed;background-color: rgba(255,230,255)";
	windows[windows.length-1].script.setAttribute("id",windows[windows.length-1].id+"");
	windows[windows.length-1].canvas.setAttribute("id",windows[windows.length-1].id+"");
	scaleCanvas(windows[windows.length-1].canvas,sx*tileScale,sy*tileScale);
	
	document.body.appendChild(windows[windows.length-1].canvas);
	document.body.appendChild(windows[windows.length-1].script);
	
	setActiveWindow(windows.length-1);
	windowPointerEvents(true);
	
}

createWindow(100,100,0,8,5,false,false,"demo");
createWindow(200,150,0,5,7,false,false,"demo");
createWindow(300,200,0,8,5,false,false,"demo");
createWindow(700,500,0,2,1,false,false,"demo");
createWindow(900,500,0,2,2,false,false,"demo");

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
	

	if (!windows[i].active) {
		//draw random colored rect for unpictured inactive windows
		Math.seed = windows[i].id * 1000;
		context.fillStyle = "#"+Math.seededRandom(2,9)+""+Math.seededRandom(2,9)+""+Math.seededRandom(2,9)+"";
		context.fillRect(windows[i].x+(tileScale/8),windows[i].y,windows[i].sx*tileScale-(tileScale/4),windows[i].sy*tileScale-(tileScale/8));
		
		//draw screenshot for inactive windows
		context.drawImage(windows[i].image,windows[i].x+(tileScale/8),windows[i].y,windows[i].sx*tileScale-(tileScale/4),windows[i].sy*tileScale-(tileScale/8));
		
		
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
	for (i = windows.length-1; i > -1; i--) {
		windows[i].canvas.style.top = windows[i].y+"px";
		windows[i].canvas.style.left = (windows[i].x+(tileScale/8))+"px";
		if (!windows[i].initiated) {
			windows[i].init();
			windows[i].initiated = true;
		}
		if (windows[i].active) {
			windows[i].tick();
		}
	}
}


function mainLoop() {
	tickWindows();
	drawWindows();
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
		if (mouseCollide(windows[i].x,windows[i].y-tileScale,windows[i].sx * tileScale,tileScale)) {
			return i;
		}
	}
	return -1;
}

function hoverWindow() {
	//if hover on active, don't click through
	if (mouseCollide(windows[active].x,windows[active].y,windows[active].sx * tileScale,windows[active].sy * tileScale)) {
		return;
	}
	for (i = 0; i < windows.length; i++) {
		if (active != i) {
			if (mouseCollide(windows[i].x,windows[i].y,windows[i].sx * tileScale,windows[active].sy * tileScale)) {
				setActiveWindow(i);
				return;
			}
		}
	}
}

//take original js file as input and dynamically turn it into a program.js (replace canvas and context with relative, etc)

function setActiveWindow(index) {
	active = index;
	for (i = windows.length-1; i > -1; i--) {
		if (i != index) {
			windows[i].canvas.style.pointerEvents = "none";
			windows[i].canvas.style.display = "none";
			windows[i].active = false;
			windows[i].image = new Image();
			windows[i].image.src = windows[i].canvas.toDataURL('png');
		} else {
			windows[i].canvas.style.pointerEvents = "auto";
			windows[i].canvas.style.display = "block";
			windows[i].active = true;
		}
	}
}

function windowPointerEvents(mode) {
	for (i = windows.length-1; i > -1; i--) {
		windows[i].canvas.style.pointerEvents = (mode) ? "auto" : "none";
	}
}

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