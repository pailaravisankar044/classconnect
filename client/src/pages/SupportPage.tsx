import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Video, 
  Mic, 
  Wifi, 
  PhoneCall, 
  Mail, 
  CheckCircle2, 
  ArrowLeft,
  Smartphone,
  Laptop
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <HelpCircle className="w-8 h-8 text-brand-600" />
          Help & Student Support
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Simple step-by-step solutions for common audio, video, and connection questions.
        </p>
      </div>

      {/* Guide 1: How to Join a Class */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg">
            1
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">How to Join Your Online Class</h3>
            <p className="text-xs text-slate-500">The easiest, 3-step class attendance process</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-900 block mb-1">Step 1: Sign In</span>
            Log in with your registered email or mobile number from your phone or computer.
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-900 block mb-1">Step 2: See Next Class</span>
            Your today's scheduled or LIVE class is displayed prominently on your dashboard.
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-900 block mb-1">Step 3: Click JOIN CLASS</span>
            Tap the big blue or red "JOIN CLASS" button to enter the live room instantly.
          </div>
        </div>
      </div>

      {/* Troubleshooting Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Camera Troubleshooting */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Camera Not Working?</h4>
          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Tap the padlock icon 🔒 in your browser address bar and set <strong>Camera: Allow</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Ensure no other app (like WhatsApp or Skype) is currently using your camera.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Refresh your web browser page.</span>
            </li>
          </ul>
        </div>

        {/* Microphone Troubleshooting */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Mic className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Microphone Not Working?</h4>
          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Check if you are muted. Tap the microphone icon at the bottom of the screen to unmute.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Plug in headphones or earbuds with an in-line microphone.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Allow microphone access in browser settings.</span>
            </li>
          </ul>
        </div>

        {/* Internet Connection */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Wifi className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Slow Internet / Lag?</h4>
          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Turn off your camera video stream inside the classroom to save bandwidth.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Move closer to your Wi-Fi router or switch to 4G/5G mobile hotspot.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Close streaming apps, downloads, and social media tabs.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Contact Support Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <h3 className="text-xl font-bold">Still having trouble?</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Our support desk is available to assist students before and during live classes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="mailto:support@classconnect.com"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            <Mail className="w-4 h-4 text-brand-600" />
            support@classconnect.com
          </a>
        </div>
      </div>
    </div>
  );
};
