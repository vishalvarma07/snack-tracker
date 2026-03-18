import { useEffect } from 'react';

export default function SuccessModal({ open, title = 'Success!', message, onClose, autoDismiss = 2000 }) {
  useEffect(() => {
    if (open && autoDismiss) {
      const timer = setTimeout(onClose, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, autoDismiss]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-[scaleIn_0.2s_ease-out] text-center">
        <div className="pt-6 pb-2 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-9 h-9 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
        </div>
      </div>
    </div>
  );
}
