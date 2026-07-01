import * as THREE from "three";

/**
 * Radius of the sky dome. Large enough that the camera (which only roams the
 * ~48-unit arena) always sits comfortably inside, yet within the camera's
 * far plane (200) so it never gets clipped.
 */
const RADIUS = 150;

/** How fast the hue oscillation cycles (radians/sec fed to a sine). */
const HUE_SPEED = 0.08;
/** Peak hue rotation, in radians (~13°). Kept small so the shift is subtle. */
const HUE_AMPLITUDE = 0.22;
/** How fast the gradient band drifts up/down over time. */
const DRIFT_SPEED = 0.1;
/** Peak vertical drift of the gradient band (fraction of the dome height). */
const DRIFT_AMPLITUDE = 0.03;

/** Colour at the top of the dome (deep night sky). */
const TOP_COLOR = 0x070812;
/** Colour at the horizon (dusky blue that blends with the fog). */
const BOTTOM_COLOR = 0x243a63;

const vertexShader = /* glsl */ `
  varying vec3 vDir;

  void main() {
    // The sphere is centred on the camera every frame, so the local position
    // direction reads as an infinite, translation-invariant sky direction.
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform float uHueSpeed;
  uniform float uHueAmplitude;
  uniform float uDriftSpeed;
  uniform float uDriftAmplitude;

  varying vec3 vDir;

  // Rotate an RGB colour around the grey (1,1,1) axis — a true hue shift that
  // preserves luminance, so brightness/readability stays constant.
  vec3 hueRotate(vec3 color, float angle) {
    const vec3 k = vec3(0.57735026919);
    float c = cos(angle);
    return color * c + cross(k, color) * sin(angle) + k * dot(k, color) * (1.0 - c);
  }

  void main() {
    // Map the view direction's elevation (-1..1) to a 0..1 gradient factor and
    // let it drift slowly so the horizon breathes.
    float h = vDir.y * 0.5 + 0.5 + sin(uTime * uDriftSpeed) * uDriftAmplitude;
    float t = smoothstep(0.0, 1.0, clamp(h, 0.0, 1.0));

    vec3 col = mix(uBottom, uTop, t);
    col = hueRotate(col, sin(uTime * uHueSpeed) * uHueAmplitude);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * An animated gradient sky dome. A large inward-facing sphere rendered with a
 * custom {@link THREE.ShaderMaterial}: the fragment shader paints a smooth
 * top→horizon gradient and subtly rotates its hue and drifts the band over
 * time (driven by a `uTime` uniform).
 *
 * The dome follows the camera each frame so it reads as an infinite backdrop,
 * and it opts out of fog (`fog: false`) so distant fogged geometry blends into
 * the horizon colour rather than the sky being flattened to the fog colour.
 *
 * Created in Game's constructor and ticked from `update()` — including while
 * paused or on the menu — so the background always feels alive.
 */
export class Skybox {
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;

  constructor() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTop: { value: new THREE.Color(TOP_COLOR) },
        uBottom: { value: new THREE.Color(BOTTOM_COLOR) },
        uHueSpeed: { value: HUE_SPEED },
        uHueAmplitude: { value: HUE_AMPLITUDE },
        uDriftSpeed: { value: DRIFT_SPEED },
        uDriftAmplitude: { value: DRIFT_AMPLITUDE },
      },
      vertexShader,
      fragmentShader,
      // Render the inside of the sphere; never write depth so all gameplay
      // geometry draws on top of it.
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });

    const geometry = new THREE.SphereGeometry(RADIUS, 32, 16);
    this.mesh = new THREE.Mesh(geometry, this.material);
    // Always visible (it surrounds the camera) and drawn first.
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;
  }

  /**
   * Advances the animation clock and re-centres the dome on the camera so it
   * stays an infinite backdrop no matter where the player roams.
   */
  update(dt: number, cameraPosition: THREE.Vector3): void {
    this.material.uniforms.uTime.value += dt;
    this.mesh.position.copy(cameraPosition);
  }
}
