import fs from "fs";
import path from "path";

function buildCandidates() {
  const cwd = process.cwd();
  return [path.join(cwd, "apps", "quote-generator"), cwd];
}

export function resolveQuoteGeneratorPath(...segments: string[]) {
  for (const basePath of buildCandidates()) {
    const candidate = path.join(basePath, ...segments);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.join(buildCandidates()[0], ...segments);
}

