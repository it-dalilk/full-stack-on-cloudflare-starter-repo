import { linkSchema, LinkSchemaType } from "@repo/data-ops/zod-schema/links";
import { getLink } from "@repo/data-ops/queries/links";
import { LinkClickMessageType } from "@repo/data-ops/zod-schema/queue";

export async function getLinkInfoFromKVCache(env: Env, id: string){
	const cache = env.CACHE;
	const linkData = await cache.get(id);
	if (linkData) {
		const parsedData = JSON.parse(linkData);
		return linkSchema.parse(parsedData);
	}
	return null;
}
const TTL_TIME = 60 * 60 * 24;

export async function saveLinkInfoToKVCache(env: Env, id: string, linkInfo: LinkSchemaType){
	const cache = env.CACHE;
	await cache.put(id, JSON.stringify(linkInfo),{
		expirationTtl: TTL_TIME
	});
}

export async function getRoutingDestinations(env: Env, id: string){
	const linkInfo = await getLinkInfoFromKVCache(env, id);
	if (linkInfo) return linkInfo;
	const linkInfoFromDB = await getLink(id);
	if (!linkInfoFromDB) return null;
	await saveLinkInfoToKVCache(env, id, linkInfoFromDB);
	return linkInfoFromDB;
}

export function getDestinationForCountry(linkInfo: LinkSchemaType | null, countryCode?: string) {
	if (!linkInfo) {
		return null;
	}
	if (!countryCode) {
		return linkInfo.destinations.default;
	}

	// Check if the country code exists in destinations
	if (linkInfo.destinations[countryCode]) {
		return linkInfo.destinations[countryCode];
	}

	// Fallback to default
	return linkInfo.destinations.default;
}

// import { LinkClickMessageType } from "@repo/data-ops/zod-schema/queue";
export async function scheduleEvalWorkflow(env: Env, event: LinkClickMessageType) {
	const doId = env.EVALUATION_SCHEDULER.idFromName(`${event.data.id}:${event.data.destination}`);
	const stub = env.EVALUATION_SCHEDULER.get(doId);
	await stub.collectLinkClick(
		event.data.accountId,
		event.data.id,
		event.data.destination,
		event.data.country || "UNKNOWN"
	)
}

