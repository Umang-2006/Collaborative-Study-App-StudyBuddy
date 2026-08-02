import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('presence_update', (members) => {
      setActiveMembers(members);
    });

    newSocket.on('system_message', (msg) => {
      setSystemMessages((prev) => [...prev.slice(-40), msg]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = (roomCode) => {
    if (socket && user && roomCode) {
      socket.emit('join_room', { roomCode, user });
      setCurrentRoom(roomCode.toUpperCase());
    }
  };

  const leaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit('leave_room');
      setCurrentRoom(null);
      setActiveMembers([]);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      currentRoom,
      activeMembers,
      systemMessages,
      joinRoom,
      leaveRoom
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
