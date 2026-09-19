// TableView Component - Spreadsheet-style view of equipment

import { useState, useCallback, useMemo } from 'react';
import { NetworkNode, PingResult, StatusType, EquipmentType } from '../types';
import { EQUIPMENT_LABELS, SITE_COLORS } from '../types';

interface TableViewProps {
  nodes: NetworkNode[];
  onSelectNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateNode: (node: NetworkNode) => void;
  selectedNodeIds: string[];
  pingResults: Map<string, PingResult>;
  addNotification?: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

const TableView: React.FC<TableViewProps> = ({
  nodes,
  onSelectNode,
  onDeleteNode,
  onUpdateNode,
  selectedNodeIds,
  pingResults,
  addNotification,
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterBuilding, setFilterBuilding] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ nodeId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Get all unique types, statuses, and buildings for filters
  const types = useMemo(() => ['Tous', ...new Set(nodes.map(n => n.type))], [nodes]);
  const statuses = useMemo(() => ['Tous', 'online', 'warning', 'offline'], []);
  const buildings = useMemo(() => ['Tous', ...new Set(nodes.map(n => n.buildingId || 'Principal').filter(Boolean))], [nodes]);

  // Sort nodes
  const sortedNodes = useMemo(() => {
    if (!sortConfig) return nodes;

    return [...nodes].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof NetworkNode] ?? '';
      const bValue = b[sortConfig.key as keyof NetworkNode] ?? '';

      if (String(aValue) < String(bValue)) return sortConfig.direction === 'asc' ? -1 : 1;
      if (String(aValue) > String(bValue)) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [nodes, sortConfig]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return sortedNodes.filter(node => {
      // Text filter
      if (filterText && !node.name.toLowerCase().includes(filterText.toLowerCase()) &&
          !node.ip.toLowerCase().includes(filterText.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filterType && filterType !== 'Tous' && node.type !== filterType) {
        return false;
      }

      // Status filter
      if (filterStatus && filterStatus !== 'Tous') {
        const status = pingResults.get(node.id)?.status || node.status || 'offline';
        if (status !== filterStatus) return false;
      }

      // Building filter
      if (filterBuilding && filterBuilding !== 'Tous') {
        if ((node.buildingId || 'Principal') !== filterBuilding) return false;
      }

      return true;
    });
  }, [sortedNodes, filterText, filterType, filterStatus, filterBuilding, pingResults]);

  // Request sort
  const requestSort = useCallback((key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Get sort indicator
  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '\u2191' : '\u2193';
  };

  // Get status color
  const getStatusColor = (node: NetworkNode) => {
    const result = pingResults.get(node.id);
    const status = result?.status || node.status || 'offline';
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status text
  const getStatusText = (node: NetworkNode) => {
    const result = pingResults.get(node.id);
    const status = result?.status || node.status || 'offline';
    switch (status) {
      case 'online':
        return 'En ligne';
      case 'warning':
        return 'Attention';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Inconnu';
    }
  };

  // Handle cell edit
  const handleCellClick = useCallback((node: NetworkNode, field: string) => {
    if (field === 'id' || field === 'status') return; // Can't edit these

    setEditingCell({ nodeId: node.id, field });
    setEditValue(node[field as keyof NetworkNode] as string);
  }, []);

  // Save cell edit
  const handleSaveEdit = useCallback(() => {
    if (!editingCell) return;

    const { nodeId, field } = editingCell;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const updatedNode = { ...node, [field]: editValue };
    onUpdateNode(updatedNode);
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, nodes, onUpdateNode]);

  // Cancel cell edit
  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Handle key down for editing
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // Select all
  const handleSelectAll = useCallback(() => {
    const allIds = filteredNodes.map(n => n.id);
    onSelectNode(allIds.join(','));
  }, [filteredNodes, onSelectNode]);

  // Delete selected
  const handleDeleteSelected = useCallback(() => {
    selectedNodeIds.forEach(id => onDeleteNode(id));
  }, [selectedNodeIds, onDeleteNode]);

  // Handle create new equipment
  const handleCreateEquipment = useCallback(() => {
    const equipmentTypes: EquipmentType[] = ['router', 'switch', 'firewall', 'server', 'proxmox', 'vmware', 'nas', 'wifi', 'dc', 'veeam'];
    const randomType = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
    
    const newNode: NetworkNode = {
      id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `Nouvel ${EQUIPMENT_LABELS[randomType] || randomType}`,
      type: randomType,
      ip: `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
      vlan: 'VLAN 100',
      subnet: '10.0.0.0/24',
      status: 'online',
      position: [
        Math.floor(Math.random() * 20) - 10,
        0,
        Math.floor(Math.random() * 20) - 10
      ] as [number, number, number],
      description: 'Nouvel équipement créé depuis le tableau',
      details: {},
      floor: 0,
    };
    
    onUpdateNode(newNode);
    if (addNotification) {
      addNotification('success', 'Équipement créé', `Nouvel équipement ${newNode.type} ajouté avec succès`);
    }
  }, [onUpdateNode, addNotification]);

  return (
    <div
      id="table-panel"
      className="w-[800px] h-[80vh] max-w-[95vw] max-h-[90vh]"
      style={{
        position: 'fixed',
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(17, 24, 39, 0.98)',
        borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(55, 65, 81, 0.8)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/50">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-xl">\ud83d\udcca Vue Tableau</h2>
          <span className="text-gray-400 text-sm">
            {filteredNodes.length} / {nodes.length} équipements
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 text-sm rounded transition-colors"
          >
            Sélectionner tout
          </button>
          <button
            onClick={handleCreateEquipment}
            className="px-4 py-2 bg-green-600/30 hover:bg-green-600/50 text-green-400 text-sm rounded transition-colors flex items-center gap-1"
          >
            <span>+</span> Ajouter
          </button>
          {selectedNodeIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-sm rounded transition-colors"
            >
              Supprimer ({selectedNodeIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-700 space-y-3 bg-gray-800/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input
            type="text"
            placeholder="Filtrer..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <select
            value={filterType || 'Tous'}
            onChange={(e) => setFilterType(e.target.value === 'Tous' ? null : e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {types.map(type => (
              <option key={type} value={type} className="bg-gray-800">
                {type === 'Tous' ? 'Tous les types' : EQUIPMENT_LABELS[type as EquipmentType] || type}
              </option>
            ))}
          </select>
          <select
            value={filterStatus || 'Tous'}
            onChange={(e) => setFilterStatus(e.target.value === 'Tous' ? null : e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {statuses.map(status => (
              <option key={status} value={status} className="bg-gray-800">
                {status === 'Tous' ? 'Tous les statuts' : status === 'online' ? '\ud83d\udfe2 En ligne' : status === 'warning' ? '\ud83d\udfe1 Attention' : '\ud83d\udd34 Hors ligne'}
              </option>
            ))}
          </select>
          <select
            value={filterBuilding || 'Tous'}
            onChange={(e) => setFilterBuilding(e.target.value === 'Tous' ? null : e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {buildings.map(building => (
              <option key={building} value={building} className="bg-gray-800">
                {building === 'Tous' ? 'Tous les bâtiments' : building}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setFilterText('');
            setFilterType(null);
            setFilterStatus(null);
            setFilterBuilding(null);
          }}
          className="px-3 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-400 text-sm rounded transition-colors"
        >
          Effacer les filtres
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-800/90 backdrop-blur-sm z-10">
            <tr>
              <th className="p-3 text-left text-gray-400 border-b border-gray-700">
                <input
                  type="checkbox"
                  checked={selectedNodeIds.length === filteredNodes.length && filteredNodes.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleSelectAll();
                    } else {
                      selectedNodeIds.forEach(id => onSelectNode(id));
                    }
                  }}
                  className="w-4 h-4"
                />
              </th>
              <th
                className="p-3 text-left text-gray-400 border-b border-gray-700 cursor-pointer hover:text-white transition-colors"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center gap-1">
                  Nom {getSortIndicator('name')}
                </div>
              </th>
              <th
                className="p-3 text-left text-gray-400 border-b border-gray-700 cursor-pointer hover:text-white transition-colors"
                onClick={() => requestSort('type')}
              >
                <div className="flex items-center gap-1">
                  Type {getSortIndicator('type')}
                </div>
              </th>
              <th
                className="p-3 text-left text-gray-400 border-b border-gray-700 cursor-pointer hover:text-white transition-colors"
                onClick={() => requestSort('ip')}
              >
                <div className="flex items-center gap-1">
                  IP {getSortIndicator('ip')}
                </div>
              </th>
              <th
                className="p-3 text-left text-gray-400 border-b border-gray-700 cursor-pointer hover:text-white transition-colors"
                onClick={() => requestSort('vlan')}
              >
                <div className="flex items-center gap-1">
                  VLAN {getSortIndicator('vlan')}
                </div>
              </th>
              <th className="p-3 text-left text-gray-400 border-b border-gray-700">
                Statut
              </th>
              <th className="p-3 text-left text-gray-400 border-b border-gray-700">
                Étage
              </th>
              <th className="p-3 text-left text-gray-400 border-b border-gray-700">
                Bâtiment
              </th>
              <th className="p-3 text-left text-gray-400 border-b border-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeIds.includes(node.id);
              const result = pingResults.get(node.id);
              const latency = result?.latency;

              return (
                <tr
                  key={node.id}
                  className={`border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors ${
                    isSelected ? 'bg-blue-600/20' : ''
                  }`}
                  onClick={() => onSelectNode(node.id)}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectNode(node.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="p-3 text-white">
                    {editingCell?.nodeId === node.id && editingCell.field === 'name' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full px-2 py-1 bg-blue-600/30 border border-blue-500 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                      />
                    ) : (
                      <span onClick={(e) => { e.stopPropagation(); handleCellClick(node, 'name'); }} className="cursor-pointer hover:text-blue-400 transition-colors">
                        {node.name}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-gray-300">
                    {editingCell?.nodeId === node.id && editingCell.field === 'type' ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full px-2 py-1 bg-blue-600/30 border border-blue-500 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                      >
                        {Object.entries(EQUIPMENT_LABELS).map(([type, label]) => (
                          <option key={type} value={type} className="bg-gray-800">{label}</option>
                        ))}
                      </select>
                    ) : (
                      <span onClick={(e) => { e.stopPropagation(); handleCellClick(node, 'type'); }} className="cursor-pointer hover:text-blue-400 transition-colors">
                        {EQUIPMENT_LABELS[node.type] || node.type}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-gray-300">
                    {editingCell?.nodeId === node.id && editingCell.field === 'ip' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full px-2 py-1 bg-blue-600/30 border border-blue-500 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                      />
                    ) : (
                      <span onClick={(e) => { e.stopPropagation(); handleCellClick(node, 'ip'); }} className="cursor-pointer hover:text-blue-400 transition-colors">
                        {node.ip}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-gray-300">
                    {editingCell?.nodeId === node.id && editingCell.field === 'vlan' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full px-2 py-1 bg-blue-600/30 border border-blue-500 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                      />
                    ) : (
                      <span onClick={(e) => { e.stopPropagation(); handleCellClick(node, 'vlan'); }} className="cursor-pointer hover:text-blue-400 transition-colors">
                        {node.vlan}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${getStatusColor(node)}`}></span>
                      <span className="text-gray-300 text-sm">{getStatusText(node)}</span>
                      {latency && <span className="text-gray-400 text-xs">{latency.toFixed(0)}ms</span>}
                    </div>
                  </td>
                  <td className="p-3 text-gray-300">
                    {editingCell?.nodeId === node.id && editingCell.field === 'floor' ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full px-2 py-1 bg-blue-600/30 border border-blue-500 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                      />
                    ) : (
                      <span onClick={(e) => { e.stopPropagation(); handleCellClick(node, 'floor'); }} className="cursor-pointer hover:text-blue-400 transition-colors">
                        {node.floor || 0}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-gray-300">
                    {editingCell?.nodeId === node.id && editingCell.field === 'buildingId' ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full px-2 py-1 bg-blue-600/30 border border-blue-500 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                      >
                        {['', 'site-principal', 'site-distant', 'pradoland-4'].map(b => (
                          <option key={b} value={b} className="bg-gray-800">
                            {b === '' ? 'Aucun' : b === 'site-principal' ? 'Site Principal' : b === 'site-distant' ? 'Site Distant' : 'Pradoland 4'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span onClick={(e) => { e.stopPropagation(); handleCellClick(node, 'buildingId'); }} className="cursor-pointer hover:text-blue-400 transition-colors">
                        {node.buildingId === 'site-principal' ? 'Principal' : node.buildingId === 'site-distant' ? 'Distant' : node.buildingId === 'pradoland-4' ? 'Pradoland 4' : 'Aucun'}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCellClick(node, 'name'); }}
                        className="px-2 py-1 bg-gray-600/50 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                        title="Modifier"
                      >
                        \u270f
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
                        className="px-2 py-1 bg-red-600/50 hover:bg-red-600 text-red-400 text-xs rounded transition-colors"
                        title="Supprimer"
                      >
                        \u274c
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/50">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>{filteredNodes.length} équipements affichés</span>
          <button
            onClick={() => {
              setFilterText('');
              setFilterType(null);
              setFilterStatus(null);
              setFilterBuilding(null);
            }}
            className="hover:text-white transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableView;
