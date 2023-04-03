const page = document.body;
const flex = document.getElementById('main');
const audio = new Audio();


const file = './scores/score1.txt';


let player = {
  notes: [],
  clock: 250,
  patterns: {},
  voices: [],
};


const scoreArea = create ({
  tag: 'textarea',
  className: 'composer',
  wrap: 'soft',
  rows: 20,
  cols: 60,
});

const startButton = create({
  tag: 'button',
  innerText: 'play',
  onclick: () => {
    applyScore();
  }
});


window.addEventListener('keydown', e => {
  if (e.key === 'e' && e.metaKey) {
    applyScore();
  }
})



let v1 = {
  voice: new FmPatch3(audio.ctx, 'sawtooth', 'sawtooth'),
  offset: -12,
}

let v2 = {
  voice: new FmPatch3(audio.ctx, 'square', 'sine'),
  offset: 0,
}

let v3 = {
  voice: new FmPatch3(audio.ctx, 'triangle', 'square'),
  offset: 12,
}

let globalVoices = [ v1, v2, v3 ];



flex.append(scoreArea, startButton);


function applyScore () {
  if (audio.ctx.state === 'suspended') audio.ctx.resume();

  const score = parseScore(scoreArea.value);
  console.log(score);

  player.patterns = {};
  player.voices = [];

  for (let op of score) {
    if (op.operator === 'notes') {
      player.notes = op.arguments;
    }

    if (op.operator === 'pattern') {
      player.patterns[op.label] = op.arguments;
    }

    if (op.operator === 'clock') {
      player.clock = op.arguments[0];
    }

    if (op.operator === 'voice') {
      player.voices.push(op.arguments);
    }
  }
  console.log(player);



  player.voices.forEach((voice, idx) => {
    let synth = globalVoices[idx % globalVoices.length];

    for (let i = 0; i < voice.length; i++) {
      let pattern = false;
      let pat = voice[i];
      if (pat === 'rest') continue;

      if (pat.includes('pattern')) {
        let label = pat.split('.').pop();
        if (player.patterns[label]) {
          pattern = player.patterns[label]
        }
      }

      if (pat === 'rand') {
        let patNames = Object.keys(player.patterns);
        let randomName = patNames[Math.floor(Math.random() * patNames.length)];
        pattern = player.patterns[randomName];
      }

      if (pattern) {
        patternToSynth(synth, player.clock, pattern, player.notes, i * player.clock);
      }
    }





  });


}


function patternToSynth (synth, clock, pattern, scale, offset) {
  console.log(synth, clock, pattern, scale, offset)

  let speed = 1;

  for (let item of pattern) {
    if (typeof item === 'object' && item.speed) {
      speed = item.speed;
    }
  }

  let notes = pattern.filter(x => 'string number'.includes(typeof x));
  let timePerNote = clock / (notes.length * speed);

  console.log(timePerNote);

  for (let r = 0 ; r < speed; r ++) {

    for (let i = 0; i < notes.length; i++) {
      if (notes[i] === 'sustain') continue;
      if (notes[i] === 'rest') continue;


      let noteLength = timePerNote;

      let j = 1;
      while (i + j < notes.length && notes[i + j] === 'sustain') {
        noteLength += timePerNote;
        j++;
      }
      noteLength -= 0.001;


      let adsr = new Float32Array([0, 1, 0.1 , 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0 ]);

      let amp = synth.voice.carrier.gain;
      let freq = synth.voice.baseFreq.num;

      let start = offset + (r / speed * clock) + (i * timePerNote);

      if (!scale.length) return;

      let note = notes[i];


      if (typeof note === 'number') {
        let midi = scale[note % scale.length] + synth.offset;
        freq.setValueAtTime(mtof(midi), audio.ctx.currentTime + start);
      }

      if (note === 'rand') {
        let midi = scale[Math.floor(Math.random() * scale.length)];
        freq.setValueAtTime(mtof(midi), audio.ctx.currentTime + start);
      }

      amp.setValueCurveAtTime(adsr, audio.ctx.currentTime + start, (noteLength));
    }
  }



  





}


async function preload () {
  let bin = await fetch(file);
  let text = await bin.text();
  scoreArea.innerHTML = text;
}

async function main () {
  await preload();

}






main();




