import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  classCode: string;
  classTitle: string;
  teacherName?: string;
  date?: string;
  time?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  classCode,
  classTitle,
  teacherName,
  date,
  time
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const joinUrl = `${window.location.origin}/join/${classCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 leading-tight">Scan to Join Class</h3>
        <p className="text-xs text-slate-500 mt-1">
          Students can scan with their phone camera to enter directly.
        </p>

        {/* QR Code Container */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block my-5 shadow-inner">
          <QRCodeSVG 
            value={joinUrl} 
            size={190} 
            level="H" 
            includeMargin={true}
          />
        </div>

        <div className="bg-slate-50 p-3 rounded-xl mb-4 text-left border border-slate-100">
          <p className="font-bold text-slate-900 text-sm truncate">{classTitle}</p>
          {teacherName && <p className="text-xs text-slate-500">Instructor: {teacherName}</p>}
          {date && time && <p className="text-xs text-slate-400 mt-0.5">{date} • {time}</p>}
          <p className="text-[11px] font-mono text-brand-600 mt-1 font-semibold">{classCode}</p>
        </div>

        {/* Shareable Link Box */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 pl-3">
          <input
            type="text"
            readOnly
            value={joinUrl}
            className="text-xs text-slate-600 bg-transparent flex-1 outline-none truncate font-mono"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <a
          href={joinUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 font-medium"
        >
          Open preview in new tab <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
