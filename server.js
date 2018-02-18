var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

////////////////////////////////////////////////////////////////////////////

var pids = 0; // used to assign ids to players
var bombs = {};
var deads = [];

io.on('connection',function(socket){
  
    console.log("connection: " + socket.id);

    socket.on('newplayer',function(name) {
        socket.player = {
            id: pids++,
            x: rand(100,400),
            y: rand(100,400),
            name: name,
            mx:0,
            my:0
        };
        socket.player.mx = socket.player.x;
        socket.player.my = socket.player.y;
        socket.emit('you',socket.player);
    });
  
    socket.on('requestupdate',function(player) {
      if (player === undefined) {
        console.log("undefined player, dropping");
        socket.disconnect();
        return;
      }
      
      if (player !== null) {
        socket.player = player;
      }
      
      var entities = Object.keys(io.sockets.connected).map(k => io.sockets.connected[k].player);
      for (var k in bombs) {
//           console.log("adding bomb"+k);
//           entities[bombs[k].id] = bombs[k];
//           bombs[k].timer-=10;
          entities[k] = bombs[k];
      }
//       console.log(players);
      socket.emit('provideupdate',entities);
//       for (var j in bombs) { // remove bombs that have detonated
//           if (bombs[j].timer===0) {
//             delete bombs[j];
//           }
//       }
    });
  
    socket.on('move',function(player) {
      if (player === null || player === undefined) {
        console.log("null player, dropping");
        socket.disconnect();
        return;
      }
    });
  
    socket.on('makebomb',function(player) {
       var bomb = {
          id:pids++,
          x:player.x,
          y:player.y,
          name:"bomb",
          mx:player.x,
          my:player.y,
          bid:player.id,
          timer:2000
       }
       
       bombs[bomb.id] = bomb;
      
      setTimeout(function() {
        delete bombs[bomb.id];
        io.sockets.emit('explode',bomb);
      },bomb.timer+100);
      
//       console.log("made bomb"+bomb.id);
       
    });
  
    socket.on('disconnect', function() {
      if (socket.player === undefined || socket.player == null) {
        return;
      }
      io.sockets.emit('userleft',socket.player.id);
          console.log("disconnect: " + socket.id);
          //delete(sockets[socket.id]);
//           console.log(io.sockets.connected.length);
          
    });
  
  socket.on('dead',function(id) {
//       if (socket.player === undefined) {
//         console.log("socket.player is undefined");
//         return;
//       }
      
      io.sockets.emit('userleft',id);
      socket.player = null;
  });
//   socket.on('someoneDead',function(id) {
//     io.sockets.emit('userleft',id);
//   });
});

function rand(min,max) {
  return Math.floor(Math.random() * max) + min;
}





