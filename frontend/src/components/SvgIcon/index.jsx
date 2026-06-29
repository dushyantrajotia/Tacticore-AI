import React from 'react';

const iconMap = {
  // Theme
  'sun': (
    <g>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </g>
  ),
  'moon': (
    <g>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </g>
  ),
  // Dashboard & Accessor
  'dashboard': (
    <g>
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-2-2-4 4" />
    </g>
  ),
  'instructor': (
    <g>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </g>
  ),
  'cadet': (
    <g>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </g>
  ),
  'teacher': (
    <g>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </g>
  ),
  // Statuses & Actions
  'loading': (
    <g>
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </g>
  ),
  'rocket': (
    <g>
      <path d="M4.5 16.5c-1.5 1.5-2.5 3.5-2.5 5.5C4 22 6 21 7.5 19.5" />
      <path d="M12 2C7.5 5.5 6 11.5 7.5 16.5" />
      <path d="M16.5 7.5C11.5 6 5.5 7.5 2 12" />
      <path d="M12 2c4.5 3.5 6 9.5 4.5 14.5" />
      <path d="M16.5 7.5c5-1.5 11-3 14.5.5C31.5 11.5 30 17.5 25 22.5L20 17.5l-5 5-2.5-5.5z" />
    </g>
  ),
  'success': (
    <g>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </g>
  ),
  'check': (
    <g>
      <polyline points="20 6 9 17 4 12" />
    </g>
  ),
  'cross': (
    <g>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </g>
  ),
  'timer': (
    <g>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </g>
  ),
  'flag': (
    <g>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </g>
  ),
  'briefing': (
    <g>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </g>
  ),
  'warning': (
    <g>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </g>
  ),
  'pause': (
    <g>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </g>
  ),
  'play': (
    <g>
      <polygon points="5 3 19 12 5 21 5 3" />
    </g>
  ),
  'eye': (
    <g>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  'pencil': (
    <g>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </g>
  ),
  'chat': (
    <g>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </g>
  ),
  'lock': (
    <g>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </g>
  ),
  'unlock': (
    <g>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </g>
  ),
  'settings': (
    <g>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </g>
  ),
  'user': (
    <g>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </g>
  ),
  'star': (
    <g>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </g>
  ),
  'house': (
    <g>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </g>
  ),
  'fire': (
    <g>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </g>
  ),
  'tracks': (
    <g>
      <line x1="4" y1="3" x2="4" y2="21" />
      <line x1="20" y1="3" x2="20" y2="21" />
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </g>
  ),
  'school': (
    <g>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </g>
  ),
  'building': (
    <g>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="16" />
      <line x1="15" y1="22" x2="15" y2="16" />
      <rect x="8" y="6" width="2" height="2" />
      <rect x="14" y="6" width="2" height="2" />
      <rect x="8" y="11" width="2" height="2" />
      <rect x="14" y="11" width="2" height="2" />
    </g>
  ),
  'bridge': (
    <g>
      <path d="M2 15s4-4 10-4 10 4 10 4M2 19h20" />
      <line x1="6" y1="14" x2="6" y2="19" />
      <line x1="12" y1="11" x2="12" y2="19" />
      <line x1="18" y1="14" x2="18" y2="19" />
    </g>
  ),
  'next': (
    <g>
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </g>
  ),
  'reset': (
    <g>
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="5" x2="5" y2="19" />
    </g>
  ),
  'prev': (
    <g>
      <polygon points="19 4 9 12 19 20 19 4" />
      <line x1="5" y1="5" x2="5" y2="19" />
    </g>
  ),
  'plus': (
    <g>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </g>
  ),
  'minus': (
    <g>
      <line x1="5" y1="12" x2="19" y2="12" />
    </g>
  ),
  'sync': (
    <g>
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </g>
  ),
  'undo': (
    <g>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </g>
  ),
  'trash': (
    <g>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </g>
  ),
  'mailbox': (
    <g>
      <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7c0 3.3 2.7 6 6 6h8c3.3 0 6-2.7 6-6z" />
      <path d="M2 8l10 5 10-5" />
      <line x1="12" y1="13" x2="12" y2="19" />
    </g>
  ),
  'upload': (
    <g>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </g>
  ),
  'download': (
    <g>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </g>
  ),
  'alarm-clock': (
    <g>
      <circle cx="12" cy="13" r="8" />
      <polyline points="12 9 12 13 15 15" />
      <path d="M5 3L2 6M19 3l3 6M12 21v2" />
    </g>
  ),
  'users': (
    <g>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </g>
  ),
  'sos': (
    <g>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="19.07" y1="4.93" x2="14.83" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="9.17" y1="14.83" x2="4.93" y2="19.07" />
    </g>
  ),
  'bomb': (
    <g>
      <circle cx="11" cy="13" r="8" />
      <path d="M16 8l3-3M20 2l-2 2M18 3h3v3" />
    </g>
  ),
  'tiger': (
    <g>
      <circle cx="12" cy="13" r="4" />
      <circle cx="7" cy="8" r="2" />
      <circle cx="11" cy="6" r="2" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="19" cy="8" r="2" />
    </g>
  ),
  'drugs': (
    <rect x="3" y="11" width="18" height="6" rx="3" transform="rotate(-45 12 12)" />
  ),
  'helicopter': (
    <g>
      <path d="M3 10h16a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H8a5 5 0 0 1-5-5v-3z" />
      <line x1="12" y1="10" x2="12" y2="6" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="10" y1="18" x2="10" y2="21" />
      <line x1="15" y1="18" x2="15" y2="21" />
      <line x1="8" y1="21" x2="18" y2="21" />
    </g>
  ),
  'boat': (
    <g>
      <path d="M2 15l3 5h14l3-5H2z" />
      <line x1="12" y1="15" x2="12" y2="5" />
      <polygon points="12 5 18 8 12 11" />
    </g>
  ),
  'train': (
    <g>
      <rect x="4" y="3" width="16" height="15" rx="2" />
      <rect x="6" y="6" width="12" height="6" />
      <circle cx="8" cy="20" r="1.5" />
      <circle cx="16" cy="20" r="1.5" />
      <line x1="4" y1="15" x2="20" y2="15" />
    </g>
  ),
  'jet': (
    <g>
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </g>
  ),
  'jeep': (
    <g>
      <rect x="3" y="9" width="18" height="7" rx="1" />
      <path d="M5 9l2-5h10l2 5" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </g>
  ),
  'fireTruck': (
    <g>
      <rect x="2" y="6" width="14" height="10" />
      <rect x="16" y="9" width="6" height="7" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <line x1="2" y1="12" x2="16" y2="12" />
      <path d="M8 6V4h3v2" />
    </g>
  ),
  'volunteer': (
    <g>
      <path d="M18 21v-2a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="11" r="3" />
      <path d="M8 10h8" />
      <path d="M9 10a3 3 0 0 1 6 0" />
      <line x1="12" y1="7" x2="12" y2="10" />
    </g>
  ),
  'waterPump': (
    <g>
      <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
    </g>
  ),
  'ambulance': (
    <g>
      <rect x="2" y="6" width="13" height="10" />
      <rect x="15" y="9" width="7" height="7" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <line x1="9" y1="8" x2="9" y2="14" />
      <line x1="6" y1="11" x2="12" y2="11" />
    </g>
  ),
  'policeCar': (
    <g>
      <path d="M18 8h-4L11 5H5L2 8v6h20V8z" />
      <circle cx="6" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
      <rect x="12" y="3" width="2" height="2" />
    </g>
  ),
  'citizen': (
    <g>
      <circle cx="12" cy="4" r="2" />
      <path d="M18 22l-4-6-2 2v4M6 22l4-8v-3l-2-2" />
      <line x1="10" y1="8" x2="15" y2="13" />
    </g>
  ),
  'car': (
    <g>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </g>
  ),
  'bike': (
    <g>
      <circle cx="5" cy="18" r="3" />
      <circle cx="19" cy="18" r="3" />
      <polyline points="12 10 16 18 19 18" />
      <polyline points="5 18 9 10 12 10" />
      <line x1="9" y1="10" x2="5" y2="7" />
      <line x1="12" y1="10" x2="12" y2="6" />
      <line x1="10" y1="6" x2="14" y2="6" />
    </g>
  ),
  'custom': (
    <g>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="12" y1="21" x2="12" y2="8" />
      <polyline points="8 8 12 12 16 8" />
    </g>
  ),
  'crosshair': (
    <g>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  'medical': (
    <g>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </g>
  ),
  'dog': (
    <g>
      <path d="M12 14c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z" />
      <path d="M18 10h-2V8a4 4 0 0 0-8 0v2H6a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3z" />
    </g>
  ),
  'presentation-board': (
    <g>
      <rect x="3" y="3" width="18" height="12" rx="2" />
      <line x1="12" y1="15" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </g>
  ),
  'landscape': (
    <g>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <polygon points="21 15 16 10 5 21 21 21" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </g>
  ),
  'waves': (
    <g>
      <path d="M2 6c4-2 6 2 10 0s6-2 10 0" />
      <path d="M2 12c4-2 6 2 10 0s6-2 10 0" />
      <path d="M2 18c4-2 6 2 10 0s6-2 10 0" />
    </g>
  ),
  'trees': (
    <g>
      <path d="M12 2L8 8h3v6h2V8h3z" />
      <path d="M6 8l-3 4h2.5v5h1V12H9z" />
      <path d="M18 8l-3 4h2.5v5h1V12H21z" />
    </g>
  ),
  'mountain': (
    <g>
      <polygon points="3 20 9 6 13 13 18 4 22 20 3 20" />
    </g>
  ),
  'weather': (
    <g>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
    </g>
  ),
  'brain': (
    <g>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.9-1c0-.7-.7-1.3-1.4-1.3a2.5 2.5 0 0 1-1.7-4.2A2.5 2.5 0 0 1 2 9.5a2.5 2.5 0 0 1 5-2.5V4.5A2.5 2.5 0 0 1 9.5 2z" />
      <path d="M14.5 2a2.5 2.5 0 0 1 2.5 2.5v2.5a2.5 2.5 0 0 1 5 2.5 2.5 2.5 0 0 1-2 3.5 2.5 2.5 0 0 1-1.7 4.2c-.7 0-1.4.6-1.4 1.3a2.5 2.5 0 0 1-4.9 1v-15a2.5 2.5 0 0 1 2.5-2.5z" />
    </g>
  ),
  'users-active': (
    <g>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </g>
  ),
  'handshake': (
    <g>
      <path d="M18 8h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h4a2 2 0 0 0 2-2V9a1 1 0 0 0-1-1z" />
      <path d="M6 8h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1z" />
      <path d="M12 10V6M9 6h6M11 16h2M10 18h4" />
    </g>
  ),
  'microphone': (
    <g>
      <rect x="9" y="2" width="6" height="12" rx="3" ry="3" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
    </g>
  ),
  'question': (
    <g>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="1.5" />
      <circle cx="12" cy="12" r="10" />
    </g>
  ),
  'pin': (
    <g>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </g>
  ),
  'robot': (
    <g>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
      <path d="M9 11V9h6v2M12 9V5" />
      <circle cx="12" cy="4" r="1" />
    </g>
  ),
  'eject': (
    <g>
      <polygon points="12 2 2 12 22 12 12 2" />
      <rect x="2" y="16" width="20" height="4" rx="1" />
    </g>
  ),

  // Direct Emoji Mapping (for backward compatibility and scenario template rendering)
  '☀': 'sun',
  '🌙': 'moon',
  '📊': 'dashboard',
  '👨‍✈': 'instructor',
  '🎖': 'cadet',
  '⏳': 'loading',
  '🚀': 'rocket',
  '✅': 'success',
  '⏱': 'timer',
  '🏁': 'flag',
  '📋': 'briefing',
  '🚒': 'fireTruck',
  '👷': 'volunteer',
  '💧': 'waterPump',
  '🚑': 'ambulance',
  '🚓': 'policeCar',
  '🚶': 'citizen',
  '🚗': 'car',
  '🚲': 'bike',
  '📦': 'custom',
  '⚠': 'warning',
  '⏸': 'pause',
  '▶': 'play',
  '👁': 'eye',
  '✏': 'pencil',
  '💬': 'chat',
  '🔒': 'lock',
  '🔓': 'unlock',
  '⚙️': 'settings',
  '⚙': 'settings',
  '👤': 'user',
  '⭐': 'star',
  '★': 'star',
  '🏠': 'house',
  '🔥': 'fire',
  '🛤': 'tracks',
  '🏫': 'school',
  '🏢': 'building',
  '🌉': 'bridge',
  '⏭': 'next',
  '⏮': 'reset',
  '◀': 'prev',
  '✕': 'close',
  '➕': 'plus',
  '➖': 'minus',
  '🔄': 'sync',
  '↩': 'undo',
  '🗑': 'trash',
  '📭': 'mailbox',
  '📤': 'upload',
  '📥': 'download',
  '✓': 'check',
  '✗': 'cross',
  '⏰': 'alarm-clock',
  '👥': 'users',
  '🆘': 'sos',
  '💣': 'bomb',
  '🐅': 'tiger',
  '💊': 'drugs',
  '🚁': 'helicopter',
  '✈️': 'jet',
  '✈': 'jet',
  '🚤': 'boat',
  '🚂': 'train',
  '🚙': 'jeep',
  '🚚': 'truck',
  '🚌': 'bus',
  '🛡️': 'shield',
  '🛡': 'shield',
  '🔫': 'crosshair',
  '⚕️': 'medical',
  '⚕': 'medical',
  '🐕': 'dog',
  '⏏': 'eject',
  '👨‍🏫': 'teacher',
  '🏞🎯': 'landscape',
  '🌊🚂': 'waves',
  '🌲💣': 'trees',
  '🏔': 'mountain',
  '🌦': 'weather',
  '🧠': 'brain',
  '🗣': 'users-active',
  '🤝': 'handshake',
  '🎤': 'microphone',
  '❓': 'question',
  '📍': 'pin',
  '🤖': 'robot'
};

function resolveCustomName(name) {
  if (!name) return 'custom';
  const n = name.toLowerCase();
  if (n.includes('jet') || n.includes('plane') || n.includes('aircraft') || n.includes('fighter')) return 'jet';
  if (n.includes('chopper') || n.includes('heli') || n.includes('helicopter')) return 'helicopter';
  if (n.includes('boat') || n.includes('ship') || n.includes('ferry') || n.includes('motorboat')) return 'boat';
  if (n.includes('train')) return 'train';
  if (n.includes('car') || n.includes('jeep')) return 'jeep';
  if (n.includes('truck')) return 'truck';
  if (n.includes('bus')) return 'bus';
  if (n.includes('tank')) return 'shield';
  if (n.includes('gun') || n.includes('weapon') || n.includes('rifle')) return 'crosshair';
  if (n.includes('medic') || n.includes('doctor') || n.includes('medical')) return 'medical';
  if (n.includes('dog') || n.includes('k9')) return 'dog';
  if (n.includes('bomb') || n.includes('explosive')) return 'bomb';
  return 'custom';
}

export default function SvgIcon({ name, size = '1em', color = 'currentColor', x, y, className, style = {}, ...props }) {
  if (!name) return null;

  // Resolve indirect emoji mappings
  let resolvedName = name;
  if (iconMap[name] && typeof iconMap[name] === 'string') {
    resolvedName = iconMap[name];
  }

  let iconContent = iconMap[resolvedName];
  if (!iconContent || typeof iconContent === 'string') {
    // Try to resolve custom resource name string matching
    const fallbackKey = resolveCustomName(name);
    iconContent = iconMap[fallbackKey];
  }

  if (!iconContent || typeof iconContent === 'string') {
    return null; // Fallback or unmapped icon
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      x={x}
      y={y}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      {...props}
    >
      {iconContent}
    </svg>
  );
}
