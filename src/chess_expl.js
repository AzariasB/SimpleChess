/* global angular */

var chess = angular.module('chess', []);

chess.controller('Explications', function() {
    var that = this;
    this.explications = new Array();

    try {
        $.getJSON("../../assets/json/echecs_explications.json", function(json) {
            var ms = json['explications'];
            var first = true;
            for (var i in ms) {
                that.add_explain(ms[i],i,first);
                first = false;
            }
        });
    } catch (ex) {
        console.error(ex);
    }

    this.add_explain = function(expl_array,title,premier){
        this.explications.push(new button_bool(expl_array["button"],premier,title,expl_array["texte"].join("\n")));
    };

    this.change_button = function(quebouton) {
        var exp = this.explications;
        for(var m_ex in exp){
            if(exp[m_ex].button_name === quebouton){
                this.explications[m_ex].button_b = true;
            }else{
                this.explications[m_ex].button_b = false;
            }
        }
    };

});

function button_bool(b_text, b_bool,b_title, text) {
    this.button_text = b_text;
    this.button_name = b_title;
    this.button_b = b_bool;
    this.ex_text = text;
}

chess.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
});