import { Oscillator } from '/tools/synths/oscillators.js';
import { Signal } from '/tools/synths/utils.js';


export class Patch extends Oscillator {
  constructor (ctx, shape = 'sine', options) {
    super(ctx, shape, options);

    this._oscillator.frequency.value = 0;
    this._gain.gain.value = 0;

    this._modulator = new Oscillator(ctx, 'sine', { freq: 0 });

    this._baseFrequency = new Signal(ctx, options.freq || 440);
    this._modRatio = new Signal(ctx, 2.03);


    this._baseFrequency.connect(this._oscillator.frequency);

    this._modulator.gain.value = 400;

    this._multiplier = new GainNode(ctx, { gain: 0 });

    this._baseFrequency.connect(this._multiplier);
    this._modRatio.connect(this._multiplier.gain);

    this._multiplier.connect(this._modulator.frequency);

    this._modulator.connect(this._oscillator.frequency);

    this._nextTrigger = -Infinity;

    this._modCurve = new Float32Array(8);
    this._noteLength = 1;

    this._panner = new StereoPannerNode(ctx);
    this._gain.connect(this._panner);
  }

  trigger (freq) {
    if (this.ctx.state === 'suspended') { return; }
    

    if (this.ctx.currentTime > this._nextTrigger) {
      this.frequency.setTargetAtTime(freq, 0, 0.001);

      this.gain.setValueCurveAtTime(this._modCurve, this.ctx.currentTime, this._noteLength);
      // this._modulator.gain.setValueCurveAtTime(this._modCurve, this.ctx.currentTime, this._noteLength / 2);
      this._nextTrigger = this.ctx.currentTime + this._noteLength;
    }



    // this.ratio.setTargetAtTime(40, this.ctx.currentTime, 0.001);
    // this.ratio.setTargetAtTime(1, this.ctx.currentTime + 0.1, 0.2);


  }

  get frequency () { return this._baseFrequency.current; }
  get modIndex  () { return this._modulator.gain; }
  get ratio  () { return this._modulator.gain; }
  get outlet () { return this._panner; }

  get triggerDone () { return this.ctx.currentTime > this._nextTrigger; }



}