const Gui = {
    navTemplate: "<li><button class='menu-item trn nav-item' style='border-color: $3$aa' data-name='$1$' data-trn='$2$'>waypoint</button></li>",
    optTemplate: "<li><div class='menu-item $4$' data-name='$1$' style='border-color: $3$aa'>\
    <input type='checkbox' id='o-$1$' name='$1$' $checked$> <label for='o-$1$' class='trn' data-trn='$2$'>option<label></div></li>",
    
    init: function(){
        $.getJSON("js/app/translation.json", (data) => {
            Object.assign($.dict, data);
            this.prepareMenus(); 
        });
        
    },
    
    prepareMenus: function(){
        $("#nav .menu").append($.parseHTML(config2menu(configSort(App.model.config.waypoints), this.navTemplate)));
        this.prepareOptions();
        $(".trn").translate();
        
        $(".nav-item").click((ev) => {
            let target = $(ev.target).attr("data-name");
            
            if(target == "reset"){
                 App.lockCamera();
                
            }else if(target){
                App.lockCamera(App.overLayer.scene.getObjectByName(target));
                
            }
            return false;
            
        }).hover((ev) => {
            let target = $(ev.target).attr("data-name");
            if((!App.cameraLock || target !== App.cameraLock.name) && target !== "reset"){
                App.highlightObj(App.overLayer.scene.getObjectByName(target), 5);
            }
            
        }, (ev) => {
            let target = $(ev.target).attr("data-name");
            if((!App.cameraLock || target !== App.cameraLock.name) && target !== "reset"){
                App.highlightObj(App.overLayer.scene.getObjectByName(target));
            }
            
        });
        
        $(".dropdown-toggle").click(this.dropdownToggle);

    },
    
    prepareOptions: function(){
        $("#options-form").prepend($.parseHTML(config2menu({
            "labels":{
                "name":"labels",
                "color": "#ff0000"
            },
            "highlight":{
                "name":"highlight",
                "color": "#00ff00"
            },
            "autoRotate":{
                "name":"autoRotate",
                "color": "#0000ff",
                "unchecked": true
            }
        }, this.optTemplate)));
        $("#options-form").prepend($.parseHTML(config2menu(App.model.config.floors, this.optTemplate)));
        
        $("#options-form").on('change input', function() {
            let data = $(this).serializeArray()
                // fix checkboxes 
                .concat(jQuery('input[type=checkbox]:not(:checked)', this).map(
                    function() {
                        return {"name": this.name, "value": false}
                    }).get()
                // process
                ).reduce(function(obj, item) {
                    obj[item.name] = item.value;
                    return obj;
            }, {});
            
            Gui.updateConfig(data);
        }).trigger('change');
        $(".cfloor").hover((ev) => {
            App.highlightFloor(App.scene.getObjectByName($(ev.target).attr("data-name")), true);
        },(ev) => {
            App.highlightFloor(App.scene.getObjectByName($(ev.target).attr("data-name")));
        });
    },
    
    //
    dropdownToggle: function(ev){
        ev.preventDefault();
        let target = $($(ev.target).attr("data-toggle"));

        target.finish().slideToggle("fast");
    },
    
    //
    updateConfig: function(data){
        for(let key in data){
            if (!data.hasOwnProperty(key)) continue;
            
            if(key.startsWith("floor")){
                App.scene.getObjectByName(key).material.visible = data[key];
                
            }else if(key === "labels"){
                if(data[key]){
                    $("#labelContainer").show();
                }else{
                    $("#labelContainer").hide();
                }
                App.scene.getObjectByName("Arrow").material.visible = data[key];
                
            }else if(key === "highlight"){
                App.overLayer.renderPass.enabled = data[key];
                
            }else if(key === "autoRotate"){
                App.controls.autoRotate = data[key];
                
            }else if(key === "metrics"){
                if(data[key]){
                    $("#stats").show();
                }else{
                    $("#stats").hide();
                }
                
            }
        }
    },
}

//
// FUNCTIONS
//
function config2menu(object, template){
    let output = "";
    
    for (let key in object) {
        // skip loop if the property is from prototype
        if (!object.hasOwnProperty(key)) continue;
        
        let obj = object[key];
        let floorclass = key.startsWith("floor") ? "cfloor" : "";
        let checked = obj.unchecked ? "" : "checked";
        //let template = Gui.navTemplate;
        
        output += template.replace("$1$", key).replace("$1$", key).replace("$1$", key).replace("$1$", key).replace("$2$", obj.name).replace("$3$", obj.color).replace("$4$", floorclass).replace("$checked$", checked);
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
