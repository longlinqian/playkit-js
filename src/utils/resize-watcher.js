//@flow
import FakeEvent from '../event/fake-event';
import FakeEventTarget from '../event/fake-event-target';
import {CustomEventType} from '../event/event-type';

/**
 * A Factory class to create a resize observer for the player.
 */
class ResizeWatcher extends FakeEventTarget {
  _observer: Object;
  _playerId: string;

  constructor() {
    super();
  }

  /**
   * Removes resize listeners.
   * @returns {void}
   */
  destroy(): void {
    if (this._observer) {
      this._observer.disconnect();
    }
    this._observer = null;
    this._playerId = '';
  }

  /**
   * Start listening to a resize of the element.
   * @param {string} playerId - the target to listen to.
   * @returns {void}
   */
  init(playerId: string): void {
    this._playerId = playerId;
    window.ResizeObserver ? this._createNativeObserver() : this._createIframeObserver();
    const el = document.getElementById(this._playerId);
    if (el instanceof HTMLElement) {
      this._observer.observe(el);
    }
  }

  _createNativeObserver() {
    this._observer = new window.ResizeObserver(entries => {
      entries.forEach(() => {
        this._triggerResize();
      });
    });
  }

  _createIframeObserver() {
    this._observer = new IFrameObserver(this._triggerResize.bind(this));
  }

  _triggerResize() {
    this.dispatchEvent(new FakeEvent(CustomEventType.RESIZE));
  }
}

const IFRAME_CLASS_NAME: string = 'playkit-size-iframe';

/**
 * This class mimics the API of the ResizeObserver API (currently available only in Chrome).
 * Creates an empty iFrame next to the player container, which gets the dimensions of it's parent and listens to
 * the iframes resize event.
 * @param {Function} callback - the function to be called when a resize event is detected.
 */
class IFrameObserver {
  _observersStore: Object = {};
  _onChangeCallback: Function;

  constructor(callback: Function) {
    this._onChangeCallback = callback;
  }

  /**
   * start detecting resize event
   * @param {HTMLElement} el - The element that is going to be resized.
   * @returns {void}
   */
  observe(el: HTMLElement): void {
    const iframe = this._createIframe();
    const playerId = el.getAttribute('id');
    this._observersStore[playerId] = iframe;
    el.appendChild(iframe);
    iframe.contentWindow.onresize = () => this._onChangeCallback();
  }

  /**
   * remove all resize listeners
   * @returns {void}
   */
  disconnect(): void {
    for (let target in this._observersStore) {
      const el = document.getElementById(target);
      const iframe = this._observersStore[target];
      iframe.onresize = null;
      el.removeChild(iframe);
      delete this._observersStore[el.getAttribute('id')];
    }
  }

  _createIframe(): HTMLElement {
    let iframe = document.createElement('iframe');
    iframe.className = IFRAME_CLASS_NAME;
    return iframe;
  }
}

export {ResizeWatcher};
