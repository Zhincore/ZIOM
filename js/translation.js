(function ( $ ) {
    $.dict = {
        "reset": {
            "en":"Reset",
            "cs":"Resetovat"
        },
        "display": {
            "en":"Display",
            "cs":"Zobrazení"
        },
        "navigation": {
            "en":"Navigation",
            "cs":"Navigace"
        },
        "labels":{
            "en":"Lables",
            "cs":"Popisky"
        },
        "highlight":{
            "en":"Highlight",
            "cs":"Zvýraznění"
        }
    };
    
    $.lang = window.navigator.language || window.navigator.userLanguage || undefined;
    
    // $(selector).translate(lang)
    $.fn.translate = function(lang) {
        lang = lang || $.lang; 

        switch(lang){
            case "en-US":
                lang = "en";
                break;
        }
    
        this.each((i, el) => {
            el = $(el);
            const trn = el.attr("data-trn");
            
            if(trn in $.dict){
                if(lang in $.dict[trn]){
                    el.text($.dict[trn][lang]);
                }else if($.dict[trn]["en"]){
                    el.text($.dict[trn]["en"]);
                }
            }
        });
        
        return this;
    };
 
}( jQuery ));
