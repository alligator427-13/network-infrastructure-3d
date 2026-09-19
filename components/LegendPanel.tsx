// Legend Panel Component

import { useMemo } from 'react';
import { EQUIPMENT_COLORS, EQUIPMENT_LABELS, VLAN_COLORS, SITE_COLORS } from '../types';
import type { EquipmentType } from '../types';

interface LegendPanelProps {
  onClose: () => void;
  themeMode: 'day' | 'night';
}

const LegendPanel: React.FC<LegendPanelProps> = ({ onClose, themeMode }) => {
  // Equipment types legend
  const equipmentTypes = useMemo(() => {
    const types: EquipmentType[] = [
      'router', 'switch', 'firewall', 'server', 'proxmox', 'vmware', 'nas', 'wifi', 'dc', 'veeam'
    ];
    return types.map(type => ({
      type,
      label: EQUIPMENT_LABELS[type],
      color: EQUIPMENT_COLORS[type],
      icon: getEquipmentIcon(type),
    }));
  }, []);

  // Site colors legend
  const siteColors = useMemo(() => {
    return Object.entries(SITE_COLORS).map(([id, color]) => ({
      id,
      label: id === 'site-principal' ? 'Site Principal' : 
            id === 'site-distant' ? 'Site Distant' : 
            id === 'pradoland-4' ? 'Pradoland 4' : id,
      color,
    }));
  }, []);

  // VLAN colors legend
  const vlanColors = useMemo(() => {
    return Object.entries(VLAN_COLORS).map(([vlan, color]) => ({
      vlan,
      color,
    }));
  }, []);

  // Status indicators
  const statusIndicators = [
    { label: 'En ligne', color: '#22c55e', description: '< 100ms' },
    { label: 'Attention', color: '#f59e0b', description: '100-250ms' },
    { label: 'Hors ligne', color: '#ef4444', description: 'Timeout' },
  ];

  return (
    <div
      className="legend-panel"
      style={{
        position: 'fixed',
        top: 60,
        right: 20,
        width: 320,
        maxHeight: 'calc(100vh - 120px)',
        background: themeMode === 'night' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(243, 244, 246, 0.95)',
        border: `1px solid ${themeMode === 'night' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(107, 114, 128, 0.3)'}`,
        borderRadius: 12,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        color: themeMode === 'night' ? '#f9fafb' : '#1f2937',
      }}
    >
      {/* Header */}
      <div className="p-3 border-b" style={{
        borderColor: themeMode === 'night' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(107, 114, 128, 0.2)'
      }}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">
            <span role="img" aria-label="Legend">📋</span> Légende
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
            style={{ color: themeMode === 'night' ? '#9ca3af' : '#6b7280' }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin">
        
        {/* Equipment Types Section */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 pb-2 border-b" style={{
            borderColor: themeMode === 'night' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(107, 114, 128, 0.1)'
          }}>
            <span role="img" aria-label="Equipment">🖥️</span> Types d'équipements
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {equipmentTypes.map(({ type, label, color, icon }) => (
              <div key={type} className="flex items-center gap-2 p-2 rounded bg-gray-800/30">
                <span style={{ color }}>{icon}</span>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Indicators Section */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 pb-2 border-b" style={{
            borderColor: themeMode === 'night' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(107, 114, 128, 0.1)'
          }}>
            <span role="img" aria-label="Status">🟢🟡🔴</span> Statut ICMP
          </h4>
          <div className="space-y-2">
            {statusIndicators.map(({ label, color, description }) => (
              <div key={label} className="flex items-center gap-3 p-2 rounded bg-gray-800/30">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-gray-400 block">{description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Site Colors Section */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 pb-2 border-b" style={{
            borderColor: themeMode === 'night' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(107, 114, 128, 0.1)'
          }}>
            <span role="img" aria-label="Sites">🏢</span> Sites
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {siteColors.map(({ id, label, color }) => (
              <div key={id} className="flex items-center gap-2 p-2 rounded bg-gray-800/30">
                <span
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: color, borderColor: themeMode === 'night' ? '#374151' : '#d1d5db' }}
                />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* VLAN Colors Section */}
        <div className="mb-4">
          <h4 className="font-medium mb-3 pb-2 border-b" style={{
            borderColor: themeMode === 'night' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(107, 114, 128, 0.1)'
          }}>
            <span role="img" aria-label="VLAN">🌈</span> VLANs
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {vlanColors.map(({ vlan, color }) => (
              <div key={vlan} className="flex items-center gap-2 p-2 rounded bg-gray-800/30">
                <span
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: color, borderColor: themeMode === 'night' ? '#374151' : '#d1d5db' }}
                />
                <span className="text-sm">{vlan}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-2 border-t" style={{
        borderColor: themeMode === 'night' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(107, 114, 128, 0.2)'
      }}>
        <button
          onClick={onClose}
          className="w-full py-2 text-sm rounded hover:bg-gray-700/50 transition-colors"
          style={{
            color: themeMode === 'night' ? '#9ca3af' : '#6b7280'
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

// Helper function to get equipment icons
function getEquipmentIcon(type: EquipmentType): string {
  const icons: Record<EquipmentType, string> = {
    router: '🟠',
    switch: '🔵',
    firewall: '🔴',
    server: '⚫',
    proxmox: '🟠',
    vmware: '🔵',
    nas: '🟢',
    wifi: '📡',
    dc: '🟣',
    veeam: '🔷',
    vm: '💜',
    docker: '🐳',
    lxc: '🥭',
  };
  return icons[type] || '🖥️';
}

export default LegendPanel;
