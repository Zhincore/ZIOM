const App = {
    //
    // CONFIG
    //
    bgColor: new THREE.Color(0xeaeaea),
    models: "maps/",
    libs: [
        "js/modules/libs/stats.min.js",
        "js/modules/loaders/GLTFLoader.js",
        "js/modules/controls/OrbitControls.modified.js",
        "js/modules/shaders/SSAOShader.js",

        "js/modules/postprocessing/EffectComposer.js",
        "js/modules/postprocessing/ShaderPass.js",
        "js/modules/postprocessing/SSAOPass.js",
        "js/modules/postprocessing/RenderPass.js",
        "js/modules/shaders/CopyShader.js",
        "js/modules/SimplexNoise.js",
        
        "js/modules/renderers/Projector.js",
        "js/modules/renderers/CSS2DRenderer.js",
    ],
    
    menuTemplate: "<li><button class='menu-item trn nav-item' style='border-color: $3$aa' data-name='$1$' data-trn='$2$'>waypoint</button></li>",
    
    //
    // VARIABLES
    //
    canvas: document.getElementById("canvas"),
    gl: this.canvas.getContext("webgl"),
    
    scene: null, 
    camera: null,
    controls: null,
    render: null,
    projector: null,
    ssaoPass: null,
    effectComposer: null,
    overLayer: null,
    labelRenderer: null,
    loader: null,
    loadedLibs: [],
    model: null,
    
    mouse: {
        x: 0,
        y: 0
    },
    cameraTarget: new THREE.Vector3(),
    cameraLock: null,
    INTERSECTED: null,
    animationID: null,
    
    //
    // INIT
    //
    init: function(){
        // Only continue if WebGL is available and working
        if (this.gl === null) {
            throw "Unable to initialize WebGL. Your browser or machine may not support it.";
        }

        // Load libs
        //this.loadLibs();
        $(document).trigger("ZIOM-initialized");
    
        $(document).one("ZIOM-libsReady", () => {
            // Init scene
            this.scene = new THREE.Scene();
            this.scene.background = this.bgColor;


            // Init renderer
            this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas, context: this.gl});
            this.renderer.setSize(window.innerWidth, window.innerHeight);
			
			
			// Init stats
			this.stats = new Stats();
            this.stats.showPanel( 0 );
            $("#stats").append( this.stats.dom );
			
			
			// Init default camera
            this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.3, 75);
               
            // Prepare layers    
            this.overLayer = new Layer( this.camera );
            this.overLayer.scene.add( new THREE.AmbientLight( 0xFFFFFF ) );
            
            
            // Init 2D renderer
	        this.labelRenderer = new THREE.CSS2DRenderer();
	        this.labelRenderer.setSize( window.innerWidth, window.innerHeight );
	        this.labelRenderer.domElement.style.position = 'absolute';
	        this.labelRenderer.domElement.style.top = 0;
	        this.labelRenderer.domElement.style.left = 0;
	        this.labelRenderer.domElement.id = "labelContainer";
	        $("#overlay").append( this.labelRenderer.domElement );
            
               
            // Init controls
            this.controls = new THREE.OrbitControls(this.camera, this.canvas);
            this.controls.maxPolarAngle = Math.PI / 2;
            //this.controls.enableDamping = true;
            //this.controls.dampingFactor = 1.5;
            this.controls.screenSpacePanning = true;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 50;
            this.controls.enableKeys = false;
            this.controls.autoRotate = false;
            
            this.camera.position.set(0, 2, 15);
            this.controls.update();
            this.controls.saveState();
            
            // init object to perform world/screen calculations
            this.projector = new THREE.Projector();
            
            
            // Init loader
            this.loader = new THREE.GLTFLoader();
            
            this.registerListeners();
            //this.loadModel("sspbrno");
        });
        
        $(document).one("ZIOM-modelReady", () => {
            this.prepareMenus();
            this.labelRenderer.render(this.overLayer.scene, this.camera);
            $(this.labelRenderer.domElement).find(".trn").translate();
        
            this.scene.add( new THREE.DirectionalLight() );
			this.scene.add( new THREE.HemisphereLight(0.5) );
        
            // Add postprocessing
            this.composer = new THREE.EffectComposer( this.renderer );
            
            if(!$.browser.mobile){
                this.ssaoPass = new THREE.SSAOPass( this.scene, this.camera, window.innerWidth, window.innerHeight );
			    this.ssaoPass.kernelRadius = 0.5;
			    this.ssaoPass.minDistance = 0.001;
			    this.ssaoPass.maxDistance = 0.016;
			    this.ssaoPass.renderToScreen = true;

			    this.composer.addPass( this.ssaoPass );
			}
			
            this.composer.addPass( this.overLayer.renderPass );
            
            this.animate();
        });
        
    },
    
    //
    loadLibs: function(){
        let lib = this.libs.shift();
        $.getScript(lib, () => {
            this.loadedLibs.push(lib);
            $(document).trigger("ZIOM-libLoaded", [[lib, this.loadedLibs.length, this.libs.length]]);
            
            if(this.libs.length === 0){
                // Exit loading loop
                $(document).trigger("ZIOM-libsReady");
            }else{
                // Continue loading loop
                this.loadLibs().bind(this);
            }
        });
        
    },
    
    //
    registerListeners: function(){       
        $(window).resize((this.onResize).bind(this)); 
        $(document).mousemove((this.onMouseMove).bind(this));
        $(document).on("draglessClick", (this.onDraglessClick).bind(this));
        
        this.renderer.context.canvas.addEventListener("webglcontextlost", function(event) {
            event.preventDefault();
            contextLost();
            // animationID would have been set by your call to requestAnimationFrame
            cancelAnimationFrame(this.animationID); 
        }, false);

        this.renderer.context.canvas.addEventListener("webglcontextrestored", function(event) {
            contextRestored();
        }, false); 
    },
    
    //
    prepareMenus: function(){
        $("#nav .menu").append($.parseHTML(config2menu(configSort(this.model.config.waypoints))));
        $("#nav .trn").translate();
        
        $(".nav-item").click((ev) => {
            let target = $(ev.target).attr("data-name");
            
            if(target == "reset"){
                 this.lockCamera();
                
            }else if(target){
                this.lockCamera(this.overLayer.scene.getObjectByName(target));
                
            }
            return false;
        });

    },
    
    //
    // LOADER
    //
    loadModel: function(mName){
        const path = this.models+mName;
        $.getScript(path+"/start.js", () => {
            this.model = Model;
            this.model.init(path);
        });
    },
        
    //
    // EVENTS
    //
    onResize: function(){
        var width = window.innerWidth;
	    var height = window.innerHeight;
	    this.camera.aspect = width / height;
	    this.camera.updateProjectionMatrix();
	    this.renderer.setSize( width, height );
	    this.labelRenderer.setSize( width, height );
	    this.ssaoPass.setSize( width, height );
    },
    
    //
    onMouseMove: function(event){
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    },
    
    onDraglessClick: function(event){
        if(this.INTERSECTED){
            this.lockCamera(this.INTERSECTED);
        }else if(this.cameraLock){
            this.lockCamera();
        }
    },
    
    
    //
    // RENDER
    //
    animate: function(){
        this.animationID = requestAnimationFrame(this.animate.bind(this));
        this.stats.begin();
        this.render();
        this.update();
        this.stats.end();
    },
    
    update: function(){
        let vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 1);
        vector.unproject(this.camera);
        let ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

        // create an array containing all objects in the scene with which the ray intersects
        let intersects = ray.intersectObjects(this.overLayer.scene.children);

        // INTERSECTED = the object in the scene currently closest to the camera 
        //		and intersected by the Ray projected from the mouse position 	

        // if there is one (or more) intersections
        if (intersects.length > 0) {
            // if the closest object intersected is not the currently stored intersection object
            if (intersects[0].object != this.INTERSECTED) {
                // restore previous intersection object (if it exists) to its original color
                if (this.INTERSECTED && this.INTERSECTED != this.cameraLock){
                    this.highlightObj(this.INTERSECTED);
                }
                
                if(intersects[0].object.name.startsWith("waypoint") && intersects[0].object != this.cameraLock){
                    // store reference to closest object as current intersection object
                    this.INTERSECTED = intersects[0].object;
                    this.highlightObj(this.INTERSECTED, 5);
                }
            }
        } else { // there are no intersections
            // restore previous intersection object (if it exists) to its original color
            if (this.INTERSECTED && this.INTERSECTED !== this.cameraLock){
                this.highlightObj(this.INTERSECTED);
            }
            // remove previous intersection object reference
            //     by setting current intersection object to "nothing"
            this.INTERSECTED = null;
        }
        
        // Hide tags
        var frustum = new THREE.Frustum();
        frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));  

        this.model.tags.forEach((tag) => {
            var tagPos = new THREE.Vector3();
            tag.getWorldPosition(tagPos);
            if(frustum.containsPoint(tagPos)) {
                tag.element.style.visibility = "visible";
            }else{
                tag.element.style.visibility = "hidden";
            }
        });
        
        if(!this.model.box.containsPoint(this.controls.target)){
            this.model.box.clampPoint(this.controls.target, this.controls.target);
            this.controls.update();
            
        }else if(this.controls.autoRotate){
            this.controls.update();
        }
    },
    
    render: function(){        
        this.renderer.render(this.scene, this.camera);
        
        this.composer.render();
        
        this.labelRenderer.render(this.overLayer.scene, this.camera);
    },
    
    //
    // FUNCTIONS
    //
    lockCamera: function(obj){
        let update = false;
        let zoom = {value: 0, to: null};
        let vector = new THREE.Vector3(0, 0, 0);
        let reset = false;
        
        $(this.controls.target).finish();
        
        if(obj !== undefined && obj){
            if(this.cameraLock == obj){
                return;
            }
            if(this.cameraLock){
                this.highlightObj(this.cameraLock);
            }
            obj.getWorldPosition(vector);
            //this.controls.resetZoom();
            //this.controls.dIn(5);
            zoom.to = 5;
            this.cameraLock = obj;
            this.highlightObj(obj, 7);
            
            update = true;

        }else if(obj === undefined){
            if(this.cameraLock){
                this.highlightObj(this.cameraLock);

                this.cameraLock = undefined;
            }
            reset = true;
            update = true;

        }        
        
        if(update){
            // Animate target position
            $(this.controls.target).animate({
                x: vector.x,
                y: vector.y,
                z: vector.z
            }, {step: (now) => {
                this.controls.update();
            } });
            
            // Animate camera position
            if(reset){
                  $(this.controls.object.position).animate({
                    x: this.controls.position0.x,
                    y: this.controls.position0.y,
                    z: this.controls.position0.z
                }, {step: (now) => {
                    this.controls.update();
                } });  
            }
            
            //Animate zoom
            if(zoom.to){
                $(zoom).animate({
                    value: 1
                }, {step: (now) => {
                    if(zoom.to > 0){
                        this.controls.dIn(1/Math.abs(zoom.to)*now+1);
                    }else{
                        this.controls.dOut(1/Math.abs(zoom.to)*now+1);
                    }
                } });
            }
        }
        
    },
    highlightObj: function(obj, highlight){
        if(!highlight && obj.origOpacity){
            obj.material.opacity = obj.origOpacity;
            obj.origOpacity = undefined;
            
        }else{
            if(!obj.origOpacity){
                // store color of closest object (for later restoration)
                obj.origOpacity = obj.material.opacity;
            }
            // set a new color for closest object
            obj.material.opacity = highlight * 0.1;
        }
    }
    
}

//
// LAYER
//
class Layer {
	
	constructor( camera ) {
    
		this.scene = new THREE.Scene();
		
		this.renderPass = new THREE.RenderPass( this.scene, camera );
		this.renderPass.clear = false;
		this.renderPass.clearDepth = true;
		this.renderPass.renderToScreen = true;
	}
}

//
// FUNCTIONS
//
function config2menu(object){
    let output = "";
    
    for (let key in object) {
        // skip loop if the property is from prototype
        if (!object.hasOwnProperty(key)) continue;
        
        let obj = object[key];
        let template = App.menuTemplate;
        
        output += template.replace("$1$", key).replace("$2$", obj.name).replace("$3$", obj.color);
    }
    
    return output;
}

function configCompare(a,b) {
  if (a[1].name < b[1].name)
    return -1;
  if (a[1].name > b[1].name)
    return 1;
  return 0;
}

function configSort(object){
    let sortable = [];
    let sorted = {};
    
    for (let key in object) {
        sortable.push([key, object[key]]);
    }
    
    sortable.sort(configCompare);
    
    sortable.forEach((el) => {
        sorted[el[0]] = el[1];
    });
    
    return sorted;
}


