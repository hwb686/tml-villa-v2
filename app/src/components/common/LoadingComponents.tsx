import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center justify-center ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-champagne`} />
    </motion.div>
  );
}

interface LoadingOverlayProps {
  message?: string;
  fullscreen?: boolean;
}

export function LoadingOverlay({ message = '加载中...', fullscreen = false }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center ${
        fullscreen ? 'fixed inset-0 z-50 bg-white/80 backdrop-blur-sm' : 'py-12'
      }`}
    >
      <LoadingSpinner size="lg" />
      {message && (
        <p className="mt-4 text-gray-600 text-sm">{message}</p>
      )}
    </motion.div>
  );
}