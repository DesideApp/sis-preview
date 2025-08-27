// scripts/calc_root.ts
import fs from "fs";
import path from "path";
import { merkleRootFromDataTopLevel, to0x } from "./lib/merkle.js";

function usage() {
  console.error("Uso: tsx scripts/calc_root.ts <input_json> <output_txt>");
  process.exit(1);
}

const inPath = process.argv[2];
const outPath = process.argv[3];
if (!inPath || !outPath) usage();

const raw = fs.readFileSync(path.resolve(inPath), "utf8");
const json = JSON.parse(raw);
if (!json || typeof json !== "object" || typeof json.data !== "object") {
  throw new Error("El JSON debe contener un objeto `data`");
}
const root = merkleRootFromDataTopLevel(json.data);
fs.writeFileSync(path.resolve(outPath), to0x(root) + "\n", "utf8");
console.log("Root calculada:", to0x(root));
