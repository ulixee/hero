import anime from 'animejs';
import { TAB_ANIMATION_DURATION } from '~frontend/pages/app/store/constants';

export const animateTab = (
  property: 'translateX' | 'width',
  value: number,
  domElement: any,
  animation: boolean,
) => {
  if (animation) {
    anime({
      [property]: value,
      targets: domElement,
      duration: TAB_ANIMATION_DURATION,
      easing: 'easeOutCirc',
    });
  } else {
    anime.set(domElement, {
      [property]: value,
    });
  }
};
