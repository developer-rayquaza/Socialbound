var Types = require("./gametypes");
var Logger = require("./lib/logger");
var Message = require("./lib/message");
require("setimmediate");

// World
module.exports = class World {
  constructor(game, gameserver) {
    this.game = game;
    this.gameserver = gameserver;
    this.work = false;
    this.shoots = {};
    this.shoots_count = 0;
    this.shoots_complete = 0;
    this.shoots_data = [];
    this.map = game.map;
    this.chat = [];
    this.shoot_complete = null;
    this.chat_complete = false;
    this.gp_kill = 8;
    this.gold_kill = 500;
    this.gold_good = 50;
    this.gold_excellent = 100;
    this.gold_penalty = -250;
    this.gp_penalty = 0;
    this.team_damage_penalty = null;
  }
  start() {
    this.work = true;
    this.run();
  }

  shoot() {
    this.chat_complete = false;
    for (var id in this.shoots) {
      this.shoots_data.push({
        s: [],
        time: null,
        hole: [],
        damages: [],
      });
    }
  }

  run() {
    var self = this;
    setImmediate(function () {
      self.update();
    });
  }
  AddHole(shot) {
    var self = this;
    const { isNotExplode } = shot.type;
    if (isNotExplode) {
      return;
    }
    var position = shot.getPosAtTime();
    let shoots_complete = self.shoots_complete;
    self.shoots_data[shoots_complete].hole.push(position.x);
    self.shoots_data[shoots_complete].hole.push(position.y);
    self.shoots_data[shoots_complete].hole.push(shot.hole[0]);
    self.shoots_data[shoots_complete].hole.push(shot.hole[1]);
    self.map.AddGroundHole(position.x, position.y, shot.hole[0], shot.hole[1]);
  }
  CalculeRestLife(damage, hp, shield){
    const life = hp + shield;
    return life - damage;
  }
  AddDamage(shot) {
    var self = this;
    var shoot = shot;
    const a = shot.position;
    // hace un recorrido por todos los jugadores de la partida
    self.game.room.forPlayers(function (account) {
      // seleccionas al jugador
      let player = account.player;
      // actualizar al jugador
      account.update();
      
      if (player.is_alive === 1 || player.is_alive === true) {
        if (!shoot.canCollide) {
          var p2 = 20 * 20;
          var xxdx = shoot.x0 - a.x;
          var xxdy = shoot.y0 - a.y;
          var p3 = xxdx * xxdx + xxdy * xxdy;
          if (p2 < p3) {
            shoot.canCollide = true;
            //Logger.log('canCollide ' + shoot.canCollide);
          }
        } else if (shoot.isComplete) {
          shoot.canCollide = true;
        }
        var penalty = false;
        var fullcollide = false;
        var areacollide = false;
        var x11 = player.box.isColliding(shoot.box);
        var distf = Math.sqrt(
          Math.pow(player.x - a.x, 2) + Math.pow(player.y - a.y, 2)
        );
        var dm = 0;
        if (shoot.canCollide && x11 === 0) fullcollide = true;
      
        if (shoot.groundCollide || fullcollide) {
          if (shoot.account.player.team === player.team) {
            penalty = true;
          }
          if (fullcollide) dm = shoot.damageshot;
      
          if (distf <= 60) {
            //distancia
            dm = shoot.damageshot - distf;
            areacollide = true;
          }
          if (fullcollide || areacollide) {
            // code
            // restando vida
            const damage = dm;
            const { shield, hp } = player;
            const isLive = (shield + hp) - damage > 0;
            const shieldDamage = shield - damage; 
            const damageShield = damage - shield;
            const nextShield = shieldDamage < 0 ? shield  : damage;
            const nextHp = (damageShield > 0 ? damageShield : 0);
            player.discountHpAndShield(nextHp, nextShield)
            if(penalty){
              if(!isLive){
                // self.chat.push(Types.GAMEMSG.suicide_penalty);
                // self.chat.push(Types.GAMEMSG.suicide_penalty_bunge);
                // self.chat.push(Types.GAMEMSG.team_kill_penalty);
              }else{
                self.team_damage_penalty = true;
                // self.chat.push(Types.GAMEMSG.team_damage_penalty);
              }
            }else{

            }

            self.shoots_data[self.shoots_complete].damages.push({
              n: player.position,
              hp: player.hp,
              shield: player.shield
            });
            shoot.isComplete = true;
            shoot.damageComplete = true;
            if (!shoot.groundCollide) self.AddHole(shot);
          }
        }
      }
    });
  }
  update() {
    var self = this;
    if (this.shoots_count > 0) {
      for (var id in this.shoots) {
        var shoot = this.shoots[id];
        if (shoot && !shoot.isComplete) {
          shoot.update();
          var a = shoot.getPosAtTime();
          shoot.move(a.x, a.y, 0);

          const isColliding =
            self.map.IsPixel(a.x, a.y) && !shoot.groundCollide;
          const isOutMap = self.map.w < a.x || self.map.h < a.y;
          // explode in map
          if (isColliding) {
            shoot.isComplete = true;
            this.AddHole(shoot);
            shoot.groundCollide = true;
          }
          // explode out of map
          else if (isOutMap) {
            shoot.isComplete = true;
            shoot.isOutMap = true;
          }
          // Damage on players
          if (!shoot.damageComplete && shoot.type.isDamage)
            this.AddDamage(shoot);
          if (shoot.isComplete) {
            this.shoots_data[this.shoots_complete].s = shoot.GetS();
            this.shoots_data[this.shoots_complete].time = shoot.GetTimeFinal();
            shoot
              .GetProperties()
              .map(
                (a) => (this.shoots_data[this.shoots_complete][a[0]] = a[1])
              );
            shoot.isOutMap &&
              shoot
                .GetPropertyDeleteIsOutMap()
                .map(
                  (prop) => delete this.shoots_data[this.shoots_complete][prop]
                );
            this.shoots_complete++;
          }
        }
      }
      if (this.shoots_count <= this.shoots_complete) {
        this.shoots_count = 0;
        this.shoots_complete = 0;
        this.shoot_complete(
          this.shoots[0].account,
          this.shoots_data.slice(0),
          this.chat
        );
        if(self.team_damage_penalty) self.chat.push(Types.GAMEMSG.team_damage_penalty);
        self.chat.push(Types.GAMEMSG.good_shot);
        shoot.account.player.addWinGoldWinGp(self.gold_good, 0);
        this.chat = [];
        this.shoots_data = [];
      }
      setImmediate(function () {
        self.update();
      });
    }
  }
  onShootComplete(callback) {
    this.shoot_complete = callback;
  }
};
