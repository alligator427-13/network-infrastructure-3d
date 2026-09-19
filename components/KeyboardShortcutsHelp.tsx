// Keyboard Shortcuts Help Component

import { useState, useCallback, useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  label: string;
  description: string;
  category: string;
}

const keyboardShortcuts: KeyboardShortcut[] = [
  // Navigation
  { key: '1', label: 'Vue d\'ensemble', description: 'Passer à la vue d\'ensemble', category: 'Navigation' },
  { key: '2', label: 'Site Principal', description: 'Focus sur le site principal', category: 'Navigation' },
  { key: '3', label: 'Site Distant', description: 'Focus sur le site distant', category: 'Navigation' },
  { key: '4', label: 'Pradoland 4', description: 'Focus sur Pradoland 4', category: 'Navigation' },
  { key: '5', label: 'Vue de dessus', description: 'Vue aérienne de la scène', category: 'Navigation' },
  { key: '6', label: 'Vue de côté', description: 'Vue latérale de la scène', category: 'Navigation' },

  // Camera
  { key: 'Z', label: 'Zoom automatique', description: 'Zoom automatique sur la sélection', category: 'Camera' },
  { key: 'R', label: 'Réinitialiser la vue', description: 'Réinitialiser la caméra à la position par défaut', category: 'Camera' },

  // Interface
  { key: 'T', label: 'Tableau', description: 'Afficher/Masquer le tableau', category: 'Interface' },
  { key: 'A', label: 'Auto-layout', description: 'Ouvrir la gestion de l\'auto-layout', category: 'Interface' },
  { key: 'E', label: 'Espacement', description: 'Ouvrir la gestion de l\'espacement', category: 'Interface' },
  { key: 'D', label: 'Découverte', description: 'Ouvrir la découverte réseau', category: 'Interface' },
  { key: 'F', label: 'Dalles', description: 'Ouvrir la gestion des dalles', category: 'Interface' },
  { key: 'V', label: 'Vues', description: 'Ouvrir les vues prédéfinies', category: 'Interface' },
  { key: 'P', label: 'Export', description: 'Ouvrir l\'export de médias', category: 'Interface' },
  { key: 'L', label: 'Légende', description: 'Afficher/Masquer la légende', category: 'Interface' },

  // Monitoring
  { key: 'M', label: 'Monitoring', description: 'Activer/Désactiver le monitoring ICMP', category: 'Monitoring' },

  // Appearance
  { key: 'N', label: 'Thème', description: 'Basculer entre le thème jour et nuit', category: 'Appearance' },

  // Help
  { key: '?', label: 'Aide', description: 'Afficher/Masquer l\'aide des raccourcis', category: 'Help' },
  { key: 'Escape', label: 'Fermer', description: 'Fermer les modales et les panneaux', category: 'Help' },
];

const categories = ['Navigation', 'Camera', 'Interface', 'Monitoring', 'Appearance', 'Help'];

const KeyboardShortcutsHelp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Navigation');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter shortcuts by category and search query
  const filteredShortcuts = keyboardShortcuts.filter(shortcut => {
    const matchesCategory = shortcut.category === selectedCategory;
    const matchesSearch = shortcut.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shortcut.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shortcut.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get shortcuts by category for the sidebar
  const shortcutsByCategory = categories.map(category => ({
    category,
    count: keyboardShortcuts.filter(s => s.category === category).length,
  }));

  return (
    <div className="modal-overlay flex items-center justify-center p-4">
      <div className="modal-content w-full max-w-3xl">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            ⌨️ Aide des Raccourcis Clavier
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Rechercher des raccourcis... (ex: T, Navigation, Tableau)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-4">
            {/* Category Sidebar */}
            <div className="w-48 flex-shrink-0">
              <h3 className="text-white font-medium mb-3">Catégories</h3>
              <div className="space-y-1">
                {shortcutsByCategory.map(({ category, count }) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full p-2 rounded text-left transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'bg-gray-800/30 text-gray-300 hover:bg-gray-700/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{category}</span>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Shortcuts List */}
            <div className="flex-1">
              <h3 className="text-white font-medium mb-3">
                Raccourcis {selectedCategory} ({filteredShortcuts.length})
              </h3>
              
              {filteredShortcuts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">❓</div>
                  <p>Aucun raccourci trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-800/30 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <kbd className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-xs font-mono">
                          {shortcut.key}
                        </kbd>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{shortcut.label}</div>
                          <div className="text-sm text-gray-400">{shortcut.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Reference */}
          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium mb-2">Référence rapide</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-700/50 border border-gray-600 rounded">1-6</kbd>
                <span className="text-gray-300">Navigation entre les vues</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-700/50 border border-gray-600 rounded">Z</kbd>
                <span className="text-gray-300">Zoom automatique</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-700/50 border border-gray-600 rounded">R</kbd>
                <span className="text-gray-300">Réinitialiser la vue</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-700/50 border border-gray-600 rounded">T</kbd>
                <span className="text-gray-300">Tableau</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-700/50 border border-gray-600 rounded">M</kbd>
                <span className="text-gray-300">Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-700/50 border border-gray-600 rounded">N</kbd>
                <span className="text-gray-300">Thème jour/nuit</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-700/50 border border-gray-600 rounded">?</kbd>
                <span className="text-gray-300">Aide</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-gray-700/50 border border-gray-600 rounded">Esc</kbd>
                <span className="text-gray-300">Fermer</span>
              </div>
            </div>
          </div>

          {/* Mouse Controls */}
          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium mb-2">Contrôles de la souris</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🖱️ Clic gauche + glisser</span>
                <span className="text-white">Rotation de la caméra</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🖱️ Clic droit + glisser</span>
                <span className="text-white">Déplacement</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🖱️ Molette</span>
                <span className="text-white">Zoom avant/arrière</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🖱️ Clic sur équipement</span>
                <span className="text-white">Sélection</span>
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

export default KeyboardShortcutsHelp;
