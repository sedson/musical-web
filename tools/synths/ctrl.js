import * as svg from './svg.js';


// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------
/**
 * Create a DOM element from a bag of options. The keys in the object 
 * should be the camel-cased JS versions of HTML properties.
 */ 
function tag (options) {
  const tag = options.tag || 'div';
  const elem  = document.createElement(tag);
  for (const [ prop, value ] of Object.entries(options)) {
    if (prop === 'tag') continue;
    if (prop === 'children') {
      value.forEach(child => elem.append(child));  
    }
    elem[prop] = value;
  }
  return elem;
}

/**
 * Apply a bag of styles to an element.
 */ 
function style (element, options) {
  for (const [attr, value] of Object.entries(options)) {
    element.style[attr] = value;
  }
}

/**
 * Clamp number x between min (default 0) and max (default 1).
 */ 
function clamp (x, min = 0, max = 1) {
  return Math.max(Math.min(x, max), min);
}

/**
 * Truncate number x to some number of digits (default 2).
 */ 
function trunc (x, digits = 2) {
  const t = Math.pow(10, digits);
  return Math.round (x * t) / t;
}

/**
 * Degrees to radians.
 */
function dtor (degrees) {
  return 2 * Math.PI * degrees / 360;
}

/**
 * Radians to degrees.
 */
function rtod (radians) {
  return 360 * radians / (2 * Math.PI);
}

/**
 * Polar [angle:degrees, radius] to [x, y] coordinates. 
 */
function polarToXY (angle, radius) {
  return [
    Math.cos(dtor(angle)) * radius,
    Math.sin(dtor(angle)) * radius
  ];
}

/** 
 * Linear interpolate number a to b based on factor t (default 0.5).
 */
function lerp (a , b, t = 0.5) {
  return a + t * (b - a);
}



// -----------------------------------------------------------------------------
// CONTROL COMPONENTS
// -----------------------------------------------------------------------------
/**
 * Control base class. Handles the functionality for interfacing the UI element 
 * with the JS object that contains shared state.
 */ 
class Control {
  constructor (context, target, index = 0) {
    /** The state object to control a inner values of. */
    this.context = context;

    /** The string key name of the target within context. */
    this.target = target;

    /** If target is an array, then any given control points to one index. */
    this.index = index;

    /** The current value bound to this control. */
    this.value = 0;

    /** The parent set of controls. */
    this.parent = null;

    this._boundFunc = null;

    this._parseTarget(target);
  }

  /** 
   * update event fires on click and drag. It gets a delta value which tracks 
   * the pixel amount of change and the client x, y coordinates. 
   */ 
  _update (delta, x, y) {
    if (this.update) this.update(delta, x, y);
  }

  /**
   * render handles syncing visuals to internal state. Fires right after update.
   */ 
  _render () {
    if (this.render) this.render();
  }
  
  /**
   * onChange syncs UI state with the real JS context.
   */ 
  _onChange () {
    this._setContextvalue(this.target, this.value, this.index);
    if (this.onChange) {
      this.onChange();
    }
    if (this.parent?.onChange) {
      this.parent.onChange();
    }
  }

  /**
   * onAppend event fires when the component is actually attached to the DOM.
   */ 
  _onAppend () {
    if (this.onAppend) this.onAppend();
    this._render();
  }

  /**
   * Actually change the value.
   */
  _setContextvalue (key, value, index = 0) {
    if (typeof this.context[key] === typeof value) {
      this.context[key] = value;
      return;
    }
    
    if (this._boundFunc) {
      this._boundFunc(value);
      return;
    }

    if (Array.isArray(this.context[key])) {
      this.context[key][index] = value;
      return;
    }
  }

  /**
   * Apply the values from the context object at construction time.
   */
  _parseTarget (str) {
    if (str.indexOf('.') === -1) {
      this.target = str;
      
      // Bind context's 'this' to itself.
      if (typeof this.context[this.target] === 'function') {
        this._boundFunc = this.context[this.target].bind(this.context);
        this.value = 0;
        return;
      }
      
      this.value = this.context[this.target];
      return;
    }

    // Handle a case where people can pass 'target.3' to get an internal index.
    const [ target, index ] = str.split('.');
    this.target = target;
    const int = parseInt(index);
    this.index = isNaN(int) ? 0 : int;
    this.value = this.context[target][index];
  }
}


/**
 * A button that calls a function each time it is clicked. Targets a function.
 */ 
class ButtonControl extends Control {
  constructor (context, target, settings = {}) {
    super(context, target);
    
    this.element = tag({
      tag: 'button', 
      className: 'ctrl-elem ctrl-button w100 pad2', 
      innerText: target 
    });

    this.element.onclick = () => { 
      this._onChange();
    }
  }
}


/**
 * A toggle on/off switch. Targets a boolean value.
 */ 
class Toggle extends Control {
  constructor (context, target, settings = {}) {
    super(context, target);
    this.width = settings.width || 30;
    this.height = settings.height || 30;

    this.element = tag({
      tag: 'div', 
      className: 'ctrl-elem ctrl-toggle',
    });

    this.inner = tag({
      tag: 'div',
      className: 'ctrl-toggle-inner',
    });

    this.element.append(this.inner);

    this.element.onclick = () => { 
      this.value = !this.value;
      this._onChange();
      this._render();
    }
  }
  
  render () {
    if (this.value) {
      this.element.classList.add('on');
    } else {
      this.element.classList.remove('on');
    }
  }
}


/**
 * A simple check box. Targets a boolean value.
 */
class Bool extends Control {
  constructor (context, target, settings = {}) {
    super(context, target);
    this.width = settings.width || 16;
    this.height = settings.height || 16;

    this.element = tag({
      tag: 'div', 
      className: 'ctrl-elem ctrl-bool',
    });

    this.svg = svg.svg(this.width, this.height);
    this.svg.classList.add('ctrl-svg', 'ctrl-bool-fill');

    this.box = svg.rect(2, 2, this.width - 4, this.height - 4);
    this.box.classList.add('stroke-widget', 'fill-widget');

    this.svg.append(this.box);
    this.element.append(this.svg);
    
    this.element.onclick = () => { 
      this.value = !this.value;
      this._onChange();
      this._render();
    }
  }
  
  render () {
    if (this.value) {
      this.box.classList.add('on');
    } else {
      this.box.classList.remove('on');
    }
  }
}


/**
 * Interface class for controls with a drag interaction.
 */ 
class Draggable extends Control {
  constructor (context, target) {
    super(context, target); 

    /** 
     * Many dragbable elements can have a vertical or horizontal variant. 
     * For others, this toggles which direction of mouse change gets passed 
     * as delta.
     */
    this.direction = 'vertical';

    this.element = tag({
      tag: 'div',
      className: 'ctrl-elem ctrl-draggable ' + this.direction,
    });

    this.initialMousePos = [0, 0];

    this.boundMouseDown = e => this.mousedown(e);
    this.boundMouseMove = e => this.mousemove(e);
    this.boundMouseUp = e => this.mouseup(e);
    this.element.addEventListener('mousedown', this.boundMouseDown);
  }

  mousedown (e) {
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseup', this.boundMouseUp);
    this.initialMousePos[0] = e.clientX;
    this.initialMousePos[1] = e.clientY;
    this.element.classList.add('active');
  }

  mousemove (e) {
    let delta = 0;
    if (this.direction === 'vertical') {
      delta = e.clientY - this.initialMousePos[1]
    } else {
      delta = e.clientX - this.initialMousePos[0];
    }

    // Slow it down if holding shift.
    if (e.shiftKey) {
      delta /= 10;
      console.log('shift')
    }

    this._update(delta, e.clientX, e.clientY);
    this._onChange();
    this._render();
  }

  mouseup (e) {
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseup', this.boundMouseUp);
    this.element.classList.remove('active');
  }
}


/**
 * A number that can be dragged.
 */ 
class DraggableNumber extends Draggable {
  constructor (context, target) {
    super(context, target); 

    this.label = tag({
      tag: 'span',
      className: 'ctrl-label',
      innerText: target,
    });

    this.num = tag({
      tag: 'input',
      type: 'text',
      className: 'ctrl-input ctrl-num pad',
      innerText: this.value,
    });


    this.num.addEventListener('change', () => this.onTextChange());

    this.element.classList.add('ctrl-flex', 'pad');
    this.element.append(this.label, this.num);

    this._render();
  }

  onTextChange () {
    const numeric = Number(this.num.value);
    if (!isNaN(numeric)) { this.value = numeric; }
    this._onChange();
    this._render();
  }

  update (delta) {
    this.value -= delta / 100;
  }

  render () {
    this.num.value = this.value.toFixed(2);
  }
}


/**
 * A slider.
 */ 
class Slider extends Draggable {
  constructor (context, target, settings = {}) {
    super(context, target);

    this.width = settings.width || 140;
    this.height = settings.height || 20;

    this.direction = settings.direction || 'horizontal';

    this.svg = svg.svg(this.width, this.height);
    this.svg.classList.add('ctrl-svg', 'ctrl-slider');
    
    this.bg = svg.rect(0, 0, this.width, this.height);
    this.bg.classList.add('fill-widget');

    this.inner = svg.rect(0, 0, this.width, this.height);
    this.inner.classList.add('fill-current');

    this.rect = this.element.getBoundingClientRect();

    this.svg.append(this.bg, this.inner);
    this.element.append(this.svg);
    this.element.addEventListener('mousedown', (e) => {
      this.rect = this.svg.getBoundingClientRect();
      this.boundMouseDown(e);
      this._update(0, e.clientX, e.clientY);
      this._onChange();
      this._render();
    });
  }

  update (delta, x, y) {
    let internal = 0;
    if (this.direction === 'vertical') {
      internal = 1 - clamp((y - this.rect.top) / this.rect.height);
    } else {
      internal = clamp((x - this.rect.left) / this.rect.width);
    }
    this.value = clamp(internal, 0, 1);
  }

  render () {
    if (this.direction === 'vertical') {
      this.inner.setAttribute('y', this.rect.height - this.value * this.rect.height);
    } else {
      this.inner.setAttribute('x', this.value * this.rect.width - this.rect.width);
    }
  }

  onAppend () {
    this.rect = this.element.getBoundingClientRect();
    this._render();
  }
}


/**
 * A alternate slider.
 */ 
class Axis extends Draggable {
  constructor (context, target, settings = {}) {
    super(context, target);

    this.width = settings.width || 140;
    this.height = settings.height || 40;

    this.direction = settings.direction || 'horizontal';

    this.svg = svg.svg(this.width, this.height);
    this.svg.classList.add('ctrl-svg', 'ctrl-slider2');
    this.svg.classList.add('transparent');
    this.element.classList.add('transparent');

    this.notchCount = settings.notchCount || 5;
    this.knobSize = 12;
    this.pad = 12;
    
    this.line = svg.path();
    this.knob = svg.ellipse(0, 0, this.knobSize - 2, this.knobSize - 2);
    this.knob.classList.add('fill-current', 'stroke-widget');
    this.knob.setAttribute('stroke-width', 4);

    if (this.direction === 'vertical') {

      let path = svg.makePathRel([[this.width / 2, this.knobSize], [0, this.height - 2 * this.knobSize]]);
      
      for (let i = 0; i < this.notchCount; i++) {

        const height = this.height - 2 * this.knobSize;
        const y = this.knobSize + height * i / (this.notchCount - 1);
        path += svg.makePathAbs([[this.pad, y], [this.width - this.pad, y]]);
      }

      this.line.setAttribute('d', path);

    } else {

      let path = svg.makePathRel([[this.knobSize, this.height / 2], [this.width - 2 * this.knobSize, 0]]);

      for (let i = 0; i < this.notchCount; i++) {
        const width = this.width - 2 * this.knobSize;
        const x = this.knobSize + width * i / (this.notchCount - 1);
        path += svg.makePathAbs([[x, this.pad], [x, this.height - this.pad]]);
      }

      this.line.setAttribute('d', path);
    }

    this.line.setAttribute('stroke-width', 4);
    this.line.classList.add('stroke-widget');

    this.rect = this.svg.getBoundingClientRect();

    this.svg.append(this.line, this.knob);

    this.element.append(this.svg);

    this.element.addEventListener('mousedown', (e) => {
      this.rect = this.svg.getBoundingClientRect();
      this.boundMouseDown(e);
      this._update(0, e.clientX, e.clientY);
      this._onChange();
      this._render();
    });
  }

  update (delta, x, y) {
    let internal = 0;
    if (this.direction === 'vertical') {
      internal = 1 - clamp((y - this.rect.top) / this.rect.height);
    } else {
      internal = clamp((x - this.rect.left) / this.rect.width);
    }
    this.value = clamp(internal, 0, 1);
  }

  render () {
    if (this.direction === 'vertical') {
      this.knob.setAttribute('cx', this.width / 2);
      this.knob.setAttribute('cy', (1 - this.value) * (this.rect.height - 2 * this.knobSize) + this.knobSize);
    } else {
      this.knob.setAttribute('cy', this.height / 2);
      this.knob.setAttribute('cx', this.value * (this.rect.width - 2 * this.knobSize) + this.knobSize);
    }
  }

  onAppend () {
    this.rect = this.element.getBoundingClientRect();
    this._render();
  }
}


class Dial extends Draggable {
  constructor(context, target, settings = {}) {
    super(context, target);

    this.width = settings.width || 60;
    this.height = settings.height || 60;
    this.radius = Math.min(this.width, this.height) / 2;

    this.direction = settings.direction || 'vertical';

    this.svg = svg.svg(this.width, this.height);
    this.svg.classList.add('ctrl-svg', 'ctrl-dial');


    this.bg = svg.rect(0, 0, this.width, this.height);
    this.bg.classList.add('ctrl-svg-bg');

    this.strokeWidth = 6;

    this.track = svg.path();
    this.track.classList.add('stroke-widget');
    this.track.setAttribute('stroke-width', this.strokeWidth);
    this.track.setAttribute('fill', 'none');
    this.track.setAttribute('stroke-linecap', 'round');

    this.filledTrack = svg.path();
    this.filledTrack.classList.add('stroke-current');
    this.filledTrack.setAttribute('stroke-width', this.strokeWidth);
    this.filledTrack.setAttribute('fill', 'none');
    this.filledTrack.setAttribute('stroke-linecap', 'round');

    this.inner = svg.ellipse(this.width / 2,  this.height / 2, 0, 0);
    this.inner.classList.add('ctrl-svg-fill');

    this.svg.append(this.track, this.filledTrack);
    this.element.append(this.svg);
    this.element.classList.add('transparent');
  }

  update (delta, x, y) {
    this.value = clamp(this.value - (delta / 1000), 0, 1);
  }

  render () {
    const offset = 12;
    const iPoint = polarToXY(135, this.radius - offset);
    const ePoint = polarToXY(45, this.radius - offset);
    const theta = 270 * this.value;
    const fPoint = polarToXY(135 + theta, this.radius - offset);

    const cX = this.width / 2;
    const cY = this.height / 2;

    const ix = cX + iPoint[0];
    const iy = cY + iPoint[1];
    
    const ex = cX + ePoint[0];
    const ey = cY + ePoint[1];

    const fx = cX + fPoint[0];
    const fy = cY + fPoint[1];

    const largeArc = theta > 180 ? 1 : 0;

    const path1 = `M ${ix} ${iy} A ${this.radius- offset} ${this.radius - offset} 0 ${1} 1 ${ex} ${ey}`;
    const path2 = `M ${ix} ${iy} A ${this.radius- offset} ${this.radius - offset} 0 ${largeArc} 1 ${fx} ${fy}`;
    this.track.setAttribute('d', path1);
    this.filledTrack.setAttribute('d', path2);
  }

  onAppend () {
    this.render();
  }
}

class Knob extends Draggable {
  constructor(context, target, settings = {}) {
    super(context, target, settings);

    this.width = settings.width || 60;
    this.height = settings.height || 60;
    this.radius = Math.min(this.width, this.height) / 2;

    this.direction = settings.direction || 'vertical';

    this.svg = svg.svg(this.width, this.height);
    this.svg.classList.add('ctrl-svg', 'ctrl-dial');


    this.bg = svg.rect(0, 0, this.width, this.height);
    this.bg.classList.add('ctrl-svg-bg');

    this.strokeWidth = 3;

    this.knob = svg.group();
    this.circle = svg.ellipse(this.width / 2, this.height / 2, this.radius - 16, this.radius - 16);

    this.knob.classList.add('fill-current');
    this.knob.setAttribute('stroke-width', this.strokeWidth);
    this.knob.setAttribute('fill', 'none');

    this.notch = svg.path();

    this.notch.setAttribute('d', svg.makePathRel([[this.width / 2, this.height / 2], [10, 0]]));
    this.notch.classList.add('stroke-background');
    this.notch.setAttribute('stroke-linecap', 'round');


    this.knob.append(this.circle, this.notch);

    for (let angle of [-225, -90, 45]) {
      const pos = polarToXY(angle, 20);
      const dot = svg.ellipse(this.width / 2 + pos[0], this.height / 2 + pos[1], 2, 2);
      dot.classList.add('fill-text')
      this.svg.append(dot);
    }


    this.rotation = 0;
    this.initialRotation = 0;
    this.rotationOnClick = 0;

    this.svg.append(this.knob);
    this.element.append(this.svg);
    this.element.classList.add('transparent');
  }

  xyToAngle (x, y) {
    const dx = x - (this.rect.left + this.rect.width / 2);
    const dy = y - (this.rect.top + this.rect.height / 2);
    return rtod(-Math.atan2(-dy, dx));
  }

  update (delta, x, y) {
    this.value = clamp(this.value - (delta / 1000), 0, 1);

  }

  render () {
    const rot = -225 + this.value * 270;
    this.knob.setAttribute('transform' , `rotate(${rot}, ${this.width / 2}, ${this.height / 2})`);
  }

  onAppend () {
    this._render();
  }
}


class XYPad extends Draggable {
  constructor (context, targetX, targetY, settings = {}) {
    super(context, targetX, settings);
    
    this.targetY = targetY;
    this.valueY  = this.context[targetY] ?? 0;

    this.width  = settings.width  || 140;
    this.height = settings.height || 140;

    this.dotSize = 12;

    // Foreground SVG has the dot and does not get transformed.
    this.foreground = tag({
      tag: 'div',
      className: 'ctrl-xy-pad layer1'
    });

    // Translate on z for safari compatibility.
    style(this.foreground, {
      position: 'absolute',
      left: 0, 
      top: 0,
      transform: 'translate3d(0, 0, 100px)'
    });

    this.svgForeground = svg.svg(this.width, this.height);
  
    this.dot = svg.ellipse(0, 0, this.dotSize - 2, this.dotSize - 2);
    this.dot.setAttribute('stroke-width', 4);
    this.dot.classList.add('fill-current', 'stroke-widget');

    this.svgForeground.append(this.dot);
    this.foreground.append(this.svgForeground);
    

    // Background element gets transformed and has the background SVG. 3D
    // rotation acts strangely cross-browser when applied directly to an SVG.
    this.background = tag({
      tag: 'div',
      className: 'ctrl-xy-pad layer0'
    });

    this.svgBackground = svg.svg(this.width, this.height);

    this.bg = svg.rect(this.dotSize, this.dotSize, this.width - 2 * this.dotSize, this.height - 2 * this.dotSize);
    this.bg.classList.add('fill-background', 'ctrl-pad', 'stroke-widget');
    this.bg.setAttribute('stroke-width', 4);
    this.bg.setAttribute('rx', 12);

    this.svgBackground.append(this.bg);
    this.background.append(this.svgBackground);


    this.element.append(this.background, this.foreground);

    this.element.classList.add('transparent');

    this.element.addEventListener('mousedown', (e) => {
      this.rect = this.element.getBoundingClientRect();
      this.boundMouseDown(e);
      this._update(0, e.clientX, e.clientY);
      this._onChange();
      this._render();
    });
  }


  update (delta, x, y) {
    let nX = clamp((x - this.rect.left) / this.rect.width);
    let nY = 1 - clamp((y - this.rect.top) / this.rect.height);
    this.value = nX;
    this.valueY = nY;
  }


  render () {
    const posX = clamp(this.value * this.rect.width, this.dotSize, this.width - this.dotSize);
    const posY = clamp((1 - this.valueY) * this.rect.height, this.dotSize, this.height - this.dotSize);
    this.dot.setAttribute('cx', posX);
    this.dot.setAttribute('cy', posY);

    const skewX = -10 * (this.value - 0.5);
    const skewY = -10 * (this.valueY - 0.5);

    let transform = 'perspective(140px)';
    transform += ` rotateX(${skewY}deg)`;
    transform += ` rotateY(${skewX}deg)`;
    this.background.style.transform = transform;
  }

  _onChange () {
    super._onChange();
    this._setContextvalue(this.targetY, this.valueY);
  }

  onAppend () {
    this.rect = this.element.getBoundingClientRect();
    this._render();
  } 
}

class BufferPlot extends Draggable {
  constructor (context, buffer = [0, 1], settings = {}) {
    super(context, '');
    this.width = settings.width || 140;
    this.height = settings.height || 80;

    this.strokeWidth = settings.strokeWidth || 4;

    this.polarity = settings.polarity || 'bipolar';

    this.element.classList.add('ctrl-plot', 'transparent');

    this.svg = svg.svg(this.width, this.height);

    this.path = svg.path();
    this.path.setAttribute('fill', 'none');
    this.path.setAttribute('stroke-width', this.strokeWidth);
    this.path.setAttribute('stroke-linecap', 'round');
    this.path.setAttribute('stroke-linejoin', 'round');
    this.path.classList.add('stroke-current');
    this.svg.append(this.path);
    this.element.append(this.svg);
    this.buffer = buffer;

    this._render();
  }

  setBuffer (buffer) {
    this.buffer = buffer;
    this._render();
  }

  render () {
    this.rect = this.element.getBoundingClientRect();
    const len = this.buffer.length;
    const xVals = this.buffer.map((_, i) => (this.rect.width - 8) * i / (len - 1) + 4);
    let yVals;
    if (this.polarity === 'unipolar') {
      yVals = this.buffer.map((n, i) => (this.rect.height - 8) - n * (this.rect.height - 8) + 4);
    } else {
      yVals = this.buffer.map((n, i) => (this.rect.height / 2 - 8) - n * (this.rect.height / 2 - 8) + 4);    
    }

    const xyVals = [];
    for (let i = 0; i < len; ++i) {
      xyVals.push([xVals[i], yVals[i]]);
    }
    this.path.setAttribute('d', svg.makePathAbs(xyVals))
  }
}


class DrawBuffer extends BufferPlot {
  constructor (context, buffer = [ 0, 1 ], settings = {}) {
    super(context, buffer, settings);
  }

  mouseXToIndex (x) {
    const nX = clamp((x - this.rect.left) / this.rect.width);
    const index = Math.round(nX * (this.buffer.length - 1));
    return index;
  }

  mouseYToValue (y) {
    if (this.polarity === 'unipolar') {
      const nY = clamp((y - this.rect.top) / this.rect.height);
      const value = (1 - nY);
      return value;
    }
    const nY = clamp((y - this.rect.top) / this.rect.height);
    const value = 2 * (1 - nY) - 1;
    return value;
  }

  _update(delta, x, y) {
    super._update(delta, x, y);
    const index = this.mouseXToIndex(x);
    const value = this.mouseYToValue(y);
    this.buffer[index] = value;
  }



}



class EnvelopeControl extends Control {
  // constructor ()
}


// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------
export class CTRL {
  constructor ( panel ) {
    this.panel = panel || tag({});
    this.panel.classList.add('ctrl-root');
  }

  button (context, target, settings) {
    const control = new ButtonControl(context, target, settings);
    control.parent = this;
    return control;
  }
  
  bool (context, target, settings) {
    const control = new Bool(context, target, settings);
    control.parent = this;
    return control;
  }

  boolArray (context, target, length) {
    const controls = [];
    for (let i = 0; i < length; ++i) {
      const control = new Bool(context, target + '.' + i);
      control.parent = this;
      controls.push(control);
    }
    return controls;
  }

  toggle (context, target, settings) {
    const control = new Toggle(context, target, settings);
    control.parent = this;
    return control;
  }

  drag (context, target, settings) {
    const control = new DraggableNumber(context, target, settings);
    control.parent = this;
    return control;
  }

  slider (context, target, settings) {
    const control = new Slider(context, target, settings);
    control.parent = this;
    return control;
  }

  axis (context, target, settings) {
    const control = new Axis(context, target, settings);
    control.parent = this;
    return control;
  }
  
  dial (context, target, settings) {
    const control = new Dial(context, target, settings);
    control.parent = this;
    return control;
  }

  knob (context, target, settings) { 
    const control = new Knob(context, target, settings);
    control.parent = this;
    return control;
  }

  pad (context, targetX, targetY, settings) {
    const control = new XYPad(context, targetX, targetY, settings);
    control.parent = this;
    return control;
  }

  plot (context, buffer, settings) {
    const control = new BufferPlot(context, buffer, settings);
    control.parent = this;
    return control;
  }

  doodle (context, buffer, settings) {
    const control = new DrawBuffer(context, buffer, settings);
    control.parent = this;
    return control;
  }

  _append (control) {
    if (control.element) {
      this.panel.append(control.element); 
      control._onAppend();
    } else {
      this.panel.append(control);
    }
  }

  append (...args) {
    for (let arg of args) {
      this._append(arg);
      console.log(arg);
    }
  }
}