// src/components/Toast.tsx
'use client';

import { useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onClose: () => void;
}

const Toast = ({ message, type, visible, onClose }: ToastProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, 5000); // Auto-hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const toastClass = `alert ${
    type === 'success' ? 'alert-success' : 
    type === 'error' ? 'alert-error' : 
    type === 'warning' ? 'alert-warning' : 'alert-info'
  }`;

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={toastClass}>
        <div>
          <span>{message}</span>
          <button 
            className="btn btn-sm btn-circle btn-ghost ml-2"
            onClick={() => {
              setShow(false);
              onClose();
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;