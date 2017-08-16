class CreditState extends BaseState {
  preload() {
    game.load.bitmapFont('smallfont', 'assets/fonts/sd_4x4_0.png', 'assets/fonts/sd_4x4.fnt');
    game.load.bitmapFont('visitor', 'assets/fonts/visitor_0.png', 'assets/fonts/visitor.fnt');
    game.load.spritesheet('player', 'assets/player.png', 8, 8, 2);
  }
  create() {
    console.log('You either won or lost if you\'re here', INTER_SCENE_DATA);
    const restartKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    restartKey.onDown.add(this.restartGameState, this);

    const bmpfnt = game.add.bitmapText(32, 32, 'visitor', `You saved\n${Math.round(INTER_SCENE_DATA.bones)}\nbones\nGood work\nPress\n<Enter>\nTo\nRestart`, 8)
    bmpfnt.x -= bmpfnt.textWidth * 0.5;
    bmpfnt.y -= bmpfnt.textHeight * 0.5;
    bmpfnt.align = 'center';

    const plrAnim = game.add.sprite(0, 0, 'player');
    plrAnim.animations.add('idle', [0, 1], 6, true);
    plrAnim.play('idle');
    plrAnim.anchor.set(0.5, 0.5);
    plrAnim.position.set(game.camera.view.centerX, game.camera.view.bottom - 25);
  }
  restartGameState() {
    game.state.start('game', true, false);
  }
  update() {}
  render() {}
}
