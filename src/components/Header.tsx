// Header Component

import { useState, useCallback } from 'react';
import { ThemeConfig, PingMonitorConfig } from '../types';

interface HeaderProps {
  nodeCount: number;
  linkCount: number;
  pingStats: {
    online: number;
    warning: number;
    offline: number;
    averageLatency: number;
    total: number;
  };
  theme: ThemeConfig;
  toggleTheme: () => void;
  onTimelineToggle: () => void;
  onTableToggle: () => void;
  onMiniMapToggle: () => void;
  onFloorManagerToggle: () => void;
  onLayoutToggle: () => void;
  onSpacingToggle: () => void;
  onDiscoveryToggle: () => void;
  onViewsToggle: () => void;
  onExportToggle: () => void;
  onXRToggle: () => void;
  onShortcutsToggle: () => void;
  onConfigToggle: () => void;
  onLegendToggle: () => void;
  onNotificationToggle: () => void;
  onAddEquipment: () => void;
  onAddSite: () => void;
  unreadCount: number;
  isMonitoring: boolean;
  setIsMonitoring: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  nodeCount,
  linkCount,
  pingStats,
  theme,
  toggleTheme,
  onTimelineToggle,
  onTableToggle,
  onMiniMapToggle,
  onFloorManagerToggle,
  onLayoutToggle,
  onSpacingToggle,
  onDiscoveryToggle,
  onViewsToggle,
  onExportToggle,
  onXRToggle,
  onShortcutsToggle,
  onConfigToggle,
  onLegendToggle,
  onNotificationToggle,
  onAddEquipment,
  onAddSite,
  unreadCount,
  isMonitoring,
  setIsMonitoring,
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header
      id="app-header"
      className="flex items-center justify-between px-4 shadow-lg z-100"
      style={{
        background: theme.mode === 'night' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(243, 244, 246, 0.95)',
        borderBottom: `1px solid ${theme.mode === 'night' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(107, 114, 128, 0.3)'}`,
      }}
    >
      {/* Left Section - Title and Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Network Infrastructure">
            🌐
          </span>
          <span 
            className="font-semibold text-lg"
            style={{ color: theme.textColor }}
          >
            Network Infrastructure 3D
          </span>
        </div>
        
        <div 
          className="hidden md:flex items-center gap-4 text-sm"
          style={{ color: theme.mode === 'night' ? '#9ca3af' : '#4b5563' }}
        >
          <span>{nodeCount} équipements • {linkCount} connexions</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {pingStats.online}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              {pingStats.warning}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {pingStats.offline}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section - Toolbar */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Basculer thème jour/nuit (N)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>{theme.mode === 'night' ? '🌙' : '☀️'}</span>
        </button>

        {/* Timeline */}
        <button
          onClick={onTimelineToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Afficher/Masquer la timeline (⏱️)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>⏱️ Timeline</span>
        </button>

        {/* Table View */}
        <button
          onClick={onTableToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Afficher/Masquer le tableau (T)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>📊 Tableau</span>
        </button>

        {/* Mini Map */}
        <button
          onClick={onMiniMapToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Afficher/Masquer la mini-carte (🗺️)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>🗺️ Mini-carte</span>
        </button>

        {/* Floor Manager */}
        <button
          onClick={onFloorManagerToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Gestion des dalles (🟦)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>🟦 Dalles</span>
        </button>

        {/* Auto Layout */}
        <button
          onClick={onLayoutToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Auto-layout (A)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>🎨 Auto-layout</span>
        </button>

        {/* Spacing */}
        <button
          onClick={onSpacingToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Gestion de l'espacement (E)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>📐 Espacement</span>
        </button>

        {/* Network Discovery */}
        <button
          onClick={onDiscoveryToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Découverte réseau (D)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>🔍 Découverte</span>
        </button>

        {/* Camera Views */}
        <button
          onClick={onViewsToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Vues prédéfinies (V)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>📷 Vues</span>
        </button>

        {/* Media Export */}
        <button
          onClick={onExportToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Export de médias (P)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>📸 Export</span>
        </button>

        {/* VR/AR */}
        <button
          onClick={onXRToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Mode VR/AR (🕶️)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>🕶️ VR/AR</span>
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={onShortcutsToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Aide des raccourcis clavier (?)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>⌨️ Raccourcis</span>
        </button>

        {/* Config */}
        <button
          onClick={onConfigToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Configuration (⚙️)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>⚙️ Config</span>
        </button>

        {/* Legend */}
        <button
          onClick={onLegendToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1"
          title="Afficher/Masquer la légende (L)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>📋 Légende</span>
        </button>

        {/* Notifications */}
        <button
          onClick={onNotificationToggle}
          className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center gap-1 relative"
          title="Centre de notifications (🔔)"
          style={{
            color: theme.textColor,
          }}
        >
          <span>🔔 Notifications</span>
          {unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Monitoring Toggle */}
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            isMonitoring ? 'bg-green-600/30' : 'hover:bg-gray-700/50'
          }`}
          title={`Monitoring ICMP: ${isMonitoring ? 'Activé' : 'Désactivé'} (M)`}
          style={{
            color: theme.textColor,
          }}
        >
          <span className={isMonitoring ? 'text-green-400' : ''}>
            {isMonitoring ? '🟢 Monitoring ON' : '🔴 Monitoring OFF'}
          </span>
        </button>

        {/* Status Counts */}
        <div 
          className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-lg"
          style={{
            background: theme.mode === 'night' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(107, 114, 128, 0.2)',
          }}
        >
          <span className="flex items-center gap-1 text-sm" style={{ color: theme.textColor }}>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {pingStats.online}
          </span>
          <span className="flex items-center gap-1 text-sm" style={{ color: theme.textColor }}>
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            {pingStats.warning}
          </span>
          <span className="flex items-center gap-1 text-sm" style={{ color: theme.textColor }}>
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            {pingStats.offline}
          </span>
        </div>

        {/* Add Equipment */}
        <button
          onClick={onAddEquipment}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          title="Ajouter un équipement"
        >
          <span>➕ Ajouter Équipement</span>
        </button>

        {/* Add Site */}
        <button
          onClick={onAddSite}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          title="Ajouter un site"
        >
          <span>🏢 Ajouter Site</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
