// @ts-nocheck
import { cv2Payload } from "../discord/helpers/components.ts";
import { getSettings } from "./data.ts";
import { buildLoginLogContainer, buildAccountRemovedLogContainer, buildTokenChangedLogContainer, buildQuestRunningLogContainer, buildQuestCompletedLogContainer } from "../discord/menus/logs/system-logs.ts";
async function resolveLogChannel(client,id){if(!id)return null;const c=await client.channels.fetch(id).catch(()=>null);return c?.isTextBased?.()?c:null;}
async function sendLog(client,key,container){try{const s=await getSettings();const c=await resolveLogChannel(client,s.logs?.[key]);if(!c)return false;await c.send(cv2Payload(container));return true;}catch(err){console.warn(`[logs] Falha ao enviar log (${key}):`,err.message||err);return false;}}
async function logLogin(c,p){return sendLog(c,"login",buildLoginLogContainer(p));} async function logAccountRemoved(c,p){return sendLog(c,"login",buildAccountRemovedLogContainer(p));} async function logTokenChanged(c,p){return sendLog(c,"login",buildTokenChangedLogContainer(p));} async function logQuestRunning(c,p){return sendLog(c,"questsRunning",buildQuestRunningLogContainer(p));} async function logQuestCompleted(c,p){return sendLog(c,"questsCompleted",buildQuestCompletedLogContainer(p));}
export {sendLog,logLogin,logAccountRemoved,logTokenChanged,logQuestRunning,logQuestCompleted};
