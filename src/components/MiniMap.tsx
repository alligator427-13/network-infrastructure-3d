// MiniMap Component - 2D SVG representation of the network

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { NetworkNode, NetworkLink, PingResult } from '../types';

interface MiniMapProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  pingResults: Map<string, PingResult>;
}

const MiniMap: React.FC<MiniMapProps> = ({
  nodes,
  links,
  selectedNodeId,
  onNodeClick,
  pingResults,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 220, height: 200 });

  // Calculate bounds of all nodes
  const bounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, node.position[0]);
      maxX = Math.max(maxX, node.position[0]);
      minZ = Math.min(minZ, node.position[2]);
      maxZ = Math.max(maxZ, node.position[2]);
    });

    return { minX, maxX, minZ, maxZ };
  }, [nodes]);

  // Calculate scale and offset to fit all nodes in the viewport
  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth || 220;
    const height = svgRef.current.clientHeight || 200;
    setViewport({ width, height });

    const dataWidth = bounds.maxX - bounds.minX;
    const dataHeight = bounds.maxZ - bounds.minZ;
    
    // Add padding
    const padding = 10;
    const scaleX = (width - padding * 2) / Math.max(dataWidth, 1);
    const scaleY = (height - padding * 2) / Math.max(dataHeight, 1);
    const newScale = Math.min(scaleX, scaleY, 1);
    
    const offsetX = width / 2 - (bounds.minX + dataWidth / 2) * newScale;
    const offsetY = height / 2 - (bounds.minZ + dataHeight / 2) * newScale;

    setScale(newScale);
    setOffset({ x: offsetX, y: offsetY });
  }, [bounds, svgRef.current]);

  // Convert 3D position to 2D SVG coordinates
  const toSvgCoords = useCallback((x: number, z: number) => {
    return {
      x: x * scale + offset.x,
      y: z * scale + offset.y,
    };
  }, [scale, offset]);

  // Get node color based on status
  const getNodeColor = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return '#6b7280';

    const result = pingResults.get(nodeId);
    const status = result?.status || node.status || 'offline';

    switch (status) {
      case 'online':
        return '#059669';
      case 'warning':
        return '#f59e0b';
      case 'offline':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }, [nodes, pingResults]);

  // Get building color
  const getBuildingColor = useCallback((node: NetworkNode) => {
    switch (node.buildingId) {
      case 'site-principal':
        return '#3b82f6';
      case 'site-distant':
        return '#14b8a6';
      case 'pradoland-4':
        return '#a855f7';
      default:
        return '#6b7280';
    }
  }, []);

  // Handle viewport click
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = e.clientX - svg.getBoundingClientRect().left;
    point.y = e.clientY - svg.getBoundingClientRect().top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const coords = toSvgCoords(node.position[0], node.position[2]);
      const dx = coords.x - point.x;
      const dy = coords.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 8; // Click radius
    });

    if (clickedNode) {
      onNodeClick(clickedNode.id);
    }
  }, [nodes, toSvgCoords, onNodeClick]);

  return (
    <div
      id="mini-map"
      className="flex flex-col"
    >
      <div className="p-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-white font-medium text-sm">🗺️ Mini-Carte</h3>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={handleClick}
        className="cursor-crosshair"
      >
        {/* Background */}
        <rect
          width="100%"
          height="100%"
          fill="#0f172a"
        />

        {/* Grid */}
        <defs>
          <pattern
            id="grid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="#1f2937"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#grid)"
        />

        {/* Links */}
        {links.map((link, index) => {
          const fromNode = nodes.find(n => n.id === link.from);
          const toNode = nodes.find(n => n.id === link.to);
          if (!fromNode || !toNode) return null;

          const fromCoords = toSvgCoords(fromNode.position[0], fromNode.position[2]);
          const toCoords = toSvgCoords(toNode.position[0], toNode.position[2]);

          // Get VLAN color
          let strokeColor = '#4488ff';
          switch (link.vlan) {
            case 'VLAN 100':
              strokeColor = '#4488ff';
              break;
            case 'VLAN 101':
              strokeColor = '#00aaff';
              break;
            case 'VLAN 200':
              strokeColor = '#44ff88';
              break;
            case 'VLAN 999':
              strokeColor = '#ff4444';
              break;
            case 'VLAN 998':
              strokeColor = '#ff6644';
              break;
            case 'VLAN 800':
              strokeColor = '#44dddd';
              break;
            case 'VLAN 1320':
              strokeColor = '#9333ea';
              break;
            default:
              strokeColor = '#6b7280';
          }

          return (
            <path
              key={`link-${index}`}
              d={`M ${fromCoords.x} ${fromCoords.y} Q ${(fromCoords.x + toCoords.x) / 2} ${(fromCoords.y + toCoords.y) / 2} ${toCoords.x} ${toCoords.y}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeOpacity="0.6"
              className="transition-opacity"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const coords = toSvgCoords(node.position[0], node.position[2]);
          const isSelected = selectedNodeId === node.id;
          const color = getNodeColor(node.id);
          const buildingColor = getBuildingColor(node);

          return (
            <g key={node.id} onClick={(e) => {
              e.stopPropagation();
              onNodeClick(node.id);
            }}>
              {/* Building background */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={isSelected ? 10 : 8}
                fill={buildingColor}
                opacity={0.3}
              />
              
              {/* Node circle */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={isSelected ? 6 : 4}
                fill={color}
                stroke={isSelected ? '#ffffff' : '#ffffff80'}
                strokeWidth={isSelected ? 2 : 1}
                className="transition-all"
              />
              
              {/* Status indicator */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={2}
                fill={color}
              />
              
              {/* Label (only for selected or on hover) */}
              {isSelected && (
                <text
                  x={coords.x + 10}
                  y={coords.y - 5}
                  fill="#ffffff"
                  fontSize="8"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  textAnchor="start"
                >
                  {node.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Viewport rectangle (showing visible area in main view) */}
        <rect
          x={viewport.width / 2 - 50}
          y={viewport.height / 2 - 30}
          width={100}
          height={60}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1"
          strokeDasharray="4"
        />
      </svg>
    </div>
  );
};

export default MiniMap;
