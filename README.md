# Solana Identity Standard (SIS) – Preview

Minimal preview of the **Solana Identity Standard (SIS)**.

This repository does **not** contain the full on-chain program.
It only includes helper scripts that show how a user’s JSON identity
document is reduced to a **Merkle root** and can be compared against
an on-chain record.

## Devnet Program
- **Program ID (devnet):** BL2MYkDq5j62hPQoWtwkzAX1RdLuWwYYPDDbY78vmMqB

## Scripts
- `calc_root.ts` → Compute Merkle root from a sample identity JSON
- `verify_readonly.ts` → Compare local root with on-chain value
- `lib/merkle.ts` → Merkle helper

## Usage
```bash
npm install
npx tsx scripts/calc_root.ts fixtures/sample_identity.json fixtures/sample_identity.root.txt
npx tsx scripts/verify_readonly.ts fixtures/sample_identity.json <USER_PUBKEY>

Disclaimer
This is a preview repository.
The full program, governance rules, and advanced tooling are private while SIS is in early phase.