import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.js';

export const SocketContext = createContext({
  socket: null,
  connected: false,
  error: null,
  lastHeartbeat: null,
  emit: () => {},
  on: () => {},
  off: () => {}
});

const buildSocketUrl = () => {
  const explicitUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

export function SocketProvider({ children }) {
  const { token, user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const heartbeatRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      setConnected(false);
      setError(null);
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
      }
      return undefined;
    }

    const nextSocket = io(buildSocketUrl(), {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: {
        token
      }
    });

    const startHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }

      heartbeatRef.current = setInterval(() => {
        nextSocket.emit('client:heartbeat', { ts: new Date().toISOString() });
      }, 30000);
    };

    const stopHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    const handleUnauthorized = (message) => {
      const normalized = String(message || '').toLowerCase();
      return normalized.includes('no autorizado') || normalized.includes('token expirado') || normalized.includes('unauthorized');
    };

    nextSocket.on('connect', () => {
      setConnected(true);
      setError(null);
      startHeartbeat();
    });

    nextSocket.on('disconnect', () => {
      setConnected(false);
      stopHeartbeat();
    });

    nextSocket.on('connect_error', (socketError) => {
      setConnected(false);
      setError(socketError?.message || 'Error de conexion en tiempo real');
      if (handleUnauthorized(socketError?.message)) {
        logout({ redirect: true });
      }
    });

    nextSocket.on('server:heartbeat', ({ ts }) => {
      setLastHeartbeat(ts || new Date().toISOString());
    });

    nextSocket.connect();
    setSocket(nextSocket);

    return () => {
      stopHeartbeat();
      nextSocket.removeAllListeners();
      nextSocket.disconnect();
      setSocket((current) => (current === nextSocket ? null : current));
    };
  }, [logout, token, user]);

  const value = useMemo(
    () => ({
      socket,
      connected,
      error,
      lastHeartbeat,
      emit: (event, payload) => {
        socket?.emit(event, payload);
      },
      on: (event, handler) => {
        socket?.on(event, handler);
      },
      off: (event, handler) => {
        socket?.off(event, handler);
      }
    }),
    [connected, error, lastHeartbeat, socket]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
