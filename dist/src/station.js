const STATION_TYPES = {
  MISSILE: 0,
  SHIELD: 1,
  CORE: 2,
  THRUST: 3,
  LASER: 4,
};

function getStationStr(typeVal) {
  let result;
  Object.keys(STATION_TYPES).forEach(key => {
    if (STATION_TYPES[key] === typeVal) {
      result = key;
    }
  });
  return result;
}
const KEY_SPRITE_INDEX = {
  z: 0,
  x: 6,
  c: 12,
  v: 18,
}

const TINT_SUCCESS = 0x00ff00;
const TINT_FAILURE = 0xff0000;

const TWEENS = {
  FINISH_DURATION: 500,
};
class CommandSequence {
  get complete() {
    return !this._failed && this._pendingActions.length === 0;
  }
  get failed() {
    return this._failed;
  }
  get finished() {
    return this.complete || this.failed;
  }
  get groupWidth() {
    return this._group.width;
  }
  constructor(actions, station) {
    this.station = station;
    this._pendingActions = actions;
    this._completeActions = [];
    this._group = game.add.group();
    for (var i = 0; i < actions.length; i++) {
      const spriteIdx = KEY_SPRITE_INDEX[actions[i].key];
      const newSprite = this._group.create(0, 0, 'qtkeys');
      newSprite.frame = spriteIdx;
    }
    this._group.align(-1, 1, 9, 9);
  }
  receiveInput(inputKey) {
    if (!this._failed && this._pendingActions.length > 0) {
      const nextKey = this._pendingActions[0];
      const groupIndex = this._completeActions.length;
      let resultTint = NaN;
      if (nextKey.key === inputKey) {
        resultTint = TINT_SUCCESS;
        this._completeActions.push(this._pendingActions.shift());
      } else {
        resultTint = TINT_FAILURE;
        this._failed = true;
        console.log(`Wrong key - expected: [${nextKey.key}] actual: [${inputKey}]`);
      }
      this._group.children[groupIndex].tint = resultTint;
      return resultTint === TINT_SUCCESS;
    } else {
      console.warn(`Sent key [${inputKey}] to command sequence but it has failed [${this._failed}] or has no pending actions [${this._pendingActions.length === 0}]`);
    }
  }
  animateFinish() {
    const text = game.add.bitmapText(this._group.centerX, this._group.y - 6, 'smallfont', '', 4);
    if (this.complete) {
      text.text = 'SUCCESS!';
      text.tint = TINT_SUCCESS;
    } else if (this.failed) {
      text.text = 'FAILED!';
      text.tint = TINT_FAILURE;
    }
    const stationTween = game.add.tween(this._group).to({
        alpha: 0,
        y: this._group.y - 15,
      },
      TWEENS.FINISH_DURATION,
      Phaser.Easing.Default,
      true,
      this.onAnimationComplete);
    stationTween.onComplete.add(this.onAnimationComplete, this);
    text.x = this._group.centerX - text.textWidth * 0.5;
    const textTween = game.add.tween(text).to({
        alpha: 0,
        y: text.y - 15
      },
      TWEENS.FINISH_DURATION,
      Phaser.Easing.Default,
      true);
    textTween.onComplete.add(() => this.destroy(), text);
  }
  onAnimationComplete() {
    console.log('Cleaning up station', this);
    this.destroy();
  }
  destroy() {
    if (this._group) {
      this._group.destroy();
    }
  }
}

class Action {
  get key() {
    return this._key;
  }
  constructor(key) {
    this._key = key;
  }
}

class BaseStation {
  get type() {
    throw new Error('Not Implemented BaseStation');
  }
  buildRequiredActions() {
    throw new Error('Not Implemented');
  }
  buildCommandSequence() {
    return new CommandSequence(this.buildRequiredActions(), this);
  }
  constructor(x, y) {
    // Engine stuff
    this.sprite = game.add.sprite(x, y, 'stations');
    this.sprite.gameObject = this;
    game.physics.arcade.enable(this.sprite);
    this.sprite.body.height = this.sprite.height * 0.5;
    this.sprite.body.offset.y = this.sprite.height * 0.5;
    // Game logic stuff
    this.signals = {
      onTriggerEnter: new Phaser.Signal(),
      onTriggerStay: new Phaser.Signal(),
      onTriggerExit: new Phaser.Signal(),
      onComplete: new Phaser.Signal(),
      onFailure: new Phaser.Signal(),
    }
    this.signalListeners = {
      keyInput: this.onStationKeySignal,
    }
  }
  registerInputSignal(signalId, signal) {
    const innerSignal = this.signalListeners[signalId];
    if (innerSignal) {
      signal.add(innerSignal, this);
    }
  }
  unregisterInputSignal(signalId, signal) {
    const innerSignal = this.signalListeners[signalId];
    if (innerSignal) {
      signal.remove(innerSignal, this);
    }
  }
  onStationKeySignal(keySignal) {
    const key = keySignal.event.key;
    if (!this.sequence) {
      return;
    }
    if (this.sequence.receiveInput(key)) {
      // Correct letter
    } else {
      // Incorrect letter
    }
  }
  stateCheck() {
    const touchingPlayer = this.sprite.body.touching.up || this.sprite.body.touching.right || this.sprite.body.touching.down || this.sprite.body.touching.left;
    const wasTouchingPlayer = this.sprite.body.wasTouching.up || this.sprite.body.wasTouching.right || this.sprite.body.wasTouching.down || this.sprite.body.wasTouching.left;
    if (touchingPlayer && !wasTouchingPlayer) {
      console.log('Started touching player');
      this.signals.onTriggerEnter.dispatch(this);
      if (this.sequence) {
        console.warn(`Sequence already existed - wasn't cleared earlier?`);
      }
      this.sequence = this.buildCommandSequence();
    } else if (!touchingPlayer && wasTouchingPlayer) {
      console.log('Stopped touching player');
      this.signals.onTriggerExit.dispatch(this);
      this.clearSequence();
    }
    this._canInteract = touchingPlayer;
  }
  update() {
    game.physics.arcade.overlap(this.sprite, player.sprite);
    this.stateCheck();
    if (this._canInteract) {
      // Check for sequence call completion
      if (this.sequence && this.sequence.finished) {
        this.finishSequence();
        this.startNewSequence();
      }
    }
    // Position it where the station is
    if (this.sequence) {
      const centerX = this.sprite.centerX - this.sequence.groupWidth * 0.5;
      const centerY = this.sprite.centerY - this.sprite.height;
      this.sequence._group.x = centerX;
      this.sequence._group.y = centerY;
    }
  }

  onInteract() {
    throw new Error('Not Implemented BaseStation');
  }
  render() {
    if (DEBUG) {
      game.debug.body(this.sprite);
    }
  }
  clearSequence() {
    this.sequence.destroy();
    delete this.sequence;
  }
  finishSequence() {
    if (this.sequence) {
      if (this.sequence.complete) {
        this.signals.onComplete.dispatch(this.sequence);
      } else if (this.sequence.failed) {
        this.signals.onFailure.dispatch(this.sequence);
      }
      this.sequence.animateFinish();
      this.sequence = undefined;
    } else {
      console.warn('Called finishSequence with no sequence');
    }
  }
  startNewSequence() {
    if (this.sequence) {
      console.warn('Created new sequence when one already exists');
    }
    // Create another sequence
    this.sequence = this.buildCommandSequence();
  }
}

class MissileStation extends BaseStation {
  get type() {
    return STATION_TYPES.MISSILE;
  }
  buildRequiredActions() {
    const OPTS = [
    'zxcv',
    'vcxz',
    'xczv',
    ];
    const rand = Math.floor(Math.random() * OPTS.length);
    return OPTS[rand].split('').map(item => new Action(item));
  }
}
class ShieldStation extends BaseStation {
  get type() {
    return STATION_TYPES.SHIELD;
  }
}
class CoreStation extends BaseStation {
  get type() {
    return STATION_TYPES.CORE;
  }
}
class ThrustStation extends BaseStation {
  get type() {
    return STATION_TYPES.THRUST;
  }
}
