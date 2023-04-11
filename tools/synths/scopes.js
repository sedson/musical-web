/**
 * @file Provide web-gl powered oscilloscope classes.
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
 * Waveform oscilloscope.
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