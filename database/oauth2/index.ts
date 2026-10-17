// @ts-nocheck
import {
  JsonDatabase,
} from "wio.db";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const db = (name) => new JsonDatabase({ databasePath: path.join(directory, name) });

const registros = db("registros.json");
const messagesgeral = db("messagesgeral.json");
const configuracoes = db("configuracoes.json");
const backup = db("backup.json");
const PullRequest = db("PullRequest.json");
const General = db("General.json");
const Carinho = db("Carinho.json");
const Notify = db("Notify.json");
const Licensa = db("Licensa.json");



export {
  messagesgeral,
  registros,
  configuracoes,
  backup,
  PullRequest,
  General,
  Carinho, Notify, Licensa
}
