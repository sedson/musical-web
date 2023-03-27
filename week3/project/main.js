const page = document.body;
const audio = new Audio();


/**
 * Take a param from a synth patch a make a slider for it.
 */ 
function sliderFromParam (name, param) {

  const container = create({
    tag: 'div',
    className: 'param-container flex-row',
  });

  const label = create({
    tag: 'p',
    className: 'param-label',
    innerText: name,
  });

  const min = create({
    tag: 'p',
    className: 'saram-min',
    innerText: param.min,
  });

  const max = create({
    tag: 'p',
    className: 'param-max',
    innerText: param.max,
  });

  const val = create({
    tag: 'p', 
    className: 'param-value',
    innerText: param.value,
  })

  const slider = create({
    tag: 'input',
    type: 'range',
    className: 'param-slider',
    step: 0.001,
    min: 0,
    max: 1,
    value: param.valueN(),
  });

  slider.oninput = ({target}) => {
    valueN = target.valueAsNumber;
    param.setN(valueN);
    val.innerText = param.value.toFixed(2);
  }

  container.append(label, val, slider);
  return container;
}


/**
 * 
 */
function notePicker () {
  const data = {
    octave: 0,
    selected: [],
  }
  data.random = () => data.selected[Math.floor(Math.random() * data.selected.length)];

  const container = create({
    tag: 'div',
    className: 'key-container'
  });

  const notes = 'c c# d d# e f f# g g# a a# b'.split(' ');

  for (let i = 0; i < 12; i++) {
    const note = create({
      className: 'key',
      innerText: notes[i].includes('#') ? '' : notes[i],
    });
    
    if (notes[i % 11].includes('#')) {
      note.classList.add('sharp');
    }

    note.dataset.midi = 60 + i;
    note.onclick = () => {
      if (note.classList.contains('selected')) {
        data.selected = data.selected.filter(n => n !== note.dataset.midi);
        note.classList.remove('selected');
        return;
      }

      data.selected.push(note.dataset.midi);
      note.classList.add('selected');
    }

    container.append(note);
  }

  return [ data, container ];
} 





function synth (constructor, settings) {

  const patch   = new constructor(audio.ctx, settings.shape, settings.shape2);
  const trigger = new Envelope(audio.ctx, ...settings.adsr);

  trigger.connect(patch.carrier.gain);

  const container = create({
    tag: 'div',
    className: 'osc-container',
  });
  container.style.backgroundColor = settings.color;

  const [noteData, notes] = notePicker();

  const button = create({
    tag: 'button',
    className: 'player-button'
  });

  const retrigger = (delay) => {
    console.log('retrigger', delay);
    let randomNote = noteData.random();
    console.log({randomNote})

    if (randomNote) {
      let randomOctave = 12 * (Math.floor(Math.random() * 3) - 1);
      let freq = mtof(parseInt(randomNote) + randomOctave + settings.offset);
      patch.param('freq', freq);
      trigger.attack(settings.hold);
    }

    if (button.dataset.playing === 'true') {
      setTimeout(() => retrigger(delay), delay);
    }
  }

  button.onclick = () => {
    if (audio.ctx.state = 'suspended') audio.ctx.resume();


    if (button.dataset.playing === 'true') {
      container.classList.remove('playing');
      button.dataset.playing = false;
    } else {
      container.classList.add('playing');
      button.dataset.playing = true;
      retrigger(settings.delay);
    }
  };

  const row = create({
    className: 'flex-row'
  })
  row.append(button, notes);
  container.append(row);

  for (const [name, param] of Object.entries(patch.params)) {
    container.append(sliderFromParam(name, param));
    



  }


  page.append(container);

  return {patch}
}







const a = synth(FmPatch, {
  shape1: 'sine', 
  shape2: 'sine',
  adsr: [0.05, 0.05, 0.1, 0.1],
  hold: 0.01,
  delay: 0.25 * 1000,
  offset: 0,
});

const b = synth(FmPatch, {
  shape1: 'square', 
  shape2: 'sawtooth',
  adsr: [0.1, 0.01, 0.8, 2],
  hold: 1,
  delay: 0.25 * 1000,
  offset: 0,
  offset: -24,
});










