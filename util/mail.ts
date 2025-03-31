import { execSync } from "node:child_process";

export async function send(options: { subject: string; to?: string; body: string }) {
    const to = options.to ?? process.env["MAIL_TO"];
    if (!to) {
        return;
    }

    const content = `Subject: ${options.subject}
${options.body}`;
    execSync(`sendmail ${to}`, {
        input: content,
    });
}

export function sendError(e: unknown) {
    return send({
        subject: "Cert renewal error",
        body: `An error has occured\n${(e as Error).stack}`,
    });
}
