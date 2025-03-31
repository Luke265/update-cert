import { send } from "../util/mail.ts";
import { execSync, spawnSync } from "node:child_process";

export async function renewWild(config: { domain: string }) {
    await send({
        subject: "Cert renewal started",
        body: `Certificate renewal process started`,
    });
    spawnSync(
        `/usr/bin/certbot`,
        [
            "certonly",
            "--non-interactive",
            "--manual",
            "--manual-auth-hook",
            `/usr/local/bin/node ${import.meta.dirname}/execute.ts`,
            "--preferred-challenges",
            "dns-01",
            "--server",
            "https://acme-v02.api.letsencrypt.org/directory",
            "-d",
            "*." + config.domain,
            "-d",
            config.domain,
        ],
        {
            env: {
                MAIL_TO: process.env["MAIL_TO"],
                DOMAIN: config.domain,
            },
        }
    );
    execSync(`service nginx restart`);
    execSync(`/etc/init.d/dovecot restart`);
    execSync(`service postfix restart`);
    await send({
        subject: "Cert renewal successful",
        body: `Certificate renewal has been completed successfully`,
    });
}
