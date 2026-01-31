import { sortBy } from '../filter-sort-helper/sort.js'
import { filterHelpers } from '../filter-sort-helper/filter.js'
import type { SortBy } from '../filter-sort-helper/sort.js'
import type { FilterHelpers } from '../filter-sort-helper/filter.js'
import type { SchemaDeclaration } from '../../schema.js'

export type Options = {
	fields?: string[]
	expand?: Expand[]
	filter?:
		| string
		| ((arg: FilterHelpers<SchemaDeclaration, keyof SchemaDeclaration, 0>) => string)
	sort?:
		| string
		| ((arg: {
				// TODO: remove in next minor release
				$: FilterHelpers<SchemaDeclaration, keyof SchemaDeclaration, 0>['$']
				sortBy: SortBy<SchemaDeclaration, keyof SchemaDeclaration, 0>
		  }) => string)
}

interface Expand extends Pick<Options, 'fields' | 'expand'> {
	key: string
}

/** @internal */
// baseKey includes "." at the end so that we don't have to check if it's the top level or not
function getFields({ fields, expand }: Options, baseKey = ''): string {
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
function getExpand(option: Expand[], baseKey = ''): string {
	return option
		.map(({ key, expand }) => {
			return expand ? `${getExpand(expand, `${baseKey}${key}.`)}` : `${baseKey}${key}`
		})
		.join(',')
}

/** @internal */
export function processFilterAndSort<T extends Options['filter' | 'sort']>(
	filterOrSort: T
): string | (undefined extends T ? undefined : never) {
	return typeof filterOrSort === 'function'
		? filterOrSort({ ...filterHelpers, sortBy })
		: (filterOrSort as any)
}

/** @internal */
export function processOptions(
	options: Options | Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
	if (
		!options ||
		// if these are already of type `string`, it's already been processed and the method was called internally
		typeof options.fields === 'string' ||
		typeof options.expand === 'string'
	) {
		return options
	}

	assertOptionType(options)

	const expand = options.expand ? getExpand(options.expand) : undefined
	const fields = checkHasFieldsSpecified(options) ? getFields(options) : undefined
	const filter = processFilterAndSort(options.filter)
	const sort = processFilterAndSort(options.sort)

	const res = { ...options, fields, expand, filter, sort }

	// remove undefined values. the sdk will throw error if left unhandled
	for (const [key, value] of Object.entries(res)) {
		// `null` is a valid value for `requestKey` and should not be removed
		if (value === undefined) {
			delete res[key as keyof typeof res]
		}
	}

	return res
}

function assertOptionType(options: any): asserts options is Options {
	if (
		(options.fields && !Array.isArray(options.fields)) ||
		(options.expand && !Array.isArray(options.expand)) ||
		(options.filter &&
			typeof options.filter !== 'string' &&
			typeof options.filter !== 'function') ||
		(options.sort && typeof options.sort !== 'string' && typeof options.sort !== 'function')
	) {
		console.error('Invalid options object provided:', options)
		throw new Error('Invalid options')
	}
}

export function checkHasFieldsSpecified(options: any): boolean {
	if (options === null || typeof options !== 'object') return false

	if ('fields' in options) {
		return true
	}

	for (const key in options) {
		if (checkHasFieldsSpecified(options[key])) {
			return true
		}
	}

	return false
}
