// Auto Layout Modal Component

import { useState, useCallback, useMemo } from 'react';
import { NetworkNode, NetworkLink, LayoutConfig, LayoutAlgorithm } from '../types';

interface AutoLayoutModalProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  config: LayoutConfig;
  onClose: () => void;
  onApply: (nodes: NetworkNode[], config: LayoutConfig) => void;
}

const layoutAlgorithms: { id: LayoutAlgorithm; name: string; description: string }[] = [
  { id: 'grid', name: 'Grille', description: 'Disposition uniforme en grille' },
  { id: 'byVlan', name: 'Par VLAN', description: 'Regroupement par sous-réseau' },
  { id: 'byType', name: 'Par Type', description: 'Regroupement par catégorie d\'équipement' },
  { id: 'hierarchical', name: 'Hiérarchique', description: 'Core → Distribution → Access' },
  { id: 'circular', name: 'Circulaire', description: 'Disposition en cercle' },
  { id: 'forceDirected', name: 'Force-directed', description: 'Basé sur les connexions' },
];

const scopeOptions = [
  { id: 'all', name: 'Tous les équipements', description: 'Réorganise tous les équipements' },
  { id: 'perSite', name: 'Par site', description: 'Réorganise à l\'intérieur de chaque site séparément' },
];

const AutoLayoutModal: React.FC<AutoLayoutModalProps> = ({
  nodes,
  links,
  config,
  onClose,
  onApply,
}) => {
  const [currentConfig, setCurrentConfig] = useState<LayoutConfig>(config);
  const [isApplying, setIsApplying] = useState(false);

  // Apply the selected layout algorithm
  const applyLayout = useCallback(() => {
    setIsApplying(true);

    // Simulate layout calculation with animation
    setTimeout(() => {
      const newNodes = applyLayoutAlgorithm(nodes, links, currentConfig);
      onApply(newNodes, currentConfig);
      setIsApplying(false);
    }, 500);
  }, [nodes, links, currentConfig, onApply]);

  // Apply specific layout algorithm
  const applyLayoutAlgorithm = (
    nodes: NetworkNode[],
    links: NetworkLink[],
    config: LayoutConfig
  ): NetworkNode[] => {
    const newNodes = [...nodes];
    const spacing = config.spacing;

    switch (config.algorithm) {
      case 'grid':
        return applyGridLayout(newNodes, spacing, config.scope);

      case 'byVlan':
        return applyVlanLayout(newNodes, spacing, config.scope);

      case 'byType':
        return applyTypeLayout(newNodes, spacing, config.scope);

      case 'hierarchical':
        return applyHierarchicalLayout(newNodes, links, spacing, config.scope);

      case 'circular':
        return applyCircularLayout(newNodes, spacing, config.scope);

      case 'forceDirected':
        return applyForceDirectedLayout(newNodes, links, spacing, config.scope);

      default:
        return newNodes;
    }
  };

  // Grid Layout
  const applyGridLayout = (
    nodes: NetworkNode[],
    spacing: number,
    scope: 'all' | 'perSite'
  ): NetworkNode[] => {
    if (scope === 'perSite') {
      // Group by building
      const buildings = new Map<string, NetworkNode[]>();
      nodes.forEach(node => {
        const buildingId = node.buildingId || 'default';
        if (!buildings.has(buildingId)) {
          buildings.set(buildingId, []);
        }
        buildings.get(buildingId)!.push(node);
      });

      // Apply grid layout per building
      const newNodes = [...nodes];
      buildings.forEach((buildingNodes, buildingId) => {
        const sortedNodes = [...buildingNodes].sort((a, b) => a.name.localeCompare(b.name));
        sortedNodes.forEach((node, index) => {
          const row = Math.floor(index / Math.ceil(Math.sqrt(sortedNodes.length)));
          const col = index % Math.ceil(Math.sqrt(sortedNodes.length));
          
          // Find building center
          const buildingCenter = {
            x: sortedNodes.reduce((sum, n) => sum + n.position[0], 0) / sortedNodes.length,
            z: sortedNodes.reduce((sum, n) => sum + n.position[2], 0) / sortedNodes.length,
          };

          const newX = buildingCenter.x - (sortedNodes.length / 2) + col * spacing;
          const newZ = buildingCenter.z - (sortedNodes.length / 2) + row * spacing;
          
          const nodeIndex = newNodes.findIndex(n => n.id === node.id);
          if (nodeIndex !== -1) {
            newNodes[nodeIndex] = {
              ...node,
              position: [newX, node.position[1], newZ],
            };
          }
        });
      });
      return newNodes;
    }

    // Apply grid layout to all nodes
    const sortedNodes = [...nodes].sort((a, b) => a.name.localeCompare(b.name));
    return sortedNodes.map((node, index) => {
      const row = Math.floor(index / Math.ceil(Math.sqrt(sortedNodes.length)));
      const col = index % Math.ceil(Math.sqrt(sortedNodes.length));
      return {
        ...node,
        position: [col * spacing, node.position[1], row * spacing],
      };
    });
  };

  // VLAN Layout
  const applyVlanLayout = (
    nodes: NetworkNode[],
    spacing: number,
    scope: 'all' | 'perSite'
  ): NetworkNode[] => {
    // Group by VLAN
    const vlans = new Map<string, NetworkNode[]>();
    nodes.forEach(node => {
      const vlan = node.vlan || 'default';
      if (!vlans.has(vlan)) {
        vlans.set(vlan, []);
      }
      vlans.get(vlan)!.push(node);
    });

    const newNodes = [...nodes];
    let currentX = 0;

    vlans.forEach((vlanNodes, vlan) => {
      const sortedNodes = [...vlanNodes].sort((a, b) => a.name.localeCompare(b.name));
      sortedNodes.forEach((node, index) => {
        const nodeIndex = newNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          newNodes[nodeIndex] = {
            ...node,
            position: [currentX + index * spacing, node.position[1], 0],
          };
        }
      });
      currentX += (sortedNodes.length + 1) * spacing;
    });

    return newNodes;
  };

  // Type Layout
  const applyTypeLayout = (
    nodes: NetworkNode[],
    spacing: number,
    scope: 'all' | 'perSite'
  ): NetworkNode[] => {
    // Group by type
    const types = new Map<string, NetworkNode[]>();
    nodes.forEach(node => {
      const type = node.type;
      if (!types.has(type)) {
        types.set(type, []);
      }
      types.get(type)!.push(node);
    });

    const newNodes = [...nodes];
    let currentX = 0;

    types.forEach((typeNodes, type) => {
      const sortedNodes = [...typeNodes].sort((a, b) => a.name.localeCompare(b.name));
      sortedNodes.forEach((node, index) => {
        const nodeIndex = newNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          newNodes[nodeIndex] = {
            ...node,
            position: [currentX + index * spacing, node.position[1], 0],
          };
        }
      });
      currentX += (sortedNodes.length + 1) * spacing;
    });

    return newNodes;
  };

  // Hierarchical Layout
  const applyHierarchicalLayout = (
    nodes: NetworkNode[],
    links: NetworkLink[],
    spacing: number,
    scope: 'all' | 'perSite'
  ): NetworkNode[] => {
    // Identify core, distribution, and access nodes
    const coreTypes = new Set(['router', 'firewall']);
    const distributionTypes = new Set(['switch']);
    const accessTypes = new Set(['wifi', 'nas', 'server', 'dc', 'veeam', 'proxmox', 'vmware']);

    const coreNodes = nodes.filter(n => coreTypes.has(n.type));
    const distributionNodes = nodes.filter(n => distributionTypes.has(n.type));
    const accessNodes = nodes.filter(n => accessTypes.has(n.type));

    const newNodes = [...nodes];

    // Position core nodes at the center
    coreNodes.forEach((node, index) => {
      const nodeIndex = newNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        newNodes[nodeIndex] = {
          ...node,
          position: [index * spacing * 3, node.position[1], 0],
        };
      }
    });

    // Position distribution nodes around core
    distributionNodes.forEach((node, index) => {
      const nodeIndex = newNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        newNodes[nodeIndex] = {
          ...node,
          position: [index * spacing * 2, node.position[1], spacing * 2],
        };
      }
    });

    // Position access nodes around distribution
    accessNodes.forEach((node, index) => {
      const nodeIndex = newNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        newNodes[nodeIndex] = {
          ...node,
          position: [index * spacing, node.position[1], spacing * 4],
        };
      }
    });

    return newNodes;
  };

  // Circular Layout
  const applyCircularLayout = (
    nodes: NetworkNode[],
    spacing: number,
    scope: 'all' | 'perSite'
  ): NetworkNode[] => {
    const newNodes = [...nodes];
    const centerX = nodes.reduce((sum, n) => sum + n.position[0], 0) / nodes.length;
    const centerZ = nodes.reduce((sum, n) => sum + n.position[2], 0) / nodes.length;
    const radius = Math.max(spacing * nodes.length / (2 * Math.PI), 10);

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2;
      const nodeIndex = newNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        newNodes[nodeIndex] = {
          ...node,
          position: [
            centerX + Math.cos(angle) * radius,
            node.position[1],
            centerZ + Math.sin(angle) * radius,
          ],
        };
      }
    });

    return newNodes;
  };

  // Force-directed Layout (simplified simulation)
  const applyForceDirectedLayout = (
    nodes: NetworkNode[],
    links: NetworkLink[],
    spacing: number,
    scope: 'all' | 'perSite'
  ): NetworkNode[] => {
    // This is a simplified force-directed layout
    // In a real implementation, we would use a proper force-directed algorithm
    const newNodes = [...nodes];

    // Create a map of connected nodes
    const connections = new Map<string, Set<string>>();
    links.forEach(link => {
      if (!connections.has(link.from)) {
        connections.set(link.from, new Set());
      }
      if (!connections.has(link.to)) {
        connections.set(link.to, new Set());
      }
      connections.get(link.from)!.add(link.to);
      connections.get(link.to)!.add(link.from);
    });

    // Position nodes based on connections
    // Start with a grid and then adjust based on connections
    const sortedNodes = [...nodes].sort((a, b) => {
      const aConnections = connections.get(a.id)?.size || 0;
      const bConnections = connections.get(b.id)?.size || 0;
      return bConnections - aConnections; // More connected nodes first
    });

    sortedNodes.forEach((node, index) => {
      const row = Math.floor(index / Math.ceil(Math.sqrt(sortedNodes.length)));
      const col = index % Math.ceil(Math.sqrt(sortedNodes.length));
      const nodeIndex = newNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        newNodes[nodeIndex] = {
          ...node,
          position: [col * spacing * 1.5, node.position[1], row * spacing * 1.5],
        };
      }
    });

    return newNodes;
  };

  // Get preview of the layout
  const previewNodes = useMemo(() => {
    return applyLayoutAlgorithm(nodes, links, currentConfig);
  }, [nodes, links, currentConfig]);

  return (
    <div className="modal-overlay flex items-center justify-center p-4">
      <div className="modal-content w-full max-w-2xl">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            🎨 Auto-Layout
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Algorithm Selection */}
          <div>
            <h3 className="text-white font-medium mb-3">Algorithme de disposition</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {layoutAlgorithms.map(algorithm => (
                <button
                  key={algorithm.id}
                  onClick={() => setCurrentConfig(prev => ({ ...prev, algorithm: algorithm.id }))}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    currentConfig.algorithm === algorithm.id
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-white">{algorithm.name}</div>
                  <div className="text-xs text-gray-400">{algorithm.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <h3 className="text-white font-medium mb-3">Portée</h3>
            <div className="grid grid-cols-2 gap-2">
              {scopeOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setCurrentConfig(prev => ({ ...prev, scope: option.id as 'all' | 'perSite' }))}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    currentConfig.scope === option.id
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-white">{option.name}</div>
                  <div className="text-xs text-gray-400">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Spacing Configuration */}
          <div>
            <h3 className="text-white font-medium mb-3">Espacement</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={currentConfig.spacing}
                onChange={(e) => setCurrentConfig(prev => ({ ...prev, spacing: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <span className="text-white text-sm w-16 text-center">{currentConfig.spacing} unités</span>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium mb-2">Prévisualisation</h3>
            <div className="text-xs text-gray-400 mb-2">
              {previewNodes.length} équipements seront repositionnés
            </div>
            <div className="relative w-full h-40 bg-gray-900/50 rounded border border-gray-700 overflow-hidden">
              {/* Simple 2D preview */}
              <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                {/* Background */}
                <rect width="100%" height="100%" fill="#0f172a" />
                
                {/* Grid */}
                <defs>
                  <pattern id="preview-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f2937" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#preview-grid)" />

                {/* Nodes */}
                {previewNodes.map((node, index) => {
                  // Scale down positions for preview
                  const x = (node.position[0] / 10) + 200;
                  const y = (node.position[2] / 10) + 100;
                  
                  // Get color based on type
                  let color = '#3b82f6';
                  switch (node.type) {
                    case 'router': color = '#f59e0b'; break;
                    case 'switch': color = '#3b82f6'; break;
                    case 'firewall': color = '#ef4444'; break;
                    case 'wifi': color = '#8b5cf6'; break;
                    case 'nas': color = '#10b981'; break;
                    case 'server': color = '#6b7280'; break;
                    case 'dc': color = '#9ca3af'; break;
                    case 'veeam': color = '#06b6d4'; break;
                  }

                  return (
                    <circle
                      key={node.id}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={applyLayout}
            disabled={isApplying}
            className={`px-4 py-2 rounded transition-colors ${
              isApplying
                ? 'bg-blue-600/30 text-blue-400/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isApplying ? 'Application...' : '✓ Appliquer la disposition'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoLayoutModal;
