// https://lisperator.net/pltut/parser/token-stream

class InputStream {

  /**
   * Build an InputStream from a string.
   */ 
  constructor (str) {
    this.str = str;
    this.pos = 0;
    this.line = 1;
    this.col = 0;
  }

  /** 
   * Move the pointer one char.
   * @return {Char}
   */ 
  next () {
    let char = this.str.charAt(this.pos++);
    if (char === '\n') {
      this.line++;
      this.col = 0; 
    } else {
      this.col++;
    } 
    return char;
  }

  /** 
   * Peek the current char.
   * @return {Char}
   */ 
  peek () {
    return this.str.charAt(this.pos);
  }

  /**
   * True if end of file.
   * @return {bool}
   */ 
  eof () {
    return this.peek() === '';
  }

  /**
   * Error out.
   */ 
  die () {
    throw new Error(msg + `@ line:${this.line} col:${this.col}`);
  }
}




class Lexer {
  /** 
   * Create a lexer for a grammar and input.
   */ 
  constructor (grammar, str) {
    this.grammar = grammar;
    this.input = new InputStream(str);
    this.current = null;
  }

  isKeyword (token) {
    return this.grammar.keywords.indexOf(` ${token} `) >= 0;
  }

  isDigit (char) {
    return /[0-9]/.test(char);
  }

  isIdent (char) {
    return this.grammar.validIdentChars.indexOf(char) >= 0;
  }

  isPunc (char) {
    return '()'.indexOf(char) >= 0;
  }

  isOperator (char) {
    return this.grammar.operators.indexOf(char) >= 0;
  }

  isWhitespace (char) {
    return ' \n\t'.indexOf(char) >= 0 ;
  }

  readWhile (validator) {
    let str = '';
    while (!this.input.eof() && this[validator](this.input.peek())) {
      str += this.input.next();
    }
    return str;
  }

  readNumber () {
    let number = this.readWhile('isDigit');
    return { type: 'number', value: parseInt(number) };
  }

  readIdent () {
    let id = this.readWhile('isIdent');
    return {
      type: this.isKeyword(id) ? 'keyword' : 'identifier',
      value: id
    };
  }

  skipComment () {
    while (!this.input.eof() && this.input.peek() !== '\n') {
      this.input.next();
    }
    this.input.next();
  }









  /**
   * Read the next token.
   * @return {Token}
   */
  readNext () {
    this.readWhile('isWhitespace');

    if (this.input.eof()) {
      return null;
    }

    let char = this.input.peek();

    if (char === this.grammar.comment) {
      this.skipComment();
      return this.readNext();
    }

    if (this.isDigit(char)) {

      return this.readNumber();
    }

    if (this.isIdent(char)) {

      return this.readIdent();
    }

    if (this.isPunc(char)) {
      return { type: 'punc', value: this.input.next() };
    }

    if (this.isOperator(char)) {
      return { type: 'operator', value: this.input.next() };
    }

    throw new Error('WHAT: ' + this.input.peek());
  }

  peek () {
    if (this.current) {
      return this.current;
    } else {
      this.current = this.readNext();
      return this.current;
    }
  }

  next () {
    let token = this.current;
    this.current = null;
    return token || this.readNext();
  }

  eof () {
    return this.peek() === null;
  }
}


class Applier {
  constructor (context, tokens) {
    this.context = context;
    this.tokens = tokens;
    this.pos = 0;
  }

  


  peek () {
    return (this.tokens[this.pos]) || null;
  }

  next () {
    return (this.tokens[this.pos++]);
  }

  eof () {
    return this.peek === null;
  }

}

