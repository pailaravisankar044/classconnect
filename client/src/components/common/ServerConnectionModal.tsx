import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { getServerUrl } from '../../services/api.js';

export const ServerConnectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(getServerUrl() || 'http://192.168.29.216:5000');
      setTestResult(null);
      setStatusMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testConnection = async (targetUrl: string) => {
    setIsTesting(true);
    setTestResult(null);
    setStatusMsg('Testing connection to server...');
    try {
      const cleanUrl = targetUrl.trim().replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/api/health`, { method: 'GET' });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setTestResult('success');
        setStatusMsg('Connected successfully! ClassConnect server is online.');
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err: any) {
      setTestResult('error');
      setStatusMsg('Could not reach server. Verify the IP/domain, port, and Wi-Fi connection.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const cleanUrl = url.trim().replace(/\/$/, '');
    if (cleanUrl) {
      localStorage.setItem('classconnect_server_url', cleanUrl);
    } else {
      localStorage.removeItem('classconnect_server_url');
    }
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Server Connection</h3>
              <p className="text-xs text-slate-500 font-normal">Connect mobile app to ClassConnect backend</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Backend Server Address (URL)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. http://192.168.29.216:5000 or https://classconnect.onrender.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Enter your local computer Wi-Fi IP or your permanent 24/7 Render cloud address.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => testConnection(url)}
              disabled={isTesting || !url.trim()}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
            <button
              type="button"
              onClick={() => {
                setUrl('http://192.168.29.216:5000');
                testConnection('http://192.168.29.216:5000');
              }}
              className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all"
            >
              Reset to Wi-Fi IP
            </button>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                testResult === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : testResult === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              {testResult === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {testResult === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
            >
              Save & Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
