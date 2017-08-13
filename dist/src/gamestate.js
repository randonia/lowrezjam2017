let player;
let map;
let layer;
const stations = [];
const threats = [];

class GameState extends BaseState {
  preload() {
    game.load.tilemap('ship-map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.spritesheet('player', 'assets/player.png', 8, 8, 1);
    game.load.spritesheet('stations', 'assets/stations.png', 16, 16, 16);
    game.load.spritesheet('qtkeys', 'assets/letters.png', 8, 8, 23);
    game.load.spritesheet('threats', 'assets/threats.png', 8, 8, 16);
    game.load.image('tiles-1', 'assets/player-ship.png');
  }

  create() {
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
  }
  update() {
    // Sort the threats by the time remaining
    threats.sort(item => item.remainingTime);
    for (var i = stations.length - 1; i >= 0; i--) {
      stations[i].update();
    }
    for (var i = 0; i < threats.length; i++) {
      threats[i].update();
    }
    player.update();
  }
  render() {
    for (var i = stations.length - 1; i >= 0; i--) {
      stations[i].render();
    }
    for (var i = 0; i < threats.length; i++) {
      threats[i].render();
    }
    player.render();
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
    console.log('Complete threat:', threat);
    this.resolveThreat(threat);
  }
  onThreatExpired(threat) {
    console.log('Threat expired:', threat);
    this.resolveThreat(threat);
  }
  resolveThreat(threat) {
    const threatIdx = threats.indexOf(threat);
    threats.splice(threatIdx);
    this.unregisterThreatSignals(threat.signals);
    threat.destroy();
  }
}
