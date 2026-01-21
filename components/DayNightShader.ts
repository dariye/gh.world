import * as THREE from "three";
import SunCalc from "suncalc";

// Vertex shader - passes UV and world position to fragment shader
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader - blends day/night textures based on sun direction
const fragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    // Calculate how much this point faces the sun
    // dot product ranges from -1 (away from sun) to 1 (facing sun)
    float sunFacing = dot(vNormal, sunDirection);

    // Use smoothstep for twilight transition
    // -0.1 to 0.1 creates a band about 11 degrees wide (roughly realistic)
    float dayFactor = smoothstep(-0.1, 0.1, sunFacing);

    // Sample both textures
    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);

    // Mix between night and day
    gl_FragColor = mix(nightColor, dayColor, dayFactor);
  }
`;

export interface SunPosition {
  direction: THREE.Vector3;
  azimuth: number;
  altitude: number;
}

/**
 * Calculate sun direction vector for a given time.
 * Returns a normalized vector pointing from Earth toward the sun.
 */
export function getSunPosition(date: Date = new Date()): SunPosition {
  // Calculate sun position (azimuth and altitude at lat=0, lng=0)
  // We use the subsolar point (where sun is directly overhead)
  const sunPos = SunCalc.getPosition(date, 0, 0);

  // Convert sun position to a direction vector in world coordinates
  // The sun direction is based on Earth's orientation
  // At any moment, the subsolar point is where the sun is directly overhead

  // Calculate the subsolar point (latitude and longitude where sun is at zenith)
  // This is approximately: lng = -15 * hours from solar noon
  // lat = solar declination (varies through year)

  // Get times for solar noon at longitude 0
  const times = SunCalc.getTimes(date, 0, 0);

  // Calculate hour angle (how far we are from solar noon at lng=0)
  const solarNoonTime = times.solarNoon.getTime();
  const hourAngle = ((date.getTime() - solarNoonTime) / (3600 * 1000)) * 15; // degrees

  // Subsolar longitude (where sun is at zenith)
  const subSolarLng = -hourAngle;

  // Solar declination (approximation)
  // This is the latitude where the sun is directly overhead
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
  const declination = -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));

  // Convert subsolar point to a 3D direction vector
  // In Three.js globe coordinates: X = right, Y = up, Z = toward camera
  // We need to rotate this based on the globe's actual orientation
  const latRad = (declination * Math.PI) / 180;
  const lngRad = (subSolarLng * Math.PI) / 180;

  // Convert lat/lng to 3D unit vector
  // This points FROM the earth center TOWARD the sun
  const direction = new THREE.Vector3(
    Math.cos(latRad) * Math.sin(lngRad),
    Math.sin(latRad),
    Math.cos(latRad) * Math.cos(lngRad)
  );

  return {
    direction: direction.normalize(),
    azimuth: sunPos.azimuth,
    altitude: sunPos.altitude
  };
}

/**
 * Create a ShaderMaterial for day/night blending on the globe.
 */
export function createDayNightMaterial(
  dayTextureUrl: string = "//unpkg.com/three-globe/example/img/earth-day.jpg",
  nightTextureUrl: string = "//unpkg.com/three-globe/example/img/earth-night.jpg"
): THREE.ShaderMaterial {
  const textureLoader = new THREE.TextureLoader();

  const dayTexture = textureLoader.load(dayTextureUrl);
  const nightTexture = textureLoader.load(nightTextureUrl);

  // Set texture parameters for quality
  [dayTexture, nightTexture].forEach(tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
  });

  const sunPos = getSunPosition();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayTexture },
      nightTexture: { value: nightTexture },
      sunDirection: { value: sunPos.direction }
    },
    vertexShader,
    fragmentShader
  });

  return material;
}

/**
 * Update the sun direction uniform in a day/night material.
 */
export function updateSunDirection(material: THREE.ShaderMaterial, date: Date = new Date()): void {
  const sunPos = getSunPosition(date);
  material.uniforms.sunDirection.value.copy(sunPos.direction);
}
