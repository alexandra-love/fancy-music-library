import { assert, assertEquals } from '../deps.ts';

import Database from '../database.ts';
import { Artist, QueryData } from '../types.ts';

const artist_data = <Artist> {
	name: 'Rush',
};

const artist_data2 = <Artist> {
	name: 'KMFDM',
};

Deno.test('Database.connect: connecting once works fine', async () => {
	await Database.connectTest();

	assert(Database.client.session.pid);
	Database.end();
});

Deno.test('Database.connect: connecting twice doesn\'t open another db connection', async () => {
	const client = await Database.connectTest();
	const client2 = await Database.connectTest();

	assertEquals(client.session.pid, client2.session.pid);
	Database.end();
});

// all of these tests clear the artists table first because it might not be empty upon the test starting
Deno.test('Database.del: delete all entries', async () => {
	await Database.connectTest();
	await Database.del('artists');

	await Database.insert('artists', artist_data);
	await Database.insert('artists', artist_data2);
	const result = <QueryData> await Database.del('artists');

	assertEquals(result.rows.length, 2);
	Database.end();
});

Deno.test('Database.del: delete one entry', async () => {
	await Database.connectTest();
	await Database.del('artists');
	await Database.insert('artists', artist_data);
	const del = <QueryData> await Database.insert('artists', artist_data2);
	const result = <QueryData> await Database.del(
		'artists',
		`id = ${del.rows[0].id}`,
	);

	assertEquals(result.rows.length, 1);
	await Database.del('artists');
	Database.end();
});

Deno.test('Database.del: deleting bad data returns errors', async () => {
	await Database.connectTest();
	await Database.del('artists');

	const result = <QueryData> await Database.del('artists2');

	assertEquals(result.rowCount, 0);
	assert(result.errors);
	await Database.del('artists');
	Database.end();
});

Deno.test('Database.insert: inserting data and getting the result back', async () => {
	await Database.connectTest();
	await Database.del('artists');
	const artist = <QueryData> await Database.insert(
		'artists',
		artist_data,
	);

	assertEquals(artist.rows.length, 1);
	assertEquals(artist.rows[0].name, artist_data.name);
	await Database.del('artists');
	Database.end();
});

Deno.test('Database.insert: inserting bad data returns errors', async () => {
	await Database.connectTest();
	await Database.del('artists');
	const artist = <QueryData> await Database.insert(
		'artists2',
		artist_data,
	);

	assertEquals(artist.rowCount, 0);
	assert(artist.errors);
	Database.end();
});

Deno.test('Database.query: query works as expected with the right syntax', async () => {
	await Database.connectTest();
	await Database.insert('artists', artist_data);
	const result = <QueryData> await Database.query(
		'DELETE FROM artists RETURNING *',
	);

	assertEquals(result.rows.length, 1);
	Database.end();
});

Deno.test('Database.query: using bad syntax returns errors', async () => {
	await Database.connectTest();
	const result = <QueryData> await Database.query(
		'DELETE FROM artists2 RETURNING *',
	);

	assertEquals(result.rowCount, 0);
	assert(result.errors);
	Database.end();
});

Deno.test('Database.select: selecting multiple rows returns all of them', async () => {
	await Database.connectTest();
	await Database.del('artists');
	await Database.insert('artists', artist_data);
	await Database.insert('artists', artist_data2);

	const artists = <QueryData> await Database.select('artists', '', '');

	assertEquals(artists.rows.length, 2);
	await Database.del('artists');
	await Database.end();
});

Deno.test('Database.select: selecting one row returns only that row', async () => {
	await Database.connectTest();
	await Database.del('artists');
	await Database.insert('artists', artist_data);

	const insert = <QueryData> await Database.insert(
		'artists',
		artist_data2,
	);
	const artist = <QueryData> await Database.select(
		'artists',
		`id=${insert.rows[0].id}`,
		'',
	);

	assertEquals(artist.rows.length, 1);
	assertEquals(artist.rows[0].name, artist_data2.name);
	await Database.del('artists');
	await Database.end();
});

Deno.test('Database.select: select with bad params returns errors', async () => {
	await Database.connectTest();
	await Database.del('artists');
	const result = <QueryData> await Database.select('artists2', '', '');

	assertEquals(result.rows.length, 0);
	assert(result.errors);
	await Database.del('artists');
	await Database.end();
});
