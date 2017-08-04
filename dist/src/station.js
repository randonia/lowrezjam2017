const STATION_TYPES = {
  WEAPON: 0,
  SHIELD: 1,
  CORE: 2,
  THRUST: 3,
};

class BaseStation {
  get type() {
    throw new Error('Not Implemented BaseStation');
  }
  constructor(x, y) {
    this.sprite = game.add.sprite(x, y, 'stations');
    this.sprite.gameObject = this;
    game.physics.arcade.enable(this.sprite);
    this.signals = {
      onTriggerEnter: new Phaser.Signal(),
      onTriggerStay: new Phaser.Signal(),
      onTriggerExit: new Phaser.Signal(),
    }
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
    game.physics.arcade.overlap(this.sprite, player.sprite, this.onPlayerCollision, null, this);
    this.stateCheck();
  }
  onPlayerCollision(station, player) {

  }
  onInteract() {
    throw new Error('Not Implemented BaseStation');
  }
  render() {
    if (DEBUG) {
      game.debug.body(this.sprite);
    }
  }
  onCollide(sprite1, sprite2) {}
}

class WeaponStation extends BaseStation {
  get type() {
    return STATION_TYPES.WEAPON;
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
