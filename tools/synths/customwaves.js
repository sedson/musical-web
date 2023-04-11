import { Oscillator, CustomOscillator, PulseOscillator } from './oscillators.js';
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


const oscL = new Oscillator(ctx, 'sine', {freq: 100 });

const fn = n => 
  n > 0 && ( n - 1 ) % 4 === 0
    // ? 1 / Math.pow(n, 1.2)
    ? Math.random() / Math.pow(n, 1)
    : 0;

const oscR = new CustomOscillator(ctx, fn, n => 0, { freq: 100.1, terms: 1024 })



const merge = new StereoMerger(ctx);
const split = new StereoSplitter(ctx);


oscL.connect(merge.L);
oscR.connect(merge.R);


merge.connect(dac);
dac.connect(split.inlet);
dac.gain.value = 0.2;


const scope = new Scope2D(ctx, document.body, {
  samples: 1024,
  mode: 'line',
  size: 400,

}); 

const oscope = new Scope(ctx, document.body, {
  samples: 1024,
  mode: 'line',
  size: 400,
});

const spect = new Spect(ctx, document.body);


scope.scaleX = 4;
scope.scaleY = 4;
oscope.scale = 4;

split.connect(oscope);
split.connect(spect);
scope.pointSize = 4;

split.L.connect(scope.inlet);
split.R.connect(scope.inlet2);




const global = { ctx, merge, scope, dac, oscL, oscR };

Object.entries(global).forEach(keyVal => {
  window[keyVal[0]] = keyVal[1];
});