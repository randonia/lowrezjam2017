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
  constructor(type) {
    if (!threatGroupMidnight) {
      threatGroupMidnight = game.add.group();
      threatGroupMidnight.position.set(5, 5);
      threatGroupMidnight.fixedToCamera = true;
      HUDGROUP.add(threatGroupMidnight);
    }
    this.type = type;
    this.sprite = threatGroupMidnight.create(0, 0, 'threats');
    this.sprite.animations.add('base', Threat.getFrames(type), 4, true);
    this.sprite.play('base');
    this.requirements = this.makeRequirements();
    // in milliseconds
    this._duration = this.makeDuration();
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
    if (this.complete) {
      this.signals.complete.dispatch(this);
    } else if (this.expired) {
      this.signals.expired.dispatch(this);
    }
  }
  render() {
    if (DEBUG) {
      debugText(`${this.type} - ${this.remainingSeconds}`);
    }
  }
  makeRequirements() {
    throw new Error('Not Implemented');
  }
  makeDuration() {
    throw new Error('Not Implemented');
  }
  static getFrames(type) {
    switch (type) {
      case Threat.TYPE_ENEMY:
        return [0, 1, 2, 3];
      case Threat.TYPE_ASTEROID:
        return [4, 5, 6, 7];
    }
    console.error(`Type ${type} not accounted for in getFrames`);
    return [];
  }
  static randomThreat() {
    const _threats = [
      Threat.TYPE_ASTEROID,
      Threat.TYPE_ENEMY,
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
      default:
        console.warn(`Attempted to make threat of type ${type} and did not`);
    }
    return result;
  }
  destroy() {
    this.sprite.destroy();
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
    return (5 + Math.random() * 15) * 1000;
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
}
