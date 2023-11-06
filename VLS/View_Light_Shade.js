var canvas;
var gl;

var numTimesToSubdivide = 3;
 
var index = 0;

var pointsArray = [];
var normalsArray = [];

var near = -10;
var far = 10;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -3.0;
var right = 3.0;
var ytop =3.0;
var bottom = -3.0;

var redSlider = 0.5;
var greenSlider = 0.5;
var blueSlider = 0.5;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);
    
var lx = 0;
var ly = 10;
var lz = 0;
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse;
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var normalmatrix, normalMatrixLoc;

var eye;
var x = 0;
var y = 0;
var z = 0;
var up;

var shadingType = 0;
    
function triangle(a, b, c) {     
     pointsArray.push(a);
     pointsArray.push(b);      
     pointsArray.push(c);
    
     normalsArray.push(a[0],a[1], a[2], 0.0);
     normalsArray.push(b[0],b[1], b[2], 0.0);
     normalsArray.push(c[0],c[1], c[2], 0.0);

     index += 3;     
}

function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
                
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
                
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else { 
        triangle( a, b, c );
    }
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function generateSphere(){
    function triangle(a, b, c) {
        pointsArray.push(a);
        pointsArray.push(b);
        pointsArray.push(c);

        normalsArray.push(a[0], a[1], a[2], 0.0);
        normalsArray.push(b[0], b[1], b[2], 0.0);
        normalsArray.push(c[0], c[1], c[2], 0.0);

        index += 3;
    }

    function divideTriangle(a, b, c, count) {
        if (count > 0) {

            var ab = mix(a, b, 0.5);
            var ac = mix(a, c, 0.5);
            var bc = mix(b, c, 0.5);

            ab = normalize(ab, true);
            ac = normalize(ac, true);
            bc = normalize(bc, true);

            divideTriangle(a, ab, ac, count - 1);
            divideTriangle(ab, b, bc, count - 1);
            divideTriangle(bc, c, ac, count - 1);
            divideTriangle(ab, bc, ac, count - 1);
        }
        else {
            triangle(a, b, c);
        }
    }

    function tetrahedron(a, b, c, d, n) {
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
    }

}

function setupShading() {
    if (shadingType == 0) {
        program = initShaders(gl, "gouraud-vertex-shader", "gouraud-fragment-shader");
    } else {
        program = initShaders(gl, "phong-vertex-shader", "phong-fragment-shader");
    }
    gl.useProgram(program);

    Sphere();

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

}

function Sphere(){

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    ambientProduct = mult(lightAmbient, vec4(redSlider, greenSlider, blueSlider, 1.0));
    diffuseProduct = mult(lightDiffuse, vec4(redSlider, greenSlider, blueSlider, 1.0));
    specularProduct = mult(lightSpecular, vec4(redSlider, greenSlider, blueSlider, 1.0));

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(vec4(lx, ly, lz, 0.0)));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    
    setupShading() ;   
    generateSphere();

    document.getElementById("betaSlider").oninput = function (event) {
        materialShininess = event.srcElement.value;
        Sphere();
    };
    
    document.getElementById("Button1").onclick = function(){
        numTimesToSubdivide++; 
        index = 0;
        pointsArray = [];
        normalsArray = [];
        Sphere(); 
    };
    document.getElementById("Button2").onclick = function(){
        if(numTimesToSubdivide) numTimesToSubdivide--;
        index = 0;
        pointsArray = []; 
        normalsArray = [];
        Sphere();
    };

    document.getElementById("redSlider").oninput = function (event) {
        redSlider = event.srcElement.value;
        Sphere();
    };
    document.getElementById("greenSlider").oninput = function (event) {
        greenSlider = event.srcElement.value;
        Sphere();
    };
    document.getElementById("blueSlider").oninput = function (event) {
        blueSlider = event.srcElement.value;
        Sphere();
    };
    
    document.getElementById("FOVSlider").oninput = function (event) {
        
    };
   
    document.getElementById("xSlider").oninput = function (event) {
        x = event.srcElement.value;
    };

    document.getElementById("ySlider").oninput = function (event) {
        y =event.srcElement.value;
    };

    document.getElementById("zSlider").oninput = function (event) {
        z = event.srcElement.value;
    };

    document.getElementById("lxSlider").oninput = function (event) {
        lx = event.srcElement.value;
        Sphere();
    };

    document.getElementById("lySlider").oninput = function (event) {
        ly = event.srcElement.value;
        Sphere();
    };

    document.getElementById("lzSlider").oninput = function (event) {
        lz = event.srcElement.value;
        Sphere();
    };
	
    document.getElementById("shadingMenu").onchange = function (event) {
        shadingType = event.target.value;
        if (shadingType != 2) {
            setupShading();
            Sphere();
        }
    };

    render();
}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi), 
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    modelViewMatrix = lookAt(eye, vec3(x, y, z), vec3(0.0, 1.0, 0.0));
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
	normalmatrix = normalMatrix(modelViewMatrix, true);
            
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalmatrix) );
        
    if (shadingType == 2)
        gl.drawArrays(gl.LINE_LOOP, 0, pointsArray.length);
    else
        gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
    

    window.requestAnimFrame(render);
}
