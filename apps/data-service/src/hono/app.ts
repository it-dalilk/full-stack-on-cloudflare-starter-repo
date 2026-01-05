import { getDestinationForCountry, getRoutingDestinations } from '@/helpers/route-ops';
import { getLink } from '@repo/data-ops/queries/links';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { Hono } from 'hono';



export const App = new Hono<{ Bindings: Env }>();


App.get('/:id', async (c) => {
    const id = c.req.param('id');

    const linkInfo = await getRoutingDestinations(c.env, id);

    const cfHeader = cloudflareInfoSchema.safeParse(c.req.raw.cf)
    if (!cfHeader.success) {
		return c.text('Invalid Cloudflare headers', 400);
    }

    const headers = cfHeader.data
    console.log(headers)
    const destination = getDestinationForCountry(linkInfo, headers.country)
    if (!destination) {
        return c.text('Destination not found', 404);
    }
    return c.redirect(destination)
})
