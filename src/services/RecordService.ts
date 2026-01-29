import PocketBase, { RecordService } from 'pocketbase'
import { processFilterAndSort, processOptions } from '../lib/option-parser/option-parser.js'
import type {
	ListResult,
	RecordOptions,
	UnsubscribeFunc,
	RecordListOptions,
	RecordSubscription,
	RecordFullListOptions,
	RecordSubscribeOptions,
} from 'pocketbase'
import type { Options } from '../options.js'
import type { BodyParams } from '../body-params.js'
import type { PocketBaseTS } from '../Client.js'
import type { MergeObjects } from '../lib/type-utils.js'
import type { FilterHelpers } from '../lib/filter-sort-helper/filter.js'
import type { PBResponseType } from '../response.js'
import type { SchemaDeclaration } from '../schema.js'

export class RecordServiceTS<
	TSchema extends SchemaDeclaration,
	TKey extends keyof TSchema,
	TMaxDepth extends number,
	_Type = TSchema[TKey]['type'],
	_ListOptions extends Options<TSchema, TKey, TMaxDepth, 'list'> = Options<
		TSchema,
		TKey,
		TMaxDepth,
		'list'
	>,
	_ViewOptions extends Options<TSchema, TKey, TMaxDepth, 'view'> = Options<
		TSchema,
		TKey,
		TMaxDepth,
		'view'
	>,
	_SubscribeOptions extends Options<TSchema, TKey, TMaxDepth, 'subscribe'> = Options<
		TSchema,
		TKey,
		TMaxDepth,
		'subscribe'
	>,
> extends RecordService {
	constructor(client: PocketBaseTS<any>, idOrName: TKey & string) {
		super(client as unknown as PocketBase, idOrName)
	}

	override async subscribe<
		const TOption extends MergeObjects<RecordSubscribeOptions, _SubscribeOptions>,
	>(
		topic: string,
		callback: (
			data: RecordSubscription<PBResponseType<TSchema, TKey, TOption, TMaxDepth>>
		) => void
	): Promise<UnsubscribeFunc>
	override async subscribe<
		const TOption extends MergeObjects<RecordSubscribeOptions, _SubscribeOptions>,
	>(
		topic: string,
		callback: (
			data: RecordSubscription<PBResponseType<TSchema, TKey, TOption, TMaxDepth>>
		) => void,
		options: TOption
	): Promise<UnsubscribeFunc>
	override async subscribe<
		const TOption extends MergeObjects<RecordSubscribeOptions, _SubscribeOptions>,
	>(
		topic: string,
		callback: (
			data: RecordSubscription<PBResponseType<TSchema, TKey, TOption, TMaxDepth>>
		) => void,
		options?: TOption
	): Promise<UnsubscribeFunc> {
		const processedOption = processOptions(options)
		return super.subscribe(topic, callback, processedOption)
	}

	override async getFullList<
		const TOptions extends MergeObjects<RecordFullListOptions, _ListOptions>,
	>(options?: TOptions): Promise<Array<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>> {
		const processedOption = processOptions(options)
		return super.getFullList(processedOption)
	}

	override async getList(page: number, perPage: number): Promise<ListResult<_Type>>
	override async getList<const TOptions extends MergeObjects<RecordListOptions, _ListOptions>>(
		page: number,
		perPage: number,
		options: TOptions
	): Promise<ListResult<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>>
	override async getList<const TOptions extends MergeObjects<RecordListOptions, _ListOptions>>(
		page = 1,
		perPage = 30,
		options?: TOptions
	): Promise<ListResult<_Type | PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>> {
		const processedOption = processOptions(options)
		return super.getList(page, perPage, processedOption)
	}

	override async getFirstListItem(
		filter: string | ((arg: FilterHelpers<TSchema, TKey, TMaxDepth>) => string)
	): Promise<_Type>
	override async getFirstListItem<
		const TOptions extends MergeObjects<RecordListOptions, _ListOptions>,
	>(
		filter: string | ((arg: FilterHelpers<TSchema, TKey, TMaxDepth>) => string),
		options: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>
	override async getFirstListItem<
		const TOptions extends MergeObjects<RecordListOptions, _ListOptions>,
	>(
		filter: string | ((arg: FilterHelpers<TSchema, TKey, TMaxDepth>) => string),
		options?: TOptions
	): Promise<_Type | PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedFilter = processFilterAndSort(filter)
		const processedOption = processOptions(options)
		return super.getFirstListItem(processedFilter, processedOption)
	}

	override async getOne(id: string): Promise<_Type>
	override async getOne<const TOptions extends MergeObjects<RecordOptions, _ViewOptions>>(
		id: string,
		options: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>
	override async getOne<const TOptions extends MergeObjects<RecordOptions, _ViewOptions>>(
		id: string,
		options?: TOptions
	): Promise<_Type | PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedOption = processOptions(options)
		return super.getOne(id, processedOption)
	}

	override async create(
		bodyParams?:
			| Partial<Omit<_Type, 'created' | 'updated' | 'collectionId' | 'collectionName'>>
			| { [key: string]: any }
			| FormData
	): Promise<_Type>
	override async create<const TOptions extends MergeObjects<RecordOptions, _ViewOptions>>(
		bodyParams:
			| Partial<Omit<_Type, 'created' | 'updated' | 'collectionId' | 'collectionName'>>
			| { [key: string]: any }
			| FormData,
		options: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>
	override async create<const TOptions extends MergeObjects<RecordOptions, _ViewOptions>>(
		bodyParams?:
			| Partial<Omit<_Type, 'created' | 'updated' | 'collectionId' | 'collectionName'>>
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
	override async update<const TOptions extends MergeObjects<RecordOptions, _ViewOptions>>(
		id: string,
		bodyParams: BodyParams<_Type> | { [key: string]: any } | FormData,
		options: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions, TMaxDepth>>
	override async update<const TOptions extends MergeObjects<RecordOptions, _ViewOptions>>(
		id: string,
		bodyParams?: BodyParams<_Type> | { [key: string]: any } | FormData,
		options?: TOptions
	): Promise<_Type | PBResponseType<TSchema, TKey, TOptions, TMaxDepth>> {
		const processedOption = processOptions(options)
		return super.update(id, bodyParams, processedOption)
	}
}
