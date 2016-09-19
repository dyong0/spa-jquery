var Component = {
    definitions: {},
    rawHtmls: {},
    rootPath: 'components',
};

Component.define = function (name, def) {
    this.definitions[name] = def;
};

Component.setRootPath = function (rootPath) {
    if (rootPath[rootPath.length - 1] === '/') {
        this.rootPath = rootPath.slice(0, -1);
        return;
    }

    this.rootPath = rootPath;
};

Component.loadComponent = function (name) {
    if (this.definitions[name] && this.rawHtmls[name]) {
        return Promise.resolve({
            def: this.definitions[name],
            rawHtml: this.rawHtmls[name]
        });
    }

    var self = this;
    var componentPath = self.rootPath + '/' + name.replace(/\./g, '/');
    return new Promise(function (resolve) {
        $.getScript(componentPath + '.js', function () {
            $.get(componentPath + '.html', function (rawHtml) {
                self.rawHtmls[name] = rawHtml;

                resolve({
                    def: self.definitions[name],
                    rawHtml: self.rawHtmls[name]
                });
            });
        });
    });
};

Component.create = function (name) {
    var self = this;

    function createSingleComponent() {
        return self.loadComponent(name).then(function (result) {
            return $.extend($(result.rawHtml), result.def, {
                update: function (states) {
                    for (var key in states) {
                        if (this[key] === undefined) {
                            continue;
                        }

                        this[key] = states[key];
                    }

                    this.render();
                }
            });
        }).then(function ($component) {
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

            return $component;
        });
    }

    var willCreateComponent = createSingleComponent();

    willCreateComponent.times = function (count) {
        var promises = [this];
        for (var i = 0; i < count - 1; ++i) {
            promises.push(createSingleComponent());
        }

        return Promise.all(promises);
    };

    return willCreateComponent;
};