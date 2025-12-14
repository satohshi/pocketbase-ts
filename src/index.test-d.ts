import { PocketBaseTS } from './index.js'
import { describe, expectTypeOf, it } from 'vitest'
import type { UniqueCollection } from './index.js'

interface PocketBaseCollection {
	id: string
}

type User = UniqueCollection<{ name: string } & PocketBaseCollection, 'users'>

interface Post extends PocketBaseCollection {
	author: string
	title: string
	tags: string[]
}

interface Tag extends PocketBaseCollection {
	name: string
}

interface Comment extends PocketBaseCollection {
	post: string
	user: string
	message: string
}

interface Base extends PocketBaseCollection {
	toOneRequired1: string
	toOneRequired2: string
	toOneOptional1?: string
	toOneOptional2?: string
	toManyRequired2: string[]
	toManyRequired1: string[]
	toManyOptional1?: string[]
	toManyOptional2?: string[]
}

type ToOneRequired = UniqueCollection<Base & PocketBaseCollection, 'ToOneRequired'>
type ToOneOptional = UniqueCollection<Base & PocketBaseCollection, 'ToOneOptional'>
type ToManyRequired = UniqueCollection<Base & PocketBaseCollection, 'ToManyRequired'>
type ToManyOptional = UniqueCollection<Base & PocketBaseCollection, 'ToManyOptional'>

type Schema = {
	users: { type: User }
	posts: {
		type: Post
		relations: {
			author: User
			tags?: Tag[]
			toOneRequired1: ToOneRequired
			toOneRequired2: ToOneRequired
			toOneOptional1?: ToOneOptional
			toOneOptional2?: ToOneOptional
			toManyRequired1: ToManyRequired[]
			toManyRequired2: ToManyRequired[]
			toManyOptional1?: ToManyOptional[]
			toManyOptional2?: ToManyOptional[]
		}
	}
	tags: {
		type: Tag
	}
	comments: {
		type: Comment
		relations: {
			post: Post
			user: User
		}
	}

	base: {
		type: Base
		relations: {
			toOneRequired1: ToOneRequired
			toOneRequired2: ToOneRequired
			toOneOptional1?: ToOneOptional
			toOneOptional2?: ToOneOptional
			toManyRequired1: ToManyRequired[]
			toManyRequired2: ToManyRequired[]
			toManyOptional1?: ToManyOptional[]
			toManyOptional2?: ToManyOptional[]
		}
	}
	toOneRequired: {
		type: ToOneRequired
		relations: {
			toOneRequired1: ToOneRequired
			toOneRequired2: ToOneRequired
			toOneOptional1?: ToOneOptional
			toOneOptional2?: ToOneOptional
			toManyRequired1: ToManyRequired[]
			toManyRequired2: ToManyRequired[]
			toManyOptional1?: ToManyOptional[]
			toManyOptional2?: ToManyOptional[]
		}
	}
	toOneOptional: {
		type: ToOneOptional
	}
	toManyRequired: {
		type: ToManyRequired
		relations: {
			toOneRequired1: ToOneRequired
			toOneRequired2: ToOneRequired
			toOneOptional1?: ToOneOptional
			toOneOptional2?: ToOneOptional
			toManyRequired1: ToManyRequired[]
			toManyRequired2: ToManyRequired[]
			toManyOptional1?: ToManyOptional[]
			toManyOptional2?: ToManyOptional[]
		}
	}
	toManyOptional: {
		type: ToManyOptional
	}
}

describe('PocketBaseTS', () => {
	const pb = new PocketBaseTS<Schema>()

	describe('collection', () => {
		it('is callable with a collection name', () => {
			expectTypeOf(pb.collection).toBeCallableWith('base')
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
				pb.collection('comments').subscribe('*', () => {}, { headers: { a: 'a' } })
			})

			it('types e.record as is if `fields` is not specified', () => {
				pb.collection('comments').subscribe('*', (e) => {
					expectTypeOf(e.record).toEqualTypeOf<Comment>()
				})
			})

			describe('filter', () => {
				it('lets you pass any string as filter', () => {
					pb.collection('comments').subscribe('*', () => {}, {
						filter: 'foo',
					})
				})

				it('lets you use filter helper function', () => {
					pb.collection('comments').subscribe('*', () => {}, {
						filter: ({ $ }) => $`${'post.author'}`,
					})
				})

				it('accept any type of value in filter helper', () => {
					pb.collection('comments').subscribe('*', () => {}, {
						filter: ({ $ }) =>
							$`${1} ${'foo'} ${true} ${null} ${undefined} ${{}} ${[]} ${() => {}} ${new Date()}`,
					})
				})

				it('errors if filter function returns anything but string', () => {
					// @ts-expect-error
					pb.collection('comments').subscribe('*', () => {}, { filter: ({ $ }) => 1 })
					// @ts-expect-error
					pb.collection('comments').subscribe('*', () => {}, { filter: ({ $ }) => true })
					// @ts-expect-error
					pb.collection('comments').subscribe('*', () => {}, { filter: ({ $ }) => null })
					pb.collection('comments').subscribe('*', () => {}, {
						// @ts-expect-error
						filter: ({ $ }) => undefined,
					})
					// @ts-expect-error
					pb.collection('comments').subscribe('*', () => {}, { filter: ({ $ }) => ({}) })
					// @ts-expect-error
					pb.collection('comments').subscribe('*', () => {}, { filter: ({ $ }) => [] })
					pb.collection('comments').subscribe('*', () => {}, {
						// @ts-expect-error
						filter: ({ $ }) => new Date(),
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

			it('infers back relations', async () => {
				const users = await pb
					.collection('users')
					.getFullList({ expand: [{ key: 'posts_via_author' }] })
				expectTypeOf(users).branded.toEqualTypeOf<
					Array<User & { expand: { posts_via_author?: Post[] } }>
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

			describe('filter', () => {
				it('lets you pass any string as filter', () => {
					pb.collection('comments').getFullList({
						filter: 'foo',
					})
				})

				it('lets you use filter helper function', () => {
					pb.collection('comments').getFullList({
						filter: ({ $ }) => $`${'post.author'}`,
					})
				})

				it('accept any type of value in filter helper', () => {
					pb.collection('comments').getFullList({
						filter: ({ $ }) =>
							$`${1} ${'foo'} ${true} ${null} ${undefined} ${{}} ${[]} ${() => {}} ${new Date()}`,
					})
				})

				it('errors if filter function returns anything but string', () => {
					// @ts-expect-error
					pb.collection('comments').getFullList({ filter: ({ $ }) => 1 })
					// @ts-expect-error
					pb.collection('comments').getFullList({ filter: ({ $ }) => true })
					// @ts-expect-error
					pb.collection('comments').getFullList({ filter: ({ $ }) => null })
					// @ts-expect-error
					pb.collection('comments').getFullList({ filter: ({ $ }) => undefined })
					// @ts-expect-error
					pb.collection('comments').getFullList({ filter: ({ $ }) => ({}) })
					// @ts-expect-error
					pb.collection('comments').getFullList({ filter: ({ $ }) => [] })
					// @ts-expect-error
					pb.collection('comments').getFullList({ filter: ({ $ }) => new Date() })
				})
			})

			describe('sort', () => {
				it('lets you pass any string as sort', () => {
					pb.collection('comments').getFullList({
						sort: 'foo',
					})
				})

				it('lets you use sort helper function', () => {
					pb.collection('comments').getFullList({
						sort: ({ $ }) => $`${'post.author'}`,
					})
				})

				it('accept any type of value in sort helper', () => {
					pb.collection('comments').getFullList({
						sort: ({ $ }) =>
							$`${1} ${'foo'} ${true} ${null} ${undefined} ${{}} ${[]} ${() => {}} ${new Date()}`,
					})
				})

				it('errors if sort function returns anything but string', () => {
					// @ts-expect-error
					pb.collection('comments').getFullList({ sort: ({ $ }) => 1 })
					// @ts-expect-error
					pb.collection('comments').getFullList({ sort: ({ $ }) => true })
					// @ts-expect-error
					pb.collection('comments').getFullList({ sort: ({ $ }) => null })
					// @ts-expect-error
					pb.collection('comments').getFullList({ sort: ({ $ }) => undefined })
					// @ts-expect-error
					pb.collection('comments').getFullList({ sort: ({ $ }) => ({}) })
					// @ts-expect-error
					pb.collection('comments').getFullList({ sort: ({ $ }) => [] })
					// @ts-expect-error
					pb.collection('comments').getFullList({ sort: ({ $ }) => new Date() })
				})
			})

			describe('at top level', () => {
				it('returns type as is if no option is passed', async () => {
					const posts = await pb.collection('posts').getFullList()
					expectTypeOf(posts).toEqualTypeOf<Post[]>()
				})

				describe('fields', () => {
					it('returns type with only specified fields in options', async () => {
						const users = await pb
							.collection('users')
							.getFullList({ fields: ['id', 'name'] })
						expectTypeOf(users).toEqualTypeOf<Array<Pick<User, 'id' | 'name'>>>()
					})

					it('only accepts fields that actually exist', () => {
						pb.collection('comments').getFullList({ fields: ['id', 'post', 'message'] })
						// @ts-expect-error
						pb.collection('comments').getFullList({ fields: ['foo'] })
						// @ts-expect-error
						pb.collection('comments').getFullList({ fields: ['foo:excerpt(10)'] })
					})

					it('lets you use modifiers like :excerpt', () => {
						pb.collection('posts').getFullList({
							fields: ['id', 'title:excerpt(10)'],
						})
					})

					it("modifiers don't affect types", async () => {
						const withoutModifier = await pb.collection('posts').getFullList({
							fields: ['id', 'title'],
						})
						const withModifier = await pb.collection('posts').getFullList({
							fields: ['id', 'title:excerpt(10)'],
						})

						expectTypeOf(withModifier).toEqualTypeOf<Awaited<typeof withoutModifier>>()
					})
				})

				describe('expand', () => {
					it("can't be expanded with unrelated relations", () => {
						// @ts-expect-error
						pb.collection('comments').getFullList({ expand: [{ key: 'tags' }] })
					})

					it('types single required to-one expand', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toOneRequired1' }],
						})
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<Post & { expand: { toOneRequired1: ToOneRequired } }>
						>()
					})

					it('types single optional to-one expand', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toOneOptional1' }],
						})
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<Post & { expand: { toOneOptional1?: ToOneOptional } }>
						>()
					})

					it('types single required to-many expand', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toManyRequired1' }],
						})
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<Post & { expand: { toManyRequired1: ToManyRequired[] } }>
						>()
					})

					it('types single optional to-many expand', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toManyOptional1' }],
						})
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<Post & { expand: { toManyOptional1?: ToManyOptional[] } }>
						>()
					})

					it('types multiple expands (to-one required x2)', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'author' }, { key: 'toOneRequired1' }],
						})
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<
								Post & {
									expand: {
										author: User
										toOneRequired1: ToOneRequired
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required & to-one optional)', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'author' }, { key: 'toOneOptional1' }],
						})
						expectTypeOf(posts).toEqualTypeOf<
							Array<
								Post & {
									expand: {
										author: User
									} & {
										toOneOptional1?: ToOneOptional
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one optional x2)', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
						})
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<
								Post & {
									expand: {
										toOneOptional1?: ToOneOptional
										toOneOptional2?: ToOneOptional
									}
								}
							>
						>()
					})

					it('types multiple expands (to-many required x2)', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toManyRequired1' }, { key: 'toManyRequired2' }],
						})
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<
								Post & {
									expand: {
										toManyRequired1: ToManyRequired[]
										toManyRequired2: ToManyRequired[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-many required & to-many optional)', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toManyRequired1' }, { key: 'toManyOptional1' }],
						})
						expectTypeOf(posts).toEqualTypeOf<
							Array<
								Post & {
									expand: {
										toManyRequired1: ToManyRequired[]
									} & {
										toManyOptional1?: ToManyOptional[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-many optional x2)', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toManyOptional1' }, { key: 'toManyOptional2' }],
						})
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<
								Post & {
									expand: {
										toManyOptional1?: ToManyOptional[]
										toManyOptional2?: ToManyOptional[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required & to-many required)', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired1' }],
						})
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<
								Post & {
									expand: {
										toOneRequired1: ToOneRequired
										toManyRequired1: ToManyRequired[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required & to-many optional)', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
						})
						expectTypeOf(posts).toEqualTypeOf<
							Array<
								Post & {
									expand: {
										toOneRequired1: ToOneRequired
									} & {
										toManyOptional1?: ToManyOptional[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one optional & to-many required)', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired1' }],
						})
						expectTypeOf(posts).toEqualTypeOf<
							Array<
								Post & {
									expand: {
										toOneOptional1?: ToOneOptional
									} & {
										toManyRequired1: ToManyRequired[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one optional & to-many optional)', async () => {
						const posts = await pb.collection('posts').getFullList({
							expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
						})
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<
								Post & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyOptional1?: ToManyOptional[]
									}
								}
							>
						>()
					})
				})
			})

			describe('in `expand` (to-one)', () => {
				it('returns type as is if `fields` is not specified (required)', async () => {
					const posts = await pb
						.collection('posts')
						.getFullList({ expand: [{ key: 'toOneRequired1' }] })
					expectTypeOf(posts).branded.toEqualTypeOf<
						Array<Post & { expand: { toOneRequired1: ToOneRequired } }>
					>()
				})

				it('returns type as is if `fields` is not specified (optional)', async () => {
					const posts = await pb
						.collection('posts')
						.getFullList({ expand: [{ key: 'toOneOptional1' }] })
					expectTypeOf(posts).branded.toEqualTypeOf<
						Array<Post & { expand: { toOneOptional1?: ToOneOptional } }>
					>()
				})

				describe('fields', () => {
					it('returns type with only specified fields', async () => {
						const postsWithAuthor = await pb
							.collection('posts')
							.getFullList({ expand: [{ key: 'author', fields: ['id', 'name'] }] })
						expectTypeOf(postsWithAuthor).branded.toEqualTypeOf<
							Array<Post & { expand: { author: Pick<User, 'id' | 'name'> } }>
						>()
					})

					it('only accepts fields that actually exist', () => {
						pb.collection('posts').getFullList({
							expand: [{ key: 'author', fields: ['id', 'name'] }],
						})
						pb.collection('posts').getFullList({
							// @ts-expect-error
							expand: [{ key: 'author', fields: ['foo'] }],
						})
						pb.collection('posts').getFullList({
							// @ts-expect-error
							expand: [{ key: 'author', fields: ['foo:excerpt(10)'] }],
						})
					})

					it('lets you use modifiers like :excerpt', () => {
						pb.collection('comments').getFullList({
							expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }],
						})
					})

					it("modifiers don't affect types", async () => {
						const withoutModifier = await pb.collection('comments').getFullList({
							expand: [{ key: 'post', fields: ['id', 'title'] }],
						})
						const withModifier = await pb.collection('comments').getFullList({
							expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }],
						})

						expectTypeOf(withModifier).toEqualTypeOf<Awaited<typeof withoutModifier>>()
					})
				})

				describe('expand', () => {
					it("can't be expanded with unrelated relations", () => {
						pb.collection('posts').getFullList({
							// @ts-expect-error
							expand: [{ key: 'author', expand: [{ key: 'tags' }] }],
						})
					})

					it('types single required to-one expand', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [{ key: 'post', expand: [{ key: 'toOneRequired1' }] }],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & { expand: { toOneRequired1: ToOneRequired } }
									}
								}
							>
						>()
					})

					it('types single optional to-one expand', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [{ key: 'post', expand: [{ key: 'toOneOptional1' }] }],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & { expand: { toOneOptional1?: ToOneOptional } }
									}
								}
							>
						>()
					})

					it('types single required to-many expand', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [{ key: 'post', expand: [{ key: 'toManyRequired1' }] }],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: { toManyRequired1: ToManyRequired[] }
										}
									}
								}
							>
						>()
					})

					it('types single optional to-many expand', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [{ key: 'post', expand: [{ key: 'toManyOptional1' }] }],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: { toManyOptional1?: ToManyOptional[] }
										}
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required x2)', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneRequired1' }, { key: 'toOneRequired2' }],
								},
							],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: {
												toOneRequired1: ToOneRequired
												toOneRequired2: ToOneRequired
											}
										}
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required & to-one optional)', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneRequired1' }, { key: 'toOneOptional1' }],
								},
							],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: {
												toOneRequired1: ToOneRequired
											} & {
												toOneOptional1?: ToOneOptional
											}
										}
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one optional x2)', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
								},
							],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: {
												toOneOptional1?: ToOneOptional
												toOneOptional2?: ToOneOptional
											}
										}
									}
								}
							>
						>()
					})

					it('types multiple expands (to-many required x2)', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [
								{
									key: 'post',
									expand: [
										{ key: 'toManyRequired1' },
										{ key: 'toManyRequired2' },
									],
								},
							],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: {
												toManyRequired1: ToManyRequired[]
												toManyRequired2: ToManyRequired[]
											}
										}
									}
								}
							>
						>()
					})

					it('types multiple expands (to-many required & to-many optional)', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [
								{
									key: 'post',
									expand: [
										{ key: 'toManyRequired1' },
										{ key: 'toManyOptional1' },
									],
								},
							],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: {
												toManyRequired1: ToManyRequired[]
											} & {
												toManyOptional1?: ToManyOptional[]
											}
										}
									}
								}
							>
						>()
					})

					it('types multiple expands (to-many optional x2)', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [
								{
									key: 'post',
									expand: [
										{ key: 'toManyOptional1' },
										{ key: 'toManyOptional2' },
									],
								},
							],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: {
												toManyOptional2?: ToManyOptional[]
												toManyOptional1?: ToManyOptional[]
											}
										}
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required & to-many required)', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired1' }],
								},
							],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: {
												toOneRequired1: ToOneRequired
												toManyRequired1: ToManyRequired[]
											}
										}
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required & to-many optional)', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
								},
							],
						})

						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: {
												toOneRequired1: ToOneRequired
											} & {
												toManyOptional1?: ToManyOptional[]
											}
										}
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one optional & to-many required)', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired1' }],
								},
							],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: {
												toOneOptional1?: ToOneOptional
											} & {
												toManyRequired1: ToManyRequired[]
											}
										}
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one optional & to-many optional)', async () => {
						const comments = await pb.collection('comments').getFullList({
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
								},
							],
						})
						expectTypeOf(comments).branded.toEqualTypeOf<
							Array<
								Comment & {
									expand: {
										post: Post & {
											expand: {
												toOneOptional1?: ToOneOptional
												toManyOptional1?: ToManyOptional[]
											}
										}
									}
								}
							>
						>()
					})
				})
			})

			describe('in `expand` (to-many)', () => {
				it('returns type as is if `fields` is not specified (required)', async () => {
					const bases = await pb
						.collection('base')
						.getFullList({ expand: [{ key: 'toManyRequired1' }] })
					expectTypeOf(bases).branded.toEqualTypeOf<
						Array<Base & { expand: { toManyRequired1: ToManyRequired[] } }>
					>()
				})

				it('returns type as is if `fields` is not specified (optional)', async () => {
					const bases = await pb
						.collection('base')
						.getFullList({ expand: [{ key: 'toManyOptional1' }] })
					expectTypeOf(bases).branded.toEqualTypeOf<
						Array<Base & { expand: { toManyOptional1?: ToManyOptional[] } }>
					>()
				})

				describe('fields', () => {
					it('returns type with only specified fields', async () => {
						const posts = await pb
							.collection('posts')
							.getFullList({ expand: [{ key: 'tags', fields: ['id', 'name'] }] })
						expectTypeOf(posts).branded.toEqualTypeOf<
							Array<Post & { expand: { tags?: Pick<Tag, 'id' | 'name'>[] } }>
						>()
					})

					it('only accepts fields that actually exist', () => {
						pb.collection('posts').getFullList({
							expand: [{ key: 'tags', fields: ['id', 'name'] }],
						})
						pb.collection('posts').getFullList({
							// @ts-expect-error
							expand: [{ key: 'tags', fields: ['foo'] }],
						})
						pb.collection('posts').getFullList({
							// @ts-expect-error
							expand: [{ key: 'tags', fields: ['foo:excerpt(10)'] }],
						})
					})

					it('lets you use modifiers like :excerpt', () => {
						pb.collection('users').getFullList({
							expand: [
								{ key: 'posts_via_author', fields: ['id', 'title:excerpt(10)'] },
							],
						})
					})

					it("modifiers don't affect types", async () => {
						const withoutModifier = await pb.collection('users').getFullList({
							expand: [{ key: 'posts_via_author', fields: ['id', 'title'] }],
						})
						const withModifier = await pb.collection('users').getFullList({
							expand: [
								{ key: 'posts_via_author', fields: ['id', 'title:excerpt(10)'] },
							],
						})

						expectTypeOf(withModifier).toEqualTypeOf<Awaited<typeof withoutModifier>>()
					})
				})
				///

				describe('expand', () => {
					it("can't be expanded with unrelated relations", () => {
						pb.collection('posts').getFullList({
							// @ts-expect-error
							expand: [{ key: 'comments_via_post', expand: [{ key: 'tags' }] }],
						})
					})

					it('types single required to-one expand', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{ key: 'toManyRequired1', expand: [{ key: 'toOneRequired1' }] },
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: { toOneRequired1: ToOneRequired }
										})[]
									}
								}
							>
						>()
					})

					it('types single optional to-one expand', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{ key: 'toManyRequired1', expand: [{ key: 'toOneOptional1' }] },
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: { toOneOptional1?: ToOneOptional }
										})[]
									}
								}
							>
						>()
					})

					it('types single required to-many expand', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{ key: 'toManyRequired1', expand: [{ key: 'toManyRequired2' }] },
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: { toManyRequired2: ToManyRequired[] }
										})[]
									}
								}
							>
						>()
					})

					it('types single optional to-many expand', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{ key: 'toManyRequired1', expand: [{ key: 'toManyOptional1' }] },
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: { toManyOptional1?: ToManyOptional[] }
										})[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required x2)', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneRequired1' }, { key: 'toOneRequired2' }],
								},
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: {
												toOneRequired1: ToOneRequired
												toOneRequired2: ToOneRequired
											}
										})[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required & to-one optional)', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneRequired1' }, { key: 'toOneOptional1' }],
								},
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: {
												toOneRequired1: ToOneRequired
											} & {
												toOneOptional1?: ToOneOptional
											}
										})[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one optional x2)', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
								},
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: {
												toOneOptional1?: ToOneOptional
												toOneOptional2?: ToOneOptional
											}
										})[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-many required x2)', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{
									key: 'toManyRequired1',
									expand: [
										{ key: 'toManyRequired1' },
										{ key: 'toManyRequired2' },
									],
								},
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: {
												toManyRequired1: ToManyRequired[]
												toManyRequired2: ToManyRequired[]
											}
										})[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-many required & to-many optional)', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{
									key: 'toManyRequired1',
									expand: [
										{ key: 'toManyRequired1' },
										{ key: 'toManyOptional1' },
									],
								},
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: {
												toManyRequired1: ToManyRequired[]
											} & {
												toManyOptional1?: ToManyOptional[]
											}
										})[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-many optional x2)', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{
									key: 'toManyRequired1',
									expand: [
										{ key: 'toManyOptional1' },
										{ key: 'toManyOptional2' },
									],
								},
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: {
												toManyOptional1?: ToManyOptional[]
												toManyOptional2?: ToManyOptional[]
											}
										})[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required & to-many required)', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired2' }],
								},
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: {
												toOneRequired1: ToOneRequired
												toManyRequired2: ToManyRequired[]
											}
										})[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one required & to-many optional)', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
								},
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: {
												toOneRequired1: ToOneRequired
											} & {
												toManyOptional1?: ToManyOptional[]
											}
										})[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one optional & to-many required)', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired2' }],
								},
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: {
												toOneOptional1?: ToOneOptional
											} & {
												toManyRequired2: ToManyRequired[]
											}
										})[]
									}
								}
							>
						>()
					})

					it('types multiple expands (to-one optional & to-many optional)', async () => {
						const bases = await pb.collection('base').getFullList({
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
								},
							],
						})
						expectTypeOf(bases).branded.toEqualTypeOf<
							Array<
								Base & {
									expand: {
										toManyRequired1: (ToManyRequired & {
											expand: {
												toOneOptional1?: ToOneOptional
												toManyOptional1?: ToManyOptional[]
											}
										})[]
									}
								}
							>
						>()
					})
				})
			})
		})

		describe('getList', () => {
			it('lets you pass options like "headers"', () => {
				pb.collection('base').getList(1, 10, { headers: { a: 'a' } })
			})

			it('infers back relations', async () => {
				const users = await pb
					.collection('users')
					.getList(1, 10, { expand: [{ key: 'posts_via_author' }] })
				expectTypeOf(users.items).branded.toEqualTypeOf<
					Array<User & { expand: { posts_via_author?: Post[] } }>
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

			describe('filter', () => {
				it('lets you pass any string as filter', () => {
					pb.collection('comments').getList(1, 10, {
						filter: 'foo',
					})
				})

				it('lets you use filter helper function', () => {
					pb.collection('comments').getList(1, 10, {
						filter: ({ $ }) => $`${'post.author'}`,
					})
				})

				it('accept any type of value in filter helper', () => {
					pb.collection('comments').getList(1, 10, {
						filter: ({ $ }) =>
							$`${1} ${'foo'} ${true} ${null} ${undefined} ${{}} ${[]} ${() => {}} ${new Date()}`,
					})
				})

				it('errors if filter function returns anything but string', () => {
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { filter: ({ $ }) => 1 })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { filter: ({ $ }) => true })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { filter: ({ $ }) => null })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { filter: ({ $ }) => undefined })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { filter: ({ $ }) => ({}) })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { filter: ({ $ }) => [] })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { filter: ({ $ }) => new Date() })
				})
			})

			describe('sort', () => {
				it('lets you pass any string as sort', () => {
					pb.collection('comments').getList(1, 10, {
						sort: 'foo',
					})
				})

				it('lets you use sort helper function', () => {
					pb.collection('comments').getList(1, 10, {
						sort: ({ $ }) => $`${'post.author'}`,
					})
				})

				it('accept any type of value in sort helper', () => {
					pb.collection('comments').getList(1, 10, {
						sort: ({ $ }) =>
							$`${1} ${'foo'} ${true} ${null} ${undefined} ${{}} ${[]} ${() => {}} ${new Date()}`,
					})
				})

				it('errors if sort function returns anything but string', () => {
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { sort: ({ $ }) => 1 })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { sort: ({ $ }) => true })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { sort: ({ $ }) => null })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { sort: ({ $ }) => undefined })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { sort: ({ $ }) => ({}) })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { sort: ({ $ }) => [] })
					// @ts-expect-error
					pb.collection('comments').getList(1, 10, { sort: ({ $ }) => new Date() })
				})
			})

			describe('at top level', () => {
				it('returns type as is if no option is passed', async () => {
					const posts = await pb.collection('posts').getList(1, 10)
					expectTypeOf(posts.items).toEqualTypeOf<Post[]>()
				})

				describe('fields', () => {
					it('returns type with only specified fields in options', async () => {
						const users = await pb
							.collection('users')
							.getList(1, 10, { fields: ['id', 'name'] })
						expectTypeOf(users.items).toEqualTypeOf<Array<Pick<User, 'id' | 'name'>>>()
					})

					it('only accepts fields that actually exist', () => {
						pb.collection('comments').getList(1, 10, {
							fields: ['id', 'post', 'message'],
						})
						// @ts-expect-error
						pb.collection('comments').getList(1, 10, { fields: ['foo'] })
						// @ts-expect-error
						pb.collection('comments').getList(1, 10, { fields: ['foo:excerpt(10)'] })
					})

					it('lets you use modifiers like :excerpt', () => {
						pb.collection('posts').getList(1, 10, {
							fields: ['id', 'title:excerpt(10)'],
						})
					})

					it("modifiers don't affect types", async () => {
						const withoutModifier = await pb.collection('posts').getList(1, 10, {
							fields: ['id', 'title'],
						})
						const withModifier = await pb.collection('posts').getList(1, 10, {
							fields: ['id', 'title:excerpt(10)'],
						})

						expectTypeOf(withModifier.items).toEqualTypeOf<
							Awaited<typeof withoutModifier>['items']
						>()
					})
				})

				describe('expand', () => {
					it("can't be expanded with unrelated relations", () => {
						// @ts-expect-error
						pb.collection('comments').getList(1, 10, { expand: [{ key: 'tags' }] })
					})

					it('types single required to-one expand', async () => {
						const posts = await pb.collection('posts').getList(1, 10, {
							expand: [{ key: 'toOneRequired1' }],
						})
						expectTypeOf(posts.items).branded.toEqualTypeOf<
							Array<Post & { expand: { toOneRequired1: ToOneRequired } }>
						>()
					})

					it('types single optional to-one expand', async () => {
						const posts = await pb.collection('posts').getList(1, 10, {
							expand: [{ key: 'toOneOptional1' }],
						})
						expectTypeOf(posts.items).branded.toEqualTypeOf<
							Array<Post & { expand: { toOneOptional1?: ToOneOptional } }>
						>()
					})

					it('types single required to-many expand', async () => {
						const posts = await pb.collection('posts').getList(1, 10, {
							expand: [{ key: 'toManyRequired1' }],
						})
						expectTypeOf(posts.items).branded.toEqualTypeOf<
							Array<Post & { expand: { toManyRequired1: ToManyRequired[] } }>
						>()
					})

					it('types single optional to-many expand', async () => {
						const posts = await pb.collection('posts').getList(1, 10, {
							expand: [{ key: 'toManyOptional1' }],
						})
						expectTypeOf(posts.items).branded.toEqualTypeOf<
							Array<Post & { expand: { toManyOptional1?: ToManyOptional[] } }>
						>()
					})
				})

				describe('in `expand` (to-one)', () => {
					it('returns type as is if `fields` is not specified (required)', async () => {
						const posts = await pb
							.collection('posts')
							.getList(1, 10, { expand: [{ key: 'toOneRequired1' }] })
						expectTypeOf(posts.items).branded.toEqualTypeOf<
							Array<Post & { expand: { toOneRequired1: ToOneRequired } }>
						>()
					})

					it('returns type as is if `fields` is not specified (optional)', async () => {
						const posts = await pb
							.collection('posts')
							.getList(1, 10, { expand: [{ key: 'toOneOptional1' }] })
						expectTypeOf(posts.items).branded.toEqualTypeOf<
							Array<Post & { expand: { toOneOptional1?: ToOneOptional } }>
						>()
					})

					describe('fields', () => {
						it('returns type with only specified fields', async () => {
							const postsWithAuthor = await pb.collection('posts').getList(1, 10, {
								expand: [{ key: 'author', fields: ['id', 'name'] }],
							})
							expectTypeOf(postsWithAuthor.items).branded.toEqualTypeOf<
								Array<Post & { expand: { author: Pick<User, 'id' | 'name'> } }>
							>()
						})

						it('only accepts fields that actually exist', () => {
							pb.collection('posts').getList(1, 10, {
								expand: [{ key: 'author', fields: ['id', 'name'] }],
							})
							pb.collection('posts').getList(1, 10, {
								// @ts-expect-error
								expand: [{ key: 'author', fields: ['foo'] }],
							})
							pb.collection('posts').getList(1, 10, {
								// @ts-expect-error
								expand: [{ key: 'author', fields: ['foo:excerpt(10)'] }],
							})
						})

						it('lets you use modifiers like :excerpt', () => {
							pb.collection('comments').getList(1, 10, {
								expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }],
							})
						})

						it("modifiers don't affect types", async () => {
							const withoutModifier = await pb.collection('comments').getList(1, 10, {
								expand: [{ key: 'post', fields: ['id', 'title'] }],
							})
							const withModifier = await pb.collection('comments').getList(1, 10, {
								expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }],
							})

							expectTypeOf(withModifier.items).toEqualTypeOf<
								Awaited<typeof withoutModifier>['items']
							>()
						})
					})

					describe('expand', () => {
						it("can't be expanded with unrelated relations", () => {
							pb.collection('posts').getList(1, 10, {
								// @ts-expect-error
								expand: [{ key: 'author', expand: [{ key: 'tags' }] }],
							})
						})

						it('types single required to-one expand', async () => {
							const comments = await pb.collection('comments').getList(1, 10, {
								expand: [{ key: 'post', expand: [{ key: 'toOneRequired1' }] }],
							})
							expectTypeOf(comments.items).branded.toEqualTypeOf<
								Array<
									Comment & {
										expand: {
											post: Post & {
												expand: { toOneRequired1: ToOneRequired }
											}
										}
									}
								>
							>()
						})

						it('types single optional to-one expand', async () => {
							const comments = await pb.collection('comments').getList(1, 10, {
								expand: [{ key: 'post', expand: [{ key: 'toOneOptional1' }] }],
							})
							expectTypeOf(comments.items).branded.toEqualTypeOf<
								Array<
									Comment & {
										expand: {
											post: Post & {
												expand: { toOneOptional1?: ToOneOptional }
											}
										}
									}
								>
							>()
						})

						it('types single required to-many expand', async () => {
							const comments = await pb.collection('comments').getList(1, 10, {
								expand: [{ key: 'post', expand: [{ key: 'toManyRequired1' }] }],
							})
							expectTypeOf(comments.items).branded.toEqualTypeOf<
								Array<
									Comment & {
										expand: {
											post: Post & {
												expand: { toManyRequired1: ToManyRequired[] }
											}
										}
									}
								>
							>()
						})

						it('types single optional to-many expand', async () => {
							const comments = await pb.collection('comments').getList(1, 10, {
								expand: [{ key: 'post', expand: [{ key: 'toManyOptional1' }] }],
							})
							expectTypeOf(comments.items).branded.toEqualTypeOf<
								Array<
									Comment & {
										expand: {
											post: Post & {
												expand: { toManyOptional1?: ToManyOptional[] }
											}
										}
									}
								>
							>()
						})
					})
				})

				describe('in `expand` (to-many)', () => {
					it('returns type as is if `fields` is not specified (required)', async () => {
						const bases = await pb
							.collection('base')
							.getList(1, 10, { expand: [{ key: 'toManyRequired1' }] })
						expectTypeOf(bases.items).branded.toEqualTypeOf<
							Array<Base & { expand: { toManyRequired1: ToManyRequired[] } }>
						>()
					})

					it('returns type as is if `fields` is not specified (optional)', async () => {
						const bases = await pb
							.collection('base')
							.getList(1, 10, { expand: [{ key: 'toManyOptional1' }] })
						expectTypeOf(bases.items).branded.toEqualTypeOf<
							Array<Base & { expand: { toManyOptional1?: ToManyOptional[] } }>
						>()
					})

					describe('fields', () => {
						it('returns type with only specified fields', async () => {
							const posts = await pb.collection('posts').getList(1, 10, {
								expand: [{ key: 'tags', fields: ['id', 'name'] }],
							})
							expectTypeOf(posts.items).branded.toEqualTypeOf<
								Array<Post & { expand: { tags?: Pick<Tag, 'id' | 'name'>[] } }>
							>()
						})

						it('only accepts fields that actually exist', () => {
							pb.collection('posts').getList(1, 10, {
								expand: [{ key: 'tags', fields: ['id', 'name'] }],
							})
							pb.collection('posts').getList(1, 10, {
								// @ts-expect-error
								expand: [{ key: 'tags', fields: ['foo'] }],
							})
							pb.collection('posts').getList(1, 10, {
								// @ts-expect-error
								expand: [{ key: 'tags', fields: ['foo:excerpt(10)'] }],
							})
						})

						it('lets you use modifiers like :excerpt', () => {
							pb.collection('users').getList(1, 10, {
								expand: [
									{
										key: 'posts_via_author',
										fields: ['id', 'title:excerpt(10)'],
									},
								],
							})
						})

						it("modifiers don't affect types", async () => {
							const withoutModifier = await pb.collection('users').getList(1, 10, {
								expand: [{ key: 'posts_via_author', fields: ['id', 'title'] }],
							})
							const withModifier = await pb.collection('users').getList(1, 10, {
								expand: [
									{
										key: 'posts_via_author',
										fields: ['id', 'title:excerpt(10)'],
									},
								],
							})

							expectTypeOf(withModifier.items).toEqualTypeOf<
								Awaited<typeof withoutModifier>['items']
							>()
						})
					})
				})
			})
		})

		describe('getFirstListItem', () => {
			it('lets you pass options like "headers"', () => {
				pb.collection('base').getFirstListItem('', { headers: { a: 'a' } })
			})

			it('infers back relations', async () => {
				const user = await pb
					.collection('users')
					.getFirstListItem('', { expand: [{ key: 'posts_via_author' }] })
				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { posts_via_author?: Post[] } }
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

			describe('filter', () => {
				it('lets you pass any string as filter', () => {
					pb.collection('comments').getFirstListItem('foo')
				})

				it('lets you use filter helper function', () => {
					pb.collection('comments').getFirstListItem(({ $ }) => $`${'post.author'}`)
				})

				it('accept any type of value in filter helper', () => {
					pb.collection('comments').getFirstListItem(
						({ $ }) =>
							$`${1} ${'foo'} ${true} ${null} ${undefined} ${{}} ${[]} ${() => {}} ${new Date()}`
					)
				})

				it('errors if filter function returns anything but string', () => {
					// @ts-expect-error
					pb.collection('comments').getFirstListItem(({ $ }) => 1)
					// @ts-expect-error
					pb.collection('comments').getFirstListItem(({ $ }) => true)
					// @ts-expect-error
					pb.collection('comments').getFirstListItem(({ $ }) => null)
					// @ts-expect-error
					pb.collection('comments').getFirstListItem(({ $ }) => undefined)
					// @ts-expect-error
					pb.collection('comments').getFirstListItem(({ $ }) => ({}))
					// @ts-expect-error
					pb.collection('comments').getFirstListItem(({ $ }) => [])
					// @ts-expect-error
					pb.collection('comments').getFirstListItem(({ $ }) => new Date())
				})
			})

			describe('at top level', () => {
				it('returns type as is if no option is passed', async () => {
					const post = await pb.collection('posts').getFirstListItem('')
					expectTypeOf(post).toEqualTypeOf<Post>()
				})

				describe('fields', () => {
					it('returns type with only specified fields in options', async () => {
						const post = await pb
							.collection('users')
							.getFirstListItem('', { fields: ['id', 'name'] })
						expectTypeOf(post).toEqualTypeOf<Pick<User, 'id' | 'name'>>()
					})

					it('only accepts fields that actually exist', () => {
						pb.collection('comments').getFirstListItem('', {
							fields: ['id', 'post', 'message'],
						})
						// @ts-expect-error
						pb.collection('comments').getFirstListItem('', { fields: ['foo'] })
						pb.collection('comments').getFirstListItem('', {
							// @ts-expect-error
							fields: ['foo:excerpt(10)'],
						})
					})

					it('lets you use modifiers like :excerpt', () => {
						expectTypeOf(pb.collection('posts').getFirstListItem).toBeCallableWith('', {
							fields: ['id', 'title:excerpt(10)'],
						})
					})

					it("modifiers don't affect types", async () => {
						const withoutModifier = await pb.collection('posts').getFirstListItem('', {
							fields: ['id', 'title'],
						})
						const withModifier = await pb.collection('posts').getFirstListItem('', {
							fields: ['id', 'title:excerpt(10)'],
						})

						expectTypeOf(withModifier).toEqualTypeOf<Awaited<typeof withoutModifier>>()
					})
				})

				describe('expand', () => {
					it("can't be expanded with unrelated relations", () => {
						pb.collection('comments').getFirstListItem('', {
							// @ts-expect-error
							expand: [{ key: 'tags' }],
						})
					})

					it('types single required to-one expand', async () => {
						const post = await pb.collection('posts').getFirstListItem('', {
							expand: [{ key: 'toOneRequired1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toOneRequired1: ToOneRequired } }
						>()
					})

					it('types single optional to-one expand', async () => {
						const post = await pb.collection('posts').getFirstListItem('', {
							expand: [{ key: 'toOneOptional1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toOneOptional1?: ToOneOptional } }
						>()
					})

					it('types single required to-many expand', async () => {
						const post = await pb.collection('posts').getFirstListItem('', {
							expand: [{ key: 'toManyRequired1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toManyRequired1: ToManyRequired[] } }
						>()
					})

					it('types single optional to-many expand', async () => {
						const post = await pb.collection('posts').getFirstListItem('', {
							expand: [{ key: 'toManyOptional1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toManyOptional1?: ToManyOptional[] } }
						>()
					})
				})

				describe('in `expand` (to-one)', () => {
					it('returns type as is if `fields` is not specified (required)', async () => {
						const posts = await pb
							.collection('posts')
							.getFirstListItem('', { expand: [{ key: 'toOneRequired1' }] })
						expectTypeOf(posts).branded.toEqualTypeOf<
							Post & { expand: { toOneRequired1: ToOneRequired } }
						>()
					})

					it('returns type as is if `fields` is not specified (optional)', async () => {
						const posts = await pb
							.collection('posts')
							.getFirstListItem('', { expand: [{ key: 'toOneOptional1' }] })
						expectTypeOf(posts).branded.toEqualTypeOf<
							Post & { expand: { toOneOptional1?: ToOneOptional } }
						>()
					})

					describe('fields', () => {
						it('returns type with only specified fields', async () => {
							const postsWithAuthor = await pb
								.collection('posts')
								.getFirstListItem('', {
									expand: [{ key: 'author', fields: ['id', 'name'] }],
								})
							expectTypeOf(postsWithAuthor).branded.toEqualTypeOf<
								Post & { expand: { author: Pick<User, 'id' | 'name'> } }
							>()
						})

						it('only accepts fields that actually exist', () => {
							pb.collection('posts').getFirstListItem('', {
								expand: [{ key: 'author', fields: ['id', 'name'] }],
							})
							pb.collection('posts').getFirstListItem('', {
								// @ts-expect-error
								expand: [{ key: 'author', fields: ['foo'] }],
							})
							pb.collection('posts').getFirstListItem('', {
								// @ts-expect-error
								expand: [{ key: 'author', fields: ['foo:excerpt(10)'] }],
							})
						})

						it('lets you use modifiers like :excerpt', () => {
							expectTypeOf(
								pb.collection('comments').getFirstListItem
							).toBeCallableWith('', {
								expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }],
							})
						})

						it("modifiers don't affect types", async () => {
							const withoutModifier = await pb
								.collection('comments')
								.getFirstListItem('', {
									expand: [{ key: 'post', fields: ['id', 'title'] }],
								})
							const withModifier = await pb
								.collection('comments')
								.getFirstListItem('', {
									expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }],
								})

							expectTypeOf(withModifier).toEqualTypeOf<
								Awaited<typeof withoutModifier>
							>()
						})
					})

					describe('expand', () => {
						it("can't be expanded with unrelated relations", () => {
							pb.collection('posts').getFirstListItem('', {
								// @ts-expect-error
								expand: [{ key: 'author', expand: [{ key: 'tags' }] }],
							})
						})

						it('types single required to-one expand', async () => {
							const comment = await pb.collection('comments').getFirstListItem('', {
								expand: [{ key: 'post', expand: [{ key: 'toOneRequired1' }] }],
							})
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & { expand: { toOneRequired1: ToOneRequired } }
									}
								}
							>()
						})

						it('types single optional to-one expand', async () => {
							const comment = await pb.collection('comments').getFirstListItem('', {
								expand: [{ key: 'post', expand: [{ key: 'toOneOptional1' }] }],
							})
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & { expand: { toOneOptional1?: ToOneOptional } }
									}
								}
							>()
						})

						it('types single required to-many expand', async () => {
							const comment = await pb.collection('comments').getFirstListItem('', {
								expand: [{ key: 'post', expand: [{ key: 'toManyRequired1' }] }],
							})
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & {
											expand: { toManyRequired1: ToManyRequired[] }
										}
									}
								}
							>()
						})

						it('types single optional to-many expand', async () => {
							const comment = await pb.collection('comments').getFirstListItem('', {
								expand: [{ key: 'post', expand: [{ key: 'toManyOptional1' }] }],
							})
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & {
											expand: { toManyOptional1?: ToManyOptional[] }
										}
									}
								}
							>()
						})
					})
				})

				describe('in `expand` (to-many)', () => {
					it('returns type as is if `fields` is not specified (required)', async () => {
						const bases = await pb
							.collection('base')
							.getFirstListItem('', { expand: [{ key: 'toManyRequired1' }] })
						expectTypeOf(bases).branded.toEqualTypeOf<
							Base & { expand: { toManyRequired1: ToManyRequired[] } }
						>()
					})

					it('returns type as is if `fields` is not specified (optional)', async () => {
						const bases = await pb
							.collection('base')
							.getFirstListItem('', { expand: [{ key: 'toManyOptional1' }] })
						expectTypeOf(bases).branded.toEqualTypeOf<
							Base & { expand: { toManyOptional1?: ToManyOptional[] } }
						>()
					})

					describe('fields', () => {
						it('returns type with only specified fields', async () => {
							const posts = await pb.collection('posts').getFirstListItem('', {
								expand: [{ key: 'tags', fields: ['id', 'name'] }],
							})
							expectTypeOf(posts).branded.toEqualTypeOf<
								Post & { expand: { tags?: Pick<Tag, 'id' | 'name'>[] } }
							>()
						})

						it('only accepts fields that actually exist', () => {
							pb.collection('posts').getFirstListItem('', {
								expand: [{ key: 'tags', fields: ['id', 'name'] }],
							})
							pb.collection('posts').getFirstListItem('', {
								// @ts-expect-error
								expand: [{ key: 'tags', fields: ['foo'] }],
							})
							pb.collection('posts').getFirstListItem('', {
								// @ts-expect-error
								expand: [{ key: 'tags', fields: ['foo:excerpt(10)'] }],
							})
						})

						it('lets you use modifiers like :excerpt', () => {
							expectTypeOf(pb.collection('users').getFirstListItem).toBeCallableWith(
								'',
								{
									expand: [
										{
											key: 'posts_via_author',
											fields: ['id', 'title:excerpt(10)'],
										},
									],
								}
							)
						})

						it("modifiers don't affect types", async () => {
							const withoutModifier = await pb
								.collection('users')
								.getFirstListItem('', {
									expand: [{ key: 'posts_via_author', fields: ['id', 'title'] }],
								})
							const withModifier = await pb.collection('users').getFirstListItem('', {
								expand: [
									{
										key: 'posts_via_author',
										fields: ['id', 'title:excerpt(10)'],
									},
								],
							})

							expectTypeOf(withModifier).toEqualTypeOf<
								Awaited<typeof withoutModifier>
							>()
						})
					})
				})
			})
		})

		describe('getOne', () => {
			it('lets you pass options like "headers"', () => {
				expectTypeOf(pb.collection('base').getOne).toBeCallableWith('', {
					headers: { a: 'a' },
				})
			})

			it('infers back relations', async () => {
				const user = await pb
					.collection('users')
					.getOne('', { expand: [{ key: 'posts_via_author' }] })

				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { posts_via_author?: Post[] } }
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

			describe('at top level', () => {
				it('returns type as is if no option is passed', async () => {
					const post = await pb.collection('posts').getOne('')
					expectTypeOf(post).toEqualTypeOf<Post>()
				})

				describe('fields', () => {
					it('returns type with only specified fields in options', async () => {
						const post = await pb
							.collection('users')
							.getOne('', { fields: ['id', 'name'] })
						expectTypeOf(post).toEqualTypeOf<Pick<User, 'id' | 'name'>>()
					})

					it('only accepts fields that actually exist', () => {
						pb.collection('comments').getOne('', { fields: ['id', 'post', 'message'] })
						// @ts-expect-error
						pb.collection('comments').getOne('', { fields: ['foo'] })
						// @ts-expect-error
						pb.collection('comments').getOne('', { fields: ['foo:excerpt(10)'] })
					})

					it('lets you use modifiers like :excerpt', () => {
						expectTypeOf(pb.collection('posts').getOne).toBeCallableWith('', {
							fields: ['id', 'title:excerpt(10)'],
						})
					})

					it("modifiers don't affect types", async () => {
						const withoutModifier = await pb.collection('posts').getOne('', {
							fields: ['id', 'title'],
						})
						const withModifier = await pb.collection('posts').getOne('', {
							fields: ['id', 'title:excerpt(10)'],
						})

						expectTypeOf(withModifier).toEqualTypeOf<Awaited<typeof withoutModifier>>()
					})
				})

				describe('expand', () => {
					it("can't be expanded with unrelated relations", () => {
						// @ts-expect-error
						pb.collection('comments').getOne('', { expand: [{ key: 'tags' }] })
					})

					it('types single required to-one expand', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toOneRequired1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toOneRequired1: ToOneRequired } }
						>()
					})

					it('types single optional to-one expand', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toOneOptional1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toOneOptional1?: ToOneOptional } }
						>()
					})

					it('types single required to-many expand', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toManyRequired1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toManyRequired1: ToManyRequired[] } }
						>()
					})

					it('types single optional to-many expand', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toManyOptional1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toManyOptional1?: ToManyOptional[] } }
						>()
					})

					it('types multiple expands (to-one required x2)', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'author' }, { key: 'toOneRequired1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & {
								expand: {
									author: User
									toOneRequired1: ToOneRequired
								}
							}
						>()
					})

					it('types multiple expands (to-one required & to-one optional)', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'author' }, { key: 'toOneOptional1' }],
						})
						expectTypeOf(post).toEqualTypeOf<
							Post & {
								expand: {
									author: User
								} & {
									toOneOptional1?: ToOneOptional
								}
							}
						>()
					})

					it('types multiple expands (to-one optional x2)', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & {
								expand: {
									toOneOptional1?: ToOneOptional
									toOneOptional2?: ToOneOptional
								}
							}
						>()
					})

					it('types multiple expands (to-many required x2)', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toManyRequired1' }, { key: 'toManyRequired2' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & {
								expand: {
									toManyRequired1: ToManyRequired[]
									toManyRequired2: ToManyRequired[]
								}
							}
						>()
					})

					it('types multiple expands (to-many required & to-many optional)', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toManyRequired1' }, { key: 'toManyOptional1' }],
						})
						expectTypeOf(post).toEqualTypeOf<
							Post & {
								expand: {
									toManyRequired1: ToManyRequired[]
								} & {
									toManyOptional1?: ToManyOptional[]
								}
							}
						>()
					})

					it('types multiple expands (to-many optional x2)', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toManyOptional1' }, { key: 'toManyOptional2' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & {
								expand: {
									toManyOptional1?: ToManyOptional[]
									toManyOptional2?: ToManyOptional[]
								}
							}
						>()
					})

					it('types multiple expands (to-one required & to-many required)', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & {
								expand: {
									toOneRequired1: ToOneRequired
									toManyRequired1: ToManyRequired[]
								}
							}
						>()
					})

					it('types multiple expands (to-one required & to-many optional)', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
						})
						expectTypeOf(post).toEqualTypeOf<
							Post & {
								expand: {
									toOneRequired1: ToOneRequired
								} & {
									toManyOptional1?: ToManyOptional[]
								}
							}
						>()
					})

					it('types multiple expands (to-one optional & to-many required)', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired1' }],
						})
						expectTypeOf(post).toEqualTypeOf<
							Post & {
								expand: {
									toOneOptional1?: ToOneOptional
								} & {
									toManyRequired1: ToManyRequired[]
								}
							}
						>()
					})

					it('types multiple expands (to-one optional & to-many optional)', async () => {
						const post = await pb.collection('posts').getOne('', {
							expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
						})
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & {
								expand: {
									toOneOptional1?: ToOneOptional
									toManyOptional1?: ToManyOptional[]
								}
							}
						>()
					})
				})
			})

			describe('in `expand` (to-one)', () => {
				it('returns type as is if `fields` is not specified (required)', async () => {
					const posts = await pb
						.collection('posts')
						.getOne('', { expand: [{ key: 'toOneRequired1' }] })
					expectTypeOf(posts).branded.toEqualTypeOf<
						Post & { expand: { toOneRequired1: ToOneRequired } }
					>()
				})

				it('returns type as is if `fields` is not specified (optional)', async () => {
					const posts = await pb
						.collection('posts')
						.getOne('', { expand: [{ key: 'toOneOptional1' }] })
					expectTypeOf(posts).branded.toEqualTypeOf<
						Post & { expand: { toOneOptional1?: ToOneOptional } }
					>()
				})

				describe('fields', () => {
					it('returns type with only specified fields', async () => {
						const postWithAuthor = await pb
							.collection('posts')
							.getOne('', { expand: [{ key: 'author', fields: ['id', 'name'] }] })
						expectTypeOf(postWithAuthor).branded.toEqualTypeOf<
							Post & { expand: { author: Pick<User, 'id' | 'name'> } }
						>()
					})

					it('only accepts fields that actually exist', () => {
						pb.collection('posts').getOne('', {
							expand: [{ key: 'author', fields: ['id', 'name'] }],
						})
						pb.collection('posts').getOne('', {
							// @ts-expect-error
							expand: [{ key: 'author', fields: ['foo'] }],
						})
						pb.collection('posts').getOne('', {
							// @ts-expect-error
							expand: [{ key: 'author', fields: ['foo:excerpt(10)'] }],
						})
					})

					it('lets you use modifiers like :excerpt', () => {
						expectTypeOf(pb.collection('comments').getOne).toBeCallableWith('', {
							expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }],
						})
					})

					it("modifiers don't affect types", async () => {
						const withoutModifier = await pb.collection('comments').getOne('', {
							expand: [{ key: 'post', fields: ['id', 'title'] }],
						})
						const withModifier = await pb.collection('comments').getOne('', {
							expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }],
						})

						expectTypeOf(withModifier).toEqualTypeOf<Awaited<typeof withoutModifier>>()
					})
				})

				describe('expand', () => {
					it("can't be expanded with unrelated relations", () => {
						pb.collection('posts').getOne('', {
							// @ts-expect-error
							expand: [{ key: 'author', expand: [{ key: 'tags' }] }],
						})
					})

					it('types single required to-one expand', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [{ key: 'post', expand: [{ key: 'toOneRequired1' }] }],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & { expand: { toOneRequired1: ToOneRequired } }
								}
							}
						>()
					})

					it('types single optional to-one expand', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [{ key: 'post', expand: [{ key: 'toOneOptional1' }] }],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & { expand: { toOneOptional1?: ToOneOptional } }
								}
							}
						>()
					})

					it('types single required to-many expand', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [{ key: 'post', expand: [{ key: 'toManyRequired1' }] }],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & { expand: { toManyRequired1: ToManyRequired[] } }
								}
							}
						>()
					})

					it('types single optional to-many expand', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [{ key: 'post', expand: [{ key: 'toManyOptional1' }] }],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & { expand: { toManyOptional1?: ToManyOptional[] } }
								}
							}
						>()
					})

					it('types multiple expands (to-one required x2)', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneRequired1' }, { key: 'toOneRequired2' }],
								},
							],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & {
										expand: {
											toOneRequired1: ToOneRequired
											toOneRequired2: ToOneRequired
										}
									}
								}
							}
						>()
					})

					it('types multiple expands (to-one required & to-one optional)', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneRequired1' }, { key: 'toOneOptional1' }],
								},
							],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & {
										expand: {
											toOneRequired1: ToOneRequired
										} & {
											toOneOptional1?: ToOneOptional
										}
									}
								}
							}
						>()
					})

					it('types multiple expands (to-one optional x2)', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
								},
							],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & {
										expand: {
											toOneOptional1?: ToOneOptional
											toOneOptional2?: ToOneOptional
										}
									}
								}
							}
						>()
					})

					it('types multiple expands (to-many required x2)', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [
								{
									key: 'post',
									expand: [
										{ key: 'toManyRequired1' },
										{ key: 'toManyRequired2' },
									],
								},
							],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & {
										expand: {
											toManyRequired1: ToManyRequired[]
											toManyRequired2: ToManyRequired[]
										}
									}
								}
							}
						>()
					})

					it('types multiple expands (to-many required & to-many optional)', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [
								{
									key: 'post',
									expand: [
										{ key: 'toManyRequired1' },
										{ key: 'toManyOptional1' },
									],
								},
							],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & {
										expand: {
											toManyRequired1: ToManyRequired[]
										} & {
											toManyOptional1?: ToManyOptional[]
										}
									}
								}
							}
						>()
					})

					it('types multiple expands (to-many optional x2)', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [
								{
									key: 'post',
									expand: [
										{ key: 'toManyOptional1' },
										{ key: 'toManyOptional2' },
									],
								},
							],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & {
										expand: {
											toManyOptional2?: ToManyOptional[]
											toManyOptional1?: ToManyOptional[]
										}
									}
								}
							}
						>()
					})

					it('types multiple expands (to-one required & to-many required)', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired1' }],
								},
							],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & {
										expand: {
											toOneRequired1: ToOneRequired
											toManyRequired1: ToManyRequired[]
										}
									}
								}
							}
						>()
					})

					it('types multiple expands (to-one required & to-many optional)', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
								},
							],
						})

						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & {
										expand: {
											toOneRequired1: ToOneRequired
										} & {
											toManyOptional1?: ToManyOptional[]
										}
									}
								}
							}
						>()
					})

					it('types multiple expands (to-one optional & to-many required)', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired1' }],
								},
							],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & {
										expand: {
											toOneOptional1?: ToOneOptional
										} & {
											toManyRequired1: ToManyRequired[]
										}
									}
								}
							}
						>()
					})

					it('types multiple expands (to-one optional & to-many optional)', async () => {
						const comment = await pb.collection('comments').getOne('', {
							expand: [
								{
									key: 'post',
									expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
								},
							],
						})
						expectTypeOf(comment).branded.toEqualTypeOf<
							Comment & {
								expand: {
									post: Post & {
										expand: {
											toOneOptional1?: ToOneOptional
											toManyOptional1?: ToManyOptional[]
										}
									}
								}
							}
						>()
					})
				})
			})

			describe('in `expand` (to-many)', () => {
				it('returns type as is if `fields` is not specified (required)', async () => {
					const base = await pb
						.collection('base')
						.getOne('', { expand: [{ key: 'toManyRequired1' }] })
					expectTypeOf(base).branded.toEqualTypeOf<
						Base & { expand: { toManyRequired1: ToManyRequired[] } }
					>()
				})

				it('returns type as is if `fields` is not specified (optional)', async () => {
					const base = await pb
						.collection('base')
						.getOne('', { expand: [{ key: 'toManyOptional1' }] })
					expectTypeOf(base).branded.toEqualTypeOf<
						Base & { expand: { toManyOptional1?: ToManyOptional[] } }
					>()
				})

				describe('fields', () => {
					it('returns type with only specified fields', async () => {
						const posts = await pb
							.collection('posts')
							.getOne('', { expand: [{ key: 'tags', fields: ['id', 'name'] }] })
						expectTypeOf(posts).branded.toEqualTypeOf<
							Post & { expand: { tags?: Pick<Tag, 'id' | 'name'>[] } }
						>()
					})

					it('only accepts fields that actually exist', () => {
						pb.collection('posts').getOne('', {
							expand: [{ key: 'tags', fields: ['id', 'name'] }],
						})
						pb.collection('posts').getOne('', {
							// @ts-expect-error
							expand: [{ key: 'tags', fields: ['foo'] }],
						})
						pb.collection('posts').getOne('', {
							// @ts-expect-error
							expand: [{ key: 'tags', fields: ['foo:excerpt(10)'] }],
						})
					})

					it('lets you use modifiers like :excerpt', () => {
						expectTypeOf(pb.collection('users').getOne).toBeCallableWith('', {
							expand: [
								{ key: 'posts_via_author', fields: ['id', 'title:excerpt(10)'] },
							],
						})
					})

					it("modifiers don't affect types", async () => {
						const withoutModifier = await pb.collection('users').getOne('', {
							expand: [{ key: 'posts_via_author', fields: ['id', 'title'] }],
						})
						const withModifier = await pb.collection('users').getOne('', {
							expand: [
								{ key: 'posts_via_author', fields: ['id', 'title:excerpt(10)'] },
							],
						})

						expectTypeOf(withModifier).toEqualTypeOf<Awaited<typeof withoutModifier>>()
					})
				})
				///

				describe('expand', () => {
					it("can't be expanded with unrelated relations", () => {
						pb.collection('posts').getOne('', {
							// @ts-expect-error
							expand: [{ key: 'comments_via_post', expand: [{ key: 'tags' }] }],
						})
					})

					it('types single required to-one expand', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{ key: 'toManyRequired1', expand: [{ key: 'toOneRequired1' }] },
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: { toOneRequired1: ToOneRequired }
									})[]
								}
							}
						>()
					})

					it('types single optional to-one expand', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{ key: 'toManyRequired1', expand: [{ key: 'toOneOptional1' }] },
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: { toOneOptional1?: ToOneOptional }
									})[]
								}
							}
						>()
					})

					it('types single required to-many expand', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{ key: 'toManyRequired1', expand: [{ key: 'toManyRequired2' }] },
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: { toManyRequired2: ToManyRequired[] }
									})[]
								}
							}
						>()
					})

					it('types single optional to-many expand', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{ key: 'toManyRequired1', expand: [{ key: 'toManyOptional1' }] },
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: { toManyOptional1?: ToManyOptional[] }
									})[]
								}
							}
						>()
					})

					it('types multiple expands (to-one required x2)', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneRequired1' }, { key: 'toOneRequired2' }],
								},
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: {
											toOneRequired1: ToOneRequired
											toOneRequired2: ToOneRequired
										}
									})[]
								}
							}
						>()
					})

					it('types multiple expands (to-one required & to-one optional)', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneRequired1' }, { key: 'toOneOptional1' }],
								},
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: {
											toOneRequired1: ToOneRequired
										} & {
											toOneOptional1?: ToOneOptional
										}
									})[]
								}
							}
						>()
					})

					it('types multiple expands (to-one optional x2)', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
								},
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: {
											toOneOptional1?: ToOneOptional
											toOneOptional2?: ToOneOptional
										}
									})[]
								}
							}
						>()
					})

					it('types multiple expands (to-many required x2)', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{
									key: 'toManyRequired1',
									expand: [
										{ key: 'toManyRequired1' },
										{ key: 'toManyRequired2' },
									],
								},
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: {
											toManyRequired1: ToManyRequired[]
											toManyRequired2: ToManyRequired[]
										}
									})[]
								}
							}
						>()
					})

					it('types multiple expands (to-many required & to-many optional)', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{
									key: 'toManyRequired1',
									expand: [
										{ key: 'toManyRequired1' },
										{ key: 'toManyOptional1' },
									],
								},
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: {
											toManyRequired1: ToManyRequired[]
										} & {
											toManyOptional1?: ToManyOptional[]
										}
									})[]
								}
							}
						>()
					})

					it('types multiple expands (to-many optional x2)', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{
									key: 'toManyRequired1',
									expand: [
										{ key: 'toManyOptional1' },
										{ key: 'toManyOptional2' },
									],
								},
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: {
											toManyOptional1?: ToManyOptional[]
											toManyOptional2?: ToManyOptional[]
										}
									})[]
								}
							}
						>()
					})

					it('types multiple expands (to-one required & to-many required)', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired2' }],
								},
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: {
											toOneRequired1: ToOneRequired
											toManyRequired2: ToManyRequired[]
										}
									})[]
								}
							}
						>()
					})

					it('types multiple expands (to-one required & to-many optional)', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
								},
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: {
											toOneRequired1: ToOneRequired
										} & {
											toManyOptional1?: ToManyOptional[]
										}
									})[]
								}
							}
						>()
					})

					it('types multiple expands (to-one optional & to-many required)', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired2' }],
								},
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: {
											toOneOptional1?: ToOneOptional
										} & {
											toManyRequired2: ToManyRequired[]
										}
									})[]
								}
							}
						>()
					})

					it('types multiple expands (to-one optional & to-many optional)', async () => {
						const base = await pb.collection('base').getOne('', {
							expand: [
								{
									key: 'toManyRequired1',
									expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
								},
							],
						})
						expectTypeOf(base).branded.toEqualTypeOf<
							Base & {
								expand: {
									toManyRequired1: (ToManyRequired & {
										expand: {
											toOneOptional1?: ToOneOptional
											toManyOptional1?: ToManyOptional[]
										}
									})[]
								}
							}
						>()
					})
				})
			})
		})

		describe('create', () => {
			it('lets you pass options like "headers"', () => {
				pb.collection('base').create({}, { headers: { a: 'a' } })
			})

			it('infers back relations', async () => {
				const user = await pb
					.collection('users')
					.create({ name: 'test' }, { expand: [{ key: 'posts_via_author' }] })
				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { posts_via_author?: Post[] } }
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

			describe('at top level', () => {
				it('returns type as is if no option is passed', async () => {
					const post = await pb
						.collection('posts')
						.create({ author: '', title: '', tags: [] })
					expectTypeOf(post).toEqualTypeOf<Post>()
				})

				describe('fields', () => {
					it('returns type with only specified fields in options', async () => {
						const post = await pb
							.collection('users')
							.create({ name: 'test' }, { fields: ['id', 'name'] })
						expectTypeOf(post).toEqualTypeOf<Pick<User, 'id' | 'name'>>()
					})

					it('only accepts fields that actually exist', () => {
						pb.collection('comments').create(
							{ post: '', user: '', message: '' },
							{ fields: ['id', 'post', 'message'] }
						)
						pb.collection('comments').create(
							{ post: '', user: '', message: '' },
							// @ts-expect-error
							{ fields: ['foo'] }
						)
						pb.collection('comments').create(
							{ post: '', user: '', message: '' },
							// @ts-expect-error
							{ fields: ['foo:excerpt(10)'] }
						)
					})

					it('lets you use modifiers like :excerpt', () => {
						expectTypeOf(pb.collection('posts').create).toBeCallableWith(
							{ author: '', title: '', tags: [] },
							{ fields: ['id', 'title:excerpt(10)'] }
						)
					})

					it("modifiers don't affect types", async () => {
						const withoutModifier = await pb
							.collection('posts')
							.create(
								{ author: '', title: '', tags: [] },
								{ fields: ['id', 'title'] }
							)
						const withModifier = await pb
							.collection('posts')
							.create(
								{ author: '', title: '', tags: [] },
								{ fields: ['id', 'title:excerpt(10)'] }
							)

						expectTypeOf(withModifier).toEqualTypeOf<Awaited<typeof withoutModifier>>()
					})
				})

				describe('expand', () => {
					it("can't be expanded with unrelated relations", () => {
						pb.collection('comments').create(
							{ post: '', user: '', message: '' },
							// @ts-expect-error
							{ expand: [{ key: 'tags' }] }
						)
					})

					it('types single required to-one expand', async () => {
						const post = await pb
							.collection('posts')
							.create(
								{ author: '', title: '', tags: [] },
								{ expand: [{ key: 'toOneRequired1' }] }
							)
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toOneRequired1: ToOneRequired } }
						>()
					})

					it('types single optional to-one expand', async () => {
						const post = await pb
							.collection('posts')
							.create(
								{ author: '', title: '', tags: [] },
								{ expand: [{ key: 'toOneOptional1' }] }
							)
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toOneOptional1?: ToOneOptional } }
						>()
					})

					it('types single required to-many expand', async () => {
						const post = await pb
							.collection('posts')
							.create(
								{ author: '', title: '', tags: [] },
								{ expand: [{ key: 'toManyRequired1' }] }
							)
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toManyRequired1: ToManyRequired[] } }
						>()
					})

					it('types single optional to-many expand', async () => {
						const post = await pb
							.collection('posts')
							.create(
								{ author: '', title: '', tags: [] },
								{ expand: [{ key: 'toManyOptional1' }] }
							)
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toManyOptional1?: ToManyOptional[] } }
						>()
					})
				})

				describe('in `expand` (to-one)', () => {
					it('returns type as is if `fields` is not specified (required)', async () => {
						const posts = await pb
							.collection('posts')
							.create(
								{ author: '', title: '', tags: [] },
								{ expand: [{ key: 'toOneRequired1' }] }
							)
						expectTypeOf(posts).branded.toEqualTypeOf<
							Post & { expand: { toOneRequired1: ToOneRequired } }
						>()
					})

					it('returns type as is if `fields` is not specified (optional)', async () => {
						const posts = await pb
							.collection('posts')
							.create(
								{ author: '', title: '', tags: [] },
								{ expand: [{ key: 'toOneOptional1' }] }
							)
						expectTypeOf(posts).branded.toEqualTypeOf<
							Post & { expand: { toOneOptional1?: ToOneOptional } }
						>()
					})

					describe('fields', () => {
						it('returns type with only specified fields', async () => {
							const postsWithAuthor = await pb
								.collection('posts')
								.create(
									{ author: '', title: '', tags: [] },
									{ expand: [{ key: 'author', fields: ['id', 'name'] }] }
								)
							expectTypeOf(postsWithAuthor).branded.toEqualTypeOf<
								Post & { expand: { author: Pick<User, 'id' | 'name'> } }
							>()
						})

						it('only accepts fields that actually exist', () => {
							pb.collection('posts').create(
								{ author: '', title: '', tags: [] },
								{ expand: [{ key: 'author', fields: ['id', 'name'] }] }
							)
							pb.collection('posts').create(
								{ author: '', title: '', tags: [] },
								{
									// @ts-expect-error
									expand: [{ key: 'author', fields: ['foo'] }],
								}
							)
							pb.collection('posts').create(
								{ author: '', title: '', tags: [] },
								{
									// @ts-expect-error
									expand: [{ key: 'author', fields: ['foo:excerpt(10)'] }],
								}
							)
						})

						it('lets you use modifiers like :excerpt', () => {
							expectTypeOf(pb.collection('comments').create).toBeCallableWith(
								{ post: '', user: '', message: '' },
								{ expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }] }
							)
						})

						it("modifiers don't affect types", async () => {
							const withoutModifier = await pb
								.collection('comments')
								.create(
									{ post: '', user: '', message: '' },
									{ expand: [{ key: 'post', fields: ['id', 'title'] }] }
								)
							const withModifier = await pb.collection('comments').create(
								{ post: '', user: '', message: '' },
								{
									expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }],
								}
							)

							expectTypeOf(withModifier).toEqualTypeOf<
								Awaited<typeof withoutModifier>
							>()
						})
					})

					describe('expand', () => {
						it("can't be expanded with unrelated relations", () => {
							pb.collection('posts').create(
								{ author: '', title: '', tags: [] },
								{
									// @ts-expect-error
									expand: [{ key: 'author', expand: [{ key: 'tags' }] }],
								}
							)
						})

						it('types single required to-one expand', async () => {
							const comment = await pb.collection('comments').create(
								{ post: '', user: '', message: '' },
								{
									expand: [{ key: 'post', expand: [{ key: 'toOneRequired1' }] }],
								}
							)
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & { expand: { toOneRequired1: ToOneRequired } }
									}
								}
							>()
						})

						it('types single optional to-one expand', async () => {
							const comment = await pb.collection('comments').create(
								{ post: '', user: '', message: '' },
								{
									expand: [{ key: 'post', expand: [{ key: 'toOneOptional1' }] }],
								}
							)
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & { expand: { toOneOptional1?: ToOneOptional } }
									}
								}
							>()
						})

						it('types single required to-many expand', async () => {
							const comment = await pb.collection('comments').create(
								{ post: '', user: '', message: '' },
								{
									expand: [{ key: 'post', expand: [{ key: 'toManyRequired1' }] }],
								}
							)
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & {
											expand: { toManyRequired1: ToManyRequired[] }
										}
									}
								}
							>()
						})

						it('types single optional to-many expand', async () => {
							const comment = await pb.collection('comments').create(
								{ post: '', user: '', message: '' },
								{
									expand: [{ key: 'post', expand: [{ key: 'toManyOptional1' }] }],
								}
							)
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & {
											expand: { toManyOptional1?: ToManyOptional[] }
										}
									}
								}
							>()
						})
					})
				})

				describe('in `expand` (to-many)', () => {
					it('returns type as is if `fields` is not specified (required)', async () => {
						const bases = await pb.collection('base').create(
							{
								stringField: '',
								numberField: 0,
								booleanField: false,
								toOneRequired1: '',
								toOneRequired2: '',
								toManyRequired1: [],
								toManyRequired2: [],
							},
							{ expand: [{ key: 'toManyRequired1' }] }
						)
						expectTypeOf(bases).branded.toEqualTypeOf<
							Base & { expand: { toManyRequired1: ToManyRequired[] } }
						>()
					})

					it('returns type as is if `fields` is not specified (optional)', async () => {
						const bases = await pb.collection('base').create(
							{
								stringField: '',
								numberField: 0,
								booleanField: false,
								toOneRequired1: '',
								toOneRequired2: '',
								toManyRequired1: [],
								toManyRequired2: [],
							},
							{ expand: [{ key: 'toManyOptional1' }] }
						)
						expectTypeOf(bases).branded.toEqualTypeOf<
							Base & { expand: { toManyOptional1?: ToManyOptional[] } }
						>()
					})

					describe('fields', () => {
						it('returns type with only specified fields', async () => {
							const posts = await pb
								.collection('posts')
								.create(
									{ author: '', title: '', tags: [] },
									{ expand: [{ key: 'tags', fields: ['id', 'name'] }] }
								)
							expectTypeOf(posts).branded.toEqualTypeOf<
								Post & { expand: { tags?: Pick<Tag, 'id' | 'name'>[] } }
							>()
						})

						it('only accepts fields that actually exist', () => {
							pb.collection('posts').create(
								{ author: '', title: '', tags: [] },
								{ expand: [{ key: 'tags', fields: ['id', 'name'] }] }
							)
							pb.collection('posts').create(
								{ author: '', title: '', tags: [] },
								{
									// @ts-expect-error
									expand: [{ key: 'tags', fields: ['foo'] }],
								}
							)
							pb.collection('posts').create(
								{ author: '', title: '', tags: [] },
								{
									// @ts-expect-error
									expand: [{ key: 'tags', fields: ['foo:excerpt(10)'] }],
								}
							)
						})

						it('lets you use modifiers like :excerpt', () => {
							expectTypeOf(pb.collection('users').create).toBeCallableWith(
								{ name: 'test' },
								{
									expand: [
										{
											key: 'posts_via_author',
											fields: ['id', 'title:excerpt(10)'],
										},
									],
								}
							)
						})

						it("modifiers don't affect types", async () => {
							const withoutModifier = await pb.collection('users').create(
								{ name: 'test' },
								{
									expand: [{ key: 'posts_via_author', fields: ['id', 'title'] }],
								}
							)
							const withModifier = await pb.collection('users').create(
								{ name: 'test' },
								{
									expand: [
										{
											key: 'posts_via_author',
											fields: ['id', 'title:excerpt(10)'],
										},
									],
								}
							)

							expectTypeOf(withModifier).toEqualTypeOf<
								Awaited<typeof withoutModifier>
							>()
						})
					})
				})
			})
		})

		describe('update', () => {
			it('lets you pass options like "headers"', () => {
				pb.collection('base').update('', {}, { headers: { a: 'a' } })
			})

			it('infers back relations', async () => {
				const user = await pb
					.collection('users')
					.update('', { name: 'test' }, { expand: [{ key: 'posts_via_author' }] })
				expectTypeOf(user).branded.toEqualTypeOf<
					User & { expand: { posts_via_author?: Post[] } }
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

			describe('at top level', () => {
				it('returns type as is if no option is passed', async () => {
					const post = await pb.collection('posts').update('', { title: 'test' })
					expectTypeOf(post).toEqualTypeOf<Post>()
				})

				describe('fields', () => {
					it('returns type with only specified fields in options', async () => {
						const post = await pb
							.collection('users')
							.update('', { name: 'test' }, { fields: ['id', 'name'] })
						expectTypeOf(post).toEqualTypeOf<Pick<User, 'id' | 'name'>>()
					})

					it('only accepts fields that actually exist', () => {
						pb.collection('comments').update(
							'',
							{ message: 'test' },
							{ fields: ['id', 'post', 'message'] }
						)
						pb.collection('comments').update(
							'',
							{ message: 'test' },
							// @ts-expect-error
							{ fields: ['foo'] }
						)
						pb.collection('comments').update(
							'',
							{ message: 'test' },
							// @ts-expect-error
							{ fields: ['foo:excerpt(10)'] }
						)
					})

					it('lets you use modifiers like :excerpt', () => {
						expectTypeOf(pb.collection('posts').update).toBeCallableWith(
							'',
							{ title: 'test' },
							{ fields: ['id', 'title:excerpt(10)'] }
						)
					})

					it("modifiers don't affect types", async () => {
						const withoutModifier = await pb
							.collection('posts')
							.update('', { title: 'test' }, { fields: ['id', 'title'] })
						const withModifier = await pb
							.collection('posts')
							.update('', { title: 'test' }, { fields: ['id', 'title:excerpt(10)'] })

						expectTypeOf(withModifier).toEqualTypeOf<Awaited<typeof withoutModifier>>()
					})
				})

				describe('expand', () => {
					it("can't be expanded with unrelated relations", () => {
						pb.collection('comments').update(
							'',
							{ message: 'test' },
							// @ts-expect-error
							{ expand: [{ key: 'tags' }] }
						)
					})

					it('types single required to-one expand', async () => {
						const post = await pb
							.collection('posts')
							.update('', { title: 'test' }, { expand: [{ key: 'toOneRequired1' }] })
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toOneRequired1: ToOneRequired } }
						>()
					})

					it('types single optional to-one expand', async () => {
						const post = await pb
							.collection('posts')
							.update('', { title: 'test' }, { expand: [{ key: 'toOneOptional1' }] })
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toOneOptional1?: ToOneOptional } }
						>()
					})

					it('types single required to-many expand', async () => {
						const post = await pb
							.collection('posts')
							.update('', { title: 'test' }, { expand: [{ key: 'toManyRequired1' }] })
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toManyRequired1: ToManyRequired[] } }
						>()
					})

					it('types single optional to-many expand', async () => {
						const post = await pb
							.collection('posts')
							.update('', { title: 'test' }, { expand: [{ key: 'toManyOptional1' }] })
						expectTypeOf(post).branded.toEqualTypeOf<
							Post & { expand: { toManyOptional1?: ToManyOptional[] } }
						>()
					})
				})

				describe('in `expand` (to-one)', () => {
					it('returns type as is if `fields` is not specified (required)', async () => {
						const posts = await pb
							.collection('posts')
							.update('', { title: 'test' }, { expand: [{ key: 'toOneRequired1' }] })
						expectTypeOf(posts).branded.toEqualTypeOf<
							Post & { expand: { toOneRequired1: ToOneRequired } }
						>()
					})

					it('returns type as is if `fields` is not specified (optional)', async () => {
						const posts = await pb
							.collection('posts')
							.update('', { title: 'test' }, { expand: [{ key: 'toOneOptional1' }] })
						expectTypeOf(posts).branded.toEqualTypeOf<
							Post & { expand: { toOneOptional1?: ToOneOptional } }
						>()
					})

					describe('fields', () => {
						it('returns type with only specified fields', async () => {
							const postsWithAuthor = await pb
								.collection('posts')
								.update(
									'',
									{ title: 'test' },
									{ expand: [{ key: 'author', fields: ['id', 'name'] }] }
								)
							expectTypeOf(postsWithAuthor).branded.toEqualTypeOf<
								Post & { expand: { author: Pick<User, 'id' | 'name'> } }
							>()
						})

						it('only accepts fields that actually exist', () => {
							pb.collection('posts').update(
								'',
								{ title: 'test' },
								{
									expand: [{ key: 'author', fields: ['id', 'name'] }],
								}
							)
							pb.collection('posts').update(
								'',
								{ title: 'test' },
								{
									// @ts-expect-error
									expand: [{ key: 'author', fields: ['foo'] }],
								}
							)
							pb.collection('posts').update(
								'',
								{ title: 'test' },
								{
									// @ts-expect-error
									expand: [{ key: 'author', fields: ['foo:excerpt(10)'] }],
								}
							)
						})

						it('lets you use modifiers like :excerpt', () => {
							expectTypeOf(pb.collection('comments').update).toBeCallableWith(
								'',
								{ message: 'test' },
								{ expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }] }
							)
						})

						it("modifiers don't affect types", async () => {
							const withoutModifier = await pb.collection('comments').update(
								'',
								{ message: 'test' },
								{
									expand: [{ key: 'post', fields: ['id', 'title'] }],
								}
							)
							const withModifier = await pb.collection('comments').update(
								'',
								{ message: 'test' },
								{
									expand: [{ key: 'post', fields: ['id', 'title:excerpt(10)'] }],
								}
							)

							expectTypeOf(withModifier).toEqualTypeOf<
								Awaited<typeof withoutModifier>
							>()
						})
					})

					describe('expand', () => {
						it("can't be expanded with unrelated relations", () => {
							pb.collection('posts').update(
								'',
								{ title: 'test' },
								{
									// @ts-expect-error
									expand: [{ key: 'author', expand: [{ key: 'tags' }] }],
								}
							)
						})

						it('types single required to-one expand', async () => {
							const comment = await pb.collection('comments').update(
								'',
								{ message: 'test' },
								{
									expand: [{ key: 'post', expand: [{ key: 'toOneRequired1' }] }],
								}
							)
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & { expand: { toOneRequired1: ToOneRequired } }
									}
								}
							>()
						})

						it('types single optional to-one expand', async () => {
							const comment = await pb.collection('comments').update(
								'',
								{ message: 'test' },
								{
									expand: [{ key: 'post', expand: [{ key: 'toOneOptional1' }] }],
								}
							)
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & { expand: { toOneOptional1?: ToOneOptional } }
									}
								}
							>()
						})

						it('types single required to-many expand', async () => {
							const comment = await pb.collection('comments').update(
								'',
								{ message: 'test' },
								{
									expand: [{ key: 'post', expand: [{ key: 'toManyRequired1' }] }],
								}
							)
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & {
											expand: { toManyRequired1: ToManyRequired[] }
										}
									}
								}
							>()
						})

						it('types single optional to-many expand', async () => {
							const comment = await pb.collection('comments').update(
								'',
								{ message: 'test' },
								{
									expand: [{ key: 'post', expand: [{ key: 'toManyOptional1' }] }],
								}
							)
							expectTypeOf(comment).branded.toEqualTypeOf<
								Comment & {
									expand: {
										post: Post & {
											expand: { toManyOptional1?: ToManyOptional[] }
										}
									}
								}
							>()
						})
					})
				})

				describe('in `expand` (to-many)', () => {
					it('returns type as is if `fields` is not specified (required)', async () => {
						const bases = await pb.collection('base').update(
							'',
							{ stringField: 'test' },
							{
								expand: [{ key: 'toManyRequired1' }],
							}
						)
						expectTypeOf(bases).branded.toEqualTypeOf<
							Base & { expand: { toManyRequired1: ToManyRequired[] } }
						>()
					})

					it('returns type as is if `fields` is not specified (optional)', async () => {
						const bases = await pb.collection('base').update(
							'',
							{ stringField: 'test' },
							{
								expand: [{ key: 'toManyOptional1' }],
							}
						)
						expectTypeOf(bases).branded.toEqualTypeOf<
							Base & { expand: { toManyOptional1?: ToManyOptional[] } }
						>()
					})

					describe('fields', () => {
						it('returns type with only specified fields', async () => {
							const posts = await pb.collection('posts').update(
								'',
								{ title: 'test' },
								{
									expand: [{ key: 'tags', fields: ['id', 'name'] }],
								}
							)
							expectTypeOf(posts).branded.toEqualTypeOf<
								Post & { expand: { tags?: Pick<Tag, 'id' | 'name'>[] } }
							>()
						})

						it('only accepts fields that actually exist', () => {
							pb.collection('posts').update(
								'',
								{ title: 'test' },
								{
									expand: [{ key: 'tags', fields: ['id', 'name'] }],
								}
							)
							pb.collection('posts').update(
								'',
								{ title: 'test' },
								{
									// @ts-expect-error
									expand: [{ key: 'tags', fields: ['foo'] }],
								}
							)
							pb.collection('posts').update(
								'',
								{ title: 'test' },
								{
									// @ts-expect-error
									expand: [{ key: 'tags', fields: ['foo:excerpt(10)'] }],
								}
							)
						})

						it('lets you use modifiers like :excerpt', () => {
							expectTypeOf(pb.collection('users').update).toBeCallableWith(
								'',
								{ name: 'test' },
								{
									expand: [
										{
											key: 'posts_via_author',
											fields: ['id', 'title:excerpt(10)'],
										},
									],
								}
							)
						})

						it("modifiers don't affect types", async () => {
							const withoutModifier = await pb.collection('users').update(
								'',
								{ name: 'test' },
								{
									expand: [{ key: 'posts_via_author', fields: ['id', 'title'] }],
								}
							)
							const withModifier = await pb.collection('users').update(
								'',
								{ name: 'test' },
								{
									expand: [
										{
											key: 'posts_via_author',
											fields: ['id', 'title:excerpt(10)'],
										},
									],
								}
							)

							expectTypeOf(withModifier).toEqualTypeOf<
								Awaited<typeof withoutModifier>
							>()
						})
					})
				})
			})
		})
	})
})
