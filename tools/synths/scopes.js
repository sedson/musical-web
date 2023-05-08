/**
 * @file Provide web-gl analysis classes.
 */ 

import { Operator } from './operator.js';
import { RendererGL } from './renderer-gl.js'


/**
 * Vertex shader.
 */ 
const vs = `
#version 300 es

layout(location = 0) in float aX;
layout(location = 1) in float aY;
layout(location = 2) in float opacity;

out float vOpacity;
out vec2 vPos;

uniform vec2 uScale;
uniform float uPointSize;

void main () 
{
  gl_Position = vec4(aX * uScale.x, aY * uScale.y, 0.0, 1.0);
  gl_PointSize = uPointSize;
  vPos = vec2(aX * uScale.x, aY * uScale.y);
}
`.trim();


/**
 * Fragment shader.
 */
const fs = `
#version 300 es

precision mediump float;

in vec2 vPos;
in float vOpacity;

out vec4 fragColor;

uniform vec3 uColor;
uniform int uMode;

void main () 
{ 
  float fade = 0.5;
  if (uMode < 1) {
   fade = 0.2 * smoothstep(0.5, 0.45, distance(vec2(0.5, 0.5), gl_PointCoord));
  }
  
  fragColor.rgb = uColor * (fade);
  fragColor.a = 1.0;
}
`.trim();


/**
 * @class Waveform oscilloscope.
 */ 
export class Scope extends Operator {
  constructor(ctx, container, options = {}) {
    super(ctx);

    /**
     * The number of samples to draw.
     */ 
    this.samples = options.samples || 512;

    // Create an analyser node.
    this._analyser = new AnalyserNode(ctx, { fftSize: this.samples });

    // Create the panel and the canvas.
    this._panel = document.createElement('div');
    this._canvas = document.createElement('canvas');
    this._canvas.width  = options.size || 400; 
    this._canvas.height = options.size / 4 || 100;
    this._panel.append(this._canvas);
    
    // Hook into the dom.
    container.append(this._panel);

    // Make the renderer.
    this._renderer = new RendererGL(this._canvas);
    this._renderer.shaders(vs, fs);

    // Store a reference for the gl context to make code shorter.    
    this.gl = this._renderer.gl;

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE);

    // Store a gl buffer for each axis.
    this._graphicsBufferX = this.gl.createBuffer();
    this._graphicsBufferY = this.gl.createBuffer();

    // Store the sound buffer.
    this._buffer = new Float32Array(this.samples);

    // X coordinates increment by 1 / samples.
    this._xAxisData = new Float32Array(this.samples).map((_, n) => {
      return 2 * n / (this.samples - 1) - 1;
    })

    /**
     * Whether the graphics drawing is held in place.
     */ 
    this.hold = false;

    /**
     * Scale the vertical axis signal.
     */ 
    this.scale = 0.6;

    this.mode = options.mode || 'line';

    this.pointSize = 4;

    this.color = [1, 1, 1];

    // Store any uniform locations.
    
    this.now = performance.now();

    // Bind the render for looping.
    this._render = this.render.bind(this);

    // Toggle hold on click.
    this._canvas.addEventListener('click', () => this.hold = !this.hold);

    this._render();
  }


  get inlet ()  { return this._analyser; }

  /**
   * Render the scope.
   */ 
  render () {
    requestAnimationFrame(this._render);
    const n = performance.now();
    
    if (this.hold) { return; }
    const elapsed = n - this.now;
    this.now = n;


    // if (elapsed > 17) { return; }

    // Get the data from the two channels of audio.
    this._analyser.getFloatTimeDomainData(this._buffer);

    // Clear the canvas.
    this._renderer.clear(0.1, 0.1, 0.1, 1);

    // Send the X buffer to the shaders.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._graphicsBufferX);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this._xAxisData, this.gl.DYNAMIC_DRAW);
    this.gl.vertexAttribPointer(0, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(0);

    // Send the Y buffer to the shaders.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._graphicsBufferY);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this._buffer, this.gl.DYNAMIC_DRAW);
    this.gl.vertexAttribPointer(1, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(1);


    this.gl.uniform2f(this._renderer.u('uScale'), 1.0, this.scale);
    this.gl.uniform1f(this._renderer.u('uPointSize'), this.pointSize);
    this.gl.uniform3fv(this._renderer.u('uColor'), this.color);

    if (this.mode === 'line') {
      this.gl.uniform1i(this._renderer.u('uMode'), 1);
      this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.samples);
    } else {
      this.gl.uniform1i(this._renderer.u('uMode'), 0);
      this.gl.drawArrays(this.gl.POINTS, 0, this.samples);
    }
  }
}




/**
 * @class A 2D 2-input oscilloscope.
 */ 
export class Scope2D extends Operator {
  constructor(ctx, container, options = {}) {
    super(ctx);

    /**
     * The number of samples to draw.
     */ 
    this.samples = options.samples || 512;

    // Create an analyser node for each axis.
    this._analyserX = new AnalyserNode(ctx, { fftSize: this.samples });
    this._analyserY = new AnalyserNode(ctx, { fftSize: this.samples });

    // Create the panel and the canvas.
    this._panel = document.createElement('div');
    this._canvas = document.createElement('canvas');
    this._canvas.width  = options.size || 400; 
    this._canvas.height = options.size || 400;
    this._panel.append(this._canvas);
    
    // Hook into the dom.
    container.append(this._panel);

    // Make the renderer.
    this._renderer = new RendererGL(this._canvas);
    this._renderer.shaders(vs, fs);

    // Store a reference for the gl context to make code shorter.    
    this.gl = this._renderer.gl;

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE)

    // Store a gl buffer for each axis.
    this._graphicsBufferX = this.gl.createBuffer();
    this._graphicsBufferY = this.gl.createBuffer();

    // Store the sound buffer for each axis. Audio writes to these buffers and
    // then they get sent to graphics.
    this._bufferX = new Float32Array(this.samples);
    this._bufferY = new Float32Array(this.samples);

    /**
     * Whether the graphics drawing is held in place.
     */ 
    this.hold = false;

    /**
     * Scale the X axis signal.
     */ 
    this.scaleX = 0.6;

    /**
     * Scale the X axis signal.
     */ 
    this.scaleY = 0.6;

    this.mode = options.mode || 'line';

    this.pointSize = 4;

    this.color = [1, 1, 1];

    this.now = performance.now();

    // Bind the render for looping.
    this._render = this.render.bind(this);

    // Toggle hold on click.
    this._canvas.addEventListener('click', () => this.hold = !this.hold);

    this._render();
  }


  get inlet ()  { return this._analyserX; }
  get inlet2 () { return this._analyserY; }



  /**
   * Render the scope.
   */ 
  render () {
    requestAnimationFrame(this._render);
    const n = performance.now();
    
    if (this.hold) { return; }
    const elapsed = n - this.now;
    this.now = n;


    // if (elapsed > 17) { return; }

    // Get the data from the two channels of audio.
    this._analyserX.getFloatTimeDomainData(this._bufferX);
    this._analyserY.getFloatTimeDomainData(this._bufferY);

    // Clear the canvas.
    this._renderer.clear(0.1, 0.1, 0.1, 1);

    // Send the X buffer to the shaders.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._graphicsBufferX);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this._bufferX, this.gl.DYNAMIC_DRAW);
    this.gl.vertexAttribPointer(0, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(0);

    // Send the Y buffer to the shaders.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._graphicsBufferY);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this._bufferY, this.gl.DYNAMIC_DRAW);
    this.gl.vertexAttribPointer(1, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(1);


    this.gl.uniform2f(this._renderer.u('uScale'), this.scaleX, this.scaleY);
    this.gl.uniform1f(this._renderer.u('uPointSize'), this.pointSize);
    this.gl.uniform3fv(this._renderer.u('uColor'), this.color);


    if (this.mode === 'line') {
      this.gl.uniform1i(this._renderer.u('uMode'), 1);
      this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.samples);
    } else {
      this.gl.uniform1i(this._renderer.u('uMode'), 0);
      this.gl.drawArrays(this.gl.POINTS, 0, this.samples);
    }
  }
}



export class Spect extends Operator {
  constructor(ctx, container, options = {}) {
    super(ctx);

    this.samples = options.samples || 2048;

    this._analyser = new AnalyserNode(ctx, {
      fftSize: this.amples,
      smoothingTimeConstant: 0.6,
    });

    this._panel = document.createElement('div');
    this._canvas = document.createElement('canvas');
    this._canvas.width = options.width || 400; 
    this._canvas.height = options.height || 140;
    this._canvasCtx = this._canvas.getContext('2d');

    this._binCount = this._analyser.frequencyBinCount;
    this._dataBuffer = new Uint8Array(this._binCount);
    this._panel.append(this._canvas);

    this._nyquist = ctx.sampleRate / 2;

    this._frequencyLabels = [['100', 100], ['1k', 1000], ['10k', 10000], ['•', 440]];

    this.mode = options.mode || 'line';
    
    this._render = this.render.bind(this);
    this._render();
    this._canvas.addEventListener('mousemove', (e) => this._handleMouse(e));

    container.append(this._panel);

  }

  _handleMouse (e) {
    const { clientX, clientY } = e;
    const rect = this._canvas.getBoundingClientRect();
    const normX = (clientX - rect.left) / rect.width;
    if (normX >= 0 && normX <= 1) {
      this._frequencyLabels[this._frequencyLabels.length - 1][0] = this._xPosToFreq(normX);
      this._frequencyLabels[this._frequencyLabels.length - 1][1] = this._xPosToFreq(normX);
    }
  }

  get inlet () { return this._analyser; }

  _freqToXpos (frequency) {
    let a = Math.log10(frequency) / Math.log10(this._nyquist);
    let val = (1 / .7) * (a - .3);
    return val * this._canvas.width;
  }

  _xPosToFreq (xPos) {
    let val = (xPos / (1 / .7) + 0.3) * Math.log10(this._nyquist);
    return Math.floor(Math.pow(10, val));
  }

  render () {
    this._analyser.getByteFrequencyData(this._dataBuffer);

    this._canvasCtx.fillStyle = '#222';
    this._canvasCtx.globalAlpha = 1;
    this._canvasCtx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    for (let [label, freq] of this._frequencyLabels) {
      this._canvasCtx.font = "10px Arial";
      this._canvasCtx.fillStyle = 'silver';
      const x = this._freqToXpos(freq);
      this._canvasCtx.strokeStyle = 'gray';
      this._canvasCtx.textAlign = 'center'
      this._canvasCtx.fillText(label, x, 10);
      this._canvasCtx.beginPath();
      this._canvasCtx.setLineDash([1, 5]);
      this._canvasCtx.moveTo(x, this._canvas.height);
      this._canvasCtx.lineTo(x, 20);
      this._canvasCtx.stroke();
    }

    if (this.mode === 'line') {
      this._renderLine();
    } else if (this.mode === 'bars') {
      this._renderBars();
    } else if (this.mode === 'both') {
      this._renderLine();
      this._renderBars();
    }
    
   
    requestAnimationFrame(this._render);
  }


  _renderBars () {
    this._canvasCtx.lineWidth = 1;
    this._canvasCtx.setLineDash([]);

    this._canvasCtx.strokeStyle = 'gray';

    const w = this._canvas.width / this._binCount;

    for (let i = 0; i < this._binCount; i++) {
      const val = 1.0 - this._dataBuffer[i] / 256.0;
      const y = (val * this._canvas.height);

      const freq = this._nyquist * i / this._binCount;
      const x = this._freqToXpos(freq);

      this._canvasCtx.beginPath();
      this._canvasCtx.moveTo(x, this._canvas.height);
      this._canvasCtx.lineTo(x, y);
      this._canvasCtx.stroke();
    }
  }


  _renderLine () {
    const w = this._canvas.width / this._binCount;
    

    this._canvasCtx.lineWidth = 2;
    this._canvasCtx.setLineDash([]);
    this._canvasCtx.strokeStyle = 'silver';

    
    this._canvasCtx.beginPath();
    const valAtZero = 1.0 - this._dataBuffer[0]  / 256.0;
    this._canvasCtx.moveTo(0, valAtZero * this._canvas.height);


    for (let i = 0; i < this._binCount; i++) {
      const val = 1.0 - this._dataBuffer[i] / 256.0;
      const y = (val * this._canvas.height + 2);
      const freq = this._nyquist * i / this._binCount;
      const x = this._freqToXpos(freq);
      this._canvasCtx.lineTo(x, y);
    }
    this._canvasCtx.stroke();

  }
}