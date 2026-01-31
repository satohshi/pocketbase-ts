import { describe, expectTypeOf, it } from 'vitest'
import type { SortBy } from './lib/filter-sort-helper/sort.js'
import type { Options } from './options.js'
import type { TestSchema } from './schema.test-d.js'
import type { FilterHelpers } from './lib/filter-sort-helper/filter.js'

describe('list', () => {
	type PostOption = Options<TestSchema, 'posts', 2, 'list'>

	describe('top level', () => {
		describe('filter', () => {
			it('lets you pass any string', () => {
				;({ filter: 'foo' }) satisfies PostOption
			})

			it('lets you use helper functions', () => {
				expectTypeOf<(helpers: FilterHelpers<TestSchema, 'posts'>) => string>().toExtend<
					PostOption['filter']
				>()
			})

			it('errors if filter function returns anything but string', () => {
				;({ filter: () => '' }) satisfies PostOption

				// @ts-expect-error
				;({ filter: () => 1 }) satisfies PostOption
				// @ts-expect-error
				;({ filter: () => true }) satisfies PostOption
				// @ts-expect-error
				;({ filter: () => null }) satisfies PostOption
				// @ts-expect-error
				;({ filter: () => undefined }) satisfies PostOption
				// @ts-expect-error
				;({ filter: () => ({}) }) satisfies PostOption
				// @ts-expect-error
				;({ filter: () => [] }) satisfies PostOption
				// @ts-expect-error
				;({ filter: () => new Date() }) satisfies PostOption
			})
		})

		describe('sort', () => {
			it('lets you pass any string', () => {
				;({ sort: 'foo' }) satisfies PostOption
			})

			it('lets you use sort helper function', () => {
				expectTypeOf<
					(helpers: {
						$: FilterHelpers<TestSchema, 'posts', 2>['$']
						sortBy: SortBy<TestSchema, 'posts', 2>
					}) => string
				>().toExtend<PostOption['sort']>()
			})

			it('errors if sort function returns anything but string', () => {
				;({ sort: () => '' }) satisfies PostOption

				// @ts-expect-error
				;({ sort: () => 1 }) satisfies PostOption
				// @ts-expect-error
				;({ sort: () => true }) satisfies PostOption
				// @ts-expect-error
				;({ sort: () => null }) satisfies PostOption
				// @ts-expect-error
				;({ sort: () => undefined }) satisfies PostOption
				// @ts-expect-error
				;({ sort: () => ({}) }) satisfies PostOption
				// @ts-expect-error
				;({ sort: () => [] }) satisfies PostOption
				// @ts-expect-error
				;({ sort: () => new Date() }) satisfies PostOption
			})
		})

		describe('fields', () => {
			it('accepts field names', () => {
				;({ fields: ['id', 'likes', 'title'] }) satisfies PostOption
			})

			it('rejects strings that are not field names', () => {
				;({
					// @ts-expect-error
					fields: ['foo'],
				}) satisfies PostOption
				;({
					// @ts-expect-error
					fields: ['foo:excerpt(10)'],
				}) satisfies PostOption
			})

			it('accepts modifiers like :excerpt', () => {
				;({ fields: ['title:excerpt(10)'] }) satisfies PostOption
			})
		})

		describe('expand', () => {
			it('accepts a single related relation', () => {
				;({ expand: [{ key: 'author' }] }) satisfies PostOption
			})

			it('accepts multiple related relations', () => {
				;({
					expand: [{ key: 'author' }, { key: 'tags' }, { key: 'comments_via_post' }],
				}) satisfies PostOption
			})

			it('rejects random string as key', () => {
				// @ts-expect-error
				;({ expand: [{ key: 'foo' }] }) satisfies PostOption
			})

			it('rejects unrelated collection names', () => {
				// @ts-expect-error
				;({ expand: [{ key: 'pinnedPost' }] }) satisfies PostOption
				;({
					// @ts-expect-error
					expand: [{ key: 'pinnedPost' }, { key: 'tags' }, { key: 'comments_via_post' }],
				}) satisfies PostOption
			})
		})
	})

	describe('in expand', () => {
		describe('fields', () => {
			it('accepts field names', () => {
				;({
					expand: [{ key: 'author', fields: ['id', 'age'] }],
				}) satisfies PostOption
			})

			it('rejects strings that are not field names', () => {
				;({
					expand: [
						{
							key: 'author',
							// @ts-expect-error
							fields: ['foo'],
						},
					],
				}) satisfies PostOption
				;({
					expand: [
						{
							key: 'author',
							// @ts-expect-error
							fields: ['foo:excerpt(10)'],
						},
					],
				}) satisfies PostOption
			})
		})

		describe('expand', () => {
			it('accepts a single related relation', () => {
				;({
					expand: [{ key: 'author', expand: [{ key: 'comments_via_user' }] }],
				}) satisfies PostOption
			})

			it('accepts multiple related relations', () => {
				;({
					expand: [
						{
							key: 'author',
							expand: [
								{ key: 'comments_via_user' },
								{ key: 'pinnedPost' },
								{ key: 'posts_via_author' },
							],
						},
					],
				}) satisfies PostOption
			})

			it('rejects random string as key', () => {
				;({
					expand: [
						{
							key: 'author',
							expand: [
								{
									// @ts-expect-error
									key: 'foo',
								},
							],
						},
					],
				}) satisfies PostOption
			})

			it('rejects unrelated collection names', () => {
				;({
					expand: [
						{
							key: 'author',
							expand: [
								{
									// @ts-expect-error
									key: 'tags',
								},
							],
						},
					],
				}) satisfies PostOption
			})
		})
	})
})
