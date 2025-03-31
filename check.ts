import { getCertificates } from "./util/certificates.ts";
import { sendError } from "./util/mail.ts";
import { renewWild as renewWildIV } from "./iv/renew.ts";
import { renewWild as renewWildHostinger } from "./iv/renew.ts";
import { z } from "zod";
import path from "node:path";
import fsp from "node:fs/promises";
import { DateTime } from "luxon";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

try {
    const args = await yargs(hideBin(process.argv))
        .option("config", {
            type: "string",
        })
        .parse();
    const parsed = await loadConfig(args.config ?? path.join(import.meta.dirname ?? "./", "config.json"));
    const certificates = await getCertificates();
    for (const c of parsed) {
        const cert = certificates.find((cert) => cert.name === c.domain);
        if (!cert) {
            console.error(`Certificate for domain ${c.domain} not found`);
            continue;
        }
        const diff = DateTime.fromJSDate(cert?.expiryDate ?? new Date()).diffNow();
        console.log("Remaining days", diff.days);
        if (!diff.days || diff.days < 14) {
            console.log("Renewing", c.type);
            if (c.type === "iv") {
                await renewWildIV(c);
            } else if (c.type === "hostinger") {
                await renewWildHostinger(c);
            }
        }
    }
} catch (e) {
    await sendError(e);
}

async function loadConfig(filePath: string) {
    const schema = z.array(
        z.object({
            domainId: z.number(),
            domain: z.string(),
            type: z.literal("iv").or(z.literal("hostinger")),
            api: z.object({
                url: z.string(),
                key: z.string(),
            }),
        })
    );
    const data = await fsp.readFile(filePath);
    return schema.parse(JSON.parse(data.toString()));
}
