// Floor Manager Modal Component
import { useState, useCallback, useMemo } from "react";

import type { NetworkNode, FloorTile } from "../types";
import { SITE_COLORS } from '../types';

interface FloorManagerModalProps {
  nodes: NetworkNode[];
  onClose: () => void;
}

const FloorManagerModal: React.FC<FloorManagerModalProps> = ({ nodes, onClose }) => {
  const [floorTiles, setFloorTiles] = useState<FloorTile[]>([]);
  const [newTile, setNewTile] = useState<Partial<FloorTile>>({
    id: '',
    position: [0, 0, 0],
    size: [10, 10],
    color: '#3b82f6',
    label: '',
  });

  // Get existing floor tiles from nodes
  const existingTiles = useMemo(() => {
    const tiles: FloorTile[] = [];
    const buildingMap = new Map<string, {
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
      nodes: NetworkNode[];
    }>();

    nodes.forEach(node => {
      const buildingId = node.buildingId || 'default';
      if (!buildingMap.has(buildingId)) {
        buildingMap.set(buildingId, {
          minX: Infinity,
          maxX: -Infinity,
          minZ: Infinity,
          maxZ: -Infinity,
          nodes: [],
        });
      }

      const building = buildingMap.get(buildingId)!;
      building.nodes.push(node);
      building.minX = Math.min(building.minX, node.position[0]);
      building.maxX = Math.max(building.maxX, node.position[0]);
      building.minZ = Math.min(building.minZ, node.position[2]);
      building.maxZ = Math.max(building.maxZ, node.position[2]);
    });

    buildingMap.forEach((building, buildingId) => {
      const centerX = (building.minX + building.maxX) / 2;
      const centerZ = (building.minZ + building.maxZ) / 2;
      const width = Math.max(building.maxX - building.minX + 8, 10);
      const depth = Math.max(building.maxZ - building.minZ + 8, 10);
      const color = SITE_COLORS[buildingId] || '#6b7280';

      tiles.push({
        id: buildingId,
        position: [centerX, 0, centerZ],
        size: [width, depth],
        color,
        label: buildingId === 'site-principal' ? 'Site Principal' :
              buildingId === 'site-distant' ? 'Site Distant' :
              buildingId === 'pradoland-4' ? 'Pradoland 4' : buildingId,
        buildingId,
      });
    });

    return tiles;
  }, [nodes]);

  // Add new floor tile
  const handleAddTile = useCallback(() => {
    if (!newTile.id) return;
    
    setFloorTiles(prev => [...prev, {
      id: newTile.id || `tile-${Date.now()}`,
      position: newTile.position || [0, 0, 0],
      size: newTile.size || [10, 10],
      color: newTile.color || '#3b82f6',
      label: newTile.label || '',
      buildingId: newTile.buildingId,
    }]);

    setNewTile({
      id: '',
      position: [0, 0, 0],
      size: [10, 10],
      color: '#3b82f6',
      label: '',
    });
  }, [newTile]);

  // Remove floor tile
  const handleRemoveTile = useCallback((id: string) => {
    setFloorTiles(prev => prev.filter(tile => tile.id !== id));
  }, []);

  return (
    <div className="modal-overlay flex items-center justify-center p-4">
      <div className="modal-content w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            🟦 Gestion des Dalles
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Existing Tiles */}
          <div>
            <h3 className="text-white font-medium mb-3">Dalles existantes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {existingTiles.map(tile => (
                <div
                  key={tile.id}
                  className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className="font-medium text-white"
                      style={{ color: tile.color }}
                    >
                      {tile.label || tile.id}
                    </span>
                    <span className="text-xs text-gray-400">
                      {tile.size[0].toFixed(1)} × {tile.size[1].toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: tile.color }}
                    ></span>
                    <span className="text-sm text-gray-400">
                      Position: ({tile.position[0].toFixed(1)}, {tile.position[2].toFixed(1)})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveTile(tile.id)}
                    className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs rounded transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Tile */}
          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium mb-3">Ajouter une nouvelle dalle</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">ID</label>
                <input
                  type="text"
                  value={newTile.id || ''}
                  onChange={(e) => setNewTile(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="tile-1"
                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Position X</label>
                <input
                  type="number"
                  value={newTile.position?.[0] || 0}
                  onChange={(e) => setNewTile(prev => ({ 
                    ...prev, 
                    position: [parseFloat(e.target.value) || 0, prev.position?.[1] || 0, prev.position?.[2] || 0] 
                  }))}
                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Position Z</label>
                <input
                  type="number"
                  value={newTile.position?.[2] || 0}
                  onChange={(e) => setNewTile(prev => ({ 
                    ...prev, 
                    position: [prev.position?.[0] || 0, prev.position?.[1] || 0, parseFloat(e.target.value) || 0] 
                  }))}
                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Largeur</label>
                <input
                  type="number"
                  value={newTile.size?.[0] || 10}
                  onChange={(e) => setNewTile(prev => ({ 
                    ...prev, 
                    size: [parseFloat(e.target.value) || 10, prev.size?.[1] || 10] 
                  }))}
                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Profondeur</label>
                <input
                  type="number"
                  value={newTile.size?.[1] || 10}
                  onChange={(e) => setNewTile(prev => ({ 
                    ...prev, 
                    size: [prev.size?.[0] || 10, parseFloat(e.target.value) || 10] 
                  }))}
                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Couleur</label>
                <input
                  type="color"
                  value={newTile.color || '#3b82f6'}
                  onChange={(e) => setNewTile(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-8 rounded border border-gray-600 bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Label</label>
                <input
                  type="text"
                  value={newTile.label || ''}
                  onChange={(e) => setNewTile(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Nouvelle dalle"
                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleAddTile}
              className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              ✓ Ajouter la dalle
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloorManagerModal;
