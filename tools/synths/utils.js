/**
 * @file Utility nodes.
 */ 
import { Operator } from './operator.js';


/**
 * Wrapper for the constant source node.
 */ 
export class Signal extends Operator {
  constructor (ctx, value = 1) {
    super(ctx);
    this._source = new ConstantSourceNode(ctx, { offset: value });
    this._source.start();
  }
  get inlet () { return this._source.offset }
  get outlet () { return this._source; }
  get current () { return this._source.offset; }
}


/**
 * Wrapper for the constant source node.
 */ 
export class Sum extends Operator {
  constructor (ctx, ...ins) {
    super(ctx);
    this._gain = new GainNode(ctx);
    for (let input of ins) {
      input.connect(this._gain);
    }
  }
  get scale () { return this._gain.gain; }
  get inlet () { return this._gain; }
  get outlet () { return this._gain; }
}


/**
 * Multiply incoming signals. Inlet and Inlet2 are both summed then multiplied.
 */ 
export class Mult extends Operator {
  constructor (ctx, a, b) {
    super(ctx);
    this._multiplier = new GainNode(ctx, { gain: 0 });
    this._operand = new GainNode(ctx, { gain : 0});
    if (a) a.connect(this._multiplier);
    if (b) b.connect(this._operand);
    this._operand.connect(this._multiplier.gain);
  }
  get inlet () { return this._multiplier; }
  get inlet2 () { return  this._operand; }
  get outlet () { return this._multiplier; }
}


/**
 * Alpha blend between two signals. Useful for a dry/wet
 */ 
export class ZeroOneMix extends Operator {
  constructor(ctx, mix = 0.5, a = null, b = null) {
    super(ctx);

    // Gain nodes for the two inputs. Initialize to 0 gain to control with mix param.
    this._aGain = new GainNode(ctx, { gain: 0 });
    this._bGain = new GainNode(ctx, { gain: 0 });

    // The mix signal.
    this._mix = new Signal(ctx, mix);

    // Clamp the mix on [0, 1];
    const clampedMix = new WaveShaperNode(ctx, { curve: new Float32Array([0, 0, 1]) });
    this._mix.connect(clampedMix);
      
    // Gain for B is mix;
    clampedMix.connect(this._bGain.gain);

    // Gain for A is 1 - mix.
    const one = new Signal(ctx, 1);
    const negativeMix = new GainNode(ctx, { gain: -1 });
    clampedMix.connect(negativeMix);
    const oneMinusMix = new Sum(ctx, one, negativeMix);
    oneMinusMix.connect(this._aGain.gain);

    this._out = new GainNode(ctx);
    this._aGain.connect(this._out);
    this._bGain.connect(this._out);
  }

  get mix () { return this._mix.current; }
  get inlet () { return this._aGain; }
  get inlet2 () { return this._bGain; }
  get outlet () { return this._out; }
}



export class StereoMerger extends Operator {
  constructor(ctx) {
    super(ctx);
    this._merge = new ChannelMergerNode(ctx, { numberOfInputs: 2});

    this._gainL = new GainNode(ctx, { channelCount: 1 });
    this._gainR = new GainNode(ctx, { channelCount: 1 });

    this._center = new GainNode(ctx, { channelCount: 1, gain: 0.5 });

    this._gainL.connect(this._merge, 0, 0);
    this._gainR.connect(this._merge, 0, 1);

    this._center.connect(this._gainL);
    this._center.connect(this._gainR);
  }
  get inlet () { return this._center; }
  get L () { return this._gainL; }
  get R () { return this._gainR; }
  get C () { return this._center; }
  get outlet () { return this._merge; }
}

export class StereoSplitter extends Operator {
  constructor(ctx) {
    super(ctx);
    this._input = new GainNode(ctx);
    this._split = new ChannelSplitterNode(ctx, { numberOfOutputs: 2 });

    this._outL = new GainNode(ctx);
    this._outR = new GainNode(ctx);


    this._input.connect(this._split);
    this._split.connect(this._outL, 0);
    this._split.connect(this._outR, 1);
  }

  get inlet () { return this._input; }
  get L () { return this._outL; }
  get R () { return this._outR; }
  get outlet () { return this._input; }
}

export function gain (ctx, gain = 1) {
  return new GainNode(ctx, { gain : gain });
}
