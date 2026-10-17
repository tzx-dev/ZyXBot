import ping from "./commands/public/ping.ts";
import panel from "./commands/public/panel.ts";
import sendPanel from "./commands/public/send-panel.ts";
import oauth2 from "./commands/public/oauth2.ts";
import auth from "./commands/oauth2/auth.ts";
import infoauth from "./commands/oauth2/infoauth.ts";
import mensagemvendas from "./commands/oauth2/mensagemvendas.ts";

export const commands = [ping, panel, sendPanel, oauth2, auth, infoauth, mensagemvendas];
