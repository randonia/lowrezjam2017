const PLAYER_ACCELERATION = 5.0;

class Player {
  get X() {
    return this.sprite.x;
  }
  get Y() {
    return this.sprite.y;
  }

  constructor() {
    const startX = 8 * 16;
    const startY = 8 * 12.5;

    this.sprite = game.add.sprite(startX, startY, 'player');
    this.sprite.animations.add('idle', [0, 1], 6, true);
    this.sprite.play('idle');
    this.sprite.gameObject = this;
    this.sprite.anchor.set(0.5, 0.5);
    game.physics.arcade.enable(this.sprite);
    this.sprite.body.maxVelocity.set(40, 40);
    this.sprite.body.collideWorldBounds = true;
    // player.body.gravity.y = 100;
    game.camera.follow(this.sprite);
    this.cursors = game.input.keyboard.createCursorKeys();
    this.jetpackSprite = game.add.sprite(startX + 5, startY, 'player');
    this.jetpackSprite.animations.add('idle', [4, 5], 8, true);
    this.jetpackSprite.animations.play('idle');
    this.jetpackSprite.anchor.set(1, 0.35);
    this.keys = {
      LEFT: game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
      RIGHT: game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
      UP: game.input.keyboard.addKey(Phaser.Keyboard.UP),
      DOWN: game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
      SLOW: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR), // Remove the space bar
      STATION_0: game.input.keyboard.addKey(Phaser.Keyboard.Z), // Four Station Keys
      STATION_1: game.input.keyboard.addKey(Phaser.Keyboard.X),
      STATION_2: game.input.keyboard.addKey(Phaser.Keyboard.C),
      STATION_3: game.input.keyboard.addKey(Phaser.Keyboard.V),
    };
  }
  registerStationSignals(signals) {
    signals.onTriggerEnter.add(this.onStationEnter, this);
    signals.onTriggerExit.add(this.onStationExit, this);
  }
  onStationEnter(a) {
    console.log('Entering station', a);
    a.registerInputSignal('keyInput', this.keys.STATION_0.onDown);
    a.registerInputSignal('keyInput', this.keys.STATION_1.onDown);
    a.registerInputSignal('keyInput', this.keys.STATION_2.onDown);
    a.registerInputSignal('keyInput', this.keys.STATION_3.onDown);
  }
  onStationExit(a) {
    console.log('Exiting station', a);
    a.unregisterInputSignal('keyInput', this.keys.STATION_0.onDown);
    a.unregisterInputSignal('keyInput', this.keys.STATION_1.onDown);
    a.unregisterInputSignal('keyInput', this.keys.STATION_2.onDown);
    a.unregisterInputSignal('keyInput', this.keys.STATION_3.onDown);
  }
  update(canMove = true) {
    // Handle player -> world collisions
    if (shipWallLayer) {
      game.physics.arcade.collide(player.sprite, shipWallLayer, this.onCollide);
    }
    // Movement
    const LEFT = this.keys.LEFT.isDown;
    const RIGHT = this.keys.RIGHT.isDown;
    const UP = this.keys.UP.isDown;
    const DOWN = this.keys.DOWN.isDown;

    this.sprite.scale.x = (LEFT && !RIGHT) ? -1 : this.sprite.scale.x;
    this.sprite.scale.x = (!LEFT && RIGHT) ? 1 : this.sprite.scale.x;

    // Move the little thruster
    this.jetpackSprite.position.set(this.X, this.Y);
    this.jetpackSprite.scale.x = this.sprite.scale.x;

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
    if (!UP && !DOWN && !LEFT && !RIGHT) {
      this.jetpackSprite.alpha = 0;
    } else {
      this.jetpackSprite.alpha = 1;
    }
    this.sprite.body.acceleration.x += dX * PLAYER_ACCELERATION;
    this.sprite.body.acceleration.y += dY * PLAYER_ACCELERATION;
    // Apply Space Dampeners
    if (this.keys.SLOW.isDown && DEBUG) {
      console.log('Don\'t forget to remove the spacebar');
      this.sprite.body.acceleration.set(0, 0);
      this.sprite.body.velocity.x *= 0.85;
      this.sprite.body.velocity.y *= 0.85;
    }
    if (!canMove) {
      this.sprite.body.velocity.set(0, 0);
      this.sprite.body.acceleration.set(0, 0);
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
  destroy() {
    this.sprite.destroy();
  }
}
