import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: string) => void;
  title?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  isOpen,
  onClose,
  onSave,
  title = "Digital Signature"
}) => {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  if (!isOpen) return null;

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setIsEmpty(true);
    }
  };

  const saveSignature = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      // Generate high-quality PNG signature
      const signatureData = sigCanvasRef.current.toDataURL('image/png', 1.0);
      
      console.log('🖋️ [SignaturePad] Generated signature:', {
        dataLength: signatureData.length,
        startsWithPNG: signatureData.startsWith('data:image/png'),
        first100chars: signatureData.substring(0, 100)
      });
      
      // Validate signature data before saving
      if (signatureData.length < 1000) {
        alert('Signature appears to be invalid or too small. Please try signing again.');
        return;
      }
      
      onSave(signatureData);
      onClose();
    } else {
      alert('Please provide a signature before saving.');
    }
  };

  const handleBeginStroke = () => {
    setIsEmpty(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-white flex items-center justify-between rounded-t-xl">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 text-sm">
              Please sign in the box below using your mouse, trackpad, or touch screen.
            </p>
          </div>
          
          <div className="border-2 border-gray-300 rounded-lg mb-4 bg-gray-50">
            <SignatureCanvas
              ref={sigCanvasRef}
              canvasProps={{
                width: 600,
                height: 200,
                className: 'signature-canvas w-full h-full',
                style: { backgroundColor: 'white', border: '1px solid #e5e7eb' }
              }}
              backgroundColor="white"
              penColor="black"
              dotSize={1}
              minWidth={1}
              maxWidth={3}
              velocityFilterWeight={0.7}
              onBegin={handleBeginStroke}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={clearSignature}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear</span>
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSignature}
                disabled={isEmpty}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isEmpty
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Save Signature
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad; 