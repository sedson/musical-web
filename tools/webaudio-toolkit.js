/**
 * @file Tools for web audio. Building as I go.
 */

function createCtx () {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    console.error('Web Audio API not supported on this browser');
    return;
  }
  return new AudioContext();
};



/**
 * A nice class to wrap web audio context and some features.
 */
class Audio {
  constructor () {
    this.ctx = createCtx();
    this._buffers = {};
    this.tracks = {};
  }

  _getTrack (path) {
    if (!this.tracks[path]) return;
    if (!this.tracks[path].ready) return;
    return this.tracks[path];
  }

  /**
   * Try to load an audio file, located at path into an in-memory audio buffer.
   * @param {string} path
   */
  async _loadSource (path, options = {}) {
    const res = await fetch(path);
    const buffer = await res.arrayBuffer();

    const onSuccess = buffer => {
      this._buffers[path] = buffer;

      const track = {
        ready: true,
        playing: false,
        source: null,
        playbackSpeed: 1,
        effectChain: {},
      };

      if (options.pan) {
        track.effectChain.panner = this.ctx.createStereoPanner();        
      }

      if (options.gain) {
        track.effectChain.gain = this.ctx.createGain();  
      }

      this.tracks[path] = track;
    };

    const onError = error => {
      console.log(`Error loading ${path}: ${error.error}`)
    };

    this.ctx.decodeAudioData(buffer, onSuccess, onError);
  }


  /**
   * Add a media source.
   * @param {HTMLElement} source
   */
  addMediaSource (source) {
    
    const track = this.ctx.createMediaElementSource(source);

    track.connect(this.ctx.destination);

    return {
      play: () => {
        if (this.ctx.state === 'suspended') { 
          this.ctx.resume(); 
        }

        source.play();
      },
      pause: () => {
        source.pause();
      }
    }
  }


  playTrack (track, options = {}) {
    const info = this._getTrack(track);

    console.log(info)
    if (!info) { return };

    if (info.source) {
      info.source.stop();
    }

    info.source = new AudioBufferSourceNode(this.ctx);
    info.source.buffer = this._buffers[track];
    info.source.loop = options.loop ?? true;
    info.source.playbackRate.value = info.playbackSpeed;

    
    let lastNode = info.source;
    for (const [ name, node ] of Object.entries(info.effectChain)) {
      lastNode.connect(node);
      lastNode = node;
    }

    lastNode.connect(this.ctx.destination);


    info.source.start(0);

    console.log('playing ', track);
  }


  setTrackSpeed (track, speed) {
    const info = this._getTrack(track);
    if (!info) { return };

    info.playbackSpeed = speed;
    if (info.source) {
      info.source.playbackRate.value = Math.max(0.001, speed);
    }
  }

  setTrackPan (track, pan) {
    const info = this._getTrack(track);
    if (!info) { return; }

    info.effectChain.panner.pan.value = pan;


  }

  setTrackGain (track, gain) {
    const info = this._getTrack(track);
    if (!info) { return; }

    info.effectChain.gain.gain.value = gain;
  } 

  stopTrack (track) {
    const info = this._getTrack(track);
    if (!info) { return };

    if (info.source) {
      info.source.stop();
      info.source = null;
    }

    console.log('stopping ', track);
  }


  /**
   * Add an in memory audio buffer based on a source. 
   * @param {string} path A path to the audio file.
   * @return {object} An object with control functions for the newly created 
   *     audio track.
   */
  addBufferFromSource (path, options = {}) {
    this._loadSource(path, options);

    const trackControls = {
      play: () => {
        this.playTrack(path);
      }, 
      pause: () => {
        this.stopTrack(path);
      },
      setSpeed: (speed) => {
        this.setTrackSpeed(path, speed)
      }
    };

    if (options.pan) {
      trackControls.setPan = (pan) => {
        this.setTrackPan(path, pan);
      };
    }

    if (options.gain) {
      trackControls.setGain = (gain) => {
        this.setTrackGain(path, gain);
      };
    }

    return trackControls;
  }

}



