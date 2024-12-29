export async function send(options: { subject: string; to?: string; body: string }) {
    const to = options.to ?? Deno.env.get("MAIL_TO");
    if (!to) {
        return;
    }
    const content = `Subject: ${options.subject}
${options.body}`;
    const cmd = new Deno.Command("sendmail", {
        args: [to],
        stdin: "piped",
    });
    const process = cmd.spawn();
    await process.stdin.getWriter().write(new TextEncoder().encode(content));
    process.stdin.close();
    await process.status;
}

export function sendError(e: unknown) {
    return send({
        subject: "Cert renewal error",
        body: `An error has occured\n${(e as Error).stack}`,
    });
}
