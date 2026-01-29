import { PocketBaseTS } from './index.js'
import { describe, expectTypeOf, it } from 'vitest'

import type { Options } from './options.js'
import type { MergeObjects } from './lib/type-utils.js'
import type { FilterHelpers } from './lib/filter-sort-helper/filter.js'
import type { PBResponseType } from './response.js'
import type { Comment, Post, TestSchema, User } from './schema.test-d.js'
import type {
	ListResult,
	RecordFullListOptions,
	RecordListOptions,
	RecordOptions,
} from 'pocketbase'

type PostListOption = Options<TestSchema, 'posts', 2, 'list'>
type Response<T extends PostListOption> = PBResponseType<TestSchema, 'posts', T, 2>

describe('PocketBaseTS', () => {
	const pb = new PocketBaseTS<TestSchema>()

	describe('collection', () => {
		it('is callable with a collection name', () => {
			expectTypeOf(pb.collection).toBeCallableWith('posts')
		})

		it('is callable with any string (collection id can be any string)', () => {
			expectTypeOf(pb.collection).toBeCallableWith('')
			expectTypeOf(pb.collection).toBeCallableWith('foo')
			expectTypeOf(pb.collection).toBeCallableWith('bar')
			expectTypeOf(pb.collection).toBeCallableWith('baz')
		})

		it('is not callable with non-string types', () => {
			// @ts-expect-error
			pb.collection(1)
			// @ts-expect-error
			pb.collection(true)
			// @ts-expect-error
			pb.collection({})
			// @ts-expect-error
			pb.collection([])
			// @ts-expect-error
			pb.collection(undefined)
			// @ts-expect-error
			pb.collection(null)
		})

		describe('subscribe', () => {
			it('lets you pass options like "headers"', () => {
				pb.collection('posts').subscribe('*', () => {}, { headers: { a: 'a' } })
			})

			it('types e.record as is if `fields` is not specified', () => {
				pb.collection('posts').subscribe('*', (e) => {
					expectTypeOf(e.record).toEqualTypeOf<Post>()
				})
			})

			describe('filter', () => {
				it('lets you pass any string as filter', () => {
					pb.collection('posts').subscribe('*', () => {}, {
						filter: 'foo',
					})
				})

				it('lets you use helper functions', () => {
					pb.collection('posts').subscribe('*', () => {}, {
						filter: (helpers) => {
							expectTypeOf(helpers).toEqualTypeOf<
								FilterHelpers<TestSchema, 'posts'>
							>()
							return ''
						},
					})
				})
			})

			describe('fields', () => {
				it('e.record has only specified fields', async () => {
					pb.collection('comments').subscribe(
						'*',
						(e) => {
							expectTypeOf(e.record).toEqualTypeOf<Pick<Comment, 'id' | 'message'>>()
						},
						{ fields: ['id', 'message'] }
					)
				})

				it('only accepts fields that actually exist', () => {
					pb.collection('comments').subscribe('*', () => {}, {
						fields: ['id', 'message'],
					})
					pb.collection('comments').subscribe('*', () => {}, {
						// @ts-expect-error
						fields: ['foo'],
					})
					pb.collection('comments').subscribe('*', () => {}, {
						// @ts-expect-error
						fields: ['foo:excerpt(10)'],
					})
				})

				it('lets you use modifiers like :excerpt and it does not affect types', () => {
					pb.collection('comments').subscribe(
						'*',
						(e) => {
							expectTypeOf(e.record).toEqualTypeOf<Pick<Comment, 'id' | 'message'>>()
						},
						{ fields: ['id', 'message:excerpt(10)'] }
					)
				})
			})
		})

		describe('getFullList', () => {
			it('lets you pass options like "headers"', () => {
				pb.collection('base').getFullList({ headers: { a: 'a' } })
			})

			it('is callable without options"', () => {
				pb.collection('posts').getFullList()
			})

			it('option is properly typed"', () => {
				const getFullList = pb.collection('posts').getFullList
				type Param = Parameters<typeof getFullList>[0]

				type PostFullListOption = MergeObjects<
					RecordFullListOptions,
					Options<TestSchema, 'posts', 2, 'list'>
				>

				expectTypeOf<Param>().toEqualTypeOf<PostFullListOption | undefined>()
			})

			it('response is properly typed"', async () => {
				const option = {
					fields: ['id', 'title'],
					expand: [{ key: 'author' }],
				} as const satisfies PostListOption

				const posts = await pb.collection('posts').getFullList(option)

				expectTypeOf(posts).toEqualTypeOf<Response<typeof option>[]>()
			})

			it('infers back relations', async () => {
				const users = await pb
					.collection('users')
					.getFullList({ expand: [{ key: 'posts_via_author' }] })
				expectTypeOf(users).branded.toEqualTypeOf<
					Array<User & { expand: { posts_via_author?: [Post, ...Post[]] } }>
				>()
			})

			it('lets you override back relations', async () => {
				type UserDetail = { user: string; age: number }
				type Schema2 = {
					users: {
						type: User
						relations: {
							userDetail_via_user: UserDetail
						}
					}
					userDetail: {
						type: UserDetail
						relations: {
							user: User
						}
					}
				}

				const pb2 = new PocketBaseTS<Schema2>()
				const users = await pb2
					.collection('users')
					.getFullList({ expand: [{ key: 'userDetail_via_user' }] })

				expectTypeOf(users).branded.toEqualTypeOf<
					Array<User & { expand: { userDetail_via_user: UserDetail } }>
				>()
			})
		})

		describe('getList', () => {
			it('lets you pass options like "headers"', () => {
				pb.collection('posts').getList(1, 10, { headers: { a: 'a' } })
			})

			it('is callable without options"', () => {
				pb.collection('posts').getList(1, 2)
			})

			it('option is properly typed"', () => {
				const getList = pb.collection('posts').getList
				type Param = Parameters<typeof getList>[2]

				type PostFullListOptions = MergeObjects<
					RecordListOptions,
					Options<TestSchema, 'posts', 2, 'list'>
				>

				expectTypeOf<Param>().toEqualTypeOf<PostFullListOptions>()
			})

			it('response is properly typed"', async () => {
				const option = {
					fields: ['id', 'title'],
					expand: [{ key: 'author' }],
				} as const satisfies PostListOption

				const posts = await pb.collection('posts').getList(1, 10, option)

				expectTypeOf(posts).toEqualTypeOf<ListResult<Response<typeof option>>>()
			})

			it('infers back relations', async () => {
				const users = await pb
					.collection('users')
					.getList(1, 10, { expand: [{ key: 'posts_via_author' }] })
				expectTypeOf(users.items).branded.toEqualTypeOf<
					Array<User & { expand: { posts_via_author?: [Post, ...Post[]] } }>
				>()
			})

			it('lets you override back relations', async () => {
				type UserDetail = { user: string; age: number }
				type Schema2 = {
					users: {
						type: User
						relations: {
							userDetail_via_user: UserDetail
						}
					}
					userDetail: {
						type: UserDetail
						relations: {
							user: User
						}
					}
				}

				const pb2 = new PocketBaseTS<Schema2>()
				const users = await pb2
					.collection('users')
					.getList(1, 10, { expand: [{ key: 'userDetail_via_user' }] })

				expectTypeOf(users.items).branded.toEqualTypeOf<
					Array<User & { expand: { userDetail_via_user: UserDetail } }>
				>()
			})
		})

		describe('getFirstListItem', () => {
			it('lets you pass options like "headers"', () => {
				pb.collection('base').getFirstListItem('', { headers: { a: 'a' } })
			})

			it('is callable without options"', () => {
				pb.collection('posts').getFirstListItem('')
			})

			it('option is properly typed"', () => {
				const getFirstListItem = pb.collection('posts').getFirstListItem
				type Param = Parameters<typeof getFirstListItem>[1]

				type PostListOptions = MergeObjects<
					RecordListOptions,
					Options<TestSchema, 'posts', 2, 'list'>
				>

				expectTypeOf<Param>().toEqualTypeOf<PostListOptions>()
			})

			it('response is properly typed"', async () => {
				const option = {
					fields: ['id', 'title'],
					expand: [{ key: 'author' }],
				} as const satisfies PostListOption

				const posts = await pb.collection('posts').getFirstListItem('', option)

				expectTypeOf(posts).toEqualTypeOf<Response<typeof option>>()
			})

			it('infers back relations', async () => {
				const user = await pb
					.collection('users')
					.getFirstListItem('', { expand: [{ key: 'posts_via_author' }] })
				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { posts_via_author?: [Post, ...Post[]] } }
				>()
			})

			it('lets you override back relations', async () => {
				type UserDetail = { user: string; age: number }
				type Schema2 = {
					users: {
						type: User
						relations: {
							userDetail_via_user: UserDetail
						}
					}
					userDetail: {
						type: UserDetail
						relations: {
							user: User
						}
					}
				}

				const pb2 = new PocketBaseTS<Schema2>()
				const user = await pb2
					.collection('users')
					.getFirstListItem('', { expand: [{ key: 'userDetail_via_user' }] })

				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { userDetail_via_user: UserDetail } }
				>()
			})
		})

		describe('getOne', () => {
			it('lets you pass options like "headers"', () => {
				expectTypeOf(pb.collection('base').getOne).toBeCallableWith('', {
					headers: { a: 'a' },
				})
			})

			it('is callable without options"', () => {
				pb.collection('posts').getOne('')
			})

			it('option is properly typed"', () => {
				const getOne = pb.collection('posts').getOne
				type Param = Parameters<typeof getOne>[1]

				type PostRecordOptions = MergeObjects<
					RecordOptions,
					Options<TestSchema, 'posts', 2, 'view'>
				>

				expectTypeOf<Param>().toEqualTypeOf<PostRecordOptions>()
			})

			it('response is properly typed"', async () => {
				const option = {
					fields: ['id', 'title'],
					expand: [{ key: 'author' }],
				} as const satisfies PostListOption

				const posts = await pb.collection('posts').getOne('', option)

				expectTypeOf(posts).toEqualTypeOf<Response<typeof option>>()
			})

			it('infers back relations', async () => {
				const user = await pb
					.collection('users')
					.getOne('', { expand: [{ key: 'posts_via_author' }] })

				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { posts_via_author?: [Post, ...Post[]] } }
				>()
			})

			it('lets you override back relations', async () => {
				type UserDetail = { user: string; age: number }
				type Schema2 = {
					users: {
						type: User
						relations: {
							userDetail_via_user: UserDetail
						}
					}
					userDetail: {
						type: UserDetail
						relations: {
							user: User
						}
					}
				}

				const pb2 = new PocketBaseTS<Schema2>()
				const user = await pb2
					.collection('users')
					.getOne('', { expand: [{ key: 'userDetail_via_user' }] })

				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { userDetail_via_user: UserDetail } }
				>()
			})
		})

		describe('create', () => {
			it('lets you pass options like "headers"', () => {
				pb.collection('base').create({}, { headers: { a: 'a' } })
			})

			it('is callable without options"', () => {
				pb.collection('posts').create({})
			})

			it('option is properly typed"', () => {
				const create = pb.collection('posts').create
				type Param = Parameters<typeof create>[1]

				type PostRecordOptions = MergeObjects<
					RecordOptions,
					Options<TestSchema, 'posts', 2, 'view'>
				>

				expectTypeOf<Param>().toEqualTypeOf<PostRecordOptions>()
			})

			it('response is properly typed"', async () => {
				const option = {
					fields: ['id', 'title'],
					expand: [{ key: 'author' }],
				} as const satisfies PostListOption

				const posts = await pb.collection('posts').create({}, option)

				expectTypeOf(posts).toEqualTypeOf<Response<typeof option>>()
			})

			it('infers back relations', async () => {
				const user = await pb
					.collection('users')
					.create({ name: 'test' }, { expand: [{ key: 'posts_via_author' }] })
				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { posts_via_author?: [Post, ...Post[]] } }
				>()
			})

			it('lets you override back relations', async () => {
				type UserDetail = { user: string; age: number }
				type Schema2 = {
					users: {
						type: User
						relations: {
							userDetail_via_user: UserDetail
						}
					}
					userDetail: {
						type: UserDetail
						relations: {
							user: User
						}
					}
				}

				const pb2 = new PocketBaseTS<Schema2>()
				const user = await pb2
					.collection('users')
					.create({ name: 'test' }, { expand: [{ key: 'userDetail_via_user' }] })

				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { userDetail_via_user: UserDetail } }
				>()
			})
		})

		describe('update', () => {
			it('lets you pass options like "headers"', () => {
				pb.collection('base').update('', {}, { headers: { a: 'a' } })
			})

			it('is callable without options"', () => {
				pb.collection('posts').update('', {})
			})

			it('option is properly typed"', () => {
				const update = pb.collection('posts').update
				type Param = Parameters<typeof update>[2]

				type PostRecordOptions = MergeObjects<
					RecordOptions,
					Options<TestSchema, 'posts', 2, 'view'>
				>

				expectTypeOf<Param>().toEqualTypeOf<PostRecordOptions>()
			})

			it('response is properly typed"', async () => {
				const option = {
					fields: ['id', 'title'],
					expand: [{ key: 'author' }],
				} as const satisfies PostListOption

				const posts = await pb.collection('posts').update('', {}, option)

				expectTypeOf(posts).toEqualTypeOf<Response<typeof option>>()
			})

			it('infers back relations', async () => {
				const user = await pb
					.collection('users')
					.update('', { name: 'test' }, { expand: [{ key: 'posts_via_author' }] })
				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { posts_via_author?: [Post, ...Post[]] } }
				>()
			})

			it('lets you override back relations', async () => {
				type UserDetail = { user: string; age: number }
				type Schema2 = {
					users: {
						type: User
						relations: {
							userDetail_via_user: UserDetail
						}
					}
					userDetail: {
						type: UserDetail
						relations: {
							user: User
						}
					}
				}

				const pb2 = new PocketBaseTS<Schema2>()
				const user = await pb2
					.collection('users')
					.update('', { name: 'test' }, { expand: [{ key: 'userDetail_via_user' }] })

				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { userDetail_via_user: UserDetail } }
				>()
			})
		})
	})
})
