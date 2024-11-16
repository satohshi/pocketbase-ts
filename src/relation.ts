import type { SchemaDeclaration } from './schema.js'
import type { IsSameShape, MergeObjects, GetSingleType } from './type-utils.js'

type GetCollectionName<TSchema extends SchemaDeclaration, TObj> = keyof {
	[K in keyof TSchema as IsSameShape<TSchema[K]['type'], TObj> extends true ? K : never]: unknown
}

/**
 * Returns the back-relation key if any column in `TCollectionName` points to `TypeToLookFor`
 *
 * @template TSchema - The schema declaration.
 * @template TCollectionName - The name of the collection to search for back-relation.
 * @template TypeToLookFor - The type to look for in the relation fields.
 */
type BackRelationKey<
	TSchema extends SchemaDeclaration,
	TCollectionName extends keyof TSchema,
	TypeToLookFor,
> = keyof {
	[K in keyof TSchema[TCollectionName]['relations'] as IsSameShape<
		GetSingleType<TSchema[TCollectionName]['relations'][K]>,
		TypeToLookFor
	> extends true
		? `${TCollectionName & string}_via_${K & string}`
		: never]: unknown
}

/** Back-relations that are inferred from the schema */
type ImplicitRelations<TSchema extends SchemaDeclaration> = {
	[K1 in keyof TSchema]: {
		[K2 in keyof TSchema as BackRelationKey<TSchema, K2, TSchema[K1]['type']>]: {
			type: GetSingleType<TSchema[K2]['type']>
			isOptional: true
			isToMany: true
			tableName: K2
		}
	}
}

type RelHelper<TSchema extends SchemaDeclaration, T> = {
	type: GetSingleType<T>
	isOptional: undefined extends T ? true : false
	isToMany: NonNullable<T> extends Array<any> ? true : false
	tableName: GetCollectionName<TSchema, GetSingleType<T>>
}

/** Relations that are explicitly defined in the schema */
type ExplicitRelations<TSchema extends SchemaDeclaration> = {
	[Collection in keyof TSchema]: {
		[Relation in keyof TSchema[Collection]['relations']]-?: RelHelper<
			TSchema,
			TSchema[Collection]['relations'][Relation]
		>
	}
}

/** parse relations from the schema */
export type RelParser<TSchema extends SchemaDeclaration> = {
	[K in keyof TSchema]: MergeObjects<ImplicitRelations<TSchema>[K], ExplicitRelations<TSchema>[K]>
}
