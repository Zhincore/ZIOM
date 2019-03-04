const App = {
    //
    // CONFIG
    //
    models: "maps/",
    libs: [
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
    loader: null,
    loadedLibs: [],
    
    
    //
    // INIT
    //
    init: function(){
        // Only continue if WebGL is available and working
        if (this.gl === null) {
            throw "Unable to initialize WebGL. Your browser or machine may not support it.";
        }

        // Load libs
        this.loadLibs();
    
        $(document).on("ZIOM-libsReady", () => {
            // Init scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xeaeaea);
            
            
            // Init default camera
            this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.3, 100);


            // Init renderer
            this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas, context: this.gl});
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.gammaInput = true;
			this.renderer.gammaOutput = true;
			this.renderer.shadowMapEnabled = true;
                
                        
            // Init controls
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.maxPolarAngle = Math.PI / 2;
            this.camera.position.set(0, 2, 15);
            this.controls.update();
            
            
            // Init loader
            this.loader = new THREE.GLTFLoader();
            
            this.loadModel("sspbrno");
        });
        
        $(document).on("ZIOM-modelReady", () => {
            // Add postprocessing
            this.ssaoPass = new THREE.SSAOPass( this.scene, this.camera, window.innerWidth, window.innerHeight );
			this.ssaoPass.kernelRadius = 16;
			this.ssaoPass.minDistance = 0.005;
			this.ssaoPass.maxDistance = 0.1;
			this.ssaoPass.renderToScreen = true;
			
			this.effectComposer = new THREE.EffectComposer( this.renderer );
			this.effectComposer.addPass( this.ssaoPass )
            
            this.render();
        });
        
    },
    
    //
    loadLibs: function(){
        this.libs.forEach((lib) => {
            $.getScript(lib, () => {
                console.log("Loaded "+lib);
                this.loadedLibs.push(lib);
                
                if(this.libs.length === this.loadedLibs.length){
                    // Start the loop
                    $(document).trigger("ZIOM-libsReady");
                }
            });
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
            Model.init(path);
        });
    },
    
    //
    // RENDER
    //
    render: function(){
        requestAnimationFrame(this.render.bind(this));

        this.effectComposer.render();
        //this.controls.update();
        
        this.renderer.render(this.scene, this.camera);
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


$(window).on("load", () => {
    App.init();
});
