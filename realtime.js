var server = require("http").createServer();
var options = {
	'origins': '*:*',
	'transports': ['websocket','xhr-polling','jsonp-polling']
};
var io = require("socket.io")(options).listen(server);

var redisClient = require('redis').createClient(6379, 'localhost');

//online clients
var onlineClients = {};
//define count online user -1 (function)
onlineClients.count = function() {
    return Object.keys(this).length -1;
}

server.listen(3000);

/**
 * SOCKET IO HANDLER
 */
//hanle socket connection
io.sockets.on('connection', function(socket) {    
    var address = socket.conn.remoteAddress;
    console.log(socket.id + ' connect with ip ' + address); 
    
    socket.on('disconnect', function(){
        console.log(socket.id + ' disconnected!');
        //remove this from array
        //console.log('del ' + onlineClients[socket.uuid]);
        delete onlineClients[socket.uuid];
        /*var idx = onlineClients.indexOf(socket);
        if(idx != -1){
	    onlineClients.splice(idx, 1);  
        }
	*/
       console.log('online clients ' +  onlineClients.count() );       
    });
   
    //handle join event - to add user to online list
    socket.on('join', function(data){
		//console.log(data.uid);
		if(typeof socket !== undefined) {
		    // add uuid to socket
		    socket.uuid = data.uid;
		    onlineClients[data.uid] = socket;
        }
        //onlineClients[data.uid] = socket;
        //socket.uuid = data.uid;
		console.log(data.uid + ' is online');
        console.log('online clients: ' + onlineClients.count() );
		//for(var i=0; i< onlineClients.count(); i++){
	  	//  console.log(onlineClients[i]);
		//}
		//print out online client
    });
    
    socket.on('user_click', function(data){
		socket.broadcast.emit('update_user_movement', data);	
    });
    
    //on error handler
    socket.on('error', function(e){
        console.log(e);
    })
});
    

/**
 *  REDIS CLIENT HANDLER
 */
//handle redis pub sub
redisClient.on("message", function(channel, message) {
    //var message = JSON.parse(message);
    io.sockets.emit(channel, message);
});

//handle disconnect event
redisClient.on('disconnect', function() {
        redisClient.quit();
});
