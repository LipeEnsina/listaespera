"use client";

import { useEffect, useRef } from "react";
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

const MAX_GRADIENT_STOPS = 8;
/** Teto fixo dos loops do shader — ver comentário em fragmentShader. */
const MAX_LINES = 32;

const vertexShader = /* glsl */ `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Os loops usam um teto constante (MAX_LINES / MAX_GRADIENT_STOPS) com `break`,
 * e a leitura do gradiente é feita comparando o índice do loop em vez de indexar
 * o array com um valor calculado. GLSL ES 1.00 só garante indexação dinâmica de
 * uniform arrays por índice de loop — sem isso o shader falha em compilar em
 * drivers mais estritos (comum em Android).
 */
const fragmentShader = /* glsl */ `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[${MAX_GRADIENT_STOPS}];
uniform int lineGradientCount;

const int MAX_LINES = ${MAX_LINES};
const int MAX_STOPS = ${MAX_GRADIENT_STOPS};

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);
  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;
  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

/** Lê a rampa de cores sem indexar o array com valor calculado. */
vec3 gradientAt(int index) {
  vec3 result = vec3(0.0);
  for (int i = 0; i < MAX_STOPS; ++i) {
    if (i == index) result = lineGradient[i];
  }
  return result;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) return baseColor;
  if (lineGradientCount == 1) return gradientAt(0) * 0.5;

  float clampedT = clamp(t, 0.0, 0.9999);
  float scaled = clampedT * float(lineGradientCount - 1);
  int idx = int(floor(scaled));
  float f = fract(scaled);
  int idx2 = min(idx + 1, lineGradientCount - 1);

  return mix(gradientAt(idx), gradientAt(idx2), f) * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;

  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius); // atenuação radial em volta do cursor
    y += (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;

  if (parallax) baseUv += parallaxOffset;

  vec3 col = vec3(0.0);
  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  if (enableBottom) {
    for (int i = 0; i < MAX_LINES; ++i) {
      if (i >= bottomLineCount) break;
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);

      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi, baseUv, mouseUv, interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < MAX_LINES; ++i) {
      if (i >= middleLineCount) break;
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);

      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi, baseUv, mouseUv, interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < MAX_LINES; ++i) {
      if (i >= topLineCount) break;
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);

      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi, baseUv, mouseUv, interactive
      ) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

type WavePosition = { x: number; y: number; rotate: number };
type WaveName = "top" | "middle" | "bottom";

export type FloatingLinesProps = {
  /** Rampa de cores das linhas em hex. Sem ela, cai no degradê azul/rosa padrão. */
  linesGradient?: string[];
  enabledWaves?: WaveName[];
  lineCount?: number | number[];
  lineDistance?: number | number[];
  topWavePosition?: WavePosition;
  middleWavePosition?: WavePosition;
  bottomWavePosition?: WavePosition;
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  mixBlendMode?: React.CSSProperties["mixBlendMode"];
  /** Abaixo desta largura reduzimos densidade e resolução para poupar bateria. */
  mobileBreakpoint?: number;
  className?: string;
};

function hexToVec3(hex: string): Vector3 {
  let value = hex.trim();
  if (value.startsWith("#")) value = value.slice(1);

  let r = 255;
  let g = 255;
  let b = 255;

  if (value.length === 3) {
    r = parseInt(value[0] + value[0], 16);
    g = parseInt(value[1] + value[1], 16);
    b = parseInt(value[2] + value[2], 16);
  } else if (value.length === 6) {
    r = parseInt(value.slice(0, 2), 16);
    g = parseInt(value.slice(2, 4), 16);
    b = parseInt(value.slice(4, 6), 16);
  }

  return new Vector3(r / 255, g / 255, b / 255);
}

export default function FloatingLines({
  linesGradient,
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = [6],
  lineDistance = [5],
  topWavePosition,
  middleWavePosition,
  bottomWavePosition = { x: 2.0, y: -0.7, rotate: -1 },
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5.0,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  mixBlendMode = "screen",
  mobileBreakpoint = 768,
  className = "",
}: FloatingLinesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Guardamos as props num ref para que o efeito rode uma vez só: recriar o
  // contexto WebGL a cada render seria caríssimo, e as props aqui são fixas.
  const propsRef = useRef({
    linesGradient,
    enabledWaves,
    lineCount,
    lineDistance,
    topWavePosition,
    middleWavePosition,
    bottomWavePosition,
    animationSpeed,
    interactive,
    bendRadius,
    bendStrength,
    mouseDamping,
    parallax,
    parallaxStrength,
    mobileBreakpoint,
  });
  propsRef.current = {
    linesGradient,
    enabledWaves,
    lineCount,
    lineDistance,
    topWavePosition,
    middleWavePosition,
    bottomWavePosition,
    animationSpeed,
    interactive,
    bendRadius,
    bendStrength,
    mouseDamping,
    parallax,
    parallaxStrength,
    mobileBreakpoint,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const p = propsRef.current;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const countFor = (wave: WaveName): number => {
      if (!p.enabledWaves.includes(wave)) return 0;
      if (typeof p.lineCount === "number") return p.lineCount;
      const index = p.enabledWaves.indexOf(wave);
      return Math.min(p.lineCount[index] ?? 6, MAX_LINES);
    };

    const distanceFor = (wave: WaveName): number => {
      if (!p.enabledWaves.includes(wave)) return 0.01;
      if (typeof p.lineDistance === "number") return p.lineDistance * 0.01;
      const index = p.enabledWaves.indexOf(wave);
      return (p.lineDistance[index] ?? 0.1) * 0.01;
    };

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      // Sem WebGL (driver bloqueado, GPU na blocklist): a página continua
      // funcionando com o fundo preto — o efeito é decoração, não conteúdo.
      return;
    }

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    // Entra suave: como o módulo carrega depois do primeiro paint, aparecer
    // de uma vez seria um flash sobre a página já montada.
    renderer.domElement.style.opacity = "0";
    renderer.domElement.style.transition = "opacity 900ms ease-out";
    container.appendChild(renderer.domElement);
    requestAnimationFrame(() => {
      renderer.domElement.style.opacity = "1";
    });

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3(1, 1, 1) },
      animationSpeed: { value: p.animationSpeed },

      enableTop: { value: p.enabledWaves.includes("top") },
      enableMiddle: { value: p.enabledWaves.includes("middle") },
      enableBottom: { value: p.enabledWaves.includes("bottom") },

      topLineCount: { value: countFor("top") },
      middleLineCount: { value: countFor("middle") },
      bottomLineCount: { value: countFor("bottom") },

      topLineDistance: { value: distanceFor("top") },
      middleLineDistance: { value: distanceFor("middle") },
      bottomLineDistance: { value: distanceFor("bottom") },

      topWavePosition: {
        value: new Vector3(
          p.topWavePosition?.x ?? 10.0,
          p.topWavePosition?.y ?? 0.5,
          p.topWavePosition?.rotate ?? -0.4,
        ),
      },
      middleWavePosition: {
        value: new Vector3(
          p.middleWavePosition?.x ?? 5.0,
          p.middleWavePosition?.y ?? 0.0,
          p.middleWavePosition?.rotate ?? 0.2,
        ),
      },
      bottomWavePosition: {
        value: new Vector3(
          p.bottomWavePosition?.x ?? 2.0,
          p.bottomWavePosition?.y ?? -0.7,
          p.bottomWavePosition?.rotate ?? 0.4,
        ),
      },

      iMouse: { value: new Vector2(-1000, -1000) },
      interactive: { value: p.interactive && !reducedMotion },
      bendRadius: { value: p.bendRadius },
      bendStrength: { value: p.bendStrength },
      bendInfluence: { value: 0 },

      parallax: { value: p.parallax && !reducedMotion },
      parallaxOffset: { value: new Vector2(0, 0) },

      lineGradient: {
        value: Array.from(
          { length: MAX_GRADIENT_STOPS },
          () => new Vector3(1, 1, 1),
        ),
      },
      lineGradientCount: { value: 0 },
    };

    if (p.linesGradient && p.linesGradient.length > 0) {
      const stops = p.linesGradient.slice(0, MAX_GRADIENT_STOPS);
      uniforms.lineGradientCount.value = stops.length;
      stops.forEach((hex, i) => {
        const color = hexToVec3(hex);
        uniforms.lineGradient.value[i].set(color.x, color.y, color.z);
      });
    }

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });
    const geometry = new PlaneGeometry(2, 2);
    scene.add(new Mesh(geometry, material));

    const clock = new Clock();

    const targetMouse = new Vector2(-1000, -1000);
    const currentMouse = new Vector2(-1000, -1000);
    const targetParallax = new Vector2(0, 0);
    const currentParallax = new Vector2(0, 0);
    let targetInfluence = 0;
    let currentInfluence = 0;

    let isMobile = false;

    const setSize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;

      isMobile = width < p.mobileBreakpoint;

      // Menos pixels e menos linhas no celular: o shader roda por fragmento e
      // é o custo dominante da página.
      const maxDpr = isMobile ? 1.5 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setSize(width, height, false);

      const density = isMobile ? 0.6 : 1;
      uniforms.topLineCount.value = Math.max(
        1,
        Math.round(countFor("top") * density),
      );
      uniforms.middleLineCount.value = Math.max(
        1,
        Math.round(countFor("middle") * density),
      );
      uniforms.bottomLineCount.value = Math.max(
        1,
        Math.round(countFor("bottom") * density),
      );

      uniforms.iResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
        1,
      );
    };

    setSize();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => setSize())
        : null;
    resizeObserver?.observe(container);

    // Os eventos vão na janela, não no canvas: como fundo fixo ele fica atrás
    // de todo o conteúdo e nunca receberia ponteiro por conta própria.
    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const dpr = renderer.getPixelRatio();

      targetMouse.set(x * dpr, (rect.height - y) * dpr);
      targetInfluence = 1;

      if (p.parallax) {
        const offsetX = (x - rect.width / 2) / rect.width;
        const offsetY = -(y - rect.height / 2) / rect.height;
        targetParallax.set(
          offsetX * p.parallaxStrength,
          offsetY * p.parallaxStrength,
        );
      }
    };

    const handlePointerLeave = () => {
      targetInfluence = 0;
      targetParallax.set(0, 0);
    };

    const usePointer = p.interactive && !reducedMotion;
    if (usePointer) {
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      document.addEventListener("pointerleave", handlePointerLeave);
    }

    let raf = 0;
    let running = true;

    const renderLoop = () => {
      if (!running) return;

      uniforms.iTime.value = clock.getElapsedTime();

      if (usePointer) {
        currentMouse.lerp(targetMouse, p.mouseDamping);
        uniforms.iMouse.value.copy(currentMouse);

        currentInfluence += (targetInfluence - currentInfluence) * p.mouseDamping;
        uniforms.bendInfluence.value = currentInfluence;

        if (p.parallax) {
          currentParallax.lerp(targetParallax, p.mouseDamping);
          uniforms.parallaxOffset.value.copy(currentParallax);
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(renderLoop);
    };

    if (reducedMotion) {
      // Um quadro só: a imagem fica, o movimento não.
      renderer.render(scene, camera);
    } else {
      renderLoop();
    }

    // Aba em segundo plano não precisa de GPU.
    const handleVisibility = () => {
      if (reducedMotion) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        renderLoop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);

      if (usePointer) {
        window.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerleave", handlePointerLeave);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.parentElement?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`pointer-events-none h-full w-full overflow-hidden ${className}`}
      style={{ mixBlendMode }}
    />
  );
}
