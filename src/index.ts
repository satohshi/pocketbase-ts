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

export class PocketBaseTS<
	TSchema extends SchemaDeclaration,
	TMaxDepth extends 0 | 1 | 2 | 3 | 4 | 5 | 6 = 2,
> extends PocketBase {
	#recordServices: { [K in keyof TSchema]?: RecordServiceTS<TSchema, K, TMaxDepth> } = {}

	constructor(baseUrl?: string, authStore?: BaseAuthStore | null, lang?: string) {
		super(baseUrl, authStore, lang)
	}

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
	_Type = TSchema[TKey]['type'],
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

	override async getList(page: number, perPage: number): Promise<ListResult<_Type>>
	override async getList<const TOptions extends _ListOptions>(
		page: number,
		perPage: number,
		options: TOptions
	): Promise<ListResult<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>>
	override async getList<const TOptions extends _ListOptions>(
		page = 1,
		perPage = 30,
		options?: TOptions
	): Promise<ListResult<_Type | PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>> {
		const processedOption = processOptions(options)
		return super.getList(page, perPage, processedOption)
	}

	override async getFirstListItem(
		filter: string | FilterHelper<TSchema, TKey, TMaxDepth, true>
	): Promise<_Type>
	override async getFirstListItem<const TOptions extends _ListOptions>(
		filter: string | FilterHelper<TSchema, TKey, TMaxDepth, true>,
		options: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>
	override async getFirstListItem<const TOptions extends _ListOptions>(
		filter: string | FilterHelper<TSchema, TKey, TMaxDepth, true>,
		options?: TOptions
	): Promise<_Type | PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedFilter = processFilterAndSort(filter)
		const processedOption = processOptions(options)
		return super.getFirstListItem(processedFilter, processedOption)
	}

	override async getOne(id: string): Promise<_Type>
	override async getOne<const TOptions extends _ViewOptions>(
		id: string,
		options: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>
	override async getOne<const TOptions extends _ViewOptions>(
		id: string,
		options?: TOptions
	): Promise<_Type | PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedOption = processOptions(options)
		return super.getOne(id, processedOption)
	}

	override async create(
		bodyParams?: Partial<Omit<_Type, 'created' | 'updated'>> | { [key: string]: any } | FormData
	): Promise<_Type>
	override async create<const TOptions extends _ViewOptions>(
		bodyParams: Partial<Omit<_Type, 'created' | 'updated'>> | { [key: string]: any } | FormData,
		options: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>
	override async create<const TOptions extends _ViewOptions>(
		bodyParams?:
			| Partial<Omit<_Type, 'created' | 'updated'>>
			| { [key: string]: any }
			| FormData,
		options?: TOptions
	): Promise<_Type | PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedOption = processOptions(options)
		return super.create(bodyParams, processedOption)
	}

	override async update(
		id: string,
		bodyParams?: BodyParams<_Type> | { [key: string]: any } | FormData
	): Promise<_Type>
	override async update<const TOptions extends _ViewOptions>(
		id: string,
		bodyParams: BodyParams<_Type> | { [key: string]: any } | FormData,
		options: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>
	override async update<const TOptions extends _ViewOptions>(
		id: string,
		bodyParams?: BodyParams<_Type> | { [key: string]: any } | FormData,
		options?: TOptions
	): Promise<_Type | PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedOption = processOptions(options)
		return super.update(id, bodyParams, processedOption)
	}
}
