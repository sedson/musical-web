import { Operator } from './operator.js';
import { Signal } from './utils.js';


/**
 *
 */ 
export class Filter extends Operator {
  constructor(ctx, options = {}) {
    super(ctx, options);
    const freq = options.freq || 1200;
    const type = options.type || 'lowpass';
    this._filter = new BiquadFilterNode(ctx, { frequency: freq, type: type });
  }

  get inlet () { return this._filter; }
  get outlet () { return this._filter; }
  get frequency () {return this._filter.frequency; }
  get resonance () {return this._filter.Q; }
}


export class Filter2 extends Operator {
  constructor(ctx, options = {}) {
    super(ctx, options);
    const freq = options.freq || 1200;
    const type = options.type || 'lowpass';

    this._freq = new Signal(ctx, freq);
    this._q = new Signal(ctx, 1);

    this._filterStageA = new BiquadFilterNode(ctx, { frequency: 0, type: type });
    this._filterStageB = new BiquadFilterNode(ctx, { frequency: 0, type: type });

    this._q.connect(this._filterStageA.Q);
    this._q.connect(this._filterStageB.Q);

    this._freq.connect(this._filterStageA.frequency);
    this._freq.connect(this._filterStageB.frequency);

    this._filterStageA.connect(this._filterStageB);
  }

  get inlet () { return this._filterStageA; }
  get outlet () { return this._filterStageB; }
  get resonance () { return this._q.current; }
  get frequency () {return this._freq.current; }
}


export class Filter3 extends Operator {
  constructor(ctx, options = {}) {
    super(ctx, options);
    const freq = options.freq || 1200;
    const type = options.type || 'lowpass';

    this._freq = new Signal(ctx, freq);
    this._q = new Signal(ctx, 0);


    this._filterStageA = new BiquadFilterNode(ctx, { frequency: 0, type: type });
    this._filterStageB = new BiquadFilterNode(ctx, { frequency: 0, type: type });
    this._filterStageC = new BiquadFilterNode(ctx, { frequency: 0, type: type });

    this._q.connect(this._filterStageA.Q);
    this._q.connect(this._filterStageB.Q);
    this._q.connect(this._filterStageC.Q);


    this._freq.connect(this._filterStageA.frequency);
    this._freq.connect(this._filterStageB.frequency);
    this._freq.connect(this._filterStageC.frequency);


    this._filterStageA.connect(this._filterStageB).connect(this._filterStageC);
  }

  get inlet () { return this._filterStageA; }
  get outlet () { return this._filterStageC; }
  get resonance () { return this._q.current; }
  get frequency () {return this._freq.current; }
}


export class FeedbackCombFilter extends Operator {
  constructor (ctx, options = {}) {
    super(ctx, options);
    const delay = 8 / ctx.sampleRate;

    this._adder = new GainNode(ctx);
    this._falloff = new GainNode(ctx, { gain: 0.5 });
    this._delayLine = new DelayNode(ctx, { delayTime: delay });

    this._adder.connect(this._delayLine);
    this._delayLine.connect(this._falloff).connect(this._adder);
  }

  get inlet () { return this._adder; }
  get outlet () { return this._adder; }
}


export class FeedforwardCombFilter extends Operator {
  constructor (ctx, options = {}) {
    super(ctx, options);
    const delay = 8 / ctx.sampleRate;

    this._inlet = new GainNode(ctx);
    this._adder = new GainNode(ctx);
    this._falloff = new GainNode(ctx, { gain: 0.5 });
    this._delayLine = new DelayNode(ctx, { delayTime: delay });

    this._inlet.connect(this._adder);
    this._inlet
      .connect(this._delayLine)
      .connect(this._falloff)
      .connect(this._adder);
  }

  get inlet () { return this._inlet; }
  get outlet () { return this._adder; }
}