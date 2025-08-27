// scripts/lib/merkle.ts
import crypto from "crypto";

/** Required keys (v0.1.1): TOP-LEVEL (no 'social.*') */
export const REQUIRED_KEYS = ["nickname", "avatar", "twitter", "discord", "website"] as const;

function sha256(buf: Buffer | string): Buffer {
  return crypto.createHash("sha256").update(buf).digest();
}
function valueHashOf(value: string): Buffer {
  return sha256(Buffer.from(value ?? "", "utf8"));
}
/** Leaf: H("leaf" || keyPath || sha256(utf8(value))) */
function leafHash(keyPath: string, value: string): Buffer {
  const v = valueHashOf(value);
  return sha256(Buffer.concat([Buffer.from("leaf"), Buffer.from(keyPath), v]));
}
/** Unordered pair hash: H(min(a,b) || max(a,b)) */
function hashPairUnordered(a: Buffer, b: Buffer): Buffer {
  const lo = Buffer.compare(a, b) <= 0 ? a : b;
  const hi = lo === a ? b : a;
  return sha256(Buffer.concat([lo, hi]));
}
/** Deterministic left→right reduction using unordered hash */
export function rootFromLeavesUnordered(leaves: Buffer[]): Buffer {
  if (leaves.length === 0) return sha256(Buffer.alloc(0));
  let acc = leaves[0];
  for (let i = 1; i < leaves.length; i++) acc = hashPairUnordered(acc, leaves[i]);
  return acc;
}
function pick(bio: any, path: string): string {
  return path.split(".").reduce((cur, k) => (cur?.[k] ?? ""), bio ?? "")?.toString?.() ?? "";
}

export type InclusionProof = { keyIndex: number; valueHash: number[]; siblings: number[][] };

/**
 * Simple proofs compatible with the on-chain verifier:
 * - For index i: siblings = all the other leaves (in order), no aggregations.
 */
export function computeStrictRootAndProofs(bio: any): { root: Buffer; proofs: InclusionProof[] } {
  const values = REQUIRED_KEYS.map((k) => pick(bio, k));
  const leaves = REQUIRED_KEYS.map((k, i) => leafHash(k, values[i]));
  const root = rootFromLeavesUnordered(leaves);

  const proofs: InclusionProof[] = leaves.map((_, idx) => {
    const vhash = valueHashOf(values[idx]);
    const siblings = leaves.filter((__, j) => j !== idx);
    return {
      keyIndex: idx,
      valueHash: Array.from(vhash),
      siblings: siblings.map((s) => Array.from(s)),
    };
  });

  return { root, proofs };
}

export function to0x(buffer: Buffer): string { return "0x" + buffer.toString("hex"); }
export function merkleRootFromDataTopLevel(data: any): Buffer {
  return computeStrictRootAndProofs(data).root;
}

