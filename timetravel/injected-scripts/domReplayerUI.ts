// have to import to allow declarations...
import {} from '@ulixee/hero-interfaces/IDomChangeEvent';

declare global {
  interface Window {
    showReplayStatus(text: string);
    showReplayOverlay();
    hideReplayOverlay();
    reattachUI();
  }
}

let overlayNode: HTMLElement;
let overlayContainer: HTMLElement;
let overlayShadow: ShadowRoot;

let statusNode: HTMLElement;

window.reattachUI = function reattachUI() {
  if (overlayContainer && !overlayContainer.isConnected) {
    document.body.appendChild(overlayContainer);
  }
};

window.showReplayStatus = function showReplayStatus(text: string) {
  if (document.body.children.length === 0) {
    statusNode = document.createElement('hero-status');
    const styleElement = document.createElement('style');
    styleElement.textContent = `
  hero-status {
    display:block;
    position: relative;
    top: 100px;
    margin: 0 auto;
    background: rgba(0,0,0,0.7);
    border-radius: 5px;
    text-transform: uppercase;
    width: 250px;
    text-align:center;
    color: white;
    font: 22px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
    padding: 10px;
    box-shadow: 3px 2px 4px rgba(0, 0, 0, 0.12), 2px 1px 3px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 0, 0, 0.2);
  }`;
    document.body.appendChild(statusNode);
    document.body.appendChild(styleElement);
  }
  if (statusNode && statusNode.isConnected) {
    statusNode.innerText = text;
  }
};

window.hideReplayOverlay = function hideReplayOverlay() {
  overlayNode.classList.add('hide');
};

window.showReplayOverlay = function showReplayOverlay() {
  if (overlayNode) {
    window.reattachUI();
    overlayNode.classList.remove('hide');
    return;
  }

  overlayContainer = document.createElement('hero-overlay');
  overlayContainer.style.zIndex = '2147483647';

  overlayNode = document.createElement('hero-mask');
  overlayNode.textContent = ' ';

  const spinner = document.createElement('hero-spinner');
  for (let i = 0; i < 12; i += 1) {
    const spoke = document.createElement('hero-spoke');
    spinner.appendChild(spoke);
  }
  overlayNode.appendChild(spinner);

  const styleElement = document.createElement('style');
  styleElement.textContent = `
  hero-mask {
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    width: 100%;
    cursor: wait;
    background-color: #fff;
    opacity: 1;
    z-index: 2147483647;
  }
  hero-mask.hide {
    opacity: 0;
    transition-duration: 100ms;
    cursor: default;
    pointer-events: none;
  }

  hero-spinner {
    color: official;
    display: block;
    top: calc(50% - 40px);
    left:  calc(50% - 40px);
    position: relative;
    width: 80px;
    height: 80px;
  }
  hero-spinner hero-spoke {
    display:block;
    transform-origin: 40px 40px;
    animation: hero-spinner 0.5s linear infinite;
  }
  hero-spinner hero-spoke:after {
    content: " ";
    display: block;
    position: absolute;
    top: 3px;
    left: 37px;
    width: 6px;
    height: 18px;
    border-radius: 20%;
    background: #ddd;
  }
  hero-spinner hero-spoke:nth-child(1) {
    transform: rotate(0deg);
    animation-delay: -1.1s;
  }
  hero-spinner hero-spoke:nth-child(2) {
    transform: rotate(30deg);
    animation-delay: -1s;
  }
  hero-spinner hero-spoke:nth-child(3) {
    transform: rotate(60deg);
    animation-delay: -0.9s;
  }
  hero-spinner hero-spoke:nth-child(4) {
    transform: rotate(90deg);
    animation-delay: -0.8s;
  }
  hero-spinner hero-spoke:nth-child(5) {
    transform: rotate(120deg);
    animation-delay: -0.7s;
  }
  hero-spinner hero-spoke:nth-child(6) {
    transform: rotate(150deg);
    animation-delay: -0.6s;
  }
  hero-spinner hero-spoke:nth-child(7) {
    transform: rotate(180deg);
    animation-delay: -0.5s;
  }
  hero-spinner hero-spoke:nth-child(8) {
    transform: rotate(210deg);
    animation-delay: -0.4s;
  }
  hero-spinner hero-spoke:nth-child(9) {
    transform: rotate(240deg);
    animation-delay: -0.3s;
  }
  hero-spinner hero-spoke:nth-child(10) {
    transform: rotate(270deg);
    animation-delay: -0.2s;
  }
  hero-spinner hero-spoke:nth-child(11) {
    transform: rotate(300deg);
    animation-delay: -0.1s;
  }
  hero-spinner hero-spoke:nth-child(12) {
    transform: rotate(330deg);
    animation-delay: 0s;
  }
  @keyframes hero-spinner {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  `;

  overlayShadow = overlayContainer.attachShadow({ mode: 'closed' });
  overlayShadow.appendChild(overlayNode);
  overlayShadow.appendChild(styleElement);
  window.reattachUI();
};
