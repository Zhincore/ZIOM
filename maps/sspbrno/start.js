const Model = {
    path: "",
    config: null,
    waypoints: [],
    
    init: function(path){
        this.path = path;
        // Load config
        $.getJSON(path+"/config.json", (data) => {
            this.config = data;
            
            // Load translations
            $.getJSON(path+"/translate.json", (data) => {
                Object.assign($.dict, data);
            
                $(document).trigger("ZIOM-modelInit", [this.config.name, this.config.color]);
            });
        });
    },
    
    load: function(){
        App.loader.load(this.path+"/model.glb", ((gltf) => {            
            gltf.scene.traverse((obj) => {
                if(!obj.isMesh) return;
            
                obj.material = new THREE.MeshLambertMaterial({
                    //side: THREE.DoubleSide,
                });
                
                if(obj.name === "Ground"){
                    obj.material.opacity = 0.2;
                    obj.material.transparent = true;
                    
                }else if(obj.name === "Paths"){
                    obj.material.color.set(0xf0f0f0);
                    
                }else if(obj.name.startsWith("waypoint")){
                    obj.material.visible = true;
                    obj.material.color.set(new THREE.Color( this.config.waypoints[obj.name].color ));
                    obj.material.flatShading = true;
                    obj.material.opacity = 0.3;
                    obj.material.transparent = true;
                    
                    this.waypoints.push(obj);
                    
                }else if(obj.name.startsWith("Arrow")){
                    obj.material.color.set(0x00ff00);
                       
                }else{
                    obj.material.opacity = 0.95;
                    obj.material.transparent = true;
                    obj.renderOrder = 0;
                }
                
            });

            App.scene.add(gltf.scene);
            
            this.waypoints.forEach((obj) => {
                App.overLayer.scene.add(obj);
            });
            
            $(document).trigger("ZIOM-modelReady");
        }).bind(this));
    },
}
