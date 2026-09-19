// Camera Controller Component

import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CameraView, CameraTransition, TransitionType, EasingType } from '../types';

interface CameraControllerProps {
  views: CameraView[];
  currentViewId: string | null;
  onViewChange: (viewId: string | null) => void;
  transition: CameraTransition;
}

const CameraController: React.FC<CameraControllerProps> = ({
  views,
  currentViewId,
  onViewChange,
  transition,
}) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const isTransitioning = useRef(false);
  const transitionStartTime = useRef(0);

  // Find current view
  const currentView = views.find(v => v.id === currentViewId);

  // Apply camera transition
  useEffect(() => {
    if (!currentView) return;

    isTransitioning.current = true;
    transitionStartTime.current = Date.now();

    const startPosition = camera.position.clone();
    const startTarget = controlsRef.current?.target?.clone() || new THREE.Vector3(0, 0, 0);
    const endPosition = new THREE.Vector3(...currentView.position);
    const endTarget = new THREE.Vector3(...currentView.target);

    const animateTransition = () => {
      const elapsed = Date.now() - transitionStartTime.current;
      const progress = Math.min(elapsed / transition.duration, 1);

      // Apply easing
      const easedProgress = applyEasing(progress, transition.easing);

      // Apply transition type
      const { position, target } = applyTransitionType(
        startPosition,
        endPosition,
        startTarget,
        endTarget,
        easedProgress,
        transition.type
      );

      camera.position.copy(position);
      if (controlsRef.current) {
        controlsRef.current.target.copy(target);
        controlsRef.current.update();
      }

      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      } else {
        isTransitioning.current = false;
      }
    };

    requestAnimationFrame(animateTransition);
  }, [currentView, camera, transition]);

  // Apply easing function
  const applyEasing = (progress: number, easing: EasingType): number => {
    switch (easing) {
      case 'linear':
        return progress;
      case 'easeInOut':
        return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'easeOut':
        return 1 - Math.pow(1 - progress, 2);
      case 'bounce':
        return 1 - easeOutBounce(1 - progress);
      case 'elastic':
        return easeOutElastic(progress);
      default:
        return progress;
    }
  };

  // Bounce easing
  const easeOutBounce = (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  };

  // Elastic easing
  const easeOutElastic = (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  };

  // Apply transition type
  const applyTransitionType = (
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    startTarget: THREE.Vector3,
    endTarget: THREE.Vector3,
    progress: number,
    type: TransitionType
  ): { position: THREE.Vector3; target: THREE.Vector3 } => {
    switch (type) {
      case 'direct':
        return {
          position: startPos.clone().lerp(endPos, progress),
          target: startTarget.clone().lerp(endTarget, progress),
        };
      case 'arc':
        return applyArcTransition(startPos, endPos, startTarget, endTarget, progress);
      case 'spiral':
        return applySpiralTransition(startPos, endPos, startTarget, endTarget, progress);
      case 'zoom':
        return applyZoomTransition(startPos, endPos, startTarget, endTarget, progress);
      default:
        return {
          position: startPos.clone().lerp(endPos, progress),
          target: startTarget.clone().lerp(endTarget, progress),
        };
    }
  };

  // Arc transition
  const applyArcTransition = (
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    startTarget: THREE.Vector3,
    endTarget: THREE.Vector3,
    progress: number
  ): { position: THREE.Vector3; target: THREE.Vector3 } => {
    // Calculate control point for arc
    const midX = (startPos.x + endPos.x) / 2;
    const midZ = (startPos.z + endPos.z) / 2;
    const height = Math.max(startPos.y, endPos.y) * 1.5;
    
    const controlPoint = new THREE.Vector3(midX, height, midZ);

    // Quadratic bezier curve
    const t = progress;
    const oneMinusT = 1 - t;
    
    const position = new THREE.Vector3(
      oneMinusT * oneMinusT * startPos.x + 2 * oneMinusT * t * controlPoint.x + t * t * endPos.x,
      oneMinusT * oneMinusT * startPos.y + 2 * oneMinusT * t * controlPoint.y + t * t * endPos.y,
      oneMinusT * oneMinusT * startPos.z + 2 * oneMinusT * t * controlPoint.z + t * t * endPos.z
    );

    return {
      position,
      target: startTarget.clone().lerp(endTarget, progress),
    };
  };

  // Spiral transition
  const applySpiralTransition = (
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    startTarget: THREE.Vector3,
    endTarget: THREE.Vector3,
    progress: number
  ): { position: THREE.Vector3; target: THREE.Vector3 } => {
    const center = new THREE.Vector3(
      (startPos.x + endPos.x) / 2,
      Math.min(startPos.y, endPos.y),
      (startPos.z + endPos.z) / 2
    );
    
    const radius = Math.sqrt(
      Math.pow(startPos.x - center.x, 2) + 
      Math.pow(startPos.z - center.z, 2)
    );

    const angle = progress * Math.PI * 2 * 3; // 3 full rotations
    const height = startPos.y + (endPos.y - startPos.y) * progress;

    const position = new THREE.Vector3(
      center.x + Math.cos(angle) * radius * (1 - progress),
      height,
      center.z + Math.sin(angle) * radius * (1 - progress)
    );

    return {
      position,
      target: startTarget.clone().lerp(endTarget, progress),
    };
  };

  // Zoom transition
  const applyZoomTransition = (
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    startTarget: THREE.Vector3,
    endTarget: THREE.Vector3,
    progress: number
  ): { position: THREE.Vector3; target: THREE.Vector3 } => {
    if (progress < 0.5) {
      // Zoom out
      const zoomProgress = progress * 2;
      const zoomFactor = 1 + Math.sin(zoomProgress * Math.PI) * 0.5;
      
      return {
        position: startPos.clone().multiplyScalar(zoomFactor),
        target: startTarget.clone(),
      };
    } else {
      // Zoom in
      const zoomProgress = (progress - 0.5) * 2;
      const zoomFactor = 1 + Math.sin(zoomProgress * Math.PI) * 0.5;
      
      return {
        position: endPos.clone().multiplyScalar(1 / zoomFactor),
        target: endTarget.clone(),
      };
    }
  };

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2 + 0.1}
      />
    </>
  );
};

export default CameraController;
