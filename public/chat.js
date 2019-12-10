$(document).ready(function () {
    const MAX_SGN_IN_LENGTH = 45;
    //make connection
    //var socket = io.connect('http://localhost:4000');
    var socket = io();

    //buttons and input
    var message_input = $("#message");
    var login = $("#username");
    var password = $("#password");
    var send_message = $("#send_message");
    var send_username = $("#send_username");
    var chatroom = $("#chatroom");


    socket.on("new_message", (data) => {
        console.log(data.id);
        console.log(typeof data.id);
        chatroom.append("<div class='message' id = 'msg" + data.id + "'><div class = 'message-head'><span>" + data.username + " at " + data.time + ": </span><span id = 'del" + data.id + "' class = delete><a>+</a></span></div>" +
            "<div class='message-text'>" + data.message + "</div> </div>");
        let del = $('#del' + data.id);
        del.click(function () {
            console.log('ID IS: ' + data.id);
            socket.emit('delete_message', {id: data.id});
        });
        del.css('display', data.deletable ? 'block' : 'none');
    });

    socket.on('admin', (admin) => {
        $('.delete').css('display', admin ? 'block' : 'none');
    });

    socket.on('delete_message_from_html', (data) => {
        console.log('MESSAGE WITH ID ' + data.id + 'WAS REMOVED');
        $('#msg' + data.id).remove();
    });

    send_message.click(function () {
        var msg = {
            message: message_input.val(),
            time: getTime(),
            author: socket.username
        };
        if (msg.message.length === 0)
            return;
        socket.emit('new_message', msg);
        message_input.val('');
    });
    //Listen on new_message


    //Emit a username
    send_username.click(function () {
        let lg = login.val();
        let ps = password.val();
        if (lg === undefined || ps === undefined || lg.length === 0 || ps.length === 0 || lg.length > MAX_SGN_IN_LENGTH || ps.length > MAX_SGN_IN_LENGTH) {
            alert("You have either entered nothing or more than maximum characters, which are " + MAX_SGN_IN_LENGTH + ".");
            return;
        }
        login.val('');
        password.val('');
        socket.emit('change_username', {login: lg, password: ps})
    });

    function getTime() {
        let today = new Date();
        let hrs = today.getHours();
        let min = today.getMinutes();
        let sec = today.getSeconds();
        return (hrs < 10 ? "0" + hrs.toString() : hrs) + ":" + (min < 10 ? "0" + min.toString() : min) + ":" + (sec < 10 ? "0" + sec.toString() : sec);
    }

});
