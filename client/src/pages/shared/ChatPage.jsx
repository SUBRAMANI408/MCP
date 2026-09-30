import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../app/store';
import toast from 'react-hot-toast';
import {
  PaperAirplaneIcon, PaperClipIcon, FaceSmileIcon,
  MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon,
  MicrophoneIcon, CheckIcon, CheckCircleIcon,
  EllipsisVerticalIcon, ArrowUturnLeftIcon, ArrowRightIcon,
  SpeakerWaveIcon, PhotoIcon, DocumentIcon, MegaphoneIcon,
  InformationCircleIcon, ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🏆', '⚽', '🏏', '🎯', '🔥', '💪'];

const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const getMessageType = (msg) => {
  if (msg.isAnnouncement) return 'announcement';
  return msg.type || 'text';
};

export default function ChatPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user } = useAuthStore();
  const { socket, connected } = useSocket();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Input state
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardTargetGroupId, setForwardTargetGroupId] = useState('');

  // UI state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showEmojiFor, setShowEmojiFor] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { msgId, x, y }
  const [showPinned, setShowPinned] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState({});
  const [myGroups, setMyGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const containerRef = useRef(null);

  // Load group info
  const loadGroup = useCallback(async () => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data.data);
    } catch { toast.error('Failed to load group'); }
  }, [groupId]);

  // Load messages
  const loadMessages = useCallback(async (pg = 1, append = false) => {
    try {
      const res = await api.get(`/groups/${groupId}/messages`, { params: { page: pg, limit: 50 } });
      const data = res.data.data || [];
      if (append) {
        setMessages(prev => [...data, ...prev]);
      } else {
        setMessages(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      setHasMore(res.data.meta?.page < res.data.meta?.pages);
    } catch { toast.error('Failed to load messages'); }
  }, [groupId]);

  // Load pinned messages
  const loadPinned = useCallback(async () => {
    try {
      const res = await api.get(`/groups/${groupId}/pinned`);
      setPinnedMessages(res.data.data || []);
    } catch {}
  }, [groupId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadGroup().catch(() => {}),
      loadMessages(1, false).catch(() => {}),
      loadPinned().catch(() => {})
    ]).finally(() => setLoading(false));

    // Load my groups for forward target
    api.get('/groups').then(res => setMyGroups(res.data.data || [])).catch(() => {});
  }, [groupId, loadGroup, loadMessages, loadPinned]);

  // Socket setup
  useEffect(() => {
    if (!socket) return;
    socket.emit('group:join', groupId);
    api.put(`/groups/${groupId}/read-all`).catch(() => {});

    const onNew = (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      // Mark read
      api.put(`/groups/messages/${msg._id}/read`).catch(() => {});
    };
    const onEdited = ({ messageId, content, editedAt }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, content, edited: true, editedAt } : m));
    };
    const onDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deleted: true, content: 'This message was deleted' } : m));
    };
    const onPinned = ({ messageId, pinned }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, pinned } : m));
      loadPinned();
    };
    const onReaction = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    };
    const onTyping = ({ userId: uid, name }) => {
      if (uid === user._id) return;
      setTypingUsers(prev => {
        if (prev.find(u => u.userId === uid)) return prev;
        return [...prev, { userId: uid, name }];
      });
    };
    const onStopTyping = ({ userId: uid }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== uid));
    };
    const onRead = ({ messageId, userId: uid }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, readBy: [...(m.readBy || []), uid] } : m));
    };
    const onOnline = ({ userId: uid }) => setOnlineMembers(prev => ({ ...prev, [uid]: true }));
    const onOffline = ({ userId: uid }) => setOnlineMembers(prev => ({ ...prev, [uid]: false }));

    socket.on('message:new', onNew);
    socket.on('message:edited', onEdited);
    socket.on('message:deleted', onDeleted);
    socket.on('message:pinned', onPinned);
    socket.on('message:reaction', onReaction);
    socket.on('chat:typing', onTyping);
    socket.on('chat:stop_typing', onStopTyping);
    socket.on('message:read', onRead);
    socket.on('user:online', onOnline);
    socket.on('user:offline', onOffline);

    return () => {
      socket.emit('group:leave', groupId);
      socket.off('message:new', onNew);
      socket.off('message:edited', onEdited);
      socket.off('message:deleted', onDeleted);
      socket.off('message:pinned', onPinned);
      socket.off('message:reaction', onReaction);
      socket.off('chat:typing', onTyping);
      socket.off('chat:stop_typing', onStopTyping);
      socket.off('message:read', onRead);
      socket.off('user:online', onOnline);
      socket.off('user:offline', onOffline);
    };
  }, [socket, groupId, user._id, loadPinned]);

  // Typing indicator
  const handleTyping = () => {
    socket?.emit('chat:typing', { groupId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit('chat:stop_typing', { groupId });
    }, 2000);
  };

  // Load more (infinite scroll)
  const handleScroll = useCallback(() => {
    if (containerRef.current?.scrollTop === 0 && hasMore && !loadingMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(nextPage, true).finally(() => setLoadingMore(false));
    }
  }, [hasMore, loadingMore, page, loadMessages]);

  const sendMsg = async () => {
    const trimmed = text.trim();
    if (!trimmed && !editingMsg) return;
    setSending(true);
    try {
      if (editingMsg) {
        await api.put(`/groups/messages/${editingMsg._id}/edit`, { content: trimmed });
        setEditingMsg(null);
      } else {
        await api.post(`/groups/${groupId}/messages`, {
          content: trimmed, type: 'text',
          replyTo: replyTo?._id || null,
        });
        setReplyTo(null);
      }
      setText('');
    } catch { toast.error('Send failed'); }
    setSending(false);
  };

  const searchMessages = async () => {
    if (!searchQ.trim()) return;
    try {
      const res = await api.get(`/groups/${groupId}/messages/search`, { params: { q: searchQ } });
      setSearchResults(res.data.data || []);
    } catch { toast.error('Search failed'); }
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setContextMenu({ msgId: msg._id, msg, x: e.clientX, y: e.clientY });
  };

  const handleReact = async (msgId, emoji) => {
    setShowEmojiFor(null);
    try { await api.post(`/groups/messages/${msgId}/react`, { emoji }); } catch {}
  };

  const handlePin = async (msgId) => {
    setContextMenu(null);
    try { await api.put(`/groups/messages/${msgId}/pin`); } catch { toast.error('Pin failed'); }
  };

  const handleDelete = async (msgId) => {
    setContextMenu(null);
    if (!window.confirm('Delete this message?')) return;
    try { await api.delete(`/groups/messages/${msgId}`); } catch { toast.error('Delete failed'); }
  };

  const handleForward = async () => {
    if (!forwardTargetGroupId) return toast.error('Select a group');
    try {
      await api.post(`/groups/messages/${forwardMsg._id}/forward`, { targetGroupId: forwardTargetGroupId });
      toast.success('Forwarded!');
      setForwardMsg(null);
      setForwardTargetGroupId('');
    } catch { toast.error('Forward failed'); }
  };

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const dateKey = formatDate(msg.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  const getReadStatus = (msg) => {
    if (msg.senderId?._id !== user._id && msg.senderId !== user._id) return null;
    const readCount = msg.readBy?.length || 0;
    const memberCount = group?.members?.length || 1;
    if (readCount >= memberCount) return 'read';
    if ((msg.deliveredTo?.length || 0) > 1) return 'delivered';
    return 'sent';
  };

  const onlineCount = group?.members?.filter(m => onlineMembers[m._id || m] === true).length || 0;

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-dark-900" onClick={() => setContextMenu(null)}>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-dark-800 border-b border-dark-700/50 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2 rounded-xl animate-fade-in" title="Go Back">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center text-sm font-bold text-white">
            {group?.name?.[0]}
          </div>
          {onlineCount > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-800" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{group?.name}</p>
          <p className="text-xs text-dark-100/50">
            {typingUsers.length > 0
              ? <span className="text-green-400 animate-pulse">{typingUsers.map(u => u.name).join(', ')} typing…</span>
              : `${group?.members?.length || 0} members${onlineCount > 0 ? ` • ${onlineCount} online` : ''}`
            }
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowPinned(!showPinned)} className="btn-ghost p-2 relative" title="Pinned messages">
            <span className="text-lg">📌</span>
            {pinnedMessages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-500 rounded-full text-xs flex items-center justify-center text-white font-bold">{pinnedMessages.length}</span>
            )}
          </button>
          <button onClick={() => { setShowSearch(!showSearch); setSearchResults([]); setSearchQ(''); }} className="btn-ghost p-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Pinned messages panel ────────────────────────────────────────────── */}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 flex-shrink-0">
          <p className="text-xs font-semibold text-yellow-400 mb-1">📌 Pinned Messages</p>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {pinnedMessages.map(pm => (
              <p key={pm._id} className="text-xs text-white truncate">{pm.content}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── Search panel ─────────────────────────────────────────────────────── */}
      {showSearch && (
        <div className="bg-dark-800 border-b border-dark-700/50 px-4 py-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              className="input text-sm flex-1 py-2"
              placeholder="Search messages…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchMessages()}
            />
            <button onClick={searchMessages} className="btn-primary py-2 px-3">Search</button>
            <button onClick={() => { setShowSearch(false); setSearchResults([]); }} className="btn-ghost p-2">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map(m => (
                <div key={m._id} className="text-xs text-dark-100/70 bg-dark-900 rounded-lg px-3 py-2">
                  <span className="text-primary-400 font-medium">{m.senderId?.name}:</span> {m.content}
                  <span className="text-dark-100/30 ml-2">{formatTime(m.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Messages area ────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        onScroll={handleScroll}
        style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(59,130,246,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(34,197,94,0.03) 0%, transparent 50%)' }}
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        )}

        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-dark-700/50" />
              <span className="text-xs text-dark-100/40 bg-dark-800 px-3 py-1 rounded-full">{date}</span>
              <div className="flex-1 h-px bg-dark-700/50" />
            </div>

            {msgs.map((msg) => {
              const isMine = (msg.senderId?._id || msg.senderId) === user._id;
              const msgType = getMessageType(msg);
              const readStatus = getReadStatus(msg);

              // Announcement style
              if (msgType === 'announcement') {
                return (
                  <div key={msg._id} className="flex justify-center my-2">
                    <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl px-4 py-2 max-w-sm text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <MegaphoneIcon className="w-3 h-3 text-primary-400" />
                        <span className="text-xs text-primary-400 font-semibold">Announcement</span>
                      </div>
                      <p className="text-sm text-white">{msg.content}</p>
                      <p className="text-xs text-dark-100/40 mt-1">{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1 group`}>
                  {/* Avatar for others */}
                  {!isMine && (
                    <div className="relative mr-2 flex-shrink-0 self-end mb-1">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sport-500 to-primary-500 flex items-center justify-center text-xs font-bold text-white">
                        {(msg.senderId?.name || 'U')[0]}
                      </div>
                    </div>
                  )}

                  <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Sender name (for group) */}
                    {!isMine && (
                      <span className="text-xs text-primary-400 font-medium mb-0.5 ml-1">{msg.senderId?.name}</span>
                    )}

                    {/* Reply preview */}
                    {msg.replyTo && !msg.deleted && (
                      <div className={`mb-1 px-3 py-1.5 rounded-t-lg border-l-2 border-primary-500 bg-dark-900/80 text-xs max-w-full ${isMine ? 'self-end' : 'self-start'}`}>
                        <p className="text-primary-400 font-medium truncate">{msg.replyTo.senderId?.name}</p>
                        <p className="text-dark-100/60 truncate">{msg.replyTo.content}</p>
                      </div>
                    )}

                    {/* Forwarded label */}
                    {msg.forwardedFrom && (
                      <div className={`text-xs text-dark-100/40 flex items-center gap-1 mb-0.5 ${isMine ? 'self-end' : 'self-start'}`}>
                        <ArrowRightIcon className="w-3 h-3" /> Forwarded
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`relative rounded-2xl px-3 py-2 shadow-sm cursor-pointer select-none
                        ${msg.deleted ? 'opacity-50 italic' : ''}
                        ${isMine
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-dark-700 text-white rounded-bl-sm'
                        }
                        ${msg.pinned ? 'ring-1 ring-yellow-500/50' : ''}
                      `}
                      onContextMenu={(e) => !msg.deleted && handleContextMenu(e, msg)}
                      onDoubleClick={() => !msg.deleted && setReplyTo(msg)}
                    >
                      {msg.deleted ? (
                        <p className="text-sm text-dark-100/50 italic">🚫 This message was deleted</p>
                      ) : (
                        <>
                          {/* Media content */}
                          {(msgType === 'image') && msg.mediaUrl && (
                            <img src={msg.mediaUrl} alt="img" className="rounded-xl max-w-full mb-1 max-h-48 object-cover" />
                          )}
                          {msgType === 'document' && msg.mediaUrl && (
                            <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-dark-900/50 rounded-lg px-2 py-1.5 mb-1 text-xs hover:bg-dark-900">
                              <DocumentIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{msg.mediaName || 'Document'}</span>
                            </a>
                          )}
                          {(msgType === 'voice' || msgType === 'audio') && msg.mediaUrl && (
                            <div className="flex items-center gap-2 mb-1">
                              <SpeakerWaveIcon className="w-4 h-4 flex-shrink-0" />
                              <audio controls className="h-8 w-40 max-w-full" src={msg.mediaUrl} />
                            </div>
                          )}
                          {/* Text */}
                          {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}

                          {/* Edited indicator */}
                          {msg.edited && <span className="text-xs opacity-50 ml-1">(edited)</span>}
                        </>
                      )}

                      {/* Time + read status */}
                      <div className={`flex items-center gap-1 mt-0.5 justify-end`}>
                        <span className={`text-xs opacity-50`}>{formatTime(msg.createdAt)}</span>
                        {isMine && !msg.deleted && (
                          readStatus === 'read' ? <CheckCircleSolid className="w-3.5 h-3.5 text-blue-300" /> :
                          readStatus === 'delivered' ? <CheckCircleIcon className="w-3.5 h-3.5 opacity-60" /> :
                          <CheckIcon className="w-3.5 h-3.5 opacity-60" />
                        )}
                      </div>

                      {/* Pinned icon */}
                      {msg.pinned && (
                        <span className="absolute -top-2 -right-2 text-xs">📌</span>
                      )}
                    </div>

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={`flex flex-wrap gap-0.5 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(
                          msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(msg._id, emoji)}
                            className="text-xs bg-dark-700 border border-dark-600 rounded-full px-1.5 py-0.5 hover:bg-dark-600"
                          >
                            {emoji} {count > 1 ? count : ''}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick emoji bar on hover */}
                    {!msg.deleted && (
                      <div className={`hidden group-hover:flex items-center gap-0.5 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {EMOJI_LIST.slice(0, 5).map(e => (
                          <button key={e} onClick={() => handleReact(msg._id, e)}
                            className="text-xs hover:scale-125 transition-transform">{e}</button>
                        ))}
                        <button onClick={() => setShowEmojiFor(msg._id)} className="text-xs text-dark-100/50 hover:text-white">
                          <FaceSmileIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                          className="text-dark-100/50 hover:text-white ml-1">
                          <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Full emoji picker */}
                    {showEmojiFor === msg._id && (
                      <div className={`flex flex-wrap gap-1 bg-dark-700 border border-dark-600 rounded-xl p-2 mt-1 max-w-48 z-10 ${isMine ? 'self-end' : 'self-start'}`}>
                        {EMOJI_LIST.map(e => (
                          <button key={e} onClick={() => handleReact(msg._id, e)} className="text-lg hover:scale-110 transition-transform">{e}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-end gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-dark-600 flex items-center justify-center text-xs">
              {typingUsers[0]?.name?.[0]}
            </div>
            <div className="bg-dark-700 rounded-2xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Context menu ─────────────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-dark-700 border border-dark-600 rounded-xl shadow-xl py-1 min-w-40"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 180) }}
          onClick={e => e.stopPropagation()}
        >
          {[
            { label: 'Reply', icon: ArrowUturnLeftIcon, action: () => { setReplyTo(contextMenu.msg); setContextMenu(null); inputRef.current?.focus(); } },
            { label: 'Forward', icon: ArrowRightIcon, action: () => { setForwardMsg(contextMenu.msg); setContextMenu(null); } },
            { label: contextMenu.msg?.pinned ? 'Unpin' : 'Pin', icon: () => <span>📌</span>, action: () => handlePin(contextMenu.msgId) },
            ...(contextMenu.msg?.senderId?._id === user._id || contextMenu.msg?.senderId === user._id ? [
              { label: 'Edit', icon: () => <span>✏️</span>, action: () => { setEditingMsg(contextMenu.msg); setText(contextMenu.msg.content); setContextMenu(null); inputRef.current?.focus(); } },
              { label: 'Delete', icon: XMarkIcon, action: () => handleDelete(contextMenu.msgId), danger: true },
            ] : []),
          ].map(({ label, icon: Icon, action, danger }) => (
            <button
              key={label}
              onClick={action}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-dark-600 transition-colors ${danger ? 'text-red-400' : 'text-white'}`}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Forward modal ─────────────────────────────────────────────────────── */}
      {forwardMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-dark-800 rounded-2xl p-6 w-80 space-y-4">
            <h3 className="font-semibold text-white">Forward Message</h3>
            <div className="bg-dark-700 rounded-xl px-3 py-2 text-sm text-dark-100/70 truncate">{forwardMsg.content}</div>
            <div>
              <label className="label">Select group</label>
              <select className="input" value={forwardTargetGroupId} onChange={e => setForwardTargetGroupId(e.target.value)}>
                <option value="">Choose…</option>
                {myGroups.filter(g => g._id !== groupId).map(g => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleForward} className="btn-primary flex-1">Forward</button>
              <button onClick={() => setForwardMsg(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reply / Edit banner ───────────────────────────────────────────────── */}
      {(replyTo || editingMsg) && (
        <div className="flex items-center gap-3 px-4 py-2 bg-dark-800/80 border-t border-dark-700/30 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary-400 font-semibold">{editingMsg ? '✏️ Editing' : `↩ Replying to ${replyTo?.senderId?.name || 'message'}`}</p>
            <p className="text-xs text-dark-100/60 truncate">{editingMsg?.content || replyTo?.content}</p>
          </div>
          <button onClick={() => { setReplyTo(null); setEditingMsg(null); setText(''); }} className="btn-ghost p-1">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Input bar ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-dark-800 border-t border-dark-700/50 flex items-end gap-2 flex-shrink-0">
        <div className="flex-1 flex items-end bg-dark-700/70 border border-dark-600 rounded-2xl px-3 py-2 gap-2">
          <textarea
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-white placeholder-dark-100/40 resize-none outline-none max-h-32 min-h-[24px]"
            placeholder={editingMsg ? 'Edit message…' : 'Type a message…'}
            value={text}
            onChange={e => { setText(e.target.value); handleTyping(); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
            rows={1}
            style={{ height: `${Math.min(128, 24 + (text.split('\n').length - 1) * 20)}px` }}
          />
          <button onClick={() => setShowEmojiFor(showEmojiFor ? null : 'input')} className="text-dark-100/50 hover:text-yellow-400 transition-colors flex-shrink-0">
            <FaceSmileIcon className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={sendMsg}
          disabled={sending || !text.trim()}
          className="btn-primary p-3 rounded-2xl flex-shrink-0 disabled:opacity-50"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>

      {/* ── Emoji picker for input ───────────────────────────────────────────── */}
      {showEmojiFor === 'input' && (
        <div className="absolute bottom-20 right-16 z-40 bg-dark-700 border border-dark-600 rounded-2xl p-3 shadow-xl">
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_LIST.map(e => (
              <button key={e} onClick={() => { setText(prev => prev + e); setShowEmojiFor(null); }} className="text-xl hover:scale-125 transition-transform">{e}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
