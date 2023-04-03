/**
 * @file Utils to parse my score format.
 */ 

/**
 * The syntax.
 */ 
const operators = {
  notes: { type: 'list' },
  
  clock: { type: 'list', args: 1 },
  
  pattern: { 
    test: x => x.length === 1 && /[a-z]/.test(x),
    label: x => x,
  },
  
  rand: {
    test: x => x === '*',
  },
  
  rest : {
    test: x => x === '.',
  },

  sustain : {
    test: x => x === '-',
  },
  
  voice: { 
    test: x => x === '|',
  },

  speed : {
    test: x => x.startsWith('@'),
    parse: x => Math.max(1, Math.round(parseInt((x.slice(1))))),
  }
};


/** 
 * Test if a token matches an operator.
 */ 
function getOperator (x) {
  for (let [op, info] of Object.entries(operators)) {
    if (x.toLowerCase() === op) return op;
    if (info.test && info.test(x)) return op;
  }
  return false;
}


/** 
 * Parse the string score.
 */ 
function parseScore (str) {
  const lines = str.split('\n')
    .map(parseLine)
    .filter(x => x);
  
  return(lines);
}




function parseLine (line, mode) {
  const tokens = line.trim().split(/\s+/);
  const operator = getOperator(tokens[0]);
  if (!operator) {
    return false;
  }
  const parsed = {
    operator: operator,
    arguments: [],
  };

  const info = operators[operator];

  if (info.label) {
    parsed.label = info.label(tokens[0]);
  }

  for (let i = 1; i < tokens.length; i++) {
    if (info.args && i - 1 >= info.args) break;


    let op = getOperator(tokens[i]);
    
    if (op) {
      if (operators[op].parse) {
        parsed.arguments.push({ [op] : operators[op].parse(tokens[i])})
      } else if (operators[op].label) {
        parsed.arguments.push(op + '.' + operators[op].label(tokens[i]));
      } else {
        parsed.arguments.push(op);
      }
      continue;
    }


    if (!isNaN(parseInt(tokens[i]))) {
      parsed.arguments.push(parseFloat(tokens[i]));
    } else {
      parsed.arguments.push(tokens[i]);
    }

  }


  return parsed;
}



