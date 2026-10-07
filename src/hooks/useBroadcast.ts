'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const CHANNEL_NAME = 'digital-board-sync';
const LEADER_KEY = 'digital-board-leader';
const FOLLOWER_KEY = 'digital-board-follower';

export type BroadcastMessage =
  | { type: 'navigate'; slug: string; anchorId?: string }
  | { type: 'annotation'; strokes: unknown }
  | { type: 'board-update'; sceneData: unknown }
  | { type: 'cursor'; x: number; y: number }
  | { type: 'click'; x: number; y: number }
  | { type: 'role'; role: 'leader' | 'follower' }
  | { type: 'focus'; sceneId: string; step: number }
  | { type: 'step'; step: number }
  | { type: 'spotlight'; rect: { x: number; y: number; w: number; h: number } | null }
  | { type: 'present'; on: boolean };

export type Mode = 'teacher' | 'student';

export function useBroadcast() {
  const channelRef = useRef<BroadcastChannel | null>(null);
  // Default to teacher: this app is primarily the instructor's workspace.
  // A persisted follower flag (or a live 'follower' broadcast) opts out.
  const [mode, setMode] = useState<Mode>('teacher');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    setIsConnected(true);

    if (localStorage.getItem(FOLLOWER_KEY)) {
      setMode('student');
    } else {
      setMode('teacher');
    }

    const handler = (e: MessageEvent<BroadcastMessage>) => {
      if (e.data.type === 'role') {
        setMode(e.data.role === 'leader' ? 'teacher' : 'student');
      }
    };
    channel.addEventListener('message', handler);

    return () => {
      channel.removeEventListener('message', handler);
      channel.close();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, []);

  const broadcast = useCallback((msg: BroadcastMessage) => {
    channelRef.current?.postMessage(msg);
  }, []);

  const subscribe = useCallback((handler: (msg: BroadcastMessage) => void) => {
    const channel = channelRef.current;
    if (!channel) return () => {};

    const listener = (e: MessageEvent<BroadcastMessage>) => handler(e.data);
    channel.addEventListener('message', listener);
    return () => channel.removeEventListener('message', listener);
  }, []);

  const setTeacherMode = useCallback(() => {
    setMode('teacher');
    localStorage.setItem(LEADER_KEY, Date.now().toString());
    localStorage.removeItem(FOLLOWER_KEY);
    broadcast({ type: 'role', role: 'leader' });
  }, [broadcast]);

  const setStudentMode = useCallback(() => {
    setMode('student');
    localStorage.removeItem(LEADER_KEY);
    localStorage.setItem(FOLLOWER_KEY, '1');
    broadcast({ type: 'role', role: 'follower' });
  }, [broadcast]);

  return {
    mode,
    isConnected,
    broadcast,
    subscribe,
    setTeacherMode,
    setStudentMode,
  };
}
