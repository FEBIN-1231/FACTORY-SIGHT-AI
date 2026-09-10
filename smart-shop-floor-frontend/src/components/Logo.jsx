import React from 'react';
import LogoMarkSvg from '../assets/logo/LogoMark.svg';
import LogoHorizontalSvg from '../assets/logo/LogoHorizontal.svg';
import LogoMonochromeSvg from '../assets/logo/LogoMonochrome.svg';

const SIZE_MAP = {
  xs: 'w-5 h-auto',
  sm: 'w-6 h-auto',
  md: 'w-8 h-auto',
  lg: 'w-10 h-auto',
  xl: 'w-12 h-auto',
  '2xl': 'w-16 h-auto',
};

/**
 * Factory Sight AI Official Brand Logo Component
 *
 * @param {'mark' | 'horizontal' | 'monochrome'} variant - Logo format variant
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'} size - Predefined sizing shortcut
 * @param {string} className - Additional CSS classes
 * @param {string} alt - Accessibility alt text
 */
export default function Logo({
  variant = 'mark',
  size = 'md',
  className = '',
  alt = 'Factory Sight AI',
  ...props
}) {
  const sizeClass = SIZE_MAP[size] || '';

  if (variant === 'horizontal') {
    return (
      <img
        src={LogoHorizontalSvg}
        alt={alt}
        className={`shrink-0 select-none object-contain ${className}`}
        {...props}
      />
    );
  }

  if (variant === 'monochrome') {
    return (
      <img
        src={LogoMonochromeSvg}
        alt={alt}
        className={`shrink-0 select-none object-contain ${sizeClass} ${className}`}
        {...props}
      />
    );
  }

  // Default: Full-color Icon Mark
  return (
    <img
      src={LogoMarkSvg}
      alt={alt}
      className={`shrink-0 select-none object-contain ${sizeClass} ${className}`}
      {...props}
    />
  );
}

export { Logo };
