import type { SortKeys } from './field-to-type-map.js'
import type { SchemaDeclaration } from '../../schema.js'

type AscAndDesc<T> = T extends `-${infer Field}` ? T | Field : T | `-${T & string}`

export type SortBy<
	TSchema extends SchemaDeclaration,
	TCollectionName extends keyof TSchema,
	_MaxDepth extends number,
	_AscFields extends SortKeys<TSchema, TCollectionName, _MaxDepth> = SortKeys<
		TSchema,
		TCollectionName,
		_MaxDepth
	>,
	_DescFields = `-${_AscFields & string}`,
	_Args = _AscFields | _DescFields,
> = <const T extends _Args[]>(...fields: [...T, Exclude<_Args, AscAndDesc<T[number]>>]) => string

export const sortBy: SortBy<SchemaDeclaration, keyof SchemaDeclaration, 0> = (...fields) => {
	return fields.join(',')
}
