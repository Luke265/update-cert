import { post } from "./util.ts";
import { DOMAIN_ID } from "./constants.ts";

await post(DOMAIN_ID, "remove_zone", {
    name: "_acme-challenge",
});
