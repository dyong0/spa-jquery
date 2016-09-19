//# sourceURL=components/UserList/UserList.js
Component.define('UserList/UserList', {
    users: [],

    render: function () {
        var self = this;
        Component.create('UserList/UserListItem').times(this.users.length).then(function (items) {
            self.empty();

            for(var i=0; i < items.length; ++i){
                items[i].update(self.users[i]);
                self.append(items[i]);
            }
        });
    }
});