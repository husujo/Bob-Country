var socket = io.connect();
                          // the tiles are 24x17 pixels? so there is 32^2 tiles?
var phgame = new Phaser.Game(900, 600, Phaser.AUTO, document.getElementById('game'));

var GameState1 = {};

var player = {};
var loggedin = false;
var emitter;
var exploding = [];
var dead = false;

// called first
GameState1.init = function(){
    phgame.stage.disableVisibilityChange = true; // keep the game loaded when tabbed out
};
// called after init
GameState1.preload = function() {
    phgame.load.tilemap('map', 'assets/map/example_map.json', null, Phaser.Tilemap.TILED_JSON);
    phgame.load.spritesheet('tileset', 'assets/map/tilesheet.png',32,32);
    phgame.load.image('sprite','assets/sprites/sprite.png');
    phgame.load.image('egg','assets/sprites/rsz_egg.png');
    phgame.load.spritesheet('jordy','assets/sprites/jordy.png',64,64,792);
    phgame.load.image('background','assets/map/background.png');
    phgame.load.image('bg2','assets/map/bg2.png');
  
//     phgame.load.image('particles'); // TODO
};
//called once preload has completed
GameState1.create = function() {
    GameState1.entities = {};
  
    var map = phgame.add.tileSprite(0, 0, phgame.width, phgame.height, 'bg2');
    map.inputEnabled = true;
//     var map = phgame.add.image(0,0,24*32,17*32,'background');
//     map.smoothed=false;
//     var layer = map.createLayer(0);
//     var map = phgame.add.tilemap('map');
//     map.addTilesetImage('tilesheet', 'tileset'); // tilesheet is the key of the tileset in map's JSON file
//     var layer;
//     for(var i = 0; i < map.layers.length; i++) {
//         layer = map.createLayer(i);
//     }
    
    
//     layer.inputEnabled = true; // Allows clicking on the map ; it's enough to do it on the last layer
//     layer.events.onInputUp.add(GameState1.onClick, this);
      map.events.onInputUp.add(GameState1.onClick, this);
  
    var testKey = phgame.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    testKey.onDown.add(GameState1.makebomb, this);
  
  
    phgame.physics.startSystem(Phaser.Physics.ARCADE);
//     emitter = phgame.add.emitter(0, 0, 100);
//     emitter.gravity = 0;
//     emitter.makeParticles('sprite');
  
    emitter2 = phgame.add.emitter(0, 0, 100);
    emitter2.gravity = 0;
    emitter2.makeParticles('egg');
 
    
};

GameState1.makebomb = function() {
    console.log("making egg");
    socket.emit('makebomb',player);
}

function hatch() {
  console.log("making egg");
  socket.emit('makebomb',player);
}

function initPlayer() {  
  if (dead) {
    location.reload();
    return;
  }
  if (loggedin) {
    return;
  }
//   console.log("clicked");
  var name = document.getElementById("name").value;
  socket.emit('newplayer',name);
  loggedin = true;
}

GameState1.onClick = function(layer,pointer) {
  
  if (!loggedin) {
    return;
  }

  player.mx = pointer.x-25;
  player.my = pointer.y-25;
  
  // set animation here:
  var mousex = player.mx;
  var mousey = player.my;
  var xdist = Math.abs(player.x-mousex);
	var ydist = Math.abs(player.y-mousey);
		if (xdist > ydist) { // 
			if (mousex > player.x) {GameState1.entities[player.id].animations.play('walkright',10,true)}
			if (mousex < player.x) {GameState1.entities[player.id].animations.play('walkleft',10,true)}
		}
		else if (ydist > xdist) {
			if (mousey > player.y) {GameState1.entities[player.id].animations.play('walkdown',10,true)}
			if (mousey < player.y) {GameState1.entities[player.id].animations.play('walkup',10,true)}
		}
  
}

socket.on('you',function(p) {
  player = p;
  console.log("we are id="+p.id);
});

socket.on('userleft',function(id) {
    GameState1.entities[id].destroy();
    delete GameState1.entities[id];
});


// this is the game loop.
GameState1.update = function() {  
//   if (loggedin) {
    // update my coords and send update
//     console.log("update");
    if (loggedin && !dead) {
      move();
      socket.emit('requestupdate',player);
    } else if (!loggedin || dead) {
      socket.emit('requestupdate',null)
    }
    
//   }
}

function move() {
  var speed = 4;
  var mousex = player.mx;
  var mousey = player.my;
  var xdist = Math.abs(player.x-mousex);
	var ydist = Math.abs(player.y-mousey);
		if (xdist > ydist) { // 
			if (mousex > player.x) {player.x += speed}
			if (mousex < player.x) {player.x -= speed}
			if (mousey > player.y) {player.y += speed*(ydist/xdist)}
			if (mousey < player.y) {player.y -= speed*(ydist/xdist)}
		}
		else if (ydist > xdist) {
			if (mousey > player.y) {player.y += speed}
			if (mousey < player.y) {player.y -= speed}
			if (mousex > player.x) {player.x += speed*(xdist/ydist)}
			if (mousex < player.x) {player.x -= speed*(xdist/ydist)}
		}
		else {
			if (mousex > player.x) {player.x += speed}
			if (mousex < player.x) {player.x -= speed}
			if (mousey > player.y) {player.y += speed}
			if (mousey < player.y) {player.y -= speed}
		}
}

// the server will send this out all the time. when we get it, update the sprites
socket.on('provideupdate',function(ents) {
  if (ents === null || ents === undefined) {
    return;
  }
//   console.log(ents);

  ents.forEach(function(ent) {
    if (ent === null) {
//         console.log("got null");
        return;
    }

    if (GameState1.entities.hasOwnProperty(ent.id)) {
//     if (ent.id in Object.keys(GameState1.entities)) { // already have this ent
      
      GameState1.entities[ent.id].x = ent.x;
      GameState1.entities[ent.id].y = ent.y;
      if (ent.name != "bomb") {
//         phgame.physics.arcade.overlap(GameState1.entities[ent.id], GameState1.entities[player.id], collisionHandler, null, this);
      } else { // is a bomb
//         console.log("a bomb we already have");
//           if (ent.timer < 5) { // bomb explode
              
//               emitter2.x = ent.x+10;
//               emitter2.y = ent.y+10;
//               emitter2.start(true, 600, null, 8);
//               GameState1.entities[ent.id].destroy();
//               delete GameState1.entities[ent.id];
              
//           }
      }
      
    } else { // need to make the ent
      
      if (ent.name != "bomb") {
        GameState1.addNewPlayer(ent.id,ent.x,ent.y,ent.name);
      } else {
        GameState1.addBomb(ent.id,ent.x,ent.y);
      }
      
    }
  });
});

socket.on('explode',function(bomb) {
  console.log('bomb exploded!')
  emitter2.x = bomb.x+10;
  emitter2.y = bomb.y+10;
  emitter2.start(true, 600, null, 8);
  GameState1.entities[bomb.id].destroy();
  delete GameState1.entities[bomb.id];
  
//   console.log("bomb:"+bomb.x+" "+bomb.y);
//   console.log("me:"+player.x+" "+player.y);
  // if i am too close to the bomb, i am dead
  var xdist = Math.abs(player.x-bomb.x);
  var ydist = Math.abs(player.y-bomb.y);
  var dist = Math.sqrt(Math.pow(xdist,2)+Math.pow(ydist,2));
//   console.log("dist:"+dist);
  if (dist < 120) {
    console.log("you are dead");
//     dead = player.id
//     socket.emit('dead',player.id);
    loggedin=false;
    dead = true;
    document.getElementById("sub_retry").innerHTML = "Try Again";
    socket.emit('dead',player.id);
    GameState1.entities[player.id].destroy();
    delete GameState1.entities[player.id];
  }
  
});

function collisionHandler(obj1,obj2) {
//     emitter.x = (obj1.x+obj2.x)/2;
//     emitter.y = (obj1.y+obj2.y)/2;
//   // explode, lifespan, ignored anyway, number of partiles
//     emitter.start(true, 500, null, 5);
}

GameState1.addBomb = function(id,x,y) {
  GameState1.entities[id] = phgame.add.sprite(x,y,'egg');
}

GameState1.addNewPlayer = function(id,x,y,name) {
//   console.log("creating a player: " + id + " " + x + " " + y);
//   if (player !== null && player !== undefined && player.id==id) {
//     console.log("me!");
//     GameState1.entities[id] = phgame.add.sprite(x,y,'jordy');
//   } else {
//     GameState1.entities[id] = phgame.add.sprite(x,y,'sprite');
//   }
  
  GameState1.entities[id] = phgame.add.sprite(x,y,'jordy');
  
  
  var style = { font: "30px Arial", fill: "#ffffff" };
  var label_score = phgame.add.text(5, -15, name, style);
  GameState1.entities[id].addChild(label_score);
  phgame.physics.arcade.enable(GameState1.entities[id]);
  
                                   // name, frames, framerate, loop
  GameState1.entities[id].animations.add('stand',[240],1,false);
  GameState1.entities[id].animations.add('walkdown',[240,241,242,243,244,245,246,247,248],10,true);
  GameState1.entities[id].animations.add('walkup',[192,193,194,195,196,197,198,199,200],10,true);
  GameState1.entities[id].animations.add('walkleft',[216,217,218,219,220,221,222,223,224],10,true);
  GameState1.entities[id].animations.add('walkright',[264,265,266,267,268,269,270,271,272],10,true);
  
  GameState1.entities[id].animations.play('stand',10,true);
  
}

////////////////////////////////////////////////////////////////////////////////////////////////////

phgame.state.add('GameState1',GameState1);
phgame.state.start('GameState1');





