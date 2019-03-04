const App = {
    //
    // CONFIG
    //
    models: "maps/",
    libs: [
        "js/modules/loaders/GLTFLoader.js",
        "js/modules/controls/OrbitControls.js"
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
                        
            // Init controls
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.camera.position.set(0, 2, 15);
            this.controls.update();
            
            // Init loader
            this.loader = new THREE.GLTFLoader();
            
            this.loadModel("sspbrno");
        });
        
        $(document).on("ZIOM-modelReady", () => {
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
    
        $(window).resize(() => {
            canvas.width = $(window).width();
            canvas.height = $(window).height();
            
            renderer.setSize(canvas.width, canvas.height);
            labelRenderer.setSize(canvas.width, canvas.height);
            
            camera.aspect = canvas.width / canvas.height;
            camera.updateProjectionMatrix();
        });
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
        
        //this.controls.update();
        
        this.renderer.render(this.scene, this.camera);
    },
    
}

$(window).on("load", () => {
    App.init();
});
