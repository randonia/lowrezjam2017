class CreditState extends BaseState {
  preload() {
    game.load.bitmapFont('smallfont', 'assets/fonts/sd_4x4_0.png', 'assets/fonts/sd_4x4.fnt');
    game.load.bitmapFont('visitor', 'assets/fonts/visitor_0.png', 'assets/fonts/visitor.fnt');
    game.load.spritesheet('player', 'assets/player.png', 8, 8, 2);
  }
  create() {
    console.log('You either won or lost if you\'re here', INTER_SCENE_DATA);
    const restartKey = game.input.keyboard.addKey(Phaser.Keyboard.I);
    restartKey.onDown.add(this.restartGameState, this);
  }
  restartGameState() {
    game.state.start('game', true, false);
  }
  update() {}
  render() {}
}
