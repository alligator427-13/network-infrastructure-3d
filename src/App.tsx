// Network Infrastructure 3D - Main Application

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import type {
  NetworkNode,
  NetworkLink,
  PingResult,
  EquipmentType,
  CameraView,
  ThemeConfig,
  UIState,
  LayoutConfig,
  SpacingConfig,
  VRConfig,
} from './types';
import {
  VLAN_COLORS,
  SITE_COLORS,
  EQUIPMENT_COLORS,
  EQUIPMENT_LABELS,
  EQUIPMENT_MODELS,
  PREDEFINED_VIEWS,
  DEFAULT_THEME,
  DAY_THEME,
  DEFAULT_UI_STATE,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_SPACING_CONFIG,
  DEFAULT_VR_CONFIG,
} from './types';
import { getInitialData } from './data/initialData';
import { usePingMonitor } from './hooks/usePingMonitor';
import { useTimeline } from './hooks/useTimeline';
import { useNotifications } from './hooks/useNotifications';

// Import components
import Header from './components/Header';
import Timeline from './components/Timeline';
import TableView from './components/TableView';
import MiniMap from './components/MiniMap';
import NotificationCenter from './components/NotificationCenter';
import NotificationsToast from './components/NotificationsToast';
import FloorManagerModal from './components/FloorManagerModal';
import EditEquipmentModal from './components/EditEquipmentModal';
import AddSiteModal from './components/AddSiteModal';
import NetworkDiscoveryModal from './components/NetworkDiscoveryModal';
import AutoLayoutModal from './components/AutoLayoutModal';
import SiteSpacingManager from './components/SiteSpacingManager';
import MediaExportPanel from './components/MediaExportPanel';
import XRControls from './components/XRControls';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import ConfigModal from './components/ConfigModal';

// Equipment Node 3D Component
function EquipmentNode3D({
  node,
  isSelected,
  onClick,
  pingResult,
  theme,
}: {
  node: NetworkNode;
  isSelected: boolean;
  onClick: () => void;
  pingResult?: PingResult;
  theme: ThemeConfig;
}) {
  const { type, position, floor = 0, status } = node;
  const modelConfig = EQUIPMENT_MODELS[type] || EQUIPMENT_MODELS.server;
  const { baseColor, secondaryColor, ledColor, size, hasRack, hasDisks, hasVents, hasAntenna, diskCount, ledPositions } = modelConfig;
  const floorHeight = floor * 3;

  // Get actual status from ping result or node
  const actualStatus = pingResult?.status || status || 'offline';
  const statusColor = actualStatus === 'online' ? '#059669' :
                     actualStatus === 'warning' ? '#f59e0b' : '#ef4444';
  const latency = pingResult?.latency;

  // Animation for blinking LEDs
  const [ledIntensity, setLedIntensity] = useState(1);

  useFrame((state) => {
    // Blink LEDs
    const blinkSpeed = actualStatus === 'online' ? 0.5 : actualStatus === 'warning' ? 0.3 : 0.1;
    const newIntensity = Math.sin(state.clock.elapsedTime * blinkSpeed * Math.PI * 2) * 0.5 + 0.5;
    setLedIntensity(newIntensity * 2);
  });

  // Get node color based on selection and status
  const getNodeColor = () => {
    if (isSelected) {
      return '#ffff00'; // Yellow when selected
    }
    return baseColor;
  };

  return (
    <group
      position={[position[0], floorHeight, position[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      userData={{ nodeId: node.id }}
    >
      {/* Main body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getNodeColor()}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Front panel */}
      {hasRack && (
        <mesh position={[0, 0, size[2] / 2 + 0.01]} castShadow>
          <boxGeometry args={[size[0] - 0.1, size[1] - 0.1, 0.02]} />
          <meshStandardMaterial color={secondaryColor} metalness={0.8} roughness={0.2} />
        </mesh>
      )}

      {/* Decorative band */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[Math.max(size[0], size[2]) / 2 + 0.01, 0.05, 8, 48]} />
        <meshStandardMaterial color={ledColor} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* LEDs */}
      {ledPositions.map((ledPos, index) => (
        <mesh
          key={index}
          position={[ledPos[0] * size[0], ledPos[1] * size[1], ledPos[2] * size[2] + size[2] / 2 + 0.02]}
        >
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={ledIntensity}
          />
        </mesh>
      ))}

      {/* Disk bays */}
      {hasDisks && diskCount > 0 && (
        <group position={[0, 0, size[2] / 2 - 0.1]}>
          {Array.from({ length: diskCount }).map((_, i) => (
            <mesh
              key={i}
              position={[
                (i - diskCount / 2 + 0.5) * (size[0] / diskCount - 0.05),
                0,
                -0.2
              ]}
              castShadow
            >
              <boxGeometry args={[0.3, 0.2, 0.25]} />
              <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
              {/* Disk handle */}
              <mesh position={[0, 0, 0.13]}>
                <boxGeometry args={[0.15, 0.03, 0.03]} />
                <meshStandardMaterial color="#6b7280" />
              </mesh>
            </mesh>
          ))}
        </group>
      )}

      {/* Ventilation grills */}
      {hasVents && (
        <>
          <mesh position={[0, size[1] / 2 + 0.01, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[size[0] - 0.1, 0.02, size[2] - 0.1]} />
            <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, -size[1] / 2 - 0.01, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[size[0] - 0.1, 0.02, size[2] - 0.1]} />
            <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
          </mesh>
        </>
      )}

      {/* Antennas for WiFi */}
      {hasAntenna && (
        <group position={[0, size[1] / 2 + 0.2, 0]}>
          <mesh position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#ffffff" metalness={0.8} />
          </mesh>
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#ffffff" metalness={0.8} />
          </mesh>
          {/* WiFi waves animation */}
          <WiFiWaves position={[0, 0, 0]} color={ledColor} />
        </group>
      )}

      {/* Status indicator above the equipment */}
      <mesh position={[0, size[1] / 2 + 0.3, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={2}
        />
      </mesh>

      {/* Label */}
      <Html
        position={[0, size[1] / 2 + 0.5, 0]}
        center
        distanceFactor={15}
        sprite={true}
      >
        <div
          className="equipment-label"
          style={{
            background: theme.mode === 'night' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(243, 244, 246, 0.95)',
            color: theme.mode === 'night' ? '#f9fafb' : '#1f2937',
            border: `1px solid ${statusColor}`,
          }}
        >
          <div className="font-bold text-xs whitespace-nowrap">{node.name}</div>
          <div className="text-[10px] opacity-70">{node.ip}</div>
          {latency !== null && latency !== undefined && (
            <div className="text-[10px]" style={{ color: latency < 100 ? '#059669' : latency < 200 ? '#f59e0b' : '#ef4444' }}>
              {latency.toFixed(0)}ms
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// WiFi Waves Animation Component
function WiFiWaves({ position, color }: { position: [number, number, number], color: string }) {
  const wave1Ref = useRef<THREE.Mesh>(null);
  const wave2Ref = useRef<THREE.Mesh>(null);
  const wave3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (wave1Ref.current) {
      wave1Ref.current.scale.setScalar(1 + Math.sin(time * 2) * 0.3);
      (wave1Ref.current.material as THREE.MeshStandardMaterial).opacity = 0.5 + Math.sin(time * 2) * 0.3;
    }
    if (wave2Ref.current) {
      wave2Ref.current.scale.setScalar(1 + Math.sin(time * 1.5 + 1) * 0.3);
      (wave2Ref.current.material as THREE.MeshStandardMaterial).opacity = 0.5 + Math.sin(time * 1.5 + 1) * 0.3;
    }
    if (wave3Ref.current) {
      wave3Ref.current.scale.setScalar(1 + Math.sin(time * 1.2 + 2) * 0.3);
      (wave3Ref.current.material as THREE.MeshStandardMaterial).opacity = 0.5 + Math.sin(time * 1.2 + 2) * 0.3;
    }
  });

  return (
    <group position={position}>
      <mesh ref={wave1Ref} position={[0, 0, 0]}>
        <torusGeometry args={[0.3, 0.01, 8, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.8} emissive={color} />
      </mesh>
      <mesh ref={wave2Ref} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.01, 8, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} emissive={color} />
      </mesh>
      <mesh ref={wave3Ref} position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.3, 0.01, 8, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.4} emissive={color} />
      </mesh>
    </group>
  );
}

// Network Link Component
function NetworkLink3D({
  fromNode,
  toNode,
  link,
  theme,
}: {
  fromNode: NetworkNode;
  toNode: NetworkNode;
  link: NetworkLink;
  theme: ThemeConfig;
}) {
  const particleRef = useRef<THREE.Mesh>(null);

  // Get positions with floor height
  const fromFloor = fromNode.floor || 0;
  const toFloor = toNode.floor || 0;
  const fromY = fromFloor * 3 + 0.5;
  const toY = toFloor * 3 + 0.5;

  // Get VLAN color
  const vlanColor = link.vlan ? VLAN_COLORS[link.vlan] : VLAN_COLORS['Trunk'] || '#ffffff';

  // Create curve for the link
  const points = [
    new THREE.Vector3(fromNode.position[0], fromY, fromNode.position[2]),
    new THREE.Vector3(
      (fromNode.position[0] + toNode.position[0]) / 2,
      Math.max(fromY, toY) + 0.5,
      (fromNode.position[2] + toNode.position[2]) / 2
    ),
    new THREE.Vector3(toNode.position[0], toY, toNode.position[2]),
  ];

  const curve = new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);

  useFrame((state) => {
    if (particleRef.current) {
      const t = (state.clock.elapsedTime * 0.3) % 1;
      const point = curve.getPoint(t);
      particleRef.current.position.copy(point);
    }
  });

  return (
    <group>
      {/* Tube */}
      <mesh>
        <tubeGeometry args={[curve, 20, 0.03, 8, false]} />
        <meshStandardMaterial
          color={vlanColor}
          emissive={vlanColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={vlanColor}
          emissive={vlanColor}
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

// Floor Tile Component
function FloorTile3D({
  position,
  size,
  color,
  label,
  floor = 0,
}: {
  position: [number, number, number];
  size: [number, number];
  color: string;
  label?: string;
  floor?: number;
}) {
  const y = floor * 3;

  return (
    <group position={[position[0], y, position[2]]}>
      {/* Floor surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0], size[1]]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid lines */}
      <Grid
        args={[size[0], size[1]]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={color}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={color}
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* Label */}
      {label && (
        <Html position={[0, 0.01, 0]} center distanceFactor={15}>
          <div className="bg-gray-800/90 text-white px-2 py-1 rounded text-xs font-medium">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// Building Floors Component
function BuildingFloors3D({ nodes, theme }: { nodes: NetworkNode[]; theme: ThemeConfig }) {
  const sites = useMemo(() => {
    const siteMap = new Map<string, {
      nodes: NetworkNode[];
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
      floors: Set<number>;
    }>();

    nodes.forEach(node => {
      const buildingId = node.buildingId || 'default';
      if (!siteMap.has(buildingId)) {
        siteMap.set(buildingId, {
          nodes: [],
          minX: Infinity,
          maxX: -Infinity,
          minZ: Infinity,
          maxZ: -Infinity,
          floors: new Set<number>(),
        });
      }

      const site = siteMap.get(buildingId)!;
      site.nodes.push(node);
      site.minX = Math.min(site.minX, node.position[0]);
      site.maxX = Math.max(site.maxX, node.position[0]);
      site.minZ = Math.min(site.minZ, node.position[2]);
      site.maxZ = Math.max(site.maxZ, node.position[2]);
      if (node.floor !== undefined) {
        site.floors.add(node.floor);
      }
    });

    return siteMap;
  }, [nodes]);

  return (
    <>
      {Array.from(sites.entries()).map(([buildingId, site]) => {
        const siteColor = SITE_COLORS[buildingId as keyof typeof SITE_COLORS] || SITE_COLORS.default;
        const centerX = (site.minX + site.maxX) / 2;
        const centerZ = (site.minZ + site.maxZ) / 2;
        const width = Math.max(site.maxX - site.minX + 8, 10);
        const depth = Math.max(site.maxZ - site.minZ + 8, 10);
        const maxFloor = site.floors.size > 0 ? Math.max(...site.floors) : 0;

        return (
          <group key={buildingId}>
            {/* Main floor */}
            <FloorTile3D
              position={[centerX, 0, centerZ]}
              size={[width, depth]}
              color={siteColor}
              label={buildingId === 'site-principal' ? 'Site Principal' :
                    buildingId === 'site-distant' ? 'Site Distant' :
                    buildingId === 'pradoland-4' ? 'Pradoland 4' : buildingId}
            />

            {/* Additional floors */}
            {Array.from({ length: maxFloor }).map((_, floorIndex) => {
              const floorY = (floorIndex + 1) * 3;
              return (
                <group key={`floor-${buildingId}-${floorIndex}`}>
                  <FloorTile3D
                    position={[centerX, floorY, centerZ]}
                    size={[width, depth]}
                    color={siteColor}
                    label={`${floorIndex + 1}ème étage`}
                    floor={floorIndex + 1}
                  />

                  {/* Pillars at corners */}
                  {floorIndex === 0 && (
                    <>
                      <mesh position={[site.minX - 2, floorY / 2, site.minZ - 2]}>
                        <cylinderGeometry args={[0.15, 0.15, floorY, 8]} />
                        <meshStandardMaterial color={siteColor} transparent opacity={0.3} />
                      </mesh>
                      <mesh position={[site.maxX + 2, floorY / 2, site.minZ - 2]}>
                        <cylinderGeometry args={[0.15, 0.15, floorY, 8]} />
                        <meshStandardMaterial color={siteColor} transparent opacity={0.3} />
                      </mesh>
                      <mesh position={[site.minX - 2, floorY / 2, site.maxZ + 2]}>
                        <cylinderGeometry args={[0.15, 0.15, floorY, 8]} />
                        <meshStandardMaterial color={siteColor} transparent opacity={0.3} />
                      </mesh>
                      <mesh position={[site.maxX + 2, floorY / 2, site.maxZ + 2]}>
                        <cylinderGeometry args={[0.15, 0.15, floorY, 8]} />
                        <meshStandardMaterial color={siteColor} transparent opacity={0.3} />
                      </mesh>
                    </>
                  )}
                </group>
              );
            })}
          </group>
        );
      })}
    </>
  );
}

// Main 3D Scene Component
function Scene({
  nodes,
  links,
  pingResults,
  selectedNodeId,
  theme,
  onNodeClick,
}: {
  nodes: NetworkNode[];
  links: NetworkLink[];
  pingResults: Map<string, PingResult>;
  selectedNodeId: string | null;
  theme: ThemeConfig;
  onNodeClick: (nodeId: string) => void;
}) {
  const { scene } = useThree();

  // Set up scene background based on theme
  useEffect(() => {
    scene.background = new THREE.Color(theme.backgroundColor);
    scene.fog = new THREE.Fog(theme.backgroundColor, 30, 100);
  }, [theme, scene]);

  // Set up lighting
  useEffect(() => {
    // Remove existing lights
    scene.children = scene.children.filter(
      (child) => !(child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight)
    );

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(
      theme.mode === 'night' ? '#ffffff' : '#f3f4f6',
      theme.ambientLight
    );
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(
      theme.mode === 'night' ? '#ffffff' : '#f3f4f6',
      0.5
    );
    directionalLight.position.set(20, 40, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    return () => {
      scene.remove(ambientLight);
      scene.remove(directionalLight);
    };
  }, [theme, scene]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={theme.ambientLight} color={theme.mode === 'night' ? '#ffffff' : '#f3f4f6'} />
      <directionalLight
        position={[20, 40, 20]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} color="#3b82f6" intensity={0.3} />
      <pointLight position={[10, 10, 10]} color="#f59e0b" intensity={0.3} />

      {/* Grid */}
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={theme.gridColor}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={theme.gridColor}
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Building Floors */}
      <BuildingFloors3D nodes={nodes} theme={theme} />

      {/* Network Links */}
      {links.map((link, index) => {
        const fromNode = nodes.find(n => n.id === link.from);
        const toNode = nodes.find(n => n.id === link.to);
        if (!fromNode || !toNode) return null;
        return (
          <NetworkLink3D
            key={`link-${index}`}
            fromNode={fromNode}
            toNode={toNode}
            link={link}
            theme={theme}
          />
        );
      })}

      {/* Equipment Nodes */}
      {nodes.map((node) => (
        <EquipmentNode3D
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          onClick={() => onNodeClick(node.id)}
          pingResult={pingResults.get(node.id)}
          theme={theme}
        />
      ))}

      {/* Orbit Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2 + 0.1}
      />
    </>
  );
}

// Main App Component
function App() {
  const [nodes, setNodes] = useState<NetworkNode[]>(getInitialData().nodes);
  const [links, setLinks] = useState<NetworkLink[]>(getInitialData().links);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [uiState, setUiState] = useState<UIState>({ ...DEFAULT_UI_STATE, showAddSiteModal: false });
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(DEFAULT_LAYOUT_CONFIG);
  const [spacingConfig, setSpacingConfig] = useState<SpacingConfig>(DEFAULT_SPACING_CONFIG);
  const [vrConfig, setVrConfig] = useState<VRConfig>(DEFAULT_VR_CONFIG);
  const [cameraViews, setCameraViews] = useState<CameraView[]>(PREDEFINED_VIEWS);
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);

  // Custom hooks
  const {
    pingResults,
    isMonitoring,
    setIsMonitoring,
    config: pingConfig,
    updateConfig: updatePingConfig,
    forcePing,
    getStats,
    isNodeOffline,
    getNodeLatency,
    getNodeStatus,
  } = usePingMonitor(nodes);

  const {
    history,
    currentIndex,
    addEntry,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getCurrentState,
    getFormattedEntries,
    resetTimeline,
  } = useTimeline(nodes, links);

  const {
    notifications,
    toastNotifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll: clearAllNotifications,
    clearToasts,
    unreadCount,
    toastCount,
    getByType,
    getRecent,
  } = useNotifications();

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('network-infra-theme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setTheme(parsedTheme);
      } catch (e) {
        console.error('Failed to parse saved theme:', e);
      }
    }

    const savedView = localStorage.getItem('network-infra-current-view');
    if (savedView) {
      setCurrentViewId(savedView);
    }
  }, []);

  // Save theme to localStorage when changed
  useEffect(() => {
    localStorage.setItem('network-infra-theme', JSON.stringify(theme));
    document.body.className = theme.mode === 'night' ? 'night-theme' : 'day-theme';
  }, [theme]);

  // Save current view to localStorage
  useEffect(() => {
    if (currentViewId) {
      localStorage.setItem('network-infra-current-view', currentViewId);
    }
  }, [currentViewId]);

  // Monitor offline nodes and show notifications
  useEffect(() => {
    nodes.forEach(node => {
      const result = pingResults.get(node.id);
      if (result && result.status === 'offline') {
        // Only show notification if node was previously online
        addNotification(
          'error',
          'Équipement hors ligne',
          `❌ Équipement hors ligne - ${node.name} (${node.ip}) ne répond plus`,
          0 // Persistent notification
        );
      }
    });
  }, [pingResults, nodes, addNotification]);

  // Handle node selection
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
    setSelectedNodes(prev =>
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
    );
  }, []);

  // Handle node deletion
  const handleDeleteNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newNodes = nodes.filter(n => n.id !== nodeId);
    const newLinks = links.filter(l => l.from !== nodeId && l.to !== nodeId);

    addEntry(
      'Suppression',
      `Équipement supprimé: ${node.name} (${node.ip})`,
      '🗑️',
      newNodes,
      newLinks
    );

    setNodes(newNodes);
    setLinks(newLinks);
    setSelectedNodeId(null);

    addNotification(
      'success',
      'Équipement supprimé',
      `L'équipement ${node.name} a été supprimé avec succès.`
    );
  }, [nodes, links, addEntry, addNotification]);

  // Handle node update
  const handleUpdateNode = useCallback((updatedNode: NetworkNode) => {
    const oldNode = nodes.find(n => n.id === updatedNode.id);
    if (!oldNode) return;

    const newNodes = nodes.map(n => n.id === updatedNode.id ? updatedNode : n);

    addEntry(
      'Modification',
      `Équipement modifié: ${oldNode.name} → ${updatedNode.name}`,
      '✏️',
      newNodes,
      links
    );

    setNodes(newNodes);

    addNotification(
      'success',
      'Équipement modifié',
      `L'équipement ${updatedNode.name} a été modifié avec succès.`
    );
  }, [nodes, links, addEntry, addNotification]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = theme.mode === 'night' ? DAY_THEME : DEFAULT_THEME;
    setTheme(newTheme);

    addNotification(
      'info',
      'Thème changé',
      `Thème passé en mode ${newTheme.mode === 'night' ? 'nuit' : 'jour'}`
    );
  }, [theme, addNotification]);

  // Get ping statistics
  const pingStats = getStats();

  // Memoized node counts by status
  const nodeCounts = useMemo(() => {
    const counts = { online: 0, warning: 0, offline: 0 };
    nodes.forEach(node => {
      const status = pingResults.get(node.id)?.status || node.status || 'offline';
      counts[status]++;
    });
    return counts;
  }, [nodes, pingResults]);

  return (
    <div className="App" style={{ height: '100vh', width: '100vw' }}>
      {/* Header */}
      <Header
        nodeCount={nodes.length}
        linkCount={links.length}
        pingStats={pingStats}
        theme={theme}
        toggleTheme={toggleTheme}
        onTimelineToggle={() => setUiState(prev => ({ ...prev, showTimeline: !prev.showTimeline }))}
        onTableToggle={() => setUiState(prev => ({ ...prev, showTable: !prev.showTable }))}
        onMiniMapToggle={() => setUiState(prev => ({ ...prev, showMiniMap: !prev.showMiniMap }))}
        onFloorManagerToggle={() => setUiState(prev => ({ ...prev, showFloorManager: !prev.showFloorManager }))}
        onLayoutToggle={() => setUiState(prev => ({ ...prev, showLayoutModal: !prev.showLayoutModal }))}
        onSpacingToggle={() => setUiState(prev => ({ ...prev, showSpacingModal: !prev.showSpacingModal }))}
        onDiscoveryToggle={() => setUiState(prev => ({ ...prev, showDiscoveryModal: !prev.showDiscoveryModal }))}
        onViewsToggle={() => setUiState(prev => ({ ...prev, showViewsModal: !prev.showViewsModal }))}
        onExportToggle={() => setUiState(prev => ({ ...prev, showExportModal: !prev.showExportModal }))}
        onXRToggle={() => setUiState(prev => ({ ...prev, showXRModal: !prev.showXRModal }))}
        onShortcutsToggle={() => setUiState(prev => ({ ...prev, showShortcutsHelp: !prev.showShortcutsHelp }))}
        onConfigToggle={() => setUiState(prev => ({ ...prev, showConfigModal: !prev.showConfigModal }))}
        onLegendToggle={() => setUiState(prev => ({ ...prev, showLegend: !prev.showLegend }))}
        onNotificationToggle={() => setUiState(prev => ({ ...prev, showNotificationCenter: !prev.showNotificationCenter }))}
        onAddEquipment={() => {}}
        onAddSite={() => setUiState(prev => ({ ...prev, showAddSiteModal: true }))}
        unreadCount={unreadCount()}
        isMonitoring={isMonitoring}
        setIsMonitoring={setIsMonitoring}
      />

      {/* Toast Notifications */}
      <NotificationsToast
        notifications={toastNotifications}
        onRemove={removeNotification}
        onMarkAsRead={markAsRead}
      />

      {/* 3D Canvas */}
      <div id="canvas-container">
        <Canvas
          shadows
          camera={{ position: [0, 20, 40], fov: 60, near: 0.1, far: 1000 }}
          gl={{ antialias: true, alpha: vrConfig.enabled && vrConfig.mode === 'ar' }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <Scene
              nodes={nodes}
              links={links}
              pingResults={pingResults}
              selectedNodeId={selectedNodeId}
              theme={theme}
              onNodeClick={handleNodeClick}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Timeline Panel */}
      {uiState.showTimeline && (
        <Timeline
          entries={getFormattedEntries()}
          canUndo={canUndo()}
          canRedo={canRedo()}
          onUndo={undo}
          onRedo={redo}
          onClear={clearHistory}
        />
      )}

      {/* Table View Panel */}
      {uiState.showTable && (
        <TableView
          nodes={nodes}
          onSelectNode={handleNodeClick}
          onDeleteNode={handleDeleteNode}
          onUpdateNode={handleUpdateNode}
          selectedNodeIds={selectedNodes}
          pingResults={pingResults}
        />
      )}

      {/* Mini Map */}
      {uiState.showMiniMap && (
        <MiniMap
          nodes={nodes}
          links={links}
          selectedNodeId={selectedNodeId}
          onNodeClick={handleNodeClick}
          pingResults={pingResults}
        />
      )}

      {/* Notification Center */}
      {uiState.showNotificationCenter && (
        <NotificationCenter
          notifications={notifications}
          onRemove={removeNotification}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearAll={clearAllNotifications}
          unreadCount={unreadCount()}
        />
      )}

      {/* Floor Manager Modal */}
      {uiState.showFloorManager && (
        <FloorManagerModal
          nodes={nodes}
          onClose={() => setUiState(prev => ({ ...prev, showFloorManager: false }))}
        />
      )}

      {/* Edit Equipment Modal */}
      {selectedNodeId && (
        <EditEquipmentModal
          node={nodes.find(n => n.id === selectedNodeId)!}
          onClose={() => setSelectedNodeId(null)}
          onSave={handleUpdateNode}
          onDelete={handleDeleteNode}
        />
      )}

      {/* Add Site Modal */}
      {uiState.showAddSiteModal && (
        <AddSiteModal
          onClose={() => setUiState(prev => ({ ...prev, showAddSiteModal: false }))}
          onAddSite={(siteNodes: NetworkNode[], siteLinks: NetworkLink[]) => {
            setNodes(prev => [...prev, ...siteNodes]);
            setLinks(prev => [...prev, ...siteLinks]);
            addNotification('success', 'Site ajouté', 'Le nouveau site a été ajouté avec succès.');
          }}
        />
      )}

      {/* Network Discovery Modal */}
      {uiState.showDiscoveryModal && (
        <NetworkDiscoveryModal
          onClose={() => setUiState(prev => ({ ...prev, showDiscoveryModal: false }))}
          onDiscover={(devices) => {
            // Add discovered devices as nodes
            const newNodes = devices.map((device, index) => ({
              id: `discovered-${Date.now()}-${index}`,
              name: device.hostname || `Unknown-${index}`,
              type: 'server' as EquipmentType,
              ip: device.ip,
              vlan: 'VLAN 100',
              subnet: '10.10.10.0/24',
              status: 'online' as const,
              position: [(Math.random() - 0.5) * 50, 0, (Math.random() - 0.5) * 50],
              description: `Discovered: ${device.vendor || 'Unknown'}`,
              details: { vendor: device.vendor, os: device.os },
              floor: 0,
              buildingId: 'site-principal',
            }));

            setNodes(prev => [...prev, ...newNodes] as NetworkNode[]);
            addNotification('success', 'Périphériques découverts', `${newNodes.length} nouveaux périphériques ont été ajoutés.`);
          }}
        />
      )}

      {/* Auto Layout Modal */}
      {uiState.showLayoutModal && (
        <AutoLayoutModal
          nodes={nodes}
          links={links}
          config={layoutConfig}
          onClose={() => setUiState(prev => ({ ...prev, showLayoutModal: false }))}
          onApply={(newNodes, newConfig) => {
            addEntry(
              'Auto-layout',
              `Disposition automatique appliquée: ${newConfig.algorithm}`,
              '🎨',
              newNodes,
              links
            );
            setNodes(newNodes);
            setLayoutConfig(newConfig);
            addNotification('success', 'Auto-layout appliqué', 'La disposition automatique a été appliquée.');
          }}
        />
      )}

      {/* Site Spacing Manager */}
      {uiState.showSpacingModal && (
        <SiteSpacingManager
          nodes={nodes}
          config={spacingConfig}
          onClose={() => setUiState(prev => ({ ...prev, showSpacingModal: false }))}
          onApply={(newNodes, newConfig) => {
            setNodes(newNodes);
            setSpacingConfig(newConfig);
            addNotification('success', 'Espacement appliqué', 'L\'espacement des sites a été ajusté.');
          }}
        />
      )}

      {/* Media Export Panel */}
      {uiState.showExportModal && (
        <MediaExportPanel
          onClose={() => setUiState(prev => ({ ...prev, showExportModal: false }))}
        />
      )}

      {/* XR Controls */}
      {uiState.showXRModal && (
        <XRControls
          config={vrConfig}
          onClose={() => setUiState(prev => ({ ...prev, showXRModal: false }))}
          onUpdate={(newConfig) => setVrConfig(newConfig)}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      {uiState.showShortcutsHelp && (
        <KeyboardShortcutsHelp
          onClose={() => setUiState(prev => ({ ...prev, showShortcutsHelp: false }))}
        />
      )}

      {/* Config Modal */}
      {uiState.showConfigModal && (
        <ConfigModal
          pingConfig={pingConfig}
          updatePingConfig={updatePingConfig}
          isMonitoring={isMonitoring}
          setIsMonitoring={setIsMonitoring}
          theme={theme}
          toggleTheme={toggleTheme}
          onClose={() => setUiState(prev => ({ ...prev, showConfigModal: false }))}
        />
      )}

      {/* Node Info Panel */}
      {selectedNodeId && (
        <div
          className="panel"
          style={{
            position: 'fixed',
            bottom: 0,
            left: uiState.showMiniMap ? 220 : 0,
            width: 320,
            height: 200,
            zIndex: 100,
          }}
        >
          <div className="panel-header">
            <h3 className="text-white font-semibold">Informations sur l'équipement</h3>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="panel-body scrollbar-thin">
            {(() => {
              const node = nodes.find(n => n.id === selectedNodeId);
              if (!node) return null;
              const pingResult = pingResults.get(node.id);
              const status = pingResult?.status || node.status || 'offline';
              const statusColor = status === 'online' ? 'bg-green-500' :
                                  status === 'warning' ? 'bg-yellow-500' : 'bg-red-500';
              const typeLabel = EQUIPMENT_LABELS[node.type] || node.type;

              return (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`status-indicator ${statusColor}`}></span>
                      <span className="text-white font-medium">{node.name}</span>
                    </div>
                    <div className="text-gray-400 text-sm">{typeLabel}</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">IP:</span>
                      <span className="text-white">{node.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">VLAN:</span>
                      <span className="text-white">{node.vlan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Statut:</span>
                      <span className={`text-white ${status === 'online' ? 'text-green-400' : status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {status === 'online' ? '🟢 En ligne' : status === 'warning' ? '🟡 Attention' : '🔴 Hors ligne'}
                      </span>
                    </div>
                    {pingResult?.latency && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Latence:</span>
                        <span className="text-white">{pingResult.latency.toFixed(0)}ms</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Étage:</span>
                      <span className="text-white">{node.floor || 0}ème</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bâtiment:</span>
                      <span className="text-white">{node.buildingId || 'Principal'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setUiState(prev => ({ ...prev, showEditModal: true }))}
                      className="btn-secondary text-xs px-3 py-1"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="btn-danger text-xs px-3 py-1"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Legend Panel */}
      {uiState.showLegend && (
        <div
          className="panel"
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: 320,
            height: 200,
            zIndex: 100,
          }}
        >
          <div className="panel-header">
            <h3 className="text-white font-semibold">Légende</h3>
          </div>
          <div className="panel-body scrollbar-thin">
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Statut</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="status-indicator bg-green-500"></span>
                    <span className="text-gray-300 text-sm">En ligne (&lt; 100ms)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-indicator bg-yellow-500"></span>
                    <span className="text-gray-300 text-sm">Attention (100-250ms)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-indicator bg-red-500"></span>
                    <span className="text-gray-300 text-sm">Hors ligne (timeout)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Sites</h4>
                <div className="space-y-2">
                  {Object.entries(SITE_COLORS).map(([id, color]) => (
                    <div key={id} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      ></span>
                      <span className="text-gray-300 text-sm">
                        {id === 'site-principal' ? 'Site Principal' :
                         id === 'site-distant' ? 'Site Distant' :
                         id === 'pradoland-4' ? 'Pradoland 4' : id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Types d'équipements</h4>
                <div className="space-y-1">
                  {Object.entries(EQUIPMENT_COLORS).slice(0, 5).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      ></span>
                      <span className="text-gray-300 text-xs">
                        {EQUIPMENT_LABELS[type as EquipmentType] || type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
