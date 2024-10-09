import type { IDomPaintEvent } from '@ulixee/unblocked-specification/agent/browser/Location';

declare global {
  interface Window {
    PaintEvents: PaintEvents;
  }
}

declare const callbackName: string;
declare const callback: (name: string, data: string) => void;
const eventsCallback = callback.bind(null, callbackName);

class PaintEvents {
  onEventCallbackFn: (event: IDomPaintEvent, timestamp: number, url: string) => void;

  constructor() {
    window.addEventListener('DOMContentLoaded', () => {
      this.eventTriggered('DomContentLoaded');
    });

    window.addEventListener('load', () => {
      this.eventTriggered('AllContentLoaded');
    });

    if (window.self.location?.href !== 'about:blank') {
      const paintObserver = new PerformanceObserver(entryList => {
        if (entryList.getEntriesByName('first-contentful-paint').length) {
          this.eventTriggered('FirstContentfulPaint');
          paintObserver.disconnect();
        }
      });
      paintObserver.observe({ type: 'paint', buffered: true });

      const contentStableObserver = new PerformanceObserver(() => {
        this.eventTriggered('LargestContentfulPaint');
        contentStableObserver.disconnect();
      });
      contentStableObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } else {
      this.eventTriggered('FirstContentfulPaint');
      this.eventTriggered('LargestContentfulPaint');
    }
  }

  eventTriggered(event: IDomPaintEvent) {
    const timestamp = Date.now();
    const url = window.self.location.href;
    eventsCallback(JSON.stringify({ timestamp, event, url }));
    if (this.onEventCallbackFn) this.onEventCallbackFn(event, timestamp, url);
  }
}

window.PaintEvents = new PaintEvents();
