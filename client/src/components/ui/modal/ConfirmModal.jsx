import { X, AlertTriangle, Trash2 } from "lucide-react";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  description = "Are you sure you want to perform this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger" 
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bg: "bg-red-50 dark:bg-red-900/20",
      icon: "text-red-600 dark:text-red-400",
      button: "bg-red-600 hover:bg-red-700 text-white"
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      icon: "text-yellow-600 dark:text-yellow-400",
      button: "bg-yellow-600 hover:bg-yellow-700 text-white"
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      icon: "text-blue-600 dark:text-blue-400",
      button: "bg-blue-600 hover:bg-blue-700 text-white"
    }
  };

  const currentVariant = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className={`px-6 py-4 ${currentVariant.bg} flex items-center justify-between`}>
            <div className="flex items-center">
              <AlertTriangle className={`h-6 w-6 ${currentVariant.icon} mr-3`} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-6">
              {description}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex flex-col sm:flex-row-reverse gap-3">
            <button
              onClick={onConfirm}
              className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-all ${currentVariant.button} sm:ml-3 sm:w-auto`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-600 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-all sm:w-auto"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}