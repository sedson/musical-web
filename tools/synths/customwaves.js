import { Oscillator, CustomOscillator, PulseOscillator, SuperOscillator, WarpOscillator } from './oscillators.js';
import { Noise, RandomSource } from './noise.js';
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


// const oscL = new Oscillator(ctx, 'sine', {freq: 100 });

const fn = n => 
  n > 0 && ( n - 1 ) % 2 === 0
    // ? 1 / Math.pow(n, 1.2)
    ? 1 / Math.pow(n, 1)
    : 0;

const fn2 = n => 
  n > 0 && ( n - 1 ) % 2 === 0
    // ? 1 / Math.pow(n, 1.2)
    ? 1 / Math.pow(n, 1.5)
    : 0;

// const oscR = new CustomOscillator(ctx, fn, n => 0, { freq: 150, terms: 128 })
// const oscL = new CustomOscillator(ctx, fn, n => 0, { freq: 150, terms: 128 })


const oscR = new WarpOscillator(ctx, { freq: 120 });
const oscL = new WarpOscillator(ctx, { freq: 120.1 });
// const oscR = new Oscillator(ctx, 'triangle', { freq: 440 });
// const oscL = new Oscillator(ctx, 'triangle', { freq: 440 });


// const oscL = new WarpOscillator(ctx, { freq: 122 });

// oscR.odd.value = 1;
// oscR.even.value = 0.5;

// oscL.odd.value = 1;
// oscL.even.value = 0.5;




const LFO = new Oscillator(ctx, 'sine', {freq: 0.4 });
const LFO2 = new Oscillator(ctx, 'sine', {freq: 0.12 });

// setTimeout(() => LFO.connect(oscL.inlet), 1000);
LFO.gain.value = 40;
// LFO2.connect(oscL.frequency);


const merge = new StereoMerger(ctx);
const split = new StereoSplitter(ctx);


oscL.connect(merge.L);
oscR.connect(merge.R);


// merge.connect(dac);
oscR.connect(dac);

// oscR.connect(split.inlet);
dac.gain.value = 0.2;


const scope = new Scope2D(ctx, document.body, {
  samples: 1024,
  mode: 'line',
  size: 400,

}); 

const oscope = new Scope(ctx, document.body, {
  samples: 1024,
  mode: 'line',
  size: 600,
});

const spect = new Spect(ctx, document.body);
spect.mode = 'bars';


scope.scaleX = 0.7;
scope.scaleY = 0.7;
oscope.scale = 0.7;

oscR.connect(oscope);
oscR.connect(spect);
scope.pointSize = 4;

oscL.connect(scope.inlet);
oscR.connect(scope.inlet2);




const global = { ctx, merge, dac, oscR, oscL };

Object.entries(global).forEach(keyVal => {
  window[keyVal[0]] = keyVal[1];
});