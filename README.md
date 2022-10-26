# Fancy Music Library

FML (it's not intentional, but I do enjoy it) is a website to scan your music library and keep track of artists, albums, and songs. It was created with Deno and Postgres.

The third-party libraries I used are:

- [Oak](https://deno.land/x/oak@v11.1.0)
- [View Engine](https://deno.land/x/view_engine@v10.6.0)
- [music-metadata-browser](https://github.com/Borewit/music-metadata-browser/)

## Setup

First, adjust the `project_root` value in `configs.ts`. If you can run `deno` from any working directory in your terminal, then you can leave that value be. Otherwise, set it to the project file's location relative to where deno.exe is being run from.

Then, create the database by running `deno run /tests/database_test.ts`.

## Running FML

Then you can run the site by running `deno run main.ts`. And that's it!

## Testing

You can run tests on FML by running `deno test /tests`. They should all be passing.
