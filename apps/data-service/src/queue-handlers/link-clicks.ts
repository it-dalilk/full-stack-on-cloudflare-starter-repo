import { LinkClickMessageType } from "@repo/data-ops/zod-schema/queue";
import { addLinkClick } from "@repo/data-ops/queries/links";

export async function handleLinkClick(env: Env, data: LinkClickMessageType['data']) {
    await addLinkClick(data);
}