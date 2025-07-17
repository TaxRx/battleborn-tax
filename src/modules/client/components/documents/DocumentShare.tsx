import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Users, 
  Link, 
  Mail, 
  Calendar, 
  Download, 
  Eye, 
  Lock, 
  Copy, 
  X, 
  Check,
  AlertCircle,
  Settings
} from 'lucide-react';
import { documentService, DocumentShare as DocumentShareType, DocumentFile } from '../../services/documentService';

interface DocumentShareProps {
  document: DocumentFile;
  onClose: () => void;
  onShareCreated?: (share: DocumentShareType) => void;
}

interface ShareFormData {
  shareType: 'email' | 'link';
  email: string;
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canComment: boolean;
    canEdit: boolean;
  };
  expiration: {
    enabled: boolean;
    date: string;
    time: string;
  };
  password: {
    enabled: boolean;
    value: string;
  };
  downloadLimit: {
    enabled: boolean;
    count: number;
  };
  message: string;
}

const DocumentShare: React.FC<DocumentShareProps> = ({ document, onClose, onShareCreated }) => {
  const [shares, setShares] = useState<DocumentShareType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'existing'>('create');
  const [formData, setFormData] = useState<ShareFormData>({
    shareType: 'email',
    email: '',
    permissions: {
      canView: true,
      canDownload: true,
      canComment: false,
      canEdit: false
    },
    expiration: {
      enabled: false,
      date: '',
      time: '23:59'
    },
    password: {
      enabled: false,
      value: ''
    },
    downloadLimit: {
      enabled: false,
      count: 10
    },
    message: ''
  });

  useEffect(() => {
    loadExistingShares();
  }, [document.id]);

  const loadExistingShares = async () => {
    try {
      const result = await documentService.getDocumentShares(document.id);
      if (result.success && result.data) {
        setShares(result.data);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  const handleCreateShare = async () => {
    if (formData.shareType === 'email' && !formData.email.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const expiresAt = formData.expiration.enabled
        ? new Date(`${formData.expiration.date}T${formData.expiration.time}`).toISOString()
        : undefined;

      const result = await documentService.shareDocument({
        document_id: document.id,
        client_id: document.client_id,
        shared_with_email: formData.shareType === 'email' ? formData.email : undefined,
        share_type: 'view',
        expires_at: expiresAt,
        password_hash: formData.password.enabled ? await hashPassword(formData.password.value) : undefined,
        max_downloads: formData.downloadLimit.enabled ? formData.downloadLimit.count : undefined,
        is_public_link: formData.shareType === 'link',
        can_view: formData.permissions.canView,
        can_download: formData.permissions.canDownload,
        can_comment: formData.permissions.canComment,
        can_edit: formData.permissions.canEdit,
        created_by: document.client_id // TODO: Get actual user ID
      });

      if (result.success && result.data) {
        await loadExistingShares();
        onShareCreated?.(result.data as unknown as DocumentShareType);
        
        // Reset form
        setFormData({
          ...formData,
          email: '',
          message: ''
        });
        
        setActiveTab('existing');
      }
    } catch (error) {
      console.error('Error creating share:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      await documentService.revokeDocumentShare(shareId, document.client_id);
      await loadExistingShares();
    } catch (error) {
      console.error('Error revoking share:', error);
    }
  };

  const generateShareLink = (share: DocumentShareType): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${share.share_token}`;
  };

  const copyToClipboard = async (text: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(shareId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getPermissionIcons = (share: DocumentShareType) => {
    const icons = [];
    if (share.can_view) icons.push(<Eye key="view" className="w-4 h-4" />);
    if (share.can_download) icons.push(<Download key="download" className="w-4 h-4" />);
    if (share.can_comment) icons.push(<MessageSquare key="comment" className="w-4 h-4" />);
    if (share.can_edit) icons.push(<Edit key="edit" className="w-4 h-4" />);
    return icons;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Share2 className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Share Document</h2>
              <p className="text-sm text-gray-500 truncate max-w-md">
                {document.original_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'create'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Share
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'existing'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Existing Shares ({shares.length})
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'create' ? (
            <div className="space-y-6">
              {/* Share Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Share Type</label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setFormData({ ...formData, shareType: 'email' })}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      formData.shareType === 'email'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, shareType: 'link' })}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      formData.shareType === 'link'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Link className="w-4 h-4" />
                    <span>Link</span>
                  </button>
                </div>
              </div>

              {/* Email Input */}
              {formData.shareType === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
              )}

              {/* Permissions */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Permissions</label>
                <div className="space-y-2">
                  {Object.entries({
                    canView: 'View document',
                    canDownload: 'Download document',
                    canComment: 'Add comments',
                    canEdit: 'Edit document'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.permissions[key as keyof typeof formData.permissions]}
                        onChange={(e) => setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [key]: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Advanced Options</span>
                </h4>

                {/* Expiration */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.expiration.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        expiration: { ...formData.expiration, enabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Set expiration date</span>
                  </label>
                  {formData.expiration.enabled && (
                    <div className="ml-6 flex space-x-2">
                      <input
                        type="date"
                        value={formData.expiration.date}
                        onChange={(e) => setFormData({
                          ...formData,
                          expiration: { ...formData.expiration, date: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="time"
                        value={formData.expiration.time}
                        onChange={(e) => setFormData({
                          ...formData,
                          expiration: { ...formData.expiration, time: e.target.value }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Password Protection */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.password.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        password: { ...formData.password, enabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Password protection</span>
                  </label>
                  {formData.password.enabled && (
                    <div className="ml-6">
                      <input
                        type="password"
                        value={formData.password.value}
                        onChange={(e) => setFormData({
                          ...formData,
                          password: { ...formData.password, value: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter password"
                      />
                    </div>
                  )}
                </div>

                {/* Download Limit */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.downloadLimit.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        downloadLimit: { ...formData.downloadLimit, enabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Limit downloads</span>
                  </label>
                  {formData.downloadLimit.enabled && (
                    <div className="ml-6">
                      <input
                        type="number"
                        value={formData.downloadLimit.count}
                        onChange={(e) => setFormData({
                          ...formData,
                          downloadLimit: { ...formData.downloadLimit, count: parseInt(e.target.value) || 0 }
                        })}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="1000"
                      />
                      <span className="ml-2 text-sm text-gray-500">downloads</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a personal message..."
                />
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateShare}
                disabled={isLoading || (formData.shareType === 'email' && !formData.email.trim())}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating Share...' : 'Create Share'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {shares.length > 0 ? (
                shares.map(share => (
                  <div
                    key={share.id}
                    className={`p-4 border rounded-lg ${
                      isExpired(share.expires_at) ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {share.is_public_link ? (
                            <Link className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Mail className="w-4 h-4 text-blue-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            {share.is_public_link ? 'Public Link' : share.shared_with_email}
                          </span>
                          {isExpired(share.expires_at) && (
                            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Expired
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            {getPermissionIcons(share)}
                          </div>
                          <span>Created {formatDate(share.created_at)}</span>
                          {share.expires_at && (
                            <span>Expires {formatDate(share.expires_at)}</span>
                          )}
                          {share.max_downloads && (
                            <span>{share.download_count}/{share.max_downloads} downloads</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(generateShareLink(share), share.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy link"
                        >
                          {copiedLink === share.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRevokeShare(share.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Revoke access"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No shares created yet.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first share
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentShare;