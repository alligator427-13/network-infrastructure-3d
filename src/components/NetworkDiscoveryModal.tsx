// Network Discovery Modal Component

import { useState, useCallback, useEffect, useMemo } from 'react';
import { DiscoveredDevice, DiscoveryConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface NetworkDiscoveryModalProps {
  onClose: () => void;
  onDiscover: (devices: DiscoveredDevice[]) => void;
}

// Vendor database for MAC address lookup
const vendorDatabase: Record<string, string> = {
  '00:16:46': 'Cisco',
  '00:1B:21': 'Dell',
  '00:1C:B3': 'Cisco',
  '00:1D:0F': 'Samsung',
  '00:1E:68': 'Cisco',
  '00:21:5A': 'Hewlett Packard',
  '00:22:19': 'Dell',
  '00:23:12': 'Cisco',
  '00:25:4B': 'Apple',
  '00:50:56': 'VMware',
  '00:50:F2': 'Microsoft',
  '00:90:0B': 'Cisco',
  '08:00:27': 'Cadmus Computer Systems',
  '28:CF:DA': 'Apple',
  '34:64:A9': 'Amazon Technologies',
  '3C:5A:B4': 'Google',
  '3C:D9:2B': 'Hewlett Packard',
  '54:EE:75': 'Apple',
  '60:6B:BD': 'Samsung Electronics',
  '74:D0:2B': 'Amazon Technologies',
  '78:31:C1': 'Apple',
  '78:4F:43': 'Apple',
  '7C:6D:62': 'Apple',
  '84:38:35': 'Apple',
  'A4:83:E7': 'Microsoft',
  'B8:27:EB': 'Raspberry Pi Foundation',
  'C8:2A:14': 'Apple',
  'D8:30:62': 'Apple',
  'DC:71:44': 'Samsung Electronics',
  'E0:DB:55': 'Dell',
  'F0:18:98': 'Apple',
};

// OS detection based on hostname patterns
const detectOS = (hostname: string): string => {
  const lowerHostname = hostname.toLowerCase();
  
  if (lowerHostname.includes('win') || lowerHostname.includes('dc') || lowerHostname.includes('ad')) {
    return 'Windows Server';
  }
  if (lowerHostname.includes('linux') || lowerHostname.includes('ubuntu') || lowerHostname.includes('debian')) {
    return 'Linux';
  }
  if (lowerHostname.includes('esxi') || lowerHostname.includes('vmware')) {
    return 'VMware ESXi';
  }
  if (lowerHostname.includes('proxmox')) {
    return 'Proxmox';
  }
  if (lowerHostname.includes('syno') || lowerHostname.includes('nas')) {
    return 'Synology DSM';
  }
  if (lowerHostname.includes('mac') || lowerHostname.includes('apple')) {
    return 'macOS';
  }
  if (lowerHostname.includes('veeam')) {
    return 'Veeam';
  }
  
  return 'Inconnu';
};

// Generate random MAC address
const generateRandomMac = (): string => {
  const hexDigits = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    mac += hexDigits.charAt(Math.floor(Math.random() * 16));
    mac += hexDigits.charAt(Math.floor(Math.random() * 16));
    if (i < 5) mac += ':';
  }
  return mac;
};

// Generate random hostname
const generateRandomHostname = (): string => {
  const prefixes = ['SRV', 'PC', 'LAPTOP', 'PRINTER', 'SWITCH', 'ROUTER', 'FW', 'AP', 'NAS', 'DC'];
  const suffixes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix}-${suffix}`;
};

// Generate random vendor
const generateRandomVendor = (): string => {
  const vendors = ['Cisco', 'Dell', 'Hewlett Packard', 'Apple', 'Microsoft', 'Samsung', 'VMware', 'Synology', 'Fortinet', 'Palo Alto'];
  return vendors[Math.floor(Math.random() * vendors.length)];
};

const NetworkDiscoveryModal: React.FC<NetworkDiscoveryModalProps> = ({ onClose, onDiscover }) => {
  const [discoveryConfigs, setDiscoveryConfigs] = useState<DiscoveryConfig[]>([]);
  const [newConfig, setNewConfig] = useState<Partial<DiscoveryConfig>>({
    name: '',
    startIp: '',
    endIp: '',
    active: true,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());

  // Add new discovery configuration
  const handleAddConfig = useCallback(() => {
    if (!newConfig.name || !newConfig.startIp || !newConfig.endIp) return;

    setDiscoveryConfigs(prev => [...prev, {
      name: newConfig.name!,
      startIp: newConfig.startIp!,
      endIp: newConfig.endIp!,
      active: newConfig.active !== undefined ? newConfig.active : true,
    }]);

    setNewConfig({
      name: '',
      startIp: '',
      endIp: '',
      active: true,
    });
  }, [newConfig]);

  // Remove discovery configuration
  const handleRemoveConfig = useCallback((index: number) => {
    setDiscoveryConfigs(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Start network discovery
  const startDiscovery = useCallback(() => {
    setIsScanning(true);
    setScanProgress(0);
    setDiscoveredDevices([]);

    // Simulate discovery process
    const totalIps = discoveryConfigs.length * 256; // Simulate scanning 256 IPs per config
    let currentProgress = 0;

    const scanInterval = setInterval(() => {
      currentProgress += Math.random() * 10 + 5;
      setScanProgress(Math.min(currentProgress, totalIps));

      // Randomly discover devices (30% chance per IP)
      if (Math.random() < 0.05) {
        const mac = generateRandomMac();
        const vendor = vendorDatabase[mac.split(':')[0]] || generateRandomVendor();
        const hostname = generateRandomHostname();
        
        const newDevice: DiscoveredDevice = {
          ip: `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
          mac,
          hostname,
          vendor,
          os: detectOS(hostname),
          selected: false,
        };

        setDiscoveredDevices(prev => {
          // Avoid duplicates
          if (prev.some(d => d.ip === newDevice.ip || d.mac === newDevice.mac)) {
            return prev;
          }
          return [...prev, newDevice];
        });
      }

      if (currentProgress >= totalIps) {
        clearInterval(scanInterval);
        setIsScanning(false);
      }
    }, 100);

    return () => clearInterval(scanInterval);
  }, [discoveryConfigs]);

  // Stop discovery
  const stopDiscovery = useCallback(() => {
    setIsScanning(false);
  }, []);

  // Toggle device selection
  const toggleDeviceSelection = useCallback((ip: string) => {
    setDiscoveredDevices(prev => 
      prev.map(device => 
        device.ip === ip ? { ...device, selected: !device.selected } : device
      )
    );
  }, []);

  // Select all devices
  const selectAllDevices = useCallback(() => {
    setDiscoveredDevices(prev => 
      prev.map(device => ({ ...device, selected: true }))
    );
  }, []);

  // Deselect all devices
  const deselectAllDevices = useCallback(() => {
    setDiscoveredDevices(prev => 
      prev.map(device => ({ ...device, selected: false }))
    );
  }, []);

  // Import selected devices
  const handleImport = useCallback(() => {
    const selected = discoveredDevices.filter(d => d.selected);
    onDiscover(selected);
    onClose();
  }, [discoveredDevices, onDiscover, onClose]);

  // Calculate scan percentage
  const scanPercentage = useMemo(() => {
    const totalIps = discoveryConfigs.length * 256;
    return totalIps > 0 ? Math.min((scanProgress / totalIps) * 100, 100) : 0;
  }, [discoveryConfigs.length, scanProgress]);

  return (
    <div className="modal-overlay flex items-center justify-center p-4">
      <div className="modal-content w-full max-w-3xl">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            🔍 Découverte Réseau
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Discovery Configurations */}
          <div>
            <h3 className="text-white font-medium mb-3">Plages IP à scanner</h3>
            
            {/* Add new configuration */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nom</label>
                <input
                  type="text"
                  value={newConfig.name || ''}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Réseau principal"
                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">IP de début</label>
                <input
                  type="text"
                  value={newConfig.startIp || ''}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, startIp: e.target.value }))}
                  placeholder="10.0.0.1"
                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">IP de fin</label>
                <input
                  type="text"
                  value={newConfig.endIp || ''}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, endIp: e.target.value }))}
                  placeholder="10.0.0.254"
                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddConfig}
                  disabled={!newConfig.name || !newConfig.startIp || !newConfig.endIp}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    !newConfig.name || !newConfig.startIp || !newConfig.endIp
                      ? 'bg-blue-600/30 text-blue-400/50 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  ✓ Ajouter
                </button>
              </div>
            </div>

            {/* Existing configurations */}
            <div className="space-y-2">
              {discoveryConfigs.map((config, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-800/30 rounded border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${config.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-white text-sm">{config.name}</span>
                    <span className="text-gray-400 text-xs">
                      {config.startIp} → {config.endIp}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveConfig(index)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {discoveryConfigs.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Aucune plage IP configurée. Ajoutez-en une pour commencer la découverte.
                </p>
              )}
            </div>
          </div>

          {/* Scan Controls */}
          {discoveryConfigs.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={startDiscovery}
                disabled={isScanning}
                className={`flex-1 px-4 py-2 rounded transition-colors ${
                  isScanning
                    ? 'bg-green-600/30 text-green-400/50 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isScanning ? 'Scanning...' : '🔍 Démarrer le scan'}
              </button>
              
              {isScanning && (
                <button
                  onClick={stopDiscovery}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  ⏹ Arrêter
                </button>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isScanning && (
            <div className="p-3 bg-gray-800/30 rounded border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm">Progression du scan</span>
                <span className="text-white text-sm">{scanPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded transition-all duration-100"
                  style={{ width: `${scanPercentage}%` }}
                ></div>
              </div>
              <div className="mt-2">
                <p className="text-gray-400 text-xs">
                  {discoveredDevices.length} périphériques découverts
                </p>
              </div>
            </div>
          )}

          {/* Discovered Devices */}
          {discoveredDevices.length > 0 && (
            <div>
              <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-medium">Périphériques découverts</h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllDevices}
                    className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 text-xs rounded transition-colors"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={deselectAllDevices}
                    className="px-2 py-1 bg-gray-600/30 hover:bg-gray-600/50 text-gray-400 text-xs rounded transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>
              
              <div className="overflow-auto max-h-64 scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-800/90 backdrop-blur-sm">
                    <tr>
                      <th className="p-2 text-left text-gray-400 border-b border-gray-700">
                        <input
                          type="checkbox"
                          checked={discoveredDevices.every(d => d.selected) && discoveredDevices.length > 0}
                          onChange={(e) => e.target.checked ? selectAllDevices() : deselectAllDevices()}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="p-2 text-left text-gray-400 border-b border-gray-700">Adresse IP</th>
                      <th className="p-2 text-left text-gray-400 border-b border-gray-700">Adresse MAC</th>
                      <th className="p-2 text-left text-gray-400 border-b border-gray-700">Nom d'hôte</th>
                      <th className="p-2 text-left text-gray-400 border-b border-gray-700">Fabricant</th>
                      <th className="p-2 text-left text-gray-400 border-b border-gray-700">OS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discoveredDevices.map((device, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors ${
                          device.selected ? 'bg-blue-600/20' : ''
                        }`}
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={device.selected}
                            onChange={() => toggleDeviceSelection(device.ip)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="p-2 text-white mono">{device.ip}</td>
                        <td className="p-2 text-gray-300 mono text-xs">{device.mac}</td>
                        <td className="p-2 text-gray-300">{device.hostname}</td>
                        <td className="p-2 text-gray-300">{device.vendor}</td>
                        <td className="p-2 text-gray-300">{device.os}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Fermer
          </button>
          {discoveredDevices.filter(d => d.selected).length > 0 && (
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              ✓ Importer ({discoveredDevices.filter(d => d.selected).length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkDiscoveryModal;
