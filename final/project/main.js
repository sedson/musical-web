import { CTRL } from '/tools/synths/ctrl.js'
import { Oscillator } from '/tools/synths/oscillators.js';
import { Noise, RandomSource } from '/tools/synths/noise.js'
import { Filter2, Filter3 } from '/tools/synths/filters.js'
import { Signal } from '/tools/synths/utils.js'
import { Patch } from './patch.js';
import { Distort, CheapVerb } from '/tools/synths/effects.js';


// -----------------------------------------------------------------------------
// UTILS
// -----------------------------------------------------------------------------
const lerp = (a, b, t) => {
  return a + (b - a) * t;
}


// Grab the 3D tools.
const { g, Gum } = gum;


const page  = document.body;


// Global state.
const orbs = [];

let globalSpin = 0;




const count = 20;
const GAIN = 0;
let on = false;
let drift = 0;
let frequency = 120;
let nScale = 1;
let timeStep = 1;

const colors = [
  g.color('#fde'),
  g.color('#591c27'),
  g.color('#00f'),
];





// -----------------------------------------------------------------------------
// 3D SETUP
// -----------------------------------------------------------------------------

// Setup Gum3D.
const app = new Gum('#canvas', 1080, 1080, { scale: 1 });

// Set custom shaders.
app.vert = document.getElementById('vert').innerText.trim();
app.frag = document.getElementById('frag').innerText.trim();

// Turn on the chromatic effect.
app.addEffect();

// Make the geometry objects.
const plane = g.shapes.grid(1, 60)
  .fill(colors[1]).render();

const sphere = g.shapes.cube(0.03)
  .fill(colors[2]);


const planeMeshId = app.addMesh(plane);
const sphereMeshId = app.addMesh(sphere);


let groundNode = app.node('ground');
groundNode.geometry = planeMeshId;
groundNode.uniform('uParticleNoise', 0);
groundNode.uniform('uNoise', 1);

// Camera
const spin = app.node('turntable');
app.camera.move(-8, 4, 0);
app.camera.fov = 9;


// Start at a random time.
let time = Math.random() * 10000;



// groundNode.setParent(spin);






// Hide the scene graph
app.sceneGraph.style.display = 'none';
document.getElementById('swatches').style.display = 'none';





// -----------------------------------------------------------------------------
// SOUND 
// -----------------------------------------------------------------------------
const ctx = new AudioContext();
const dac = ctx.createGain({ gain: 0 });


const GLOBAL = {
  gain: 0.3,
  verb: 0.1,
  dist: 0.1,
};


const reverb = new CheapVerb(ctx);
const dist = new Distort(ctx);
const vol = new GainNode(ctx, {gain: 0.3});

dac.connect(reverb.inlet);
reverb.outlet.connect(dist.inlet);
dist.outlet.connect(vol);
vol.connect(ctx.destination);


const globalCtrl = new CTRL(document.querySelector('.global-controls'));
const masterVol = globalCtrl.axis(GLOBAL, 'gain', { direction: 'vertical', notchCount: 2, width: 40, height: 140 });
masterVol.element.style.backgroundColor = 'darkgoldenrod';
masterVol.element.style.borderRadius = '20px';


globalCtrl.append(
  globalCtrl.axis(GLOBAL, 'verb', { direction: 'vertical', notchCount: 2, width: 40, height: 140 }),
  globalCtrl.axis(GLOBAL, 'dist', { direction: 'vertical', notchCount: 2, width: 40, height: 140 }),
  masterVol,
);

globalCtrl.onChange = () => {
  reverb.mix.setTargetAtTime(GLOBAL.verb, 0, 0.1);
  dist.mix.setTargetAtTime(GLOBAL.dist, 0, 0.1);
  vol.gain.setTargetAtTime(GLOBAL.gain, 0, 0.1);
}

globalCtrl.onChange();


// dac.connect(ctx.destination);

const resume = () => {
  if (ctx.state === 'suspended') {
    ctx.resume();
    dac.gain.value = 0;
    dac.gain.setTargetAtTime(1, 0, 0.2);
  }
}

const ROOT = {
  freq: 220,
  signal: new Signal(ctx, 220),
};



// -----------------------------------------------------------------------------
// NOISE FIELD 
// -----------------------------------------------------------------------------
const NOISE = {
  gain: 0.1,
  cutoff: 0.1,
  rate: 0.1,
  spin: 0.5,
};


const noiseSource   = new Noise(ctx, 2);
const randSource    = new RandomSource(ctx, 1, 8);
const noiseLFO      = new Oscillator(ctx, 'sine', { freq: 0 });
const noiseDrone    = new Oscillator(ctx, 'sine', {freq: 0});
const noiseFilter   = new Filter3(ctx, { freq: 1200 });
const div4          = new GainNode(ctx, { gain: 0.25 });


ROOT.signal.connect(div4).connect(noiseDrone.frequency);
// randSource.connect(noiseDrone.frequency);

noiseSource.connect(noiseFilter).connect(dac);
noiseDrone.connect(noiseFilter).connect(dac);
noiseSource.connect(noiseDrone.frequency);

noiseLFO.connect(noiseFilter.frequency);
noiseLFO.gain.value = 300;

const noiseCtrl = new CTRL(document.querySelector('.noise-controls'));

noiseCtrl.append(
  noiseCtrl.axis(NOISE, 'gain', {notchCount: 2}),
  noiseCtrl.pad(NOISE, 'rate', 'cutoff'),
);

noiseCtrl.onChange = function () {
  resume();
  noiseSource.gain.setTargetAtTime(NOISE.gain * 0.03, 0, 0.1);
  noiseDrone.gain.setTargetAtTime(NOISE.gain * 0.5, 0, 0.1);

  randSource.gain.setTargetAtTime(lerp(0, -50, NOISE.rate), 0, 0.1);
  randSource.speed.setTargetAtTime(lerp(0.0, 4, NOISE.rate), 0, 0.1);

  noiseFilter.frequency.setTargetAtTime(lerp(400, 4000, NOISE.cutoff), 0, 0.1);
  noiseFilter.resonance.setTargetAtTime(lerp(0, 4, NOISE.cutoff), 0, 0.1);

  noiseLFO.frequency.setTargetAtTime(lerp(0, 0.4, NOISE.rate), 0, 0.1);

  nScale = NOISE.cutoff * 12 + 1;
  drift  = NOISE.gain;
};

noiseCtrl.onChange();





// -----------------------------------------------------------------------------
// PLUCKS
// -----------------------------------------------------------------------------
const PLUCKS = {
  scale: new Array(12).fill(false),
  particles: [],
  modBuffer: new Float32Array(16),
  noteLength: 0.2,
  speed: 0.5,
  spin: 0.5,
};
PLUCKS.modBuffer[1] = 0.4;
PLUCKS.scale[0] = true;


const voiceCount = 16;
const voices = [];
let voiceIndex = 0;


const getClosest = (i, boolArray) => {
  const len = boolArray.length;

  if (boolArray[i % len] === true) {
    console.log('A', i)
    return i;
  }

  for (let j = 0; j < len / 2; j++) {
    if (boolArray[(i - j + len) % len] === true) {
      return i - j;
    } else if (boolArray[(i + j) % len] === true) {
      return i + j;
    }
  }
  return null;
}

const getPitch = (ref, octave) => {
  const closest = getClosest(ref, PLUCKS.scale);
  if (closest !== null) {
    const m = closest + (octave * PLUCKS.scale.length);
    return 220 * Math.pow(2, (m) / PLUCKS.scale.length);
  }
  return 0;
}


// MAKE THE POLYPHONIC VOICES
for (let i = 0; i < voiceCount; i++) {
  const voice = new Patch(ctx, 'sine', { freq: 440 });
  voice._modCurve = PLUCKS.modBuffer;
  const gainNode = new GainNode(ctx, { gain: 2 / voiceCount });
  voice.connect(gainNode).connect(dac); 
  voices.push(voice);

}



PLUCKS.spawn = () => {
  const particle = app.node();
  particle.uniform('uNoise', 0);
  particle.uniform('uParticleNoise', 1);

  particle.setParent(spin);
  particle.note = Math.floor(Math.random() * (PLUCKS.scale.length - 1));
  particle.octave = 0;

  particle.timeScale = Math.random() * 0.5 + 0.5;
  const type = Math.random(); 

  if (type < 0.3) {
    particle.scale(2)
    particle.timeScale *= 0.5;
    particle.octave = -1;
  } else if (type < 0.6) {
    particle.timeScale *= 1.5;
    particle.scale(0.5);
    particle.octave = 2;
  }

  particle.time = Math.PI;

  particle.glow = 0;
  particle.rotate(Math.random() * 360, 0, Math.random() * 360);

  const theta = Math.random() * 2 * Math.PI;
  const rad = Math.random() * 0.3 + 0.1;
  const x = Math.cos(theta) * rad;
  const z = Math.sin(theta) * rad;
  const y = Math.sin(particle.time) * 0.2;

  particle.sign = Math.sign(1);


  particle.move(x, y, z);
  particle.geometry = sphereMeshId;
  
  PLUCKS.particles.push(particle);
}

let H = 0;


PLUCKS.play = (note, octave, pan) => {
  const pitch = getPitch(note, octave);
  if (pitch === 0) { return; }
  

  if (voices[voiceIndex % voiceCount].triggerDone) {
    voices[voiceIndex % voiceCount].outlet.pan.value = pan;
    voices[voiceIndex % voiceCount].trigger(pitch);
    voiceIndex ++;
  }


}


PLUCKS.clear = () => {
  PLUCKS.particles.forEach(p => {
    p.visible = false;
  });
  PLUCKS.particles = [];
}


const pluckCtrl = new CTRL(document.querySelector('.pluck-controls'));


pluckCtrl.append(
  ...pluckCtrl.boolArray(PLUCKS, 'scale', PLUCKS.scale.length),
  pluckCtrl.doodle(PLUCKS, PLUCKS.modBuffer, {polarity: 'unipolar'}),
  pluckCtrl.axis(PLUCKS, 'noteLength', {notchCount: 2}),
  pluckCtrl.knob(PLUCKS, 'speed'),
  pluckCtrl.knob(PLUCKS, 'spin'),
  pluckCtrl.button(PLUCKS, 'spawn'),
  pluckCtrl.button(PLUCKS, 'clear'),


);

pluckCtrl.onChange = () => {
  resume();
  for (const voice of voices) {
    voice._noteLength = lerp(0.2, 3, PLUCKS.noteLength);
  }
  timeStep = lerp(0.5, 10, PLUCKS.speed);
  PLUCKS.modBuffer[0] = 0;
  PLUCKS.modBuffer[PLUCKS.modBuffer.length - 1] = 0;
  globalSpin = lerp(-1, 1, PLUCKS.spin);

}
pluckCtrl.onChange();























// const filt = new Filter3(ctx, { freq: 12000 });
// const compress = new DynamicsCompressorNode(ctx);

// compress.threshold.value = 12;
// compress.ratio.value = 0.1;


// dac.connect(filt.inlet);
// filt.connect(ctx.destination);



// const rand = new RandomSource(ctx, 0.1, 8);
// // console.log(rand);
// rand.gain.value = 0;
// rand.speed.value = 0.1;
// const root = new Oscillator(ctx, 'sine', { freq: 60 });
// root.gain.value = 0.1;
// // root.connect(dac);
// root.detune.value = -1200;

// rand.connect(root.frequency);
// const noiseOsc = new Noise(ctx, 2, 16);

// noiseOsc.gain.value = 0;


// for (let i = 0; i < count; i++) {
//   const delta = 0.1 * (i - (count / 2) / (count / 2));
//   const v = new Oscillator(ctx, 'sine', { freq: 60 * (i + 1) });
//   v.gain.value = 1 / ( count );

//   const panner = new StereoPannerNode(ctx, {});
//   const gain = new GainNode(ctx);

//   // v.connect(gain).connect(panner).connect(dac);

//   // v.odd.value = Math.random();
//   noiseOsc.connect(v.frequency);
//   rand.connect(v.frequency);

//   // const v = new Oscillator(ctx, 'sawtooth', { freq: 200 });


//   // v.even.value = Math.random();
//   voices.push([v, panner, gain]);
// }






// const scale = ctrl.boolArray(state, 'scale', 12);
// scale.forEach(x => ctrl.append(x));

// const gainSlider = ctrl.slider(state, 'gain', { direction: 'vertical', width: 10, height: 120 });
// ctrl.append(gainSlider);


// const spreadKnob = ctrl.pad(state, 'spread', 'noise', { width: 120, height: 120 });



// ctrl.append(spreadKnob);

// ctrl.onChange = function () {
//   if (ctx.state === 'suspended') ctx.resume();
//   dac.gain.setTargetAtTime(state.gain, 0, 0.1)

//   drift = state.spread;
//   for (let i = 0; i < count; i++) {
//     const delta = ((i + 1) - (count / 2)) / (count / 2);
//     // voices[i][0].detune.setTargetAtTime(delta * state.spread * i * 40, 0, 0.1);
//   }

//   noiseOsc.gain.setTargetAtTime((state.noise) *  300, 0, 0.1);
//   nScale = state.noise * 12 + 1;
// }




// -----------------------------------------------------------------------------
// DRAW LOOP 
// -----------------------------------------------------------------------------
function draw (delta) {
  app.background(colors[0]);
  groundNode.uniform('uGlow', 0);

  orbs.forEach((o, n) => {
    o.transform.rotation.y += o.rval * 0.2 * drift;

    if (voices[n]) {
      const [x, y, z] = o.children[0].worldPosition;
      // console.log(pos);

      const dist = Math.sqrt(x * x + z * z);
      const atten = g.clamp(1 - (dist / 0.3));

      voices[n][2].gain.setTargetAtTime(atten, 0, 0.1);

      const dot = dist !== 0
        ? 0 * (x / dist) + 1 * ( z / dist)
        : 0;

      voices[n][1].pan.setTargetAtTime(dot, 0, 0.1);


      // voices[n][1].positionX.setTargetAtTime(x, 0, 0.01);
      // voices[n][1].positionY.setTargetAtTime(y, 0, 0.01);
      // voices[n][1].positionZ.setTargetAtTime(z, 0, 0.01);

    }
  })

  time += 0.1 * delta * globalSpin;


  PLUCKS.particles.forEach(p => {
    p.time += 0.05 * timeStep * p.timeScale * delta;

    let y = 0.5 * Math.sin(p.time) + 0.5;
    y = 1 - Math.pow(1 - y, 2);
    y = y * 2 - 1;
    p.transform.position.y = y * 0.1;

    const sign = Math.sign(p.transform.position.y);

    const [x, _, z] = p.worldPosition;
    p.uniform('uX', x);
    p.uniform('uZ', z);

    p.uniform('uGlow', p.glow);

    const dist = Math.sqrt(x * x + z * z);

      const dot = dist !== 0
        ? 0 * (x / dist) + 1 * ( z / dist)
        : 0;





    if (sign !== 0 && sign !== p.sign) {
      PLUCKS.play(p.note, p.octave, dot);
      p.glow = 1;
    } else {
      p.glow *= 0.9;
    }

    p.sign = sign;
  });


  app.renderer.uniform('time', time);
  app.renderer.uniform('drift', drift + 0.05);
  app.renderer.uniform('nScale', nScale);

  app.drawScene();




  // org.transform.rotation.y += drift * -0.01;

  spin.rotate(0,  1 * time, 0);
}



// // Run the app.
app.run(() => {}, draw);

const globals = { ctx, app, ROOT, PLUCKS, voices, g, noiseCtrl, getPitch };
for (const [key, obj] of Object.entries(globals)) {
  window[key] = obj;
}

