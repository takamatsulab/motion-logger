
export interface MotionSample {
  timestamp: number;
  x: number;
  y: number;
  z: number;
}

export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'not-supported';

export interface DeviceMotionEventWithPermission extends DeviceMotionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}
