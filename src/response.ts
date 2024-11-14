import type { RelParser } from './relation.js'
import type { Expand, Options } from './options.js'
import type { SchemaDeclaration } from './schema.js'
import type { FieldsArrayToUnion } from './type-utils.js'

export type PBResponseType<
	TSchema extends SchemaDeclaration,
	TTableName extends keyof TSchema,
	TOptions extends Options<TSchema, TTableName>,
	_Obj = TSchema[TTableName]['type'],
> = (FieldsArrayToUnion<TOptions['fields']> extends infer Fields extends keyof _Obj
	? Pick<_Obj, Fields>
	: _Obj) &
	ProcessExpandArray<TSchema, TTableName, TOptions['expand']>

type ProcessExpandArray<
	TSchema extends SchemaDeclaration,
	TTableName extends keyof TSchema,
	TExpandArr,
	_Relations extends RelParser<TSchema>[TTableName] = RelParser<TSchema>[TTableName],
> =
	TExpandArr extends Array<Expand<TSchema, TTableName>>
		? // Check if all relations are optional
			_Relations[TExpandArr[number]['key']]['isOptional'] extends true
			? // all relations are optional, so `expand` could be undefined
				{
					expand?: TExpandArr['length'] extends 1
						? // if there's only one item in expand, it depends solely on that single expand.  i.e. if `expand` is present, so is what's inside it
							{
								[E in TExpandArr[number] as E['key']]: ProcessSingleExpand<
									TSchema,
									TTableName,
									E
								>
							}
						: // if there's more than one expand, we still need to check if each item is present, even after checking "expand"
							{
								[E in TExpandArr[number] as E['key']]+?: ProcessSingleExpand<
									TSchema,
									TTableName,
									E
								>
							}
				}
			: // if there's expand item that we know for sure isn't undefined, we don't need `?` on "expand" itself
				{
					expand: boolean extends _Relations[TExpandArr[number]['key']]['isOptional']
						? // `expand` includes both optional and required relations
							{
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
						: // `expand` only includes required relations
							{
								[E in TExpandArr[number] as E['key']]: ProcessSingleExpand<
									TSchema,
									TTableName,
									E
								>
							}
				}
		: unknown

type HandleArray<T, IsArray extends boolean> = IsArray extends true ? Array<T> : T

type ProcessSingleExpand<
	TSchema extends SchemaDeclaration,
	TTableName extends keyof TSchema,
	TExpand extends Expand<TSchema, TTableName>,
	_Rel extends
		RelParser<TSchema>[TTableName][TExpand['key']] = RelParser<TSchema>[TTableName][TExpand['key']],
	_Obj = _Rel['type'],
> = HandleArray<
	(FieldsArrayToUnion<TExpand['fields']> extends infer Fields extends keyof _Obj
		? Pick<_Obj, Fields>
		: _Obj) &
		ProcessExpandArray<TSchema, _Rel['tableName'], TExpand['expand']>,
	_Rel['isToMany']
>
