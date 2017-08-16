// The thing that moves the level forward
class CommandSwitch {
  constructor(_x, _y) {
    this.sprite = game.add.sprite(_x, _y, 'objects');
    this.sprite.animations.add('idle', [0, 1, 2, 3], 8, true);
    this.sprite.play('idle');
    this.sprite.gameObject = this;
    this.sprite.anchor.set(0.5, 0.5);
    game.physics.arcade.enable(this.sprite);

    this.promptText = game.add.bitmapText(this.sprite.x, this.sprite.y - 15, 'visitor', 'BEGIN', 8);
    this.promptText.anchor.set(0.5, 0.5);
    this.promptText.alpha = 0.5;
    this.promptSprite = game.add.sprite(this.sprite.x, this.sprite.y - 8, 'qtkeys');
    this.promptSprite.anchor.set(0.5, 0.5);
    this.promptSprite.frame = 24;
    this.promptSprite.alpha = 1.0;
    this.keyPress = game.input.keyboard.addKey(Phaser.Keyboard.F);
    this.keyPress.onDown.add(this.interact, this);
    this.signals = {
      activate: new Phaser.Signal(),
    }
  }
  update() {
    const touchingPlayer = this.sprite.position.distance(player.sprite.position) < this.sprite.width * 0.75;
    this.touchingPlayer = touchingPlayer;
    if (this._touchLatch && !touchingPlayer) {
      // Stopped touching player
      this._hidden = false;
      this.hide();
    } else if (!this._touchLatch && touchingPlayer) {
      // Started touching player
      this._hidden = false;
      this.show();
    }
    this._touchLatch = touchingPlayer;
  }
  render() {
    if (DEBUG) {
      game.debug.body(this.sprite);
      debugText(`TouchingPlayer: ${!this.sprite.body.touching.none}`);
    }
  }
  interact() {
    if (!this._hidden) {
      const textTween = game.add.tween(this.promptText).to({
          alpha: 0,
        },
        250,
        Phaser.Easing.Linear.None,
        true,
        0, 0);
      const tween = game.add.tween(this.promptSprite).to({
          alpha: 0,
          y: this.promptSprite.y - 5,
        },
        250,
        Phaser.Easing.Linear.None,
        true,
        0, 0);
      this.signals.activate.dispatch(this);
      this._hidden = true;
    }
  }
  hide() {
    if (!this._hidden) {
      this.promptSprite.alpha = 0;
    }
    this._hidden = true;
  }
  show() {
    switch (game.state.getCurrentState()._state) {

    }
    this.promptSprite.alpha = 1;
    this.promptSprite.y = this.sprite.y - 8;
  }
}
