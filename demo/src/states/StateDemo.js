//# sourceURL=states/StateDemo.js
State.define('StateDemo', {
    urlPattern : '/StateDemo',

    onEnter: function (stateParams, next) {
        next();
    },

    onState: function () {
        Component.create('StateDemo/StateDemo').then(function($stateDemo){
            $('#app').append($stateDemo);
        });
    },
    
    onExit: function (next) {
        $('#app').empty();
        
        next();
    }
});