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
        await send({
            subject: "Manual cert renewal for " + CERTBOT_DOMAIN,
            body: `Please set DNS TXT "_acme-challenge" to "${CERTBOT_VALIDATION}" for ${CERTBOT_DOMAIN} manually`,
        });
        let i = 20;
        while (i > 0) {
            try {
                const result = await Deno.resolveDns("_acme-challenge." + CERTBOT_DOMAIN, "TXT", {
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
