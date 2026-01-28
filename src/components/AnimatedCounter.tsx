import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  formatOptions,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => {
    if (formatOptions) {
      return prefix + new Intl.NumberFormat('en-US', formatOptions).format(current) + suffix;
    }
    return prefix + current.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix;
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      spring.set(value);
      setHasAnimated(true);
    } else if (hasAnimated) {
      // Animate on value changes after initial animation
      spring.set(value);
    }
  }, [isInView, value, spring, hasAnimated]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {display}
    </motion.span>
  );
}

// Specialized version for currency
interface AnimatedCurrencyProps {
  value: number;
  duration?: number;
  className?: string;
  currency?: string;
}

export function AnimatedCurrency({
  value,
  duration = 1.5,
  className = '',
  currency = 'USD',
}: AnimatedCurrencyProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      prefix="$"
      decimals={2}
      className={className}
      formatOptions={{
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }}
    />
  );
}

// Percentage counter
interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function AnimatedPercentage({
  value,
  duration = 1.5,
  className = '',
  decimals = 1,
}: AnimatedPercentageProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      suffix="%"
      decimals={decimals}
      className={className}
    />
  );
}

// Simple integer counter
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1.5,
  className = '',
}: AnimatedNumberProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      decimals={0}
      className={className}
    />
  );
}
