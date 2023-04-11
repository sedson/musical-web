import { Oscillator, CustomOscillator, PulseOscillator } from './oscillators.js';
import { Noise, RandomSource } from './noise.js';
// import { Scope } from './scope.js';
import { Scope, Scope2D } from './scopes.js';

import { Spect } from './spect.js';
import { ZeroOneMix, StereoMerger, StereoSplitter } from './utils.js';



const ctx = new AudioContext();
const dac = ctx.createGain();
let on = false;

dac.connect(ctx.destination);
const strt = document.createElement('span');
strt.classList.add('clickable');
strt.innerText = 'Start';
strt.onclick = () => {
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  if (on) {
    dac.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    strt.innerText = 'Start';
  } else {
    dac.gain.setTargetAtTime(0.1, ctx.currentTime, 0.5);
    strt.innerText = 'Stop';
  }
  on = !on;
}
document.body.append(strt);


const oscL = new Oscillator(ctx, 'sine', {freq: 100 });
const oscR = new Oscillator(ctx, 'triangle', {freq: 101.9 })


const LFO = new Oscillator(ctx, 'triangle', { freq : 0 });
LFO.connect(oscR);
LFO.gain.value = 100;

const merge = new StereoMerger(ctx);
const split = new StereoSplitter(ctx);

const nn = new RandomSource(ctx, 2, 16);
const gg = new GainNode(ctx, { gain: 400 });
nn.connect(gg);
gg.connect(oscL.inlet);
gg.connect(oscR.inlet);
gg.connect(LFO.inlet);



//oscR.connect(oscL);

oscL.connect(oscR);


oscL.connect(merge.L);
oscR.connect(merge.R);


// merge.connect(dac);

const filter = new BiquadFilterNode(ctx, {frequency: 1200, Q: 0.2 });

merge.connect(filter).connect(dac);
  
const LF02 = new Oscillator(ctx, 'triangle', {freq: 0.1});
LF02.gain.value = -800;
LF02.connect(filter.frequency);

dac.connect(split.inlet);
dac.gain.value = 0.1;

// const spect = new Spect(ctx, document.body, {mode: 'bars'});
// merge.connect(spect.inlet)

const scope = new Scope2D(ctx, document.body, {
  samples: 1024,
  mode: 'points',
  size: 400,

}); 

const oscope = new Scope(ctx, document.body, {
  samples: 1024,
  mode: 'points',
  size: 400,
});

scope.scaleX = 6;
scope.scaleY = 6;
oscope.scale = 6;

split.connect(oscope);
scope.pointSize = 4;

split.L.connect(scope.inlet);
split.R.connect(scope.inlet2);


const global = { ctx, merge, scope, dac, oscL, oscR };

Object.entries(global).forEach(keyVal => {
  window[keyVal[0]] = keyVal[1];
});