const Model = {
    path: "",
    
    init: function(path){
        this.path = path;
        
        this.load();
    },
    
    load: function(){
        App.loader.load(this.path+"/model.glb", function(gltf){
            App.scene.add(gltf.scene);
            
            $(document).trigger("ZIOM-modelReady");
        });
    },
}
