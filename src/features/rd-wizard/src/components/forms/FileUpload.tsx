import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../utils/styles';
import { CloudArrowUpIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  label?: string;
  accept?: Record<string, string[]>; // e.g. { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg'] }
  maxSize?: number; // in bytes
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  helperText?: string;
  error?: string;
  className?: string;
  initialFiles?: File[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept,
  maxSize = 5242880, // 5MB
  maxFiles = 1,
  onFilesSelected,
  helperText,
  error,
  className,
  initialFiles = []
}) => {
  const [files, setFiles] = useState<File[]>(initialFiles);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  }, [files, maxFiles, onFilesSelected]);

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
  });

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <div key={file.name} className="text-sm text-red-500 mt-1">
      {file.name}: {errors.map(e => e.message).join(', ')}
    </div>
  ));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("mb-4", className)}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors duration-200 cursor-pointer",
          "flex flex-col items-center justify-center",
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400",
          error ? "border-red-300" : "",
          className
        )}
      >
        <input {...getInputProps()} />

        <CloudArrowUpIcon className={cn(
          "h-10 w-10 mb-3",
          isDragActive ? "text-blue-500" : "text-gray-400"
        )} />

        <p className="text-sm text-center text-gray-600">
          {isDragActive ? (
            <span className="font-medium text-blue-600">Drop the files here</span>
          ) : (
            <>
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </>
          )}
        </p>
        
        <p className="text-xs text-gray-500 mt-1">
          {maxFiles > 1 ? `Up to ${maxFiles} files, ` : ''}
          {`Maximum ${formatFileSize(maxSize)}`}
        </p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded files:</h4>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                >
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 truncate" style={{ maxWidth: '200px' }}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    icon={<XMarkIcon className="h-4 w-4" />}
                    aria-label="Remove file"
                  />
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {fileRejectionItems.length > 0 && (
        <div className="mt-2">{fileRejectionItems}</div>
      )}

      {helperText && !error && !fileRejectionItems.length && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </motion.div>
  );
};

export default FileUpload;

export { FileUpload };