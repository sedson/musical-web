/**
 * @file Tools for web audio. Building as I go.
 */


/**
 * Make an audio context.
 */ 
function createCtx () {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    console.error('Web Audio API not supported on this browser');
    return;
  }
  return new AudioContext();
}


/**
 * Make an audio context.
 */ 
class AudioTrack {
  
  constructor (path, ctx, options = {}) {
    /** The load path for this track. */
    this.path = path;

    /** The buffer of audio data. Will be null until load buffer is called */
    this.buffer = null;

    /** The source node. */
    this.source = null;

    /** The parent audio context. */
    this.ctx = ctx;

    /** Whether the track is ready to be played. */
    this.ready = false;

    this.effectChain = [];

    /** The output bus. */
    this.bus = {
      gain: this.ctx.createGain(),
      panner: this.ctx.createStereoPanner(),
    };

    /** Whether the track loops. */
    this.loop = options.loop ?? true;

    /** The playback speed for the track. */
    this._speed = options.speed || 1;

    /** The 0->1 gain value for the track. */
    this._gain = options.gain || 1;

    /** The -1->+1 stereo pan value for the track. */
    this._pan = options.pan || 0;
  }

  get speed () { return this._speed; }
  set speed (value) {
    this._speed = value;
    if (this.source) {
      this.source.playbackRate.value = value;
    }
  }

  get gain () { return this._gain; }
  set gain (value) {
    this._gain = value;
    this.bus.gain.gain.value = value;
  }

  get pan () { return this._pan; }
  set pan (value) {
    this._pan = value;
    this.bus.panner.pan.value = value;
  } 


  /**
   * Play the track.
   */
  play (startTime = 0) {
    if (!this.ready) { return; }

    if (this.source) {
      this.source.stop();
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = this._speed;
    this.source.loop = this.loop;

    let lastNode = this.source;
    for (effectNode of this.effectChain) {
      lastNode.connect(effectNode);
      lastNode = effectNode;
    }

    lastNode.connect(this.bus.panner);
    this.bus.panner.connect(this.bus.gain);
    this.bus.gain.connect(this.ctx.destination);

    this.source.start(0);
    console.log('playing ', this.path);
  }


  /**
   * Stop the track.
   */ 
  stop () {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
  }

  loadBuffer (buffer) {
    this.buffer = buffer;
    this.ready = true;
  }
}


/**
 * A nice class to wrap web audio context and some features.
 */
class Audio {

  constructor () {
    /** The audio context. */ 
    this.ctx = createCtx();

    /** The output dac. */
    this.dac = this.ctx.destination;

    /** The list of "tracks", which bind a buffer to extra data. */ 
    this.tracks = {};
  }


  /**
   * Try to load an audio file, located at path into an in-memory audio buffer.
   * @param {string} path
   */
  async _loadPath (path, onload = () => {}) {
    const res = await fetch(path);
    const buffer = await res.arrayBuffer();

    const onSuccess = data => {
      this.tracks[path].loadBuffer(data);
    };

    const onError = error => {
      console.log(`Error loading ${path}: ${error.error}`);
    };

    this.ctx.decodeAudioData(buffer, onSuccess, onError);
    onload();
  }


  /**
   * Add an in memory audio buffer based on a source. 
   * @param {string} path A path to the audio file.
   * @return {object} An object with control functions for the newly created 
   *     audio track.
   */
  createTrack (path, options = {}) {
    this.tracks[path] = new AudioTrack(path, this.ctx, options);
    if (options.onload) {
      this._loadPath(path, () => options.onload(this.tracks[path]));
    } else {
      this._loadPath(path);
    }
    return this.tracks[path];
  }
}
