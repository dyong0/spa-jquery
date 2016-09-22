(function(){

module.exports = {};
  
})();;(function(){

var Promise = Promise ? Promise : require('promise-polyfill');
var $ = require('jquery');

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

module.exports.Component = Component;


})();;(function(){

var $ = require('jquery');

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

var State = {
    states: { INITIAL_STATE: INITIAL_STATE },
    currentState: INITIAL_STATE,
    defaultState: null,
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
    var stateParams = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    State.go(stateName, stateParams);
});

$(document).ready(function(){
    var hash = decodeURI(window.location.hash);
    if(hash === null || hash.length === 0)
    {
        State.go(State.defaultState);
    }
});

State.setDefaultState = function (stateName) {
    this.defaultState = stateName;
};

State.define = function (name, state) {
    if (this.states[name]) {
        throw new Error('The state \"' + name + '\" exists already');
    }

    state.urlPattern = new UrlPattern(state.urlPattern);

    this.states[name] = state;
};

State.onStateChange = function (hash) {
    if (hash.indexOf('#') === 0) {
        hash = hash.slice(1);
    }

    State.translateState(this.currentState, State.findStateByHash(hash), stateParams);
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
        nextState.onEnter(stateParams, nextState.onState);
    });
};

State.go = function (stateName, stateParams) {
    State.translateState(this.currentState, this.states[stateName], stateParams);
};

module.exports.State = State;

})();