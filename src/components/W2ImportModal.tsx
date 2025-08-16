import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogPanel, Title } from '@tremor/react';
import { 
  Upload, 
  X, 
  File, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Download,
  AlertTriangle,
  UserPlus,
  Eye,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Types
interface W2UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  documentId?: string;
  extractedW2s?: W2ExtractedData[];
  error?: string;
  uploadProgress?: number;
}

interface W2ExtractedData {
  w2_index: number;
  employee_name_on_w2: string;
  employer_name: string;
  box_1_wages: string;
  box_2_federal_tax_withheld: string;
  tax_year: number;
  extraction_confidence: number;
  [key: string]: any; // For other W-2 fields
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface W2EmployeeMatch {
  documentId: string;
  fileName: string;
  w2Index: number;
  w2Data: W2ExtractedData;
  selectedEmployeeId?: string;
  createNewEmployee: boolean;
  newEmployeeData?: Partial<Employee>;
  suggestedMatches: { employee: Employee; confidence: number }[];
  extractionConfidence: number;
  skipRecord: boolean;
}

interface Role {
  id: string;
  name: string;
  baseline_applied_percent?: number;
}

interface W2ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessYearId: string;
  taxYear: number;
  employees: Employee[];
  roles: Role[];
}

type ModalStep = 'upload' | 'processing' | 'matching' | 'finalizing' | 'completed';

export default function W2ImportModal({
  isOpen,
  onClose,
  onSuccess,
  businessYearId,
  taxYear,
  employees,
  roles
}: W2ImportModalProps) {
  // State
  const [currentStep, setCurrentStep] = useState<ModalStep>('upload');
  const [uploadFiles, setUploadFiles] = useState<W2UploadFile[]>([]);
  const [employeeMatches, setEmployeeMatches] = useState<W2EmployeeMatch[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Modal opened - resetting state');
      resetModal();
    }
  }, [isOpen]);

  // File upload handlers
  const handleFileSelection = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    const newUploadFiles: W2UploadFile[] = fileArray.map(file => ({
      file,
      id: `${file.name}_${Date.now()}_${Math.random()}`,
      status: 'pending' as const,
      uploadProgress: 0
    }));
    
    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files);
    }
  }, [handleFileSelection]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Upload and processing
  const handleUploadFiles = async () => {
    console.log(`🔍 handleUploadFiles called with ${uploadFiles.length} files`);
    console.log(`🔍 Current employeeMatches length: ${employeeMatches.length}`);
    
    if (uploadFiles.length === 0) return;
    
    setCurrentStep('processing');
    setProcessing(true);
    setError(null);

    try {
      // Step 1: Upload files
      const formData = new FormData();
      uploadFiles.forEach(uploadFile => {
        formData.append('files', uploadFile.file);
      });
      formData.append('business_year_id', businessYearId);
      formData.append('tax_year', taxYear.toString());

      const { data: authData } = await supabase.auth.getSession();
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'http://localhost:54321/functions/v1';
      
      // Upload files
      const uploadResponse = await fetch(`${functionsUrl}/rd-service/w2-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.session?.access_token || ''}`,
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      console.log('Upload result:', uploadResult);

      // Extract document IDs from upload result
      const documentIds: string[] = uploadResult.uploaded_documents.map((doc: any) => doc.document_id);
      console.log('Document IDs for processing:', documentIds);
      
      // Update file statuses with document IDs
      const filesWithDocumentIds = uploadFiles.map(uploadFile => {
        const uploadedDoc = uploadResult.uploaded_documents.find((doc: any) => 
          doc.file_name === uploadFile.file.name
        );
        
        if (uploadedDoc) {
          return {
            ...uploadFile,
            status: 'uploading' as const,
            documentId: uploadedDoc.document_id
          };
        }
        
        const failedDoc = uploadResult.failed_uploads.find((doc: any) => 
          doc.file_name === uploadFile.file.name
        );
        
        if (failedDoc) {
          return {
            ...uploadFile,
            status: 'failed' as const,
            error: failedDoc.error
          };
        }
        
        return uploadFile;
      });
      
      setUploadFiles(filesWithDocumentIds);

      // Step 2: Process uploaded files with batch processing
      if (documentIds.length > 0) {
        const processResponse = await fetch(`${functionsUrl}/rd-service/w2-process-batch`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.session?.access_token || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_ids: documentIds,
            options: {
              parallel_processing: true,
              max_concurrent: 3
            }
          })
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json();
          throw new Error(errorData.error || 'Processing failed');
        }

        const processResult = await processResponse.json();
        console.log('Process result:', processResult);
        console.log('🔍 Processing results debug:', {
          totalResults: processResult.processing_results?.length || 0,
          results: processResult.processing_results?.map((r: any) => ({
            document_id: r.document_id,
            status: r.status,
            extracted_w2s_count: r.extracted_w2s?.length || 0,
            extracted_w2s: r.extracted_w2s
          }))
        });

        // Update file statuses and extract W-2 data
        const allMatches: W2EmployeeMatch[] = [];
        
        console.log(`🔍 About to process filesWithDocumentIds (length: ${filesWithDocumentIds.length}):`, filesWithDocumentIds.map(f => ({ id: f.id, documentId: f.documentId, fileName: f.file.name })));
        
        // First, process all successful documents to build employee matches
        filesWithDocumentIds.forEach(uploadFile => {
          console.log(`🔍 Looking for document ${uploadFile.documentId} in processing results`);
          const processedDoc = processResult.processing_results.find((result: any) => 
            result.document_id === uploadFile.documentId
          );
          
          console.log(`🔍 Found processedDoc:`, processedDoc);
          
          if (processedDoc && processedDoc.status === 'completed') {
            console.log(`🔍 Processing document ${uploadFile.documentId} with ${processedDoc.extracted_w2s?.length || 0} W-2s:`, processedDoc.extracted_w2s);
            // Create employee matches for each extracted W-2
            processedDoc.extracted_w2s.forEach((w2Data: W2ExtractedData, w2Index: number) => {
              console.log(`🔍 Processing W-2 ${w2Index}:`, w2Data);
              const suggestedMatches = findEmployeeMatches(w2Data.employee_name_on_w2, employees);
              
              const newMatch = {
                documentId: uploadFile.documentId!,
                fileName: uploadFile.file.name,
                w2Index: w2Data.w2_index,
                w2Data,
                selectedEmployeeId: suggestedMatches.length > 0 ? suggestedMatches[0].employee.id : undefined,
                createNewEmployee: suggestedMatches.length === 0,
                suggestedMatches,
                extractionConfidence: w2Data.extraction_confidence || 0.8,
                skipRecord: false
              };
              console.log(`🔍 Adding match to allMatches:`, newMatch);
              allMatches.push(newMatch);
            });
          } else {
            console.log(`🔍 Document ${uploadFile.documentId} not processed or failed:`, {
              foundDoc: !!processedDoc,
              status: processedDoc?.status,
              processedDoc
            });
          }
        });
        
        // Then update file statuses
        const updatedFiles = filesWithDocumentIds.map(uploadFile => {
          const processedDoc = processResult.processing_results.find((result: any) => 
            result.document_id === uploadFile.documentId
          );
          
          if (processedDoc && processedDoc.status === 'completed') {
            return {
              ...uploadFile,
              status: 'completed' as const,
              extractedW2s: processedDoc.extracted_w2s
            };
          } else if (processedDoc && processedDoc.status === 'failed') {
            return {
              ...uploadFile,
              status: 'failed' as const,
              error: processedDoc.error
            };
          }
          
          return uploadFile;
        });

        setUploadFiles(updatedFiles);
        console.log(`🔍 Final allMatches array (length: ${allMatches.length}):`, allMatches);
        setEmployeeMatches(allMatches);
        setCurrentStep('matching');
      }

    } catch (error: any) {
      console.error('Upload/processing error:', error);
      setError(error.message);
      setUploadFiles(prev => prev.map(f => ({
        ...f,
        status: f.status === 'pending' ? 'failed' as const : f.status,
        error: f.status === 'pending' ? error.message : f.error
      })));
    } finally {
      setProcessing(false);
    }
  };

  // Employee matching helpers
  const findEmployeeMatches = (w2EmployeeName: string, availableEmployees: Employee[]) => {
    console.log('🔍 findEmployeeMatches Debug:', {
      w2EmployeeName,
      availableEmployeesCount: availableEmployees?.length || 0,
      availableEmployees: availableEmployees?.slice(0, 3), // Show first 3 employees
      isArray: Array.isArray(availableEmployees)
    });

    if (!availableEmployees || !Array.isArray(availableEmployees)) {
      console.log('❌ No available employees or not an array');
      return [];
    }
    
    const validEmployees = availableEmployees.filter(employee => employee && employee.name);
    console.log('✅ Valid employees after filter:', validEmployees.length, validEmployees.slice(0, 3));
    
    const matches = validEmployees
      .map(employee => {
        const confidence = calculateNameSimilarity(w2EmployeeName, employee.name);
        console.log(`🎯 Similarity: "${w2EmployeeName}" vs "${employee.name}" = ${confidence}`);
        return {
          employee,
          confidence
        };
      })
      .filter(match => match.confidence > 0.3)
      .sort((a, b) => b.confidence - a.confidence);

    console.log('🎯 Final matches:', matches.length, matches);
    return matches.slice(0, 3); // Top 3 matches
  };

  const calculateNameSimilarity = (name1: string, name2: string): number => {
    // Handle null/undefined values
    if (!name1 || !name2) return 0;
    
    // Simple similarity calculation - could be enhanced with fuzzy matching
    const normalize = (str: string) => (str || '').toLowerCase().trim().replace(/[^\w\s]/g, '');
    const norm1 = normalize(name1);
    const norm2 = normalize(name2);
    
    // If either normalized name is empty, return 0
    if (!norm1 || !norm2) return 0;
    
    if (norm1 === norm2) return 1.0;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
    
    const words1 = norm1.split(' ').filter(word => word.length > 0);
    const words2 = norm2.split(' ').filter(word => word.length > 0);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  // Employee matching handlers
  const updateEmployeeMatch = (matchIndex: number, updates: Partial<W2EmployeeMatch>) => {
    setEmployeeMatches(prev => prev.map((match, index) => 
      index === matchIndex ? { ...match, ...updates } : match
    ));
  };

  const handleEmployeeSelection = (matchIndex: number, employeeId: string) => {
    updateEmployeeMatch(matchIndex, {
      selectedEmployeeId: employeeId,
      createNewEmployee: false
    });
  };

  const handleCreateNewEmployee = (matchIndex: number, create: boolean) => {
    const match = employeeMatches[matchIndex];
    updateEmployeeMatch(matchIndex, {
      createNewEmployee: create,
      selectedEmployeeId: create ? undefined : match.selectedEmployeeId,
      newEmployeeData: create ? (() => {
        const fullName = match.w2Data.employee_name_on_w2 || '';
        const parts = fullName.split(' ');
        return {
          first_name: parts[0] || '',
          last_name: parts.slice(1).join(' ') || '',
          role_id: '',
          is_owner: false
        };
      })() : undefined
    });
  };

  // Finalization
  const finalizeMatches = async () => {
    setCurrentStep('finalizing');
    setProcessing(true);
    setError(null);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'http://localhost:54321/functions/v1';

      // Prepare finalization data - exclude skipped records
      const finalizations = employeeMatches
        .filter(match => !match.skipRecord) // Only process non-skipped records
        .map(match => ({
          document_id: match.documentId,
          w2_index: match.w2Index,
          employee_id: match.selectedEmployeeId,
          action: match.createNewEmployee ? 'create_new_employee' : 'match_existing',
          new_employee_data: match.newEmployeeData,
          w2_data: {
            ...match.w2Data,
            business_year_id: businessYearId,
            confidence: match.extractionConfidence
          }
        }));

      const response = await fetch(`${functionsUrl}/rd-service/w2-finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ finalizations })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Finalization failed');
      }

      const result = await response.json();
      console.log('Finalization result:', result);

      setCurrentStep('completed');
      setTimeout(() => {
        onSuccess();
        resetModal();
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Finalization error:', error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Modal management
  const resetModal = () => {
    setCurrentStep('upload');
    setUploadFiles([]);
    setEmployeeMatches([]);
    setProcessing(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!processing) {
      resetModal();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} static={true}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <DialogPanel className="max-w-4xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Upload className="w-6 h-6 text-blue-600" />
              <Title className="text-xl font-semibold">
                Import W-2 Documents
              </Title>
            </div>
            <button
              onClick={handleClose}
              disabled={processing}
              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              {[
                { step: 'upload', label: 'Upload Files', icon: Upload },
                { step: 'processing', label: 'Processing', icon: Clock },
                { step: 'matching', label: 'Match Employees', icon: Users },
                { step: 'finalizing', label: 'Finalizing', icon: CheckCircle }
              ].map(({ step, label, icon: Icon }, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep === step 
                      ? 'border-blue-500 bg-blue-500 text-white' 
                      : index < ['upload', 'processing', 'matching', 'finalizing'].indexOf(currentStep)
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`ml-2 text-sm ${
                    currentStep === step ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                  {index < 3 && (
                    <div className={`w-8 h-px mx-4 ${
                      index < ['upload', 'processing', 'matching', 'finalizing'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center text-red-800">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 'upload' && (
              <UploadStep
                uploadFiles={uploadFiles}
                onFileSelection={handleFileSelection}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onRemoveFile={removeFile}
                onUpload={handleUploadFiles}
                fileInputRef={fileInputRef}
                processing={processing}
              />
            )}

            {currentStep === 'processing' && (
              <ProcessingStep
                uploadFiles={uploadFiles}
                processing={processing}
              />
            )}

            {currentStep === 'matching' && (
              <MatchingStep
                employeeMatches={employeeMatches}
                employees={employees}
                roles={roles}
                onEmployeeSelection={handleEmployeeSelection}
                onCreateNewEmployee={handleCreateNewEmployee}
                onUpdateMatch={updateEmployeeMatch}
                onFinalize={finalizeMatches}
                processing={processing}
              />
            )}

            {currentStep === 'finalizing' && (
              <FinalizingStep processing={processing} />
            )}

            {currentStep === 'completed' && (
              <CompletedStep employeeMatches={employeeMatches} />
            )}
          </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// Step Components

// Upload Step Component
function UploadStep({
  uploadFiles,
  onFileSelection,
  onDrop,
  onDragOver,
  onRemoveFile,
  onUpload,
  fileInputRef,
  processing
}: {
  uploadFiles: W2UploadFile[];
  onFileSelection: (files: FileList) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onRemoveFile: (fileId: string) => void;
  onUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  processing: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="text-lg font-medium text-gray-900 mb-2">
          Drop W-2 documents here or click to browse
        </div>
        <div className="text-sm text-gray-500 mb-4">
          Supports PDF, PNG, JPG files up to 50MB each
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <File className="mr-2 h-4 w-4" />
          Choose Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFileSelection(e.target.files);
            }
          }}
          className="hidden"
        />
      </div>

      {/* Selected Files List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Selected Files ({uploadFiles.length})</h4>
          <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
            {uploadFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-md mb-2 last:mb-0">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {uploadFile.status === 'failed' && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  {uploadFile.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <button
                    onClick={() => onRemoveFile(uploadFile.id)}
                    disabled={processing}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {uploadFiles.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onUpload}
            disabled={processing || uploadFiles.length === 0}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload & Process W-2s
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Processing Step Component
function ProcessingStep({
  uploadFiles,
  processing
}: {
  uploadFiles: W2UploadFile[];
  processing: boolean;
}) {
  const totalFiles = uploadFiles.length;
  const completedFiles = uploadFiles.filter(f => f.status === 'completed').length;
  const failedFiles = uploadFiles.filter(f => f.status === 'failed').length;
  const processingFiles = uploadFiles.filter(f => ['uploading', 'processing'].includes(f.status)).length;

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <div className="text-center">
        <div className="mb-6">
          <Loader2 className="mx-auto h-16 w-16 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Processing W-2 Documents
        </h3>
        <p className="text-sm text-gray-600">
          Using AI to extract tax information from your documents...
        </p>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalFiles}</div>
          <div className="text-sm text-blue-700">Total Files</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{completedFiles}</div>
          <div className="text-sm text-green-700">Completed</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{processingFiles}</div>
          <div className="text-sm text-yellow-700">Processing</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0}%` }}
        />
      </div>

      {/* File Processing List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">File Status</h4>
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          {uploadFiles.map((uploadFile) => (
            <div key={uploadFile.id} className="flex items-center justify-between py-3 px-3 bg-white rounded-md mb-2 last:mb-0">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {uploadFile.status === 'uploading' && 'Uploading...'}
                    {uploadFile.status === 'processing' && 'Extracting data...'}
                    {uploadFile.status === 'completed' && `Extracted ${uploadFile.extractedW2s?.length || 0} W-2(s)`}
                    {uploadFile.status === 'failed' && `Failed: ${uploadFile.error}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {uploadFile.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                )}
                {uploadFile.status === 'processing' && (
                  <Clock className="h-4 w-4 text-yellow-500" />
                )}
                {uploadFile.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {uploadFile.status === 'failed' && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Processing Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Eye className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">What's happening?</p>
            <p className="text-blue-700">
              Our AI is scanning each document to identify W-2 forms and extract tax information including wages, 
              withholdings, and employee details. This process typically takes 10-30 seconds per document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Matching Step Component
function MatchingStep({
  employeeMatches,
  employees,
  roles,
  onEmployeeSelection,
  onCreateNewEmployee,
  onUpdateMatch,
  onFinalize,
  processing
}: {
  employeeMatches: W2EmployeeMatch[];
  employees: Employee[];
  roles: Role[];
  onEmployeeSelection: (matchIndex: number, employeeId: string) => void;
  onCreateNewEmployee: (matchIndex: number, create: boolean) => void;
  onUpdateMatch: (matchIndex: number, updates: Partial<W2EmployeeMatch>) => void;
  onFinalize: () => void;
  processing: boolean;
}) {
  const totalMatches = employeeMatches.length;
  const readyMatches = employeeMatches.filter(m => {
    if (m.skipRecord) return true;
    if (m.createNewEmployee) {
      // Check if we have names either in newEmployeeData or can extract from W-2
      const firstName = m.newEmployeeData?.first_name || (m.w2Data.employee_name_on_w2 || '').split(' ')[0];
      const lastName = m.newEmployeeData?.last_name || (() => {
        const parts = (m.w2Data.employee_name_on_w2 || '').split(' ');
        return parts.slice(1).join(' ');
      })();
      return firstName && lastName;
    }
    return !!m.selectedEmployeeId;
  }).length;

  // Debug logging
  console.log('🔍 MatchingStep Debug:', {
    employeesCount: employees?.length || 0,
    employees: employees,
    employeeMatchesCount: employeeMatches.length,
    firstEmployeeMatch: employeeMatches[0],
    validEmployeesAfterFilter: (employees || []).filter(employee => employee && employee.id && employee.name).length,
    totalMatches,
    readyMatches,
    matchDetails: employeeMatches.map((m, i) => ({
      index: i,
      skipRecord: m.skipRecord,
      createNewEmployee: m.createNewEmployee,
      selectedEmployeeId: m.selectedEmployeeId,
      first_name: m.newEmployeeData?.first_name,
      last_name: m.newEmployeeData?.last_name,
      isReady: m.skipRecord || (m.createNewEmployee ? (m.newEmployeeData?.first_name && m.newEmployeeData?.last_name) : m.selectedEmployeeId)
    }))
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Match W-2 Data to Employees
        </h3>
        <p className="text-sm text-gray-600">
          Review extracted W-2 information and match each record to an existing employee or create new employees.
        </p>
      </div>

      {/* Progress Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Progress: {readyMatches} of {totalMatches} W-2s matched
            </span>
          </div>
          <div className="text-sm text-blue-700">
            {totalMatches - readyMatches} remaining
          </div>
        </div>
        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalMatches > 0 ? (readyMatches / totalMatches) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* W-2 Matching List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {employeeMatches.map((match, index) => (
          <div key={`${match.documentId}_${match.w2Index}_${index}`} className="border border-gray-200 rounded-lg p-4 bg-white">
            {/* W-2 Info Header - Redesigned with prominence on name/wages */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {/* Prominent Employee Name and Wages */}
                <div className="mb-3">
                  <div className="text-lg font-semibold text-gray-900 mb-1">
                    {match.w2Data.employee_name_on_w2 || 'Unknown Employee'}
                  </div>
                  <div className="text-base font-medium text-green-600">
                    ${parseFloat(match.w2Data.box_1_wages || '0').toLocaleString()} wages
                    <span className="text-sm text-gray-500 ml-2">• Tax Year {match.w2Data.tax_year}</span>
                  </div>
                  {match.w2Data.employer_name && (
                    <div className="text-sm text-gray-600 mt-1">
                      Employer: {match.w2Data.employer_name}
                    </div>
                  )}
                </div>
                
                {/* Secondary Info - Document source */}
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <File className="h-3 w-3" />
                  <span>From: {match.fileName}</span>
                  <span>•</span>
                  <span>W-2 #{match.w2Index + 1}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {match.extractionConfidence && (
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    match.extractionConfidence >= 0.9 
                      ? 'bg-green-100 text-green-800'
                      : match.extractionConfidence >= 0.7
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(match.extractionConfidence * 100)}% confidence
                  </div>
                )}
              </div>
            </div>

            {/* Employee Matching Options */}
            <div className="space-y-3">
              {/* Match to Existing Employee */}
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={`existing_${index}`}
                  name={`match_${index}`}
                  checked={!match.createNewEmployee && !match.skipRecord}
                  onChange={() => onUpdateMatch(index, { createNewEmployee: false, skipRecord: false })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={`existing_${index}`} className="text-sm font-medium text-gray-700">
                  Match to existing employee
                </label>
              </div>

              {!match.createNewEmployee && !match.skipRecord && (
                <div className="ml-7 space-y-3">
                  {/* Suggested Matches */}
                  {(match.suggestedMatches && match.suggestedMatches.length > 0) && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 font-medium">Suggested matches:</div>
                      {match.suggestedMatches.slice(0, 3).filter(suggestion => suggestion && suggestion.employee).map((suggestion) => (
                        <div key={suggestion.employee?.id || `suggestion-${Math.random()}`} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id={`suggestion_${index}_${suggestion.employee?.id || 'unknown'}`}
                            name={`employee_${index}`}
                            checked={match.selectedEmployeeId === suggestion.employee?.id}
                            onChange={() => suggestion.employee?.id && onEmployeeSelection(index, suggestion.employee.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label 
                            htmlFor={`suggestion_${index}_${suggestion.employee?.id || 'unknown'}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            <span className="font-medium">{suggestion.employee?.name || 'Unknown Employee'}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                              (suggestion.confidence || 0) >= 0.8
                                ? 'bg-green-100 text-green-800'
                                : (suggestion.confidence || 0) >= 0.6
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {Math.round((suggestion.confidence || 0) * 100)}% match
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* All Employees Dropdown */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-medium">Or select from all employees:</label>
{(() => {
                      const validEmployees = (employees || []).filter(employee => employee && employee.id && employee.name);
                      
                      // Filter out employees already selected by other matches (but allow current selection)
                      const alreadySelectedIds = employeeMatches
                        .filter((otherMatch, otherIndex) => 
                          otherIndex !== index && // Don't exclude current match's selection
                          otherMatch.selectedEmployeeId && 
                          !otherMatch.createNewEmployee &&
                          !otherMatch.skipRecord
                        )
                        .map(otherMatch => otherMatch.selectedEmployeeId);
                      
                      const availableEmployees = validEmployees.filter(employee => 
                        !alreadySelectedIds.includes(employee.id)
                      );
                      
                      if (validEmployees.length === 0) {
                        return (
                          <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
                            No employees available. Create a new employee or add employees first.
                          </div>
                        );
                      }
                      
                      if (availableEmployees.length === 0 && !match.selectedEmployeeId) {
                        return (
                          <div className="text-sm text-amber-600 p-3 bg-amber-50 rounded-md">
                            All employees have been assigned to other W-2s. Consider creating a new employee or skipping this record.
                          </div>
                        );
                      }
                      
                      return (
                        <select
                          value={match.selectedEmployeeId || ''}
                          onChange={(e) => onEmployeeSelection(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Choose an employee...</option>
                          {/* Show current selection even if it would normally be filtered out */}
                          {match.selectedEmployeeId && !availableEmployees.find(emp => emp.id === match.selectedEmployeeId) && (
                            (() => {
                              const currentEmployee = validEmployees.find(emp => emp.id === match.selectedEmployeeId);
                              return currentEmployee ? (
                                <option key={currentEmployee.id} value={currentEmployee.id}>
                                  {currentEmployee.name} (currently selected)
                                </option>
                              ) : null;
                            })()
                          )}
                          {availableEmployees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Create New Employee */}
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={`new_${index}`}
                  name={`match_${index}`}
                  checked={match.createNewEmployee && !match.skipRecord}
                  onChange={() => onUpdateMatch(index, { createNewEmployee: true, skipRecord: false })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={`new_${index}`} className="text-sm font-medium text-gray-700">
                  Create new employee from W-2 data
                </label>
              </div>

              {/* Skip/Ignore Option */}
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={`skip_${index}`}
                  name={`match_${index}`}
                  checked={match.skipRecord}
                  onChange={() => onUpdateMatch(index, { skipRecord: true, createNewEmployee: false, selectedEmployeeId: undefined })}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                />
                <label htmlFor={`skip_${index}`} className="text-sm font-medium text-gray-700">
                  Skip this W-2 (don't import)
                </label>
              </div>

              {match.createNewEmployee && !match.skipRecord && (
                <div className="ml-7 space-y-3 bg-gray-50 p-3 rounded-md">
                  <div className="text-xs text-gray-500 font-medium">New Employee Information:</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={match.newEmployeeData?.first_name || (() => {
                          const fullName = match.w2Data.employee_name_on_w2 || '';
                          return fullName.split(' ')[0] || '';
                        })()}
                        onChange={(e) => onUpdateMatch(index, {
                          newEmployeeData: {
                            ...match.newEmployeeData,
                            first_name: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={match.newEmployeeData?.last_name || (() => {
                          const fullName = match.w2Data.employee_name_on_w2 || '';
                          const parts = fullName.split(' ');
                          return parts.slice(1).join(' ') || '';
                        })()}
                        onChange={(e) => onUpdateMatch(index, {
                          newEmployeeData: {
                            ...match.newEmployeeData,
                            last_name: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Role (Optional)
                      </label>
                      <select
                        value={match.newEmployeeData?.role_id || ''}
                        onChange={(e) => onUpdateMatch(index, {
                          newEmployeeData: {
                            ...match.newEmployeeData,
                            role_id: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select a role...</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Owner Status
                      </label>
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          id={`is_owner_${index}`}
                          checked={match.newEmployeeData?.is_owner || false}
                          onChange={(e) => onUpdateMatch(index, {
                            newEmployeeData: {
                              ...match.newEmployeeData,
                              is_owner: e.target.checked
                            }
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`is_owner_${index}`} className="ml-2 text-xs text-gray-700">
                          Is Business Owner
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Warning */}
            {!match.skipRecord && !match.createNewEmployee && !match.selectedEmployeeId && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">
                    Please select an employee, create a new one, or skip this W-2
                  </span>
                </div>
              </div>
            )}
            
            {/* Skip Confirmation */}
            {match.skipRecord && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                  <span className="text-sm text-amber-800">
                    This W-2 will be skipped and not imported into the system
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-600">
          {totalMatches - readyMatches > 0 && (
            <span className="text-amber-600 font-medium">
              {totalMatches - readyMatches} incomplete {totalMatches - readyMatches === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>
        <button
          onClick={onFinalize}
          disabled={processing || readyMatches < totalMatches}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Save All Matches ({readyMatches}/{totalMatches})
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Finalizing Step Component
function FinalizingStep({
  processing
}: {
  processing: boolean;
}) {
  return (
    <div className="space-y-8">
      {/* Loading State */}
      <div className="text-center">
        <div className="mb-6">
          <Loader2 className="mx-auto h-16 w-16 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Saving W-2 Data
        </h3>
        <p className="text-sm text-gray-600">
          Finalizing employee matches and saving extracted tax information...
        </p>
      </div>

      {/* Process Steps */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <span className="text-gray-900">Creating new employee records</span>
        </div>
        
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          </div>
          <span className="text-gray-900">Saving W-2 tax information</span>
        </div>
        
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <span className="text-gray-500">Updating employee records</span>
        </div>
        
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <span className="text-gray-500">Finalizing import</span>
        </div>
      </div>

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Eye className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">What's happening?</p>
            <p className="text-blue-700">
              We're creating any new employee records and saving the extracted W-2 data to your business year. 
              This information will be used for R&D tax credit calculations and employee wage tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Completed Step Component
function CompletedStep({
  employeeMatches
}: {
  employeeMatches: W2EmployeeMatch[];
}) {
  const totalW2s = employeeMatches.length;
  const newEmployees = employeeMatches.filter(m => m.createNewEmployee).length;
  const existingEmployees = employeeMatches.filter(m => !m.createNewEmployee).length;
  const totalWages = employeeMatches.reduce((sum, match) => {
    return sum + parseFloat(match.w2Data.box_1_wages || '0');
  }, 0);

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          W-2 Import Completed Successfully!
        </h3>
        <p className="text-sm text-gray-600">
          All W-2 documents have been processed and employee data has been saved.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalW2s}</div>
          <div className="text-sm text-blue-700">W-2s Processed</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{existingEmployees}</div>
          <div className="text-sm text-green-700">Existing Employees</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{newEmployees}</div>
          <div className="text-sm text-purple-700">New Employees</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">${totalWages.toLocaleString()}</div>
          <div className="text-sm text-yellow-700">Total Wages</div>
        </div>
      </div>

      {/* Processed W-2s Summary */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Processed W-2 Summary</h4>
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          {employeeMatches.map((match, index) => (
            <div key={`${match.documentId}_${match.w2Index}`} className="flex items-center justify-between py-3 px-3 bg-white rounded-md mb-2 last:mb-0">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {match.w2Data.employee_name_on_w2}
                  </p>
                  <p className="text-xs text-gray-500">
                    {match.createNewEmployee ? 'New Employee' : 'Existing Employee'} • 
                    Tax Year {match.w2Data.tax_year} • 
                    Wages: ${parseFloat(match.w2Data.box_1_wages || '0').toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {match.createNewEmployee ? (
                  <div className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                    <UserPlus className="inline w-3 h-3 mr-1" />
                    New
                  </div>
                ) : (
                  <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    <Users className="inline w-3 h-3 mr-1" />
                    Matched
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Download className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">What's Next?</p>
            <ul className="text-blue-700 space-y-1">
              <li>• W-2 data has been saved and is ready for R&D tax credit calculations</li>
              <li>• Review employee records in the Employee Setup section</li>
              <li>• Continue with the R&D wizard to complete your tax credit application</li>
              <li>• All uploaded documents are securely stored for your records</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Note */}
      <div className="text-center text-sm text-gray-500">
        This modal will close automatically in a few seconds...
      </div>
    </div>
  );
}