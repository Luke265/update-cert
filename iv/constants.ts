const domainIdStr = Deno.env.get("DOMAIN_ID");
if (!domainIdStr) {
    throw new Error("DOMAIN_ID env variable is undefined");
}
const domainIdNum = parseInt(domainIdStr);
if (isNaN(domainIdNum)) {
    throw new Error("DOMAIN_ID env variable is not a number");
}
export const DOMAIN_ID = domainIdNum;
