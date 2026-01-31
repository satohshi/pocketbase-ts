import { describe, it } from 'vitest'
import type { SortBy } from './sort.js'
import type { TestSchema } from '../../schema.test-d.js'

declare const sortBy: SortBy<TestSchema, 'posts', 2>

describe('sort helper', () => {
	it('errors when no arg is passed', () => {
		// @ts-expect-error
		sortBy()
	})

	it('errors when same field is used more than once', () => {
		// @ts-expect-error
		sortBy('id', 'id')
		// @ts-expect-error
		sortBy('id', '-id')
		// @ts-expect-error
		sortBy('-id', '-id')
		// @ts-expect-error
		sortBy('-id', 'id')
	})

	it('one field', () => {
		sortBy('id')
	})

	it('two fields', () => {
		sortBy('id', 'author')
	})

	it('three fields', () => {
		sortBy('id', 'author', 'title')
	})

	it('desc', () => {
		sortBy('-id')
	})

	it('rejects generic strings', () => {
		// @ts-expect-error
		sortBy('foo')
		// @ts-expect-error
		sortBy('foo', 'bar')
	})

	it('rejects @collection', () => {
		// @ts-expect-error
		sortBy('@collection.comments.likes')
	})

	it('supports "-" prefix for desc', () => {
		sortBy('-title')
	})

	it('supports :lower', () => {
		sortBy('title:lower')
	})

	it('supports array fields without modifier', () => {
		sortBy('tags')
	})

	it('supports :length', () => {
		sortBy('tags:length')
	})

	it('rejects :each', () => {
		// @ts-expect-error
		sortBy('tags:each')
	})

	it('relations depth=1', () => {
		sortBy('author.age')
	})

	it('relations depth=2', () => {
		sortBy('comments_via_post.user.age')
	})
})
