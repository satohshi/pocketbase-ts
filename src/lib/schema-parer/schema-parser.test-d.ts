import { it, expectTypeOf } from 'vitest'
import type { SchemaParser } from './schema-parser.js'
import type { TestSchema } from '../../schema.test-d.js'

it('SchemaParser', () => {
	type RelationMap = SchemaParser<TestSchema>

	expectTypeOf<RelationMap['users']>().branded.toEqualTypeOf<{
		posts_via_author: {
			type: TestSchema['posts']['type']
			isOptional: true
			isToMany: true
			tableName: 'posts'
		}
		comments_via_user: {
			type: TestSchema['comments']['type']
			isOptional: true
			isToMany: true
			tableName: 'comments'
		}
		courseRegistrations_via_user: {
			type: TestSchema['courseRegistrations']['type']
			isOptional: true
			isToMany: true
			tableName: 'courseRegistrations'
		}
		pinnedPost: {
			type: TestSchema['posts']['type']
			isOptional: true
			isToMany: false
			tableName: 'posts'
		}
	}>()

	expectTypeOf<RelationMap['posts']>().branded.toEqualTypeOf<{
		comments_via_post: {
			type: TestSchema['comments']['type']
			isOptional: true
			isToMany: true
			tableName: 'comments'
		}
		author: {
			type: TestSchema['users']['type']
			isOptional: false
			isToMany: false
			tableName: 'users'
		}
		tags: {
			type: TestSchema['tags']['type']
			isOptional: false
			isToMany: true
			tableName: 'tags'
		}
		users_via_pinnedPost: {
			type: TestSchema['users']['type']
			isOptional: true
			isToMany: true
			tableName: 'users'
		}
	}>()

	expectTypeOf<RelationMap['tags']>().branded.toEqualTypeOf<{
		posts_via_tags: {
			type: TestSchema['posts']['type']
			isOptional: true
			isToMany: true
			tableName: 'posts'
		}
	}>()

	expectTypeOf<RelationMap['comments']>().branded.toEqualTypeOf<{
		post: {
			type: TestSchema['posts']['type']
			isOptional: false
			isToMany: false
			tableName: 'posts'
		}
		user: {
			type: TestSchema['users']['type']
			isOptional: false
			isToMany: false
			tableName: 'users'
		}
	}>()

	expectTypeOf<RelationMap['courseRegistrations']>().branded.toEqualTypeOf<{
		user: {
			type: TestSchema['users']['type']
			isOptional: false
			isToMany: false
			tableName: 'users'
		}
	}>()
})
