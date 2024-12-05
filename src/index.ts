import PocketBase, {
	RecordService,
	type BaseAuthStore,
	type ListResult,
	type RecordSubscription,
	type UnsubscribeFunc,
} from 'pocketbase'

import { processOptions, processFilterAndSort } from './option-parser.js'
import type { Options } from './options.js'
import type { PBResponseType } from './response.js'
import type { SchemaDeclaration } from './schema.js'
import type { FilterHelper } from './filter.js'
import type { BodyParams } from './body-params.js'

export type { UniqueCollection } from './type-utils.js'

// ---------------------------------------------------------------------------------------------------------
// `@ts-ignore`s are used to suppress the error caused by the type mismatch between
// the type signature of the method in the base class and the overridden method in the subclass.
// ---------------------------------------------------------------------------------------------------------

export class PocketBaseTS<
	TSchema extends SchemaDeclaration,
	TMaxDepth extends 0 | 1 | 2 | 3 | 4 | 5 | 6 = 2,
> extends PocketBase {
	#recordServices: { [K in keyof TSchema]?: RecordServiceTS<TSchema, K, TMaxDepth> } = {}

	constructor(baseUrl?: string, authStore?: BaseAuthStore | null, lang?: string) {
		super(baseUrl, authStore, lang)
	}

	// @ts-ignore
	override collection<TName extends (keyof TSchema & string) | (string & {})>(
		idOrName: TName
	): RecordServiceTS<TSchema, TName, TMaxDepth> {
		if (!this.#recordServices[idOrName]) {
			this.#recordServices[idOrName] = new RecordServiceTS<TSchema, TName, TMaxDepth>(
				this,
				idOrName
			)
		}

		return this.#recordServices[idOrName]
	}
}

class RecordServiceTS<
	TSchema extends SchemaDeclaration,
	TKey extends keyof TSchema,
	TMaxDepth extends number,
	_ListOptions extends Options<TSchema, TKey, TMaxDepth, true> = Options<
		TSchema,
		TKey,
		TMaxDepth,
		true
	>,
	_ViewOptions extends Options<TSchema, TKey, TMaxDepth, false> = Options<
		TSchema,
		TKey,
		TMaxDepth,
		false
	>,
> extends RecordService {
	constructor(client: PocketBaseTS<any>, idOrName: TKey & string) {
		super(client as unknown as PocketBase, idOrName)
	}

	override async subscribe<const TOption extends _ViewOptions>(
		topic: string,
		callback: (
			data: RecordSubscription<PBResponseType<TSchema, TKey, TOption, TMaxDepth>>
		) => void,
		options?: TOption
	): Promise<UnsubscribeFunc> {
		const processedOption = processOptions(options)
		return super.subscribe(topic, callback, processedOption)
	}

	override async getFullList<const TOptions extends _ListOptions>(
		options?: TOptions
	): Promise<Array<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>> {
		const processedOption = processOptions(options)
		return super.getFullList(processedOption)
	}

	// @ts-ignore
	override async getList<const TOptions extends _ListOptions>(
		page = 1,
		perPage = 30,
		options?: TOptions
	): Promise<ListResult<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>> {
		const processedOption = processOptions(options)
		return super.getList(page, perPage, processedOption)
	}

	// @ts-ignore
	override async getFirstListItem<const TOptions extends _ListOptions>(
		filter: string | FilterHelper<TSchema, TKey, TMaxDepth, true>,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedFilter = processFilterAndSort(filter)
		const processedOption = processOptions(options)
		return super.getFirstListItem(processedFilter, processedOption)
	}

	// @ts-ignore
	override async getOne<const TOptions extends _ViewOptions>(
		id: string,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedOption = processOptions(options)
		return super.getOne(id, processedOption)
	}

	// @ts-ignore
	override async create<const TOptions extends _ViewOptions>(
		bodyParams?:
			| Partial<Omit<TSchema[TKey]['type'], 'created' | 'updated'>>
			| { [key: string]: any }
			| FormData,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedOption = processOptions(options)
		return super.create(bodyParams, processedOption)
	}

	// @ts-ignore
	override async update<const TOptions extends _ViewOptions>(
		id: string,
		bodyParams?: BodyParams<TSchema[TKey]['type']> | { [key: string]: any } | FormData,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedOption = processOptions(options)
		return super.update(id, bodyParams, processedOption)
	}
}
