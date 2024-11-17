type Options = {
	fields?: string[]
	expand?: Expand[]
	filter?:
		| string
		| ((arg: { f: (str: TemplateStringsArray, ...values: string[]) => string }) => string)
}
interface Expand extends Omit<Options, 'filter'> {
	key: string
}

/** @internal */
// baseKey includes "." at the end so that we don't have to check if it's the top level or not
const getFields = ({ fields, expand }: Options, baseKey = ''): string => {
	const fieldsAtThisLevel = fields
		? fields.map((field) => `${baseKey}${field}`).join(',')
		: expand
			? `${baseKey}*`
			: baseKey.slice(0, -1) // if it doesn't expand any further, there's no need to add ".*"

	if (expand) {
		// check if any of the expand has fields specified
		if (JSON.stringify(expand).includes('"fields"')) {
			const expandFields = expand.map((exp) => {
				return getFields(exp, `${baseKey}expand.${exp.key}.`)
			})

			return `${fieldsAtThisLevel},${expandFields.join(',')}`
		}

		// if not, add ".*" to include all fields at this level and below
		return `${fieldsAtThisLevel},${baseKey}expand.*`
	}

	return `${fieldsAtThisLevel}`
}

/** @internal */
const getExpand = (option: Expand[], baseKey = ''): string => {
	return option
		.map(({ key, expand }) => {
			return expand ? `${getExpand(expand, `${baseKey}${key}.`)}` : `${baseKey}${key}`
		})
		.join(',')
}

/** @internal */
const f = (str: TemplateStringsArray, ...values: string[]): string => {
	return values.reduce<string>((acc, val, i) => acc + val + str[i + 1], str[0]!)
}

/** @internal */
export const processFilter = <T extends Options['filter']>(
	filter: T
): string | (undefined extends T ? undefined : never) => {
	return typeof filter === 'function' ? filter({ f }) : (filter as any)
}

/** @internal */
export const processOptions = (
	option: Options | Record<string, unknown> | undefined
): Record<string, unknown> | undefined => {
	if (
		!option ||
		// if these are already of type `string`, it's already been processed and the method was called internally
		typeof option.fields === 'string' ||
		typeof option.expand === 'string'
	) {
		return option
	}

	const expand = option.expand ? getExpand(option.expand as Expand[]) : undefined
	const fields = JSON.stringify(option).includes('"fields"')
		? getFields(option as Options)
		: undefined
	const filter = processFilter(option.filter as Options['filter'])

	const res = { ...option, fields, expand, filter }

	// remove undefined values. the sdk will throw error if left unhandled
	for (const [key, value] of Object.entries(res)) {
		// `null` is a valid value for `requestKey` and should not be removed
		if (value === undefined) {
			delete res[key as keyof typeof res]
		}
	}

	return res
}
