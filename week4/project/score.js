const symbols = {
  '-' : 'extend', 
  '*' : 'wild',
};


function parseScore (score) {
  const out = {}
  const lines = score.split('\n');
  
  for (let line of lines) {
    if (line.length) {
      const [v, data] = parseVoice(line);
      out[v] = data;
    }
  }
  return out;
}


function parseVoice (voice) {
  const [v, data] = voice.split(':').map(x => x.trim());

  let [ sequence, repeats ] = data.split('.');

  sequence = sequence.split('').map(x => {
    if (x === ' ') return -1;
    if (x === '[' || x === ']') return '';
    return parseInt(x);
  }).filter(x => x !== '');

  repeats = parseInt(repeats);
  return [v, { repeats, sequence}];
}