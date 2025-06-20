import React from 'react';

interface CreateClientModalProps {
  onClose: () => void;
  onCreate: (clientData: any) => void;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({ onClose, onCreate }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Create Client (Coming Soon)
        </h2>
        <p className="text-gray-600 mb-6">
          This modal will allow you to create new clients.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CreateClientModal; 