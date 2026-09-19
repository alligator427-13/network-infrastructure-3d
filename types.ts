// Network Infrastructure 3D - TypeScript Types and Interfaces

import { Vector3 } from 'three';

// Equipment Types
export type EquipmentType = 
  | 'router'
  | 'switch'
  | 'firewall'
  | 'server'
  | 'proxmox'
  | 'vmware'
  | 'nas'
  | 'wifi'
  | 'dc'
  | 'veeam'
  | 'vm'
  | 'docker'
  | 'lxc';

// Status Types
export type StatusType = 'online' | 'warning' | 'offline';

// Network Node Interface
export interface NetworkNode {
  id: string;
  name: string;
  type: EquipmentType;
  ip: string;
  vlan: string;
  subnet: string;
  status: StatusType;
  position: [number, number, number];
  description: string;
  details: Record<string, string>;
  hostId?: string;
  floor?: number;
  buildingId?: string;
}

// Network Link Interface
export interface NetworkLink {
  id?: string;
  from: string;
  to: string;
  type: 'ethernet' | 'fiber' | 'trunk' | 'sdwan';
  speed: string;
  vlan?: string;
}

// Ping Result Interface
export interface PingResult {
  nodeId: string;
  status: StatusType;
  latency: number | null;
  packetLoss: number;
  lastCheck: number;
  history: number[];
}

// Timeline Entry Interface
export interface TimelineEntry {
  id: string;
  timestamp: number;
  action: string;
  description: string;
  icon: string;
  nodesSnapshot?: NetworkNode[];
  linksSnapshot?: NetworkLink[];
}

// Notification Types
export type NotificationType = 'success' | 'warning' | 'error' | 'info';

// Notification Interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  duration: number;
  read: boolean;
}

// Floor Tile Interface
export interface FloorTile {
  id: string;
  position: [number, number, number];
  size: [number, number];
  color: string;
  label?: string;
  buildingId?: string;
  floor?: number;
}

// Camera View Interface
export interface CameraView {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  icon: string;
  description: string;
}

// Building Configuration
export interface Building {
  id: string;
  name: string;
  position: Vector3;
  floors: number;
  color: string;
  nodes: NetworkNode[];
}

// Layout Configuration
export interface LayoutConfig {
  algorithm: 'grid' | 'byVlan' | 'byType' | 'hierarchical' | 'circular' | 'forceDirected';
  spacing: number;
  scope: 'perSite' | 'all';
}

// Spacing Configuration
export interface SpacingConfig {
  mode: 'horizontal' | 'vertical' | 'grid';
  horizontalSpacing: number;
  verticalSpacing: number;
}

// Auto-layout Algorithms
export type LayoutAlgorithm = 
  | 'grid'
  | 'byVlan'
  | 'byType'
  | 'hierarchical'
  | 'circular'
  | 'forceDirected';

// Transition Types
export type TransitionType = 'direct' | 'arc' | 'spiral' | 'zoom';
export type EasingType = 'linear' | 'easeInOut' | 'easeOut' | 'bounce' | 'elastic';

// Camera Transition Interface
export interface CameraTransition {
  type: TransitionType;
  easing: EasingType;
  duration: number;
}

// Media Export Configuration
export interface ExportConfig {
  format: 'png' | 'jpeg' | 'webp' | 'webm' | 'mp4';
  quality?: number; // 10-100 for images
  duration?: number; // seconds for videos
  fps?: number; // 15-60 for videos
}

// VR/AR Configuration
export interface VRConfig {
  enabled: boolean;
  mode: 'vr' | 'ar';
  eyeSeparation: number; // 50-80mm
  opacity: number; // 0-100%
}

// Network Discovery Configuration
export interface DiscoveryConfig {
  name: string;
  startIp: string;
  endIp: string;
  active: boolean;
}

// Discovered Device Interface
export interface DiscoveredDevice {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  os: string;
  selected: boolean;
}

// Site Configuration
export interface SiteConfig {
  name: string;
  ipRange: string;
  position: [number, number, number];
  floors: number;
  includeRouter: boolean;
  includeFirewall: boolean;
  switchCount: number;
  wifiCount: number;
  includeNas: boolean;
}

// Theme Configuration
export interface ThemeConfig {
  mode: 'day' | 'night';
  backgroundColor: string;
  textColor: string;
  ambientLight: number;
  gridColor: string;
}

// Ping Monitor Configuration
export interface PingMonitorConfig {
  pingMode: 'simulation' | 'real';
  pingInterval: number;
  pingTimeout?: number;
}

// UI State Interface
export interface UIState {
  showTimeline: boolean;
  showTable: boolean;
  showMiniMap: boolean;
  showFloorManager: boolean;
  showLayoutModal: boolean;
  showSpacingModal: boolean;
  showDiscoveryModal: boolean;
  showViewsModal: boolean;
  showExportModal: boolean;
  showXRModal: boolean;
  showShortcutsHelp: boolean;
  showConfigModal: boolean;
  showLegend: boolean;
  showNotificationCenter: boolean;
  showAddSiteModal: boolean;
  selectedNodeId: string | null;
  selectedNodes: string[];
}

// App State Interface
export interface AppState {
  nodes: NetworkNode[];
  links: NetworkLink[];
  pingResults: Map<string, PingResult>;
  isMonitoring: boolean;
  pingInterval: number;
  timeline: TimelineEntry[];
  currentTimelineIndex: number;
  notifications: Notification[];
  floorTiles: FloorTile[];
  buildings: Map<string, Building>;
  cameraViews: CameraView[];
  currentViewId: string | null;
  layoutConfig: LayoutConfig;
  spacingConfig: SpacingConfig;
  vrConfig: VRConfig;
  theme: ThemeConfig;
  uiState: UIState;
  discoveryConfigs: DiscoveryConfig[];
  discoveredDevices: DiscoveredDevice[];
  isRecording: boolean;
  recordingProgress: number;
}

// Equipment Model Configuration
export interface EquipmentModelConfig {
  baseColor: string;
  secondaryColor: string;
  ledColor: string;
  size: [number, number, number];
  hasRack: boolean;
  hasDisks: boolean;
  hasVents: boolean;
  hasAntenna: boolean;
  diskCount: number;
  ledPositions: [number, number, number][];
}

// VLAN Configuration
export interface VlanConfig {
  id: string | number;
  name: string;
  color: string;
  description: string;
}

// Color Mapping for VLANs
export const VLAN_COLORS: Record<string, string> = {
  'VLAN 100': '#4488ff',
  'VLAN 101': '#00aaff',
  'VLAN 200': '#44ff88',
  'VLAN 999': '#ff4444',
  'VLAN 998': '#ff6644',
  'VLAN 800': '#44dddd',
  'VLAN 1320': '#9333ea',
  'VLAN 801': '#44ddaa',
  'VLAN 1321': '#aa44dd',
  'HA Heartbeat': '#ffaa44',
  'SD-WAN': '#aaff44',
  'Trunk': '#ffffff',
};

// Site Colors
export const SITE_COLORS: Record<string, string> = {
  'site-principal': '#3b82f6',
  'site-distant': '#14b8a6',
  'pradoland-4': '#a855f7',
  'pradoland4': '#a855f7',
  'default': '#6b7280',
};

// Equipment Type Colors
export const EQUIPMENT_COLORS: Record<EquipmentType, string> = {
  router: '#f59e0b',
  switch: '#3b82f6',
  firewall: '#ef4444',
  server: '#1f2937',
  proxmox: '#f59e0b',
  vmware: '#3b82f6',
  nas: '#10b981',
  wifi: '#8b5cf6',
  dc: '#6b7280',
  veeam: '#06b6d4',
  vm: '#8b5cf6',
  docker: '#3b82f6',
  lxc: '#f59e0b',
};

// Equipment Type Labels
export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  router: 'Routeur',
  switch: 'Switch',
  firewall: 'Firewall',
  server: 'Serveur',
  proxmox: 'Proxmox',
  vmware: 'VMware ESXi',
  nas: 'NAS Synology',
  wifi: 'Point d\'accès WiFi',
  dc: 'Contrôleur de Domaine',
  veeam: 'Veeam Backup',
  vm: 'Machine Virtuelle',
  docker: 'Docker',
  lxc: 'LXC',
};

// Default Equipment Models
export const EQUIPMENT_MODELS: Record<EquipmentType, EquipmentModelConfig> = {
  router: {
    baseColor: '#f59e0b',
    secondaryColor: '#d97706',
    ledColor: '#059669',
    size: [1.2, 0.8, 1.5],
    hasRack: true,
    hasDisks: false,
    hasVents: true,
    hasAntenna: false,
    diskCount: 0,
    ledPositions: [[0.4, 0.3, 0.76], [0.4, 0.1, 0.76], [0.4, -0.1, 0.76], [0.4, -0.3, 0.76]],
  },
  switch: {
    baseColor: '#3b82f6',
    secondaryColor: '#2563eb',
    ledColor: '#059669',
    size: [1.5, 0.6, 1.2],
    hasRack: true,
    hasDisks: false,
    hasVents: true,
    hasAntenna: false,
    diskCount: 0,
    ledPositions: [[0.6, 0.2, 0.61], [0.6, 0, 0.61], [0.6, -0.2, 0.61]],
  },
  firewall: {
    baseColor: '#ef4444',
    secondaryColor: '#dc2626',
    ledColor: '#059669',
    size: [1.2, 0.8, 1.2],
    hasRack: true,
    hasDisks: false,
    hasVents: true,
    hasAntenna: false,
    diskCount: 0,
    ledPositions: [[0.4, 0.2, 0.61], [0.4, 0, 0.61], [0.4, -0.2, 0.61]],
  },
  server: {
    baseColor: '#1f2937',
    secondaryColor: '#111827',
    ledColor: '#3b82f6',
    size: [2, 1.2, 1.5],
    hasRack: true,
    hasDisks: true,
    hasVents: true,
    hasAntenna: false,
    diskCount: 4,
    ledPositions: [[0.8, 0.4, 0.76], [0.8, 0.2, 0.76], [0.8, 0, 0.76], [0.8, -0.2, 0.76], [0.8, -0.4, 0.76]],
  },
  proxmox: {
    baseColor: '#f59e0b',
    secondaryColor: '#d97706',
    ledColor: '#059669',
    size: [1.8, 1, 1.4],
    hasRack: true,
    hasDisks: true,
    hasVents: true,
    hasAntenna: false,
    diskCount: 3,
    ledPositions: [[0.7, 0.3, 0.71], [0.7, 0, 0.71], [0.7, -0.3, 0.71]],
  },
  vmware: {
    baseColor: '#3b82f6',
    secondaryColor: '#2563eb',
    ledColor: '#10b981',
    size: [1.8, 1, 1.4],
    hasRack: true,
    hasDisks: true,
    hasVents: true,
    hasAntenna: false,
    diskCount: 3,
    ledPositions: [[0.7, 0.3, 0.71], [0.7, 0, 0.71], [0.7, -0.3, 0.71]],
  },
  nas: {
    baseColor: '#10b981',
    secondaryColor: '#059669',
    ledColor: '#3b82f6',
    size: [1.4, 0.8, 1.2],
    hasRack: true,
    hasDisks: true,
    hasVents: true,
    hasAntenna: false,
    diskCount: 4,
    ledPositions: [[0.55, 0.25, 0.61], [0.55, 0.1, 0.61], [0.55, -0.1, 0.61], [0.55, -0.25, 0.61]],
  },
  wifi: {
    baseColor: '#8b5cf6',
    secondaryColor: '#7c3aed',
    ledColor: '#10b981',
    size: [0.8, 0.3, 0.8],
    hasRack: false,
    hasDisks: false,
    hasVents: false,
    hasAntenna: true,
    diskCount: 0,
    ledPositions: [[0, 0.15, 0]],
  },
  dc: {
    baseColor: '#6b7280',
    secondaryColor: '#4b5563',
    ledColor: '#3b82f6',
    size: [1.2, 0.8, 1],
    hasRack: true,
    hasDisks: true,
    hasVents: true,
    hasAntenna: false,
    diskCount: 2,
    ledPositions: [[0.4, 0.2, 0.51], [0.4, 0, 0.51], [0.4, -0.2, 0.51]],
  },
  veeam: {
    baseColor: '#06b6d4',
    secondaryColor: '#0891b2',
    ledColor: '#10b981',
    size: [1.2, 0.8, 1],
    hasRack: true,
    hasDisks: true,
    hasVents: true,
    hasAntenna: false,
    diskCount: 2,
    ledPositions: [[0.4, 0.2, 0.51], [0.4, 0, 0.51]],
  },
  vm: {
    baseColor: '#8b5cf6',
    secondaryColor: '#7c3aed',
    ledColor: '#10b981',
    size: [0.8, 0.5, 0.8],
    hasRack: false,
    hasDisks: false,
    hasVents: false,
    hasAntenna: false,
    diskCount: 0,
    ledPositions: [[0, 0.15, 0.41]],
  },
  docker: {
    baseColor: '#3b82f6',
    secondaryColor: '#2563eb',
    ledColor: '#10b981',
    size: [0.8, 0.5, 0.8],
    hasRack: false,
    hasDisks: false,
    hasVents: false,
    hasAntenna: false,
    diskCount: 0,
    ledPositions: [[0, 0.15, 0.41]],
  },
  lxc: {
    baseColor: '#f59e0b',
    secondaryColor: '#d97706',
    ledColor: '#10b981',
    size: [0.8, 0.5, 0.8],
    hasRack: false,
    hasDisks: false,
    hasVents: false,
    hasAntenna: false,
    diskCount: 0,
    ledPositions: [[0, 0.15, 0.41]],
  },
};

// Predefined Camera Views
export const PREDEFINED_VIEWS: CameraView[] = [
  {
    id: 'overview',
    name: 'Vue d\'ensemble',
    position: [0, 30, 40],
    target: [0, 0, 0],
    icon: '🌐',
    description: 'Vue globale de toute l\'infrastructure',
  },
  {
    id: 'main-site',
    name: 'Site Principal',
    position: [-5, 15, 20],
    target: [-5, 0, 0],
    icon: '🏢',
    description: 'Focus sur le site principal',
  },
  {
    id: 'remote-site',
    name: 'Site Distant',
    position: [28, 15, 20],
    target: [28, 0, 0],
    icon: '📡',
    description: 'Focus sur le site distant',
  },
  {
    id: 'pradoland4',
    name: 'Pradoland 4',
    position: [-32, 15, 20],
    target: [-32, 0, 0],
    icon: '🏭',
    description: 'Focus sur Pradoland 4',
  },
  {
    id: 'top-view',
    name: 'Vue de dessus',
    position: [0, 50, 0],
    target: [0, 0, 0],
    icon: '⬇️',
    description: 'Vue aérienne de toute l\'infrastructure',
  },
];

// Keyboard Shortcuts Configuration
export interface KeyboardShortcut {
  key: string;
  label: string;
  description: string;
  action: () => void;
  category: 'Navigation' | 'Camera' | 'Interface' | 'Monitoring' | 'Appearance' | 'Help';
}

// Default UI State
export const DEFAULT_UI_STATE: UIState = {
  showTimeline: false,
  showTable: false,
  showMiniMap: true,
  showFloorManager: false,
  showLayoutModal: false,
  showSpacingModal: false,
  showDiscoveryModal: false,
  showViewsModal: false,
  showExportModal: false,
  showXRModal: false,
  showShortcutsHelp: false,
  showConfigModal: false,
  showLegend: false,
  showNotificationCenter: false,
  showAddSiteModal: false,
  selectedNodeId: null,
  selectedNodes: [],
};

// Default Theme Configuration
export const DEFAULT_THEME: ThemeConfig = {
  mode: 'night',
  backgroundColor: '#030712',
  textColor: '#f9fafb',
  ambientLight: 0.3,
  gridColor: '#374151',
};

export const DAY_THEME: ThemeConfig = {
  mode: 'day',
  backgroundColor: '#f3f4f6',
  textColor: '#1f2937',
  ambientLight: 0.8,
  gridColor: '#d1d5db',
};

// Default Layout Configuration
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  algorithm: 'grid',
  spacing: 4,
  scope: 'all',
};

// Default Spacing Configuration
export const DEFAULT_SPACING_CONFIG: SpacingConfig = {
  mode: 'horizontal',
  horizontalSpacing: 20,
  verticalSpacing: 20,
};

// Default VR Configuration
export const DEFAULT_VR_CONFIG: VRConfig = {
  enabled: false,
  mode: 'vr',
  eyeSeparation: 65,
  opacity: 100,
};
