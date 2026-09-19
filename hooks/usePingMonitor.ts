// Custom hook for ICMP monitoring simulation

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NetworkNode, PingResult, StatusType } from '../types';

export interface PingMonitorConfig {
  pingMode: 'simulation' | 'real';
  pingInterval: number; // in milliseconds
}

const DEFAULT_CONFIG: PingMonitorConfig = {
  pingMode: 'simulation',
  pingInterval: 5000,
};

export function usePingMonitor(nodes: NetworkNode[]) {
  const [pingResults, setPingResults] = useState<Map<string, PingResult>>(new Map());
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [config, setConfig] = useState<PingMonitorConfig>(DEFAULT_CONFIG);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize ping results with default values
  useEffect(() => {
    const initialResults = new Map<string, PingResult>();
    nodes.forEach(node => {
      initialResults.set(node.id, {
        nodeId: node.id,
        status: node.status || 'offline',
        latency: null,
        packetLoss: 0,
        lastCheck: Date.now(),
        history: [],
      });
    });
    setPingResults(initialResults);
  }, [nodes]);

  // Simulate ping for a single node
  const simulatePing = useCallback((node: NetworkNode): PingResult => {
    const now = Date.now();
    const nodeStatus = node.status || 'online';
    
    // Simulate different latency based on status
    let latency: number | null = null;
    let packetLoss = 0;
    let status: StatusType = nodeStatus;

    if (nodeStatus === 'online') {
      // Online: 5-50ms latency
      latency = Math.random() * 45 + 5;
      packetLoss = Math.random() < 0.01 ? 1 : 0; // 1% chance of packet loss
      status = 'online';
    } else if (nodeStatus === 'warning') {
      // Warning: 100-250ms latency
      latency = Math.random() * 150 + 100;
      packetLoss = Math.random() < 0.05 ? 1 : 0; // 5% chance of packet loss
      status = 'warning';
    } else {
      // Offline: timeout (null latency)
      latency = null;
      packetLoss = 100;
      status = 'offline';
      
      // 30% chance to come back online
      if (Math.random() < 0.3) {
        latency = Math.random() * 45 + 5;
        packetLoss = 0;
        status = 'online';
      }
    }

    // Get previous result for this node
    const previousResult = pingResults.get(node.id);
    const history = previousResult ? [...previousResult.history, latency || 0] : [];
    
    // Keep only last 10 measurements
    const trimmedHistory = history.slice(-10);

    return {
      nodeId: node.id,
      status,
      latency,
      packetLoss,
      lastCheck: now,
      history: trimmedHistory,
    };
  }, [pingResults]);

  // Perform ping for all nodes
  const pingAllNodes = useCallback(() => {
    const newResults = new Map<string, PingResult>();
    
    nodes.forEach(node => {
      const result = simulatePing(node);
      newResults.set(node.id, result);
    });

    setPingResults(newResults);
  }, [nodes, simulatePing]);

  // Set up monitoring interval
  useEffect(() => {
    if (!isMonitoring) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial ping
    pingAllNodes();

    // Set up interval
    intervalRef.current = setInterval(() => {
      pingAllNodes();
    }, config.pingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMonitoring, config.pingInterval, pingAllNodes]);

  // Update config
  const updateConfig = useCallback((newConfig: Partial<PingMonitorConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Force immediate ping
  const forcePing = useCallback(() => {
    pingAllNodes();
  }, [pingAllNodes]);

  // Get ping statistics
  const getStats = useCallback(() => {
    let online = 0;
    let warning = 0;
    let offline = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    pingResults.forEach(result => {
      if (result.status === 'online') online++;
      else if (result.status === 'warning') warning++;
      else offline++;

      if (result.latency !== null) {
        totalLatency += result.latency;
        latencyCount++;
      }
    });

    return {
      online,
      warning,
      offline,
      averageLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      total: pingResults.size,
    };
  }, [pingResults]);

  // Check if a node is currently offline
  const isNodeOffline = useCallback((nodeId: string) => {
    const result = pingResults.get(nodeId);
    return result ? result.status === 'offline' : false;
  }, [pingResults]);

  // Get latency for a specific node
  const getNodeLatency = useCallback((nodeId: string) => {
    const result = pingResults.get(nodeId);
    return result ? result.latency : null;
  }, [pingResults]);

  // Get status for a specific node
  const getNodeStatus = useCallback((nodeId: string): StatusType => {
    const result = pingResults.get(nodeId);
    return result ? result.status : 'offline';
  }, [pingResults]);

  return {
    pingResults,
    isMonitoring,
    setIsMonitoring,
    config,
    updateConfig,
    forcePing,
    getStats,
    isNodeOffline,
    getNodeLatency,
    getNodeStatus,
  };
}

export default usePingMonitor;
