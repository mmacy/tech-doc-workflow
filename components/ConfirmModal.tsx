
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) {
    return null;
  }

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
        aria-labelledby="modal-title" 
        role="dialog" 
        aria-modal="true"
        onClick={onClose}
    >
      <div 
        className="card-theme p-8 rounded-xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-lg font-semibold text-theme-primary mb-4">{title}</h2>
        <div className="text-theme-secondary mb-8">
          {children}
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold btn-theme-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-primary focus:ring-theme-accent"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2 text-sm font-semibold btn-theme-primary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-primary focus:ring-theme-accent"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
