// Mulberry32. Gameplay rolls (confetti, glances) go through this.
export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return {
    seed(n) {
      s = (n >>> 0) || 1;
    },
    next() {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    float(a, b) {
      return a + (b - a) * this.next();
    },
  };
}
