import { send } from "../util/mail.ts";

export async function renewWild(config: { domain: string; domainId: number; api: { url: string; key: string } }) {
    await send({
        subject: "Cert renewal started",
        body: `Certificate renewal process started`,
    });
    let cmd = new Deno.Command("/usr/bin/certbot", {
        env: {
            DOMAIN: config.domain,
            DOMAIN_ID: config.domainId.toString(),
            IV_API_URL: config.api.url,
            IV_API_KEY: config.api.key,
        },
        args: [
            "certonly",
            "--manual",
            "--manual-auth-hook",
            `deno run -A ${import.meta.dirname}/execute.ts`,
            "--manual-cleanup-hook",
            `deno run -A ${import.meta.dirname}/cleanup.ts`,
            "--preferred-challenges",
            "dns-01",
            "--server",
            "https://acme-v02.api.letsencrypt.org/directory",
            "-d",
            "*." + config.domain,
            "-d",
            config.domain,
        ],
        stdout: "piped",
    });
    (await cmd.output()).code;

    cmd = new Deno.Command("service", {
        args: ["nginx", "restart"],
        stdout: "piped",
    });
    (await cmd.output()).code;
    cmd = new Deno.Command("/etc/init.d/dovecot", {
        args: ["restart"],
        stdout: "piped",
    });
    (await cmd.output()).code;
    cmd = new Deno.Command("service", {
        args: ["postfix", "restart"],
        stdout: "piped",
    });
    (await cmd.output()).code;
    await send({
        subject: "Cert renewal successful",
        body: `Certificate renewal has been completed successfully`,
    });
}
