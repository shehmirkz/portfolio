// Document polyfill for server-side rendering
if (typeof globalThis !== 'undefined' && typeof globalThis.document === 'undefined') {
  const createElement = (tagName: string) => {
    const element: any = {
      setAttribute: () => {},
      getAttribute: () => null,
      appendChild: () => {},
      removeChild: () => {},
      style: {},
      innerHTML: '',
      className: '',
      tagName: tagName.toUpperCase(),
    };
    
    // Add getContext for canvas elements
    if (tagName === 'canvas') {
      element.getContext = () => ({
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 }),
        putImageData: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        canvas: element,
      });
    }
    
    return element;
  };
  
  globalThis.document = {
    createElement,
    createElementNS: function(ns: string, tagName: string) {
      return createElement(tagName);
    },
    getElementsByTagName: () => [],
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    body: {
      appendChild: () => {},
      removeChild: () => {},
      style: {},
    },
  } as any;
}

if (typeof global !== 'undefined' && typeof (global as any).document === 'undefined') {
  (global as any).document = globalThis.document;
}

