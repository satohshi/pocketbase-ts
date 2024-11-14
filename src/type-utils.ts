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
