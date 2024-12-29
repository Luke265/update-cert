import { getCertificates } from "./util/certificates.ts";
import { sendError } from "./util/mail.ts";
import { renewWild as renewWildIV } from "./iv/renew.ts";
import { renewWild as renewWildHostinger } from "./iv/renew.ts";
import { z } from "https://deno.land/x/zod@v3.24.1/mod.ts";
import * as path from "jsr:@std/path";
import { difference } from "jsr:@std/datetime";
import { parseArgs } from "jsr:@std/cli";

try {
    const args = parseArgs(Deno.args, {
        string: ["config"],
    });
    const parsed = await loadConfig(args.config ?? path.join(import.meta.dirname ?? "./", "config.json"));
    const certificates = await getCertificates();
    for (const c of parsed) {
        const cert = certificates.find((cert) => cert.name === c.domain);
        if (!cert) {
            console.error(`Certificate for domain ${c.domain} not found`);
            continue;
        }
        const diff = difference(new Date(), cert?.expiryDate ?? new Date());
        console.log("Remaining days", diff.days);
        if (!diff.days || diff.days < 14) {
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
    const jsonData = await Deno.readTextFile(filePath);
    const parsedData = JSON.parse(jsonData);
    return schema.parse(parsedData);
}
