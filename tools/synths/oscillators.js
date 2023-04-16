/**
 * @file Oscillator types
 */ 

import { Operator } from './operator.js';
import { Signal, Sum } from './utils.js';

/**
 * @class Simple oscillator.
 */ 
export class Oscillator extends Operator {
  /**
   * Construct an oscillator. 
   * @param {AudioContext} ctx The parent context.
   * @param {string} shape One of 'sine', 'triangle', 'sawtooth', or 'square'.
   *     Default is 'sine'.
   */ 
  constructor (ctx, shape = 'sine', options = {}) {
    super(ctx);

    this.shape = shape;

    /**
     * The oscillator.
     */ 
    this._oscillator = new OscillatorNode(ctx, {
      type: shape,
      frequency: options.freq || 440
    });
    
    /** 
     * The gain.
     */ 
    this._gain = new GainNode(ctx);
    this._scaler = this._gain;

    // Connect and start.
    this._oscillator.connect(this._gain);
    this._oscillator.start(this.ctx.currentTime);
  }

  sync () {
    this._oscillator.stop();
    this._oscillator.disconnect();
    this._oscillator = new OscillatorNode(this.ctx, { type: this.shape });
    this._oscillator.start(this.ctx.currentTime);
    this._oscillator.connect(this._gain);
    return this;
  }

  get frequency () { return this._oscillator.frequency; }
  get detune () { return this._oscillator.detune; }
  get gain () { return this._gain.gain; }
  get inlet () { return this._oscillator.frequency; }
  get outlet () { return this._gain; }
}


/**
 * @class Custom oscillator. Constructed from a series of coefficients for a 
 * reverse Fourier transform. 
 */ 
export class CustomOscillator extends Oscillator {
  constructor(ctx, sine, cosine, options = {}) {
    super(ctx, 'sine', options);
    const terms = options.terms || 16;
    this._periodicWave = new PeriodicWave(ctx, {
      real: new Float32Array(terms).map((_, n) => cosine(n)),
      imag: new Float32Array(terms).map((_, n) => sine(n)),
    });
    this._oscillator.setPeriodicWave(this._periodicWave);
  }
}

/**
 * @class Pulse oscillator with a variable pulse width.
 */ 
export class PulseOscillator extends Oscillator {
  constructor(ctx, options = {}) {
    super(ctx, 'sine', options);
    this._oscillator.disconnect();

    // Wave shaper curve squishes a sine wave into a square.
    this._curve = new Float32Array(64).map((a, n) => n < 32 ? -1 : 1);
    this._shaper = new WaveShaperNode(ctx, {
      curve: this._curve,
      overSample: 'none',
    });

    // Audio param for the pulse width.
    this._width = new Signal(ctx, 0);
    
    // Sum the wave with the width, then squish and scale.
    this._sum = new Sum(ctx, this._oscillator, this._width);
    this._scaler = new GainNode(ctx, { gain: 1 });

    this._sum
      .connect(this._shaper)
      .connect(this._scaler)
      .connect(this._gain);
  }

  get width () { return this._width.current; }
}