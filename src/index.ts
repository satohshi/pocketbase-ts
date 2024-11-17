import PocketBase, {
	RecordService,
	type BaseAuthStore,
	type ListResult,
	type RecordSubscription,
	type UnsubscribeFunc,
} from 'pocketbase'

import { processOptions } from './option-parser.js'
import type { Options } from './options.js'
import type { PBResponseType } from './response.js'
import type { SchemaDeclaration } from './schema.js'

export type { UniqueCollection } from './type-utils.js'

// ---------------------------------------------------------------------------------------------------------
// `@ts-ignore`s are used to suppress the error caused by the type mismatch between
// the type signature of the method in the base class and the overridden method in the subclass.
// ---------------------------------------------------------------------------------------------------------

export class PocketBaseTS<TSchema extends SchemaDeclaration> extends PocketBase {
	#recordServices: { [K in keyof TSchema]?: RecordServiceTS<TSchema, K> } = {}

	constructor(baseUrl?: string, authStore?: BaseAuthStore | null, lang?: string) {
		super(baseUrl, authStore, lang)
	}

	// @ts-ignore
	override collection<TName extends (keyof TSchema & string) | (string & {})>(
		idOrName: TName
	): RecordServiceTS<TSchema, TName> {
		if (!this.#recordServices[idOrName]) {
			this.#recordServices[idOrName] = new RecordServiceTS<TSchema, TName>(this, idOrName)
		}

		return this.#recordServices[idOrName]
	}
}

class RecordServiceTS<
	TSchema extends SchemaDeclaration,
	TKey extends keyof TSchema,
	_ListOptions extends Options<TSchema, TKey, true> = Options<TSchema, TKey, true>,
	_ViewOptions extends Options<TSchema, TKey, false> = Options<TSchema, TKey, false>,
> extends RecordService {
	constructor(client: PocketBaseTS<any>, idOrName: TKey & string) {
		super(client as unknown as PocketBase, idOrName)
	}

	override async subscribe<const TOption extends _ViewOptions>(
		topic: string,
		callback: (data: RecordSubscription<PBResponseType<TSchema, TKey, TOption>>) => void,
		options?: TOption
	): Promise<UnsubscribeFunc> {
		const processedOption = processOptions(options)
		return super.subscribe(topic, callback, processedOption)
	}

	override async getFullList<const TOptions extends _ListOptions>(
		options?: TOptions
	): Promise<Array<PBResponseType<TSchema, TKey, TOptions>>> {
		const processedOption = processOptions(options)
		return super.getFullList(processedOption)
	}

	// @ts-ignore
	override async getList<const TOptions extends _ListOptions>(
		page = 1,
		perPage = 30,
		options?: TOptions
	): Promise<ListResult<PBResponseType<TSchema, TKey, TOptions>>> {
		const processedOption = processOptions(options)
		return super.getList(page, perPage, processedOption)
	}

	// @ts-ignore
	override async getFirstListItem<const TOptions extends _ListOptions>(
		filter: string,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions>> {
		const processedOption = processOptions(options)
		return super.getFirstListItem(filter, processedOption)
	}

	// @ts-ignore
	override async getOne<const TOptions extends _ViewOptions>(
		id: string,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions>> {
		const processedOption = processOptions(options)
		return super.getOne(id, processedOption)
	}

	// @ts-ignore
	override async create<const TOptions extends _ViewOptions>(
		bodyParams?:
			| Partial<Omit<TSchema[TKey], 'created' | 'updated'>>
			| { [key: string]: any }
			| FormData,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions>> {
		const processedOption = processOptions(options)
		return super.create(bodyParams, processedOption)
	}

	// @ts-ignore
	override async update<const TOptions extends _ViewOptions>(
		id: string,
		bodyParams?:
			| Partial<Omit<TSchema[TKey], 'id' | 'created' | 'updated'>>
			| { [key: string]: any }
			| FormData,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TKey, TOptions>> {
		const processedOption = processOptions(options)
		return super.update(id, bodyParams, processedOption)
	}
}
