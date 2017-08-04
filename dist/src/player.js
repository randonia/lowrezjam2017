const PLAYER_ACCELERATION = 5.0;

class Player {
  constructor() {
    const startX = 8 * 12;
    const startY = 8 * 12;
    console.log(sprintf('Starting player at [%d,%d]', startX, startY));
    this.sprite = game.add.sprite(startX, startY, 'player');
    this.sprite.gameObject = this;
    this.sprite.anchor.set(0.5, 0.5);
    game.physics.arcade.enable(this.sprite);
    this.sprite.body.collideWorldBounds = true;
    // player.body.gravity.y = 100;
    game.camera.follow(this.sprite);
    this.cursors = game.input.keyboard.createCursorKeys();
    this.keys = {
      LEFT: game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
      RIGHT: game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
      UP: game.input.keyboard.addKey(Phaser.Keyboard.UP),
      DOWN: game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
      SLOW: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
    };
  }
  registerStationSignals(signals) {
    signals.onTriggerEnter.add(this.onStationEnter, this);
    signals.onTriggerExit.add(this.onStationExit, this);
  }
  onStationEnter(a) {
    console.log('Entering station', a);
  }
  onStationExit(a) {
    console.log('Exiting station', a);
  }
  update() {
    // Handle player -> world collisions
    if (layer) {
      game.physics.arcade.collide(player.sprite, layer, this.onCollide);
    }
    // Movement
    const LEFT = this.keys.LEFT.isDown;
    const RIGHT = this.keys.RIGHT.isDown;
    const UP = this.keys.UP.isDown;
    const DOWN = this.keys.DOWN.isDown;

    let dX = 0;
    let dY = 0;
    dX -= LEFT ? 1 : 0;
    dX += RIGHT ? 1 : 0;
    dY -= UP ? 1 : 0;
    dY += DOWN ? 1 : 0;

    // Do dampening if needed
    if (!LEFT && !RIGHT) {
      dX = -this.sprite.body.acceleration.x * 0.125;
    }
    if (!UP && !DOWN) {
      dY = -this.sprite.body.acceleration.y * 0.125;
    }

    this.sprite.body.acceleration.x += dX * PLAYER_ACCELERATION;
    this.sprite.body.acceleration.y += dY * PLAYER_ACCELERATION;
    // Apply Space Dampeners
    if (this.keys.SLOW.isDown) {
      this.sprite.body.acceleration.set(0, 0);
      this.sprite.body.velocity.x *= 0.85;
      this.sprite.body.velocity.y *= 0.85;
    }
  }
  onCollide(sprite1, sprite2) {
    sprite1.body.acceleration.set(0, 0);
  }
  render() {
    if (DEBUG) {
      game.debug.body(this.sprite);
      const dbgVelStr = sprintf('velocity: %d, %d', this.sprite.body.velocity.x, this.sprite.body.velocity.y);
      debugText(dbgVelStr);
      const dbgAccStr = sprintf('acceleration: %d, %d', this.sprite.body.acceleration.x, this.sprite.body.acceleration.y);
      debugText(dbgAccStr)
    }
  }
}
