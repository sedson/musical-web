import { Oscillator, CustomOscillator, PulseOscillator } from './oscillators.js';
import { Noise, RandomSource } from './noise.js';
import { Scope } from './scope.js';
import { Spect } from './spect.js';
import { ZeroOneMix } from './utils.js';





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
    dac.gain.setTargetAtTime(1, ctx.currentTime, 0.5);
    strt.innerText = 'Stop';
  }
  on = !on;
}
document.body.append(strt);


const arr = new Array(200).fill(0);
const REAL = arr.map((x, n) => {
  return n === 0 
    ? 0 
    // : (2 / (Math.PI * n)) * Math.pow(-1, n + 1); // SAWTOOTH
    // : (8 * Math.sin(n * Math.PI / 2)) / Math.pow(Math.PI, 2)
    // : Math.random() * 2 - 1
    : 0
});
const IMAG = arr.map((x, n) => {
  return (n > 0) && (n - 1) % 2 === 0 
    ? 1 / Math.pow(n, 1)
    // : (2 / (Math.PI * n)) * Math.pow(-1, n + 1); // SAWTOOTH
    // : (8 * Math.sin(n * Math.PI / 2)) / Math.pow(Math.PI, 2)
    : 0;

});

console.log({REAL, IMAG})


// const osc2 = new PulseOscillator(ctx, REAL, IMAG);
const osc2 = new Oscillator(ctx, 'sine');

const osc1 = new PulseOscillator(ctx, 'sawtooth');
// const osc2 = new CustomOscillator(ctx, REAL, IMAG);

const ns = new RandomSource(ctx, 2, 16);
const ns2 = new Noise(ctx, 2);




osc1.gain.value = 0.4;
osc2.gain.value = 0.4;


osc1.frequency.value = 100;
osc2.frequency.value = 100;

ns.connect(osc2.frequency)
ns.connect(osc1.frequency)

const LFO = new Oscillator(ctx, 'sine');
LFO.frequency.value = 0.1;
LFO.gain.value = 0.9;
LFO.connect(osc1.width);

ns.param('gain', 400)
// ns.connect(osc1.width);


ns2.connect(osc1.inlet);
ns2.connect(osc2.inlet);
osc2.connect(osc1.inlet);
ns2.gain.value = 30;

const filter = new BiquadFilterNode(ctx);
const filter2 = new BiquadFilterNode(ctx);

filter.frequency.value = 6000;
filter2.frequency.value = 20000;


osc1.connect(filter).connect(filter2);
osc2.connect(osc1.frequency)
// filter2.connect(dac);

// ns.connect(filter.frequency);
// LFO.connect(filter.frequency);

const scope2 = new Scope(ctx, document.body);


const scope = new Scope(ctx, document.body);
dac.connect(scope.inlet);
const spect = new Spect(ctx, document.body, {mode: 'bars'});
dac.connect(spect.inlet);



const tri = new PulseOscillator(ctx);
tri.frequency.value = 100;

const sine = new Oscillator(ctx, 'sine');
sine.frequency.value = 200;

const mixer = new ZeroOneMix(ctx);
const g = new GainNode(ctx);
mixer.connect(dac);
g.gain.value = 0.4
mixer.connect(g);;

tri.connect(mixer)
sine.connect(mixer.inlet2)
g.connect(scope2.inlet);


const global = { ctx, osc1, osc2, ns, scope, spect, LFO, mixer };

Object.entries(global).forEach(keyVal => {
  window[keyVal[0]] = keyVal[1];
});