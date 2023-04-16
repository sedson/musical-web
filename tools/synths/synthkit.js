import { Oscillator, CustomOscillator, PulseOscillator } from './oscillators.js';
import { Noise, RandomSource } from './noise.js';
import { Scope, Scope2D } from './scopes.js';
import { Spect } from './spect.js';
import { ZeroOneMix, StereoMerger, StereoSplitter } from './utils.js';
import { Filter, Filter2, CombFilter, FeedForwardCombFilter } from './filters.js';


export class SynthKit {
  constructor (ctx) {
    this.ctx = ctx;
  }

  osc (freq) {
    return new Oscillator(this.ctx, 'sine', freq);
  }

  tri (freq) {
    return new Oscillator(this.ctx, 'triangle', freq);
  }

  saw (freq) {
    return new Oscillator(this.ctx, 'sawtooth', freq);
  }
  
  LP1 (freg) {
    return new Filter(this.ctx, {freq: freq, type: 'lowpass'});
  }

  LP2 (freg) {
    return new Filter2(this.ctx, {freq: freq, type: 'lowpass'});
  }
}