import { useEffect } from 'react';
import { useSettings } from '../store/useSettings';

export function useApplySettings() {
  const settings = useSettings((s) => s.settings);

  useEffect(() => {
    const root = document.documentElement;

    // Theme color
    root.setAttribute('data-theme-color', settings.themeColor);

    // Font size
    root.setAttribute('data-font-size', settings.fontSize);

    // Font weight
    root.setAttribute('data-font-weight', settings.fontWeight);

    // Line spacing
    root.setAttribute('data-line-spacing', settings.lineSpacing);

    // Animation speed
    root.setAttribute('data-anim-speed', settings.animationSpeed);

    // Compact mode
    root.classList.toggle('compact-mode', settings.compactMode);

    // Accessibility classes
    root.classList.toggle('reduce-motion', settings.a11yReduceMotion);
    root.classList.toggle('high-contrast', settings.a11yHighContrast);
    root.classList.toggle('large-buttons', settings.a11yLargeButtons);
    root.classList.toggle('senior-mode', settings.a11ySeniorMode);

    // Reduce motion also when animation speed is 'off'
    if (settings.animationSpeed === 'off') {
      root.classList.add('reduce-motion');
    }
  }, [settings]);
}
