class Player {
  constructor() {
    this.sprite = game.add.sprite(0, 0, 'player');
    game.physics.arcade.enable(this.sprite);
    this.sprite.body.collideWorldBounds = true;
    // player.body.gravity.y = 100;
    game.camera.follow(this.sprite);
    this.cursors = game.input.keyboard.createCursorKeys();
  }
  update() {
    // Movement
    const LEFT = this.cursors.left.isDown;
    const RIGHT = this.cursors.right.isDown;
    const UP = this.cursors.up.isDown;
    const DOWN = this.cursors.down.isDown;

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

    this.sprite.body.acceleration.x += dX;
    this.sprite.body.acceleration.y += dY;
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
