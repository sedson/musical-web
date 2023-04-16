import { Operator } from './operator.js';
import { ZeroOneMix, gain } from './utils.js';
import * as filters from './filters.js';

export class Effect extends Operator {
  constructor(ctx) {
    super(ctx);
    this._dry = new GainNode(ctx);


    this._chainIn = new GainNode(ctx);
    this._chainOut = new GainNode(ctx);

    this._mix = new ZeroOneMix(ctx);

    this._dry.connect(this._mix.inlet);
    this._dry.connect(this._chainIn);
    this._chainOut.connect(this._mix.inlet2);
  }


  get inlet () { return this._dry; }
  get outlet () { return this._mix; }
  get mix () { return this._mix.mix; }
}






export class Distort extends Effect {
  constructor (ctx) {
    super(ctx);

    const samples = 512;
    const curve = new Float32Array(samples).map((_, n) => {
      const x = 2 * (n / samples) - 1; 
      const y = Math.tanh(Math.E * x);
      return y;
    });



    this._shaper = new WaveShaperNode(ctx, { curve: curve, oversample: '2x' });

    this._chainIn
      .connect(this._shaper)
      .connect(this._chainOut);
  }
}

export class Vocalizer extends Effect {
  constructor (ctx) {
    super(ctx);

    const q = 5;

    this._f1 = new filters.Filter2(ctx, {freq: 270, type: 'bandpass'});
    this._f2 = new filters.Filter2(ctx, {freq: 2300, type: 'bandpass'});
    this._f3 = new filters.Filter2(ctx, {freq: 3000, type: 'bandpass'});

    this._chainIn.connect(this._f1.inlet);
    this._chainIn.connect(this._f2.inlet);
    this._chainIn.connect(this._f3.inlet);

    this._f1.resonance.value = 2;
    this._f2.resonance.value = 4;
    this._f3.resonance.value = 9;


    this._f1.connect(this._chainOut);
    this._f2.connect(this._chainOut);
    this._f3.connect(this._chainOut);
  }

  mouth (vowel, time = 0.001) {
    const t = Math.max(time, 0.001);
    const now = this.ctx.currentTime;
    switch (vowel) {
      case  'ee' :
        this._f1.frequency.setTargetAtTime(270, now, t);
        this._f2.frequency.setTargetAtTime(2300, now, t);
        this._f3.frequency.setTargetAtTime(3000, now, t);
        break;

      case  'oo' :
        this._f1.frequency.setTargetAtTime(300, now, t);
        this._f2.frequency.setTargetAtTime(870, now, t);
        this._f3.frequency.setTargetAtTime(2250, now, t);
        break;

      case  'i' :
        this._f1.frequency.setTargetAtTime(400, now, t);
        this._f2.frequency.setTargetAtTime(2000, now, t);
        this._f3.frequency.setTargetAtTime(2550, now, t);
        break;

      case  'e' :
        this._f1.frequency.setTargetAtTime(530, now, t);
        this._f2.frequency.setTargetAtTime(1850, now, t);
        this._f3.frequency.setTargetAtTime(2500, now, t);
        break;

      case  'u' :
        this._f1.frequency.setTargetAtTime(640, now, t);
        this._f2.frequency.setTargetAtTime(1200, now, t);
        this._f3.frequency.setTargetAtTime(2400, now, t);
        break;

      case  'a' :
        this._f1.frequency.setTargetAtTime(660, now, t);
        this._f2.frequency.setTargetAtTime(1700, now, t);
        this._f3.frequency.setTargetAtTime(2400, now, t);
        break;
    }
  }
}


