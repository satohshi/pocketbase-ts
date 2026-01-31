import type { SchemaParser } from './lib/schema-parer/schema-parser.js'
import type { Expand, Options } from './options.js'
import type { SchemaDeclaration } from './schema.js'
import type { FieldsArrayToUnion } from './lib/type-utils.js'

export type PBResponseType<
	TSchema extends SchemaDeclaration,
	TTableName extends keyof TSchema,
	TOptions extends Options<TSchema, TTableName, TMaxDepth, 'list'>,
	TMaxDepth extends number,
	_Obj = TSchema[TTableName]['type'],
> = (FieldsArrayToUnion<TOptions['fields']> extends infer Fields extends keyof _Obj
	? Pick<_Obj, Fields>
	: _Obj) &
	ProcessExpandArray<TSchema, TTableName, TOptions['expand']>

type ProcessExpandArray<
	TSchema extends SchemaDeclaration,
	TTableName extends keyof TSchema,
	TExpandArr,
	_Relations extends SchemaParser<TSchema>[TTableName] = SchemaParser<TSchema>[TTableName],
> =
	TExpandArr extends Array<Expand<TSchema, TTableName>>
		? {
				expand: {
					// add `?` to optional relations
					[E in TExpandArr[number] as _Relations[E['key']]['isOptional'] extends true
						? E['key']
						: never]+?: ProcessSingleExpand<TSchema, TTableName, E>
				} & {
					// required relations don't need `?`
					[E in TExpandArr[number] as _Relations[E['key']]['isOptional'] extends false
						? E['key']
						: never]: ProcessSingleExpand<TSchema, TTableName, E>
				}
			}
		: unknown

type HandleArray<T, IsArray extends boolean> = IsArray extends true ? [T, ...T[]] : T

type ProcessSingleExpand<
	TSchema extends SchemaDeclaration,
	TTableName extends keyof TSchema,
	TExpand extends Expand<TSchema, TTableName>,
	_Rel extends SchemaParser<TSchema>[TTableName][TExpand['key']] =
		SchemaParser<TSchema>[TTableName][TExpand['key']],
	_Obj = _Rel['type'],
> = HandleArray<
	(FieldsArrayToUnion<TExpand['fields']> extends infer Fields extends keyof _Obj
		? Pick<_Obj, Fields>
		: _Obj) &
		ProcessExpandArray<TSchema, _Rel['tableName'], TExpand['expand']>,
	_Rel['isToMany']
>
