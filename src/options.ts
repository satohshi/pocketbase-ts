import type { RelParser } from './relation.js'
import type { SchemaDeclaration } from './schema.js'

type WithEllipsis = '' | `${',' | ', '}${boolean}`

type Modifier = `:excerpt(${number}${WithEllipsis})`

export type Options<
	TSchema extends SchemaDeclaration,
	TKey extends keyof TSchema,
	IsList extends boolean = true,
> = {
	[Key in TKey]: {
		requestKey?: string | null

		/** Array of field names to include in the response. If not provided, all fields will be included. */
		fields?: Array<
			keyof {
				[K in keyof TSchema[Key]['type'] as TSchema[Key]['type'][K] extends string
					? `${K & string}${'' | Modifier}`
					: K]: unknown
			}
		>
		/** Array of relations to include in the response. */
		expand?: Array<Expand<TSchema, Key>>
	} & (IsList extends true
		? {
				sort?:
					| '@random'
					| `${'' | '-'}${keyof TSchema[Key]['type'] & string}`
					| (string & {})

				filter?: string
				page?: number
				perPage?: number
				skipTotal?: boolean
			}
		: unknown)
}[TKey]

export type Expand<
	TSchema extends SchemaDeclaration,
	TTableName extends keyof TSchema,
	_Relations extends Record<keyof TSchema, any> = RelParser<TSchema>,
> = {
	[Key in keyof _Relations[TTableName]]: {
		/** Key of the relation to expand (column name or back-relation) */
		key: Key

		/** Array of field names to include in the response. If not provided, all fields will be included */
		fields?: Array<
			keyof {
				[K in keyof _Relations[TTableName][Key]['type'] as _Relations[TTableName][Key]['type'][K] extends string
					? `${K & string}${'' | Modifier}`
					: K]: unknown
			}
		>
		/** Array of relations to include in the response. */
		expand?: Array<Expand<TSchema, _Relations[TTableName][Key]['tableName'], _Relations>>
	}
}[keyof _Relations[TTableName]]
