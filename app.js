const express = require('express');
const encryptor = require('password-hash');
const mysql = require('mysql');
const app = express();
let online = 0;
let messageID = 0;
let firstMessageID = 0;
let messagesInBase = 0;
const MESSAGE_LIMIT = 500;
const CHAR_LIMIT = 500;
let xss = require('xss');

//set the template engine ejs
app.set('view engine', 'ejs');
//middlewares
app.use(express.static('public'));

//routes
app.get('/', (req, res) => {
    res.render('index');
});

//Listen on port 4000
server = app.listen(process.env.PORT||5000);
//server = app.listen(4000);
//server = app.listen(4000);


// MYSQL CONNECTION INITIALIZATION
const conn = mysql.createConnection({
    host: 'eu-cdbr-west-02.cleardb.net',
    user: 'b2944f70f53467',
    password: 'e4db8560',
    database: 'heroku_cf9a5770a420e1d'
});
conn.connect(function (err) {
    if (err) {
        console.log("SQL not connected");
    } else {
        console.log("SQL connected!");
    }
});
setInterval(() => {
    conn.query('SELECT 1', (error) => {
        console.log("ping");
        if (error) throw error;
    });
}, 50000);


const USER_ROLE = 1;
const ADMIN_ROLE = 2;


const io = require("socket.io")(server);


function createUser(data, socket) {
    data.password = encryptor.generate(data.password);
    data.role = USER_ROLE;
    conn.query(
        "INSERT INTO `users` VALUES (?, ?, ?)",
        [data.login, data.password, data.role],
        (err, row) => {
            console.log("User created");
            socket.username = data.login;
            socket.role = data.role;
            socket.emit('admin', socket.role==ADMIN_ROLE);
        }
    )
}

function getTime() {
    let today = new Date();
    let hrs = today.getHours()+2;
    let min = today.getMinutes();
    let sec = today.getSeconds();
    return (hrs < 10 ? "0" + hrs.toString() : hrs) + ":" + (min < 10 ? "0" + min.toString() : min) + ":" + (sec < 10 ? "0" + sec.toString() : sec);
}

function addMessageSQL(data, socket) {
    console.log(data);
    let sql = "INSERT INTO `messages` (`text`, `author`, `time`) VALUES (?, ?, ?)";
    let vals = [data.message, data.username, data.time];
    //let formattedSQL = mysql.format(sql, vals);
    conn.query(sql, vals,
        (err, res) => {
            console.log(res.insertId);
            data.id = res.insertId;
            io.sockets.emit("new_message", data);
            socket.emit('admin', socket.role==ADMIN_ROLE);
        });

}


function notifyAboutConnection(name, socket){
    addMessageSQL(systemMessage(name + ' has entered the chat.'), socket);

}

function displayPreviousMessages(socket) {
    conn.query(
        'SELECT * FROM `messages`',
        [],
        (error, row) => {
            if (typeof row != 'undefined') {
                for (let i = 0; i < row.length; ++i)
                    socket.emit('new_message', {
                        message: row[i].text,
                        time: row[i].time,
                        username: row[i].author,
                        id: row[i].id,
                    })
            }
        }
    );
}

function systemMessage(text) {
    return {username: "SYSTEM", message: text, time: getTime()};
}

//listen on every connection
io.on('connection', (socket) => {
    console.log(socket);
    console.log('New user connected');

    socket.username = "Anonymous";
    socket.role = USER_ROLE;
    socket.on('change_username', (data) => {
        data.login = xss(data.login);
        data.password = xss(data.password);
        conn.query(
            'SELECT * FROM `users` u WHERE u.login = ?',
            [data.login],
            (error, row) => {
                let res = row[0];
                console.log(row);
                if (typeof res != "undefined") {
                    console.log('data: ' + data.password);
                    if (!encryptor.verify(data.password, res.pass)) {
                        console.log("incorrect password");
                    } else {
                        console.log("user is connected");
                        socket.username = data.login;
                        socket.role = res.role;
                        notifyAboutConnection(data.login, socket);
                        socket.emit('admin', socket.role==ADMIN_ROLE);

                    }
                } else {
                    console.log("creating new user");
                    data.role = USER_ROLE;
                    createUser(data, socket);
                    notifyAboutConnection(data.login, socket);
                }
            }
        );
    });

    socket.on('new_message', (data) => {
        data.message = xss(data.message);
        data.username = socket.username;
        addMessageSQL(data, socket);

        //conn.query('SELECT * FROM `messages` u WHERE u.')
    });

    socket.on('delete_message', (data) => {
        conn.query('DELETE FROM `messages` WHERE id = ?', [data.id]);
        io.sockets.emit('delete_message_from_html', data);
    });


//     socket.on('disconnect', (socket) => {
//         --online;
//         if (socket.username === "Anonymous")
//             return;
//         let message = systemMessage(socket.username + ' left the chat.');
//         //io.sockets.emit('new_message', message);
//         addMessageSQL(message, socket);
//
// });
    displayPreviousMessages(socket);


});