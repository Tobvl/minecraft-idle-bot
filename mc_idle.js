var mineflayer = require('mineflayer');
var sleep = require('sleep');
const prompt = require('prompt-sync')();
const autoeat = require('mineflayer-auto-eat').plugin;
const readline = require('node:readline');

var host = "";
var port = 0;
var username = ""
var password = ""
var moveinterval = 3; // 2 second movement interval
var maxrandom = 5; // 0-5 seconds added to movement interval (randomly)
var alive = false;

username = prompt('Username: ');
password = "";
host = prompt('Host: ');
port = prompt('Port [25565]: ') ? prompt('Port: ') : 25565;
console.log('Iniciando sesión como ' + username + ' ' + password);
console.log('Conectando a: ' + host + ':' + port);


const MIN_FOOD_LEVEL = 4;
var bot = mineflayer.createBot({
  host: host,
  port: port,       // optional
  username: username,
  password: password
});
// load auto-eat plugin
bot.loadPlugin(autoeat);
bot.on('autoeat_started', (item, offhand) => {
  console.log(`Started eating ${item.name} with ${offhand ? 'offhand' : 'mainhand'}`)
})

bot.on('autoeat_error', (error) => {
  console.log('Error al comer: ' + error);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

var lasttime = -1;
var moving = 0;
var connected = 0;
var actions = [ 'forward', 'back', 'left', 'right']
var lastaction;
var pi = 3.14159;

bot.on('spawn',function() {
  console.log('-');
  console.log('Bot Spawneado');
  console.log('-');
  connected = 1;
  rl.setPrompt('> '); rl.prompt();
  alive = true;
  bot.autoEat.options.priority = 'foodPoints';
  bot.autoEat.options.startAt = 19;
  bot.autoEat.options.useOffhand = false;
});

bot.on('health',() => {
  console.log(`Vida: ${bot.health} Comida: ${bot.food}`);
});

bot.on('time', function() {
    if (connected <1) {
        return;
    }
    
    if (bot.food <= MIN_FOOD_LEVEL){
      console.log('Desconectando bot por falta de comida.');
      bot.quit("noMoreFood");
    }
    
    if (lasttime<0) {
        lasttime = bot.time.age;
        // console.log("Age set to " + lasttime)
    } else {
        var randomadd = Math.random() * maxrandom * 20;
        var interval = moveinterval*20 + randomadd;
        if (bot.time.age - lasttime > interval) {
            if (moving == 1) {
                bot.setControlState(lastaction,false);
                moving = 0;
                // console.log("Stopped moving after " + (interval/20) + " seconds");
                lasttime = bot.time.age;
            } else {
                var yaw = Math.random()*pi - (0.5*pi);
                var pitch = Math.random()*pi - (0.5*pi);
                bot.look(yaw,pitch,false);
                // console.log("Changed looking direction to yaw " + yaw + " and pitch " + pitch);

                lastaction = actions[Math.floor(Math.random() * actions.length)];
                bot.setControlState(lastaction,true);
                moving = 1;
                // console.log("Started moving " + lastaction +" after " + (interval/20) + "seconds");
                lasttime = bot.time.age;
                bot.activateItem();
            }
        }
    }
});

bot.on('death', () => {
  alive = false;
})


bot.on('message', (message) => {
  readline.moveCursor(process.stdout, -2, 0)
  console.log(message.toAnsi());
  rl.prompt();
})

rl.on('line', (line) => {
  if (line.toString().split(' ')[0] == '/msg'){
    console.log("Use /tell for private messages");
    return
  }
  if (line.toString().split(' ')[0] == '/$list'){
    for (var key in bot.players) {
      console.log(key);
    }
    return
  }
  readline.moveCursor(process.stdout, 0, -1)
  readline.clearScreenDown(process.stdout)
  try{
    bot.chat(line.toString())
  }catch(e){
    console.log("ERROR::: ");
    console.log(e);
  }
} )

bot.on('end', (reason) => {
  
  if (reason === "noMoreFood") {
    console.log('Desconectando DEFINITIVAMENTE bot por falta de comida.');
    process.exit();
  }else{
    console.log('Bot desconectado por: ' + reason );
    process.exit();

    // console.log('Reconectando bot... (5 segundos)');
    // sleep.sleep(5);
    // startBot();
  }

});

bot.on('error', (error) => {
  console.log(error);
})