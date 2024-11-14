export interface SchemaDeclaration {
	[collectionName: string]: {
		type: Record<string, any> // collection type
		relFields?: {
			[fieldName: string]: Record<string, any> // relation type
		}
	}
}
