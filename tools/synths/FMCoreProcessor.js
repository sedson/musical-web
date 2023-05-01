const phasor = (f, sr, time) => (time) % 1;
const lerp = (a, b, t) => a + t * (b - a);
const TAU = 2 * Math.PI;



class FMCoreProcessor extends AudioWorkletProcessor {

  constructor () {
    super();
    this.frequencyDelta = 0;
    this.previousFrequency = 440;
    this.previousSample = 0;
  }

  param ( parameters, paramName, sampleIndex ) {
    if (!parameters[paramName]) return 0;
    return parameters[paramName].length > 1
      ? parameters[paramName][sampleIndex] 
      : parameters[paramName][0];
  }

  static get parameterDescriptors () {
    return [
      {
        name: 'frequency',
        defaultValue: 440,
        minValue: 0,
        maxValue: 0.5 * sampleRate,
        automationRate: 'a-rate'
      },
      {
        name: 'noise', 
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: 'a-rate'
      },
      {
        name: 'bend',
        defaultValue: 1,
        minValue: 0.25,
        maxValue: 20,
        automationRate: 'a-rate',
      },
      {
        name: 'crunch',
        defaultValue: 1,
        minValue: 0.25,
        maxValue: 20,
        automationRate: 'a-rate',
      },
      {
        name: 'stack',
        defaultValue: 0,
        minValue: -20, 
        maxValue: 20,
        automationRate: 'a-rate'
      }
    ];
  }

  /**
   * Render the samples.
   */ 
  process (inputs, outputs, parameters) {
    for (const output of outputs) {
      for (let channelIndex = 0; channelIndex < output.length; channelIndex++) {
        const channel = output[channelIndex];
        for (let i = 0; i < channel.length; i++) {

          // Compute global time in seconds. 
          const globalTime = currentTime + (i / sampleRate);

          // Read the frequency.
          const freq = this.param(parameters, 'frequency', i);
          const bend = this.param(parameters, 'bend', i);
          const crunch = this.param(parameters, 'crunch', i);
          const stack = this.param(parameters, 'stack', i);
          const noise = this.param(parameters, 'noise', i);


          // Handle automation smoothing. Why this?
          this.frequencyDelta += globalTime * (this.previousFrequency - freq);
          this.previousFrequency = freq;

          // Get a 0->1 phase ramp at frequency.
          let phase = (globalTime * freq + this.frequencyDelta) % 1;

          // Take a sample for the fundamental.
          const fundamental = Math.sin(phase * TAU);

          // Handle the crunch param. Basically the opposite of smooth-stepping phase.
          phase = lerp(Math.pow(phase, crunch), 1 - Math.pow((1 - phase), crunch), phase);

          phase = Math.pow(phase, bend);


          const s1 = Math.sin(phase * TAU);
          const s2 = Math.sin(phase * TAU + (this.previousSample * stack));

          const r = Math.random() * 2 - 1;

          channel[i] = (fundamental + s2) * 0.5 + (r * noise);
          // channel[i] = (s2) + (r * noise);


          this.previousSample = channel[i];


          // const rand = 0.001 * (Math.random() * 2 - 1);
          // channel[i] =  0.5 * (Math.sin(angle) + fundamental) + rand;
          // channel[n] = fundamental;

        }
      }
    }

    return true;
  }
}

registerProcessor('fm-core-processor', FMCoreProcessor);