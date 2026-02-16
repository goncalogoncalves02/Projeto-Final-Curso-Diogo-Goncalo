import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, onConfirm, confirmText = "Confirmar", type = "info" }) => {
  if (!isOpen) return null;

  // Type styling
  const isDestructive = type === "destructive";
  const ButtonColor = isDestructive ? "bg-red-600 hover:bg-red-700 active:bg-red-800" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      {/* Backdrop */}
      {/* Used rgba(0,0,0,0.5) explicitly to ensure transparency works even if Utility classes fail */}
      <div 
        className="fixed inset-0 backdrop-blur-sm transition-opacity" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md mx-auto my-6 z-50">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-xl shadow-2xl outline-none focus:outline-none overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              {isDestructive && <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />}
              {title}
            </h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-gray-400 hover:text-gray-600 transition-colors outline-none focus:outline-none"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Body */}
          <div className="relative p-6 flex-auto text-gray-600 text-base leading-relaxed">
            {children}
          </div>
          {/* Footer */}
          <div className="flex items-center justify-end p-4 border-t border-gray-100 rounded-b bg-gray-50 gap-3">
             {onConfirm ? (
              <>
                 <button
                  className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-xs outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 hover:text-gray-700"
                  type="button"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  className={`${ButtonColor} text-white font-bold uppercase text-xs px-6 py-3 rounded-lg shadow outline-none focus:outline-none ease-linear transition-all duration-150`}
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                >
                  {confirmText}
                </button>
              </>
             ) : (
                <button
                  className="bg-blue-600 text-white active:bg-blue-700 font-bold uppercase text-xs px-6 py-3 rounded-lg shadow hover:bg-blue-700 outline-none focus:outline-none ease-linear transition-all duration-150"
                  type="button"
                  onClick={onClose}
                >
                  Fechar
                </button>
             )}
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
