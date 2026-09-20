import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Plus, 
  Trash2, 
  File, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  User, 
  X,
  Link as LinkIcon
} from 'lucide-react';

export const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<'file' | 'link'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const canUpload = user?.role === 'teacher' || user?.role === 'admin';

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/materials');
      if (res.success) {
        setMaterials(res.materials || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());

      if (fileType === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (fileType === 'link' && externalUrl) {
        formData.append('externalUrl', externalUrl.trim());
      } else {
        alert('Please select a file or enter a valid URL.');
        setUploading(false);
        return;
      }

      const res = await api.post('/materials', formData);
      if (res.success) {
        setModalOpen(false);
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        setExternalUrl('');
        fetchMaterials();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload material.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this learning material?')) {
      try {
        await api.delete(`/materials/${id}`);
        fetchMaterials();
      } catch (e: any) {
        alert(e.message || 'Failed to delete material');
      }
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-500" />;
      case 'ppt':
      case 'pptx':
        return <File className="w-6 h-6 text-amber-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-6 h-6 text-blue-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <ImageIcon className="w-6 h-6 text-emerald-500" />;
      case 'mp4':
      case 'webm':
        return <Video className="w-6 h-6 text-purple-500" />;
      case 'link':
        return <LinkIcon className="w-6 h-6 text-indigo-500" />;
      default:
        return <FileText className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Learning Materials
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access slides, lecture notes, guides, and homework resources.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Upload Material
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 font-semibold text-sm">
          Loading learning materials...
        </div>
      ) : materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((m) => {
            const isExternalLink = m.file_type === 'link' || m.file_url.startsWith('http');
            return (
              <div
                key={m.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                      {getFileIcon(m.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                        {m.file_type}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1 line-clamp-1">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {m.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-4 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {m.teacher_name}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    download={!isExternalLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 font-bold text-xs transition-colors"
                  >
                    {isExternalLink ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                    <span>{isExternalLink ? 'Open Link' : 'Download File'}</span>
                  </a>

                  {canUpload && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState type="materials" />
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-left border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Upload Learning Material</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Day 3 Lecture Slides (PDF)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of what this resource covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Type of Resource
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setFileType('file')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                      fileType === 'file' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileType('link')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                      fileType === 'link' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    External Link
                  </button>
                </div>

                {fileType === 'file' ? (
                  <input
                    type="file"
                    required
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                  />
                ) : (
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/... or https://..."
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-600 outline-none font-mono text-xs"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
