export type BodyParams<T> = {
	[K in keyof Omit<T, 'id' | 'created' | 'updated'> & string as number extends T[K]
		? K | `${K}+` | `${K}-`
		: NonNullable<T[K]> extends Array<any>
			? K | `${K}+` | `+${K}` | `${K}-`
			: K]?: T[K]
}
