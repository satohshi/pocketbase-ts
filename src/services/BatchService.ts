import Client, { BatchService, SubBatchService } from 'pocketbase'
import type { SchemaDeclaration } from '../schema.js'

export class BatchServiceTS<TSchema extends SchemaDeclaration> extends BatchService {
	constructor(client: Client) {
		super(client)
	}

	override collection<TName extends (keyof TSchema & string) | (string & {})>(
		collectionIdOrName: TName
	): SubBatchService {
		return super.collection(collectionIdOrName)
	}
}
