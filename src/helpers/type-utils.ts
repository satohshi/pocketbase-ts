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

type UnwrapArray<T> = T extends Array<infer U> ? U : T

export type IsSameShape<T, U> = T extends U ? (U extends T ? true : false) : false

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
