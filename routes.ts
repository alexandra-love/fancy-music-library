import { Router } from './deps.ts';
import { RenderContext } from './types.ts';
import { renderAlbumsIndex, renderAlbumsShow } from './routes/albums.ts';
import { renderArtistsIndex, renderArtistsShow } from './routes/artists.ts';
import { renderIndex } from './routes/index.ts';
import { renderScanIndex, renderScanPost } from './routes/scan.ts'

const router = new Router();

try {
	router
		// route to the index page
		.get('/', (context: RenderContext) => {
			renderIndex(context);
		})
		.get('/scan', (context: RenderContext) => {
			renderScanIndex(context);
		})
		.post('/scan', async (context: RenderContext) => {
			await renderScanPost(context);
		})
		.get('/artists', async (context: RenderContext) => {
			await renderArtistsIndex(context);
		})
		.get('/artists/:id', async (context: RenderContext) => {
			await renderArtistsShow(context);
		})
		.get('/albums', async (context: RenderContext) => {
			await renderAlbumsIndex(context);
		})
		.get('/albums/:id', async (context: RenderContext) => {
			await renderAlbumsShow(context);
		});
} catch (err) {
	console.error(err);
}
export default router;
