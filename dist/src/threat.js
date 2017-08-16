let threatGroupMidnight;
// The base threat class. Does stuff based on what kind it is.
// Each threat requires a certain amount of station actions to resolve.
// Otherwise they have a penalty for failure but they won't kill you. Maybe.
class Threat {
  static get TYPE_ENEMY() {
    return 'enemy';
  }
  static get TYPE_ASTEROID() {
    return 'asteroid';
  }
  static get TYPE_LEECH() {
    return 'leech';
  }
  static get TYPE_BLACKHOLE() {
    return 'blackhole';
  }
  get X() {
    return this.sprite.position.x;
  }
  get Y() {
    return this.sprite.position.y;
  }
  set X(val) {
    this.sprite.position.x = val;
  }
  set Y(val) {
    this.sprite.position.y = val;
  }
  get complete() {
    return this.requirements && this.requirements.length === 0;
  }
  get expired() {
    return this.remainingTime <= 0;
  }
  get elapsedTime() {
    return Date.now() - this._startTime;
  }
  get remainingTime() {
    return this._duration - this.elapsedTime;
  }
  get remainingSeconds() {
    return (this.remainingTime / 1000.0).toFixed(1);
  }
  static sortFn(left, right) {
    if (left.remainingTime < right.remainingTime) {
      return -1;
    }
    if (left.remainingTime > right.remainingTime) {
      return 1;
    }
    return 0;
  }
  constructor(type) {
    if (!threatGroupMidnight) {
      threatGroupMidnight = game.add.group();
      threatGroupMidnight.position.set(5, 5);
      threatGroupMidnight.fixedToCamera = true;
      HUDGROUP.add(threatGroupMidnight);
    }
    this.type = type;
    this._group = game.add.group();
    this.sprite = this._group.create(0, 0, 'threats');
    this.sprite.animations.add('base', Threat.getFrames(type), 4, true);
    this.sprite.play('base');
    this.text = game.add.bitmapText(this.sprite.right + 1, this._group.y + 1, 'visitor', this.type, 8);
    this.text.alpha = 0.15;
    this._group.add(this.text);
    threatGroupMidnight.add(this._group);
    this.requirements = this.makeRequirements();
    // in milliseconds
    this._duration = this.makeDuration();
    this.bones = this.calculateBones();
    this.damage = this.calculateDamage();
    console.log(`Created new threat of type ${type} with ${this.damage} damage / ${this.bones} bones`)
    this._startTime = Date.now();
    this.signals = {
      complete: new Phaser.Signal(),
      expired: new Phaser.Signal(),
    };
  }
  acceptStationInput(stationType) {
    const stationStr = getStationStr(stationType);
    const idx = this.requirements.indexOf(stationType);
    if (idx !== -1) {
      this.requirements.splice(idx);
      console.log(`Removed ${stationStr} from ${this.type}`);
    } else {
      console.log(`Not accepting inputs from ${stationStr} from ${this.type}`);
    }
    return idx !== -1;
  }
  update() {
    if (this.elapsedTime > this.remainingTime * 2) {
      this.sprite.animations.currentAnim.speed = 12;
    } else if (this.elapsedTime > this.remainingTime) {
      this.sprite.animations.currentAnim.speed = 8;
    }
    if (this.complete) {
      this.signals.complete.dispatch(this);
    } else if (this.expired) {
      this.signals.expired.dispatch(this);
    }
  }
  render() {}
  makeRequirements() {
    throw new Error('Not Implemented');
  }
  makeDuration() {
    throw new Error('Not Implemented');
  }
  calculateBones() {
    throw new Error('Not Implemented');
  }
  calculateDamage() {
    throw new Error('Not Implemented');
  }

  static getFrames(type) {
    switch (type) {
      case Threat.TYPE_ENEMY:
        return [0, 1, 2, 3];
      case Threat.TYPE_ASTEROID:
        return [4, 5, 6, 7];
      case Threat.TYPE_LEECH:
        return [8, 9, 10, 11];
      case Threat.TYPE_BLACKHOLE:
        return [12, 13, 14, 15];
    }
    console.error(`Type ${type} not accounted for in getFrames`);
    return [];
  }
  static randomThreat() {
    const _threats = [
      Threat.TYPE_ASTEROID,
      Threat.TYPE_ENEMY,
      Threat.TYPE_LEECH,
      Threat.TYPE_BLACKHOLE,
    ];
    const randIdx = Math.floor(Math.random() * _threats.length);
    return _threats[randIdx];
  }
  static makeThreat(type = undefined) {
    if (!type) {
      type = Threat.randomThreat();
    }
    let result;
    switch (type) {
      case Threat.TYPE_ASTEROID:
        result = new AsteroidThreat();
        break;
      case Threat.TYPE_ENEMY:
        result = new EnemyThreat();
        break;
      case Threat.TYPE_LEECH:
        result = new LeechThreat();
        break;
      case Threat.TYPE_BLACKHOLE:
        result = new BlackHoleThreat();
        break;
      default:
        console.warn(`Attempted to make threat of type ${type} and did not`);
    }
    return result;
  }
  destroy() {
    this._group.destroy();
  }
  resolve() {
    if (this.complete) {
      this.text.tint = TINT_SUCCESS;
      const tween = game.add.tween(this._group).to({
          y: this.sprite.y - 20,
        },
        TWEENS.THREAT_FAILURE,
        Phaser.Easing.Default,
        true);
      tween.onComplete.add(() => {
        this.destroy();
      }, this);
    } else if (this.expired) { // failed
      this.text.tint = TINT_FAILURE;
      game.camera.shake(0.001, 150, 0.001);
      game.camera.flash(0xff0000, 150, 0.001, 0.2);
      const tween = game.add.tween(this._group).to({
          y: this.sprite.y - 20,
        },
        TWEENS.THREAT_FAILURE,
        Phaser.Easing.Default,
        true);
      tween.onComplete.add(() => {
        this.destroy();
      }, this);
    }
  }
}
class AsteroidThreat extends Threat {
  constructor() {
    super(Threat.TYPE_ASTEROID);
  }
  makeRequirements() {
    return [STATION_TYPES.MISSILE];
  }
  makeDuration() {
    return (15 + Math.random() * 5) * 1000;
  }
  calculateBones() {
    return 20000 - this._duration;
  }
  calculateDamage() {
    return 0.2;
  }
}

class EnemyThreat extends Threat {
  constructor() {
    super(Threat.TYPE_ENEMY);
  }
  makeRequirements() {
    return [STATION_TYPES.LASER];
  }
  makeDuration() {
    return (10 + Math.random() * 15) * 1000;
  }
  calculateBones() {
    return 25000 - this._duration;
  }
  calculateDamage() {
    return 0.1;
  }
}

class LeechThreat extends Threat {
  constructor() {
    super(Threat.TYPE_LEECH);
  }
  makeRequirements() {
    return [STATION_TYPES.SHIELD];
  }
  makeDuration() {
    return (10 + Math.random() * 15) * 1000;
  }
  calculateBones() {
    return 0;
  }
  calculateDamage() {
    return 0.3;
  }
}

class BlackHoleThreat extends Threat {
  constructor() {
    super(Threat.TYPE_BLACKHOLE);
  }
  makeRequirements() {
    return [STATION_TYPES.THRUST];
  }
  makeDuration() {
    return (10 + Math.random() * 15) * 1000;
  }
  calculateBones() {
    return 0;
  }
  calculateDamage() {
    return 0.6;
  }
}
