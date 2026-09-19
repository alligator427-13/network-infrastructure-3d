// Add Site Modal Component

import { useState, useCallback } from 'react';
import { NetworkNode, NetworkLink, SiteConfig, EquipmentType, StatusType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AddSiteModalProps {
  onClose: () => void;
  onAddSite: (nodes: NetworkNode[], links: NetworkLink[]) => void;
}

const AddSiteModal: React.FC<AddSiteModalProps> = ({ onClose, onAddSite }) => {
  const [step, setStep] = useState(1);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    name: '',
    ipRange: '10.0.0.0/24',
    position: [0, 0, 0] as [number, number, number],
    floors: 1,
    includeRouter: true,
    includeFirewall: true,
    switchCount: 2,
    wifiCount: 4,
    includeNas: true,
  });
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());

  // Equipment types that can be included
  const availableEquipment = [
    { id: 'router', label: 'Routeur', default: true },
    { id: 'firewall', label: 'Firewall', default: true },
    { id: 'switch', label: 'Switch', default: true },
    { id: 'wifi', label: 'Point d\'acc\u00e8s WiFi', default: true },
    { id: 'nas', label: 'NAS', default: true },
    { id: 'server', label: 'Serveur', default: false },
    { id: 'dc', label: 'Contr\u00f4leur de Domaine', default: false },
    { id: 'veeam', label: 'Veeam Backup', default: false },
  ];

  // Handle configuration changes
  const handleConfigChange = useCallback((field: keyof SiteConfig, value: string | number | boolean | [number, number, number]) => {
    setSiteConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  // Toggle equipment selection
  const toggleEquipment = useCallback((equipmentId: string) => {
    setSelectedEquipment(prev => {
      const newSet = new Set(prev);
      if (newSet.has(equipmentId)) {
        newSet.delete(equipmentId);
      } else {
        newSet.add(equipmentId);
      }
      return newSet;
    });
  }, []);

  // Initialize selected equipment
  const initializeSelectedEquipment = useCallback(() => {
    const initialSet = new Set<string>();
    availableEquipment.forEach(eq => {
      if (eq.default) {
        initialSet.add(eq.id);
      }
    });
    setSelectedEquipment(initialSet);
  }, [availableEquipment]);

  // IP address generator
  const getNextIp = useCallback(() => {
    const ipParts = siteConfig.ipRange.split('.').map(p => parseInt(p.split('/')[0], 10));
    const prefix = ipParts.slice(0, 3).join('.');
    const ipCount = Math.floor(Math.random() * 254) + 1;
    return `${prefix}.${ipCount}`;
  }, [siteConfig.ipRange]);

  // Generate site nodes and links
  const generateSite = useCallback((): { nodes: NetworkNode[]; links: NetworkLink[] } => {
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];
    const buildingId = `site-${siteConfig.name.toLowerCase().replace(/\s+/g, '-')}`;
    const baseX = siteConfig.position[0];
    const baseZ = siteConfig.position[2];

    // Router
    if (selectedEquipment.has('router') || siteConfig.includeRouter) {
      nodes.push({
        id: uuidv4(),
        name: `RTR-${siteConfig.name.toUpperCase()}`,
        type: 'router' as EquipmentType,
        ip: getNextIp(),
        vlan: 'VLAN 999',
        subnet: siteConfig.ipRange,
        status: 'online' as StatusType,
        position: [baseX - 3, 0, baseZ] as [number, number, number],
        description: `Routeur pour ${siteConfig.name}`,
        details: { role: 'Site Gateway' },
        floor: 0,
        buildingId,
      });
    }

    // Firewall
    if (selectedEquipment.has('firewall') || siteConfig.includeFirewall) {
      nodes.push({
        id: uuidv4(),
        name: `FW-${siteConfig.name.toUpperCase()}`,
        type: 'firewall' as EquipmentType,
        ip: getNextIp(),
        vlan: 'VLAN 999',
        subnet: siteConfig.ipRange,
        status: 'online' as StatusType,
        position: [baseX, 0, baseZ] as [number, number, number],
        description: `Firewall pour ${siteConfig.name}`,
        details: { role: 'Security Gateway' },
        floor: 0,
        buildingId,
      });
    }

    // Switches
    const switchCount = siteConfig.switchCount;
    for (let i = 1; i <= switchCount; i++) {
      if (selectedEquipment.has('switch') || i <= 2) {
        nodes.push({
          id: uuidv4(),
          name: `SW-${siteConfig.name.toUpperCase()}-${i}`,
          type: 'switch' as EquipmentType,
          ip: getNextIp(),
          vlan: 'VLAN 100',
          subnet: siteConfig.ipRange,
          status: 'online' as StatusType,
          position: [baseX + 3 + (i - 1) * 3, 0, baseZ] as [number, number, number],
          description: `Switch ${i} pour ${siteConfig.name}`,
          details: { model: 'Cisco Catalyst 9300', ports: '48x 10G' },
          floor: 0,
          buildingId,
        });
      }
    }

    // NAS
    if ((selectedEquipment.has('nas') || siteConfig.includeNas) && siteConfig.switchCount > 0) {
      nodes.push({
        id: uuidv4(),
        name: `NAS-${siteConfig.name.toUpperCase()}`,
        type: 'nas' as EquipmentType,
        ip: getNextIp(),
        vlan: 'VLAN 100',
        subnet: siteConfig.ipRange,
        status: 'online' as StatusType,
        position: [baseX + 3, 0, baseZ + 5] as [number, number, number],
        description: `NAS pour ${siteConfig.name}`,
        details: { model: 'Synology RS3621xs+', capacity: '100TB' },
        floor: 0,
        buildingId,
      });
    }

    // WiFi Access Points
    const wifiCount = siteConfig.wifiCount;
    const wifiPositions: [number, number, number][] = [
      [baseX - 5, 0, baseZ - 5],
      [baseX + 5, 0, baseZ - 5],
      [baseX - 5, 0, baseZ + 5],
      [baseX + 5, 0, baseZ + 5],
      [baseX - 7, 0, baseZ],
      [baseX + 7, 0, baseZ],
    ];

    for (let i = 1; i <= Math.min(wifiCount, wifiPositions.length); i++) {
      if (selectedEquipment.has('wifi') || i <= 2) {
        const floor = i <= 2 ? 0 : 1;
        nodes.push({
          id: uuidv4(),
          name: `AP-${siteConfig.name.toUpperCase()}-${i}`,
          type: 'wifi' as EquipmentType,
          ip: getNextIp(),
          vlan: 'VLAN 101',
          subnet: siteConfig.ipRange,
          status: 'online' as StatusType,
          position: wifiPositions[i - 1],
          description: `Point d'acc\u00e8s WiFi ${i} pour ${siteConfig.name}`,
          details: { model: 'Meraki MR56', standard: 'WiFi 6' },
          floor,
          buildingId,
        });
      }
    }

    // Domain Controller
    if (selectedEquipment.has('dc')) {
      nodes.push({
        id: uuidv4(),
        name: `DC-${siteConfig.name.toUpperCase()}`,
        type: 'dc' as EquipmentType,
        ip: getNextIp(),
        vlan: 'VLAN 100',
        subnet: siteConfig.ipRange,
        status: 'online' as StatusType,
        position: [baseX + 2, 0, baseZ + 3] as [number, number, number],
        description: `Contr\u00f4leur de domaine pour ${siteConfig.name}`,
        details: { os: 'Windows Server 2022', role: 'Primary DC' },
        floor: 0,
        buildingId,
      });
    }

    // Veeam
    if (selectedEquipment.has('veeam')) {
      nodes.push({
        id: uuidv4(),
        name: `VEEAM-${siteConfig.name.toUpperCase()}`,
        type: 'veeam' as EquipmentType,
        ip: getNextIp(),
        vlan: 'VLAN 200',
        subnet: siteConfig.ipRange,
        status: 'online' as StatusType,
        position: [baseX + 4, 0, baseZ + 3] as [number, number, number],
        description: `Veeam Backup pour ${siteConfig.name}`,
        details: { version: 'v12', role: 'Backup Server' },
        floor: 0,
        buildingId,
      });
    }

    // Server
    if (selectedEquipment.has('server')) {
      nodes.push({
        id: uuidv4(),
        name: `SRV-${siteConfig.name.toUpperCase()}`,
        type: 'server' as EquipmentType,
        ip: getNextIp(),
        vlan: 'VLAN 100',
        subnet: siteConfig.ipRange,
        status: 'online' as StatusType,
        position: [baseX + 1, 0, baseZ - 3] as [number, number, number],
        description: `Serveur pour ${siteConfig.name}`,
        details: { os: 'Ubuntu Server 22.04', cpu: '32 cores', ram: '128GB' },
        floor: 0,
        buildingId,
      });
    }

    // Generate links between equipment
    const router = nodes.find(n => n.type === 'router');
    const firewall = nodes.find(n => n.type === 'firewall');
    const switches = nodes.filter(n => n.type === 'switch');
    const nas = nodes.find(n => n.type === 'nas');
    const dc = nodes.find(n => n.type === 'dc');
    const veeam = nodes.find(n => n.type === 'veeam');
    const server = nodes.find(n => n.type === 'server');
    const wifiAps = nodes.filter(n => n.type === 'wifi');

    // Router to Firewall
    if (router && firewall) {
      links.push({
        id: uuidv4(),
        from: router.id,
        to: firewall.id,
        type: 'ethernet',
        speed: '1 Gbps',
        vlan: 'VLAN 999',
      });
    }

    // Firewall to Switches
    if (firewall && switches.length > 0) {
      switches.forEach((sw, index) => {
        links.push({
          id: uuidv4(),
          from: firewall.id,
          to: sw.id,
          type: 'ethernet',
          speed: '1 Gbps',
          vlan: 'VLAN 100',
        });
      });
    }

    // Switches to NAS
    if (switches.length > 0 && nas) {
      links.push({
        id: uuidv4(),
        from: switches[0].id,
        to: nas.id,
        type: 'ethernet',
        speed: '10 Gbps',
        vlan: 'VLAN 100',
      });
    }

    // Switches to DC
    if (switches.length > 0 && dc) {
      links.push({
        id: uuidv4(),
        from: switches[0].id,
        to: dc.id,
        type: 'ethernet',
        speed: '1 Gbps',
        vlan: 'VLAN 100',
      });
    }

    // Switches to Veeam
    if (switches.length > 0 && veeam) {
      links.push({
        id: uuidv4(),
        from: switches[0].id,
        to: veeam.id,
        type: 'ethernet',
        speed: '10 Gbps',
        vlan: 'VLAN 200',
      });
    }

    // Switches to Server
    if (switches.length > 0 && server) {
      links.push({
        id: uuidv4(),
        from: switches[0].id,
        to: server.id,
        type: 'ethernet',
        speed: '1 Gbps',
        vlan: 'VLAN 100',
      });
    }

    // Switches to WiFi APs
    if (switches.length > 0 && wifiAps.length > 0) {
      wifiAps.forEach(ap => {
        links.push({
          id: uuidv4(),
          from: switches[0].id,
          to: ap.id,
          type: 'ethernet',
          speed: '2.5 Gbps',
          vlan: 'VLAN 101',
        });
      });
    }

    // Inter-switch links
    for (let i = 0; i < switches.length - 1; i++) {
      links.push({
        id: uuidv4(),
        from: switches[i].id,
        to: switches[i + 1].id,
        type: 'ethernet',
        speed: '10 Gbps',
        vlan: 'Trunk',
      });
    }

    return { nodes, links };
  }, [siteConfig, selectedEquipment, getNextIp]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    const { nodes, links } = generateSite();
    onAddSite(nodes, links);
    onClose();
  }, [generateSite, onAddSite, onClose]);

  // Go to next step
  const goToNextStep = useCallback(() => {
    if (step === 1) {
      if (!siteConfig.name.trim()) {
        return;
      }
      initializeSelectedEquipment();
    }
    setStep(step + 1);
  }, [step, siteConfig.name, initializeSelectedEquipment]);

  // Go to previous step
  const goToPreviousStep = useCallback(() => {
    setStep(step - 1);
  }, [step]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Ajouter un Site</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between px-4 py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                {s}
              </div>
              {s < 3 && <div className={`w-16 sm:w-24 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Site Configuration */}
        {step === 1 && (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Configuration du Site</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nom du Site</label>
                <input
                  type="text"
                  value={siteConfig.name}
                  onChange={(e) => handleConfigChange('name', e.target.value)}
                  placeholder="Ex: Site Distant"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Plage IP</label>
                <input
                  type="text"
                  value={siteConfig.ipRange}
                  onChange={(e) => handleConfigChange('ipRange', e.target.value)}
                  placeholder="Ex: 10.80.0.0/24"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Position (X, Y, Z)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={siteConfig.position[0]}
                    onChange={(e) => handleConfigChange('position', [parseFloat(e.target.value) || 0, siteConfig.position[1], siteConfig.position[2]])}
                    placeholder="X"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={siteConfig.position[1]}
                    onChange={(e) => handleConfigChange('position', [siteConfig.position[0], parseFloat(e.target.value) || 0, siteConfig.position[2]])}
                    placeholder="Y"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={siteConfig.position[2]}
                    onChange={(e) => handleConfigChange('position', [siteConfig.position[0], siteConfig.position[1], parseFloat(e.target.value) || 0])}
                    placeholder="Z"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre d'\u00e9tages</label>
                <input
                  type="number"
                  value={siteConfig.floors}
                  onChange={(e) => handleConfigChange('floors', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Equipment Selection */}
        {step === 2 && (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">S\u00e9lection des \u00e9quipements</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableEquipment.map((eq) => {
                const isSelected = selectedEquipment.has(eq.id);
                return (
                  <button
                    key={eq.id}
                    onClick={() => toggleEquipment(eq.id)}
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium">{eq.label}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de Switches</label>
                <input
                  type="number"
                  value={siteConfig.switchCount}
                  onChange={(e) => handleConfigChange('switchCount', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de Points d'acc\u00e8s WiFi</label>
                <input
                  type="number"
                  value={siteConfig.wifiCount}
                  onChange={(e) => handleConfigChange('wifiCount', Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">R\u00e9capitulatif</h3>
            <div className="bg-gray-700 rounded p-4 mb-4">
              <h4 className="font-semibold text-white mb-2">Configuration du Site</h4>
              <p className="text-gray-300"><strong>Nom:</strong> {siteConfig.name}</p>
              <p className="text-gray-300"><strong>Plage IP:</strong> {siteConfig.ipRange}</p>
              <p className="text-gray-300"><strong>Position:</strong> [{siteConfig.position.join(', ')}]</p>
              <p className="text-gray-300"><strong>\u00c9tages:</strong> {siteConfig.floors}</p>
            </div>
            <div className="bg-gray-700 rounded p-4 mb-4">
              <h4 className="font-semibold text-white mb-2">\u00c9quipements s\u00e9lectionn\u00e9s</h4>
              <ul className="text-gray-300">
                {Array.from(selectedEquipment).map(eqId => {
                  const eq = availableEquipment.find(e => e.id === eqId);
                  return <li key={eqId}>{eq?.label || eqId}</li>;
                })}
                <li>Switches: {siteConfig.switchCount}</li>
                <li>Points d'acc\u00e8s WiFi: {siteConfig.wifiCount}</li>
              </ul>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <h4 className="font-semibold text-white mb-2">Pr\u00e9visualisation</h4>
              <p className="text-gray-300">
                {selectedEquipment.size} types d'\u00e9quipements + {siteConfig.switchCount} switches + {siteConfig.wifiCount} points d'acc\u00e8s WiFi = {selectedEquipment.size + siteConfig.switchCount + siteConfig.wifiCount} \u00e9quipements au total
              </p>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-between p-4 border-t border-gray-700">
          {step > 1 && (
            <button onClick={goToPreviousStep} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
              Pr\u00e9c\u00e9dent
            </button>
          )}
          {step < 3 ? (
            <button onClick={goToNextStep} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors ml-auto">
              Suivant
            </button>
          ) : (
            <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors ml-auto">
              Terminer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddSiteModal;
