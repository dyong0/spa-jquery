(function () {

    var Promise = Promise ? Promise : require('promise-polyfill');
    var $ = require('jquery');

    var Component = {
        rootComponent: null,
        definitions: {},
        rawHtmls: {},
        rootPath: 'components',
    };

    Component.define = function (name, def) {
        if (name.toLowerCase() === 'root') {
            throw new Error('Root component is already defined.');
        }

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
            $.get(componentPath + '.html', function (rawHtml) {
                self.rawHtmls[name] = rawHtml;

                resolve({
                    def: self.definitions[name],
                    rawHtml: self.rawHtmls[name]
                });
            });
        });
    };

    Component.create = function (name) {
        var self = this;

        var extensions = {
            _root: false,
            append: function ($child) {
                $.fn.append.apply(this, arguments);

                $child.render();
            },
            prepend: function () {
                $.fn.prepend.apply(this, arguments);

                $child.render();
            },
            appendTo: function () {
                $.fn.appendTo.apply(this, arguemnts);

                this.render();
            },
            prependTo: function () {
                $.fn.prependTo.apply(this, arguemnts);

                this.render();
            },
            update: function (states) {
                for (var key in states) {
                    if (this[key] === undefined) {
                        continue;
                    }

                    this[key] = states[key];
                }

                this.render();
            },
            render: function () {
                //default render fuction
            }
        };

        function createSingleComponent() {
            return self.loadComponent(name).then(function (result) {
                return $.extend($(result.rawHtml), extensions, result.def);
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

    Component.definitions.Root = {};
    Component.rawHtmls.Root = '<div id="root"></div>';
    Component.getRootComponent = function () {
        return this.rootComponent;
    };

    Component.onReady = function () {
        var self = this;
        return self.create('Root').then(function ($root) {
            self.rootComponent = $root;
            $('body').append($root);
        });
    };

    module.exports.Component = Component;


})();
