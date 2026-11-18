const EVEN_TURN = (8.65 * Math.PI) / 180;
const ODD_TURN = (-16 * Math.PI) / 180;

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
  private readonly starts: number[] = [];

  constructor(
    readonly maxPaths: number,
    initialAngle = 0,
  ) {
    this.nodes.set(1, { x: 0, y: 0, angle: initialAngle, parent: null, count: 0 });
  }

  get pathCount(): number {
    return this.starts.length;
  }

  add(start: number): void {
    const trail: number[] = [];
    let n = start;
    while (!this.nodes.has(n)) {
      trail.push(n);
      n = next(n);
    }
    let parent = this.nodes.get(n)!;
    for (let i = trail.length - 1; i >= 0; i--) {
      const v = trail[i];
      const angle = parent.angle + (v % 2 === 0 ? EVEN_TURN : ODD_TURN);
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
    if (this.starts.length > this.maxPaths) this.remove(this.starts.shift()!);
  }

  private remove(start: number): void {
    for (let n = start; n !== 1; n = next(n)) {
      const node = this.nodes.get(n)!;
      // A parent's count is never below its child's, so zero-count nodes are always leaves.
      if (--node.count === 0) this.nodes.delete(n);
    }
  }
}
