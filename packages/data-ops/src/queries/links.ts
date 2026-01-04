import { CreateLinkSchemaType, destinationsSchema, DestinationsSchemaType, LinkSchemaType } from "../zod/links";
import { getDb } from "../db/database";
import { nanoid } from "nanoid";
import { links } from "../drizzle-out/schema";
import { and, desc, eq, gt } from "drizzle-orm";

export async function getLinks(accountId: string, createdBefore?: string) {
    const db = getDb();
    const conditions = [eq(links.accountId, accountId)];
    if (createdBefore) {
        conditions.push(gt(links.created, createdBefore));
    }
    const linksData = await db.select({
        linkId: links.linkId,
        name: links.name,
        destinations: links.destinations,
        created: links.created,
    }).from(links).where(and(...conditions)).orderBy(desc(links.created)).limit(25);
    return linksData.map(link => ({
        ...link,
        lastSixHours: Array.from({ length: 6 },() => Math.floor(Math.random() * 100)),
        linkClicks: 6,
        destinations: Object.keys(JSON.parse(link.destinations as string)).length,
    }));
}

export async function createLink(data: CreateLinkSchemaType & { accountId: string }) {
    const db = getDb();
    const linkId = nanoid(10);
    await db.insert(links).values({
        linkId,
        accountId: data.accountId,
        name: data.name,
        destinations: JSON.stringify(data.destinations),
    });
    return linkId;
}

export async function getLink(linkId: string) {
    const db = getDb();
    const link = await db.select().from(links).where(eq(links.linkId, linkId)).limit(1);
    if (link.length === 0) return null;
    return {
        ...link[0],
        destinations: JSON.parse(link[0].destinations) as DestinationsSchemaType,
    } as LinkSchemaType;
}

export async function updateLinkDestinations(linkId: string, destinations: DestinationsSchemaType) {
    const destinationsParser = destinationsSchema.parse(destinations);
    const db = getDb();
    await db.update(links).set({
        destinations: JSON.stringify(destinationsParser),
        updated: new Date().toISOString(),
    }).where(eq(links.linkId, linkId));
}

export async function updateLinkName(linkId: string, name: string) {
    const db = getDb();
    await db.update(links).set({
        name,
        updated: new Date().toISOString(),
    }).where(eq(links.linkId, linkId));
}

export async function deleteLink(linkId: string) {
    const db = getDb();
    await db.delete(links).where(eq(links.linkId, linkId));
}