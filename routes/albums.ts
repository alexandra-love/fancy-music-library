import Database from '../database.ts';
import { QueryData, RenderContext } from '../types.ts';

export async function renderAlbumsIndex(context: RenderContext) {
	await Database.connect();

	const albums = <QueryData> await Database.query(
		`SELECT albums.id, albums.name, artists.name as artist_name, artists.id as artist_id, albums.year from albums 
	left outer join artists on albums.artist_id = artists.id;`,
	);

	Database.end();
	return context.render('albums.ejs', {
		albums: albums.rows,
	});
}

export async function renderAlbumsShow(context: RenderContext) {
	if (isNaN(Number(context.params.id))) {
		context.response.redirect('./');
	}

	await Database.connect();
	const album = <QueryData> await Database.query(
		`SELECT albums.id, albums.name, artists.name as artist_name, artists.id as artist_id, albums.year from albums 
left outer join artists on albums.artist_id = artists.id where albums.id=${context.params.id}`,
	);
	const album_songs = <QueryData> await Database.select(
		'songs',
		`album_id=${album.rows[0].id}`,
		`track_number asc`,
	);

	Database.end();
	return context.render('album.ejs', {
		album: album.rows[0],
		album_songs: album_songs.rows,
	});
}