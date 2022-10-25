import { assert, assertEquals, assertNotEquals } from '../deps.ts';
import Database from '../database.ts';
import { Album, Artist, QueryData, Song } from '../types.ts';
import * as music_utils from '../music_utils.ts';

const song_data = <Song> {
	name: 'Presto',
	artist_id: 1,
	album_id: 1,
	track_number: 5,
	file_location: 'C:/Music/Rush/Presto/05 Presto.mp3',
};

const album_data = <Album> {
	name: 'Presto',
	artist_id: 1,
	year: 1989,
};

const artist_data = <Artist> {
	name: 'Rush',
};

const bad_data = <Song> {};

Deno.test('music_utils.insertSong: inserting good song data works', async () => {
	await Database.connectTest();

	const song_count = <QueryData> await Database.select('songs');
	const result = await music_utils.insertSong(song_data);
	const song_count2 = <QueryData> await Database.select('songs');

	assertEquals(result.status, true);
	assert(result.data.song_id);
	assert(result.message);
	assertNotEquals(song_count.rowCount, song_count2.rowCount);
	await Database.del('songs');
	Database.end();
});

Deno.test('music_utils.insertSong: inserting bad song data sends an error message', async () => {
	await Database.connectTest();

	const result = await music_utils.insertSong(bad_data);
	assertEquals(result.status, false);
	Database.end();
});

Deno.test('music_utils.insertSong: inserting double song data doesn\'t create another db entry', async () => {
	await Database.connectTest();

	await music_utils.insertSong(song_data);
	const song_count = <QueryData> await Database.select('songs');
	await music_utils.insertSong(song_data);
	const song_count2 = <QueryData> await Database.select('songs');

	assertEquals(song_count.rowCount, song_count2.rowCount);
	await Database.del('songs');
	Database.end();
});

Deno.test('music_utils.getAlbumId: inserting good album data works', async () => {
	await Database.connectTest();

	const album_count = <QueryData> await Database.select('albums');
	const result = await music_utils.getAlbumId(album_data);
	const album_count2 = <QueryData> await Database.select('albums');

	assertNotEquals(album_count.rowCount, album_count2.rowCount);
	assertEquals(result.status, true);
	assert(result.data.album_id);
	assert(result.message);
	await Database.del('albums');
	Database.end();
});

Deno.test('music_utils.getAlbumId: inserting double album data doesn\'t create another db entry', async () => {
	await Database.connectTest();

	await music_utils.getAlbumId(album_data);
	const album_count = <QueryData> await Database.select('albums');
	await music_utils.getAlbumId(album_data);
	const album_count2 = <QueryData> await Database.select('albums');

	assertEquals(album_count.rowCount, album_count2.rowCount);
	await Database.del('albums');
	Database.end();
});

Deno.test('music_utils.getAlbumId: inserting bad album data sends an error message', async () => {
	await Database.connectTest();

	const result = await music_utils.getAlbumId(bad_data);
	assertEquals(result.status, false);
	Database.end();
});

Deno.test('music_utils.getArtistId: inserting good artist data works', async () => {
	await Database.connectTest();

	const result = await music_utils.getArtistId(artist_data);
	assertEquals(result.status, true);
	assert(result.data.artist_id);
	assert(result.message);
	await Database.del('albums');
	Database.end();
});

Deno.test('music_utils.getArtistId: inserting double artist data doesn\'t create another db entry', async () => {
	await Database.connectTest();

	await music_utils.getArtistId(artist_data);
	const artist_count = <QueryData> await Database.select('artists');
	await music_utils.getArtistId(artist_data);
	const artist_count2 = <QueryData> await Database.select('artists');

	assertEquals(artist_count.rowCount, artist_count2.rowCount);
	await Database.del('artists');
	Database.end();
});

Deno.test('music_utils.getArtistId: inserting bad artist data sends an error message', async () => {
	await Database.connectTest();

	const result = await music_utils.getArtistId(bad_data);
	assertEquals(result.status, false);
	await Database.del('artists');
	Database.end();
});
