import type { RelParser } from './relation.js'
import type { SchemaDeclaration } from './schema.js'

type ArrayModifier = '' | ':length' | ':each'
type Macros =
	| '@now'
	| '@second'
	| '@minute'
	| '@hour'
	| '@weekday'
	| '@day'
	| '@month'
	| '@year'
	| '@todayStart'
	| '@todayEnd'
	| '@monthStart'
	| '@monthEnd'
	| '@yearStart'
	| '@yearEnd'

type Increment<N extends number> = [1, 2, 3, 4, 5, 6][N]

type FilterString<
	TSchema extends SchemaDeclaration,
	TCollectionName extends keyof TSchema,
	TMaxDepth extends number,
	_BaseString extends string = '',
	_Count extends number = 0,
	_CollectionType extends TSchema[TCollectionName]['type'] = TSchema[TCollectionName]['type'],
	_Relations extends RelParser<TSchema>[TCollectionName] = RelParser<TSchema>[TCollectionName],
> =
	| keyof {
			// fields on the current level
			[Field in keyof _CollectionType as `${_BaseString}${Field & string}${_CollectionType[Field] extends Array<any> ? ArrayModifier : ''}`]: unknown
	  }
	| (_Count extends TMaxDepth
			? never
			: keyof {
					// recursive call for nested relations
					[RelKey in keyof _Relations & string as FilterString<
						TSchema,
						_Relations[RelKey]['tableName'],
						TMaxDepth,
						`${_BaseString}${RelKey}.`,
						Increment<_Count>
					>]: unknown
				})

export type FilterHelper<
	TSchema extends SchemaDeclaration,
	TKey extends keyof TSchema,
	TMaxDepth extends number,
	_Filterable extends string = Macros | FilterString<TSchema, TKey, TMaxDepth>,
> = (arg: { f: (str: TemplateStringsArray, ...values: _Filterable[]) => string }) => string
