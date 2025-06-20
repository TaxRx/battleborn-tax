import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button } from '@tremor/react';
import { FileText, Upload, Download, Trash2, Eye, FileType } from 'lucide-react';
import { advisorService } from '../../services/advisorService';
import type { Document } from '../../types/document';
import UploadDocumentModal from './UploadDocumentModal';

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await advisorService.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, clientId: string) => {
    try {
      await advisorService.uploadDocument(file, clientId);
      fetchDocuments();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="mt-2 text-gray-600">Upload and manage client documents</p>
        </div>
        <Button
          icon={Upload}
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Upload Document
        </Button>
      </div>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Document</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Client</TableHeaderCell>
              <TableHeaderCell>Upload Date</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <FileType className="h-8 w-8 text-blue-500" />
                    <div>
                      <Text className="font-medium">{doc.name}</Text>
                      <Text className="text-gray-500">{doc.size} KB</Text>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge color="blue">{doc.type}</Badge>
                </TableCell>
                <TableCell>
                  <Text>{doc.clientName}</Text>
                </TableCell>
                <TableCell>
                  <Text>{new Date(doc.uploadDate).toLocaleDateString()}</Text>
                </TableCell>
                <TableCell>
                  <Badge
                    color={
                      doc.status === 'approved'
                        ? 'emerald'
                        : doc.status === 'pending'
                        ? 'amber'
                        : 'red'
                    }
                  >
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={Eye}
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      View
                    </Button>
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={Download}
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      Download
                    </Button>
                    <Button
                      size="xs"
                      variant="secondary"
                      color="red"
                      icon={Trash2}
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this document?')) {
                          advisorService.deleteDocument(doc.id);
                          fetchDocuments();
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </div>
  );
} 