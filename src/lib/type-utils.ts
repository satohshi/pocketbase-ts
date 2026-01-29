declare const uniqueIdentifier: unique symbol

/**
 * Makes the type unique without polluting the object with extra properties. \
 * You only need to use this if you have multiple collections with the **exact** same shape.
 *
 * @template T - The type for the collection
 * @template U - A **unique** identifier (e.g. name of the collection)
 * @example
 * type User = UniqueCollection<{ name: string }, 'users'>
 */
export type UniqueCollection<T, U extends string> = T & {
	readonly [uniqueIdentifier]: U
}

type RemoveModifier<T extends string> = T extends `${infer U}:${string}` ? U : T

/** Removes modifiers and turns `fields` array to union if it's not `undefined` i.e. not specified */
export type FieldsArrayToUnion<T> = T extends Array<string> ? RemoveModifier<T[number]> : T

export type UnwrapArray<T> = T extends Array<infer U> ? U : T

/**
 * Get a single, non-nullable type from the schema declaration
 *
 * @example
 * interface Foo {
 *     bar?: Bar[]
 * }
 * type Result = GetSingleType<Foo['bar']> // Bar
 */
export type GetSingleType<T> = NonNullable<UnwrapArray<T>>

export type MergeObjects<T, U> = Omit<T, keyof U> & U

export type ValueOf<T extends Record<PropertyKey, unknown>> = T[keyof T]

export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
	x: infer I
) => void
	? I
	: never

export type IsArray<T> = T extends Array<any> ? true : false

export type Equals<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false

export type And<T extends boolean, U extends boolean> = T | U extends true ? true : false

export type Or<T extends boolean, U extends boolean> = true extends T | U ? true : false

export type Join<T extends string[], Separator extends string> = T extends [string]
	? T[0]
	: T extends [infer First extends string, ...infer Rest extends string[]]
		? `${First}${Separator}${Join<Rest, Separator>}`
		: never
