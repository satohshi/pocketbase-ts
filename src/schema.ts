export interface SchemaDeclaration {
	[collectionName: string]: {
		type: Record<PropertyKey, any> // collection type
		relations?: {
			[fieldName: string]: Record<PropertyKey, any> // relation type
		}
	}
}
