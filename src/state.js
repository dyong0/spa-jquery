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
    rootPath: 'states',
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

State.setRootPath = function (rootPath) {
    if (rootPath[rootPath.length - 1] === '/') {
        this.rootPath = rootPath.slice(0, -1);
        return;
    }

    this.rootPath = rootPath;
};

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
    new Promise(function (resolve) {
        currentState.onExit(resolve);
    }).then(function () {
        State.currentState = nextState;
        nextState.onEnter(stateParams, nextState.onState);
    });
};

State.go = function (stateName, stateParams) {
    State.translateState(this.currentState, this.states[stateName], stateParams);
};

State.load = function (states) {
    var self = this;
    var loadedCount = 0;

    new Promise(function (resolve) {
        function onAllLoaded() {
            loadedCount++;

            if (loadedCount === states.length) {
                resolve();
            }
        }

        for (var i = 0; i < states.length; ++i) {
            $.getScript(self.rootPath + '/' + states[i] + '.js').then(onAllLoaded);
        }
    }).then(function () {
        State.go(self.defaultState);
    });
};