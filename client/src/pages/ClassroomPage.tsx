import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { api } from '../services/api.js';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MessageSquare, 
  Users, 
  Hand, 
  PhoneOff, 
  Shield, 
  Lock, 
  Unlock, 
  VolumeX, 
  X, 
  Send, 
  Settings as SettingsIcon, 
  MoreVertical,
  Pin,
  UserX,
  AlertCircle
} from 'lucide-react';

interface Participant {
  socketId: string;
  userId: number;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  audioEnabled: boolean;
  videoEnabled: boolean;
  isHandRaised: boolean;
}

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

export const ClassroomPage: React.FC = () => {
  const { classCode } = useParams<{ classCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [classDetails, setClassDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Classroom media states
  const [micEnabled, setMicEnabled] = useState(location.state?.initialMic ?? true);
  const [camEnabled, setCamEnabled] = useState(location.state?.initialCam ?? true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Classroom panels
  const [activePanel, setActivePanel] = useState<'chat' | 'participants' | null>(null);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);

  // Classroom participants & chat state
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [roomSettings, setRoomSettings] = useState({ isLocked: false, isChatDisabled: false });
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Local media stream references
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  // 1. Fetch Class Data
  useEffect(() => {
    const fetchClass = async () => {
      try {
        const res = await api.get(`/classes/${classCode}`);
        if (res.success && res.class) {
          setClassDetails(res.class);
        } else {
          alert('Class not found.');
          navigate('/student');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchClass();
  }, [classCode, navigate]);

  // 2. Initialize Media Stream
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        stream.getAudioTracks().forEach(t => { t.enabled = micEnabled; });
        stream.getVideoTracks().forEach(t => { t.enabled = camEnabled; });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Classroom media access note:', err);
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 3. Socket.IO Room Joining & Event Listeners
  useEffect(() => {
    if (!socket || !classDetails || !user) return;

    // Join room
    socket.emit('join-classroom', {
      classCode: classDetails.class_code,
      classId: classDetails.id,
      user: {
        id: user.id,
        name: location.state?.displayName || user.name,
        role: user.role,
        studentId: user.studentId,
        teacherId: user.teacherId
      },
      audioEnabled: micEnabled,
      videoEnabled: camEnabled
    });

    // Room joined callback
    socket.on('room-joined', ({ participants: existing, settings }) => {
      setParticipants(existing);
      if (settings) setRoomSettings(settings);
    });

    // Participant joined
    socket.on('participant-joined', (participant: Participant) => {
      setParticipants(prev => {
        if (prev.some(p => p.socketId === participant.socketId)) return prev;
        return [...prev, participant];
      });
    });

    // Participant left
    socket.on('participant-left', ({ socketId }) => {
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    });

    // Participant state updates
    socket.on('participant-audio-changed', ({ socketId, enabled }) => {
      setParticipants(prev => prev.map(p => p.socketId === socketId ? { ...p, audioEnabled: enabled } : p));
    });

    socket.on('participant-video-changed', ({ socketId, enabled }) => {
      setParticipants(prev => prev.map(p => p.socketId === socketId ? { ...p, videoEnabled: enabled } : p));
    });

    socket.on('participant-hand-changed', ({ socketId, isHandRaised: raised }) => {
      setParticipants(prev => prev.map(p => p.socketId === socketId ? { ...p, isHandRaised: raised } : p));
    });

    // Chat
    socket.on('new-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      if (activePanel !== 'chat') {
        setUnreadChatCount(prev => prev + 1);
      }
    });

    // Teacher Host Control triggers
    socket.on('force-mute-audio', () => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
      }
      setMicEnabled(false);
      socket.emit('toggle-audio', { enabled: false });
    });

    socket.on('room-settings-changed', (settings) => {
      setRoomSettings(settings);
    });

    socket.on('kicked-from-class', ({ message }) => {
      alert(message || 'You have been removed from the class session.');
      handleLeave();
    });

    socket.on('class-ended-by-teacher', ({ message }) => {
      alert(message || 'The teacher has concluded this class session.');
      handleLeave();
    });

    return () => {
      socket.off('room-joined');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('participant-audio-changed');
      socket.off('participant-video-changed');
      socket.off('participant-hand-changed');
      socket.off('new-message');
      socket.off('force-mute-audio');
      socket.off('room-settings-changed');
      socket.off('kicked-from-class');
      socket.off('class-ended-by-teacher');
    };
  }, [socket, classDetails, user]);

  // Media Controls
  const toggleMic = () => {
    const next = !micEnabled;
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = next; });
    }
    setMicEnabled(next);
    socket?.emit('toggle-audio', { enabled: next });
  };

  const toggleCam = () => {
    const next = !camEnabled;
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = next; });
    }
    setCamEnabled(next);
    socket?.emit('toggle-video', { enabled: next });
  };

  const toggleHand = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    socket?.emit('toggle-hand', { isHandRaised: next });
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
        setIsScreenSharing(true);
      } catch (e) {
        console.warn('Screen share cancelled or unsupported');
      }
    }
  };

  // Leave Class (Records attendance leave on backend)
  const handleLeave = async () => {
    // 1. Notify socket server
    if (socket && classDetails) {
      socket.emit('leave-classroom', { classId: classDetails.id });
    }

    // 2. Call attendance leave API
    if (user?.role === 'student' && classDetails) {
      try {
        await api.post('/attendance/leave', { classId: classDetails.id });
      } catch (e) {
        console.error('Leave attendance record error:', e);
      }
    }

    // 3. Stop tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }

    navigate(user?.role === 'teacher' ? '/teacher' : user?.role === 'admin' ? '/admin' : '/student');
  };

  // Teacher Host Controls
  const handleTeacherMuteAll = () => {
    socket?.emit('teacher-mute-all');
  };

  const handleTeacherToggleLock = () => {
    const next = !roomSettings.isLocked;
    socket?.emit('teacher-toggle-lock', { isLocked: next });
  };

  const handleTeacherToggleChat = () => {
    const next = !roomSettings.isChatDisabled;
    socket?.emit('teacher-toggle-chat', { isChatDisabled: next });
  };

  const handleTeacherKick = (targetSocketId: string) => {
    if (window.confirm('Remove this student from the current class?')) {
      socket?.emit('teacher-kick-participant', { targetSocketId });
    }
  };

  const handleTeacherEndClass = () => {
    if (window.confirm('End class for all participants? Attendance will be finalized.')) {
      socket?.emit('teacher-end-class', { classId: classDetails.id });
      handleLeave();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !classDetails) return;

    socket?.emit('send-message', {
      classId: classDetails.id,
      message: inputMessage.trim()
    });

    setInputMessage('');
  };

  if (loading || !classDetails) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p className="font-semibold text-sm">Connecting to Classroom...</p>
      </div>
    );
  }

  // Identify teacher in room
  const teacherParticipant = participants.find(p => p.role === 'teacher' || p.role === 'admin');
  const studentParticipants = participants.filter(p => p.role === 'student');

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-14 bg-slate-900/90 border-b border-slate-800/80 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-live"></span>
          <h1 className="font-bold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-md">
            {classDetails.title}
          </h1>
          <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {classDetails.class_code}
          </span>
          {roomSettings.isLocked && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
        </div>

        {/* Teacher Host Quick Actions */}
        {isTeacherOrAdmin && (
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleTeacherMuteAll}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Mute all students"
            >
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              Mute All
            </button>
            <button
              onClick={handleTeacherToggleLock}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                roomSettings.isLocked ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {roomSettings.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {roomSettings.isLocked ? 'Unlock Room' : 'Lock Room'}
            </button>
            <button
              onClick={handleTeacherToggleChat}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                roomSettings.isChatDisabled ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {roomSettings.isChatDisabled ? 'Enable Chat' : 'Disable Chat'}
            </button>
          </div>
        )}

        {/* Status / Instructor name */}
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Teacher: <strong className="text-slate-200">{classDetails.teacher_name}</strong></span>
        </div>
      </header>

      {/* Main Classroom Workspace (Video Grid + Slide-over Drawers) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Stage Area */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto">
          {/* Main Stage (Teacher / Spotlight) */}
          <div className="flex-1 min-h-[300px] relative rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl">
            {/* If user is teacher, show their local video in main stage, otherwise show teacher's stream/avatar */}
            {user?.role === 'teacher' ? (
              camEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isScreenSharing ? '' : 'scale-x-[-1]'}`}
                />
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-3xl mx-auto mb-3 shadow-lg">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-bold text-lg text-white">{user?.name} (Teacher)</p>
                  <p className="text-xs text-slate-400">Camera is turned off</p>
                </div>
              )
            ) : teacherParticipant ? (
              teacherParticipant.videoEnabled ? (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  {/* Remote video simulation/stream tile */}
                  <div className="text-center p-6">
                    <div className="w-28 h-28 rounded-full bg-brand-600 text-white flex items-center justify-center font-extrabold text-4xl mx-auto mb-3 shadow-xl">
                      {teacherParticipant.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-bold text-xl text-white">{teacherParticipant.name}</p>
                    <p className="text-xs text-emerald-400 font-semibold mt-1">● Live Broadcasting</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-3xl mx-auto mb-3">
                    {teacherParticipant.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-bold text-lg text-white">{teacherParticipant.name} (Teacher)</p>
                  <p className="text-xs text-slate-400">Camera is off</p>
                </div>
              )
            ) : (
              <div className="text-center p-6 text-slate-400">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-300">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-200">Instructor is preparing the class</h3>
                <p className="text-xs text-slate-500 mt-1">The teacher will appear on this stage momentarily.</p>
              </div>
            )}

            {/* Stage Overlays */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs font-bold text-white">
                {user?.role === 'teacher' ? `${user?.name} (You)` : `${classDetails.teacher_name} (Instructor)`}
              </span>
              {user?.role === 'teacher' && !micEnabled && (
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
          </div>

          {/* Student Thumbnail Grid */}
          <div className="h-32 sm:h-36 flex items-center gap-3 overflow-x-auto pb-1 shrink-0">
            {/* Self Video (if student) */}
            {user?.role !== 'teacher' && (
              <div className="h-full aspect-video rounded-2xl bg-slate-900 border-2 border-brand-500/50 overflow-hidden relative shrink-0 flex items-center justify-center shadow-md">
                {camEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                  <span>You</span>
                  {!micEnabled && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
                  {isHandRaised && <Hand className="w-2.5 h-2.5 text-amber-400" />}
                </div>
              </div>
            )}

            {/* Remote Peers Grid */}
            {studentParticipants.map((p) => (
              <div
                key={p.socketId}
                className="h-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden relative shrink-0 flex items-center justify-center shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-sm">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 truncate max-w-[110px]">
                  <span>{p.name}</span>
                  {!p.audioEnabled && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
                  {p.isHandRaised && <Hand className="w-2.5 h-2.5 text-amber-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slide-over Drawer: Chat */}
        {activePanel === 'chat' && (
          <aside className="w-full sm:w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-30 shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-400" /> Classroom Chat
                </h3>
                <span className="text-[11px] text-slate-400">To: Everyone</span>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {roomSettings.isChatDisabled && (
                <div className="p-2.5 rounded-xl bg-amber-900/40 border border-amber-600/30 text-amber-200 text-xs text-center">
                  Chat has been paused by the instructor.
                </div>
              )}

              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No messages yet. Say hello to everyone!
                </div>
              ) : (
                messages.map((m) => {
                  const isSelf = m.senderId === user?.id;
                  const isTeacher = m.senderRole === 'teacher' || m.senderRole === 'admin';
                  return (
                    <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] font-bold text-slate-300">
                          {isSelf ? 'You' : m.senderName}
                        </span>
                        {isTeacher && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-brand-600/80 text-white">
                            Teacher
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        isSelf 
                          ? 'bg-brand-600 text-white rounded-tr-none' 
                          : isTeacher 
                            ? 'bg-slate-800 border border-brand-500/40 text-slate-100 rounded-tl-none' 
                            : 'bg-slate-800 text-slate-200 rounded-tl-none'
                      }`}>
                        {m.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                disabled={roomSettings.isChatDisabled && !isTeacherOrAdmin}
                placeholder={roomSettings.isChatDisabled && !isTeacherOrAdmin ? 'Chat is disabled' : 'Type a message to Everyone...'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-brand-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || (roomSettings.isChatDisabled && !isTeacherOrAdmin)}
                className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </aside>
        )}

        {/* Slide-over Drawer: Participants */}
        {activePanel === 'participants' && (
          <aside className="w-full sm:w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-30 shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                Participants ({participants.length + 1})
              </h3>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {/* Teacher Roster Tile */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-brand-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                    {classDetails.teacher_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{classDetails.teacher_name}</p>
                    <span className="text-[10px] text-brand-400 font-semibold">Teacher • Host</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Student Roster Tiles */}
              {participants.map((p) => (
                <div key={p.socketId} className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-200 truncate">{p.name}</p>
                      {p.isHandRaised && (
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                          <Hand className="w-3 h-3" /> Raised Hand
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {p.audioEnabled ? (
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    )}

                    {/* Teacher Action Menu */}
                    {isTeacherOrAdmin && (
                      <button
                        onClick={() => handleTeacherKick(p.socketId)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700"
                        title="Remove student"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* BOTTOM CONTROL BAR WITH LARGE TOUCH TARGETS */}
      <footer className="h-20 bg-slate-900 border-t border-slate-800 px-4 sm:px-8 flex items-center justify-between z-20 shrink-0">
        {/* Left: Device status info */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">{classDetails.title}</span>
        </div>

        {/* Center: Essential Meeting Controls (Large Buttons) */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto lg:mx-0">
          {/* Mic */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
              micEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/20'
            }`}
            title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleCam}
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
              camEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/20'
            }`}
            title={camEnabled ? 'Stop Video' : 'Start Video'}
          >
            {camEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all hidden sm:flex ${
              isScreenSharing
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Screen Share"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleHand}
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isHandRaised
                ? 'bg-amber-500 text-slate-950 font-bold ring-4 ring-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Raise Hand"
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => {
              setActivePanel(activePanel === 'chat' ? null : 'chat');
              setUnreadChatCount(0);
            }}
            className={`w-12 h-12 rounded-2xl relative flex flex-col items-center justify-center transition-all ${
              activePanel === 'chat'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Class Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants Toggle */}
          <button
            onClick={() => setActivePanel(activePanel === 'participants' ? null : 'participants')}
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activePanel === 'participants'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Teacher End Class Button */}
          {isTeacherOrAdmin && (
            <button
              onClick={handleTeacherEndClass}
              className="px-4 h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all hidden md:flex items-center gap-1.5"
            >
              End Class for All
            </button>
          )}

          {/* LEAVE CLASS (BIG RED BUTTON) */}
          <button
            onClick={handleLeave}
            className="px-5 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            title="Leave Class"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">Leave Class</span>
          </button>
        </div>

        {/* Right Empty spacer on desktop to balance */}
        <div className="hidden lg:block w-24"></div>
      </footer>
    </div>
  );
};
