import { CTRL } from './ctrl.js';

const controls = document.createElement('div');
controls.className = 'control-area'
document.body.append(controls);
controls.style.width = '200px'
controls.style.padding = '0.5em';

const ctrl = new CTRL(controls);
window.ctrl = ctrl;

console.log(ctrl);

ctrl.onChange = update;



const obj = {
  a: 4,
  gain: 0,
  fear: 1,
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
};


const btn = ctrl.button(obj, 'someMethod');
ctrl.append(btn);

const drg = ctrl.drag(obj, 'gain');
ctrl.append(drg);

const slide = ctrl.slider(obj, 'fear');
ctrl.append(slide)

const dial = ctrl.dial(obj, 'crunch');
ctrl.append(dial);

const knob = ctrl.knob(obj, 'ww');
ctrl.append(knob);

const pad = ctrl.pad(obj, 'x', 'y');
ctrl.append(pad);

const toggle = ctrl.toggle(obj, 'bro');
ctrl.append(toggle);

const bools = ctrl.boolArray(obj, 'boolArr', 4);
bools.forEach(x => ctrl.append(x));



const textArea = document.createElement('div');



textArea.innerText = JSON.stringify(obj, null, '  ').replaceAll('"', '');
textArea.style.whiteSpace = 'pre';

document.body.append(textArea);

function update() {
  textArea.innerText = JSON.stringify(obj, null, '  ').replaceAll('"', '');
}

