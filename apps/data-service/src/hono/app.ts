import { getDestinationForCountry, getRoutingDestinations } from '@/helpers/route-ops';
import { getLink } from '@repo/data-ops/queries/links';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { Hono } from 'hono';
import { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';
import { EvaluationScheduler } from '@/index';

export const App = new Hono<{ Bindings: Env }>();


App.get('/:id', async (c) => {
    const id = c.req.param('id');

    const linkInfo = await getRoutingDestinations(c.env, id);

    const cfHeader = cloudflareInfoSchema.safeParse(c.req.raw.cf)
    if (!cfHeader.success) {
		return c.text('Invalid Cloudflare headers', 400);
    }

    const headers = cfHeader.data
    const destination = getDestinationForCountry(linkInfo, headers.country)
    if (!destination) {
        return c.text('Destination not found', 404);
    }
    const queueMessage: LinkClickMessageType = {
      type: 'LINK_CLICK',
      data: {
        id,
        country: headers.country,
        destination,
        accountId: linkInfo?.accountId || '',
        latitude: headers.latitude,
        longitude: headers.longitude,
        timestamp: new Date().toISOString(),
      },
    }
    c.executionCtx.waitUntil(c.env.QUEUE.send(queueMessage));
    return c.redirect(destination)
})
