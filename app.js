const express = require('express');
const app = express();
var online = 0;
const CHAR_LIMIT = 500;

//set the template engine ejs
app.set('view engine', 'ejs');

//middlewares
app.use(express.static('public'));


//routes
app.get('/', (req, res) => {
    res.render('index');
});

//Listen on port 3000
server = app.listen(4000);

const mysql = require('mysql');

// const  connection = mysql.createConnection({
//         host: 'localhost',
//         login:'mydb',
//         password:'jschat!@#123',
//         database :'mydb'
// });
// console.log("hey");
// connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected!");
//
//
// });
const mysql_connection = mysql.createConnection({
    host     : 'eu-cdbr-west-02.cleardb.net',
    user     : 'b2944f70f53467',
    password : 'e4db8560',
    database : 'heroku_cf9a5770a420e1d'
});
mysql_connection.connect(function(err) {
    if (err) {
        console.log("SQL not connected");
    } else {
        console.log("SQL connected!");
    }
});
//socket.io instantiation
const io = require("socket.io")(server);


//listen on every connection
io.on('connection', (socket) => {

    //++online;
    //socket.broadcast.emit('user_connected', online);
    //io.sockets.emit("new_massage", {});
    console.log('New user connected');

    //default username
    socket.username = "Anonymous";

    //listen on change_username
    socket.on('change_username', (data) => {
        socket.username = data.username

    });

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        data.username = socket.username;
        io.sockets.emit('new_message', data);
       // addMessageSQL(data);
    });

io.on('disconnection', (socket) => {
        --online;
    socket.broadcast.emit('user_connected', online);
    });


    // function addMessageSQL(message) {
    //     let sql = "INSERT INTO messages ";
    //     let inserts = [\];
    //     sql = mysql.format(sql, inserts);
    //     mysql_connection.query(sql);
    // }
});