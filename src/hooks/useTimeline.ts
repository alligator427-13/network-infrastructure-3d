// Custom hook for timeline and undo/redo functionality

import { useState, useCallback, useRef, useEffect } from 'react';
import type { NetworkNode, NetworkLink, TimelineEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TimelineState {
  history: TimelineEntry[];
  currentIndex: number;
  nodesHistory: NetworkNode[][];
  linksHistory: NetworkLink[][];
}

export function useTimeline(initialNodes: NetworkNode[], initialLinks: NetworkLink[]) {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    history: [],
    currentIndex: -1,
    nodesHistory: [initialNodes],
    linksHistory: [initialLinks],
  });

  const maxHistory = 100; // Maximum number of history entries to keep

  // Add a new entry to the timeline
  const addEntry = useCallback((
    action: string,
    description: string,
    icon: string,
    nodes: NetworkNode[],
    links: NetworkLink[]
  ) => {
    setTimelineState(prev => {
      const newIndex = prev.currentIndex + 1;
      
      // Truncate history if we're not at the end
      const truncatedHistory = prev.history.slice(0, newIndex);
      const truncatedNodesHistory = prev.nodesHistory.slice(0, newIndex + 1);
      const truncatedLinksHistory = prev.linksHistory.slice(0, newIndex + 1);

      const newEntry: TimelineEntry = {
        id: uuidv4(),
        timestamp: Date.now(),
        action,
        description,
        icon,
        nodesSnapshot: nodes,
        linksSnapshot: links,
      };

      // Limit history size
      if (truncatedHistory.length >= maxHistory) {
        truncatedHistory.shift();
        truncatedNodesHistory.shift();
        truncatedLinksHistory.shift();
      }

      return {
        history: [...truncatedHistory, newEntry],
        currentIndex: newIndex,
        nodesHistory: [...truncatedNodesHistory, nodes],
        linksHistory: [...truncatedLinksHistory, links],
      };
    });
  }, []);

  // Undo - go back to previous state
  const undo = useCallback(() => {
    setTimelineState(prev => {
      if (prev.currentIndex <= 0) {
        return prev; // Can't undo further
      }

      return {
        ...prev,
        currentIndex: prev.currentIndex - 1,
      };
    });
  }, []);

  // Redo - go forward to next state
  const redo = useCallback(() => {
    setTimelineState(prev => {
      if (prev.currentIndex >= prev.history.length - 1) {
        return prev; // Can't redo further
      }

      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
      };
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setTimelineState({
      history: [],
      currentIndex: -1,
      nodesHistory: [timelineState.nodesHistory[timelineState.currentIndex + 1] || []],
      linksHistory: [timelineState.linksHistory[timelineState.currentIndex + 1] || []],
    });
  }, [timelineState]);

  // Get current nodes and links
  const getCurrentState = useCallback(() => ({
    nodes: timelineState.nodesHistory[timelineState.currentIndex + 1] || [],
    links: timelineState.linksHistory[timelineState.currentIndex + 1] || [],
  }), [timelineState]);

  // Check if undo is possible
  const canUndo = useCallback(() => timelineState.currentIndex > 0, [timelineState]);

  // Check if redo is possible
  const canRedo = useCallback(
    () => timelineState.currentIndex < timelineState.history.length - 1,
    [timelineState]
  );

  // Get formatted timeline entries with relative timestamps
  const getFormattedEntries = useCallback(() => {
    const now = Date.now();
    return timelineState.history.map((entry, index) => {
      const isCurrent = index === timelineState.currentIndex;
      const isPast = index < timelineState.currentIndex;
      const isFuture = index > timelineState.currentIndex;

      const timeDiff = now - entry.timestamp;
      const minutes = Math.floor(timeDiff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let relativeTime = '';
      if (days > 0) {
        relativeTime = `Il y a ${days} jour${days > 1 ? 's' : ''}`;
      } else if (hours > 0) {
        relativeTime = `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
      } else if (minutes > 0) {
        relativeTime = `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
      } else {
        relativeTime = 'À l\'instant';
      }

      return {
        ...entry,
        relativeTime,
        isCurrent,
        isPast,
        isFuture,
      };
    });
  }, [timelineState]);

  // Reset timeline with new initial state
  const resetTimeline = useCallback((nodes: NetworkNode[], links: NetworkLink[]) => {
    setTimelineState({
      history: [],
      currentIndex: -1,
      nodesHistory: [nodes],
      linksHistory: [links],
    });
  }, []);

  return {
    history: timelineState.history,
    currentIndex: timelineState.currentIndex,
    addEntry,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getCurrentState,
    getFormattedEntries,
    resetTimeline,
  };
}

export default useTimeline;
