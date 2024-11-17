import type { RelParser } from './relation.js'
import type { SchemaDeclaration } from './schema.js'

type ArrayModifier = '' | ':length' | ':each'

type Increment<N extends number> = [1, 2, 3, 4, 5, 6][N]

type IsArray<T> = T extends Array<any> ? true : false
type And<T extends boolean, U extends boolean> = T extends true
	? U extends true
		? true
		: false
	: false

type FilterString<
	TSchema extends SchemaDeclaration,
	TCollectionName extends keyof TSchema,
	TMaxDepth extends number,
	IncludeModifier extends boolean,
	_BaseString extends string = '',
	_Count extends number = 0,
	_CollectionType extends TSchema[TCollectionName]['type'] = TSchema[TCollectionName]['type'],
	_Relations extends RelParser<TSchema>[TCollectionName] = RelParser<TSchema>[TCollectionName],
> =
	| keyof {
			// fields on the current level
			[Field in keyof _CollectionType as `${_BaseString}${Field & string}${And<IncludeModifier, IsArray<_CollectionType[Field]>> extends true ? ArrayModifier : ''}`]: unknown
	  }
	| (_Count extends TMaxDepth
			? never
			: keyof {
					// recursive call for nested relations
					[RelKey in keyof _Relations & string as FilterString<
						TSchema,
						_Relations[RelKey]['tableName'],
						TMaxDepth,
						IncludeModifier,
						`${_BaseString}${RelKey}.`,
						Increment<_Count>
					>]: unknown
				})

export type FilterHelper<
	TSchema extends SchemaDeclaration,
	TKey extends keyof TSchema,
	TMaxDepth extends number,
	IncludeModifier extends boolean,
	_Filterable extends string = FilterString<TSchema, TKey, TMaxDepth, IncludeModifier>,
> = (arg: { $: (str: TemplateStringsArray, ...values: _Filterable[]) => string }) => string
