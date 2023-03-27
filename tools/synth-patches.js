/**
 * The wave class binds an oscillator node to a gain node.
 */ 
class Wave {
  constructor (ctx, shape = 'sine') {
    this.ocsillatorNode = new OscillatorNode(ctx, { type: shape });
    this.gainNode = new GainNode(ctx);
    this.ocsillatorNode.connect(this.gainNode);
    this.ocsillatorNode.start();
  }

  connect (target) {
    this.gainNode.connect(target);
  }

  disconnect (target) {
    this.gainNode.disconnect(target);
  }

  get frequency () { return this.ocsillatorNode.frequency; }
  get detune    () { return this.ocsillatorNode.detune; }
  get gain      () { return this.gainNode.gain; }
}


/**
 * The Mixer class provide a pan and gain node.
 */ 
class Mixer { 
  constructor (ctx) {
    this.pannerNode = new StereoPannerNode(ctx);
    this.gainNode = new GainNode(ctx);
    this.pannerNode.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
  }

  get in   () { return this.pannerNode; }
  get pan  () { return this.pannerNode.pan; }
  get gain () { return this.gainNode.gain; }
}


/**
 * Patch class.
 */ 
class Patch {
  
  constructor (ctx, shape = "sine") {
    /** The parent audio context. */
    this.ctx = ctx;

    /** The output. */
    this.mixer = new Mixer(this.ctx);

    /** The carrier wave. */
    this.carrier = new Wave(ctx, shape);
    this.carrier.connect(this.mixer.in);
    this.carrier.gain.value = 0;

    /** Whether the patch is currently playing */
    this.playing = false;

    /** The list of exposed parameters */
    this.params = {};
    
    /** The list of exposed parameters */
    this.onCurve = new Float32Array([0, 0.25, 1]);
    this.offCurve = new Float32Array([1, 0.75, 0]);

    this.exposeParam('gain', this.mixer.gain, 0, 1, 0.5, 0.1);
    this.exposeParam('pan', this.mixer.pan, -1, 1, 0,  0.1);
    this.exposeParam('freq', this.carrier.frequency, 1, 20000, 440, 0.001);
  }

  /**
   * Open the amplitude.
   */
  on () {
    this.playing = true;
    this.carrier.gain.cancelScheduledValues(this.ctx.currentTime);
    this.carrier.gain.setValueCurveAtTime(this.onCurve, this.ctx.currentTime, 0.3);
  }

  /**
   * Close the amplitude.
   */ 
  off () {
    this.playing = false;
    this.carrier.gain.cancelScheduledValues(this.ctx.currentTime);
    this.carrier.gain.setValueCurveAtTime(this.offCurve, this.ctx.currentTime, 0.3);
  }


  /** 
   * Create a user (non-a-rate) param for this patch.
   * @param {string} name The exposed name of the param.
   * @param {AuidoParam} name The internal target of the param.
   * @param {number} min The min value.
   * @param {number} max The max value.
   * @param {number} val The initial value.
   * @param {number} smoothing The time in seconds to adjust the param to the 
   * target over.
   */
  exposeParam (name, target, min, max, val, smoothing) {
    this.params[name] = {
      value: val,
      min: min,
      max: max, 
      valueN: () => {
        return (this.params[name].value - min) / (max - min);
      },
      set: (value) => {
        this.params[name].value = value;
        target.setTargetAtTime(value, 0, smoothing);
      },
      setN: (value) => {
        value = (max - min) * value + min;
        this.params[name].value = value;
        target.setTargetAtTime(value, 0, smoothing);
      }
    };
    this.params[name].set(val);
  }


  /** 
   * Create a user (non-a-rate) param for this patch.
   * @param {string} name The exposed name of the param.
   * @param {AuidoParam} name The internal target of the param.
   * @param {number} min The min value.
   * @param {number} max The max value.
   * @param {number} val The initial value.
   * @param {number} smoothing The time in seconds to adjust the param to the 
   * target over.
   */
  exposeFn (name, fn, min, max, val, smoothing) {
    this.params[name] = {
      value: val,
      min: min,
      max: max, 
      valueN: () => {
        return (this.params[name].value - min) / (max - min);
      },
      set: (value) => {
        this.params[name].value = value;
        if (this[fn] && typeof this[fn] == 'function') {
          this[fn](value, smoothing);
        }
      },
      setN: (value) => {
        value = (max - min) * value + min;
        this.params[name].value = value;
        if (this[fn] && typeof this[fn] == 'function') {
          this[fn](value, smoothing);
        }
      }
    };
    this.params[name].set(val);
  }

  /** 
   * Set named param 
   */
  param (name, value) {
    if (!this.params[name]) {
      return;
    }

    this.params[name].set(value);
  }

   /** 
   * Set named param 
   */
  paramN (name, value) {
    if (!this.params[name]) {
      return;
    }

    this.params[name].set(value);
  }
}


class FmPatch extends Patch {
  
  constructor (ctx, shape = 'sine', shape2 = 'sine') {
    super(ctx, shape);

    this.modulator = new Wave(ctx, shape2);
    this.modulator.connect(this.carrier.frequency);

    this.carrier.disconnect();


    this.filter = new BiquadFilterNode(ctx);
    this.filter.type = 'lowpass';
    
    this.dist = new WaveShaperNode(ctx);
    this.dist.curve = new Float32Array([0, 0.1, 1]);
    this.dist.oversample = '4x';

    this.echo = new ConvolverNode(ctx, { buffer: IR(ctx, 3, 3) });
    this.echoAmount = new GainNode(ctx);
    this.echo.connect(this.echoAmount);


    this.carrier.connect(this.echo);
    // this.echo.connect(this.dist);
    this.echoAmount.connect(this.filter);
    this.carrier.connect(this.filter);
    this.filter.connect(this.mixer.in);


    this.exposeFn('harmonicity', '_harmonicity', 0.1, 100, 1, 0.1);
    this.exposeParam('modIndex', this.modulator.gain, 0.1, 3000, 1, 0.1);
    this.exposeFn('freq', '_freq', 1, 20000, 440, 0.001);
    this.exposeParam('detune', this.carrier.detune, -100, 100, 0, 0.001);
    this.exposeParam('filter', this.filter.frequency, 1, 20000, 10000, 0.1);
    this.exposeParam('verb', this.echoAmount.gain, 0, 2, 0.1, 0.1);
  }

  /** 
   * Private handler functions get  
   */
  _harmonicity (value, smoothing) {
    const carrierFreq = this.carrier.frequency.value;
    const modFreq = value * carrierFreq;
    this.modulator.frequency.setTargetAtTime(modFreq, 0, smoothing);
  }

  /** 
   * Private handler functions get  
   */
  _freq (value, smoothing) {
    const modFreq = value * this.params['harmonicity']?.value;
    this.carrier.frequency.setTargetAtTime(value, 0, smoothing);
    this.modulator.frequency.setTargetAtTime(modFreq, 0, smoothing * 20);
  }
}


class Envelope {
  
  constructor (ctx, a, d, s, r) {
    this.ctx = ctx;
    this.a = a;
    this.d = d;
    this.s = s;
    this.r = r;
    this.targets = [];
    this.on = false;
    this.next = 0;
  }

  connect (target) {
    this.targets.push(target);
  }

  curve (...values) {
    return new Float32Array([...values]);
  }

  length () {
    return this.a + this.d + this.r;
  }

  attack (hold = 0) {
    let t = this.ctx.currentTime;
    console.log(t, this.next)

    if (t < this.next) {
      return;
    }

    for (const target of this.targets) {
      const iv = target.value;

      target.setValueCurveAtTime(this.curve(iv, 1), t, this.a);
      target.setValueCurveAtTime(this.curve(1, this.s), t + this.a, this.d);
      
      if (hold > 0) {
        target.setValueCurveAtTime(this.curve(this.s, 0), t + this.a + this.d + hold, this.r);
      }
    }

    this.next = t + this.a + this.d + hold + this.r;
    
    if (hold <= 0) {
      this.next = t + 100;
    }
  }
}


function IR (ctx, duration, decay) {
  const length = ctx.sampleRate * duration;
  const buff = ctx.createBuffer(1, length, ctx.sampleRate);
  const chan0 = buff.getChannelData(0);
  for (var i = 0; i < length; i++) {
    chan0[i] = (2 * Math.random() - 1) * Math.pow(1 - i/length, decay);
  }
  return buff;
}