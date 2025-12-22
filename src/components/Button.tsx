/**
 * WHAT: Centralized Button Component
 * WHY: Single source of truth for all button styles across the application
 * USAGE: import { Button } from '@/components/Button'
 */

import React from 'react';
import Link from 'next/link';

// WHAT: Button variant types
// WHY: Define consistent button styles used across the app
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface ButtonAsButtonProps extends BaseButtonProps {
  as?: 'button';
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

interface ButtonAsLinkProps extends BaseButtonProps {
  as: 'link';
  href: string;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

// WHAT: Centralized button style variants
// WHY: NO hardcoded styles in components - all styles defined here
const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500',
  secondary:
    'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  success:
    'bg-green-700 text-white shadow-sm hover:bg-green-800 focus:ring-green-600',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  outline:
    'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
};

// WHAT: Size variants
// WHY: Consistent sizing across all buttons
const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
};

// WHAT: Base button classes (always applied)
// WHY: Consistent foundation for all buttons
const baseClasses =
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * WHAT: Compose full button className
 * WHY: Combine base + variant + size + custom classes
 */
function getButtonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth: boolean = false,
  className: string = ''
): string {
  return [
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * WHAT: Button Component
 * WHY: Reusable button that can render as <button> or <Link>
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    className = '',
    children,
  } = props;

  const buttonClasses = getButtonClasses(variant, size, fullWidth, className);

  // WHAT: Render as Link
  if (props.as === 'link') {
    return (
      <Link
        href={props.href}
        className={buttonClasses}
        aria-disabled={disabled}
      >
        {children}
      </Link>
    );
  }

  // WHAT: Render as button
  return (
    <button
      type={props.type || 'button'}
      onClick={props.onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </button>
  );
}
