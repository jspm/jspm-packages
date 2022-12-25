import {createTheme} from 'thememirror';
import {tags as t} from '@lezer/highlight';

export const jspmDark = createTheme({
	variant: 'dark',
	settings: {
		background: '#000000',
		foreground: '#fff3b0',
		caret: '#fd9e02',
		selection: '#14213d',
		lineHighlight: '#212c54',
		gutterBackground: '#000000',
		gutterForeground: '#b51fc97d',
	},
	styles: [
		{
			tag: t.comment,
			color: '#e5e5e5',
		},
		{
			tag: t.variableName,
			color: '#ffbe0b',
		},

		{
			tag: t.typeName,
			color: '#3a86ff',
		},
		{
			tag: t.angleBracket,
			color: '#06d6a0',
		},
		{
			tag: t.tagName,
			color: '#ff006e',
		},
		{
			tag: t.attributeName,
			color: '#fca311',
		},
		{
			tag: [t.string],
			color: '#fefae0',
		},
		{
			tag: [t.special(t.brace)],
			color: '#06d6a0',
		},
		{
			tag: t.number,
			color: '#118ab2',
		},
		{
			tag: t.bool,
			color: '#ef233c',
		},
		{
			tag: t.null,
			color: '#fb5607',
		},
		{
			tag: t.keyword,
			color: '#ffffff',
		},
		{
			tag: t.operator,
			color: '#ef476f',
		},
		{
			tag: t.className,
			color: '#ff595e',
		},
		{
			tag: t.definition(t.typeName),
			color: '#fca311',
		}
	],
});