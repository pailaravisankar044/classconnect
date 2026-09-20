import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  HelpCircle, 
  ExternalLink, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const JoinPage: React.FC = () => {
  const { classCode } = useParams<{ classCode: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [classDetails, setClassDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Media preview states
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [studentName, setStudentName] = useState(user?.name || '');
  const [mediaError, setMediaError] = useState('');
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // If unauthenticated, redirect to login with return parameter
  useEffect(() => {
    if (!token && !loading) {
      navigate(`/login?redirect=/join/${classCode}`);
    }
  }, [token, loading, classCode, navigate]);

  // Fetch Class Details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!classCode) return;
      try {
        setLoading(true);
        const res = await api.get(`/classes/${classCode}`);
        if (res.success && res.class) {
          setClassDetails(res.class);
        } else {
          setError('Class session not found or invalid join link.');
        }
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve class information.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [classCode]);

  // Request & attach camera/microphone preview stream
  useEffect(() => {
    let active = true;

    async function setupCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setMediaError('Camera & microphone preview is not supported by your browser.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn('Camera preview permission note:', err.name);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMediaError('Camera/Mic permission was denied. You can still join and enable it inside.');
        } else {
          setMediaError('Unable to access camera or microphone.');
        }
      }
    }

    setupCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !micEnabled;
      });
    }
    setMicEnabled(!micEnabled);
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => {
        t.enabled = !camEnabled;
      });
    }
    setCamEnabled(!camEnabled);
  };

  const handleJoinNow = async () => {
    if (!classDetails) return;
    setIsJoining(true);

    try {
      // 1. Log attendance join record on backend
      await api.post(`/classes/${classDetails.id}/join-log`);

      // 2. Check if external meeting (Zoom, Google Meet, Teams, Other)
      if (classDetails.meeting_type !== 'internal' && classDetails.meeting_url) {
        // Open external meeting in new tab
        window.open(classDetails.meeting_url, '_blank');
        // Stop local preview stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        setIsJoining(false);
        // Show success / redirection state
        alert(`Launching your ${classDetails.meeting_type.toUpperCase()} class in a new window! Your attendance has been logged.`);
        navigate('/student');
        return;
      }

      // 3. For internal WebRTC classroom: navigate to classroom screen
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      navigate(`/classroom/${classDetails.class_code}`, {
        state: {
          initialMic: micEnabled,
          initialCam: camEnabled,
          displayName: studentName || user?.name
        }
      });
    } catch (err: any) {
      console.error('Join error:', err);
      // Even if network glitches, still attempt navigation
      navigate(`/classroom/${classDetails.class_code}`);
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto animate-pulse mb-3">
            <Video className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-800 text-base">Preparing your classroom...</p>
        </div>
      </div>
    );
  }

  if (error || !classDetails) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-soft">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Class Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'This class link may be invalid or expired.'}</p>
          <Link
            to="/student"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isExternal = classDetails.meeting_type !== 'internal' && classDetails.meeting_url;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header summary */}
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-bold tracking-wide text-brand-600 uppercase bg-brand-50 border border-brand-200 px-3 py-1 rounded-full">
            {classDetails.class_code}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            {classDetails.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> Instructor: {classDetails.teacher_name}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {classDetails.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {classDetails.start_time} – {classDetails.end_time}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Camera Preview and Controls (7 cols) */}
          <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-soft">
            <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center shadow-inner">
              {camEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="text-center text-slate-400 p-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 text-white font-bold text-xl">
                    {studentName?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <p className="text-xs font-medium">Camera is turned off</p>
                </div>
              )}

              {/* Status indicator tags */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-black/60 backdrop-blur text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                  Preview
                </span>
                {!micEnabled && (
                  <span className="bg-rose-600/90 text-white text-[11px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                    <MicOff className="w-3 h-3" /> Muted
                  </span>
                )}
              </div>

              {/* Bottom Quick Equipment Toggles */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                    micEnabled
                      ? 'bg-white text-slate-800 hover:bg-slate-100'
                      : 'bg-rose-600 text-white hover:bg-rose-700 ring-4 ring-rose-500/20'
                  }`}
                  title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleCam}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                    camEnabled
                      ? 'bg-white text-slate-800 hover:bg-slate-100'
                      : 'bg-rose-600 text-white hover:bg-rose-700 ring-4 ring-rose-500/20'
                  }`}
                  title={camEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
                >
                  {camEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mediaError && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{mediaError}</span>
              </div>
            )}
          </div>

          {/* Right Column: Name confirmation and Join Action (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft">
              <h3 className="text-base font-bold text-slate-900 mb-1">Ready to join?</h3>
              <p className="text-xs text-slate-500 mb-4">
                Confirm your display name before entering the live session.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-600 outline-none"
                  placeholder="Student Name"
                />
              </div>

              {/* Provider Info */}
              {isExternal && (
                <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                  <p className="font-bold mb-0.5">External Meeting Notice</p>
                  <p className="text-blue-700 leading-tight">
                    This class is conducted via <strong>{classDetails.meeting_type.toUpperCase()}</strong>.
                    Clicking Join will record your attendance and open the meeting directly.
                  </p>
                </div>
              )}

              {/* BIG JOIN BUTTON */}
              <button
                type="button"
                onClick={handleJoinNow}
                disabled={isJoining}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-extrabold text-lg text-white bg-brand-600 hover:bg-brand-700 shadow-elevated shadow-brand-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                {isExternal ? <ExternalLink className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                <span>{isJoining ? 'Joining Class...' : 'JOIN NOW'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Troubleshooting Collapsible Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <button
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-brand-600" />
                  Having trouble joining?
                </span>
                {showTroubleshooting ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showTroubleshooting && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2 leading-relaxed animate-in fade-in">
                  <p><strong>Camera or Mic not working?</strong> Check that your browser has allowed camera permissions in your address bar.</p>
                  <p><strong>Slow connection?</strong> Close background video apps or tabs, and turn off your camera inside the class for better audio stability.</p>
                  <p><strong>Echo issue?</strong> Using headphones or earbuds will eliminate feedback and background noise.</p>
                  <Link to="/support" className="inline-block text-brand-600 font-bold hover:underline mt-1">
                    View comprehensive support guide →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
