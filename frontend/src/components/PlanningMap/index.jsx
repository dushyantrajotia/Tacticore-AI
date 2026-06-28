import { useEffect, useRef, useState, forwardRef, useImperativeHandle, Suspense } from 'react';
import socket from '../../services/socket';
import SCENARIO_TEMPLATES from '../../data/scenarioTemplates';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Billboard, Text, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

const RESOURCE_ICONS = {
  add_truck: { icon: '🚒', label: 'Fire Truck', color: '#ef4444' },
  add_person: { icon: '👷', label: 'Volunteer', color: '#3b82f6' },
  add_pump: { icon: '💧', label: 'Water Pump', color: '#06b6d4' },
  add_ambulance: { icon: '🚑', label: 'Ambulance', color: '#f59e0b' },
  add_police: { icon: '🚓', label: 'Police', color: '#1d4ed8' },
  add_citizen: { icon: '🚶', label: 'Citizen', color: '#10b981' },
  add_car: { icon: '🚗', label: 'Car', color: '#8b5cf6' },
  add_bike: { icon: '🚲', label: 'Bike', color: '#ec4899' },
};

// ── SVG renderers for each element type ──
function renderElement(el, idx) {
  switch (el.type) {
    case 'zone':
      return (
        <g key={idx}>
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={8} fill={el.fill === '#3b82f6' ? 'url(#seaPattern)' : (el.fill || '#7c6a4a')} opacity={0.8} />
          {el.label && <text x={el.x + el.w / 2} y={el.y + (el.labelY || -8)} textAnchor="middle" fill="#f3f4f6" fontSize="13" fontWeight="bold" filter="drop-shadow(0px 1px 1px rgba(0,0,0,0.5))">{el.label}</text>}
        </g>
      );
    case 'road':
      const isHighway = el.width > 30;
      return (
        <g key={idx}>
          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={isHighway ? "#333" : "#8b7355"} strokeWidth={el.width || 18} strokeLinecap="round" />
          {isHighway && (
            <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#fff" strokeWidth="2" strokeDasharray="15,15" opacity="0.6" />
          )}
        </g>
      );
    case 'house':
      return <text key={idx} x={el.x} y={el.y} fontSize="45" textAnchor="middle">🏠</text>;
    case 'fire':
      return (
        <g key={idx}>
          <ellipse cx={el.x} cy={el.y} rx="18" ry="22" fill="#ff4500" opacity="0.7">
            <animate attributeName="rx" values="18;20;18" dur="0.5s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx={el.x} cy={el.y} rx="10" ry="14" fill="#ffcc00" opacity="0.8">
            <animate attributeName="rx" values="10;12;10" dur="0.4s" repeatCount="indefinite" />
          </ellipse>
          <text x={el.x} y={el.y + 3} textAnchor="middle" fontSize="18">🔥</text>
        </g>
      );
    case 'river':
      return (
        <g key={idx}>
          <path d={el.path} stroke="url(#riverGradient)" strokeWidth="30" fill="none" opacity="0.8" strokeLinecap="round" />
          {el.label && <text x={el.labelX || 400} y={el.labelY || 200} textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="bold" transform={el.labelRotate ? `rotate(${el.labelRotate},${el.labelX},${el.labelY})` : undefined}>{el.label}</text>}
        </g>
      );
    case 'track':
      return (
        <g key={idx}>
          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#374151" strokeWidth="14" strokeLinecap="butt" />
          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#9ca3af" strokeWidth="14" strokeDasharray="4,16" />
          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#64748b" strokeWidth="3" opacity="0.8" />
          <text x={(el.x1 + el.x2) / 2} y={(el.y1 + el.y2) / 2 - 15} textAnchor="middle" fill="#f3f4f6" fontSize="10" fontWeight="bold" filter="drop-shadow(1px 1px 1px black)">🛤 RAILWAY</text>
        </g>
      );
    case 'building':
      const isSch = el.label?.includes('School');
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <text fontSize="65" textAnchor="middle">{isSch ? '🏫' : '🏢'}</text>
          {el.label && <text y="-45" textAnchor="middle" fill={el.labelColor || "#ef4444"} fontSize="14" fontWeight="bold" filter="drop-shadow(1px 1px 1px black)">{el.label}</text>}
        </g>
      );
    case 'poi':
      return (
        <g key={idx}>
          <text x={el.x} y={el.y} textAnchor="middle" fontSize="24">{el.icon}</text>
          {el.label && <text x={el.x} y={el.y + 25} textAnchor="middle" fill={el.labelColor || "#ef4444"} fontSize="10" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'vegetation':
      return (
        <g key={idx}>
          {[...Array(3)].map((_, i) => (
            <g key={i} transform={`translate(${el.x + (i*20) % (el.w||40)}, ${el.y + (i*15) % (el.h||40)})`}>
               <path d="M 0 10 L 5 0 L 10 10 Z" fill="#166534" />
               <rect x="4" y="10" width="2" height="3" fill="#422006" />
            </g>
          ))}
          {el.label && <text x={el.x + (el.w||0) / 2} y={el.y + (el.h||0) + 12} textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'bridge':
      return (
        <g key={idx} transform={`translate(${el.x1},${el.y1})`}>
          <text fontSize="50" textAnchor="middle">🌉</text>
          {el.label && <text y="-35" textAnchor="middle" fill={el.labelColor || "#ef4444"} fontSize="13" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'checkpoint':
      return (
        <g key={idx} transform={`translate(${el.x-20},${el.y-10})`}>
          <rect width="40" height="20" fill="#f59e0b" rx="2" />
          <rect x="5" y="8" width="30" height="4" fill="#111" />
          <text x="20" y="-5" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">{el.label}</text>
        </g>
      );
    case 'danger_zone':
      return (
        <g key={idx}>
          <ellipse cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} fill="url(#dangerGradient)" opacity="0.6" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" />
          <text x={el.cx} y={el.cy + 4} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold" filter="drop-shadow(1px 1px 1px red)">{el.label}</text>
        </g>
      );
    case 'curved_road':
      return <path key={idx} d={el.path} stroke={el.color || "#8b7355"} strokeWidth={el.width || 12} fill="none" strokeLinecap="round" />;
    case 'tree_pine':
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <path d="M 0 0 L 10 -20 L 20 0 Z" fill="#14532d" />
          <path d="M 2 -10 L 10 -30 L 18 -10 Z" fill="#166534" />
          <rect x="8" y="0" width="4" height="6" fill="#422006" />
        </g>
      );
    case 'tree_palm':
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <path d="M 0 0 Q 5 -20 10 0 T 20 0" fill="none" stroke="#422006" strokeWidth="3" />
          <path d="M 5 -15 L -10 -25 M 5 -15 L 20 -25 M 5 -15 L 5 -35" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'boat':
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <path d="M 0 0 L 30 0 L 40 -10 L -10 -10 Z" fill="#ef4444" stroke="#991b1b" />
          <rect x="5" y="-18" width="15" height="8" fill="white" />
          {el.label && <text y="-25" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{el.label}</text>}
        </g>
      );
    case 'label':
      return (
        <g key={idx}>
          <rect x={el.x - (el.text.length * 4)} y={el.y - 12} width={el.text.length * 8} height={16} fill="rgba(0,0,0,0.4)" rx="2" />
          <text x={el.x} y={el.y} textAnchor="middle" fill={el.color || '#ccc'} fontSize={el.size || 12} fontWeight="800" letterSpacing="0.05em">
            {el.text}
          </text>
        </g>
      );
    case 'start_point':
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <circle r="15" fill="rgba(34,197,94,0.3)" stroke="#22c55e" strokeWidth="2" />
          <path d="M -5 -2 L 5 -2 L 0 8 Z" fill="#22c55e" />
          <rect x="-40" y="-35" width="80" height="14" fill="rgba(22,101,52,0.8)" rx="2" />
          <text y="-25" textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="bold">START POINT</text>
          <rect x="-40" y="20" width="80" height="14" fill="rgba(0,0,0,0.6)" rx="2" />
          <text y="30" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{el.label}</text>
        </g>
      );
    case 'end_point':
      return (
        <g key={idx} transform={`translate(${el.x},${el.y})`}>
          <rect x="-12" y="-12" width="24" height="24" fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="2" />
          <rect x="-40" y="-35" width="80" height="14" fill="rgba(30,58,138,0.8)" rx="2" />
          <text y="-25" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="bold">DESTINATION</text>
          <rect x="-40" y="20" width="80" height="14" fill="rgba(0,0,0,0.6)" rx="2" />
          <text y="30" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{el.label}</text>
          <path d="M -5 -5 L 5 5 M 5 -5 L -5 5" stroke="#3b82f6" strokeWidth="2" />
        </g>
      );
    default:
      return null;
  }
}

// ── 3D Helper Components ──
function MapGround3D({ bgImage, terrain }) {
  const texture = bgImage ? useLoader(THREE.TextureLoader, bgImage) : null;
  return (
    <group position={[0, -5, 0]}>
      <mesh>
        <boxGeometry args={[800, 10, 550]} />
        <meshStandardMaterial attach="material-0" color="#5c3a21" /> 
        <meshStandardMaterial attach="material-1" color="#5c3a21" /> 
        <meshStandardMaterial attach="material-2" color={texture ? '#ffffff' : (terrain || '#7db952')} map={texture || undefined} /> 
        <meshStandardMaterial attach="material-3" color="#5c3a21" /> 
        <meshStandardMaterial attach="material-4" color="#5c3a21" /> 
        <meshStandardMaterial attach="material-5" color="#5c3a21" /> 
      </mesh>
    </group>
  );
}

function Element3D({ el }) {
  const X = (el.x || el.x1 || el.cx || 400) - 400;
  const Z = (el.y || el.y1 || el.cy || 275) - 275;

  switch (el.type) {
    case 'zone':
      return (
        <group position={[el.x + el.w/2 - 400, 0.5, el.y + el.h/2 - 275]}>
          <mesh>
            <boxGeometry args={[el.w, 1, el.h]} />
            <meshStandardMaterial color={el.fill === '#3b82f6' ? '#1e40af' : (el.fill || '#7c6a4a')} opacity={0.6} transparent={true} />
          </mesh>
          {el.label && (
            <Billboard position={[0, 10, 0]}>
              <Text fontSize={10} color="#f3f4f6" outlineWidth={0.5} outlineColor="#000000" font="monospace">{el.label}</Text>
            </Billboard>
          )}
        </group>
      );
    case 'road': {
      const dx = el.x2 - el.x1;
      const dy = el.y2 - el.y1;
      const length = Math.max(0.1, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const midX = (el.x1 + el.x2) / 2 - 400;
      const midZ = (el.y1 + el.y2) / 2 - 275;
      const isHighway = el.width > 30;
      if (isNaN(length)) return null;
      
      return (
        <group position={[midX, 0.6, midZ]} rotation={[0, -angle, 0]}>
          <mesh rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[length, el.width || 20]} />
            <meshStandardMaterial color={isHighway ? "#333333" : "#8b7355"} />
          </mesh>
          {isHighway && (
             <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.1, 0]}>
               <planeGeometry args={[length, 2]} />
               <meshStandardMaterial color="#ffffff" />
             </mesh>
          )}
        </group>
      );
    }
    case 'track': {
      const dx = el.x2 - el.x1;
      const dy = el.y2 - el.y1;
      const length = Math.max(0.1, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const midX = (el.x1 + el.x2) / 2 - 400;
      const midZ = (el.y1 + el.y2) / 2 - 275;
      if (isNaN(length)) return null;
      
      return (
        <group position={[midX, 0.7, midZ]} rotation={[0, -angle, 0]}>
          <mesh rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[length, 12]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.1, 0]}>
            <planeGeometry args={[length, 4]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>
        </group>
      );
    }
    case 'curved_road':
      return (
        <Billboard position={[X, 10, Z]}>
          <Text fontSize={10} color={el.color || "#ffffff"} outlineWidth={0.5} outlineColor="#000000">🛣️ Road</Text>
        </Billboard>
      );
    case 'house':
      return (
        <group position={[X, 0, Z]}>
          <mesh position={[0, 9, 0]}><boxGeometry args={[25, 18, 25]} /><meshStandardMaterial color="#8b7355" /></mesh>
          <mesh position={[0, 22, 0]} rotation={[0, Math.PI/4, 0]}><coneGeometry args={[22, 12, 4]} /><meshStandardMaterial color="#5c3a21" flatShading /></mesh>
        </group>
      );
    case 'building':
      const isSch = el.label?.includes('School') || el.label?.includes('College');
      return (
        <group position={[X, 0, Z]}>
          <mesh position={[0, 20, 0]}><boxGeometry args={[35, 40, 35]} /><meshStandardMaterial color={isSch ? "#d97706" : "#64748b"} /></mesh>
          {el.label && (
            <Billboard position={[0, 50, 0]}>
              <Text fontSize={10} color={el.labelColor || "#ffffff"} outlineWidth={0.5} outlineColor="#000000" fontWeight="bold">{el.label}</Text>
            </Billboard>
          )}
        </group>
      );
    case 'tree_pine':
      return (
        <group position={[X, 0, Z]}>
          <mesh position={[0, 4, 0]}><cylinderGeometry args={[1.5, 1.5, 8]} /><meshStandardMaterial color="#422006" /></mesh>
          <mesh position={[0, 15, 0]}><coneGeometry args={[10, 18, 5]} /><meshStandardMaterial color="#14532d" flatShading /></mesh>
        </group>
      );
    case 'tree_palm':
      return (
        <group position={[X, 0, Z]}>
          <mesh position={[0, 6, 0]} rotation={[0.1, 0, 0.1]}><cylinderGeometry args={[1, 1.5, 12]} /><meshStandardMaterial color="#5c3a21" /></mesh>
          <mesh position={[1, 14, 1]}><sphereGeometry args={[7, 7, 7]} /><meshStandardMaterial color="#166534" /></mesh>
        </group>
      );
    case 'boat':
      return (
        <group position={[X, 0, Z]}>
          <mesh position={[0, 3, 0]}><boxGeometry args={[30, 6, 12]} /><meshStandardMaterial color="#ef4444" /></mesh>
          <mesh position={[-4, 8, 0]}><boxGeometry args={[12, 5, 8]} /><meshStandardMaterial color="white" /></mesh>
          {el.label && (
            <Billboard position={[0, 18, 0]}>
              <Text fontSize={8} color="white" outlineWidth={0.4} outlineColor="#000000">{el.label}</Text>
            </Billboard>
          )}
        </group>
      );
    case 'river':
      return el.label ? (
        <Billboard position={[el.labelX ? el.labelX - 400 : X, 10, el.labelY ? el.labelY - 275 : Z]}>
          <Text fontSize={12} color="#93c5fd" outlineWidth={0.5} outlineColor="#000000" fontWeight="bold">{el.label}</Text>
        </Billboard>
      ) : null;
    case 'start_point':
    case 'end_point':
      const isStart = el.type === 'start_point';
      const color = isStart ? '#22c55e' : '#3b82f6';
      const title = isStart ? 'START POINT' : 'DESTINATION';
      const labelLower = el.label?.toLowerCase() || '';
      
      let geometry = null;
      if (labelLower.includes('school') || labelLower.includes('college')) {
         geometry = (
           <group position={[0, 15, 0]}>
             <mesh><boxGeometry args={[40, 30, 30]} /><meshStandardMaterial color="#fcd34d" /></mesh>
             <mesh position={[0, 20, 0]}><coneGeometry args={[25, 15, 4]} rotation={[0, Math.PI/4, 0]} /><meshStandardMaterial color="#b91c1c" /></mesh>
           </group>
         );
      } else if (labelLower.includes('range')) { 
         geometry = (
           <group position={[0, 5, 0]}>
             <mesh position={[0, 0, 15]}><boxGeometry args={[40, 5, 5]} /><meshStandardMaterial color="#d2b48c" /></mesh>
             <mesh position={[-10, 10, -10]}><boxGeometry args={[5, 10, 1]} /><meshStandardMaterial color="#ffffff" /></mesh>
             <mesh position={[10, 10, -10]}><boxGeometry args={[5, 10, 1]} /><meshStandardMaterial color="#ffffff" /></mesh>
             <mesh position={[-10, 10, -9.4]}><cylinderGeometry args={[2, 2, 1.2]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#ef4444" /></mesh>
             <mesh position={[10, 10, -9.4]}><cylinderGeometry args={[2, 2, 1.2]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#ef4444" /></mesh>
           </group>
         );
      } else if (labelLower.includes('camp')) {
         geometry = (
           <group position={[0, 10, 0]}>
             <mesh position={[-10, 0, 0]}><coneGeometry args={[10, 15, 4]} /><meshStandardMaterial color="#15803d" /></mesh>
             <mesh position={[10, 0, 0]}><coneGeometry args={[10, 15, 4]} /><meshStandardMaterial color="#15803d" /></mesh>
           </group>
         );
      } else if (labelLower.includes('pump')) {
         geometry = (
           <group position={[0, 10, 0]}>
             <mesh position={[0, 15, 0]}><boxGeometry args={[30, 2, 20]} /><meshStandardMaterial color="#eab308" /></mesh>
             <mesh position={[-10, 5, 0]}><cylinderGeometry args={[1, 1, 20]} /><meshStandardMaterial color="#9ca3af" /></mesh>
             <mesh position={[10, 5, 0]}><cylinderGeometry args={[1, 1, 20]} /><meshStandardMaterial color="#9ca3af" /></mesh>
             <mesh position={[-10, -2, 0]}><boxGeometry args={[4, 10, 4]} /><meshStandardMaterial color="#ef4444" /></mesh>
             <mesh position={[10, -2, 0]}><boxGeometry args={[4, 10, 4]} /><meshStandardMaterial color="#ef4444" /></mesh>
           </group>
         );
      } else if (labelLower.includes('village')) {
         geometry = (
           <group position={[0, 10, 0]}>
             <mesh position={[-12, 0, 10]}><boxGeometry args={[15, 12, 15]} /><meshStandardMaterial color="#d1d5db" /></mesh>
             <mesh position={[-12, 10, 10]} rotation={[0, Math.PI/4, 0]}><coneGeometry args={[12, 8, 4]} /><meshStandardMaterial color="#b91c1c" /></mesh>
             <mesh position={[12, 0, -5]}><boxGeometry args={[15, 12, 15]} /><meshStandardMaterial color="#d1d5db" /></mesh>
             <mesh position={[12, 10, -5]} rotation={[0, Math.PI/4, 0]}><coneGeometry args={[12, 8, 4]} /><meshStandardMaterial color="#b91c1c" /></mesh>
           </group>
         );
      } else {
         geometry = (
           <mesh position={[0, 5, 0]}>
             {isStart ? <cylinderGeometry args={[15, 10, 15]} /> : <boxGeometry args={[24, 10, 24]} />}
             <meshStandardMaterial color={color} opacity={0.8} transparent={true} />
           </mesh>
         );
      }

      return (
        <group position={[X, 0.5, Z]}>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[30, 30, 1]} /><meshStandardMaterial color={color} opacity={0.3} transparent={true} /></mesh>
          {geometry}
          <Billboard position={[0, 45, 0]}>
            <Text position={[0, 5, 0]} fontSize={8} color={isStart ? "#86efac" : "#93c5fd"} outlineWidth={0.4} outlineColor="#000000" fontWeight="bold">{title}</Text>
            <Text position={[0, -5, 0]} fontSize={12} color="white" outlineWidth={0.5} outlineColor="#000000" fontWeight="bold">{el.label}</Text>
          </Billboard>
        </group>
      );
    case 'bridge':
      return (
        <group position={[X, 5, Z]}>
          <mesh position={[0, 5, 0]}>
            <boxGeometry args={[40, 5, 20]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          <mesh position={[0, 10, 9]}>
            <boxGeometry args={[40, 4, 2]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
          <mesh position={[0, 10, -9]}>
            <boxGeometry args={[40, 4, 2]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
          {el.label && (
            <Billboard position={[0, 20, 0]}>
              <Text fontSize={10} color={el.labelColor || "#ffffff"} outlineWidth={0.5} outlineColor="#000000" fontWeight="bold">{el.label}</Text>
            </Billboard>
          )}
        </group>
      );
    case 'poi':
      return (
        <group position={[X, 10, Z]}>
          <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[4, 10, 8]} />
            <meshStandardMaterial color={el.labelColor || "#ef4444"} />
          </mesh>
          <mesh position={[0, 8, 0]}>
            <sphereGeometry args={[6, 16, 16]} />
            <meshStandardMaterial color={el.labelColor || "#ef4444"} />
          </mesh>
          <Billboard position={[0, 22, 0]}>
            <Text fontSize={10} color={el.labelColor || "#ffffff"} outlineWidth={0.5} outlineColor="#000000" fontWeight="bold">
              {el.icon} {el.label}
            </Text>
          </Billboard>
        </group>
      );
    case 'danger_zone':
      return (
        <group position={[X, 1, Z]}>
          <mesh><cylinderGeometry args={[el.rx || 20, el.rx || 20, 1]} /><meshStandardMaterial color="#ef4444" opacity={0.4} transparent={true} /></mesh>
          <Billboard position={[0, 15, 0]}>
            <Text fontSize={10} color="#ff0000" outlineWidth={0.5} outlineColor="#000000" fontWeight="bold">
              {el.label}
            </Text>
          </Billboard>
        </group>
      );
    case 'threat':
      return (
        <group position={[X, 5, Z]}>
          <mesh position={[0, 10, 0]}>
            <octahedronGeometry args={[8]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <Billboard position={[0, 25, 0]}>
            <Text fontSize={10} color="#ff0000" outlineWidth={0.5} outlineColor="#000000" fontWeight="bold">
              {el.icon} {el.label}
            </Text>
          </Billboard>
        </group>
      );
    case 'fire':
      return (
        <group position={[X, 5, Z]}>
          <mesh position={[-4, 5, 0]}><coneGeometry args={[4, 12, 8]} /><meshStandardMaterial color="#ff4500" /></mesh>
          <mesh position={[4, 7, 2]}><coneGeometry args={[5, 15, 8]} /><meshStandardMaterial color="#ffcc00" /></mesh>
          <mesh position={[0, 9, -3]}><coneGeometry args={[6, 18, 8]} /><meshStandardMaterial color="#ff0000" /></mesh>
          <Billboard position={[0, 25, 0]}>
            <Text fontSize={10} color="#ff4500" outlineWidth={0.5} outlineColor="#000000" fontWeight="bold">
              {el.icon} {el.label}
            </Text>
          </Billboard>
        </group>
      );
    case 'label':
      return (
        <Billboard position={[X, 10, Z]}>
          <Text fontSize={el.size || 10} color={el.color || '#ffffff'} outlineWidth={0.5} outlineColor="#000000" fontWeight="bold">{el.text}</Text>
        </Billboard>
      );
    default:
      return null;
  }
}

const PlanningMap = forwardRef(function PlanningMap({ roomId, activeMode, user, scenarioId, assignedResources, onMarkersChange, readOnly = false }, ref) {
  const svgRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [paths, setPaths] = useState([]);
  const [drawingPath, setDrawingPath] = useState(null);
  
  const [is3D, setIs3D] = useState(false);

  // Zoom and Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

  // Get the scenario template
  const template = SCENARIO_TEMPLATES[scenarioId] || SCENARIO_TEMPLATES['mohi_firing_range'];
  const { elements = [], terrain = '#7db952', bgImage } = template;

  // Expose map state to parent via ref
  useImperativeHandle(ref, () => ({
    getMapState: () => ({ markers, paths }),
    removeItem: (id, kind) => {
      if (kind === 'marker') {
        setMarkers(prev => prev.filter(m => m.id !== id));
        socket.emit('mapUpdate', { roomId, type: 'undo', targetId: id, targetType: 'marker' });
      } else {
        setPaths(prev => prev.filter(p => p.id !== id));
        socket.emit('mapUpdate', { roomId, type: 'undo', targetId: id, targetType: 'path' });
      }
    }
  }), [markers, paths, roomId]);

  const MAP_W = 800;
  const MAP_H = 550;

  useEffect(() => {
    socket.on('mapUpdate', (data) => {
      if (data.roomId !== roomId) return;
      if (data.type === 'marker') setMarkers(prev => [...prev, data.marker]);
      if (data.type === 'path') setPaths(prev => [...prev, data.path]);
      if (data.type === 'undo') {
         if (data.targetType === 'marker') setMarkers(prev => prev.filter(m => m.id !== data.targetId));
         if (data.targetType === 'path') setPaths(prev => prev.filter(p => p.id !== data.targetId));
      }
      if (data.type === 'clear') { setMarkers([]); setPaths([]); }
    });
    return () => socket.off('mapUpdate');
  }, [roomId]);

  useEffect(() => {
    if (onMarkersChange) {
      onMarkersChange(markers);
    }
  }, [markers, onMarkersChange]);

  const getMousePosition = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
    return { x: svgP.x, y: svgP.y };
  };

  const handleMapAction = (x, y) => {
    if (activeMode === 'draw_path') {
      if (!drawingPath) {
        setDrawingPath({ points: [{ x, y }] });
      } else {
        const newPoints = [...drawingPath.points, { x, y }];
        setDrawingPath({ points: newPoints });
      }
      return;
    }

    if (activeMode === 'finish_path' && drawingPath) return;

    let resourceInfo = RESOURCE_ICONS[activeMode];
    if (!resourceInfo && activeMode.startsWith('add_custom_')) {
      const customName = activeMode.replace('add_custom_', '');
      resourceInfo = { icon: '📦', label: customName, color: '#f59e0b' };
    }

    if (resourceInfo) {
      if (assignedResources) {
        const typeCount = markers.filter(m => m.type === activeMode).length;
        let limit = 0;
        if (activeMode === 'add_truck') limit = assignedResources.fireTrucks || 0;
        else if (activeMode === 'add_person') limit = assignedResources.volunteers || 0;
        else if (activeMode === 'add_pump') limit = assignedResources.waterPumps || 0;
        else if (activeMode === 'add_ambulance') limit = assignedResources.ambulance || 0;
        else if (activeMode === 'add_police') limit = assignedResources.police || 0;
        else if (activeMode === 'add_citizen') limit = assignedResources.citizen || 0;
        else if (activeMode === 'add_car') limit = assignedResources.car || 0;
        else if (activeMode === 'add_bike') limit = assignedResources.bike || 0;
        else if (activeMode.startsWith('add_custom_')) {
          const customName = activeMode.replace('add_custom_', '');
          const customItem = assignedResources.customItems?.find(c => c.name === customName);
          limit = customItem ? customItem.quantity : 0;
        }

        if (typeCount >= limit) {
          alert(`Limit reached for ${resourceInfo.label}`);
          return;
        }
      }

      const newMarker = {
        id: Date.now(),
        x, y,
        type: activeMode,
        icon: resourceInfo.icon,
        label: resourceInfo.label,
        color: resourceInfo.color,
        placedBy: user?.chestNo || user?.name || 'Unknown',
      };
      setMarkers(prev => [...prev, newMarker]);
      socket.emit('mapUpdate', { roomId, type: 'marker', marker: newMarker, userId: user?._id, chestNo: user?.chestNo });
    }
  };

  const handlePointerDown = (e) => {
    if (readOnly || activeMode === 'view' || e.button === 1 || e.button === 2) {
      setIsPanning(true);
      setLastPanPos({ x: e.clientX, y: e.clientY });
      return;
    }

    const { x, y } = getMousePosition(e);
    handleMapAction(x, y);
  };

  const handlePointerMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPos.x;
      const dy = e.clientY - lastPanPos.y;
      const ctm = svgRef.current.getScreenCTM();
      setPan(prev => ({ x: prev.x - dx / ctm.a, y: prev.y - dy / ctm.d }));
      setLastPanPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = () => { setIsPanning(false); };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    newZoom = Math.min(Math.max(0.5, newZoom), 5);
    setZoom(newZoom);
  };

  const handleClear = () => {
    setMarkers([]);
    setPaths([]);
    setDrawingPath(null);
    socket.emit('mapUpdate', { roomId, type: 'clear', userId: user?._id, chestNo: user?.chestNo });
  };

  const handleUndo = () => {
    if (drawingPath) {
      setDrawingPath(null);
      return;
    }

    const allItems = [
      ...markers.map(m => ({ ...m, _kind: 'marker' })),
      ...paths.map(p => ({ ...p, _kind: 'path' }))
    ];
    if (allItems.length === 0) return;

    const latest = allItems.reduce((max, item) => (item.id > max.id ? item : max), allItems[0]);

    if (latest._kind === 'marker') {
      setMarkers(prev => prev.filter(m => m.id !== latest.id));
      socket.emit('mapUpdate', { roomId, type: 'undo', targetId: latest.id, targetType: 'marker' });
    } else {
      setPaths(prev => prev.filter(p => p.id !== latest.id));
      socket.emit('mapUpdate', { roomId, type: 'undo', targetId: latest.id, targetType: 'path' });
    }
  };

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (activeMode === 'view') return 'grab';
    return 'crosshair';
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a', position: 'relative' }}>

      {/* 2D/3D Toggle Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); setIs3D(prev => !prev); }} 
        style={{ 
          position: 'absolute', top: '10px', right: '60px', zIndex: 10, 
          background: is3D ? '#3b82f6' : 'rgba(15,23,42,0.8)', color: 'white', border: '1px solid var(--gray-700)', 
          padding: '0.4rem 0.75rem', borderRadius: '0.4rem', cursor: 'pointer',
          fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          transition: 'all 0.2s'
        }}
      >
        {is3D ? '👁 2D MAP' : '🧊 3D MAP'}
      </button>

      {/* Zoom Controls (only in 2D) */}
      {!is3D && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center', background: 'rgba(15,23,42,0.8)', padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid var(--gray-700)' }}>
          <button onClick={() => setZoom(z => Math.min(z * 1.2, 5))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>➕</button>
          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontFamily: 'monospace', fontWeight: '700' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => { setZoom(1); setPan({x: 0, y: 0}); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}>🔄</button>
          <button onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>➖</button>
        </div>
      )}

      {/* Scenario name badge */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, background: 'rgba(15,23,42,0.85)', padding: '0.35rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--gray-700)', fontSize: '0.75rem', color: 'var(--gray-300)' }}>
        {template.thumbnail} {template.name} {is3D && <span style={{ color: '#3b82f6', fontWeight: 'bold', marginLeft: '0.5rem' }}>3D</span>}
      </div>

      {/* Map Canvas */}
      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: is3D ? (activeMode === 'view' ? 'grab' : 'crosshair') : getCursor() }}
        onPointerDown={!is3D ? handlePointerDown : undefined}
        onPointerMove={!is3D ? handlePointerMove : undefined}
        onPointerUp={!is3D ? handlePointerUp : undefined}
        onPointerLeave={!is3D ? handlePointerUp : undefined}
        onWheel={!is3D ? handleWheel : undefined}
      >
        {is3D ? (
          <Canvas camera={{ position: [0, 400, 400], fov: 50 }}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[100, 300, 100]} intensity={1.5} castShadow />
            <Suspense fallback={
              <group position={[0, -5, 0]}>
                <mesh>
                  <boxGeometry args={[800, 10, 550]} />
                  <meshStandardMaterial color={terrain || '#7db952'} />
                </mesh>
              </group>
            }>
              <MapGround3D bgImage={bgImage} terrain={terrain} />
            </Suspense>
            
            {/* Invisible clickable plane for 3D marker placement */}
            {!readOnly && (
              <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, 0, 0]} 
                visible={false}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (activeMode !== 'view') {
                    handleMapAction(e.point.x + 400, e.point.z + 275);
                  }
                }}
              >
                <planeGeometry args={[800, 550]} />
                <meshBasicMaterial />
              </mesh>
            )}

            {elements.map((el, idx) => {
              return <Element3D key={idx} el={el} />;
            })}

            {/* 3D Markers */}
            {markers.map(m => (
              <group key={m.id} position={[m.x - 400, 0, m.y - 275]}>
                {m.type === 'add_truck' ? (
                  <group position={[0, 5, 0]}>
                     <mesh><boxGeometry args={[12, 10, 24]} /><meshStandardMaterial color="#ef4444" /></mesh>
                     <mesh position={[0, 8, -6]}><boxGeometry args={[12, 6, 12]} /><meshStandardMaterial color="#b91c1c" /></mesh>
                  </group>
                ) : m.type === 'add_person' ? (
                  <mesh position={[0, 8, 0]}><capsuleGeometry args={[4, 8, 4, 8]} /><meshStandardMaterial color="#3b82f6" /></mesh>
                ) : m.type === 'add_ambulance' ? (
                  <group position={[0, 6, 0]}>
                    <mesh><boxGeometry args={[12, 12, 24]} /><meshStandardMaterial color="#ffffff" /></mesh>
                    <mesh position={[0, 7, 0]}><boxGeometry args={[13, 3, 6]} /><meshStandardMaterial color="#ef4444" /></mesh>
                    <mesh position={[0, 7, 0]}><boxGeometry args={[13, 6, 3]} /><meshStandardMaterial color="#ef4444" /></mesh>
                  </group>
                ) : m.type === 'add_police' ? (
                  <group position={[0, 6, 0]}>
                    <mesh><boxGeometry args={[12, 10, 22]} /><meshStandardMaterial color="#1d4ed8" /></mesh>
                    <mesh position={[0, 6, 0]}><boxGeometry args={[4, 2, 8]} /><meshStandardMaterial color="#ef4444" /></mesh>
                  </group>
                ) : m.type === 'add_car' ? (
                  <mesh position={[0, 4, 0]}><boxGeometry args={[10, 8, 20]} /><meshStandardMaterial color="#8b5cf6" /></mesh>
                ) : (
                  <mesh position={[0, 5, 0]}><cylinderGeometry args={[5, 5, 10]} /><meshStandardMaterial color={m.color || '#3b82f6'} opacity={0.8} transparent={true} /></mesh>
                )}
                
                <Billboard position={[0, 25, 0]}>
                  <Text position={[0, 0, 0]} fontSize={10} color={m.color || "#ffffff"} outlineWidth={0.5} outlineColor="#000000" fontWeight="bold">
                    {m.icon} {m.label}
                  </Text>
                  {m.placedBy && (
                    <Text position={[0, -8, 0]} fontSize={6} color="#60a5fa" outlineWidth={0.4} outlineColor="#000000" fontWeight="bold">
                      by {m.placedBy}
                    </Text>
                  )}
                </Billboard>
                
                {!readOnly && (
                   <mesh 
                     position={[16, 5, 0]} 
                     onClick={(e) => { e.stopPropagation(); setMarkers(prev => prev.filter(marker => marker.id !== m.id)); socket.emit('mapUpdate', { roomId, type: 'undo', targetId: m.id, targetType: 'marker' }); }}
                   >
                     <sphereGeometry args={[5]} />
                     <meshStandardMaterial color="#ef4444" />
                   </mesh>
                )}
              </group>
            ))}

            {/* 3D Paths */}
            {paths.map(p => (
              <Line key={p.id} points={p.points.map(pt => [pt.x - 400, 2, pt.y - 275])} color="#111" lineWidth={5} dashed={true} />
            ))}

            {drawingPath && drawingPath.points.length > 1 && (
              <Line points={drawingPath.points.map(pt => [pt.x - 400, 2, pt.y - 275])} color="#333" lineWidth={4} dashed={true} />
            )}

            <OrbitControls 
              makeDefault 
              minPolarAngle={Math.PI / 8} 
              maxPolarAngle={Math.PI / 2.2} 
              minAzimuthAngle={-Math.PI / 3}
              maxAzimuthAngle={Math.PI / 3}
              enableDamping={true}
              dampingFactor={0.05}
            />
          </Canvas>
        ) : (
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`${pan.x} ${pan.y} ${MAP_W / zoom} ${MAP_H / zoom}`}
            style={{ display: 'block', touchAction: 'none' }}
          >
            {/* Background terrain */}
            <rect width="800" height="600" fill={terrain || "#eee"} />
        
            {bgImage && (
              <image href={bgImage} x="0" y="0" width="800" height="600" preserveAspectRatio="none" />
            )}
            
            {/* Dynamic Elements */}
            {elements.map((el, idx) => {
              const isInfra = ['road', 'curved_road', 'river', 'track', 'vegetation', 'tree_pine', 'tree_palm', 'house', 'building', 'bridge', 'zone'].includes(el.type);
              if (bgImage && isInfra) return null;
              return renderElement(el, idx);
            })}

            {/* Arrow marker for paths */}
            <defs>
              <pattern id="terrainPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                 <rect width="100" height="100" fill={terrain || '#3d6b47'} />
                 <circle cx="10" cy="10" r="1" fill="#ffffff" opacity="0.05" />
                 <circle cx="50" cy="60" r="1.5" fill="#ffffff" opacity="0.03" />
              </pattern>
              <pattern id="seaPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                 <rect width="40" height="40" fill="#1e40af" />
                 <path d="M 0 20 Q 10 10 20 20 T 40 20" stroke="#3b82f6" fill="none" opacity="0.3" strokeWidth="2" />
              </pattern>
              <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#1d4ed8" />
                 <stop offset="50%" stopColor="#3b82f6" />
                 <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <radialGradient id="dangerGradient">
                 <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                 <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
              </radialGradient>
              <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#111" />
              </marker>
            </defs>

            {/* Completed paths */}
            {paths.map(path => (
              <g key={path.id}>
                <polyline
                  points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
                  stroke="#111"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="12,5"
                  markerEnd="url(#arrow)"
                />
                {path.drawnBy && (
                  <text x={path.points[0]?.x || 0} y={(path.points[0]?.y || 0) - 10} fill="#333" fontSize="8" fontWeight="bold">by {path.drawnBy}</text>
                )}
                {!readOnly && path.points.length > 0 && (
                  <g style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setPaths(prev => prev.filter(p => p.id !== path.id)); socket.emit('mapUpdate', { roomId, type: 'undo', targetId: path.id, targetType: 'path' }); }}>
                    <circle cx={path.points[Math.floor(path.points.length / 2)]?.x || 0} cy={(path.points[Math.floor(path.points.length / 2)]?.y || 0) - 12} r="7" fill="#ef4444" stroke="#fff" strokeWidth="1" />
                    <text x={path.points[Math.floor(path.points.length / 2)]?.x || 0} y={(path.points[Math.floor(path.points.length / 2)]?.y || 0) - 9} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">✕</text>
                  </g>
                )}
              </g>
            ))}

            {/* In-progress path */}
            {drawingPath && drawingPath.points.length > 1 && (
              <polyline
                points={drawingPath.points.map(p => `${p.x},${p.y}`).join(' ')}
                stroke="#333"
                strokeWidth="4"
                fill="none"
                strokeDasharray="8,4"
                opacity="0.7"
              />
            )}

            {/* Resource Markers */}
            {markers.map(marker => (
              <g key={marker.id}>
                <circle cx={marker.x} cy={marker.y} r="18" fill={marker.color} fillOpacity="0.25" stroke={marker.color} strokeWidth="2" />
                <text x={marker.x} y={marker.y + 6} textAnchor="middle" fontSize="18">{marker.icon}</text>
                <text x={marker.x} y={marker.y + 26} textAnchor="middle" fill="#f3f4f6" fontSize="9" fontWeight="bold">{marker.label}</text>
                {marker.placedBy && (
                  <text x={marker.x} y={marker.y + 36} textAnchor="middle" fill="#60a5fa" fontSize="7">by {marker.placedBy}</text>
                )}
                {!readOnly && (
                  <g style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setMarkers(prev => prev.filter(m => m.id !== marker.id)); socket.emit('mapUpdate', { roomId, type: 'undo', targetId: marker.id, targetType: 'marker' }); }}>
                    <circle cx={marker.x + 14} cy={marker.y - 14} r="7" fill="#ef4444" stroke="#fff" strokeWidth="1" />
                    <text x={marker.x + 14} y={marker.y - 11} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">✕</text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* Bottom bar — hidden in readOnly mode */}
      {!readOnly && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.35rem 0.75rem', background: 'rgba(15,23,42,0.95)',
          borderTop: '1px solid var(--gray-700)', fontSize: '0.7rem', color: 'var(--gray-400)'
        }}>
          <span>
            {activeMode === 'view' && '👁 View Mode'}
            {RESOURCE_ICONS[activeMode] && `${RESOURCE_ICONS[activeMode].icon} Click map to place ${RESOURCE_ICONS[activeMode].label}`}
            {activeMode.startsWith('add_custom_') && `📦 Click map to place ${activeMode.replace('add_custom_', '')}`}
            {activeMode === 'draw_path' && `✏ Route — ${drawingPath ? `${drawingPath.points.length} pts` : 'Click to start'}`}
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {activeMode === 'draw_path' && drawingPath && (
              <button className="btn btn-sm btn-primary" onClick={(e) => {
                e.stopPropagation();
                if (drawingPath) {
                  const newPath = { id: Date.now(), points: drawingPath.points, color: '#111', drawnBy: user?.chestNo || user?.name || 'Unknown' };
                  setPaths(prev => [...prev, newPath]);
                  socket.emit('mapUpdate', { roomId, type: 'path', path: newPath, userId: user?._id, chestNo: user?.chestNo });
                  setDrawingPath(null);
                }
              }}>✅ Done</button>
            )}
            <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); handleUndo(); }}>↩ Undo</button>
            <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleClear(); }}>🗑 Clear</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default PlanningMap;
