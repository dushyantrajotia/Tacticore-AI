// ═══════════════════════════════════════════════════════════════
// Scenario Map Templates — Hardcoded Image Version
// ═══════════════════════════════════════════════════════════════

const SCENARIO_TEMPLATES = {

  mohi_firing_range: {
    id: 'mohi_firing_range',
    name: 'Mohi Firing Range',
    description: 'A group of 6 Army personnel are starting their journey from Malleswar Camp (Bottom-Left) and must reach the Mohi Firing Range (Top-Right).',
    difficulty: 'hard',
    thumbnail: '🏞🎯',
    terrain: '#7db952', 
    bgImage: '/assets/mohi_map.png', 
    elements: [
      { type: 'label', x: 250, y: 40, text: 'SCALE - 2CM = 1KM', color: '#111', size: 14 },
      { type: 'start_point', x: 60, y: 520, label: 'Malleswar Camp' },
      { type: 'end_point', x: 740, y: 100, label: 'Mohi Range' },
      { type: 'building', x: 350, y: 130, label: 'School' },
      { type: 'village', x: 220, y: 130, label: 'Kasol' },
      { type: 'boat', x: 80, y: 220, label: 'Coast Guard' },
      { type: 'bridge', x1: 480, y1: 260, label: 'Culvert' },
      { type: 'tree_pine', x: 280, y: 110 },
      { type: 'tree_pine', x: 250, y: 140 },
      { type: 'tree_palm', x: 180, y: 210 },
      { type: 'tree_palm', x: 270, y: 230 },
      { type: 'tree_palm', x: 400, y: 220 },
      { type: 'tree_palm', x: 420, y: 350 },
      { type: 'poi', icon: '🆘', x: 600, y: 220, label: 'Injured Person', labelColor: '#ef4444' },
      { type: 'threat', icon: '💣', x: 470, y: 80, label: 'Bomb Threat', labelColor: '#ef4444' }
    ],
    legend: [
      { color: '#ef4444', label: 'Emergency' },
      { color: '#22c55e', label: 'Start Point' },
      { color: '#3b82f6', label: 'Destination' }
    ],
    defaultResources: { volunteers: 6, customItems: [{ name: 'Military Truck', quantity: 1 }] },
    problems: [
      { description: 'Hospitalize injured person.', priority: 'critical' },
      { description: 'Stop bomb at 1130 hrs.', priority: 'critical' }
    ]
  },

  badli_creek: {
    id: 'badli_creek',
    name: 'Badli Creek Emergency',
    description: 'A group of students from Ratanpur college are returning from a championship victory. At a petrol pump, they find an attendant beaten and learn of a drug exchange at the Rock, sabotaged railway tracks, and a threat to a police informer at the ferry. Time is 5:30 PM, and celebrations start at 7:30 PM.',
    difficulty: 'hard',
    thumbnail: '🌊🚂',
    terrain: '#d2b48c',
    bgImage: '/assets/badli_creek.png',
    elements: [
      { type: 'label', x: 400, y: 30, text: 'Scale - 10CM = 1KM', color: '#111', size: 14 },
      { type: 'start_point', x: 700, y: 150, label: 'Petrol Pump' },
      { type: 'end_point', x: 850, y: 50, label: 'Ratanpur College' },
      { type: 'threat', icon: '💊', x: 300, y: 150, label: 'Drug Exchange (6:45 PM)', labelColor: '#ef4444' },
      { type: 'threat', icon: '🛤', x: 420, y: 520, label: 'Broken Tracks (Train 6:30 PM)', labelColor: '#ef4444' },
      { type: 'threat', icon: '🆘', x: 860, y: 480, label: 'Informer at Ferry', labelColor: '#ef4444' }
    ],
    legend: [
      { color: '#ef4444', label: 'Emergency' },
      { color: '#22c55e', label: 'Start Point' },
      { color: '#3b82f6', label: 'Destination' }
    ],
    defaultResources: { volunteers: 10, customItems: [{ name: 'Mini-Bus', quantity: 1 }] },
    problems: [
      { description: 'Secure railway tracks by 6:30 PM.', priority: 'critical' },
      { description: 'Intercept drug exchange at 6:45 PM.', priority: 'critical' },
      { description: 'Protect police informer at ferry.', priority: 'critical' }
    ]
  },

  jungle_mine: {
    id: 'jungle_mine',
    name: 'Jungle Mine & Terrorist Threat',
    description: '8 students boating at Point A discover multiple crises: a road mine targeting the Chief Minister, removed fishplates on the railway, a tigress attack in the jungle, a fire in Mandwa, and a fall into a well. Time is running out before the 1600 hrs train and the CM\'s arrival.',
    difficulty: 'hard',
    thumbnail: '🌲💣',
    terrain: '#4ade80',
    bgImage: '/assets/jungle_mine.png',
    elements: [
      { type: 'label', x: 400, y: 30, text: 'Scale - 6CM = 2KM', color: '#111', size: 14 },
      { type: 'start_point', x: 400, y: 520, label: 'Point A (Riverside)' },
      { type: 'end_point', x: 100, y: 150, label: 'Almora Village' },
      { type: 'threat', icon: '🛤', x: 300, y: 350, label: 'Fishplate Removed', labelColor: '#ef4444' },
      { type: 'threat', icon: '💣', x: 550, y: 400, label: 'Road Mine (CM in 1hr)', labelColor: '#ef4444' },
      { type: 'threat', icon: '🐅', x: 350, y: 150, label: 'Tigress Attack', labelColor: '#ef4444' },
      { type: 'fire', icon: '🔥', x: 700, y: 150, label: 'Haystack Fire', labelColor: '#ef4444' },
      { type: 'poi', icon: '🆘', x: 150, y: 450, label: 'Police Post (Dilnagar)', labelColor: '#3b82f6' }
    ],
    legend: [
      { color: '#ef4444', label: 'Terrorist/Emergency' },
      { color: '#3b82f6', label: 'Authority' },
      { color: '#22c55e', label: 'Start Point' }
    ],
    defaultResources: { volunteers: 8, customItems: [{ name: 'Jeep', quantity: 1 }, { name: 'Motorboat', quantity: 1 }] },
    problems: [
      { description: 'Disable road mine before Chief Minister arrives.', priority: 'critical' },
      { description: 'Alert railway about fishplate before 1600 hrs.', priority: 'critical' },
      { description: 'Rescue girls from tigress attack.', priority: 'critical' }
    ]
  }

};

export default SCENARIO_TEMPLATES;
