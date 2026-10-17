// @ts-nocheck
import * as rest from "./rest.ts";
import {
  questId,
  questConfig,
  questUserStatus,
  questIsCompleted,
  questIsEnrolled,
  acceptQuest,
  questUpdateStatus,
  getQuestName
} from "./quests.ts";
import { makeDesktopHeaders, getActivityHeaders } from "./headers.ts";

const TASK_TYPES = [
  "WATCH_VIDEO",
  "WATCH_VIDEO_ON_MOBILE",
  "PLAY_ON_DESKTOP",
  "PLAY_ON_XBOX",
  "PLAY_ON_PLAYSTATION",
  "STREAM_ON_DESKTOP",
  "PLAY_ACTIVITY",
  "ACHIEVEMENT_IN_ACTIVITY"
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function notify(onProgress, payload) {
  if (typeof onProgress === "function") {
    try {
      await onProgress(payload);
    } catch (err) {
      console.warn("[quests] onProgress error:", err.message || err);
    }
  }
}

async function doWatchVideo(token, quest, secondsNeeded, secondsDone, onProgress) {
  const qname = getQuestName(quest);
  const maxFuture = 10;
  const speed = 7;
  const interval = 7000;
  const enrolledAt = new Date(questUserStatus(quest).enrolled_at).getTime() / 1000;
  let completed = false;
  let done = secondsDone;

  await notify(onProgress, {
    status: "running",
    secondsDone: done,
    secondsNeeded,
    label: qname
  });

  while (true) {
    const maxAllowed = Math.floor(Date.now() / 1000 - enrolledAt + maxFuture);
    const diff = maxAllowed - done;
    const timestamp = done + speed;

    if (diff >= speed) {
      const newTs = Math.min(secondsNeeded, timestamp + Math.random());
      const resp = await rest.post(token, `/quests/${questId(quest)}/video-progress`, {
        timestamp: newTs
      });
      completed = resp?.completed_at != null;
      done = Math.min(secondsNeeded, timestamp);
      await notify(onProgress, {
        status: "running",
        secondsDone: done,
        secondsNeeded,
        label: qname
      });
    }

    if (done >= secondsNeeded) break;
    await sleep(interval);
  }

  if (!completed) {
    await rest.post(token, `/quests/${questId(quest)}/video-progress`, {
      timestamp: secondsNeeded
    });
  }

  await notify(onProgress, {
    status: "done",
    secondsDone: secondsNeeded,
    secondsNeeded,
    label: qname
  });
}

async function doPlayOnPlatform(token, quest, secondsNeeded, taskName, onProgress) {
  const qname = getQuestName(quest);
  const applicationId = questConfig(quest).application.id;
  const interval = 20000;

  while (!questIsCompleted(quest)) {
    const secondsDone = questUserStatus(quest)?.progress?.[taskName]?.value || 0;
    await notify(onProgress, {
      status: "running",
      secondsDone,
      secondsNeeded,
      label: qname
    });

    try {
      const resp = await rest.post(token, `/quests/${questId(quest)}/heartbeat`, {
        application_id: applicationId,
        terminal: false
      });
      questUpdateStatus(quest, resp);
    } catch (e) {
      if (String(e.message || e).includes("500")) {
        await sleep(10000);
        continue;
      }
      throw e;
    }

    await sleep(interval);
  }

  await rest.post(token, `/quests/${questId(quest)}/heartbeat`, {
    application_id: applicationId,
    terminal: true
  });

  await notify(onProgress, {
    status: "done",
    secondsDone: secondsNeeded,
    secondsNeeded,
    label: qname
  });
}

async function doPlayActivity(token, quest, secondsNeeded, taskName, onProgress) {
  const qname = getQuestName(quest);
  const streamKey = "call:1:1";
  const interval = 20000;

  while (!questIsCompleted(quest)) {
    const secondsDone = questUserStatus(quest)?.progress?.[taskName]?.value || 0;
    await notify(onProgress, {
      status: "running",
      secondsDone,
      secondsNeeded,
      label: qname
    });

    try {
      const resp = await rest.post(token, `/quests/${questId(quest)}/heartbeat`, {
        stream_key: streamKey,
        terminal: false
      });
      questUpdateStatus(quest, resp);
    } catch (e) {
      if (String(e.message || e).includes("500")) {
        await sleep(10000);
        continue;
      }
      throw e;
    }

    await sleep(interval);
  }

  await rest.post(token, `/quests/${questId(quest)}/heartbeat`, {
    stream_key: streamKey,
    terminal: true
  });

  await notify(onProgress, {
    status: "done",
    secondsDone: secondsNeeded,
    secondsNeeded,
    label: qname
  });
}

async function getProxyTicket(token, applicationId) {
  const resp = await rest.post(token, `/applications/${applicationId}/proxy-tickets`, {});
  return resp.ticket;
}

async function getActivityReferrer(token, applicationId) {
  const ticket = await getProxyTicket(token, applicationId);
  const params = new URLSearchParams({
    instance_id: "example-cl-instance",
    platform: "desktop",
    discord_proxy_ticket: ticket
  });
  return `https://${applicationId}.discordsays.com/?${params.toString()}`;
}

async function authorizeDiscordSays(token, applicationId, questIdVal, authCode) {
  const activityReferrer = await getActivityReferrer(token, applicationId);
  const headers = {
    ...makeDesktopHeaders({ withProperties: false, withOrigin: false }),
    ...getActivityHeaders(questIdVal, "", activityReferrer)
  };

  const url = `https://${applicationId}.discordsays.com/.proxy/acf/authorize`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ code: authCode })
  });

  if (!res.ok) {
    const text = await res.text();
    return { token: null, error: text || res.statusText, activityReferrer };
  }

  const data = await res.json();
  return { token: data.token, error: null, activityReferrer };
}

async function progressDiscordSays(applicationId, questIdVal, authToken, questTarget, activityReferrer) {
  const headers = {
    ...makeDesktopHeaders({ withProperties: false, withOrigin: false }),
    ...getActivityHeaders(questIdVal, authToken, activityReferrer)
  };

  const url = `https://${applicationId}.discordsays.com/.proxy/acf/quest/progress`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ progress: questTarget })
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text || res.statusText };
  }

  return { ok: true, error: null };
}

async function doAchievementInActivity(token, quest, onProgress) {
  const qname = getQuestName(quest);
  const applicationId = questConfig(quest).application.id;
  const applicationName = questConfig(quest).application.name;
  const questTarget = questConfig(quest).task_config_v2.tasks.ACHIEVEMENT_IN_ACTIVITY.target;

  await notify(onProgress, {
    status: "running",
    secondsDone: 0,
    secondsNeeded: questTarget || 1,
    label: qname
  });

  const query = [
    "response_type=code",
    `client_id=${applicationId}`,
    "scope=identify applications.commands applications.entitlements",
    "state="
  ].join("&");

  const resp = await rest.post(token, `/oauth2/authorize?${query}`, {
    permissions: "0",
    authorize: true,
    integration_type: 1,
    location_context: { guild_id: "10000", channel_id: "10000", channel_type: 10000 }
  });

  let authCode = null;
  if (resp?.location) {
    const u = new URL(resp.location);
    authCode = u.searchParams.get("code");
  }

  if (!authCode) {
    throw new Error(`No auth code for '${applicationName}'`);
  }

  const { token: dsToken, error, activityReferrer } = await authorizeDiscordSays(
    token,
    applicationId,
    questId(quest),
    authCode
  );

  if (error || !dsToken) {
    throw new Error(`Discord Says auth failed: ${error}`);
  }

  const { ok, error: progressError } = await progressDiscordSays(
    applicationId,
    questId(quest),
    dsToken,
    questTarget,
    activityReferrer
  );

  if (!ok) {
    throw new Error(`Progress failed: ${progressError}`);
  }

  const tokens = await rest.get(token, "/oauth2/tokens");
  for (const t of tokens || []) {
    if (t?.application?.id === applicationId) {
      try {
        await rest.del(token, `/oauth2/tokens/${t.id}`);
      } catch {
        // ignora
      }
      break;
    }
  }

  await notify(onProgress, {
    status: "done",
    secondsDone: questTarget || 1,
    secondsNeeded: questTarget || 1,
    label: qname
  });
}

async function runTask(token, quest, onProgress) {
  const qname = getQuestName(quest);
  const taskConfig = questConfig(quest).task_config_v2;
  const taskName = TASK_TYPES.find(t => t in (taskConfig?.tasks || {}));

  if (!taskName) {
    throw new Error(`No known task type for '${qname}'`);
  }

  const secondsNeeded = taskConfig.tasks[taskName].target;
  const secondsDone = questUserStatus(quest)?.progress?.[taskName]?.value || 0;

  if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
    await doWatchVideo(token, quest, secondsNeeded, secondsDone, onProgress);
  } else if (["PLAY_ON_XBOX", "PLAY_ON_PLAYSTATION", "PLAY_ON_DESKTOP"].includes(taskName)) {
    await doPlayOnPlatform(token, quest, secondsNeeded, taskName, onProgress);
  } else if (taskName === "PLAY_ACTIVITY") {
    await doPlayActivity(token, quest, secondsNeeded, taskName, onProgress);
  } else if (taskName === "STREAM_ON_DESKTOP") {
    throw new Error("STREAM_ON_DESKTOP unsupported");
  } else if (taskName === "ACHIEVEMENT_IN_ACTIVITY") {
    await doAchievementInActivity(token, quest, onProgress);
  } else {
    throw new Error(`Unhandled task '${taskName}'`);
  }
}

async function runQuest(token, quest, onProgress) {
  const qname = getQuestName(quest);

  if (!questIsEnrolled(quest)) {
    const tasks = questConfig(quest).task_config_v2.tasks;
    const isAndroid = "WATCH_VIDEO_ON_MOBILE" in tasks && !("WATCH_VIDEO" in tasks);
    await acceptQuest(token, quest, isAndroid);
  }

  await notify(onProgress, {
    status: "running",
    secondsDone: questUserStatus(quest)?.progress?.[Object.keys(questConfig(quest).task_config_v2.tasks)[0]]?.value || 0,
    secondsNeeded: Object.values(questConfig(quest).task_config_v2.tasks)[0]?.target || 0,
    label: qname
  });

  await runTask(token, quest, onProgress);
}

export {runTask, runQuest};
