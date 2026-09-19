// Site Spacing Manager Component

import { useState, useCallback, useMemo } from 'react';
import type { NetworkNode, SpacingConfig } from '../types';

interface SiteSpacingManagerProps {
  nodes: NetworkNode[];
  config: SpacingConfig;
  onClose: () => void;
  onApply: (nodes: NetworkNode[], config: SpacingConfig) => void;
}

const spacingModes = [
  { id: 'horizontal' as const, name: 'Horizontal', description: 'Espacement horizontal uniquement' },
  { id: 'vertical' as const, name: 'Vertical', description: 'Espacement vertical uniquement' },
  { id: 'grid' as const, name: 'Grille', description: 'Espacement en grille 2D' },
];

const SiteSpacingManager: React.FC<SiteSpacingManagerProps> = ({
  nodes,
  config,
  onClose,
  onApply,
}) => {
  const [currentConfig, setCurrentConfig] = useState<SpacingConfig>(config);
  const [isApplying, setIsApplying] = useState(false);

  // Get sites from nodes
  const sites = useMemo(() => {
    const siteMap = new Map<string, NetworkNode[]>();
    nodes.forEach(node => {
      const buildingId = node.buildingId || 'default';
      if (!siteMap.has(buildingId)) {
        siteMap.set(buildingId, []);
      }
      siteMap.get(buildingId)!.push(node);
    });
    return Array.from(siteMap.entries()).map(([id, nodes]) => ({ id, nodes }));
  }, [nodes]);

  // Apply spacing
  const applySpacing = useCallback(() => {
    setIsApplying(true);

    setTimeout(() => {
      const newNodes = applySpacingAlgorithm(nodes, currentConfig);
      onApply(newNodes, currentConfig);
      setIsApplying(false);
    }, 500);
  }, [nodes, currentConfig, onApply]);

  // Apply spacing algorithm
  const applySpacingAlgorithm = (nodes: NetworkNode[], config: SpacingConfig): NetworkNode[] => {
    const newNodes = [...nodes];

    switch (config.mode) {
      case 'horizontal':
        return applyHorizontalSpacing(newNodes, config.horizontalSpacing);
      case 'vertical':
        return applyVerticalSpacing(newNodes, config.verticalSpacing);
      case 'grid':
        return applyGridSpacing(newNodes, config.horizontalSpacing, config.verticalSpacing);
      default:
        return newNodes;
    }
  };

  // Horizontal Spacing
  const applyHorizontalSpacing = (nodes: NetworkNode[], spacing: number): NetworkNode[] => {
    // Group by building
    const buildings = new Map<string, NetworkNode[]>();
    nodes.forEach(node => {
      const buildingId = node.buildingId || 'default';
      if (!buildings.has(buildingId)) {
        buildings.set(buildingId, []);
      }
      buildings.get(buildingId)!.push(node);
    });

    const newNodes = [...nodes];

    buildings.forEach((buildingNodes, buildingId) => {
      // Sort by X position
      const sortedNodes = [...buildingNodes].sort((a, b) => a.position[0] - b.position[0]);
      
      // Calculate center
      const centerX = sortedNodes.reduce((sum, n) => sum + n.position[0], 0) / sortedNodes.length;
      const centerZ = sortedNodes.reduce((sum, n) => sum + n.position[2], 0) / sortedNodes.length;

      // Reposition nodes with equal spacing
      sortedNodes.forEach((node, index) => {
        const nodeIndex = newNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          const offset = (index - (sortedNodes.length - 1) / 2) * spacing;
          newNodes[nodeIndex] = {
            ...node,
            position: [centerX + offset, node.position[1], node.position[2]],
          };
        }
      });
    });

    return newNodes;
  };

  // Vertical Spacing
  const applyVerticalSpacing = (nodes: NetworkNode[], spacing: number): NetworkNode[] => {
    // Group by building
    const buildings = new Map<string, NetworkNode[]>();
    nodes.forEach(node => {
      const buildingId = node.buildingId || 'default';
      if (!buildings.has(buildingId)) {
        buildings.set(buildingId, []);
      }
      buildings.get(buildingId)!.push(node);
    });

    const newNodes = [...nodes];

    buildings.forEach((buildingNodes, buildingId) => {
      // Sort by Z position
      const sortedNodes = [...buildingNodes].sort((a, b) => a.position[2] - b.position[2]);
      
      // Calculate center
      const centerX = sortedNodes.reduce((sum, n) => sum + n.position[0], 0) / sortedNodes.length;
      const centerZ = sortedNodes.reduce((sum, n) => sum + n.position[2], 0) / sortedNodes.length;

      // Reposition nodes with equal spacing
      sortedNodes.forEach((node, index) => {
        const nodeIndex = newNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          const offset = (index - (sortedNodes.length - 1) / 2) * spacing;
          newNodes[nodeIndex] = {
            ...node,
            position: [node.position[0], node.position[1], centerZ + offset],
          };
        }
      });
    });

    return newNodes;
  };

  // Grid Spacing
  const applyGridSpacing = (
    nodes: NetworkNode[],
    horizontalSpacing: number,
    verticalSpacing: number
  ): NetworkNode[] => {
    // Group by building
    const buildings = new Map<string, NetworkNode[]>();
    nodes.forEach(node => {
      const buildingId = node.buildingId || 'default';
      if (!buildings.has(buildingId)) {
        buildings.set(buildingId, []);
      }
      buildings.get(buildingId)!.push(node);
    });

    const newNodes = [...nodes];

    buildings.forEach((buildingNodes, buildingId) => {
      // Sort by name
      const sortedNodes = [...buildingNodes].sort((a, b) => a.name.localeCompare(b.name));
      
      // Calculate grid dimensions
      const cols = Math.ceil(Math.sqrt(sortedNodes.length));
      const rows = Math.ceil(sortedNodes.length / cols);
      
      // Calculate center
      const centerX = sortedNodes.reduce((sum, n) => sum + n.position[0], 0) / sortedNodes.length;
      const centerZ = sortedNodes.reduce((sum, n) => sum + n.position[2], 0) / sortedNodes.length;

      // Reposition nodes in grid
      sortedNodes.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const nodeIndex = newNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          const offsetX = (col - (cols - 1) / 2) * horizontalSpacing;
          const offsetZ = (row - (rows - 1) / 2) * verticalSpacing;
          
          newNodes[nodeIndex] = {
            ...node,
            position: [centerX + offsetX, node.position[1], centerZ + offsetZ],
          };
        }
      });
    });

    return newNodes;
  };

  // Get preview of the spacing
  const previewNodes = useMemo(() => {
    return applySpacingAlgorithm(nodes, currentConfig);
  }, [nodes, currentConfig]);

  // Get site statistics
  const siteStats = useMemo(() => {
    return sites.map(site => ({
      id: site.id,
      name: site.id === 'site-principal' ? 'Site Principal' :
            site.id === 'site-distant' ? 'Site Distant' :
            site.id === 'pradoland-4' ? 'Pradoland 4' : site.id,
      nodeCount: site.nodes.length,
      avgX: site.nodes.reduce((sum, n) => sum + n.position[0], 0) / site.nodes.length,
      avgZ: site.nodes.reduce((sum, n) => sum + n.position[2], 0) / site.nodes.length,
    }));
  }, [sites]);

  return (
    <div className="modal-overlay flex items-center justify-center p-4">
      <div className="modal-content w-full max-w-2xl">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            📐 Gestion de l'Espacement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Mode Selection */}
          <div>
            <h3 className="text-white font-medium mb-3">Mode de disposition</h3>
            <div className="grid grid-cols-3 gap-2">
              {spacingModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setCurrentConfig(prev => ({ ...prev, mode: mode.id }))}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    currentConfig.mode === mode.id
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-white">{mode.name}</div>
                  <div className="text-xs text-gray-400">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Spacing Configuration */}
          <div>
            <h3 className="text-white font-medium mb-3">Espacement</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Espacement Horizontal: {currentConfig.horizontalSpacing} unités
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="1"
                  value={currentConfig.horizontalSpacing}
                  onChange={(e) => setCurrentConfig(prev => ({
                    ...prev,
                    horizontalSpacing: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Espacement Vertical: {currentConfig.verticalSpacing} unités
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="1"
                  value={currentConfig.verticalSpacing}
                  onChange={(e) => setCurrentConfig(prev => ({
                    ...prev,
                    verticalSpacing: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Sites List */}
          <div>
            <h3 className="text-white font-medium mb-3">Sites détectés</h3>
            <div className="space-y-2">
              {siteStats.map(site => (
                <div
                  key={site.id}
                  className="p-2 bg-gray-800/30 rounded border border-gray-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-white text-sm">{site.name}</span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {site.nodeCount} équipements
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium mb-2">Prévisualisation</h3>
            <div className="text-xs text-gray-400 mb-2">
              {previewNodes.length} équipements seront repositionnés
            </div>
            <div className="relative w-full h-40 bg-gray-900/50 rounded border border-gray-700 overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                <rect width="100%" height="100%" fill="#0f172a" />
                
                <defs>
                  <pattern id="spacing-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f2937" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#spacing-grid)" />

                {previewNodes.map((node, index) => {
                  const x = (node.position[0] / 10) + 200;
                  const y = (node.position[2] / 10) + 100;
                  
                  let color = '#3b82f6';
                  switch (node.type) {
                    case 'router': color = '#f59e0b'; break;
                    case 'switch': color = '#3b82f6'; break;
                    case 'firewall': color = '#ef4444'; break;
                    case 'wifi': color = '#8b5cf6'; break;
                    case 'nas': color = '#10b981'; break;
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
            onClick={applySpacing}
            disabled={isApplying}
            className={`px-4 py-2 rounded transition-colors ${
              isApplying
                ? 'bg-blue-600/30 text-blue-400/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isApplying ? 'Application...' : '✓ Appliquer l\'espacement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteSpacingManager;
