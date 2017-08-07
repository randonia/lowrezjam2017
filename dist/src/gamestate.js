let player;
let map;
let layer;
const stations = [];

class GameState extends BaseState {
  preload() {
    game.load.tilemap('ship-map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.spritesheet('player', 'assets/player.png', 8, 8, 1);
    game.load.spritesheet('stations', 'assets/stations.png', 16, 16, 16);
    game.load.spritesheet('qtkeys', 'assets/letters.png', 8, 8, 4);
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
    const weaponStation = new WeaponStation(4 * 8, 8 * 18);
    stations.push(weaponStation);

    // Create the player
    player = new Player();

    for (var i = stations.length - 1; i >= 0; i--) {
      player.registerStationSignals(stations[i].signals);
    }
  }
  update() {
    for (var i = stations.length - 1; i >= 0; i--) {
      stations[i].update();
    }
    player.update();
  }
  render() {
    for (var i = stations.length - 1; i >= 0; i--) {
      stations[i].render();
    }
    player.render();
  }
}
