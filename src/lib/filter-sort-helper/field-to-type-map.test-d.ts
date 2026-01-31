import { describe, it, expectTypeOf } from 'vitest'
import type { TestSchema } from '../../schema.test-d.js'
import type { FieldsMapForFilter, GetFieldsMap, QuotedString } from './field-to-type-map.js'

type Result = FieldsMapForFilter<TestSchema, 'users', 2>

describe('users', () => {
	it('base', () => {
		expectTypeOf<Result['id']>().toEqualTypeOf<string>()
		expectTypeOf<Result['id:lower']>().toEqualTypeOf<Lowercase<QuotedString>>()
		expectTypeOf<Result['name:lower']>().toEqualTypeOf<Lowercase<QuotedString>>()
		expectTypeOf<Result['name']>().toEqualTypeOf<string>()
		expectTypeOf<Result['age']>().toEqualTypeOf<number>()
		expectTypeOf<Result['verified']>().toEqualTypeOf<boolean>()
	})

	it("no modifiers where they don't make sense", () => {
		expectTypeOf<Result>().not.toHaveProperty('id:each')
		expectTypeOf<Result>().not.toHaveProperty('id:length')

		expectTypeOf<Result>().not.toHaveProperty('name:each')
		expectTypeOf<Result>().not.toHaveProperty('name:length')

		expectTypeOf<Result>().not.toHaveProperty('age:lower')
		expectTypeOf<Result>().not.toHaveProperty('age:each')
		expectTypeOf<Result>().not.toHaveProperty('age:length')

		expectTypeOf<Result>().not.toHaveProperty('verified:lower')
		expectTypeOf<Result>().not.toHaveProperty('verified:each')
		expectTypeOf<Result>().not.toHaveProperty('verified:length')
	})

	it('relations (depth=1)', () => {
		expectTypeOf<Result['comments_via_user.id']>().toEqualTypeOf<string[]>()
		expectTypeOf<Result['comments_via_user.id:lower']>().toEqualTypeOf<
			Lowercase<QuotedString>[]
		>()
		expectTypeOf<Result>().not.toHaveProperty('posts_via_author.tags')
		expectTypeOf<Result['posts_via_author.tags:each']>().toEqualTypeOf<string>()
	})
})

describe('posts', () => {
	type Result = GetFieldsMap<TestSchema, 'posts', 1, 'filter'>

	it('base', () => {
		expectTypeOf<Result['id']>().toEqualTypeOf<string>()
		expectTypeOf<Result['id:lower']>().toEqualTypeOf<Lowercase<QuotedString>>()
		expectTypeOf<Result['author']>().toEqualTypeOf<string>()
		expectTypeOf<Result['author:lower']>().toEqualTypeOf<Lowercase<QuotedString>>()
		expectTypeOf<Result['title']>().toEqualTypeOf<string>()
		expectTypeOf<Result['title:lower']>().toEqualTypeOf<Lowercase<QuotedString>>()
		expectTypeOf<Result['likes']>().toEqualTypeOf<number>()
		expectTypeOf<Result['tags:each']>().toEqualTypeOf<string>()
		expectTypeOf<Result['tags:length']>().toEqualTypeOf<number>()
		expectTypeOf<Result['published']>().toEqualTypeOf<boolean>()
		expectTypeOf<Result['createdAt']>().toEqualTypeOf<string>()
	})

	it('array fields are excluded', () => {
		expectTypeOf<Result>().not.toHaveProperty('tags')
	})

	it('relations (depth=1)', () => {
		expectTypeOf<Result['comments_via_post.id']>().toEqualTypeOf<string[]>()
		expectTypeOf<Result['comments_via_post.id:lower']>().toEqualTypeOf<
			Lowercase<QuotedString>[]
		>()
		expectTypeOf<Result['comments_via_post.likes']>().toEqualTypeOf<number[]>()
		expectTypeOf<Result['comments_via_post.message']>().toEqualTypeOf<string[]>()
		expectTypeOf<Result['comments_via_post.message:lower']>().toEqualTypeOf<
			Lowercase<QuotedString>[]
		>()
		expectTypeOf<Result['comments_via_post.post']>().toEqualTypeOf<string[]>()
		expectTypeOf<Result['comments_via_post.post:lower']>().toEqualTypeOf<
			Lowercase<QuotedString>[]
		>()
		expectTypeOf<Result['comments_via_post.user']>().toEqualTypeOf<string[]>()
		expectTypeOf<Result['comments_via_post.user:lower']>().toEqualTypeOf<
			Lowercase<QuotedString>[]
		>()
	})

	it("no modifiers where they don't make sense", () => {
		expectTypeOf<Result>().not.toHaveProperty('id:each')
		expectTypeOf<Result>().not.toHaveProperty('id:length')

		expectTypeOf<Result>().not.toHaveProperty('author:each')
		expectTypeOf<Result>().not.toHaveProperty('author:length')

		expectTypeOf<Result>().not.toHaveProperty('title:each')
		expectTypeOf<Result>().not.toHaveProperty('title:length')

		expectTypeOf<Result>().not.toHaveProperty('likes:lower')
		expectTypeOf<Result>().not.toHaveProperty('likes:each')
		expectTypeOf<Result>().not.toHaveProperty('likes:length')

		expectTypeOf<Result>().not.toHaveProperty('published:lower')
		expectTypeOf<Result>().not.toHaveProperty('published:each')
		expectTypeOf<Result>().not.toHaveProperty('published:length')

		expectTypeOf<Result>().not.toHaveProperty('tags:lower')
	})
})
