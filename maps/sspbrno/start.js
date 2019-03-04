const Model = {
    material: new THREE.MeshLambertMaterial({
    }),

    path: "",
    
    init: function(path){
        this.path = path;
        
        this.load();
    },
    
    load: function(){
        App.loader.load(this.path+"/model.glb", ((gltf) => {
            gltf.scene.getObjectByName("Map").traverse((obj) => {
                obj.material = this.material;
            });

            App.scene.add(gltf.scene);
            
            App.scene.add( new THREE.DirectionalLight() );
			App.scene.add( new THREE.HemisphereLight(0.1) );
            
            $(document).trigger("ZIOM-modelReady");
        }).bind(this));
    },
}
