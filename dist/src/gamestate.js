let player;
let map;
let layer;
const stations = [];
const threats = [];
let hullText;
let HUDGROUP;

const INTER_SCENE_DATA = {
  bones: 0,
  hull: 1,
};

const TWEENS = {
  FINISH_DURATION: 500,
  START_DELAY: 250,
  PLAYER_DEATH_ANIM: 1500,
  HURT_DELAY: 100,
};

class GameState extends BaseState {
  static get STATE_PLAYING() {
    return 'playing';
  }
  static get STATE_EXPLODING() {
    return 'exploding';
  }
  get nextSpawn() {
    return this._threatDelay - (Date.now() - this._lastThreat);
  }
  preload() {
    // Don't forget to update `xadvance` property on the font by +=1
    game.load.bitmapFont('smallfont', 'assets/fonts/sd_4x4_0.png', 'assets/fonts/sd_4x4.fnt');
    game.load.bitmapFont('visitor', 'assets/fonts/visitor_0.png', 'assets/fonts/visitor.fnt');
    game.load.tilemap('ship-map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.spritesheet('player', 'assets/player.png', 8, 8, 2);
    game.load.spritesheet('stations', 'assets/stations.png', 16, 16, 16);
    game.load.spritesheet('qtkeys', 'assets/letters.png', 8, 8, 23);
    game.load.spritesheet('threats', 'assets/threats.png', 8, 8, 16);
    game.load.image('tiles-1', 'assets/player-ship.png');
  }
  create() {
    INTER_SCENE_DATA.hull = 1;
    INTER_SCENE_DATA.bones = 0;
    this.registerGameSignals();
    this._score = 0;

    // Create HUD Group
    HUDGROUP = game.add.group();
    hullText = game.add.bitmapText(0, 0, 'smallfont', 'HULL: 00000', 4);
    HUDGROUP.add(hullText);
    hullText.position.x += game.camera.width - hullText.textWidth;
    hullText.position.y += game.camera.height - hullText.textHeight;
    hullText.fixedToCamera = true;
    this.setHullText();
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Set up the collision map
    map = game.add.tilemap('ship-map');
    map.addTilesetImage('player-ship', 'tiles-1');
    map.setCollisionBetween(1, 6);
    map.setCollisionBetween(16, 21);
    map.setCollisionBetween(32, 37);
    map.setCollisionBetween(48, 51);
    layer = map.createLayer('ship-border');
    layer.debug = DEBUG;
    layer.resizeWorld();

    // Create the stations for the player to interact
    const missileStation = new MissileStation(4 * 8, 8 * 18);
    stations.push(missileStation);

    // Create the player
    player = new Player();
    for (var i = stations.length - 1; i >= 0; i--) {
      this.registerStationSignals(stations[i].signals);
      player.registerStationSignals(stations[i].signals);
    }
    this.transitionToState(GameState.STATE_PLAYING);

    this._lastThreat = Number.NEGATIVE_INFINITY;
    this._threatDelay = 10 * 1000;
  }
  setHullText() {
    let blips = Array(Math.ceil(INTER_SCENE_DATA.hull * 5) + 1).join('0');
    hullText.text = `HULL: ${blips}`;
  }
  transitionToState(stateTo) {
    switch (stateTo) {
      case GameState.STATE_PLAYING:
        this.transitionStartPlaying();
        break;
      default:
        console.log('Something bad happened. Trying to transition into ', stateTo);
        break;
    }
  }
  addThreat(type = undefined) {
    const t = Threat.makeThreat(type);
    threats.push(t);
    this.registerThreatSignals(t.signals);
    return t;
  }
  transitionStartPlaying() {
    // TODO: Add tutorials I guess
    this._state = GameState.STATE_PLAYING;
  }
  transitionGameOver() {
    // Shake and fade out camera
    game.camera.shake(0.001, 1500, 0.001);
    game.camera.fade(0x8f0000, 1300);
    // Go to different gamestate
    const tween = game.add.tween(player.sprite).to({
        y: 0,
      },
      TWEENS.PLAYER_DEATH_ANIM,
      Phaser.Easing.Exponential.In,
      true);
    tween.onComplete.add(() => {
      this.showCreditsScreen();
    }, this);
    // Change to credits screen

    this._state = GameState.STATE_EXPLODING;
  }
  showCreditsScreen() {
    this.cleanUp();
    game.state.start('credits');
  }
  cleanUp() {
    while (stations.length > 0) {
      stations.shift().destroy();
    }
    while (threats.length > 0) {
      threats.shift().destroy();
    }
    if (threatGroupMidnight) {
      threatGroupMidnight.destroy();
      threatGroupMidnight = undefined;
    }
    player.destroy();
    player = undefined;
  }
  trySpawnThreat() {
    let result;
    const now = Date.now();
    if ((now - this._lastThreat) > this._threatDelay) {
      this._lastThreat = now;
      result = this.addThreat();
    }
    return result;
  }
  update() {
    game.world.bringToTop(HUDGROUP);
    switch (this._state) {
      case GameState.STATE_PLAYING:
        for (var i = stations.length - 1; i >= 0; i--) {
          stations[i].update();
        }

        // Sort the threats by the time remaining
        threats.sort(Threat.sortFn);
        for (var i = 0; i < threats.length; i++) {
          threats[i].update();
        }
        if (threatGroupMidnight) {
          threatGroupMidnight.align(1, -1, 9, 9);
        }
        player.update();

        if (this.trySpawnThreat()) {

        }
        if (INTER_SCENE_DATA.hull <= 0) {
          this.transitionGameOver();
        }
        break;
    }
  }
  render() {
    for (var i = stations.length - 1; i >= 0; i--) {
      stations[i].render();
    }
    for (var i = 0; i < threats.length; i++) {
      threats[i].render();
    }
    if (player) {
      player.render();
    }
    if (DEBUG) {
      debugText(threats.map(item => `${item.type} - ${item.remainingSeconds}`).join("\n"));
    }
    debugText(`State: ${this._state}`);
    debugText(`Hull: ${INTER_SCENE_DATA.hull}`);
    debugText(`Bones: ${INTER_SCENE_DATA.bones}`);
    debugText(`Next spawn: ${this.nextSpawn}`);
  }
  addBones(value) {
    INTER_SCENE_DATA.bones += value;
  }
  damageHull(value) {
    INTER_SCENE_DATA.hull -= value;
    this.setHullText();
  }
  // Expects onComplete and onFailure
  registerStationSignals(signals) {
    signals.onComplete.add(this.onStationComplete, this);
    signals.onFailure.add(this.onStationFailure, this);
  }
  unregisterStationSignals(signals) {
    signals.onComplete.remove(this.onStationComplete, this);
    signals.onFailure.remove(this.onStationFailure, this);
  }
  onStationComplete(sequence) {
    for (var i = 0; i < threats.length; i++) {
      const threat = threats[i];
      if (threat.acceptStationInput(sequence.station.type)) {
        // Resolve the threat with animation?
        console.log('Station ', sequence.station, 'targeting threat', threat);
        break;
      }
    }
  }
  onStationFailure(sequence) {
    console.log('Sequence failed');
  }
  registerThreatSignals(signals) {
    signals.complete.add(this.onThreatComplete, this);
    signals.expired.add(this.onThreatExpired, this);
  }
  unregisterThreatSignals(signals) {
    signals.complete.remove(this.onThreatComplete, this);
    signals.expired.remove(this.onThreatExpired, this);
  }
  onThreatComplete(threat) {
    this.addBones(threat.bones);
    this.resolveThreat(threat);
  }
  onThreatExpired(threat) {
    this.damageHull(threat.damage);
    this.resolveThreat(threat);
  }
  resolveThreat(threat) {
    const threatIdx = threats.indexOf(threat);
    threats.splice(threatIdx, 1);
    this.unregisterThreatSignals(threat.signals);
    threat.resolve();
  }
  registerGameSignals() {
    this.keys = {
      PAUSE: undefined,
      DEBUG_SPAWN_THREAT: game.input.keyboard.addKey(Phaser.Keyboard.T),
      DEBUG_COMPLETE_THREAT: game.input.keyboard.addKey(Phaser.Keyboard.U),
      DEBUG_FAIL_THREAT: game.input.keyboard.addKey(Phaser.Keyboard.Y),
    };
    this.keys.DEBUG_SPAWN_THREAT.onDown.add(this.onDebugSpawnThreat, this);
    this.keys.DEBUG_COMPLETE_THREAT.onDown.add(this.onDebugCompleteThreat, this);
    this.keys.DEBUG_FAIL_THREAT.onDown.add(this.onDebugFailThreat, this);
  }
  onDebugSpawnThreat() {
    this.addThreat();
  }
  onDebugCompleteThreat() {
    console.warn('onDebugCompleteThreat');
    if (threats.length > 0) {
      threats[0].requirements = [];
    }
  }
  onDebugFailThreat() {
    console.warn('onDebugFailThreat');
    if (threats.length > 0) {
      threats[0]._startTime = Number.NEGATIVE_INFINITY;
    }
  }
}
