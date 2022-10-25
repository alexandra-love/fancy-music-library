import { Application, bold, cyan, ejsEngine, green, oakAdapter, send, viewEngine } from './deps.ts';

import { configs } from './configs.ts';
import router from './routes.ts';

export const app = new Application();

app.use(
	viewEngine(oakAdapter, ejsEngine, {
		viewRoot: `./${configs.project_root}/views`,
	}),
);

// use the router that is in routes.ts
app.use(router.routes());
app.use(router.allowedMethods());

// Logging Middleware
app.use(async (ctx, next) => {
	await next();
	const rt = ctx.response.headers.get('X-Response-Time');
	console.log(
		`${green(ctx.request.method)} ${cyan(ctx.request.url.pathname)} - ${
			bold(
				String(rt),
			)
		}`,
	);
});

// Timing Middleware
app.use(async (ctx, next) => {
	const start = Date.now();
	await next();
	const ms = Date.now() - start;
	ctx.response.headers.set('X-Response-Time', `${ms}ms`);
});

/**
 * Static File Server Here.
 * any files in the ./static directory are
 * automatically served, such as the index.html file.
 */

app.use(async (context, next) => {
	try {
		await send(context, context.request.url.pathname, {
			root: `${Deno.cwd()}/${configs.project_root}`,
			index: 'index.html',
		});
	} catch (err) {
		console.error(err);
	}
	await next();
});

console.log(`listening on port ${configs.port}`);
await app.listen({ port: configs.port });
