let player;
let map;
let layer;

class GameState extends BaseState {
  preload() {
    game.load.tilemap('ship-map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.spritesheet('player', 'assets/player.png', 8, 8, 1);
    game.load.image('tiles-1', 'assets/player-ship.png');
  }

  create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Set up the collision map
    map = game.add.tilemap('ship-map');
    map.addTilesetImage('player-ship', 'tiles-1');
    map.setCollisionBetween(1, 100);
    layer = map.createLayer('ship-border');
    layer.debug = DEBUG;
    layer.resizeWorld();

    player = new Player();
  }
  update() {
    player.update();
    // const onGround = game.physics.arcade.collide(player, map);
  }
  render() {
    player.render();
  }
}
