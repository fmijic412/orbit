/**
 * A tiny fixed-size object pool. Preallocates `size` reusable items up front via
 * a factory, so hot paths (particle bursts, per-frame pickup results) can grab
 * an existing object instead of allocating — no garbage, no GC hitches.
 *
 * Deliberately free of `three` and the DOM so it stays trivially reusable and
 * testable. Two access patterns are supported:
 *   - `acquire()` hands out slots round-robin, wrapping to the start — and thus
 *     overwriting the oldest slot — once every slot has been used. This is
 *     exactly the recycling behaviour a capped particle system wants.
 *   - `items` / `get(i)` expose the backing array for callers that manage their
 *     own indices (e.g. filling a result buffer up to N entries per frame).
 */
export class Pool<T> {
  private readonly slots: T[] = [];
  /** Round-robin cursor so reused slots spread evenly across the pool. */
  private cursor = 0;

  constructor(size: number, factory: (index: number) => T) {
    for (let i = 0; i < size; i++) {
      this.slots.push(factory(i));
    }
  }

  /** Number of pooled slots. */
  get size(): number {
    return this.slots.length;
  }

  /** Read-only view of every slot, for direct (allocation-free) iteration. */
  get items(): readonly T[] {
    return this.slots;
  }

  /** The slot at `index`; caller is responsible for keeping `0 <= index < size`. */
  get(index: number): T {
    return this.slots[index];
  }

  /**
   * Returns the next slot round-robin, wrapping to the start — and thus
   * overwriting the oldest slot — once every slot has been handed out.
   */
  acquire(): T {
    const slot = this.slots[this.cursor];
    this.cursor = (this.cursor + 1) % this.slots.length;
    return slot;
  }
}
