/**
 * @file Operator is the basic building block for the rest of the patching 
 * environment. An operator is basically a sub-graph of the whole WebAudio 
 * patch that can be encapsulated and composed with other AudioElements or 
 * native AudioNodes.
 */ 
export class Operator {
  
  /**
   * Construct an Operator.
   */ 
  constructor (ctx) {
    /** 
     * The parent audio context.
     * @type {AudioContext}
     */ 
    this.ctx = ctx;

    /**
     * The list of exposed parameters.
     * @type {object}
     */ 
    this.params = {};
  }

  /** 
   * The first node in this Operators's sub-graph.
   * @type {AudioNode}
   */ 
  get inlet () { return null; }

  /**
   * The final node in this Operators's sub-graph.
   */ 
  get outlet () { return null; }



  /**
   * Set a named parameter.
   * @param {string} name The name of the param
   * @param {number} value The value to set.
   * @param {number} time The amount of time to tween the change over. 
   */ 
  param (name, value, time) {
    this._setParam(name, value, false, time);
    return this;
  }


  /**
   * Set a named parameter from a normalized value.
   * @param {string} name The name of the param
   * @param {number} value The value to set.
   * @param {number} time The amount of time to tween the change over. 
   */ 
  nParam (name, value, time) {
    this._setParam(name, value, true, time);
    return this;
  }


  /**
   * Set a named parameter from a normalized value that uses exponential scaling.
   * @param {string} name The name of the param
   * @param {number} value The value to set.
   * @param {number} time The amount of time to tween the change over. 
   */ 
  expNParam (name, value, time) {
    this._setParam(name, value * value, true, time);
  }


  /**
   * If the specific operator implementation has a scale node configured, set 
   * its gain so some value.
   * @param {number} value The value.
   */ 
  scale (value) {
    if (this._scaler && this._scaler.gain) {
      this._scaler.gain.value = value;
    }
    return this;
  }


  /**
   * Connect to a target.
   * @param {AudioNode|AudioParam|}
   */ 
  connect (target) {
    if (this.outlet === null) {
      console.warn('Connect failed: no outlet node specified');
      return null;
    }

    if (target.inlet) {
      this.outlet.connect(target.inlet);
      return target;
    }

    return this.outlet.connect(target);
  }


  /**
   * Set a param or macro.
   * @param {string} name The name of the param or macro.
   * @param {number} value The value to set.
   * @param {number} time The amount of time to tween the change over. 
   * @private
   */ 
  _setParam (name, value, normalized, time) {
    if (!this.params[name]) return;
    const param = this.params[name];
    param.value = normalized 
      ? (param.max - param.min) * value + param.min
      : value;


    if (typeof param.target === 'function') {
      param.target.call(this, value, time);
      return;
    }

    if (!time) {
      param.target.setValueAtTime(param.value, this.ctx.currentTime);
    } else {
      param.target.setTargetAtTime(param.value, this.ctx.currentTime, time);
    }
  }


  /**
   * Expose a parameter externally. 
   * @param {string} name The name of the param.
   * @param {AudioParameter} target The native WebAudio AudioParameter that this 
   *     parameter targets.
   * @param {number} value The initial value.
   * @param {number} min The min value.
   * @param {number} max The max value.
   * @param {number} smoothing The default smoothing amount for this param.
   */ 
  exposeParam (name, target, value, min, max, smoothing = 0) {
    this.params[name] = {
      value: value,
      min: min,
      max: max,
      target: target
    };
    this._setParam(name, value, false, 0);
  }
}