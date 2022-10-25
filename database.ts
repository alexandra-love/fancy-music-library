import { Client, QueryObjectResult } from './deps.ts';
import { configs } from './configs.ts';
import { QueryData } from './types.ts';

enum DatabaseCommands {
	Create = 'CREATE',
	Delete = 'DELETE',
	Insert = 'INSERT',
	Select = 'SELECT',
	Update = 'UPDATE',
	Unknown = 'unknown',
}

class Database {
	static client: Client;

	// a Client's session.pid is "the process id of the current session as assigned by the database * on connection"
	// according to the postgres library's documentation. it's undefined when there's no connection established but a
	// Client has been initialized
	//
	// usage: const client = await Database.connect();
	static async connect() {
		// ordered to match a postgres database url: username:password@hostname:port/database
		if (
			typeof Database.client === 'undefined' ||
			typeof Database.client.session.pid === 'undefined'
		) {
			const client = new Client({
				user: configs.db_username,
				password: configs.db_password,
				hostname: configs.db_url,
				port: configs.db_port,
				database: configs.db_name,
			});
			await client.connect();
			Database.client = client;
		}
		return Database.client;
	}

	// connecting to the test db is a separate function to reduce the chance of accidentally
	// connecting to the wrong one
	//
	// ysage: const client = await Database.connectTest();
	static async connectTest() {
		// ordered to match a postgres database url: username:password@hostname:port/database
		if (
			typeof Database.client === 'undefined' ||
			typeof Database.client.session.pid === 'undefined'
		) {
			const client = new Client({
				user: configs.db_username,
				password: configs.db_password,
				hostname: configs.db_url,
				port: configs.db_port,
				database: configs.db_test_name,
			});
			await client.connect();
			Database.client = client;
		}
		return Database.client;
	}

	// delete seems to be a reserved keyword? i can't use it as a function name
	// or a variable name.
	// queryObject returns a QueryObjectResult, the structure of which i've
	// replicated with the DatabaseError type
	//
	// usage: const result = await Database.del("artists", "id=4");
	static async del(table: string, where: string = '') {
		const formatted_where = where ? `WHERE ${where}` : '';
		const sql = `DELETE FROM ${table} ${formatted_where} RETURNING *`;

		try {
			return Database.formatResult(
				'',
				'',
				await Database.client.queryObject(sql),
			);
		} catch (err) {
			return Database.formatResult(err.message, DatabaseCommands.Delete);
		}
	}

	// only use when there are no more database calls to be made on a given page.
	// this always needs to be used so that there are no lingering db connections
	//
	// usage: await Database.end();
	static end() {
		return Database.client.end();
	}

	// one big concern i have is setting result_type to 0. i couldn't find documentation anywhere for it
	// but i know that a successful query has a result_type of 1 so i made an educated guess
	//
	// usage: const result = await Database.insert("songs", {name: "YYZ", artist_id: 1});
	static async insert(table: string, data: Record<string, unknown>) {
		const values = Database.formatValues(data);
		const sql = `INSERT INTO ${table} (${
			Object.keys(data).join(', ')
		}) VALUES(${values}) RETURNING *`;

		try {
			return Database.formatResult(
				'',
				'',
				await Database.client.queryObject(sql),
			);
		} catch (err) {
			return Database.formatResult(err.message, DatabaseCommands.Insert);
		}
	}

	// this should only be used for queries that don't fit any of the other class methods.
	// it accepts a string of raw sql, like so:
	// const result = await Database.query("SELECT * FROM songs")
	static async query(sql: string) {
		try {
			return Database.formatResult(
				'',
				'',
				await Database.client.queryObject(sql),
			);
		} catch (err) {
			return Database.formatResult(err.message, DatabaseCommands.Unknown);
		}
	}

	// usage: const result = await Database.select("songs", "album_id=2", "track_number asc");
	static async select(
		table: string,
		where: string = '',
		order_by: string = '',
	) {
		const formatted_where = where ? `WHERE ${where}` : '';
		const formatted_ordered_by = order_by ? `ORDER BY ${order_by}` : '';

		const sql = `SELECT * FROM ${table} ${formatted_where} ${formatted_ordered_by}`;
		try {
			return Database.formatResult(
				'',
				'',
				await Database.client.queryObject(sql),
			);
		} catch (err) {
			return Database.formatResult(err.message, DatabaseCommands.Select);
		}
	}

	static formatResult(
		errorMessage: string,
		command: string = '',
		query?: QueryObjectResult,
	) {
		if (errorMessage) {
			return <QueryData> {
				command: command,
				rowCount: 0,
				warnings: [],
				query: {
					args: [],
					result_type: 0,
					text: 'sql',
				},
				columns: [],
				rows: [],
				errors: [errorMessage],
			};
		}
		return query;
	}

	// this method puts insert data into a format that postgres can read
	static formatValues(data: Record<string, unknown>) {
		let values = '';
		let vals_added = 0;

		if (typeof data !== 'string') {
			for (const item in data) {
				if (typeof data[item] === 'string') {
					values = values.concat(` '${Database.escapeSqlValues(String(data[item]))}'`);
				} else if (data[item] === undefined) {
					values = values.concat(` null`);
				} else {
					values = values.concat(` ${data[item]}`);
				}
				vals_added++;
				if (vals_added != Object.values(data).length) {
					values = values.concat(`,`);
				}
			}
		} else {
			values = data;
		}

		return values;
	}

	// for if there are apostrophes in album or song or artist names
	static escapeSqlValues(value: string) {
		return value.replace('\'', '\'\'');
	}
}

export default Database;
