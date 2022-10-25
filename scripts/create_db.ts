import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import { green, yellow } from 'https://deno.land/std@0.84.0/fmt/colors.ts';
import { configs } from '../configs.ts';

create_database(configs.db_name);
create_database(configs.db_test_name);

async function create_database(db_name: string) {
	const default_db_client = new Client({
		user: 'postgres',
		password: 'postgres',
		database: 'postgres',
		hostname: configs.db_url,
		port: configs.db_port,
	});
	await default_db_client.connect();

	const db_exists = await default_db_client.queryArray(
		`SELECT 1 FROM pg_database WHERE datname='${db_name}'`,
	);

	if (db_exists.rowCount == 0) {
		await default_db_client.queryArray(`CREATE DATABASE ${db_name}`);
		console.log(`created database ${green(db_name)}`);
	} else {
		console.log(`database ${yellow(db_name)} already exists`);
	}

	await default_db_client.end();

	// now that we know the db exists, switch to it
	const client = new Client({
		user: 'postgres',
		password: 'postgres',
		database: db_name,
		hostname: configs.db_url,
		port: configs.db_port,
	});

	await client.connect();
	// TODO: pass just the fields in and not raw sql

	await create_table(
		client,
		'albums',
		`
		CREATE TABLE IF NOT EXISTS albums (
			id SERIAL PRIMARY KEY,
	 		name TEXT,
			artist_id INTEGER NOT NULL,
			year INTEGER
	 	);`,
	);

	await create_index(client, 'albums', 'name');

	await create_table(
		client,
		'artists',
		`
		CREATE TABLE IF NOT EXISTS artists (
			id SERIAL PRIMARY KEY,
			name TEXT
		);`,
	);

	await create_table(
		client,
		'songs',
		`
	CREATE TABLE IF NOT EXISTS songs (
		id SERIAL PRIMARY KEY,
 		name TEXT,
 		artist_id INTEGER,
		length INTEGER,
		album_id INTEGER,
		track_number INTEGER,
		file_location TEXT
	);`,
	);

	await create_index(client, 'songs', 'name');

	client.end();
}

// potential to add in the future: indexing multiple fields
async function create_index(
	client: Client,
	index_table: string,
	index_field: string,
) {
	const index_name = `index_${index_table}_${index_field}`;
	const result = await client.queryArray(
		`CREATE INDEX IF NOT EXISTS ${index_name} on ${index_table} (${index_field});`,
	);

	if (result.warnings.length == 0) {
		console.log(`----> created index ${green(index_name)}`);
	} else if (result.warnings[0].code == '42P07') {
		console.log(`----> index ${yellow(index_name)} already exists`);
	}
}

// if this was being used anywhere outside this file i probably
// wouldn't pass raw sql into it
// TODO: figure out how to suppress notices in the console
async function create_table(client: Client, table_name: string, sql: string) {
	try {
		const result = await client.queryArray(sql);

		// 42P07 is postgres's warning code for a relation already existing
		// TODO: check all warnings, not just the first one
		if (result.warnings.length == 0) {
			console.log(`--> created table ${green(table_name)}`);
		} else if (result.warnings[0].code == '42P07') {
			console.log(`--> table ${yellow(table_name)} already exists`);
		}
	} catch (err) {
		console.error(err);
	}
}
