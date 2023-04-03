class aMathNumberNode {
  constructor (ctx, val) {
    this._node = new ConstantSourceNode(ctx);
    this._node.start();
  }

  connect (target) {
    this._node.connect(target);
  }

  get num () { return this._node.offset }
}


/** 
 * A-rate multiplication node.
 */ 
class aMathMultNode {
  constructor (ctx, factor) {
    this._gain = new GainNode(ctx);
    this.a = this._gain;
    this.b = this._gain.gain;
  }

  connect (target) {
    this._gain.connect(target);
  }

  
}


class aMath {
  constructor (ctx) {
    this.ctx ();
  }

  num (val) {
    return new aMathNumberNode(this.ctx, val);
  }

  mult (factor) {
    return new aMathMultNode(this.ctx, factor);
  }


}