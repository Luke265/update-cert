export async function post(domainId: number, action: string, data: unknown) {
    const url = `${Deno.env.get("IV_API_URL")}?api=${Deno.env.get("IV_API_KEY")}&action=${action}&domainId=${domainId}`;
    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
    });
    const text = await response.text();
    return JSON.parse(text);
}
