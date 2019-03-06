const App = {
    //
    // CONFIG
    //
    models: "maps/",
    libs: [
        "js/modules/libs/stats.min.js",
        "js/modules/loaders/GLTFLoader.js",
        "js/modules/controls/OrbitControls.js",
        "js/modules/shaders/SSAOShader.js",

        "js/modules/postprocessing/EffectComposer.js",
        "js/modules/postprocessing/ShaderPass.js",
        "js/modules/postprocessing/SSAOPass.js",
        "js/modules/postprocessing/RenderPass.js",
        "js/modules/shaders/CopyShader.js",
        "js/modules/SimplexNoise.js",
        
    ],
    
    //
    // VARIABLES
    //
    canvas: document.getElementById("canvas"),
    gl: this.canvas.getContext("webgl"),
    
    scene: null, 
    camera: null,
    controls: null,
    render: null,
    ssaoPass: null,
    effectComposer: null,
    overLayer: null,
    loader: null,
    loadedLibs: [],
    model: null,
    
    
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
            this.scene.background = new THREE.Color(0xeaeaea);


            // Init renderer
            this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas, context: this.gl});
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.gammaInput = true;
			this.renderer.gammaOutput = true;
			this.renderer.shadowMap.enabled = true;
			
			
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
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 1.5;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 50;
            
            this.camera.position.set(0, 2, 15);
            this.controls.update();
            
            
            // Init loader
            this.loader = new THREE.GLTFLoader();
            
            //this.loadModel("sspbrno");
        });
        
        $(document).one("ZIOM-modelReady", () => {
            this.scene.add( new THREE.DirectionalLight() );
			  this.scene.add( new THREE.HemisphereLight(0.5) );
        
            // Add postprocessing
            this.ssaoPass = new THREE.SSAOPass( this.scene, this.camera, window.innerWidth, window.innerHeight );
			this.ssaoPass.kernelRadius = 0.5;
			this.ssaoPass.minDistance = 0.001;
			this.ssaoPass.maxDistance = 0.016;
			this.ssaoPass.renderToScreen = true;
			
			this.composer = new THREE.EffectComposer( this.renderer );
			this.composer.addPass( this.ssaoPass );
			
            this.composer.addPass( this.overLayer.renderPass );
            
            this.render();
        });
        
    },
    
    //
    loadLibs: function(){
        let lib = this.libs.shift();
        $.getScript(lib, () => {
            $(document).trigger("ZIOM-libLoaded", [[lib, this.loadedLibs.length, this.libs.length]]);
            this.loadedLibs.push(lib);
            
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
        const canvas = this.canvas;
        const renderer = this.renderer;
        const camera = this.camera;
        
        window.addEventListener( 'resize', onWindowResize, false );
		onWindowResize();
    
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
    // RENDER
    //
    render: function(){
        requestAnimationFrame(this.render.bind(this));
        
        this.stats.begin();
        
        this.controls.update();
        
        
        this.renderer.render(this.scene, this.camera);
        
        this.composer.render();
        
        this.stats.end();
    },
    
}


function onWindowResize() {
	var width = window.innerWidth;
	var height = window.innerHeight;
	App.camera.aspect = width / height;
	App.camera.updateProjectionMatrix();
	App.renderer.setSize( width, height );
	App.ssaoPass.setSize( width, height );
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
