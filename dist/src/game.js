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

const DEBUG_TEXT = document.createElement('code');

if (DEBUG) {
  const DEBUG_INFO = document.createElement('p');
  DEBUG_INFO.innerText = 'DEBUG';
  DEBUG_INFO.setAttribute('class', 'debug-info');
  document.getElementById('div-debug-text').appendChild(DEBUG_INFO);
  DEBUG_TEXT.setAttribute('id', 'debug-text');
  document.getElementById('div-debug-text').appendChild(DEBUG_TEXT);
  const dbg_instructions = [
    'T - Spawn Threat',
    'Y - Fail Threat',
    'U - Succeed Threat',
    'SPACE - Slow down',
  ];
  dbg_instructions.forEach((item) => {
    const newLI = document.createElement('li');
    newLI.innerText = `DEBUG: ${item}`;
    document.getElementById('ul-instructions').appendChild(newLI);
  });
}


function clearDebugText() {
  if (DEBUG) {
    DEBUG_TEXT.innerText = '';
  }
}

function debugText(msg) {
  if (DEBUG) {
    DEBUG_TEXT.innerText += `\n${msg}`;
  }
}
