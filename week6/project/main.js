import { Oscillator, SuperOscillator } from '/tools/synths/oscillators.js';
import { GuiKit } from '/tools/synths/guikit.js'
import { Noise, RandomSource } from '/tools/synths/noise.js'
import { Filter2 } from '/tools/synths/filters.js'


const page = document.body;
const panel = document.querySelector('.controls');


// Global state.
const orbs = [];
const voices = [];
const count = 10;
const GAIN = 0;
let on = false;
let drift = 0;
let frequency = 120;
let nScale = 1;


// -----------------------------------------------------------------------------
// 3D SETUP
// -----------------------------------------------------------------------------

// Setup Gum3D.
const { g, Gum } = gum;
const app = new Gum('#canvas', 1200, 1200, { scale: 0.5 });

// Set custom shaders.
app.vert = document.getElementById('vert').innerText.trim();
app.frag = document.getElementById('frag').innerText.trim();

// Turn on the chromatic effect.
app.addEffect();



// Colors
const bg    = g.color('#f0f8ff');
const colA  = g.color('apricotyellow');
const colB  = g.color('green');
const colC  = g.color('rgb(30, 80, 33)');


// Sphere geometry.
let sphere = g.shapes.icosphere(0.3, 2, false);

// Start at a random time.
let time = Math.random() * 10000;

// The orgainism.
let org = app.node('org');
org.geometry = app.addMesh(g.shapes.icosphere(0.6, 2, false).fill(colC));


const spin = app.node('turntable');
app.camera.setParent(spin);

// Random fns: -1->1 and 0->360
let r = () => Math.random() * 2 - 1;
let r2 = () => Math.random() * 360;

// Loop to make little orbs.
for (let i = 0; i < count; i++) {
  // Blend the colors.
  let col = colA.blend(colB,   i / count, 'hsl');

  // Make the orb.
  let orb = app.node(i + '');
  orb.geometry = app.addMesh(sphere.fill(col));

  // Make a root node to control rotation.
  const orbRoot = app.node('root-' + i);
  orbRoot.rotate(r2(), r2(), r2());
  orb.setParent(orbRoot);

  // Set some random value on each orb.
  orbRoot.rval = r();

  orb.move(0, Math.random() * 0.3 + 0.2, 0);
  
  orbs.push(orbRoot);
  orbRoot.setParent(org);
}

  app.camera.move(5, 2, 5);
  app.camera.fov = 15;


function draw (delta) {
  app.background(bg);
  app.drawScene();

  orbs.forEach((o, n) => {
    o.transform.rotation.y += o.rval * 0.2 * drift;
  })

  time += 0.05 * delta;


  app.renderer.uniform('time', time);
  app.renderer.uniform('drift', drift);
  app.renderer.uniform('nScale', nScale);





  org.transform.rotation.y += drift * -0.01;

  spin.rotate(0, 0.1 * time, 0);
}


// Hide the scene graph
app.sceneGraph.style.display = 'none';





// -----------------------------------------------------------------------------
// SOUND 
// -----------------------------------------------------------------------------

// Set up the audio context.
const ctx = new AudioContext();
const dac = ctx.createGain();

dac.gain.value = 0.4;

const filt = new Filter2(ctx, { frequency: 16000 });
dac.connect(filt.inlet).connect(ctx.destination);
window.ctx = ctx;


const strt = document.getElementById('start');
strt.onclick = () => {
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  if (on) {
    dac.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    strt.innerText = 'Start';
  } else {
    dac.gain.setTargetAtTime(0.4, ctx.currentTime, 0.5);
    strt.innerText = 'Stop';
  }
  on = !on;
}

// const rand = new RandomSource(ctx, 0.2, 8);
// console.log(rand);
// rand.gain.value = 500;
// rand.speed.value = 0.2;

// root.connect(dac);

// rand.connect(root.frequency);
const noiseOsc = new Noise(ctx, 2);

noiseOsc.gain.value = 0;


for (let i = 0; i < count; i++) {
  const delta = 0.1 * (i - (count / 2) / (count / 2));
  const v = new Oscillator(ctx, 'sawtooth', { freq: 200 + delta * drift});
  v.gain.value = 1 / ( count );
  v.connect(dac);
  // v.odd.value = Math.random();
  noiseOsc.connect(v.frequency);

  // v.even.value = Math.random();
  voices.push(v);
}



const gk = new GuiKit(panel);
const slide1 = gk.slidebox();


slide1.link(val => {
  drift = val;
  for (let i = 0; i < count; i++) {

    const delta = 0.1 * (i - (count / 2) / (count / 2));
    voices[i].frequency.setTargetAtTime(120 + delta * drift * 10, 0, 1);
  }
});

{
  const label = document.createElement('div');
  label.classList.add('label');
  label.innerText = 'SPREAD';


  panel.append(label);
  panel.append(document.createElement('br'))
}

const slide2 = gk.slidebox();

{
  const label = document.createElement('div');
  label.classList.add('label');
  label.innerText = 'NOISE';


  panel.append(label);
  panel.append(document.createElement('br'))
}






slide2.link(val => {
  noiseOsc.gain.setTargetAtTime(val * 400, 0, 0.1);
  nScale = val * 20 + 1;
})





// Run the app.
app.run(() => {}, draw);

