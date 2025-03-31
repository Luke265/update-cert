import { post } from "./util.ts";
import { DOMAIN_ID } from "./constants.ts";
import { send } from "../util/mail.ts";

await send({
    subject: "Cert cleanup",
    body: `Certificate cleanup for ${process.env.CERTBOT_DOMAIN}`,
});

await post(DOMAIN_ID, "remove_zone", {
    name: "_acme-challenge",
});
