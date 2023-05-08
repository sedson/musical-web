import { Oscillator, CustomOscillator, PulseOscillator } from './oscillators.js';
import { Noise, RandomSource } from './noise.js';
import { Scope, Scope2D, Spect } from './scopes.js';
import { ZeroOneMix, StereoMerger, StereoSplitter } from './utils.js';
import { Filter, Filter2, Filter3, FeedbackCombFilter, FeedforwardCombFilter } from './filters.js';
import { Distort, Vocalizer } from './effects.js';




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



const noise = new Noise(ctx, 4);
const sqr = new Oscillator(ctx, 'sawtooth', {freq: 120 });
const sine = new Oscillator(ctx, 'sawtooth', {freq: 120 });

sqr.scale(1);
// sqr.width.value = 0.4;

const dist = new Distort(ctx);
dist.mix.value = 1;
// sqr.connect(dist);
// noise.connect(dist);





noise.gain.value = 0.3;
dac.gain.value = 0.1;


const oscope = new Scope(ctx, document.body, {
  samples: 2048,
  mode: 'points',
  size: 400,
});

const spect = new Spect(ctx, document.body);


oscope.scale = 1;


const filter = new Filter3(ctx, { freq: 1200, type: 'lowpass' });
// const filter = new FeedforwardCombFilter(ctx);

filter.resonance.value = 0;

const LFO = new Oscillator(ctx, 'sine', {freq: 0.1});
LFO.gain.value = 60;
LFO.connect(filter.frequency);

spect.mode = 'bars';


const voc = new Vocalizer(ctx);
voc.mix.value = 1;

const vowels = 'ee oo a i u e'.split(' ');
let i = 0;
const talk = () => {
  const v = vowels[i % vowels.length];
  i++;
  voc.mouth(v, 0.04);
  sqr.frequency.setValueAtTime(400, 0);
  sine.frequency.setValueAtTime(400, 0);

  sqr.frequency.setTargetAtTime(300, 0, 0.01);
  sine.frequency.setTargetAtTime(300, 0, 0.01);


  setTimeout(talk, 800);
}
talk();


sine.connect(voc);
sqr.connect(voc);
// noise.connect(voc);

voc.connect(dist).connect(dac);

// noise.connect(filter);
// sine.connect(filter);
// sqr.connect(filter).connect(dist).connect(dac);
dac.connect(oscope.inlet);
dac.connect(spect.inlet);

// split.L.connect(scope.inlet);
// split.R.connect(scope.inlet2);




const global = { ctx, filter, dist, voc, sqr };

Object.entries(global).forEach(keyVal => {
  window[keyVal[0]] = keyVal[1];
});