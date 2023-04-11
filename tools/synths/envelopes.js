/**
class Envelope {
  
  constructor (ctx, a, d, s, r) {
    this.ctx = ctx;
    this.a = a;
    this.d = d;
    this.s = s;
    this.r = r;
    this.targets = [];
    this.on = false;
    this.next = 0;
  }

  connect (target) {
    this.targets.push(target);
  }

  curve (...values) {
    return new Float32Array([...values]);
  }

  length () {
    return this.a + this.d + this.r;
  }

  attack (hold = 0) {
    let t = this.ctx.currentTime;

    if (t < this.next) {
      return;
    }

    for (const target of this.targets) {
      const iv = target.value;

      target.setValueCurveAtTime(this.curve(iv, 1), t, this.a);
      target.setValueCurveAtTime(this.curve(1, this.s), t + this.a, this.d);
      
      if (hold > 0) {
        target.setValueCurveAtTime(this.curve(this.s, 0), t + this.a + this.d + hold, this.r);
      }
    }

    this.next = t + this.a + this.d + hold + this.r;
    
    if (hold <= 0) {
      this.next = t + 100;
    }
  }
}
*/

export class Envelope extends Operator {
  constructor (ctx) {
    
  }
}


