class BaseState {
  preload() {
    throw Error('Not Implemented');
  }
  init() {
    // scale the game 4x
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.setUserScale(4, 4);

    // enable crisp rendering
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas)
  }
  preRender() {
    if (DEBUG) {
      clearDebugText();
    }
  }
  create() {
    throw Error('Not Implemented');
  }
  update() {
    throw Error('Not Implemented');
  }
  render() {
    throw Error('Not Implemented');
  }
}
