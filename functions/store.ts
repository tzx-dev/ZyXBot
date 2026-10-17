// @ts-nocheck
import * as fs from "fs/promises";
import * as path from "path";
import { randomBytes } from "crypto";

const writeChains = new Map();

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function withFileLock(filePath, fn) {
  const key = path.resolve(filePath);
  const prev = writeChains.get(key) || Promise.resolve();
  const run = prev.then(() => fn(), () => fn());
  writeChains.set(
    key,
    run.then(
      () => undefined,
      () => undefined
    )
  );
  return run;
}

async function writeJson(filePath, data) {
  return withFileLock(filePath, async () => {
    await ensureDir(filePath);
    const tmp = path.join(
      path.dirname(filePath),
      `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${randomBytes(4).toString("hex")}.tmp`
    );
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");

    try {
      await fs.rm(filePath, { force: true });
      await fs.rename(tmp, filePath);
    } catch {
      await fs.copyFile(tmp, filePath);
      await fs.unlink(tmp).catch(() => {});
    }
  });
}

async function readJson(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (fallback !== undefined) {
      await writeJson(filePath, fallback);
      return structuredClone(fallback);
    }
    throw error;
  }
}

export {readJson, writeJson, ensureDir, withFileLock};
