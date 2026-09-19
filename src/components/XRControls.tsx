// XR Controls Component

import { useState, useCallback, useEffect } from 'react';
import type { VRConfig } from '../types';

interface XRControlsProps {
  config: VRConfig;
  onClose: () => void;
  onUpdate: (config: VRConfig) => void;
}

const xrModes = [
  { id: 'vr' as const, name: 'VR', description: 'Mode réalité virtuelle' },
  { id: 'ar' as const, name: 'AR', description: 'Mode réalité augmentée' },
];

const XRControls: React.FC<XRControlsProps> = ({ config, onClose, onUpdate }) => {
  const [currentConfig, setCurrentConfig] = useState<VRConfig>(config);
  const [isXRAvailable, setIsXRAvailable] = useState(false);
  const [xrSession, setXrSession] = useState<XRSession | null>(null);

  // Check for WebXR support
  useEffect(() => {
    const checkXRSupport = async () => {
      try {
        if (navigator.xr) {
          const available = await navigator.xr.isSessionSupported('immersive-vr');
          setIsXRAvailable(available);
        }
      } catch (error) {
        console.log('WebXR not available:', error);
      }
    };

    checkXRSupport();
  }, []);

  // Handle mode change
  const handleModeChange = useCallback((mode: 'vr' | 'ar') => {
    setCurrentConfig(prev => ({ ...prev, mode }));
  }, []);

  // Handle eye separation change
  const handleEyeSeparationChange = useCallback((value: number) => {
    setCurrentConfig(prev => ({ ...prev, eyeSeparation: value }));
  }, []);

  // Handle opacity change
  const handleOpacityChange = useCallback((value: number) => {
    setCurrentConfig(prev => ({ ...prev, opacity: value }));
  }, []);

  // Toggle XR mode
  const handleToggleXR = useCallback(async () => {
    if (!isXRAvailable && currentConfig.mode === 'vr') {
      alert('WebXR (VR) n\'est pas disponible dans ce navigateur. Essayez Chrome ou Edge.');
      return;
    }

    const newEnabled = !currentConfig.enabled;
    setCurrentConfig(prev => ({ ...prev, enabled: newEnabled }));

    if (newEnabled) {
      try {
        if (currentConfig.mode === 'vr') {
          // Request immersive VR session
          const session = await navigator.xr!.requestSession('immersive-vr');
          setXrSession(session);
          
          session.addEventListener('end', () => {
            setXrSession(null);
            setCurrentConfig(prev => ({ ...prev, enabled: false }));
          });
        } else {
          // For AR, we just enable the visual mode
          // In a real implementation, we would request an AR session
        }
      } catch (error) {
        console.error('Failed to start XR session:', error);
        setCurrentConfig(prev => ({ ...prev, enabled: false }));
      }
    } else {
      if (xrSession) {
        await xrSession.end();
        setXrSession(null);
      }
    }
  }, [currentConfig, isXRAvailable, xrSession]);

  // Apply and close
  const handleApply = useCallback(() => {
    onUpdate(currentConfig);
    onClose();
  }, [currentConfig, onUpdate, onClose]);

  // Get mode color
  const getModeColor = (mode: 'vr' | 'ar') => {
    if (!isXRAvailable && mode === 'vr') {
      return 'bg-gray-600/30 text-gray-500';
    }
    return currentConfig.mode === mode
      ? 'border-blue-500 bg-blue-600/20'
      : 'border-gray-600 bg-gray-800/30 hover:border-gray-500';
  };

  return (
    <div className="modal-overlay flex items-center justify-center p-4">
      <div className="modal-content w-full max-w-lg">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            🕶️ Contrôles VR/AR
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* XR Mode Toggle */}
          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 text-center">
            <div className="text-4xl mb-2">
              {currentConfig.enabled ? (
                currentConfig.mode === 'vr' ? '🕶️' : '📱'
              ) : '⏸️'}
            </div>
            <div className="text-white font-medium mb-2">
              {currentConfig.enabled ? 
                (currentConfig.mode === 'vr' ? 'Mode VR Activé' : 'Mode AR Activé') :
                'Mode XR Désactivé'}
            </div>
            <button
              onClick={handleToggleXR}
              className={`px-6 py-2 rounded-lg transition-colors ${
                currentConfig.enabled
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {currentConfig.enabled ? 'Désactiver XR' : 'Activer XR'}
            </button>
            
            {!isXRAvailable && currentConfig.mode === 'vr' && (
              <div className="mt-3 text-xs text-yellow-400">
                ⚠️ WebXR (VR) n'est pas disponible dans ce navigateur
              </div>
            )}
          </div>

          {/* Mode Selection */}
          <div>
            <h3 className="text-white font-medium mb-3">Mode XR</h3>
            <div className="grid grid-cols-2 gap-2">
              {xrModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id)}
                  disabled={!isXRAvailable && mode.id === 'vr'}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    getModeColor(mode.id)
                  } ${!isXRAvailable && mode.id === 'vr' ? 'cursor-not-allowed' : ''}`}
                >
                  <div className="text-2xl mb-2">{mode.id === 'vr' ? '🕶️' : '📱'}</div>
                  <div className="font-medium text-white">{mode.name}</div>
                  <div className="text-xs text-gray-400">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h3 className="text-white font-medium mb-3">Configuration</h3>
            
            {/* Eye Separation (VR only) */}
            {currentConfig.mode === 'vr' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-300">Séparation des yeux</label>
                  <span className="text-white text-sm">{currentConfig.eyeSeparation}mm</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="80"
                  step="1"
                  value={currentConfig.eyeSeparation}
                  onChange={(e) => handleEyeSeparationChange(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50mm</span>
                  <span>80mm</span>
                </div>
              </div>
            )}

            {/* Opacity (AR only) */}
            {currentConfig.mode === 'ar' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-300">Opacité du fond</label>
                  <span className="text-white text-sm">{currentConfig.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={currentConfig.opacity}
                  onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
            <h4 className="text-white font-medium mb-2">Instructions</h4>
            <div className="text-xs text-gray-400 space-y-1">
              {currentConfig.mode === 'vr' ? (
                <>
                  <p>🕶️ <strong>Mode VR:</strong></p>
                  <ul className="list-disc list-inside ml-3">
                    <li>Utilisez un casque VR compatible WebXR</li>
                    <li>Assurez-vous que votre navigateur supporte WebXR</li>
                    <li>Chrome et Edge sont recommandés pour le VR</li>
                    <li>Ajustez la séparation des yeux pour votre confort</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>📱 <strong>Mode AR:</strong></p>
                  <ul className="list-disc list-inside ml-3">
                    <li>Utilisez un appareil mobile avec caméra</li>
                    <li>Pointez la caméra vers une surface plane</li>
                    <li>Ajustez l'opacité pour voir la scène superposée</li>
                    <li>Déplacez votre appareil pour explorer la scène</li>
                  </ul>
                </>
              )}
              <p className="mt-2">
                ⚠️ La compatibilité dépend de votre navigateur et matériel.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium mb-2">Prévisualisation</h3>
            <div className="relative w-full h-32 bg-gray-900/50 rounded border border-gray-700 overflow-hidden flex items-center justify-center">
              {currentConfig.enabled ? (
                currentConfig.mode === 'vr' ? (
                  <div className="text-center">
                    <div className="text-4xl mb-2">👀</div>
                    <div className="text-white text-sm">Vue stéréoscopique</div>
                    <div className="text-xs text-gray-400">
                      Séparation: {currentConfig.eyeSeparation}mm
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <div className="text-white text-sm">Vue AR</div>
                    <div className="text-xs text-gray-400">
                      Opacité: {currentConfig.opacity}%
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">⏸️</div>
                  <div className="text-sm">Mode XR désactivé</div>
                </div>
              )}
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
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            ✓ Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};

export default XRControls;
