import { Server as SocketIOServer, Socket } from 'socket.io';
import { dbHelper } from '../db/database.js';
import { AttendanceService } from '../services/attendanceService.js';

interface ParticipantInfo {
  socketId: string;
  userId: number;
  studentId?: number;
  teacherId?: number;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  audioEnabled: boolean;
  videoEnabled: boolean;
  isHandRaised: boolean;
  joinedAt: string;
}

// In-memory room state mapped by classCode or classId
const rooms = new Map<string, Map<string, ParticipantInfo>>();
const roomSettings = new Map<string, { isLocked: boolean; isChatDisabled: boolean }>();

export function setupClassroomSocket(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    let currentRoom: string | null = null;
    let currentUser: ParticipantInfo | null = null;

    // Join Classroom Room
    socket.on('join-classroom', async (data: {
      classCode: string;
      classId: number;
      user: {
        id: number;
        name: string;
        role: 'admin' | 'teacher' | 'student';
        studentId?: number;
        teacherId?: number;
      };
      audioEnabled?: boolean;
      videoEnabled?: boolean;
    }) => {
      const { classCode, classId, user, audioEnabled = true, videoEnabled = true } = data;
      const roomKey = classCode || `class_${classId}`;

      // Check if room is locked
      const settings = roomSettings.get(roomKey) || { isLocked: false, isChatDisabled: false };
      if (settings.isLocked && user.role === 'student') {
        socket.emit('error-joining', { message: 'This class has been locked by the teacher.' });
        return;
      }

      currentRoom = roomKey;
      socket.join(roomKey);

      if (!rooms.has(roomKey)) {
        rooms.set(roomKey, new Map());
      }

      const roomParticipants = rooms.get(roomKey)!;

      currentUser = {
        socketId: socket.id,
        userId: user.id,
        studentId: user.studentId,
        teacherId: user.teacherId,
        name: user.name,
        role: user.role,
        audioEnabled,
        videoEnabled,
        isHandRaised: false,
        joinedAt: new Date().toISOString()
      };

      roomParticipants.set(socket.id, currentUser);

      // Record attendance for students
      if (user.role === 'student' && user.studentId && classId) {
        try {
          AttendanceService.recordJoin(classId, user.studentId);
        } catch (e) {
          console.error('Error recording student join attendance:', e);
        }
      }

      // If teacher joins and class status is scheduled, update class to 'live'
      if (user.role === 'teacher' && classId) {
        dbHelper.run(`UPDATE classes SET status = 'live' WHERE id = ? AND status = 'scheduled'`, [classId]);
      }

      // Send existing participants to newly joined user
      const existingParticipants = Array.from(roomParticipants.values()).filter(p => p.socketId !== socket.id);
      socket.emit('room-joined', {
        room: roomKey,
        self: currentUser,
        participants: existingParticipants,
        settings
      });

      // Notify others in the room
      socket.to(roomKey).emit('participant-joined', currentUser);
    });

    // WebRTC Signaling: Offer
    socket.on('signal-offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('signal-offer', {
        senderSocketId: socket.id,
        senderUser: currentUser,
        offer
      });
    });

    // WebRTC Signaling: Answer
    socket.on('signal-answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('signal-answer', {
        senderSocketId: socket.id,
        answer
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('signal-ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('signal-ice-candidate', {
        senderSocketId: socket.id,
        candidate
      });
    });

    // Toggle Audio
    socket.on('toggle-audio', ({ enabled }: { enabled: boolean }) => {
      if (currentUser && currentRoom) {
        currentUser.audioEnabled = enabled;
        io.to(currentRoom).emit('participant-audio-changed', {
          socketId: socket.id,
          enabled
        });
      }
    });

    // Toggle Video
    socket.on('toggle-video', ({ enabled }: { enabled: boolean }) => {
      if (currentUser && currentRoom) {
        currentUser.videoEnabled = enabled;
        io.to(currentRoom).emit('participant-video-changed', {
          socketId: socket.id,
          enabled
        });
      }
    });

    // Raise / Lower Hand
    socket.on('toggle-hand', ({ isHandRaised }: { isHandRaised: boolean }) => {
      if (currentUser && currentRoom) {
        currentUser.isHandRaised = isHandRaised;
        io.to(currentRoom).emit('participant-hand-changed', {
          socketId: socket.id,
          isHandRaised
        });
      }
    });

    // Live Classroom Chat Message
    socket.on('send-message', ({ classId, message }: { classId: number; message: string }) => {
      if (!currentRoom || !currentUser) return;
      const settings = roomSettings.get(currentRoom) || { isLocked: false, isChatDisabled: false };

      if (settings.isChatDisabled && currentUser.role === 'student') {
        socket.emit('chat-disabled-notice', { message: 'Chat has been paused by the teacher.' });
        return;
      }

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Save to database
      try {
        dbHelper.run(`
          INSERT INTO messages (class_id, sender_id, sender_name, sender_role, message)
          VALUES (?, ?, ?, ?, ?)
        `, [classId, currentUser.userId, currentUser.name, currentUser.role, message]);
      } catch (err) {
        console.error('Error saving message:', err);
      }

      const chatPayload = {
        id: Date.now() + Math.random(),
        senderId: currentUser.userId,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        message,
        timestamp
      };

      io.to(currentRoom).emit('new-message', chatPayload);
    });

    // Teacher Host Control: Mute All Students
    socket.on('teacher-mute-all', () => {
      if (currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && currentRoom) {
        socket.to(currentRoom).emit('force-mute-audio');
      }
    });

    // Teacher Host Control: Toggle Lock Room
    socket.on('teacher-toggle-lock', ({ isLocked }: { isLocked: boolean }) => {
      if (currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && currentRoom) {
        const settings = roomSettings.get(currentRoom) || { isLocked: false, isChatDisabled: false };
        settings.isLocked = isLocked;
        roomSettings.set(currentRoom, settings);
        io.to(currentRoom).emit('room-settings-changed', settings);
      }
    });

    // Teacher Host Control: Toggle Disable Student Chat
    socket.on('teacher-toggle-chat', ({ isChatDisabled }: { isChatDisabled: boolean }) => {
      if (currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && currentRoom) {
        const settings = roomSettings.get(currentRoom) || { isLocked: false, isChatDisabled: false };
        settings.isChatDisabled = isChatDisabled;
        roomSettings.set(currentRoom, settings);
        io.to(currentRoom).emit('room-settings-changed', settings);
      }
    });

    // Teacher Host Control: Kick Student
    socket.on('teacher-kick-participant', ({ targetSocketId }: { targetSocketId: string }) => {
      if (currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && currentRoom) {
        io.to(targetSocketId).emit('kicked-from-class', { message: 'You have been removed from this class by the teacher.' });
      }
    });

    // Teacher Host Control: End Class
    socket.on('teacher-end-class', ({ classId }: { classId: number }) => {
      if (currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && currentRoom) {
        dbHelper.run(`UPDATE classes SET status = 'completed' WHERE id = ?`, [classId]);
        io.to(currentRoom).emit('class-ended-by-teacher', { message: 'The teacher has concluded this class session.' });
      }
    });

    // Leave / Disconnect
    const handleLeave = (classId?: number) => {
      if (currentRoom && currentUser) {
        const roomParticipants = rooms.get(currentRoom);
        if (roomParticipants) {
          roomParticipants.delete(socket.id);
          if (roomParticipants.size === 0) {
            rooms.delete(currentRoom);
            roomSettings.delete(currentRoom);
          }
        }

        // Record leave attendance for students
        if (currentUser.role === 'student' && currentUser.studentId && classId) {
          try {
            AttendanceService.recordLeave(classId, currentUser.studentId);
          } catch (e) {
            console.error('Error recording student leave attendance:', e);
          }
        }

        socket.to(currentRoom).emit('participant-left', {
          socketId: socket.id,
          userId: currentUser.userId,
          name: currentUser.name
        });
      }
    };

    socket.on('leave-classroom', ({ classId }: { classId?: number }) => {
      handleLeave(classId);
    });

    socket.on('disconnect', () => {
      handleLeave();
    });
  });
}
