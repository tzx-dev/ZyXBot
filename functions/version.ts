// @ts-nocheck
import { readFileSync } from "fs";
import { projectFile } from "./paths.ts";

function packageVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(projectFile("package.json"), "utf8")
    );
    return pkg.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

export {packageVersion};
