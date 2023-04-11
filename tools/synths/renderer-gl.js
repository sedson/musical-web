export class RendererGL {
  constructor (canvas) {
    this.gl = canvas.getContext('webgl2');
    if (!this.gl) return;
  }

  shaders (vs, fs) {
    const program = this.gl.createProgram();
    
    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertexShader, vs);
    this.gl.compileShader(vertexShader);
    this.gl.attachShader(program, vertexShader);
    
    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragmentShader, fs);
    this.gl.compileShader(fragmentShader);
    this.gl.attachShader(program, fragmentShader);

    this.gl.linkProgram(program);

    if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.log('WebGL program created.');
      this.gl.useProgram(program);
      this.program = program;
    } else {
      console.error('SHADER ERROR')
      console.log(this.gl.getShaderInfoLog(vertexShader));
      console.log(this.gl.getShaderInfoLog(fragmentShader));
      return;
    }

    this.uniforms = {};

    const uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const uniformInfo = this.gl.getActiveUniform(program, i);
      const { name } = uniformInfo;
      this.uniforms[name] = this.gl.getUniformLocation(program, name);
    }
  }

  clear (r, g, b, a) {
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  u (name) {
    return this.uniforms[name];
  }
}