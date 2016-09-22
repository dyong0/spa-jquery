//# sourceURL=components/UserList/UserListItem.js
Component.define('UserList/UserListItem', {
    name: null,
    nationality : null,

    render: function () {
        this.find('.name').text('Name: ' + this.name);
        this.find('.nationality').text('Nationality: ' + this.nationality);
    }
});