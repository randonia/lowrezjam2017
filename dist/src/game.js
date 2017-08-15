const DEBUG = window.location.href.indexOf('debug=true') !== -1;
if (/localhost/.test(window.location.href)) {
  console.info('ＥＮＶＩＲＯＮＭＥＮＴ: ＰＵＧＧＬＥ ＵＮＫＮＯＷＮＳ ＢＡＴＴＬＥＰＵＧＳ');
} else {
  console.info('ＥＮＶＩＲＯＮＭＥＮＴ: ＰＵＧ');
}
const game = new Phaser.Game(64, 64, Phaser.AUTO, 'game-container');
game.state.add('game', new GameState());
game.state.add('credits', new CreditState());
game.state.start('game');

console.info('ＨＵＭＡＮ ＭＵＳＩＣ');
console.info('...Ｉ ＬＩＫＥ ＩＴ');

const dbgZone = document.getElementById('debug-text');

function clearDebugText() {
  dbgZone.innerText = '';
}

function debugText(msg) {
  if (DEBUG) {
    dbgZone.innerText += `\n${msg}`;
  }
}
