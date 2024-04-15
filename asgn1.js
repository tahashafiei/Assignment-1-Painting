// asgn1.js
// Taha Shafiei

var VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    //gl_PointSize = 10.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program              
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global Variables
let canvas;
let gl;

let a_Position;

let u_FragColor;
let u_Size;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSeg = 1;

var g_shapesList = [];


function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // Get the storage location of u_Size
    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }
}

// Set up actions for the HTML UI elements
function addActionsForHtmlUI(){
    
    // Button Events (Shape Type)
    document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
    document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };

    document.getElementById('clearButton').onclick = function() { g_shapesList = []; renderAllShapes(); };

    document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
    document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
    document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};

    document.getElementById('redCrown').onclick = function() {renderRedCrown(); };

    //Slider Events
    document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100; });
    document.getElementById('satSlide').addEventListener('mouseup', function() {g_selectedColor[3] = this.value/100; });

    // Size Slider Events
    document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value; });
    
    // Segment Slider Events
    document.getElementById('segSlide').addEventListener('mouseup', function() {g_selectedSeg = this.value; });

}

function main() {

    // Set up canvas and gl variables
    setupWebGL();

    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    // Set up actions for the HTML UI elements
    addActionsForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev)} };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function click(ev) {
    // Extract the event click and return it in WebGL coordinates
    let [x, y] = convertCoordinatesEventToGL(ev);

    let point;

    if (g_selectedType == POINT) {
        point = new Point();
    } else if (g_selectedType == TRIANGLE) {
        point = new Triangle();
    } else {
        point = new Circle();
    }

    point.position = [x, y];
    point.color=g_selectedColor.slice();
    point.size=g_selectedSize;

    if (g_selectedType == CIRCLE) {
        point.segments = g_selectedSeg;
    }

    g_shapesList.push(point);

    // Draw every shape that is supposed to be in the canvas
    renderAllShapes();
}

// Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  
    return([x, y]);
}

// Draw every shape that is supposed to be in the canvas 
function renderAllShapes() {

    // Check the time at the start of this function
    var startTime = performance.now();

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw each shape on the list
    var len = g_shapesList.length;

    for(var i = 0; i < len; i++) {
        g_shapesList[i].render();
    } 

    // Check the time at the end of the function, and show on web page
    var duration = performance.now() - startTime;
    sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "numdot");
}

// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

// Draw the red crown
function renderRedCrown() {
    let point;
    let [x, y] = [0, 0];
    let [xEye, yEye] = [0.25 / 2, 0.25 * (2/3)];
    let s = 40;
    var d = s / 200;
    var dEye = d * (2/3);

    // Base Crown
    var lcoor = [[x + d*0, y + d*0], [x + d*0, y + d*1], [x + d*0, y + d*2], 
                 [x + d*0.5, y + d*0.5], [x + d*0.5, y + d*1.5],
                 [x + d*1, y + d*0], [x + d*1, y + d*1],
                 [x + d*1.5, y + d*0.5], [x + d*1.5, y + d*1.5]];

    var rcoor = [[x + d*0.5, y + d*1.5], [x + d*0.5, y + d*2.5], 
                 [x + d*1, y + d*1], [x + d*1, y + d*2],
                 [x + d*1.5, y + d*1.5], [x + d*1.5, y + d*2.5],
                 [x + d*2, y + d*1], [x + d*2, y + d*2], [x + d*2, y + d*3]];

    var tcoor = [[x + d*0, y + d*0], [x + d*1, y + d*0]];
        
    // Eye base
    var tcoorEye = [[xEye + dEye*0, yEye + dEye*0.5], [xEye + dEye*0.5, yEye + dEye*1], [xEye - dEye*0.5, yEye + dEye*1]];
    var bcoorEye = [[xEye + dEye*1, yEye + dEye*1.5], [xEye + dEye*0.5, yEye + dEye*1], [xEye + dEye*1.5, yEye + dEye*1]];
    var lcoorEye = [[xEye + dEye*0.5, yEye + dEye*0.5]];
    var rcoorEye = [[xEye + dEye*0.5, yEye + dEye*1.5]];

    // adding triangles with tip to the left
    for (var i = 0; i < lcoor.length; i ++) {
        point = new TriangleVar();
        point.position = lcoor[i];
        point.color=[1.0, 1.0, 1.0, 1.0];
        point.size = s;
        point.type = 0;
        g_shapesList.push(point);

    }

    // adding triangles with tip to the right
    for (var i = 0; i < rcoor.length; i ++) {
        point = new TriangleVar();
        point.position = rcoor[i];
        point.color=[1.0, 1.0, 1.0, 1.0];
        point.size = s;
        point.type = 1;
        g_shapesList.push(point);

    }

    // adding triangles with tip to the top
    for (var i = 0; i < tcoor.length; i ++) {
        point = new TriangleVar();
        point.position = tcoor[i];
        point.color=[1.0, 1.0, 1.0, 1.0];
        point.size = s;
        point.type = 2;
        g_shapesList.push(point);

    }

    // Adding eye
    // adding triangles with tip to the top
    for (var i = 0; i < tcoorEye.length; i ++) {
        point = new TriangleVar();
        point.position = tcoorEye[i];
        point.color=[1.0, 0.0, 0.0, 1.0];
        point.size = s * (2/3);
        point.type = 2;
        g_shapesList.push(point);

    }
    
    // adding triangles with tip to the bottom
    for (var i = 0; i < bcoorEye.length; i ++) {
        point = new TriangleVar();
        point.position = bcoorEye[i];
        point.color=[1.0, 0.0, 0.0, 1.0];
        point.size = s * (2/3);
        point.type = 3;
        g_shapesList.push(point);

    }

    // adding triangles with tip to the left
    for (var i = 0; i < lcoorEye.length; i ++) {
        point = new TriangleVar();
        point.position = lcoorEye[i];
        point.color=[0.0, 0.0, 0.0, 1.0];
        point.size = s * (2/3);
        point.type = 0;
        g_shapesList.push(point);

    }

    // adding triangles with tip to the right
    for (var i = 0; i < rcoorEye.length; i ++) {
        point = new TriangleVar();
        point.position = rcoorEye[i];
        point.color=[0.0, 0.0, 0.0, 1.0];
        point.size = s * (2/3);
        point.type = 1;
        g_shapesList.push(point);

    }

    renderAllShapes();
}