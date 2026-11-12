import fs from "node:fs";
import path from "node:path";

const targetLoader = path.resolve("public/monaco/vs/loader.js");
const sourceDir = path.resolve("node_modules/monaco-editor/min/vs");
const targetDir = path.resolve("public/monaco/vs");

if (!fs.existsSync(targetLoader) && fs.existsSync(sourceDir)) {
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

