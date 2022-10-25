import Database from '../database.ts';
import { QueryData, RenderContext } from '../types.ts';

export async function renderArtistsIndex(context: RenderContext) {
	await Database.connect();
	const artists = <QueryData> await Database.select(
		'artists',
		``,
		`name asc`,
	);

	Database.end();
	return context.render('artists.ejs', {
		artists: artists.rows,
	});
}

export async function renderArtistsShow(context: RenderContext) {
	if (isNaN(Number(context.params.id))) {
		context.response.redirect('./');
	}

	await Database.connect();
	const artist = <QueryData> await Database.select(
		'artists',
		`id=${context.params.id}`,
	);
	const artist_albums = <QueryData> await Database.select(
		'albums',
		`artist_id=${artist.rows[0].id}`,
		`year asc`,
	);

	Database.end();
	return context.render('artist.ejs', {
		artist: artist.rows[0],
		artist_albums: artist_albums.rows,
	});
}