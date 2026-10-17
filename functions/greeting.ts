// @ts-nocheck
/**
 * Saudação por horário (America/Sao_Paulo).
 */
function getGreetingLabel(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false
    }).format(date)
  );

  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function greetingLine(username) {
  const label = getGreetingLabel();
  const who = username ? `, **${username}**` : "";
  return `\`👋\` ${label}${who}!`;
}

export {getGreetingLabel, greetingLine};
