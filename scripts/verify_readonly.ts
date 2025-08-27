// scripts/verify_readonly.ts
import { merkleRootFromDataTopLevel, to0x, REQUIRED_KEYS } from "./lib/merkle.js";
import fs from "fs";
import https from "https";
import http from "http";

function usage() {
  console.log(`
SIS Preview - Verificador offline (read‑only)

Uso:
  tsx scripts/verify_readonly.ts <source> <expected_root>

Argumentos:
  source        Ruta de fichero o URL (JSON con { "data": { ... } })
  expected_root Raíz esperada en hex (0x....)

Ejemplos:
  tsx scripts/verify_readonly.ts fixtures/sample_identity.json 0xABCD...
  tsx scripts/verify_readonly.ts https://example.com/identity.json 0x1234...
`);
  process.exit(1);
}

async function fetchFromUrl(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https://") ? https : http;
    client.get(url, res => {
      let data = "";
      res.on("data", c => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e: any) { reject(new Error(`JSON inválido desde URL: ${e.message}`)); }
      });
    }).on("error", reject);
  });
}

async function loadIdentity(source: string): Promise<any> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    console.log(`📡 URL: ${source}`);
    return await fetchFromUrl(source);
  } else {
    console.log(`📁 Fichero: ${source}`);
    return JSON.parse(fs.readFileSync(source, "utf8"));
  }
}

function parseRootHex(hex: string): Buffer {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]{64}$/.test(h)) throw new Error("expected_root debe ser 32 bytes hex (0x...)");
  return Buffer.from(h, "hex");
}

async function main() {
  const [source, expected] = process.argv.slice(2);
  if (!source || !expected) usage();

  console.log("🔍 SIS Preview — Verificación offline\n");

  const json = await loadIdentity(source);
  if (!json?.data || typeof json.data !== "object") {
    throw new Error("El JSON debe contener un objeto `data` con las claves requeridas.");
  }

  // Check presence of required keys
  const missing = REQUIRED_KEYS.filter(k => !(k in json.data));
  if (missing.length) {
    console.log("⚠️  Faltan claves requeridas:", missing.join(", "));
  }

  const root = merkleRootFromDataTopLevel(json.data);
  const expectedBuf = parseRootHex(expected);

  console.log("🔢 Calculada:", to0x(root));
  console.log("🔢 Esperada :", to0x(expectedBuf));

  if (root.equals(expectedBuf)) {
    console.log("\n✅ MATCH — Verificación correcta");
  } else {
    console.log("\n❌ MISMATCH — La raíz no coincide");
  }
}

main().catch(e => { console.error("💥 Error:", e.message); process.exit(1); });
