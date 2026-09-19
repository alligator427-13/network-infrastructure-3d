// Building Floors Component

import { useMemo } from 'react';
import type { NetworkNode } from '../types';
import { SITE_COLORS } from '../types';

interface BuildingFloorsProps {
  nodes: NetworkNode[];
  theme: any;
}

const BuildingFloors: React.FC<BuildingFloorsProps> = ({ nodes }) => {
  const sites = useMemo(() => {
    const siteMap = new Map<string, {
      nodes: NetworkNode[];
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
      floors: Set<number>;
    }>();

    nodes.forEach(node => {
      const buildingId = node.buildingId || 'default';
      if (!siteMap.has(buildingId)) {
        siteMap.set(buildingId, {
          nodes: [],
          minX: Infinity,
          maxX: -Infinity,
          minZ: Infinity,
          maxZ: -Infinity,
          floors: new Set<number>(),
        });
      }

      const site = siteMap.get(buildingId)!;
      site.nodes.push(node);
      site.minX = Math.min(site.minX, node.position[0]);
      site.maxX = Math.max(site.maxX, node.position[0]);
      site.minZ = Math.min(site.minZ, node.position[2]);
      site.maxZ = Math.max(site.maxZ, node.position[2]);
      if (node.floor !== undefined) {
        site.floors.add(node.floor);
      }
    });

    return siteMap;
  }, [nodes]);

  return null;
};

export default BuildingFloors;
