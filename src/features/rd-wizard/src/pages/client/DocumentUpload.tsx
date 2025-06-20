import React from 'react';
import { FileUpload } from '../../components/forms/FileUpload';
import Card from '../../components/common/Card';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="font-['DM_Serif_Display'] text-2xl text-gray-900 mb-6">{children}</h2>
);

const DocumentUpload: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-['DM_Serif_Display'] text-4xl text-gray-900 mb-8">Document Upload</h1>
      
      <Card>
        <div className="space-y-6">
          <div>
            <SectionTitle>Upload Required Documents</SectionTitle>
            <p className="text-gray-600 mb-4">
              Please upload all relevant documentation to support your R&D tax credit claim.
            </p>
          </div>

          <FileUpload
            label="Financial Documents"
            description="Upload financial statements, tax returns, and payroll records"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            multiple
          />

          <FileUpload
            label="Project Documentation"
            description="Upload project plans, technical documents, and research notes"
            accept=".pdf,.doc,.docx"
            multiple
          />

          <FileUpload
            label="Supporting Evidence"
            description="Upload any additional supporting documentation"
            accept=".pdf,.doc,.docx,.jpg,.png"
            multiple
          />
        </div>
      </Card>
    </div>
  );
};

export default DocumentUpload;