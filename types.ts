import { Context } from "./deps.ts";

export type Album = {
	id?: number;
	name?: string;
	artist_id: number;
	year?: number;
};

export type Artist = {
	id?: number;
	name: string;
};

// this mirrors the QueryObjectResult type. i've adapted it for both
// successful queries and errors since the deno postgres driver
// doesn't have good error documentation
export type QueryData = {
	command: string;
	rowCount: number;
	warnings: Array<string>;
	query: {
		args: Array<string>;
		result_type: number;
		text: string;
	};
	columns: Array<string>;
	rows: Array<Record<string, unknown>>;
	errors: Array<string>;
};

export type MusicDataResponse = {
	status: boolean;
	message?: string;
	data: Record<string, unknown>;
};

// this is needed to fix linting errors in routing
export type RenderContext = Context & {
    // deno-lint-ignore no-explicit-any
    render?: ((fileName: string, data?: Record<string, unknown>) => void) | any,
    // deno-lint-ignore no-explicit-any
    params: any;
};

export type Song = {
	id?: number;
	name: string;
	artist_id: number;
	length?: number;
	album_id: number;
	track_number?: number;
	file_location: string;
};
