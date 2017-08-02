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
    layer = map.createLayer('ship-border');
    layer.resizeWorld();

    player = game.add.sprite(5, 5, 'player');
    game.physics.arcade.enable(player);
    // player.body.gravity.y = 100;
    player.body.collideWorldBounds = true;
  }
  update() {
    // const onGround = game.physics.arcade.collide(player, map);
  }
  render() {}
}
