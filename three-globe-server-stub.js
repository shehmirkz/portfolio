// Server-side stub for three-globe - provides document polyfill
if (typeof globalThis !== 'undefined' && typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: () => ({
      setAttribute: () => {},
      getAttribute: () => null,
      appendChild: () => {},
      removeChild: () => {},
      style: {},
      innerHTML: '',
      className: '',
    }),
    createElementNS: function(ns, tagName) {
      return this.createElement(tagName);
    },
    body: {
      appendChild: () => {},
      removeChild: () => {},
      style: {},
    },
  };
}
if (typeof global !== 'undefined' && typeof global.document === 'undefined') {
  global.document = globalThis.document;
}

// Export a stub class that matches three-globe's interface
class ThreeGlobeStub {
  constructor() {
    // Stub methods that might be called
    this.hexPolygonsData = () => this;
    this.hexPolygonResolution = () => this;
    this.hexPolygonMargin = () => this;
    this.showAtmosphere = () => this;
    this.atmosphereColor = () => this;
    this.atmosphereAltitude = () => this;
    this.hexPolygonColor = () => this;
    this.arcsData = () => this;
    this.arcStartLat = () => this;
    this.arcStartLng = () => this;
    this.arcEndLat = () => this;
    this.arcEndLng = () => this;
    this.arcColor = () => this;
    this.arcAltitude = () => this;
    this.arcStroke = () => this;
    this.arcDashLength = () => this;
    this.arcDashInitialGap = () => this;
    this.arcDashGap = () => this;
    this.arcDashAnimateTime = () => this;
    this.pointsData = () => this;
    this.pointColor = () => this;
    this.pointsMerge = () => this;
    this.pointAltitude = () => this;
    this.pointRadius = () => this;
    this.ringsData = () => this;
    this.ringColor = () => this;
    this.ringMaxRadius = () => this;
    this.ringPropagationSpeed = () => this;
    this.ringRepeatPeriod = () => this;
    this.globeMaterial = () => ({});
  }
}

export default ThreeGlobeStub;

