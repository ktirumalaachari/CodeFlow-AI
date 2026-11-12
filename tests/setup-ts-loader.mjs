import { registerHooks } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const rel = specifier.slice(2);
      const candidates = [
        path.join(ROOT, `${rel}.ts`),
        path.join(ROOT, `${rel}.tsx`),
        path.join(ROOT, rel, "index.ts"),
        path.join(ROOT, rel),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

