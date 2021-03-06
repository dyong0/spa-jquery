(function (init) {

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