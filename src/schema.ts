export interface SchemaDeclaration {
	[collectionName: string]: {
		type: Record<PropertyKey, any> // collection type
		relFields?: {
			[fieldName: string]: Record<PropertyKey, any> // relation type
		}
	}
}
