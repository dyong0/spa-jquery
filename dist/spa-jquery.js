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

})();;(function () {

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

                if (this.is(':visible')) {
                    this.render();
                }
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
;(function (init) {

    var $ = require('jquery');
    var UrlPattern = require('url-pattern');

    var State = {
        states: {},
        currentState: null,
        nextState: null,
        nextStateParams: null,
        defaultState: null,
    };

    State.setDefaultState = function (stateName) {
        this.defaultState = stateName;
    };

    State.define = function (name, state) {
        if (this.states[name]) {
            throw new Error('The state \"' + name + '\" exists already');
        }

        if (state.urlPattern) {
            state.urlPattern = new UrlPattern(state.urlPattern);
        } else {
            state.urlPattern = {
                match: function () { return false; }
            };
        }

        this.states[name] = state;
    };

    State.onStateChange = function (hash) {
        if (hash.indexOf('#') === 0) {
            hash = hash.slice(1);
        }

        if (this.nextState) {
            State.translateState(this.currentState, this.nextState, this.nextStateParams);
        } else {
            var hasSearch = (function (hash) {
                return hash.indexOf('?') !== -1 && hash.slice(hash.indexOf('?') + 1).length > 1;
            } (hash));

            var search = hasSearch ? hash.slice(hash.indexOf('?') + 1) : null;
            var stateParams = search ? this.parseQuery(search) : null;

            State.translateState(this.currentState, this.findStateByHash(hash), stateParams);
        }

        this.nextState = null;
        this.nextStateParams = null;
    };

    State.findStateByHash = function (hash) {
        var states = this.states;

        for (var key in states) {
            if (states[key].urlPattern.match(hash)) {
                return states[key];
            }
        }

        throw new Error('No state matching with ' + hash);
    };

    State.translateState = function (currentState, nextState, stateParams) {
        currentState.onExit(function () {
            State.currentState = nextState;
            nextState.onEnter(stateParams, nextState.onState.bind(nextState));
        });
    };

    State.go = function (stateName, stateParams) {
        this.nextState = this.states[stateName];
        this.nextStateParams = stateParams;

        window.location.hash = State.buildHash(this.states[stateName], stateParams);
    };

    State.buildHash = function (state, stateParams) {
        return '#' + state.urlPattern.stringify(stateParams);
    };

    $(window).on('hashchange', function () {
        State.onStateChange(decodeURI(window.location.hash));
    });

    $(document).on('click', '[sref]', function () {
        var sref = $(this).attr('sref');

        if (sref.indexOf('?') === -1) {
            State.go(sref);
            return;
        }

        var stateName = sref.slice(0, sref.indexOf('?'));
        var search = sref.slice(sref.indexOf('?') + 1);
        var stateParams = State.parseQuery(search);

        State.go(stateName, stateParams);
    });

    State.parseQuery = function (query) {
        return JSON.parse('{"' + decodeURI(query).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    };

    State.onReady = function () {
        var self = this;

        return new Promise(function (resolve) {
            var hash = decodeURI(window.location.hash);
            if (hash === null || hash.length === 0) {
                self.go(self.defaultState);
            } else {
                State.onStateChange(hash);
            }

            resolve();
        });
    };

    init(State);

    module.exports.State = State;

})(function (State) {
    var INITIAL_STATE = {
        onEnter: function (param, next) {
            next();
        },
        onState: function (param) {
        },
        onExit: function (next) {
            next();
        }
    };

    State.define('INITIAL_STATE', INITIAL_STATE);
    State.currentState = INITIAL_STATE;
});