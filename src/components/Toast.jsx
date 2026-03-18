import { useEffect } from 'react';

export default function Toast({ open, message, type = 'success', onClose }) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;

  const styles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-orange-500',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="fixed top-5 right-5 z-50 animate-[slideIn_0.3s_ease-out]">
      <div className={`${styles[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3`}>
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
