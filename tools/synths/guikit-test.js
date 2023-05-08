import { CTRL } from './ctrl.js';

const controls = document.createElement('div');
controls.className = 'control-area'
document.body.append(controls);
controls.style.width = '600px'
controls.style.padding = '0.5em';

const ctrl = new CTRL(controls);
window.ctrl = ctrl;

console.log(ctrl);

ctrl.onChange = update;



const obj = {
  a: 4,
  gain: 0,
  slide: 0,
  slide2: 0.2,
  crunch: 0.4,
  ww: 0.2,
  x: 0.4,
  y: 0.8,
  someMethod: function () {
    this.a += this.gain;
  },
  bro: true,
  yo: true,
  boolArr: [true, false, false, true],
  wave: function (phase, mod = 1, depth = 1) {
    const theta = 2 * Math.PI * phase;

    return 0.5 * Math.sin(theta + depth * Math.sin(theta * mod));
  },
  buffer: new Array(12).fill(0),
};



const btn = ctrl.button(obj, 'someMethod');
ctrl.append(btn);

const drg = ctrl.drag(obj, 'gain');
ctrl.append(drg);

const slide = ctrl.slider(obj, 'slide');
ctrl.append(slide);

const axis = ctrl.axis(obj, 'slide2', {direction: 'vertical', width: 20, height: 60, notchCount: 2});
ctrl.append(axis);

const dial = ctrl.dial(obj, 'crunch');
ctrl.append(dial);

const knob = ctrl.knob(obj, 'ww');
ctrl.append(knob);

const pad = ctrl.pad(obj, 'x', 'y');
ctrl.append(pad);

const res = 140;
const buff = new Array(res).fill(0).map((_, i) => {
  const phase = i / (res - 1);
  return obj.wave(phase, obj.x * 10, obj.y * 4);
});

const plot = ctrl.plot(obj, buff, {width: 140, strokeWidth: 4});
ctrl.append(plot);

const toggle = ctrl.toggle(obj, 'bro');
ctrl.append(toggle);

const bools = ctrl.boolArray(obj, 'boolArr', 8);
bools.forEach(x => ctrl.append(x));

const doodle = ctrl.doodle(obj, obj.buffer);
ctrl.append(doodle);




const textArea = document.createElement('div');



textArea.innerText = JSON.stringify(obj, null, '  ').replaceAll('"', '');
textArea.style.whiteSpace = 'pre';

document.body.append(textArea);

function update() {
  textArea.innerText = JSON.stringify(obj, null, '  ').replaceAll('"', '');
}

pad.onChange = () => {
  buff.forEach((_, i) => {
    const phase = i / (buff.length - 1);
    buff[i] = obj.wave(phase, obj.x * 10, obj.y * 4);
  });

  plot.render();
}

