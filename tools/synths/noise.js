/**
 * @file Noise sources
 */ 

import { Operator } from './operator.js';


/**
 * @class A white noise source.
 */ 
export class Noise extends Operator {

  constructor (ctx, bufferLength = 0.5) {
    super(ctx);
    this.sampleRate = ctx.sampleRate;

    // Fill a buffer with white noise
    this._buffer = new AudioBuffer({
      numberOfChannels: 1,
      length: ctx.sampleRate * bufferLength,
      sampleRate: ctx.sampleRate
    });

    for (let c = 0; c < this._buffer.numberOfChannels; c++) {
      const channelBuffer = this._buffer.getChannelData(c);
      for (let i = 0; i < this._buffer.length; i++) {
        channelBuffer[i] = Math.random() * 2 - 1;
      }
    }

    /**
     * The audio buffer.
     */ 
    this._source = new AudioBufferSourceNode (ctx, {
      loop: true,
      buffer: this._buffer,
    });

    /** 
     * The gain.
     */ 
    this._gain = new GainNode(ctx);

    // Connect and start.
    this._source.connect(this._gain);
    this._source.start(ctx.currentTime);
  }

  get outlet () { return this._gain; }
  get gain () { return this._gain.gain; }
}


/**
 * A buffer full of slowed-down white noise.
 */ 
export class RandomSource extends Operator {
  constructor (ctx, bufferLength = 1, steps = 8) {
    super(ctx);
    this.sampleRate = ctx.sampleRate;

    this._buffer = new AudioBuffer({
      numberOfChannels: 1, 
      length: ctx.sampleRate * bufferLength,
      sampleRate: ctx.sampleRate
    });


    const samplesPerStep = Math.floor(this._buffer.length / steps);

    for (let c = 0; c < this._buffer.numberOfChannels; c++) {
      const channelBuffer = this._buffer.getChannelData(c);

      for (let step = 0; step < steps; step++) {
        let randomValue = Math.random() * 2 - 1;
        for (let i = 0; i < samplesPerStep; i++ ){
          channelBuffer[step * samplesPerStep + i] = randomValue;
        }
      }
    }

    /**
     * The audio buffer.
     */ 
    this._source = new AudioBufferSourceNode (ctx, {
      loop: true,
      buffer: this._buffer,
    });

    /** 
     * The gain.
     */ 
    this._gain = new GainNode(ctx);

    // Connect and start.
    this._source.connect(this._gain);
    this._source.start(ctx.currentTime);

    this.exposeParam('speed', this._source.playbackRate, 1, 0, 8, 0);
    this.exposeParam('gain', this._gain.gain, 1, -1000, 1000, 0);
  }

  get outlet () { return this._gain; }

  clock (interval) {
    this.baseSpeed = this._buffer.length;
  }

  restart () {
    this._source.stop();
    this._source.disconnect();
    this._source = new AudioBufferSourceNode (this.ctx, {
      loop: true,
      buffer: this._buffer,
    });
    this._source.start();
    this._source.connect(this._gain);
  }

  
}