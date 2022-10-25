import Database from '../database.ts';
import { readMusicDirectory } from '../music_utils.ts';
import { RenderContext } from '../types.ts';

export function renderScanIndex(context: RenderContext) {
	return context.render('scan.ejs', {
		result: '',
	});
}

export async function renderScanPost(context: RenderContext) {
	await Database.connect();
	const formData: URLSearchParams = await context.request.body({
		type: 'form',
	}).value;
	let result;
	if (formData.get('library_path')) {
		const music_data = await readMusicDirectory(
			formData.get('library_path') as string,
		);
		result =
			`Scanned ${music_data.songs_scanned} songs, added ${music_data.songs_added} songs,
		${music_data.artists_added} artists, and ${music_data.albums_added} albums`;
	} else {
		result = 'There was an error, check your input directory';
	}
	context.render('scan.ejs', {
		result: result,
	});
	Database.end();
}