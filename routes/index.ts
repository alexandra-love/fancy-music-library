import { RenderContext } from '../types.ts';

export function renderIndex(context: RenderContext) {
	return context.render('index.ejs');
}