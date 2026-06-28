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
      { type: 'zone', x: 0, y: 350, w: 450, h: 200, fill: '#3b82f6', label: 'Lake' },
      { type: 'road', x1: 430, y1: 0, x2: 750, y2: 550, width: 35 },
      { type: 'road', x1: 250, y1: 130, x2: 480, y2: 260, width: 18 },
      { type: 'road', x1: 480, y1: 260, x2: 700, y2: 220, width: 18 },
      { type: 'road', x1: 250, y1: 130, x2: 90, y2: 220, width: 18 },

      { type: 'start_point', x: 60, y: 520, label: 'Malleswar Camp' },
      { type: 'track', x1: 90, y1: 220, x2: 60, y2: 520 },
      { type: 'end_point', x: 740, y: 100, label: 'Mohi Range' },
      { type: 'building', x: 350, y: 130, label: 'School' },
      { type: 'village', x: 220, y: 130, label: 'Kasol' },
      { type: 'track', x1: 220, y1: 130, x2: 250, y2: 130 },
      { type: 'boat', x: 80, y: 220, label: 'Coast Guard' },
      { type: 'bridge', x1: 480, y1: 260, label: 'Culvert' },
      { type: 'compass', x: 720, y: 500 },
      { type: 'tree_pine', x: 280, y: 110 },
      { type: 'tree_pine', x: 250, y: 140 },
      { type: 'tree_pine', x: 180, y: 60 },
      { type: 'tree_pine', x: 200, y: 50 },
      { type: 'tree_pine', x: 160, y: 80 },
      { type: 'tree_pine', x: 220, y: 70 },
      { type: 'tree_pine', x: 140, y: 100 },
      { type: 'tree_pine', x: 100, y: 120 },
      { type: 'tree_pine', x: 300, y: 70 },
      { type: 'tree_pine', x: 330, y: 50 },
      
      { type: 'tree_palm', x: 180, y: 210 },
      { type: 'tree_palm', x: 270, y: 230 },
      { type: 'tree_palm', x: 400, y: 220 },
      { type: 'tree_palm', x: 420, y: 350 },
      { type: 'tree_palm', x: 460, y: 400 },
      { type: 'tree_palm', x: 480, y: 430 },
      { type: 'tree_palm', x: 500, y: 450 },
      { type: 'tree_palm', x: 520, y: 480 },
      { type: 'tree_palm', x: 490, y: 510 },
      { type: 'tree_palm', x: 470, y: 460 },
      { type: 'tree_palm', x: 530, y: 440 },
      { type: 'tree_palm', x: 510, y: 410 },
      { type: 'tree_palm', x: 450, y: 380 },

      { type: 'house', x: 180, y: 130 },
      { type: 'house', x: 160, y: 150 },
      { type: 'house', x: 200, y: 160 },
      { type: 'house', x: 240, y: 180 },
      { type: 'house', x: 280, y: 180 },
      
      { type: 'tree_pine', x: 500, y: 150 },
      { type: 'tree_pine', x: 550, y: 120 },
      { type: 'tree_pine', x: 650, y: 180 },
      { type: 'tree_pine', x: 700, y: 150 },
      { type: 'tree_pine', x: 620, y: 80 },
      { type: 'tree_pine', x: 580, y: 50 },
      { type: 'tree_pine', x: 750, y: 200 },
      
      { type: 'tree_palm', x: 500, y: 350 },
      { type: 'tree_palm', x: 550, y: 320 },
      { type: 'tree_palm', x: 600, y: 380 },
      { type: 'tree_palm', x: 650, y: 350 },
      { type: 'tree_palm', x: 700, y: 400 },
      { type: 'tree_palm', x: 750, y: 380 },
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
      { type: 'label', x: 250, y: 30, text: 'Scale - 10CM = 1KM', color: '#111', size: 14 },
      
      // Sea (Left area) & Badli Creek (Middle horizontal)
      { type: 'zone', x: 0, y: 0, w: 350, h: 550, fill: '#3b82f6', label: 'Sea' },
      { type: 'zone', x: 350, y: 240, w: 450, h: 90, fill: '#3b82f6', label: 'Badli Creek' },

      // Railway Track (Vertical)
      { type: 'railway', x1: 420, y1: 0, x2: 420, y2: 550 },
      // Main Highway (Vertical)
      { type: 'road', x1: 530, y1: 0, x2: 530, y2: 550, width: 35 },
      
      // Connecting Roads
      { type: 'road', x1: 530, y1: 150, x2: 800, y2: 50, width: 22 }, // To Ratanpur College
      { type: 'road', x1: 530, y1: 150, x2: 350, y2: 120, width: 16 }, // Dirt path to Rock
      { type: 'road', x1: 530, y1: 450, x2: 750, y2: 400, width: 18 }, // Path to Badli Village

      // Bridges
      { type: 'bridge', x: 420, y: 285 }, // Railway bridge
      { type: 'bridge', x: 530, y: 285 }, // Highway bridge

      // Badli Village Area
      { type: 'village', x: 750, y: 450, label: 'Badli' },
      { type: 'house', x: 700, y: 420 },
      { type: 'house', x: 780, y: 480 },
      { type: 'house', x: 670, y: 460 },

      // Boats
      { type: 'boat', x: 280, y: 450, label: 'Coast Guard' },
      { type: 'boat', x: 700, y: 350, label: 'Ferry' },

      // Compass
      { type: 'compass', x: 80, y: 80 },

      // Vegetation / Trees
      { type: 'tree_pine', x: 360, y: 60 },
      { type: 'tree_pine', x: 400, y: 150 },
      { type: 'tree_pine', x: 480, y: 100 },
      { type: 'tree_pine', x: 480, y: 200 },
      { type: 'tree_pine', x: 600, y: 100 },
      { type: 'tree_pine', x: 650, y: 60 },
      { type: 'tree_pine', x: 720, y: 140 },
      { type: 'tree_pine', x: 480, y: 400 },
      { type: 'tree_pine', x: 470, y: 500 },
      
      { type: 'tree_palm', x: 650, y: 450 },
      { type: 'tree_palm', x: 700, y: 490 },
      { type: 'tree_palm', x: 750, y: 520 },
      { type: 'tree_palm', x: 780, y: 420 },

      // Distance Labels
      { type: 'distance_label', x: 400, y: 30, text: '↑ Dilnagar 19KM' },
      { type: 'distance_label', x: 510, y: 30, text: '↑ Dilnagar 10KM' },
      { type: 'distance_label', x: 740, y: 40, text: 'Ratanpur 10KM ↗' },
      { type: 'distance_label', x: 400, y: 530, text: '↓ Bagar 18KM' },
      { type: 'distance_label', x: 510, y: 530, text: '↓ Bagar 10KM' },

      // Original Markers (Aligned to 2D image)
      { type: 'start_point', x: 580, y: 130, label: 'Petrol Pump' },
      { type: 'end_point', x: 800, y: 50, label: 'Ratanpur College' },
      { type: 'threat', icon: '💊', x: 300, y: 150, label: 'Drug Exchange (6:45 PM)', labelColor: '#ef4444' },
      { type: 'threat', icon: '🛤', x: 420, y: 460, label: 'Broken Tracks (Train 6:30 PM)', labelColor: '#ef4444' },
      { type: 'threat', icon: '🆘', x: 750, y: 380, label: 'Informer at Ferry', labelColor: '#ef4444' }
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
