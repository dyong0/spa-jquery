//# sourceURL=Components/Main.js
Component.define('Main', {
    testMember : 'test member',

    init: function(params){
        console.log('params', params);
    },
    
    testMethod : function(param){
        console.log('test method is just called!');
        console.log(param);
    },

    events : {
        click : {
            '.btn-test' : function(e){
                this.testMethod('btn clicked!');
            }
        }
    }
});