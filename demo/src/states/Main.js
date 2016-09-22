//# sourceURL=states/Main.js
State.define('Main', {
    urlPattern : '/',

    onEnter: function (stateParams, next) {
        $.get('/demo/data/users.json', function (users) {
            next(users);
        });
    },

    onState: function (users) {
        Component.create('Main').then(function ($main) {
            $('#app').append($main);
            
            Component.create('UserList/UserList').then(function($userList){
                $userList.update({
                    users : users
                });

                $main.append($userList);
            });
        });
    },

    onExit: function (next) {
        $('#app').empty();

        next();
    }
});