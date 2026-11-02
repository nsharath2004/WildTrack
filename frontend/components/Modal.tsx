'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'Save Record',
  isSubmitting = false,
  maxWidth = 'max-w-2xl',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-gray-100 w-full ${maxWidth} transform transition-all overflow-hidden animate-fadeIn`}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-forest-900 text-white flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="text-forest-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-forest-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={onSubmit}>
          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
            {children}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              Cancel
            </button>
            {onSubmit && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{submitLabel}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
