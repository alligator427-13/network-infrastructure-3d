// Camera Views Selector Component

import { useState, useCallback } from 'react';
import { CameraView, PREDEFINED_VIEWS, TransitionType, EasingType } from '../types';

interface CameraViewsSelectorProps {
  onClose: () => void;
  onSelectView: (view: CameraView) => void;
  currentViewId: string | null;
}

const transitionTypes: TransitionType[] = ['direct', 'arc', 'spiral', 'zoom'];
const easingTypes: EasingType[] = ['linear', 'easeInOut', 'easeOut', 'bounce', 'elastic'];

const CameraViewsSelector: React.FC<CameraViewsSelectorProps> = ({
  onClose,
  onSelectView,
  currentViewId,
}) => {
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>('direct');
  const [selectedEasing, setSelectedEasing] = useState<EasingType>('easeInOut');
  const [customViews, setCustomViews] = useState<CameraView[]>([]);
  const [newViewName, setNewViewName] = useState('');

  // Combine predefined and custom views
  const allViews = [...PREDEFINED_VIEWS, ...customViews];

  const handleSelectView = useCallback((view: CameraView) => {
    onSelectView({ ...view, transition: { type: selectedTransition, easing: selectedEasing, duration: 2 } });
    onClose();
  }, [onSelectView, onClose, selectedTransition, selectedEasing]);

  const handleSaveCustomView = useCallback(() => {
    if (!newViewName.trim()) return;

    const newView: CameraView = {
      id: `custom-${Date.now()}`,
      name: newViewName,
      position: [0, 20, 30],
      target: [0, 0, 0],
      icon: '📍',
      description: `Vue personnalisée: ${newViewName}`,
    };

    setCustomViews(prev => [...prev, newView]);
    setNewViewName('');
  }, [newViewName]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Vues Prédéfinies</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Transition Settings */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Paramètres de transition</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type de transition</label>
              <select
                value={selectedTransition}
                onChange={(e) => setSelectedTransition(e.target.value as TransitionType)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {transitionTypes.map(type => (
                  <option key={type} value={type} className="bg-gray-800">
                    {type === 'direct' ? 'Directe' : 
                     type === 'arc' ? 'Arc' : 
                     type === 'spiral' ? 'Spirale' : 'Zoom'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Easing</label>
              <select
                value={selectedEasing}
                onChange={(e) => setSelectedEasing(e.target.value as EasingType)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {easingTypes.map(type => (
                  <option key={type} value={type} className="bg-gray-800">
                    {type === 'linear' ? 'Linéaire' : 
                     type === 'easeInOut' ? 'Ease In/Out' : 
                     type === 'easeOut' ? 'Ease Out' : 
                     type === 'bounce' ? 'Rebond' : 'Élastique'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Predefined Views */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Vues Prédéfinies</h3>
          <div className="grid grid-cols-2 gap-2">
            {PREDEFINED_VIEWS.map(view => (
              <button
                key={view.id}
                onClick={() => handleSelectView(view)}
                className={`px-4 py-3 rounded-lg border transition-all text-left ${
                  currentViewId === view.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                <div className="font-medium">{view.icon} {view.name}</div>
                <div className="text-xs text-gray-400 truncate">{view.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Views */}
        {customViews.length > 0 && (
          <div className="p-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Vues Personnalisées</h3>
            <div className="grid grid-cols-2 gap-2">
              {customViews.map(view => (
                <button
                  key={view.id}
                  onClick={() => handleSelectView(view)}
                  className="px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors text-left"
                >
                  <div className="font-medium">{view.icon} {view.name}</div>
                  <div className="text-xs text-gray-400 truncate">{view.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save Custom View */}
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Sauvegarder une vue personnalisée</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="Nom de la vue..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSaveCustomView}
              disabled={!newViewName.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Sauvegarder
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Note: Pour sauvegarder la vue actuelle, positionnez d'abord la caméra comme souhaité, puis cliquez ici.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-700">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraViewsSelector;
