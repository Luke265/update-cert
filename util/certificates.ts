export interface Certificate {
    name: string;
    serial: string;
    type: string;
    domains: string;
    expiryDate: Date;
    path: string;
    keyPath: string;
}

export async function getCertificates(): Promise<Certificate[]> {
    const cmd = new Deno.Command("/usr/bin/certbot", {
        args: ["certificates"],
        stdout: "piped",
    });
    const out = await cmd.output();
    const output = new TextDecoder().decode(out.stdout);
    const result: Record<string, string>[] = [];
    output.split("\n").reduce((formatted, line) => {
        const columns = line.trim().split(": ");
        if (columns.length < 2) {
            return formatted;
        }
        const key = columns[0];
        const value = columns.slice(1).join(": ");
        formatted[key] = value;
        if (key === "Private Key Path") {
            result.push(formatted);
            return {};
        }
        return formatted;
    }, {} as Record<string, string>);
    return result.map((r) => ({
        name: r["Certificate Name"],
        serial: r["Serial Number"],
        type: r["Key Type"],
        domains: r["Domains"],
        expiryDate: new Date(r["Expiry Date"].slice(0, 25)),
        path: r["Certificate Path"],
        keyPath: r["Private Key Path"],
    }));
}
