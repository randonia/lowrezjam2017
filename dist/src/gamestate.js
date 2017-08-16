let player;
let map;
let shipWallLayer;
const stations = [];
const threats = [];
let hullText;
let HUDGROUP;
let commandSwitch;
let bgm;

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
  static get STATE_STARTING() {
    return 'starting';
  }
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
    game.load.audio('bgm', 'assets/audio/Reformat.mp3');
    game.load.bitmapFont('smallfont', 'assets/fonts/sd_4x4_0.png', 'assets/fonts/sd_4x4.fnt');
    game.load.bitmapFont('visitor', 'assets/fonts/visitor_0.png', 'assets/fonts/visitor.fnt');
    game.load.tilemap('ship-map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.spritesheet('player', 'assets/player.png', 8, 8, 6);
    game.load.spritesheet('stations', 'assets/stations.png', 16, 16, 16);
    game.load.spritesheet('objects', 'assets/objects.png', 8, 8, 4);
    game.load.spritesheet('qtkeys', 'assets/letters.png', 8, 8, 25);
    game.load.spritesheet('threats', 'assets/threats.png', 8, 8, 16);
    game.load.image('tiles-1', 'assets/ship-walls.png');
  }
  create() {
    bgm = game.add.audio('bgm');
    bgm.play();
    bgm.loop = true;
    bgm.volume = 0.2;
    this._state = GameState.STATE_STARTING;
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
    map = game.add.tilemap('ship-map', 8, 8, 32, 32);
    map.addTilesetImage('ship-walls', 'tiles-1');
    const shipFloorLayer = map.createLayer('ship_floors');
    shipWallLayer = map.createLayer('ship-walls');
    const shipDecoLayer = map.createLayer('ship-deco');
    map.setCollisionBetween(1, 1000, true, shipWallLayer);
    shipWallLayer.debug = DEBUG;
    shipWallLayer.resizeWorld();

    // Create the stations for the player to interact
    const TILESIZE = 8
    const STATIONDATA = [
      {
        _class: MissileStation,
        x: 3,
        y: 24,
      },
      {
        _class: LaserStation,
        x: 27,
        y: 24,
      },
      {
        _class: ShieldStation,
        x: 15,
        y: 5,
      },
      {
        _class: ThrustStation,
        x: 15,
        y: 28,
      },
    ];
    STATIONDATA.forEach((stationData) => {
      const _x = TILESIZE * stationData.x;
      const _y = TILESIZE * stationData.y;
      const newStation = new stationData._class(_x, _y);
      stations.push(newStation);
    });

    // Create the player
    player = new Player();
    player.update();
    for (var i = stations.length - 1; i >= 0; i--) {
      this.registerStationSignals(stations[i].signals);
      player.registerStationSignals(stations[i].signals);
    }
    // Create the command switch
    commandSwitch = new CommandSwitch(player.X, player.Y);
    this.registerCommandSwitchSignals(commandSwitch.signals);
    game.world.bringToTop(player.sprite);

    // Let the player sit for a bit
    this._lastThreat = Number.POSITIVE_INFINITY;
    this._threatDelay = 10 * 1000;
  }
  setHullText() {
    let blips = Array(Math.ceil(INTER_SCENE_DATA.hull * 5) + 1).join('0');
    hullText.text = `HULL: ${blips}`;
  }
  transitionToState(stateTo) {
    console.log(`Transitioning to ${stateTo}`);
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
    this.unregisterCommandSwitchSignals(commandSwitch.signals);
    // TODO: Add tutorials I guess
    this._state = GameState.STATE_PLAYING;
    this._lastThreat = Date.now();
    this.registerCommandSwitchSignals(commandSwitch.signals);
  }
  transitionGameOver() {
    this.unregisterCommandSwitchSignals(commandSwitch.signals);
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
    this.registerCommandSwitchSignals(commandSwitch.signals);
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
    switch (this._state) {
      case GameState.STATE_STARTING:
        player.update(false);
        commandSwitch.update();
        break;
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
        commandSwitch.update();
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
    game.world.bringToTop(HUDGROUP);

    for (var i = stations.length - 1; i >= 0; i--) {
      stations[i].render();
    }
    for (var i = 0; i < threats.length; i++) {
      threats[i].render();
    }
    if (player) {
      player.render();
    }
    if (commandSwitch) {
      commandSwitch.render();
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
  onStartGamePressed(commandSwitch) {
    this.transitionStartPlaying();
    commandSwitch.hide();
  }
  onWarpJumpPressed() {
    // Test if you're able to jump
    console.log('TESTING');
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
  registerCommandSwitchSignals(signals) {
    switch (this._state) {
      case GameState.STATE_STARTING:
        signals.activate.add(this.onStartGamePressed, this);
        break;
      case GameState.STATE_PLAYING:
        signals.activate.add(this.onWarpJumpPressed, this);
        break;
    }
  }
  unregisterCommandSwitchSignals(signals) {
    switch (this._state) {
      case GameState.STATE_STARTING:
        signals.activate.remove(this.onStartGamePressed, this);
        break;
      case GameState.STATE_PLAYING:
        signals.activate.remove(this.onWarpJumpPressed, this);
        break;
    }
  }
  onDebugSpawnThreat() {
    if (!DEBUG) {
      return;
    }
    this.addThreat();
  }
  onDebugCompleteThreat() {
    if (!DEBUG) {
      return;
    }
    console.warn('onDebugCompleteThreat');
    if (threats.length > 0) {
      threats[0].requirements = [];
      this.onThreatComplete(threats[0]);
    }
  }
  onDebugFailThreat() {
    if (!DEBUG) {
      return;
    }
    console.warn('onDebugFailThreat');
    if (threats.length > 0) {
      threats[0]._startTime = Number.NEGATIVE_INFINITY;
      this.onThreatExpired(threats[0]);
    }
  }
}
