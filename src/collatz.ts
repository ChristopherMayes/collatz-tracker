const DEG = Math.PI / 180;
// Above this, 3n + 1 is no longer exact in a float64.
const MAX_ODD = (Number.MAX_SAFE_INTEGER - 1) / 3;

export interface TreeNode {
  x: number;
  y: number;
  angle: number;
  parent: TreeNode | null;
  /** Number of active paths passing through the edge to `parent`. */
  count: number;
}

const next = (n: number): number => (n % 2 === 0 ? n / 2 : 3 * n + 1);

/** Collatz tree over a sliding window of starting values; node geometry is fixed by its path to 1. */
export class CollatzTree {
  readonly nodes = new Map<number, TreeNode>();
  private starts: number[] = [];
  private evenTurn = 0;
  private oddTurn = 0;

  /** Turn angles are in degrees: left into even numbers, right into odd numbers. */
  constructor(
    private maxPaths: number,
    evenAngle: number,
    oddAngle: number,
  ) {
    this.setAngles(evenAngle, oddAngle);
  }

  get pathCount(): number {
    return this.starts.length;
  }

  /** Change the turn angles and rebuild the geometry of the current paths. */
  setAngles(evenAngle: number, oddAngle: number): void {
    this.evenTurn = evenAngle * DEG;
    this.oddTurn = -oddAngle * DEG;
    const starts = this.starts;
    this.starts = [];
    this.nodes.clear();
    this.nodes.set(1, { x: 0, y: 0, angle: 0, parent: null, count: 0 });
    for (const s of starts) this.add(s);
  }

  setMaxPaths(maxPaths: number): void {
    this.maxPaths = maxPaths;
    this.trim();
  }

  /** Add the path from `start`; returns false if the path leaves the safe-integer range. */
  add(start: number): boolean {
    const trail: number[] = [];
    let n = start;
    while (!this.nodes.has(n)) {
      if (n % 2 === 1 && n > MAX_ODD) return false;
      trail.push(n);
      n = next(n);
    }
    let parent = this.nodes.get(n)!;
    for (let i = trail.length - 1; i >= 0; i--) {
      const v = trail[i];
      const angle = parent.angle + (v % 2 === 0 ? this.evenTurn : this.oddTurn);
      const len = 1 / Math.log(v);
      const node: TreeNode = {
        x: parent.x + len * Math.cos(angle),
        y: parent.y + len * Math.sin(angle),
        angle,
        parent,
        count: 0,
      };
      this.nodes.set(v, node);
      parent = node;
    }
    for (n = start; n !== 1; n = next(n)) this.nodes.get(n)!.count++;

    this.starts.push(start);
    this.trim();
    return true;
  }

  private trim(): void {
    while (this.starts.length > this.maxPaths) this.remove(this.starts.shift()!);
  }

  private remove(start: number): void {
    for (let n = start; n !== 1; n = next(n)) {
      const node = this.nodes.get(n)!;
      // A parent's count is never below its child's, so zero-count nodes are always leaves.
      if (--node.count === 0) this.nodes.delete(n);
    }
  }
}
