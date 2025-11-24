import { MechanismDef, MechanismType } from './types';

// Helper for distance between two points
const dist = (x1: number, y1: number, x2: number, y2: number) => 
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

// Helper for circle intersection
// Returns intersection points of two circles: (x0, y0, r0) and (x1, y1, r1)
function intersectTwoCircles(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): { x: number, y: number }[] | null {
  const d = dist(x0, y0, x1, y1);
  
  if (d > r0 + r1 || d < Math.abs(r0 - r1) || d === 0) {
    return null; // No intersection or concentric
  }

  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
  const h = Math.sqrt(Math.abs(r0 * r0 - a * a));
  
  const x2 = x0 + a * (x1 - x0) / d;
  const y2 = y0 + a * (y1 - y0) / d;
  
  return [
    {
      x: x2 + h * (y1 - y0) / d,
      y: y2 - h * (x1 - x0) / d
    },
    {
      x: x2 - h * (y1 - y0) / d,
      y: y2 + h * (x1 - x0) / d
    }
  ];
}

export const MECHANISMS: Record<MechanismType, MechanismDef> = {
  [MechanismType.FOUR_BAR]: {
    id: MechanismType.FOUR_BAR,
    name: "Four-Bar Linkage",
    category: "Basic Linkages",
    description: "The simplest closed-loop kinematic chain. It consists of four bodies, called bars or links, connected in a loop by four joints. Used in locking pliers, bicycles, and oil pump jacks.",
    defaultParams: [
      { id: 'a', label: 'Crank Length', value: 100, min: 20, max: 200, step: 1, unit: 'mm' },
      { id: 'b', label: 'Coupler Length', value: 250, min: 50, max: 400, step: 1, unit: 'mm' },
      { id: 'c', label: 'Rocker Length', value: 150, min: 50, max: 300, step: 1, unit: 'mm' },
      { id: 'd', label: 'Ground Dist', value: 200, min: 50, max: 350, step: 1, unit: 'mm' },
    ],
    solve: (angleRad, params) => {
      const { a, b, c, d } = params;
      
      const J1 = { x: 0, y: 0, label: 'O2', isGround: true };
      const J4 = { x: d, y: 0, label: 'O4', isGround: true };

      const J2 = { 
        x: a * Math.cos(angleRad), 
        y: a * Math.sin(angleRad),
        label: 'A' 
      };

      const intersections = intersectTwoCircles(J2.x, J2.y, b, J4.x, J4.y, c);

      if (!intersections) {
        return { joints: [], links: [], isValid: false };
      }

      // Pick intersection with positive Y relative to line if possible, or consistent index
      const intersection = intersections[1]; // Usually standard config
      const J3 = { ...intersection, label: 'B' };

      return {
        joints: [J1, J2, J3, J4],
        links: [
          { start: J1, end: J2, color: '#38bdf8', thickness: 4 },
          { start: J2, end: J3, color: '#e2e8f0', thickness: 3 },
          { start: J3, end: J4, color: '#94a3b8', thickness: 4 },
          { start: J4, end: J1, color: '#475569', thickness: 2, type: 'construction' },
        ],
        pathPoints: [J3],
        isValid: true
      };
    }
  },
  [MechanismType.SLIDER_CRANK]: {
    id: MechanismType.SLIDER_CRANK,
    name: "Slider-Crank",
    category: "Basic Linkages",
    description: "Converts rotational motion into reciprocating linear motion. Found in internal combustion engines and piston pumps.",
    defaultParams: [
      { id: 'r', label: 'Crank Radius', value: 80, min: 20, max: 150, step: 1, unit: 'mm' },
      { id: 'l', label: 'Conrod Length', value: 250, min: 100, max: 400, step: 1, unit: 'mm' },
      { id: 'o', label: 'Offset', value: 0, min: -50, max: 50, step: 1, unit: 'mm' },
    ],
    solve: (angleRad, params) => {
      const { r, l, o } = params;
      
      const J1 = { x: 0, y: 0, label: 'Center', isGround: true };
      const J2 = {
        x: r * Math.cos(angleRad),
        y: r * Math.sin(angleRad),
        label: 'Crank'
      };

      const yDist = Math.abs(o - J2.y);
      if (yDist > l) return { joints: [], links: [], isValid: false };

      const xDist = Math.sqrt(l*l - yDist*yDist);
      const J3 = {
        x: J2.x + xDist,
        y: o,
        label: 'Piston'
      };

      return {
        joints: [J1, J2, J3],
        links: [
          { start: J1, end: J2, color: '#38bdf8', thickness: 4 },
          { start: J2, end: J3, color: '#e2e8f0', thickness: 3 },
          { start: {x: -100, y: o - 10}, end: {x: 400, y: o - 10}, color: '#475569', thickness: 1, type: 'construction' },
          { start: {x: -100, y: o + 10}, end: {x: 400, y: o + 10}, color: '#475569', thickness: 1, type: 'construction' }
        ],
        pathPoints: [J2],
        isValid: true
      };
    }
  },
  [MechanismType.SCOTCH_YOKE]: {
    id: MechanismType.SCOTCH_YOKE,
    name: "Scotch Yoke",
    category: "Intermittent / Special",
    description: "Converts linear motion to rotational motion with pure Simple Harmonic Motion (SHM) output. Used in control valve actuators.",
    defaultParams: [
      { id: 'r', label: 'Crank Radius', value: 100, min: 20, max: 150, step: 1, unit: 'mm' },
    ],
    solve: (angleRad, params) => {
      const { r } = params;
      const J1 = { x: 0, y: 0, isGround: true };
      const J2 = { x: r * Math.cos(angleRad), y: r * Math.sin(angleRad), label: 'Pin' };
      
      const slotX = J2.x;
      const yokeHeight = 120;
      const yokeWidth = 40;
      
      return {
        joints: [J1, J2],
        links: [
          { start: J1, end: J2, color: '#38bdf8', thickness: 4 },
          { start: {x: slotX, y: -yokeHeight}, end: {x: slotX, y: yokeHeight}, color: '#e2e8f0', thickness: 2 },
          { start: {x: slotX - yokeWidth, y: -yokeHeight}, end: {x: slotX + yokeWidth, y: -yokeHeight}, color: '#e2e8f0', thickness: 2 },
          { start: {x: slotX - yokeWidth, y: yokeHeight}, end: {x: slotX + yokeWidth, y: yokeHeight}, color: '#e2e8f0', thickness: 2 },
          { start: {x: slotX - yokeWidth, y: 0}, end: {x: slotX - 100, y: 0}, color: '#94a3b8', thickness: 4 } // Output rod
        ],
        isValid: true,
        pathPoints: [{x: slotX, y: 0}]
      };
    }
  },
  [MechanismType.QUICK_RETURN]: {
    id: MechanismType.QUICK_RETURN,
    name: "Whitworth Quick Return",
    category: "Industrial",
    description: "Produces a reciprocating motion where the return stroke is faster than the forward stroke. Commonly used in shaper machines.",
    defaultParams: [
      { id: 'r', label: 'Crank Radius', value: 70, min: 30, max: 100, step: 1, unit: 'mm' },
      { id: 'd', label: 'Pivot Dist', value: 40, min: 10, max: 80, step: 1, unit: 'mm' },
      { id: 'l', label: 'Lever Length', value: 250, min: 150, max: 400, step: 1, unit: 'mm' },
      { id: 'c', label: 'Rod Length', value: 150, min: 100, max: 200, step: 1, unit: 'mm' },
    ],
    solve: (angleRad, params) => {
      const { r, d, l, c } = params;
      
      // O1 is Crank Center (0,0)
      // O2 is Lever Pivot (0, -d)
      const O1 = { x: 0, y: 0, isGround: true };
      const O2 = { x: 0, y: -d, label: 'Pivot', isGround: true };
      
      // Crank Pin A
      const A = { x: r * Math.cos(angleRad), y: r * Math.sin(angleRad), label: 'A' };
      
      // Lever passes through O2 and A
      // We extend it to length l
      const angleLever = Math.atan2(A.y - O2.y, A.x - O2.x);
      const B = { 
        x: O2.x + l * Math.cos(angleLever), 
        y: O2.y + l * Math.sin(angleLever),
        label: 'B' 
      };
      
      // Ram (Slider) connected to B via rod length c
      // Constrained to y = fixed height? Typically horizontal above.
      // Let's constrain ram to Y = 150 (arbitrary horizontal line)
      const ramY = 150;
      
      // Intersection of circle at B radius c with line y = ramY
      const dy = Math.abs(ramY - B.y);
      if (dy > c) return { joints: [], links: [], isValid: false };
      
      // Choose forward intersection (to the right usually)
      const dx = Math.sqrt(c*c - dy*dy);
      const Ram = { x: B.x + dx, y: ramY, label: 'Ram' };
      
      return {
        joints: [O1, O2, A, B, Ram],
        links: [
          { start: O1, end: A, color: '#38bdf8', thickness: 4 }, // Crank
          { start: O2, end: B, color: '#e2e8f0', thickness: 3 }, // Slotted Lever
          { start: B, end: Ram, color: '#94a3b8', thickness: 3 }, // Conn Rod
          { start: {x: -200, y: ramY - 10}, end: {x: 300, y: ramY - 10}, color: '#475569', thickness: 2, type: 'construction' }, // Guide
        ],
        pathPoints: [Ram],
        isValid: true
      };
    }
  },
  [MechanismType.WATTS_LINKAGE]: {
    id: MechanismType.WATTS_LINKAGE,
    name: "Watt's Linkage",
    category: "Straight Line",
    description: "Invented by James Watt to drive the piston of a steam engine. The central point of the coupler traces an approximate straight line.",
    defaultParams: [
      { id: 'l', label: 'Arm Length', value: 150, min: 80, max: 200, step: 1, unit: 'mm' },
      { id: 'w', label: 'Separation', value: 200, min: 100, max: 300, step: 1, unit: 'mm' },
      { id: 'c', label: 'Coupler Len', value: 80, min: 40, max: 150, step: 1, unit: 'mm' },
    ],
    solve: (angleRad, params) => {
      const { l, w, c } = params;
      // Centers
      const O1 = { x: -w/2, y: 0, isGround: true };
      const O2 = { x: w/2, y: 0, isGround: true };
      
      // Input Arm (Left) oscillates. We drive it with angle.
      // But Watt's usually limited range. 
      // Let's map angleRad (0-2PI) to an oscillation -0.5 to 0.5 rad
      const oscillate = Math.sin(angleRad) * 0.5; // +/- ~30 deg
      
      const A = {
        x: O1.x + l * Math.cos(Math.PI/2 + oscillate),
        y: O1.y + l * Math.sin(Math.PI/2 + oscillate),
        label: 'A'
      };
      
      // Find point B on Right Arm such that dist(A, B) = c
      // B is on circle centered at O2 radius l
      // AND on circle centered at A radius c
      const intersections = intersectTwoCircles(O2.x, O2.y, l, A.x, A.y, c);
      if (!intersections) return { joints: [], links: [], isValid: false };
      
      // We want the solution roughly parallel
      const B = intersections[0].x > intersections[1].x ? intersections[0] : intersections[1];
      // Actually we want the one that keeps the linkage "open" usually
      // Visual check: B should be roughly same Y as A
      const B_final = intersections.reduce((prev, curr) => Math.abs(curr.y - A.y) < Math.abs(prev.y - A.y) ? curr : prev);
      
      const TracePoint = {
        x: (A.x + B_final.x) / 2,
        y: (A.y + B_final.y) / 2,
        label: 'P'
      };
      
      return {
        joints: [O1, O2, A, B_final, TracePoint],
        links: [
            { start: O1, end: A, color: '#38bdf8', thickness: 4 },
            { start: O2, end: B_final, color: '#38bdf8', thickness: 4 },
            { start: A, end: B_final, color: '#e2e8f0', thickness: 3 },
            { start: O1, end: O2, color: '#475569', thickness: 1, type: 'construction' }
        ],
        pathPoints: [TracePoint],
        isValid: true
      };
    }
  },
  [MechanismType.PEAUCELLIER]: {
    id: MechanismType.PEAUCELLIER,
    name: "Peaucellier-Lipkin",
    category: "Straight Line",
    description: "The first planar linkage capable of transforming rotary motion into perfect straight-line motion (inversion geometry).",
    defaultParams: [
      { id: 'a', label: 'Crank Input', value: 60, min: 30, max: 100, step: 1, unit: 'mm' },
      { id: 'L', label: 'Arm Length', value: 180, min: 100, max: 300, step: 1, unit: 'mm' },
      { id: 'l', label: 'Cell Link', value: 70, min: 40, max: 150, step: 1, unit: 'mm' },
    ],
    solve: (angleRad, params) => {
      const { a, L, l } = params;
      // Fixed Point O (Origin). 
      // Input crank is fixed at M (position (-a, 0)). Crank length 'a'.
      // So input point P passes through Origin?
      // Standard config: Fixed pivot O at (-a, 0). Fixed pivot C at (a, 0).
      // Let's use simpler setup:
      // Fixed Anchor O at (0,0).
      // Input Crank anchored at C = (-a, 0). Length = a.
      // So P traces circle passing through origin (0,0).
      
      const C = { x: -a, y: 0, isGround: true, label: 'C' }; // Crank pivot
      const O = { x: 0, y: 0, isGround: true, label: 'O' };  // Main pivot
      
      // Input P driven by Crank at C
      const P = {
        x: C.x + a * Math.cos(angleRad),
        y: C.y + a * Math.sin(angleRad),
        label: 'P'
      };
      
      // Peaucellier Cell:
      // Joints A and B are intersections of Circle(O, L) and Circle(P, l)
      const intersectionsAB = intersectTwoCircles(O.x, O.y, L, P.x, P.y, l);
      if (!intersectionsAB) return { joints: [], links: [], isValid: false };
      
      const A = intersectionsAB[0];
      const B = intersectionsAB[1];
      
      // Output Q is intersection of Circle(A, l) and Circle(B, l)
      // One intersection is P, we want the other.
      const intersectionsQ = intersectTwoCircles(A.x, A.y, l, B.x, B.y, l);
      if (!intersectionsQ) return { joints: [], links: [], isValid: false };
      
      // Filter out P (approx)
      const rawQ = dist(intersectionsQ[0].x, intersectionsQ[0].y, P.x, P.y) > 1 
        ? intersectionsQ[0] 
        : intersectionsQ[1];
        
      const Q = { ...rawQ, label: 'Output' };

      return {
        joints: [C, O, P, A, B, Q],
        links: [
            { start: C, end: P, color: '#38bdf8', thickness: 3 }, // Input Crank
            { start: O, end: A, color: '#94a3b8', thickness: 3 },
            { start: O, end: B, color: '#94a3b8', thickness: 3 },
            { start: P, end: A, color: '#e2e8f0', thickness: 2 },
            { start: P, end: B, color: '#e2e8f0', thickness: 2 },
            { start: A, end: Q, color: '#e2e8f0', thickness: 2 },
            { start: B, end: Q, color: '#e2e8f0', thickness: 2 },
            { start: {x: Q.x, y: -200}, end: {x: Q.x, y: 200}, color: '#ef4444', thickness: 1, type: 'ghost' } // Expected line
        ],
        pathPoints: [Q],
        isValid: true
      };
    }
  },
  [MechanismType.ELLIPTICAL_TRAMMEL]: {
    id: MechanismType.ELLIPTICAL_TRAMMEL,
    name: "Elliptical Trammel",
    category: "Special",
    description: "Instrument to draw ellipses. Consists of two shuttles confined to perpendicular channels.",
    defaultParams: [
      { id: 'a', label: 'Semi-Major A', value: 150, min: 50, max: 200, step: 1, unit: 'mm' },
      { id: 'b', label: 'Semi-Minor B', value: 80, min: 20, max: 140, step: 1, unit: 'mm' },
    ],
    solve: (angleRad, params) => {
      const { a, b } = params;
      const rodLength = a + b;
      
      // Geometric solution:
      // Slider A on Y axis, Slider B on X axis.
      // Point P (tracer) is at distance 'a' from A and 'b' from B.
      // x = a cos(t), y = b sin(t)
      
      const P = {
        x: a * Math.cos(angleRad),
        y: b * Math.sin(angleRad),
        label: 'P'
      };
      
      // Calculate slider positions based on P
      // By similar triangles or rod equation
      // A = (0, yA), B = (xB, 0)
      // P is on line AB.
      // This is slightly tricky to back-calculate for the rigid rod drawing without just placing them.
      // Easier: Use the angle of the ROD as the driver, not the ellipse parameter.
      // But we want to control ellipse shape.
      // Let's assume rod angle theta.
      // xA = 0, yA = rodLength * sin(theta) ? No.
      // Let's stick to the previous simple implementation which was visually correct for the rod.
      
      // Re-derivation:
      // If we drive with angle 'phi' being the parameter in x=acos(phi), y=bsin(phi).
      // Then the rod intersects axes at specific points.
      // Slope m = (y - yA) / (x - xA).
      // Let's iterate:
      // A = (0, (a+b) sin(phi) / a * b ? No)
      
      // Use rod angle alpha:
      // xB = (a+b) cos(alpha), yA = (a+b) sin(alpha) => Center moves on circle.
      // This draws circle.
      // Trammel Logic:
      // Slider A at (0, Y). Slider B at (X, 0). Distance L = a+b.
      // Let X = L cos(alpha), Y = L sin(alpha).
      // Midpoint is circle.
      // Point distance 'a' from Y axis slider?
      // Px = X + (0-X) * (a/L) ? No.
      // Vector BA = A - B = (-X, Y).
      // P = B + (b/L) * BA = B + (b/L)(A-B)
      // Px = X - X(b/L) = X(1 - b/L) = L cos(alpha) * (a/L) = a cos(alpha).
      // Py = 0 + Y(b/L) = L sin(alpha) * (b/L) = b sin(alpha).
      // Perfect.
      
      const alpha = angleRad;
      const L = a + b;
      
      const B = { x: L * Math.cos(alpha), y: 0, label: 'Slider X' };
      const A = { x: 0, y: L * Math.sin(alpha), label: 'Slider Y' };
      
      // Recalculate P using vector math to be safe
      // P is distance b from B.
      // Vector V = A - B.
      // P = B + V * (b / L);
      
      const V = { x: A.x - B.x, y: A.y - B.y };
      const P_calc = {
          x: B.x + V.x * (b/L),
          y: B.y + V.y * (b/L),
          label: 'P'
      };

      return {
        joints: [A, B, P_calc],
        links: [
          { start: A, end: B, color: '#38bdf8', thickness: 4 },
          { start: {x: -250, y:0}, end: {x: 250, y: 0}, color: '#475569', thickness: 2, type: 'construction' }, 
          { start: {x: 0, y:-250}, end: {x: 0, y: 250}, color: '#475569', thickness: 2, type: 'construction' }
        ],
        pathPoints: [P_calc],
        isValid: true
      };
    }
  }
};