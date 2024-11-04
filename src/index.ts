import PocketBase, { BaseAuthStore, RecordService, type ListResult } from 'pocketbase'
import { processOptions } from './utils.js'
import type { BaseRelation, BaseSchema, ListOptions, ViewOptions, PBResponseType } from './types.js'

// ---------------------------------------------------------------------------------------------------------
// `@ts-ignore`s are used to suppress the error caused by the type mismatch between
// the type signature of the method in the base class and the overridden method in the subclass.
// ---------------------------------------------------------------------------------------------------------

export default class PocketBaseTS<
	TSchema extends BaseSchema,
	TRelations extends BaseRelation<TSchema>,
> extends PocketBase {
	#recordServices: { [K in keyof TSchema]?: any } = {}

	constructor(baseUrl?: string, authStore?: BaseAuthStore | null, lang?: string) {
		super(baseUrl, authStore, lang)
	}

	// @ts-ignore
	override collection<TName extends (keyof TSchema & string) | (string & {})>(
		idOrName: TName
	): RecordServiceTS<TSchema, TRelations, TName> {
		if (!this.#recordServices[idOrName]) {
			this.#recordServices[idOrName] = new RecordServiceTS<TSchema, TRelations, TName>(
				this,
				idOrName
			)
		}

		return this.#recordServices[idOrName]
	}
}

class RecordServiceTS<
	TSchema extends BaseSchema,
	TRelations extends BaseRelation<TSchema>,
	TKey extends keyof ListOptions<TSchema, TRelations>,
	_TListOptions extends ListOptions<TSchema, TRelations>[TKey] = ListOptions<
		TSchema,
		TRelations
	>[TKey],
	_TViewOptions extends ViewOptions<_TListOptions> = ViewOptions<_TListOptions>,
> extends RecordService {
	constructor(client: PocketBaseTS<any, any>, idOrName: keyof BaseSchema) {
		super(client as unknown as PocketBase, idOrName)
	}

	override async getFullList<const TOptions extends _TListOptions>(
		options?: TOptions
	): Promise<Array<PBResponseType<TSchema, TRelations, TKey, TOptions>>> {
		const processedOption = processOptions(options)
		return super.getFullList(processedOption)
	}

	// @ts-ignore
	override async getList<const TOptions extends _TListOptions>(
		page = 1,
		perPage = 30,
		options?: TOptions
	): Promise<ListResult<PBResponseType<TSchema, TRelations, TKey, TOptions>>> {
		const processedOption = processOptions(options)
		return super.getList(page, perPage, processedOption)
	}

	// @ts-ignore
	override async getFirstListItem<const TOptions extends _TListOptions>(
		filter: string,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TRelations, TKey, TOptions>> {
		const processedOption = processOptions(options)
		return super.getFirstListItem(filter, processedOption)
	}

	// @ts-ignore
	override async getOne<const TOptions extends _TViewOptions>(
		id: string,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TRelations, TKey, TOptions>> {
		const processedOption = processOptions(options)
		return super.getOne(id, processedOption)
	}

	// @ts-ignore
	override async create<const TOptions extends _TViewOptions>(
		bodyParams?:
			| Partial<Omit<TSchema[TKey], 'created' | 'updated'>>
			| { [key: string]: any }
			| FormData,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TRelations, TKey, TOptions>> {
		const processedOption = processOptions(options)
		return super.create(bodyParams, processedOption)
	}

	// @ts-ignore
	override async update<const TOptions extends _TViewOptions>(
		id: string,
		bodyParams?:
			| Partial<Omit<TSchema[TKey], 'id' | 'created' | 'updated'>>
			| { [key: string]: any }
			| FormData,
		options?: TOptions
	): Promise<PBResponseType<TSchema, TRelations, TKey, TOptions>> {
		const processedOption = processOptions(options)
		return super.update(id, bodyParams, processedOption)
	}
}
