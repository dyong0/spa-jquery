var Component = {
    definitions: {},
    rootPath: 'components',
};

Component.define = function (name, def) {
    this.definitions[name] = def;
};

Component.setRoot = function (rootPath) {
    if (rootPath[rootPath.length - 1] === '/') {
        this.rootPath = rootPath.slice(0, -1);
        return;
    }

    this.rootPath = rootPath;
};

Component.create = function (name, initParams) {
    var self = this;

    return new Promise(function (resolve, reject) {
        var componentPath = self.rootPath + '/' + name.replace(/\./g, '/');

        $.getScript(componentPath + '.js', function () {
            $.get(componentPath + '.html', function (rawHtml) {
                var $component = $.extend($(rawHtml), self.definitions[name]);

                if ($component.init) {
                    $component.init(initParams);
                }

                if ($component.events) { 
                    var events = $component.events;
                    for (var eventType in events) {
                        var handlers = events[eventType];
                        for (var key in handlers) {
                            var handler = handlers[key];
 
                            if (key === '.') {
                                $component.on(eventType, handler.bind($component));
                            } else {
                                var selector = key;
                                $component.on(eventType, selector, handler.bind($component));
                            }
                        }
                    }
                }

                resolve($component);
            });
        });
    });
};