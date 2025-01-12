import PocketBase from 'pocketbase'
import { BatchServiceTS } from './services/BatchService.js'
import { RecordServiceTS } from './services/RecordService.js'
import type { BaseAuthStore } from 'pocketbase'
export type { UniqueCollection } from './helpers/type-utils.js'
import type { SchemaDeclaration } from './schema.js'

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

	override createBatch(): BatchServiceTS<TSchema> {
		return new BatchServiceTS<TSchema>(this)
	}
}
