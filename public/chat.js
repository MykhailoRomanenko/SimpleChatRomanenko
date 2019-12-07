$(document).ready(function () {
    //make connection
    var socket = io.connect('http://localhost:4000');

    //buttons and input

    var message_input = $("#message");
    var username = $("#username");
    var send_message = $("#send_message");
    var send_username = $("#send_username");
    var chatroom = $("#chatroom");
    var feedback = $("#feedback");
    //Emit message
    send_message.click(function () {
        let today = new Date();
        let hrs = today.getHours();
        let min = today.getMinutes();
        let sec = today.getSeconds();
        var msg = {
            message: message_input.val(),
            time: (hrs < 10 ? "0" + hrs.toString() : hrs) + ":" + (min < 10 ? "0" + min.toString() : min) + ":" + (sec < 10 ? "0" + sec.toString() : sec)
        };
        if (msg.message.length === 0)
            return;
        socket.emit('new_message', msg);
        message_input.val('');
    });
    //Listen on new_message
    socket.on("new_message", (data) => {
        //feedback.html('');
        //message_input.val('');
        chatroom.append("<div class='message'><div class = 'message-head'><span>" + data.username + ":</span><span>" + data.time + "</span></div>" +
            "<div class='message-text'>" + data.message + "</div> </div>");
    });

    //Emit a username
    send_username.click(function () {
        socket.emit('change_username', {username: login.val()})
    });

    //Emit typing
    message_input.bind("keypress", () => {
        socket.emit('typing')
    });

    //Listen on typing
    // socket.on('user_connected', (users_online) => {
    //     feedback.html("<p><i>" + users_online + " users are currently online." + "</i></p>")
    // });
});
