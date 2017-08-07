const STATION_TYPES = {
  WEAPON: 0,
  SHIELD: 1,
  CORE: 2,
  THRUST: 3,
};

const KEY_SPRITE_INDEX = {
  z: 0,
  x: 6,
  c: 12,
  v: 18,
}

class CommandSequence {
  get complete() {
    return this._pendingActions.length === 0;
  }
  get groupWidth() {
    return this._group.width;
  }
  constructor(actions) {
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
    if (this._pendingActions.length > 0) {

    } else {
      console.warn(`Sent key [${inputKey}] to command sequence but it has no pending actions`);
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
    return new CommandSequence(this.buildRequiredActions());
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
    }
    this.sequence = this.buildCommandSequence();
    this.signalListeners = {
      keyInput: this.onStationKeySignal,
    }
  }
  registerInputSignal(signalId, signal, context) {
    const innerSignal = this.signalListeners[signalId];
    if (innerSignal) {
      signal.add(innerSignal, context);
    }
  }
  unregisterInputSignal(signalId, signal, context) {
    const innerSignal = this.signalListeners[signalId];
    if (innerSignal) {
      signal.remove(innerSignal, context);
    }
  }
  onStationKeySignal(key) {
    console.log(`Heard Key [${key}] from signal`);
  }
  stateCheck() {
    const touchingPlayer = this.sprite.body.touching.up || this.sprite.body.touching.right || this.sprite.body.touching.down || this.sprite.body.touching.left;
    const wasTouchingPlayer = this.sprite.body.wasTouching.up || this.sprite.body.wasTouching.right || this.sprite.body.wasTouching.down || this.sprite.body.wasTouching.left;
    if (touchingPlayer && !wasTouchingPlayer) {
      console.log('Started touching player');
      this.signals.onTriggerEnter.dispatch(this);
    } else if (!touchingPlayer && wasTouchingPlayer) {
      console.log('Stopped touching player');
      this.signals.onTriggerExit.dispatch(this);
    }
    this._canInteract = touchingPlayer;
  }
  update() {
    game.physics.arcade.overlap(this.sprite, player.sprite);
    this.stateCheck();
    if (this._canInteract) {
      // Check for sequence call completion
    }
    // Position it where the station is
    const centerX = this.sprite.centerX - this.sequence.groupWidth * 0.5;
    const centerY = this.sprite.centerY - this.sprite.height;
    this.sequence._group.x = centerX;
    this.sequence._group.y = centerY;
  }
  onInteract() {
    throw new Error('Not Implemented BaseStation');
  }
  render() {
    if (DEBUG) {
      game.debug.body(this.sprite);
    }
  }
}

class WeaponStation extends BaseStation {
  get type() {
    return STATION_TYPES.WEAPON;
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
