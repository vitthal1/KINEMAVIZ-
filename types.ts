export enum MechanismType {
  FOUR_BAR = 'FOUR_BAR',
  SLIDER_CRANK = 'SLIDER_CRANK',
  SCOTCH_YOKE = 'SCOTCH_YOKE',
  ELLIPTICAL_TRAMMEL = 'ELLIPTICAL_TRAMMEL',
  QUICK_RETURN = 'QUICK_RETURN',
  WATTS_LINKAGE = 'WATTS_LINKAGE',
  PEAUCELLIER = 'PEAUCELLIER'
}

export interface MechanismParam {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface Joint {
  x: number;
  y: number;
  label?: string;
  isGround?: boolean;
}

export interface Link {
  start: Joint;
  end: Joint;
  color?: string;
  thickness?: number;
  type?: 'primary' | 'ghost' | 'construction';
}

export interface MechanismState {
  joints: Joint[];
  links: Link[];
  pathPoints?: Joint[]; // Points to trace
  isValid: boolean;
}

export interface MechanismDef {
  id: MechanismType;
  name: string;
  category: string;
  description: string;
  defaultParams: MechanismParam[];
  solve: (angle: number, params: Record<string, number>) => MechanismState;
}

export interface ChartDataPoint {
  angle: number;
  value: number;
}