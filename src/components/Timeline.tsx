// Timeline Component

import { useState, useCallback } from 'react';
import type { TimelineEntry } from '../types';

interface FormattedTimelineEntry extends TimelineEntry {
  relativeTime: string;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
}

interface TimelineProps {
  entries: FormattedTimelineEntry[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

const Timeline: React.FC<TimelineProps> = ({
  entries,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
}) => {
  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Ajout':
        return '➕';
      case 'Suppression':
        return '🗑️';
      case 'Modification':
        return '✏️';
      case 'Déplacement':
        return '🔀';
      case 'Auto-layout':
        return '🎨';
      default:
        return '📝';
    }
  };

  // Get action color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'Ajout':
        return 'text-green-400';
      case 'Suppression':
        return 'text-red-400';
      case 'Modification':
        return 'text-blue-400';
      case 'Déplacement':
        return 'text-purple-400';
      case 'Auto-layout':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      id="right-panel"
      className="w-96 h-full flex flex-col"
    >
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold text-lg">⏱️ Timeline Historique</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              canUndo
                ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-400'
                : 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
            }`}
            title="Annuler (Ctrl+Z)"
          >
            ↶ Annuler
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              canRedo
                ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-400'
                : 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
            }`}
            title="Rétablir (Ctrl+Y)"
          >
            ↷ Rétablir
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-sm rounded transition-colors"
            title="Effacer l'historique"
          >
            🗑️ Effacer
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {entries.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">⏱️</div>
            <p>Aucune action dans l'historique</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`p-3 rounded-lg transition-colors ${
                entry.isCurrent
                  ? 'bg-blue-600/20 border border-blue-500'
                  : entry.isPast
                  ? 'bg-gray-800/50 opacity-70'
                  : entry.isFuture
                  ? 'bg-gray-800/50 opacity-50'
                  : 'bg-gray-800/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span className={`text-2xl ${getActionColor(entry.action)}`}>
                    {entry.icon || getActionIcon(entry.action)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getActionColor(entry.action)}`}>
                        {entry.action}
                      </span>
                      {entry.isCurrent && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                          Actuel
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {entry.relativeTime}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{entry.description}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Timeline;
