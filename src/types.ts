export type BaseSchema = Record<string, unknown>
export type BaseRelation<T extends BaseSchema> = Record<string, T[keyof T] | Array<T[keyof T]>>

type WithEllipsis = '' | `${',' | ', '}${boolean}`
type Modifier = `:excerpt(${number}${WithEllipsis})`

type RemoveModifier<T extends string> = T extends `${infer U}:${string}` ? U : T
type FieldsArrayToUnion<T> = T extends Array<string> ? RemoveModifier<T[number]> : T

export type ViewOptions<T extends Record<string, unknown>> = Omit<
	T,
	'sort' | 'filter' | 'page' | 'perPage' | 'skipTotal'
>

export type ListOptions<TSchema extends BaseSchema, TRelation extends BaseRelation<TSchema>> = {
	[Key in keyof TSchema]: {
		requestKey?: string | null

		fields?: Array<
			keyof {
				[K in keyof TSchema[Key] as TSchema[Key][K] extends string
					? `${K & string}${'' | Modifier}`
					: K]: unknown
			}
		>
		expand?: Array<Expand<TSchema, TRelation, Related<TSchema, TRelation, TSchema[Key]>>>

		sort?: '@random' | `${'' | '-'}${keyof TSchema[Key] & string}` | (string & {})
		filter?: string
		page?: number
		perPage?: number
		skipTotal?: boolean
	}
}

type Expand<
	TSchema extends BaseSchema,
	TRelation extends BaseRelation<TSchema>,
	TKey extends keyof TRelation,
> = {
	[Key in TKey]: {
		key: Key & string
		fields?: NonNullable<TRelation[Key]> extends Array<infer U> | infer U
			? Array<
					{
						[K in keyof U]: U[K] extends string ? `${K & string}${'' | Modifier}` : K
					}[keyof U]
				>
			: never
		expand?: NonNullable<TRelation[Key]> extends
			| Array<infer U extends TSchema[keyof TSchema]>
			| (infer U extends TSchema[keyof TSchema])
			? Array<Expand<TSchema, TRelation, Related<TSchema, TRelation, U>>>
			: never
	}
}[TKey]

type Related<TSchema, TRelation, T extends TSchema[keyof TSchema]> =
	| (keyof T & keyof TRelation)
	| BackRelation<TSchema, TRelation, T>

type BackRelation<TSchema, TRelation, T extends TSchema[keyof TSchema]> = keyof {
	[Key in keyof TRelation as Key extends `${string}(${infer U})` | `${string}_via_${infer U}`
		? U extends keyof TRelation
			? T extends TRelation[U]
				? TRelation[U] extends T
					? Key
					: never
				: never
			: never
		: never]: unknown
} &
	keyof TRelation

export type PBResponseType<
	TSchema extends BaseSchema,
	TRelation extends BaseRelation<TSchema>,
	TKey extends keyof ListOptions<TSchema, TRelation>,
	TOption extends ListOptions<TSchema, TRelation>[TKey],
	_Obj = TSchema[TKey],
> = (FieldsArrayToUnion<TOption['fields']> extends infer Fields extends keyof _Obj
	? Pick<_Obj, Fields>
	: _Obj) &
	ProcessExpandArray<TSchema, TRelation, TOption['expand']>

// check if all items in "expand" array are optional
type AllOptional<TRelation, T extends Array<{ key: keyof TRelation }>> =
	{
		[Obj in T[number] as Obj['key']]: undefined extends TRelation[Obj['key']] ? true : false
	} extends Record<PropertyKey, true>
		? true
		: false

type ProcessExpandArray<
	TSchema extends BaseSchema,
	TRelation extends BaseRelation<TSchema>,
	TExpandArr,
> =
	TExpandArr extends Array<Expand<TSchema, TRelation, keyof TRelation>>
		? AllOptional<TRelation, TExpandArr> extends true
			? {
					expand?: TExpandArr['length'] extends 1
						? // if there's only one expand, whether "expand" is undefined or not depends on that single expand
							{
								[E in TExpandArr[number] as E['key']]: ProcessSingleExpand<
									TSchema,
									TRelation,
									E
								>
							}
						: // if there's more than one expand, we still need to check if each item is undefined or not, even after checking "expand" is not undefined
							{
								[E in TExpandArr[number] as E['key']]?: ProcessSingleExpand<
									TSchema,
									TRelation,
									E
								>
							}
				}
			: {
					// if there's expand item that we know for sure isn't undefined, we don't need to +? on "expand" itself
					expand: {
						// AFAIK, there's no way to add "?" modifier conditionally, so we have to use keys from TRelation
						[Key in keyof TRelation as Key extends TExpandArr[number]['key']
							? Key
							: never]: {
							[E in TExpandArr[number] as E['key']]: ProcessSingleExpand<
								TSchema,
								TRelation,
								E
							>
						}[Key & string]
					}
				}
		: unknown // "never" doesn't work here because "any & never" is never

type HandleArray<T, IsArray extends boolean> = IsArray extends true ? Array<T> : T

type ProcessSingleExpand<
	TSchema extends BaseSchema,
	TRelation extends BaseRelation<TSchema>,
	TExpand extends Expand<TSchema, TRelation, keyof TRelation>,
	_Obj = NonNullable<TRelation[TExpand['key']]> extends Array<infer U> | infer U ? U : never,
> = HandleArray<
	(FieldsArrayToUnion<TExpand['fields']> extends infer Fields extends keyof _Obj
		? Pick<_Obj, Fields>
		: _Obj) &
		ProcessExpandArray<TSchema, TRelation, TExpand['expand']>,
	NonNullable<TRelation[TExpand['key']]> extends Array<unknown> ? true : false
>
