import { PocketBaseTS } from './index.js'
import { describe, it, vi, afterEach, beforeAll, afterAll } from 'vitest'
import type { Mock } from 'vitest'
import type { Options } from './options.js'
import type { TestSchema } from './schema.test-d.js'
import type { FilterHelpers } from './lib/filter-sort-helper/filter.js'

type MethodNames<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

describe('PocketBaseTS', () => {
	const pb = new PocketBaseTS<TestSchema>()
	const posts = pb.collection('posts')

	beforeAll(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: async () => {
					return { items: [''] }
				},
			})
		)
	})

	afterAll(() => {
		vi.unstubAllGlobals()
	})

	function getResultingString(
		key: 'fields' | 'filter' | 'expand' | 'page' | 'perPage' | 'sort' | 'skipTotal'
	): string | null {
		const regex = new RegExp(`${key}=(.+?)(&|$)`)

		const url = (global.fetch as Mock).mock.lastCall![0] as string
		const match = url.match(regex)
		if (!match) {
			return null
		}

		const str = url.match(regex)![1]!
		return decodeURIComponent(str)
	}

	function defineTestCases<T extends ReadonlyArray<MethodNames<typeof posts>>>(cases: {
		[I in keyof T]: {
			method: T[I]
			getOptionArg: (
				options: Options<TestSchema, 'posts', 2, 'list'>
			) => Parameters<(typeof posts)[T[I]]>
			getFilterArg?: (
				filter?: string | ((filter: FilterHelpers<TestSchema, 'posts'>) => string)
			) => Parameters<(typeof posts)[T[I]]>
		}
	}) {
		return cases
	}

	const testCases = defineTestCases([
		{
			method: 'getFullList',
			getOptionArg: (options) => [options],
			getFilterArg: (filter) => [filter ? { filter } : {}],
		},
		{
			method: 'getList',
			getOptionArg: (options) => [1, 1, options],
			getFilterArg: (filter) => [1, 1, filter ? { filter } : {}],
		},
		{
			method: 'getFirstListItem',
			getOptionArg: (options) => ['', options],
			getFilterArg: (filter) => [filter!, {}],
		},
		{ method: 'getOne', getOptionArg: (options) => ['foo', options] },
		{ method: 'create', getOptionArg: (options) => [{}, options] },
		{ method: 'update', getOptionArg: (options) => ['foo', {}, options] },
	])

	describe.for(testCases)('$method', ({ method: methodName, getOptionArg, getFilterArg }) => {
		const method = posts[methodName].bind(posts) as (
			...args: ReturnType<typeof getOptionArg>
		) => Promise<any>

		describe('fields and expand', () => {
			it('fields', async ({ expect }) => {
				await method(
					...getOptionArg({
						fields: ['id', 'title'],
					})
				)

				const fields = getResultingString('fields')
				expect(fields).toBe('id,title')

				const expand = getResultingString('expand')
				expect(expand).toBe(null)
			})

			it('expand', async ({ expect }) => {
				await method(
					...getOptionArg({
						expand: [
							{
								key: 'author',
								expand: [{ key: 'posts_via_author' }],
							},
							{ key: 'comments_via_post' },
						],
					})
				)

				const fields = getResultingString('fields')
				expect(fields).toBe(null)

				const expand = getResultingString('expand')
				expect(expand).toBe('author.posts_via_author,comments_via_post')
			})

			it('both fields and expand', async ({ expect }) => {
				await method(
					...getOptionArg({
						fields: ['id', 'title'],
						expand: [
							{
								key: 'author',
								expand: [{ key: 'posts_via_author', fields: ['id', 'title'] }],
							},
							{ key: 'comments_via_post', fields: ['likes', 'message'] },
						],
					})
				)

				const fields = getResultingString('fields')
				expect(fields).toBe(
					'id,title,expand.author.*,expand.author.expand.posts_via_author.id,expand.author.expand.posts_via_author.title,expand.comments_via_post.likes,expand.comments_via_post.message'
				)

				const expand = getResultingString('expand')
				expect(expand).toBe('author.posts_via_author,comments_via_post')
			})
		})

		if (!getFilterArg) {
			return
		}

		describe('sort', () => {
			it('no sort', async ({ expect }) => {
				await method(...getOptionArg({}))

				const filterStr = getResultingString('sort')
				expect(filterStr).toBe(null)
			})

			it('plain string', async ({ expect }) => {
				await method(...getOptionArg({ sort: 'id' }))

				const filterStr = getResultingString('sort')
				expect(filterStr).toBe('id')
			})

			it('$', async ({ expect }) => {
				await method(...getOptionArg({ sort: ({ $ }) => $`${'author.name'},${'title'}` }))

				const filterStr = getResultingString('sort')
				expect(filterStr).toBe('author.name,title')
			})

			it('sortBy', async ({ expect }) => {
				await method(
					...getOptionArg({ sort: ({ sortBy }) => sortBy('author.name', '-title') })
				)

				const filterStr = getResultingString('sort')
				expect(filterStr).toBe('author.name,-title')
			})
		})

		describe('filter', () => {
			if (methodName !== 'getFirstListItem') {
				it('no filter', async ({ expect }) => {
					await method(...getFilterArg())

					const filterStr = getResultingString('filter')
					expect(filterStr).toBe(null)
				})
			}

			it('plain string', async ({ expect }) => {
				await method(...getFilterArg('title="foo"'))

				const filterStr = getResultingString('filter')
				expect(filterStr).toBe('title="foo"')
			})

			it('$', async ({ expect }) => {
				await method(...getFilterArg(({ $ }) => $`${'title'}="foo"`))

				const filterStr = getResultingString('filter')
				expect(filterStr).toBe('title="foo"')
			})

			it('and', async ({ expect }) => {
				await method(...getFilterArg(({ and }) => and('a=1', 'b=1')))

				const res = getResultingString('filter')
				expect(res).toBe('(a=1&&b=1)')
			})

			it('or', async ({ expect }) => {
				await method(...getFilterArg(({ or }) => or('a=1', 'b=1')))

				const res = getResultingString('filter')
				expect(res).toBe('(a=1||b=1)')
			})

			it('eq', async ({ expect }) => {
				await method(...getFilterArg(({ eq }) => eq('title', '"foo"')))

				const res = getResultingString('filter')
				expect(res).toBe('title="foo"')
			})

			it('ne', async ({ expect }) => {
				await method(...getFilterArg(({ ne }) => ne('title', '"foo"')))

				const res = getResultingString('filter')
				expect(res).toBe('title!="foo"')
			})

			it('gt', async ({ expect }) => {
				await method(...getFilterArg(({ gt }) => gt('likes', 3))).catch(() => {})

				const res = getResultingString('filter')
				expect(res).toBe('likes>3')
			})

			it('gte', async ({ expect }) => {
				await method(...getFilterArg(({ gte }) => gte('likes', 3)))

				const res = getResultingString('filter')
				expect(res).toBe('likes>=3')
			})

			it('lt', async ({ expect }) => {
				await method(...getFilterArg(({ lt }) => lt('likes', 3))).catch(() => {})

				const res = getResultingString('filter')
				expect(res).toBe('likes<3')
			})

			it('lte', async ({ expect }) => {
				await method(...getFilterArg(({ lte }) => lte('likes', 3)))

				const res = getResultingString('filter')
				expect(res).toBe('likes<=3')
			})

			it('like', async ({ expect }) => {
				await method(...getFilterArg(({ like }) => like('title', '"foo"')))

				const res = getResultingString('filter')
				expect(res).toBe('title~"foo"')
			})

			it('notLike', async ({ expect }) => {
				await method(...getFilterArg(({ notLike }) => notLike('title', '"foo"')))

				const res = getResultingString('filter')
				expect(res).toBe('title!~"foo"')
			})

			it('anyEq', async ({ expect }) => {
				await method(...getFilterArg(({ anyEq }) => anyEq('tags.name', '"foo"')))

				const res = getResultingString('filter')
				expect(res).toBe('tags.name?="foo"')
			})

			it('anyNe', async ({ expect }) => {
				await method(...getFilterArg(({ anyNe }) => anyNe('tags.name', '"foo"')))

				const res = getResultingString('filter')
				expect(res).toBe('tags.name?!="foo"')
			})

			it('anyGt', async ({ expect }) => {
				await method(...getFilterArg(({ anyGt }) => anyGt('comments_via_post.likes', 3)))

				const res = getResultingString('filter')
				expect(res).toBe('comments_via_post.likes?>3')
			})

			it('anyGte', async ({ expect }) => {
				await method(...getFilterArg(({ anyGte }) => anyGte('comments_via_post.likes', 3)))

				const res = getResultingString('filter')
				expect(res).toBe('comments_via_post.likes?>=3')
			})

			it('anyLt', async ({ expect }) => {
				await method(...getFilterArg(({ anyLt }) => anyLt('comments_via_post.likes', 3)))

				const res = getResultingString('filter')
				expect(res).toBe('comments_via_post.likes?<3')
			})

			it('anyLte', async ({ expect }) => {
				await method(...getFilterArg(({ anyLte }) => anyLte('comments_via_post.likes', 3)))

				const res = getResultingString('filter')
				expect(res).toBe('comments_via_post.likes?<=3')
			})

			it('anyLike', async ({ expect }) => {
				await method(
					...getFilterArg(({ anyLike }) => anyLike('comments_via_post.message', '"foo"'))
				)

				const res = getResultingString('filter')
				expect(res).toBe('comments_via_post.message?~"foo"')
			})

			it('anyNotLike', async ({ expect }) => {
				await method(
					...getFilterArg(({ anyNotLike }) =>
						anyNotLike('comments_via_post.message', '"foo"')
					)
				)

				const res = getResultingString('filter')
				expect(res).toBe('comments_via_post.message?!~"foo"')
			})

			it('between', async ({ expect }) => {
				await method(...getFilterArg(({ between }) => between('likes', 5, 10)))

				const res = getResultingString('filter')
				expect(res).toBe('(likes>=5&&likes<=10)')
			})

			it('notBetween', async ({ expect }) => {
				await method(...getFilterArg(({ notBetween }) => notBetween('likes', 5, 10)))

				const res = getResultingString('filter')
				expect(res).toBe('(likes<5||likes>10)')
			})

			it('inArray', async ({ expect }) => {
				await method(
					...getFilterArg(({ inArray }) => inArray('title', ['"foo"', '"bar"', '"baz"']))
				)

				const res = getResultingString('filter')
				expect(res).toBe('(title="foo"||title="bar"||title="baz")')
			})

			it('notInArray', async ({ expect }) => {
				await method(
					...getFilterArg(({ notInArray }) =>
						notInArray('title', ['"foo"', '"bar"', '"baz"'])
					)
				)

				const res = getResultingString('filter')
				expect(res).toBe('(title!="foo"&&title!="bar"&&title!="baz")')
			})
		})
	})

	describe('subscribe', () => {
		beforeAll(() => {
			vi.stubGlobal(
				'EventSource',
				class EventSourceMock {
					url: string
					listeners = new Map<string, ((e: MessageEvent) => void)[]>()

					constructor(url: string) {
						this.url = url
					}

					addEventListener(type: string, cb: (e: MessageEvent) => void) {
						const arr = this.listeners.get(type) ?? []
						arr.push(cb)
						this.listeners.set(type, arr)

						this.emit(type, new MessageEvent(type, { lastEventId: 'foo' }))
					}

					removeEventListener(type: string, cb: (e: MessageEvent) => void) {
						const arr = this.listeners.get(type) ?? []
						this.listeners.set(
							type,
							arr.filter((x) => x !== cb)
						)
					}

					emit(type: string, event: MessageEvent) {
						this.listeners.get(type)?.forEach((cb) => cb(event))
					}

					close() {
						this.listeners.clear()
					}
				}
			)
		})

		afterAll(() => {
			vi.unstubAllGlobals()
		})

		afterEach(async () => {
			await posts.unsubscribe()
		})

		function getOptions(): { filter?: string; expand?: string; fields?: string } {
			const body = JSON.parse((global.fetch as Mock).mock.lastCall![1].body)
			const subscription = body.subscriptions[0]

			const decoded = decodeURIComponent(subscription)
			const options = JSON.parse(decoded.match(/options=(.+)$/)![1]!)

			return options.query
		}

		describe('fields and expand', () => {
			it('fields', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					fields: ['id', 'title'],
				})

				const { fields, expand } = getOptions()

				expect(fields).toBe('id,title')
				expect(expand).toBe(undefined)
			})

			it('expand', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					expand: [
						{
							key: 'author',
							expand: [{ key: 'posts_via_author' }],
						},
						{ key: 'comments_via_post' },
					],
				})

				const { fields, expand } = getOptions()

				expect(fields).toBe(undefined)
				expect(expand).toBe('author.posts_via_author,comments_via_post')
			})

			it('both expand and fields', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					fields: ['id', 'title'],
					expand: [
						{
							key: 'author',
							expand: [{ key: 'posts_via_author', fields: ['id', 'title'] }],
						},
						{ key: 'comments_via_post', fields: ['likes', 'message'] },
					],
				})

				const { fields, expand } = getOptions()

				expect(fields).toBe(
					'id,title,expand.author.*,expand.author.expand.posts_via_author.id,expand.author.expand.posts_via_author.title,expand.comments_via_post.likes,expand.comments_via_post.message'
				)
				expect(expand).toBe('author.posts_via_author,comments_via_post')
			})
		})

		describe('filter', () => {
			it('no filter', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {})

				const { filter } = getOptions()
				expect(filter).toBe(undefined)
			})

			it('plain string', async ({ expect }) => {
				await posts.subscribe('*', () => {}, { filter: 'title="foo"' })

				const { filter } = getOptions()
				expect(filter).toBe('title="foo"')
			})

			it('$', async ({ expect }) => {
				await posts.subscribe('*', () => {}, { filter: ({ $ }) => $`${'title'}="foo"` })

				const { filter } = getOptions()
				expect(filter).toBe('title="foo"')
			})

			it('and', async ({ expect }) => {
				await posts.subscribe('*', () => {}, { filter: ({ and }) => and('a=1', 'b=1') })

				const { filter } = getOptions()
				expect(filter).toBe('(a=1&&b=1)')
			})

			it('or', async ({ expect }) => {
				await posts.subscribe('*', () => {}, { filter: ({ or }) => or('a=1', 'b=1') })

				const { filter } = getOptions()
				expect(filter).toBe('(a=1||b=1)')
			})

			it('eq', async ({ expect }) => {
				await posts.subscribe('*', () => {}, { filter: ({ eq }) => eq('title', '"foo"') })

				const { filter } = getOptions()
				expect(filter).toBe('title="foo"')
			})

			it('ne', async ({ expect }) => {
				await posts.subscribe('*', () => {}, { filter: ({ ne }) => ne('title', '"foo"') })

				const { filter } = getOptions()
				expect(filter).toBe('title!="foo"')
			})

			it('gt', async ({ expect }) => {
				await posts.subscribe('*', () => {}, { filter: ({ gt }) => gt('likes', 3) })

				const { filter } = getOptions()
				expect(filter).toBe('likes>3')
			})

			it('gte', async ({ expect }) => {
				await posts.subscribe('*', () => {}, { filter: ({ gte }) => gte('likes', 3) })

				const { filter } = getOptions()
				expect(filter).toBe('likes>=3')
			})

			it('lt', async ({ expect }) => {
				await posts.subscribe('*', () => {}, { filter: ({ lt }) => lt('likes', 3) })

				const { filter } = getOptions()
				expect(filter).toBe('likes<3')
			})

			it('lte', async ({ expect }) => {
				await posts.subscribe('*', () => {}, { filter: ({ lte }) => lte('likes', 3) })

				const { filter } = getOptions()
				expect(filter).toBe('likes<=3')
			})

			it('like', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ like }) => like('title', '"foo"'),
				})

				const { filter } = getOptions()
				expect(filter).toBe('title~"foo"')
			})

			it('notLike', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ notLike }) => notLike('title', '"foo"'),
				})

				const { filter } = getOptions()
				expect(filter).toBe('title!~"foo"')
			})

			it('anyEq', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ anyEq }) => anyEq('tags.name', '"foo"'),
				})

				const { filter } = getOptions()
				expect(filter).toBe('tags.name?="foo"')
			})

			it('anyNe', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ anyNe }) => anyNe('tags.name', '"foo"'),
				})

				const { filter } = getOptions()
				expect(filter).toBe('tags.name?!="foo"')
			})

			it('anyGt', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ anyGt }) => anyGt('comments_via_post.likes', 3),
				})

				const { filter } = getOptions()
				expect(filter).toBe('comments_via_post.likes?>3')
			})

			it('anyGte', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ anyGte }) => anyGte('comments_via_post.likes', 3),
				})

				const { filter } = getOptions()
				expect(filter).toBe('comments_via_post.likes?>=3')
			})

			it('anyLt', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ anyLt }) => anyLt('comments_via_post.likes', 3),
				})

				const { filter } = getOptions()
				expect(filter).toBe('comments_via_post.likes?<3')
			})

			it('anyLte', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ anyLte }) => anyLte('comments_via_post.likes', 3),
				})

				const { filter } = getOptions()
				expect(filter).toBe('comments_via_post.likes?<=3')
			})

			it('anyLike', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ anyLike }) => anyLike('comments_via_post.message', '"foo"'),
				})

				const { filter } = getOptions()
				expect(filter).toBe('comments_via_post.message?~"foo"')
			})

			it('anyNotLike', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ anyNotLike }) => anyNotLike('comments_via_post.message', '"foo"'),
				})

				const { filter } = getOptions()
				expect(filter).toBe('comments_via_post.message?!~"foo"')
			})

			it('between', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ between }) => between('likes', 5, 10),
				})

				const { filter } = getOptions()
				expect(filter).toBe('(likes>=5&&likes<=10)')
			})

			it('notBetween', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ notBetween }) => notBetween('likes', 5, 10),
				})

				const { filter } = getOptions()
				expect(filter).toBe('(likes<5||likes>10)')
			})

			it('inArray', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ inArray }) => inArray('title', ['"foo"', '"bar"', '"baz"']),
				})

				const { filter } = getOptions()
				expect(filter).toBe('(title="foo"||title="bar"||title="baz")')
			})

			it('notInArray', async ({ expect }) => {
				await posts.subscribe('*', () => {}, {
					filter: ({ notInArray }) => notInArray('title', ['"foo"', '"bar"', '"baz"']),
				})

				const { filter } = getOptions()
				expect(filter).toBe('(title!="foo"&&title!="bar"&&title!="baz")')
			})
		})
	})
})
