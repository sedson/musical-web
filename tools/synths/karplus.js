import { Oscillator, CustomOscillator, PulseOscillator } from './oscillators.js';
import { Noise, RandomSource } from './noise.js';
// import { Scope } from './scope.js';
import { Scope, Scope2D } from './scopes.js';

import { Spect } from './spect.js';
import { Filter2, Filter, Filter3 } from './filters.js';
import { ZeroOneMix, StereoMerger, StereoSplitter } from './utils.js';



const ctx = new AudioContext();
const dac = ctx.createGain(0.5);
let on = false;

dac.connect(ctx.destination);
const strt = document.createElement('span');
strt.classList.add('clickable');
strt.innerText = 'Pluck';
strt.onclick = () => {
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  pluck();
  
}
document.body.append(strt);

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);


const noise = new Oscillator(ctx, 'sine');
const delay = new DelayNode(ctx);
const atten = new GainNode(ctx, {gain: 0.8});
const adder = new GainNode(ctx, {gain: 1});

const outline = new GainNode(ctx);

noise.connect(adder).connect(outline);
adder.connect(delay).connect(atten).connect(adder);

const filter = new Filter2(ctx, { freq: 10000 });
filter.resonance.value = 0.01;

const spect = new Spect(ctx, document.body);
spect.mode = 'bars';

outline.connect(filter.inlet).connect(dac);

const pitches = [mtof(40), mtof(42), mtof(47), mtof(42), mtof(40), mtof(42), mtof(51), mtof(47)];
let i = 0;

dac.connect(spect.inlet);
dac.gain.value = 0.1;

function pluck () {
  let f = pitches[i++ % pitches.length];
  let n = ctx.currentTime;
  let t = ctx.sampleRate / f / ctx.sampleRate;
  noise.sync();
  noise.frequency.setTargetAtTime(f, n, 0.001);
  let r = 1 * t;
  filter.frequency.setTargetAtTime(f * 30, n, 0.002)
  delay.delayTime.value = t;
  noise.gain.setTargetAtTime(1, n, 0.001);
  noise.gain.setTargetAtTime(0, n + r, 0.001);
  setTimeout(pluck, Math.random() * 20 + 140);
}

window.mtof = mtof
window.filter = filter
window.noise = noise;