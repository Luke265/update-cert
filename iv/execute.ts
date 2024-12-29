import { post } from "./util.ts";
import { DOMAIN_ID } from "./constants.ts";
import { send, sendError } from "../util/mail.ts";

async function execute() {
    try {
        const CERTBOT_DOMAIN = Deno.env.get("CERTBOT_DOMAIN");
        if (!CERTBOT_DOMAIN) {
            throw new Error("CERTBOT_DOMAIN environment variable is undefined");
        }
        const CERTBOT_VALIDATION = Deno.env.get("CERTBOT_VALIDATION");
        if (!CERTBOT_VALIDATION) {
            throw new Error("CERTBOT_VALIDATION environment variable is undefined");
        }
        const zone = {
            type: "TXT",
            name: "_acme-challenge",
            value: `"${CERTBOT_VALIDATION}"`,
        };
        const result = await post(DOMAIN_ID, "add_zone", zone);
        if (!result.success) {
            await send({
                subject: "Cert renewal error",
                body: `IV API returned failed`,
            });
            return;
        }
        await send({
            subject: "Cert renewal in progress",
            body: `Changed "_acme-challenge" TXT to "${CERTBOT_VALIDATION}" for ${CERTBOT_DOMAIN}`,
        });
        let i = 30;
        while (i > 0) {
            try {
                const result = await Deno.resolveDns(`_acme-challenge.${CERTBOT_DOMAIN}`, "TXT", {
                    nameServer: { ipAddr: "8.8.8.8" },
                });
                if (result.some(([challenge]) => challenge === CERTBOT_VALIDATION)) {
                    return;
                }
            } catch (e) {
                if (!(e instanceof Deno.errors.NotFound)) {
                    throw e;
                }
            }
            console.log(`Waiting ${i--}...`);
            await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
        }
        throw new Error("Timeout");
    } catch (e) {
        await sendError(e);
        throw e;
    }
}

await execute();
