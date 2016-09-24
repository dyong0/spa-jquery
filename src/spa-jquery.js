(function () {

    var $ = require('jquery');

    module.exports = {
        Component: null,
        State: null,

        run: function (config) {
            var self = this;
            $(document).ready(function () {
                self.Component.onReady(config).then(function () {
                    self.State.onReady(config);
                });
            });
        }
    };

})();