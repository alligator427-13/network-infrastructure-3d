// Edit Equipment Modal Component

import { useState, useCallback, useEffect } from 'react';
import { NetworkNode, EquipmentType, EQUIPMENT_LABELS, SITE_COLORS } from '../types';

interface EditEquipmentModalProps {
  node: NetworkNode;
  onClose: () => void;
  onSave: (node: NetworkNode) => void;
  onDelete: (nodeId: string) => void;
}

const equipmentTypes: EquipmentType[] = [
  'router', 'switch', 'firewall', 'server', 'proxmox', 'vmware', 'nas', 'wifi', 'dc', 'veeam', 'vm', 'docker', 'lxc'
];

const statusOptions = ['online', 'warning', 'offline'] as const;
const vlanOptions = ['VLAN 100', 'VLAN 101', 'VLAN 200', 'VLAN 800', 'VLAN 801', 'VLAN 998', 'VLAN 999', 'VLAN 1320', 'VLAN 1321'];
const buildingOptions = ['site-principal', 'site-distant', 'pradoland-4', ''];

const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({ node, onClose, onSave, onDelete }) => {
  const [editedNode, setEditedNode] = useState<NetworkNode>(node);

  // Update edited node when props change
  useEffect(() => {
    setEditedNode(node);
  }, [node]);

  const handleChange = useCallback((field: keyof NetworkNode, value: string | number | [number, number, number] | undefined) => {
    setEditedNode(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(editedNode);
    onClose();
  }, [editedNode, onSave, onClose]);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${node.name} ?`)) {
      onDelete(node.id);
      onClose();
    }
  }, [node, onDelete, onClose]);

  return (
    <div className="modal-overlay flex items-center justify-center p-4">
      <div className="modal-content w-full max-w-lg">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            ✏️ Modifier l'équipement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nom *</label>
              <input
                type="text"
                value={editedNode.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type *</label>
              <select
                value={editedNode.type}
                onChange={(e) => handleChange('type', e.target.value as EquipmentType)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {equipmentTypes.map(type => (
                  <option key={type} value={type} className="bg-gray-800">
                    {EQUIPMENT_LABELS[type] || type}
                  </option>
                ))}
              </select>
            </div>

            {/* IP Address */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Adresse IP *</label>
              <input
                type="text"
                value={editedNode.ip}
                onChange={(e) => handleChange('ip', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* VLAN */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">VLAN *</label>
              <select
                value={editedNode.vlan}
                onChange={(e) => handleChange('vlan', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {vlanOptions.map(vlan => (
                  <option key={vlan} value={vlan} className="bg-gray-800">
                    {vlan}
                  </option>
                ))}
              </select>
            </div>

            {/* Subnet */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sous-réseau</label>
              <input
                type="text"
                value={editedNode.subnet}
                onChange={(e) => handleChange('subnet', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Statut</label>
              <select
                value={editedNode.status}
                onChange={(e) => handleChange('status', e.target.value as 'online' | 'warning' | 'offline')}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status} className="bg-gray-800">
                    {status === 'online' ? '🟢 En ligne' : status === 'warning' ? '🟡 Attention' : '🔴 Hors ligne'}
                  </option>
                ))}
              </select>
            </div>

            {/* Floor */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Étage</label>
              <input
                type="number"
                value={editedNode.floor || 0}
                onChange={(e) => handleChange('floor', parseInt(e.target.value) || 0)}
                min="0"
                max="10"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Building */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Bâtiment</label>
              <select
                value={editedNode.buildingId ?? ''}
                onChange={(e) => handleChange('buildingId', e.target.value === '' ? undefined : e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {buildingOptions.map(building => (
                  <option key={building} value={building} className="bg-gray-800">
                    {building === 'site-principal' ? 'Site Principal' : 
                     building === 'site-distant' ? 'Site Distant' : 
                     building === 'pradoland-4' ? 'Pradoland 4' : 'Aucun'}
                  </option>
                ))}
              </select>
            </div>

            {/* Position X */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Position X</label>
              <input
                type="number"
                value={editedNode.position[0]}
                onChange={(e) => handleChange('position', [parseFloat(e.target.value) || 0, editedNode.position[1], editedNode.position[2]])}
                step="0.1"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Position Y */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Position Y</label>
              <input
                type="number"
                value={editedNode.position[1]}
                onChange={(e) => handleChange('position', [editedNode.position[0], parseFloat(e.target.value) || 0, editedNode.position[2]])}
                step="0.1"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Position Z */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Position Z</label>
              <input
                type="number"
                value={editedNode.position[2]}
                onChange={(e) => handleChange('position', [editedNode.position[0], editedNode.position[1], parseFloat(e.target.value) || 0])}
                step="0.1"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
              <textarea
                value={editedNode.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            🗑️ Supprimer
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            ✓ Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEquipmentModal;
