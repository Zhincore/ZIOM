const App = {
    //
    // CONFIG
    //
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
    loader: null,
    loadedLibs: [],
    model: null,
    
    mouse: {
        x: 0,
        y: 0
    },
    cameraLocked: false,
    INTERSECTED: null,
    
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
        this.registerListeners();
        $(document).trigger("ZIOM-initialized");
    
        $(document).one("ZIOM-libsReady", () => {
            // Init scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xeaeaea);


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
            
               
            // Init controls
            this.controls = new THREE.OrbitControls(this.camera);
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
            
            //this.loadModel("sspbrno");
        });
        
        $(document).one("ZIOM-modelReady", () => {
            this.prepareMenus();
        
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
    },
    
    //
    prepareMenus: function(){
        $("#nav .menu").append($.parseHTML(config2menu(configSort(this.model.config.waypoints))));
        $("#nav .trn").translate();
        
        $(".nav-item").click((ev) => {
            let target = $(ev.target).attr("data-name");
            
            if(target == "all"){
                 this.cameraLock();
                
            }else if(target){
                let pos = new THREE.Vector3(0, 0, 0);
                this.overLayer.scene.getObjectByName(target).getWorldPosition(pos);
                this.cameraLock(pos);
                
            }
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
	    this.ssaoPass.setSize( width, height );
    },
    
    //
    onMouseMove: function(event){
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    },
    
    
    //
    // RENDER
    //
    animate: function(){
        requestAnimationFrame(this.animate.bind(this));
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
                if (this.INTERSECTED){
                    this.INTERSECTED.material.opacity = this.INTERSECTED.origOpacity;
                }
                if(intersects[0].object.name.startsWith("waypoint")){
                    // store reference to closest object as current intersection object
                    this.INTERSECTED = intersects[0].object;
                    // store color of closest object (for later restoration)
                    this.INTERSECTED.origOpacity = this.INTERSECTED.material.opacity;
                    // set a new color for closest object
                    this.INTERSECTED.material.opacity = 0.5;
                }
            }
        } else { // there are no intersections
            // restore previous intersection object (if it exists) to its original color
            if (this.INTERSECTED){
                this.INTERSECTED.material.opacity = this.INTERSECTED.origOpacity;
            }
            // remove previous intersection object reference
            //     by setting current intersection object to "nothing"
            this.INTERSECTED = null;
        }

        //this.controls.update();
    },
    
    render: function(){        
        this.renderer.render(this.scene, this.camera);
        
        this.composer.render();
    },
    
    //
    // FUNCTIONS
    //
    cameraLock: function(vector){
        let update = false;
        if(vector !== undefined){
            this.controls.resetZoom();
            this.controls.dIn(5);
            this.cameraLocked = true;
            update = true;
            
        }else if(vector === undefined){
            vector = new THREE.Vector3(0, 0, 0);
            this.controls.reset();
            this.cameraLocked = false;
            update = true;

        }        
        
        if(update){
            this.controls.target = vector;
            this.controls.update();
        }
        
    },
    
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


