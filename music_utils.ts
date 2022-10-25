import * as musicMetadata from 'https://dev.jspm.io/music-metadata-browser';
import { toStream, walkSync } from './deps.ts';

import Database from './database.ts';
import { Album, Artist, QueryData, MusicDataResponse, Song } from './types.ts';

const allowed_file_types: string[] = [
	'.aac',
	'.mp3',
	'.mp4',
	'.m4a',
	'.ogg',
	'.wav',
	'.wma',
];

//apparently if you put variables outside a function but just in a class, that data is persisted
// between page refreshes.
// let songs_scanned = 0; kept incrementing if i did the form multiple times and i didn't
// want it to

// reads all the files in a directory and creates a list of
// supported music files in the directory and its subdirectories.
//
// it returns the number of songs scanned, songs added, artists added, and albums added
export async function readMusicDirectory(path: string) {
	let songs_scanned = 0;
	let songs_added = 0;
	let artists_added = 0;
	let albums_added = 0;

	for await (const entry of walkSync(path)) {
		if (
			entry.isFile &&
			allowed_file_types.includes(
				entry.path.substring(entry.path.length - 4),
			)
		) {
			const result = await readMusic(entry.path);
			songs_scanned++;
			songs_added += <number> result.data.added_song;
			artists_added += <number> result.data.added_artist;
			albums_added += <number> result.data.added_album;
		}
	}

	return {
		songs_scanned: songs_scanned,
		songs_added: songs_added,
		artists_added: artists_added,
		albums_added: albums_added,
	};
}

async function readMusic(path: string) {
	const file = await Deno.open(path);
	const fileStream = toStream(file);
	const data = await musicMetadata.parseReadableStream(fileStream);

	if (!data.common.title) {
		return <MusicDataResponse> {
			status: false,
			data: {
				added_artist: 0,
				added_album: 0,
				added_song: 0,
			},
			message: 'The song was read.',
		};
	}

	const formatted_artist = <Artist> {
		name: data.common.artist ? data.common.artist : '[blank]',
	};
	const formatted_song = data.common.title ? data.common.title : '[blank]';

	const artist_id = await getArtistId(formatted_artist);

	const artistData = <Artist> {
		id: artist_id.data.artist_id,
		name: formatted_artist.name,
	};

	const albumData = <Album> {
		name: data.common.album ? data.common.album : '[blank]',
		artist_id: artistData.id,
		year: data.common.year,
	};

	const album_id = await getAlbumId(albumData);

	const song_data = <Song> {
		name: formatted_song,
		artist_id: artist_id.data.artist_id,
		length: 0,
		album_id: album_id.data.album_id,
		track_number: data.common.track.no,
		file_location: path,
	};

	const song_id = await insertSong(song_data);

	return <MusicDataResponse> {
		status: true,
		data: {
			added_artist: artist_id.data.added_artist,
			added_album: album_id.data.added_album,
			added_song: song_id.data.added_song,
		},
		message: 'The song was read.',
	};
}

export async function getAlbumId(albumData: Album) {
	let album_id;
	let added_album = 0;

	const album = <QueryData> await Database.select(
		'albums',
		`LOWER(name)=LOWER('${
			Database.escapeSqlValues(<string> albumData.name)
		}') AND artist_id='${albumData.artist_id}'`,
	);

	if (album.rowCount === 0) {
		const result = <QueryData> await Database.insert(
			'albums',
			albumData,
		);
		if (result.rowCount === 0) {
			return <MusicDataResponse> {
				status: false,
				data: {
					album_id,
					added_album,
				},
				message: 'The album couldn\'t be added to the library.',
			};
		}
		album_id = result.rows[0].id;
		added_album = 1;
	} else {
		album_id = album.rows[0].id;
	}

	return <MusicDataResponse> {
		status: true,
		data: {
			album_id,
			added_album,
		},
		message: 'The album was added to the library.',
	};
}

export async function getArtistId(artistData: Artist) {
	let artist_id;
	let added_artist = 0;

	const artist = <QueryData> await Database.select(
		'artists',
		`LOWER(name)=LOWER('${Database.escapeSqlValues(artistData.name)}')`,
	);

	if (artist.rowCount === 0) {
		const result = <QueryData> await Database.insert(
			'artists',
			artistData,
		);
		if (result.rowCount === 0) {
			return <MusicDataResponse> {
				status: false,
				data: {
					artist_id,
					added_artist,
				},
				message: 'The artist couldn\'t be added to the library.',
			};
		}
		artist_id = result.rows[0].id;
		added_artist = 1;
	} else {
		artist_id = artist.rows[0].id;
	}

	return <MusicDataResponse> {
		status: true,
		data: {
			artist_id,
			added_artist,
		},
		message: 'The artist was added to the library.',
	};
}

export async function insertSong(songData: Song) {
	let song_id;
	let added_song = 0;

	const song = <QueryData> await Database.select(
		'songs',
		`LOWER(name)=LOWER('${
			Database.escapeSqlValues(songData.name)
		}') AND artist_id=${songData.artist_id} AND file_location='${
			Database.escapeSqlValues(songData.file_location)
		}'`,
	);

	if (song.rowCount === 0) {
		const result = <QueryData> await Database.insert(
			'songs',
			songData,
		);
		if (result.rowCount === 0) {
			return <MusicDataResponse> {
				status: false,
				data: {
					song_id,
					added_song,
				},
				message: 'The song couldn\'t be added to the library.',
			};
		}
		song_id = result.rows[0].id;
		added_song = 1;
	} else {
		song_id = song.rows[0].id;
	}

	return <MusicDataResponse> {
		status: true,
		data: {
			song_id,
			added_song,
		},
		message: 'The song was added to the library.',
	};
}
