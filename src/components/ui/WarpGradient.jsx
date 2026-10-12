import { useEffect, useRef } from "react";
import { useInView } from "./useInView";

const MAX_COLORS = 5;

const VERTEX = `#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 u_size;
uniform float u_dpr;
uniform float u_clock;
uniform float u_scale;
uniform float u_turn;
uniform vec4 u_palette[${MAX_COLORS}];
uniform int u_count;
uniform int u_pattern;
uniform float u_density;
uniform float u_softness;
uniform float u_warp;
uniform float u_turbulence;
out vec4 outColor;

float hash(vec2 cell) {
  return fract(sin(dot(cell, vec2(41.37, 289.13))) * 17853.217);
}

float lean(vec2 cell, vec2 offset) {
  float angle = 6.2831853 * hash(cell);
  return dot(vec2(cos(angle), sin(angle)), offset);
}

float noise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = p - cell;
  vec2 fade = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float bottom = mix(lean(cell, f), lean(cell + vec2(1.0, 0.0), f - vec2(1.0, 0.0)), fade.x);
  float top = mix(lean(cell + vec2(0.0, 1.0), f - vec2(0.0, 1.0)), lean(cell + 1.0, f - 1.0), fade.x);
  return mix(bottom, top, fade.y);
}

const mat2 TURN = mat2(0.8776, 0.4794, -0.4794, 0.8776);

float layered(vec2 p, int layers) {
  float sum = 0.0;
  float weight = 0.55;
  for (int i = 0; i < 5; i++) {
    if (i >= layers) break;
    sum += weight * noise(p);
    p = TURN * p * 1.97 + vec2(3.7, -1.9);
    weight *= 0.5;
  }
  return sum;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_size) / u_dpr * mix(0.0065, 0.0012, u_scale);
  float c = cos(u_turn);
  float s = sin(u_turn);
  p = mat2(c, s, -s, c) * p;
  float t = 0.15 * u_clock;
  int layers = 1 + int(u_turbulence * 4.0 + 0.5);
  vec2 drift = vec2(t, -0.6 * t);
  vec2 q = 0.6 * p;
  vec2 first = vec2(layered(q + drift, layers), layered(q + vec2(5.3, -2.1) - drift, layers));
  vec2 second = vec2(
    layered(q + 1.8 * first + vec2(-4.6, 7.2) + drift.yx, layers),
    layered(q + 1.8 * first + vec2(8.1, 1.4) - 0.5 * drift, layers)
  );
  vec2 w = p + 1.8 * u_warp * second;
  float field;
  if (u_pattern == 0) {
    field = 0.5 + 0.5 * sin(3.14159265 * mix(0.5, 3.5, u_density) * w.y);
  } else if (u_pattern == 1) {
    float k = mix(1.0, 5.0, u_density);
    field = 0.5 + 0.5 * sin(k * w.x) * sin(k * w.y);
  } else {
    float spread = mix(2.5, 0.1, u_density);
    field = smoothstep(-spread, spread, w.y);
  }
  vec4 a = u_palette[0];
  vec4 color = vec4(a.rgb * a.a, a.a);
  if (u_count > 1) {
    float x = clamp(field, 0.0, 1.0) * float(u_count - 1);
    int i = min(int(x), u_count - 2);
    float reach = 0.5 * u_softness + fwidth(x);
    float blend = smoothstep(0.5 - reach, 0.5 + reach, x - float(i));
    vec4 from = u_palette[i];
    vec4 to = u_palette[i + 1];
    color = mix(vec4(from.rgb * from.a, from.a), vec4(to.rgb * to.a, to.a), blend);
  }
  color.rgb += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = color;
}`;

const defaults = {
  colors: ["#09080B", "#211722", "#48283F", "#A75E85"],
  pattern: "bands",
  density: 0.3,
  softness: 0.92,
  warp: 0.42,
  turbulence: 0.15,
  scale: 0.58,
  rotation: -20,
  speed: 0.16,
};

const patterns = { bands: 0, cells: 1, split: 2 };
const unit = (value) => Math.min(Math.max(value, 0), 1);

function resolveColor(color, probe) {
  probe.style.color = color;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return [0, 0, 0, 1];
  context.fillStyle = getComputedStyle(probe).color;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0, alpha = 255] = context.getImageData(0, 0, 1, 1).data;
  return [red / 255, green / 255, blue / 255, alpha / 255];
}

function compile(gl) {
  const program = gl.createProgram();
  if (!program) return null;
  const shaders = [];
  for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
    const shader = gl.createShader(type);
    if (!shader) {
      shaders.forEach((item) => gl.deleteShader(item));
      gl.deleteProgram(program);
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      shaders.forEach((item) => gl.deleteShader(item));
      gl.deleteProgram(program);
      return null;
    }
    gl.attachShader(program, shader);
    shaders.push(shader);
  }
  gl.linkProgram(program);
  shaders.forEach((shader) => gl.deleteShader(shader));
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function WarpGradient({
  colors = defaults.colors,
  pattern = defaults.pattern,
  density = defaults.density,
  softness = defaults.softness,
  warp = defaults.warp,
  turbulence = defaults.turbulence,
  scale = defaults.scale,
  rotation = defaults.rotation,
  speed = defaults.speed,
  grain = 0,
  className = "",
  style,
  ...props
}) {
  const canvas = useRef(null);
  const fallback = useRef(null);
  const settings = useRef(defaults);
  const visible = useRef(false);
  const wake = useRef(() => {});
  const recolor = useRef(() => {});
  const [observe, inView] = useInView("100px");
  const palette = (colors?.length ? colors : defaults.colors).slice(0, MAX_COLORS);
  const paletteKey = palette.join("|");
  const reduceMotion = useRef(false);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return undefined;
    const gl = element.getContext("webgl2", { alpha: true, premultipliedAlpha: true });
    if (!gl) return undefined;
    const program = compile(gl);
    if (!program) return undefined;
    const flat = fallback.current;
    if (flat) flat.hidden = true;
    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      if (flat) flat.hidden = false;
      return undefined;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    const names = ["u_size", "u_dpr", "u_clock", "u_scale", "u_turn", "u_palette", "u_count", "u_pattern", "u_density", "u_softness", "u_warp", "u_turbulence"];
    const uniforms = Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
    const probe = document.createElement("span");
    probe.style.display = "none";
    element.after(probe);
    recolor.current = () => {
      const activeColors = settings.current.colors;
      const values = new Float32Array(MAX_COLORS * 4);
      activeColors.forEach((color, index) => values.set(resolveColor(color, probe), index * 4));
      gl.uniform4fv(uniforms.u_palette, values);
      gl.uniform1i(uniforms.u_count, Math.max(activeColors.length, 1));
    };

    let clock = 0;
    let ratio = 1;
    let frame = 0;
    let last = 0;
    const draw = () => {
      const current = settings.current;
      gl.useProgram(program);
      gl.uniform2f(uniforms.u_size, element.width, element.height);
      gl.uniform1f(uniforms.u_dpr, ratio);
      gl.uniform1f(uniforms.u_clock, clock);
      gl.uniform1f(uniforms.u_scale, unit(current.scale));
      gl.uniform1f(uniforms.u_turn, (current.rotation * Math.PI) / 180);
      gl.uniform1i(uniforms.u_pattern, patterns[current.pattern] ?? 0);
      gl.uniform1f(uniforms.u_density, unit(current.density));
      gl.uniform1f(uniforms.u_softness, unit(current.softness));
      gl.uniform1f(uniforms.u_warp, unit(current.warp));
      gl.uniform1f(uniforms.u_turbulence, unit(current.turbulence));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.max(1, Math.round(element.clientWidth * ratio));
      element.height = Math.max(1, Math.round(element.clientHeight * ratio));
      gl.viewport(0, 0, element.width, element.height);
      draw();
    };
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      reduceMotion.current = Boolean(still?.matches);
      wake.current();
    };
    onMotionChange();
    still?.addEventListener("change", onMotionChange);
    const loop = (now) => {
      frame = 0;
      const moving = visible.current && !reduceMotion.current && settings.current.speed !== 0;
      if (moving && last) clock += ((now - last) / 1000) * settings.current.speed;
      last = moving ? now : 0;
      draw();
      if (moving) frame = requestAnimationFrame(loop);
    };
    wake.current = () => {
      if (!frame && visible.current && !reduceMotion.current && settings.current.speed !== 0) frame = requestAnimationFrame(loop);
      else if (!visible.current || reduceMotion.current || settings.current.speed === 0) draw();
    };
    recolor.current();
    resize();
    const resizer = new ResizeObserver(resize);
    resizer.observe(element);
    const theme = new MutationObserver(() => { recolor.current(); draw(); });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    wake.current();

    return () => {
      cancelAnimationFrame(frame);
      still?.removeEventListener("change", onMotionChange);
      wake.current = () => {};
      recolor.current = () => {};
      resizer.disconnect();
      theme.disconnect();
      probe.remove();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      if (flat) flat.hidden = false;
    };
  }, []);

  useEffect(() => {
    settings.current = { colors: paletteKey.split("|"), pattern, density, softness, warp, turbulence, scale, rotation, speed };
    recolor.current();
    visible.current = inView;
    wake.current();
  }, [paletteKey, pattern, density, softness, warp, turbulence, scale, rotation, speed, inView]);

  return (
    <div
      ref={observe}
      aria-hidden="true"
      data-slot="warp-gradient"
      className={`warp-gradient ${className}`.trim()}
      style={style}
      {...props}
    >
      <div
        ref={fallback}
        data-slot="warp-gradient-fallback"
        className="warp-gradient-fallback"
        style={{ background: `linear-gradient(${rotation + 90}deg, ${palette.join(", ")})` }}
      />
      <canvas ref={canvas} className="warp-gradient-canvas" />
      {grain > 0 && <div className="warp-gradient-grain" style={{ opacity: Math.min(grain, 1) }} />}
    </div>
  );
}