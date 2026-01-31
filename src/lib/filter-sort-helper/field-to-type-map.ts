import type { SchemaParser } from '../schema-parer/schema-parser.js'
import type { SchemaDeclaration } from '../../schema.js'
import type {
	Or,
	And,
	Equals,
	IsArray,
	ValueOf,
	GetSingleType,
	UnionToIntersection,
} from '../type-utils.js'

export type Macros = {
	'@now': string
	'@second': number
	'@minute': number
	'@hour': number
	'@weekday': number
	'@day': number
	'@month': number
	'@year': number
	'@yesterday': string
	'@tomorrow': string
	'@todayStart': string
	'@todayEnd': string
	'@monthStart': string
	'@monthEnd': string
	'@yearStart': string
	'@yearEnd': string
}

export type QuotedString = `'${string}'` | `"${string}"`

type MakeArray<T, IsCollection extends boolean> = IsCollection extends true ? Array<T> : T

export type FilterObject<TObj extends Record<PropertyKey, unknown>, TFilterBy> = {
	[K in keyof TObj as TObj[K] extends TFilterBy ? K : never]: TObj[K]
}

export type CollectionRef<TSchema extends SchemaDeclaration> = UnionToIntersection<
	ValueOf<{
		[CollectionName in keyof TSchema & string]: Transform<
			{
				[FieldName in keyof TSchema[CollectionName]['type'] &
					string as `@collection.${CollectionName}.${FieldName}`]: TSchema[CollectionName]['type'][FieldName]
			},
			true
		>
	}>
>

type Transform<T extends Record<string, unknown>, IsCollection extends boolean = false> = {
	[K in keyof T]-?: MakeArray<T[K], IsCollection>
} & {
	[K in keyof T & string as T[K] extends Array<any> ? `${K}:length` : never]-?: MakeArray<
		number,
		IsCollection
	>
} & {
	[K in keyof T & string as T[K] extends Array<any> ? `${K}:each` : never]-?: MakeArray<
		GetSingleType<T[K]>,
		IsCollection
	>
} & {
	[K in keyof T & string as T[K] extends string ? `${K}:lower` : never]-?: MakeArray<
		Lowercase<QuotedString>,
		IsCollection
	>
}

// posts_via_author.tags is technically `string[][]`, but should be treated as `string[]` when used with operands like `?=`
// without the [] `MakeArrayIfNotAlready<boolean, true>` turns into `false[] | true[]`
type MakeArrayIfNotAlready<T, MakeArray extends boolean> = [T] extends [Array<any>]
	? T
	: MakeArray extends true
		? Array<T>
		: T

type IncrementDepth<N extends number> = [1, 2, 3, 4, 5, 6][N]

export type GetFieldsMap<
	TSchema extends SchemaDeclaration,
	TCollectionName extends keyof TSchema,
	TMaxDepth extends number,
	_Type extends 'filter' | 'sort',
	_BaseString extends string = '',
	_BaseIsArray extends boolean = false,
	_Count extends number = 0,
	_CollectionType extends TSchema[TCollectionName]['type'] = TSchema[TCollectionName]['type'],
	_Relations extends SchemaParser<TSchema>[TCollectionName] =
		SchemaParser<TSchema>[TCollectionName],
> = {
	[Field in keyof _CollectionType as And<
		Equals<_Type, 'filter'>,
		IsArray<_CollectionType[Field]>
	> extends true
		? never // afaik there are no filter operators that work on an array field without :each or :length
		: `${_BaseString}${Field & string}`]: MakeArrayIfNotAlready<
		_CollectionType[Field],
		_BaseIsArray
	>
} & {
	[Field in keyof _CollectionType as _CollectionType[Field] extends string
		? `${_BaseString}${Field & string}:lower`
		: never]: MakeArrayIfNotAlready<Lowercase<QuotedString>, _BaseIsArray>
} & {
	[Field in keyof _CollectionType as And<
		Equals<_Type, 'filter'>, // :each cannot be used for sort
		IsArray<_CollectionType[Field]>
	> extends true
		? `${_BaseString}${Field & string}:each`
		: never]: GetSingleType<_CollectionType[Field]>
} & {
	[Field in keyof _CollectionType as _CollectionType[Field] extends Array<any>
		? `${_BaseString}${Field & string}:length`
		: never]: MakeArray<number, _BaseIsArray>
} & (_Count extends TMaxDepth
		? unknown
		: UnionToIntersection<
				{
					[RelKey in keyof _Relations]: GetFieldsMap<
						TSchema,
						_Relations[RelKey]['tableName'],
						TMaxDepth,
						_Type,
						`${_BaseString}${RelKey & string}.`,
						Or<_BaseIsArray, _Relations[RelKey]['isToMany']>,
						IncrementDepth<_Count>
					>
				}[keyof _Relations]
			>)

export type FieldsMapForFilter<
	TSchema extends SchemaDeclaration,
	TCollectionName extends keyof TSchema,
	TMaxDepth extends number,
> = GetFieldsMap<TSchema, TCollectionName, TMaxDepth, 'filter'>

export type SortKeys<
	TSchema extends SchemaDeclaration,
	TCollectionName extends keyof TSchema,
	TMaxDepth extends number,
> = keyof GetFieldsMap<TSchema, TCollectionName, TMaxDepth, 'sort'>
