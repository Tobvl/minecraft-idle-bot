var mineflayer = require('mineflayer');
const prompt = require('prompt-sync')();
const autoeat = require('mineflayer-auto-eat').plugin;
const readline = require('node:readline');
const { pathfinder } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;


var host = "";
var port = 0;
var username = ""
var password = ""
var moveinterval = 3; // 2 second movement interval
var maxrandom = 5; // 0-5 seconds added to movement interval (randomly)
var alive = false;

username = prompt('Username: ');
password = prompt('Password: ');
host = prompt('Host [localhost]: ');
port = prompt('Port [25565]: ');


const MIN_FOOD_LEVEL = 4;
const options = {
  host: host ? host : 'localhost',
  port: port ? port : 25565,
  username: username,
  password: password
}
console.log('Iniciando sesión como ' + username + ' ' + password);
console.log('Conectando a: ' + options.host + ':' + options.port);
var bot = mineflayer.createBot({...options});

bot.on('error', (error) => {
  console.log(error);
})

// load auto-eat plugin
bot.loadPlugin(autoeat);
bot.loadPlugin(pathfinder);
bot.loadPlugin(pvp);

bot.on('autoeat_started', (item, offhand) => {
  console.log(`Comiendo ${item.name} en ${offhand ? 'offhand' : 'mainhand'}`)
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
var afk = false;
var random_activated = false;

bot.on('spawn',() => {
  console.log('-');
  console.log('Bot Spawneado');
  console.log('-');
  connected = 1;
  rl.setPrompt('> '); rl.prompt();
  alive = true;
  bot.autoEat.options.priority = 'foodPoints';
  bot.autoEat.options.startAt = 19;
  bot.autoEat.options.useOffhand = false;

  setTimeout(() => {
    bot.chat('/login ' + password);
  }, 1000);
  
  setInterval(() => {
    if (!afk){
      console.log('Intervalo de 25 segundos');
      const mobFilter = e => e.type === 'hostile';
      const mob = bot.nearestEntity(mobFilter);
      
      if (!mob) {
        const entity = bot.entities;
        if (!entity) return;
        console.log(entity);
        return;
      };
  
      console.log('Intentando atacar a ' + mob.type);
      bot.attack(mob);
      console.log('Niveles de EXP: ' + bot.experience.points);
      // bot.lookAt(pos, true, () => {
      // })
    
    }
  }, 25000);
});

bot.on('health',() => {
  console.log(`Vida: ${bot.health} Comida: ${bot.food}`);
});

bot.on('chat', (username, message) => {
  
  if (message.includes('random_onn')) {
    random_activated = true;
  }

  if (message.includes('random_offf')) {
    random_activated = false;
  }
  
  if (message.includes('salta_salta')) {
      bot.setControlState('jump', true)
      setTimeout(() => {
        bot.setControlState('jump', false)
      }, 5000);
    }

  if (message.includes('golpeawa!')) {
      // yaw 88.5
      // pitch -11
      const entity = bot.nearestEntity();
      if (entity.kind != undefined && entity.kind != 'UNKNOWN') {
        console.log(entity.kind);
        console.log('Atacando!');
        bot.attack(entity);
        console.log('Dejando de atacar');
      }
      // setTimeout(() => {
      //   bot.pvp.stop();
      // }, 3000);
    }

  }
)


bot.on('time', function() {
    if (connected < 1) {
        return;
    }
    
    if (bot.food <= MIN_FOOD_LEVEL){
      console.log('Desconectando bot por falta de comida.');
      bot.quit("noMoreFood");
    }
    
    if (bot.health <= 4) {
      console.log('Desconectando bot por falta de vida.');
      bot.quit("noMoreHealth");
    }
    
    if (lasttime<0) {
        lasttime = bot.time.age;
        // console.log("Age set to " + lasttime)
    } else {
      if (random_activated) {
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
    }
});

bot.on('death', () => {
  alive = false;
})


bot.on('message', (message) => {
  readline.moveCursor(process.stdout, -2, 0)
  if (message.toString().includes('Guardian')) return;
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
  if (line.toString().split(' ')[0] == '/$afk'){
    afk = !afk;
    console.log("Cambiando estado AFK a: " + afk);
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
