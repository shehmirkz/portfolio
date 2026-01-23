import * as Sentry from '@sentry/nextjs';

// Set up document polyfill for three-globe during SSR
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
    createElementNS: function(ns: string, tagName: string) {
      return this.createElement(tagName);
    },
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

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
