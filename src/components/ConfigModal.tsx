// Config Modal Component

import { useState, useCallback } from 'react';
import { PingMonitorConfig, ThemeConfig } from '../types';

interface ConfigModalProps {
  pingConfig: PingMonitorConfig;
  updatePingConfig: (config: Partial<PingMonitorConfig>) => void;
  isMonitoring: boolean;
  setIsMonitoring: (value: boolean) => void;
  theme: ThemeConfig;
  toggleTheme: () => void;
  onClose: () => void;
}

const pingIntervals = [
  { value: 1000, label: '1 seconde' },
  { value: 2000, label: '2 secondes' },
  { value: 5000, label: '5 secondes (recommandé)' },
  { value: 10000, label: '10 secondes' },
  { value: 15000, label: '15 secondes' },
  { value: 30000, label: '30 secondes' },
];

const pingModes = [
  { value: 'simulation', label: 'Simulation', description: 'Simulation de latence réaliste' },
  { value: 'real', label: 'Réel', description: 'Ping ICMP réel (nécessite un backend)' },
];

const ConfigModal: React.FC<ConfigModalProps> = ({
  pingConfig,
  updatePingConfig,
  isMonitoring,
  setIsMonitoring,
  theme,
  toggleTheme,
  onClose,
}) => {
  const [currentPingConfig, setCurrentPingConfig] = useState<PingMonitorConfig>(pingConfig);

  // Handle ping config change
  const handlePingConfigChange = useCallback((field: keyof PingMonitorConfig, value: string | number) => {
    const newConfig = { ...currentPingConfig, [field]: value };
    setCurrentPingConfig(newConfig);
    updatePingConfig(newConfig);
  }, [currentPingConfig, updatePingConfig]);

  // Apply and close
  const handleApply = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div className="modal-overlay flex items-center justify-center p-4">
      <div className="modal-content w-full max-w-lg">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            ⚙️ Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Monitoring Configuration */}
          <div>
            <h3 className="text-white font-medium mb-3">Monitoring ICMP</h3>
            <div className="space-y-3">
              {/* Monitoring Toggle */}
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white text-sm">Activer le monitoring ICMP</label>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isMonitoring}
                      onChange={(e) => setIsMonitoring(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-10 h-6 rounded-full transition-colors ${
                        isMonitoring ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                      onClick={() => setIsMonitoring(!isMonitoring)}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          isMonitoring ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {isMonitoring ? 'Le monitoring est actif' : 'Le monitoring est désactivé'}
                </div>
              </div>

              {/* Ping Mode */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Mode de ping</label>
                <div className="grid grid-cols-2 gap-2">
                  {pingModes.map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => handlePingConfigChange('pingMode', mode.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        currentPingConfig.pingMode === mode.value
                          ? 'border-blue-500 bg-blue-600/20'
                          : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-white">{mode.label}</div>
                      <div className="text-xs text-gray-400">{mode.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ping Interval */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Intervalle de ping: {currentPingConfig.pingInterval / 1000} secondes
                </label>
                <select
                  value={currentPingConfig.pingInterval}
                  onChange={(e) => handlePingConfigChange('pingInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  {pingIntervals.map(interval => (
                    <option key={interval.value} value={interval.value} className="bg-gray-800">
                      {interval.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Theme Configuration */}
          <div>
            <h3 className="text-white font-medium mb-3">Apparence</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white text-sm">Mode sombre</label>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={theme.mode === 'night'}
                      onChange={toggleTheme}
                      className="sr-only"
                    />
                    <div
                      className={`w-10 h-6 rounded-full transition-colors ${
                        theme.mode === 'night' ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                      onClick={toggleTheme}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          theme.mode === 'night' ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Mode actuel: {theme.mode === 'night' ? 'Nuit' : 'Jour'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (theme.mode !== 'night') toggleTheme();
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    theme.mode === 'night'
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">🌙</div>
                  <div className="font-medium text-white">Nuit</div>
                  <div className="text-xs text-gray-400">Arrière-plan sombre</div>
                </button>
                <button
                  onClick={() => {
                    if (theme.mode !== 'day') toggleTheme();
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    theme.mode === 'day'
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">☀️</div>
                  <div className="font-medium text-white">Jour</div>
                  <div className="text-xs text-gray-400">Arrière-plan clair</div>
                </button>
              </div>
            </div>
          </div>

          {/* Performance Settings */}
          <div>
            <h3 className="text-white font-medium mb-3">Performance</h3>
            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 space-y-3">
              <div className="text-xs text-gray-400">
                Conseils pour améliorer les performances:
              </div>
              <ul className="text-xs text-gray-400 space-y-1 ml-4">
                <li>• Réduisez le nombre d'équipements affichés</li>
                <li>• Désactivez le monitoring si non nécessaire</li>
                <li>• Utilisez un navigateur moderne (Chrome, Edge, Firefox)</li>
                <li>• Fermez les autres onglets gourmands en ressources</li>
                <li>• Si le FPS est bas, réduisez l'intervalle de ping</li>
              </ul>
            </div>
          </div>

          {/* Information */}
          <div>
            <h3 className="text-white font-medium mb-3">Informations</h3>
            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Version:</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Technologies:</span>
                <span className="text-white">React, Three.js, TypeScript</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Équipements:</span>
                <span className="text-white">34</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Connexions:</span>
                <span className="text-white">38</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                Cette application simule un système de monitoring réseau 3D.
                Les données de ping sont simulées pour une démonstration réaliste.
              </div>
            </div>
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

export default ConfigModal;
