const Model = {
    path: "",
    config: null,
    waypoints: [],
    tags: [],
    
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
        App.loader.load(this.path+"/model.min.glb", ((gltf) => {            
            gltf.scene.traverse((obj) => {
                if(!obj.isMesh) return;
            
                obj.material = new THREE.MeshLambertMaterial({
                    //side: THREE.DoubleSide,
                });
                
                if(obj.name === "Ground"){
                    obj.material.color.set(0xe8e8e8);
                    
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
                obj.geometry.computeBoundingBox();               
                let size = new THREE.Vector3(); 
                obj.geometry.boundingBox.getSize(size);
                let radius = size.x;
             
                let tagDiv = $("<div></div>").width(0).height(0).append($("<div></div>")
	                .addClass('label')
	                .addClass('trn')
	                .text(this.config.waypoints[obj.name].name)
	                .attr("data-trn", this.config.waypoints[obj.name].name)
	                .css("border-color", this.config.waypoints[obj.name].color)
                ).get(0);
	            let tag = new THREE.CSS2DObject( tagDiv );
	            tag.name = "label";
	            tag.position.set( 0, 0, 0 );
	            obj.add( tag );
	            this.tags.push(tag);

	            App.overLayer.scene.add(obj);
            });
            
            $(document).trigger("ZIOM-modelReady");
        }).bind(this));
    },
}
