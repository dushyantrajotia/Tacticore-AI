import { useState, useRef, useEffect } from 'react';
import socket from '../../services/socket';
import SvgIcon from '../SvgIcon';

export default function ChatPanel({ roomId = '', user }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'System', message: 'Group channel is active. Discuss your plan here.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'system', chestNo: null },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const chestNo = user?.chestNo || null;
  const senderName = chestNo ? `${chestNo} - ${user?.name || ''}` : (user?.name || 'Instructor');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on('message', handleMessage);
    return () => { socket.off('message', handleMessage); };
  }, []);

  const handleSend = () => {
    if (input.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: senderName,
        chestNo,
        userId: user?._id,
        message: input,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: user?.role === 'accessor' ? 'instructor' : 'user',
        roomId
      };

      socket.emit('message', newMessage);
      setInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0.5rem', background: 'transparent' }}>
      <div style={{ borderBottom: '1px solid var(--gray-800)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <SvgIcon name="chat" size="0.9rem" /> Group Discussion
        </h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
        {messages.map(msg => {
          const isMe = msg.userId === user?._id;
          const isSystem = msg.type === 'system';
          const isInstructor = msg.type === 'instructor';

          return (
            <div key={msg.id} style={{ display: 'flex', gap: '0.4rem', flexDirection: isMe ? 'row-reverse' : 'row' }}>
              {/* Avatar */}
              <div style={{
                width: '1.5rem', height: '1.5rem', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem',
                background: isSystem ? 'var(--gray-700)' : isInstructor ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, var(--primary), #1d4ed8)',
                color: 'white', fontWeight: 'bold'
              }}>
                {isSystem ? <SvgIcon name="briefing" size="0.85rem" color="white" /> : isInstructor ? <SvgIcon name="instructor" size="0.85rem" color="white" /> : (msg.chestNo || '?')}
              </div>
              {/* Message */}
              <div style={{ flex: 1, textAlign: isMe ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block', padding: '0.3rem 0.5rem', borderRadius: '0.3rem', maxWidth: '90%',
                  background: isSystem ? 'var(--gray-800)' : isInstructor ? 'rgba(245,158,11,0.15)' : isMe ? 'var(--primary)' : 'var(--gray-800)',
                  color: isInstructor ? 'var(--warning)' : 'white', textAlign: 'left',
                  border: isInstructor ? '1px solid rgba(245,158,11,0.3)' : 'none'
                }}>
                  <p style={{ fontSize: '0.75rem', margin: 0, lineHeight: 1.4 }}>{msg.message}</p>
                </div>
                <p style={{ fontSize: '0.55rem', color: 'var(--gray-600)', marginTop: '0.15rem' }}>
                  {msg.sender} · {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="input"
          style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
        />
        <button onClick={handleSend} className="btn btn-primary btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Send</button>
      </div>
    </div>
  );
}
