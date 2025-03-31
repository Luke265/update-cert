import { send, sendError } from "../util/mail.ts";
import { Resolver } from "node:dns/promises";

async function execute() {
    try {
        const CERTBOT_DOMAIN = process.env["CERTBOT_DOMAIN"];
        if (!CERTBOT_DOMAIN) {
            throw new Error("CERTBOT_DOMAIN environment variable is undefined");
        }
        const CERTBOT_VALIDATION = process.env["CERTBOT_VALIDATION"];
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
                const resolver = new Resolver();
                resolver.setServers(["8.8.8.8"]);
                const result = await resolver.resolveTxt(`_acme-challenge.${CERTBOT_DOMAIN}`);
                if (result.some(([challenge]) => challenge === CERTBOT_VALIDATION)) {
                    await send({
                        subject: "Cert challenge completed",
                        body: `Certificate challenge "${CERTBOT_VALIDATION}" for ${CERTBOT_DOMAIN} has been completed`,
                    });
                    return;
                }
            } catch (e) {
                console.error("DNS Resolution Error:", e);
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
