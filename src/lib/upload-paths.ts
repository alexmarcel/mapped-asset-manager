import path from "node:path";

export function uploadRoot() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "data/uploads");
}

export function databasePath() {
  return path.resolve(process.cwd(), "data/app.db");
}

export function dataRoot() {
  return path.resolve(process.cwd(), "data");
}
