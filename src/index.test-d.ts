import { describe, expectTypeOf, it } from 'vitest'

import { PocketBaseTS, type UniqueCollection } from './index.js'

interface PocketBaseCollection {
	id: string
	created: string
	updated: string
}

type User = UniqueCollection<{ name: string } & PocketBaseCollection, 'users'>

interface Post extends PocketBaseCollection {
	author: string
	title: string
	tags: Array<string>
}

interface Tag extends PocketBaseCollection {
	name: string
}

interface Comment extends PocketBaseCollection {
	post: string
	user: string
	message: string
}

type Schema = {
	users: { type: User }
	posts: {
		type: Post
		relations: {
			author: User
			tags?: Tag[]
		}
	}
	tags: { type: Tag }
	comments: {
		type: Comment
		relations: {
			post: Post
			user: User
		}
	}
}

describe('pocketbase-ts', () => {
	const pb = new PocketBaseTS<Schema>()

	it("shouldn't touch type when no option is provided", async () => {
		const post = await pb
			.collection('posts')
			.getOne('')
			.catch(() => null!)
		expectTypeOf(post).toEqualTypeOf<Post>()
	})

	it("shouldn't allow expand for other tables even though they are the same shape", async () => {
		await pb
			.collection('tags')
			.getFullList({
				// @ts-expect-error
				expand: [{ key: 'comments_via_user' }],
			})
			.catch(() => null!)
	})

	it('should only include specified fields', async () => {
		const post = await pb
			.collection('posts')
			.getOne('', {
				fields: ['id', 'title'],
			})
			.catch(() => null!)

		expectTypeOf(post).toEqualTypeOf<Pick<Post, 'id' | 'title'>>()
	})

	it('should be able to handle modifiers like :excerpt at top level', async () => {
		const post = await pb
			.collection('posts')
			.getOne('', {
				fields: ['id', 'title:excerpt(10)'],
			})
			.catch(() => null!)

		expectTypeOf(post).toEqualTypeOf<Pick<Post, 'id' | 'title'>>()
	})

	it('should be able to handle modifiers like :excerpt on expanded item', async () => {
		const post = await pb
			.collection('posts')
			.getOne('', {
				expand: [{ key: 'comments_via_post', fields: ['message:excerpt(10)'] }],
			})
			.catch(() => null!)

		expectTypeOf(post).toEqualTypeOf<
			Post & { expand?: { comments_via_post: Array<Pick<Comment, 'message'>> } }
		>()
	})

	it('should correctly type expand (depth=1)', async () => {
		// single required relation
		const postWithUser = await pb
			.collection('posts')
			.getOne('', { expand: [{ key: 'author' }] })
			.catch(() => null!)
		expectTypeOf(postWithUser).toEqualTypeOf<Post & { expand: { author: User } }>()

		// single optional forward relation
		const postWithTags = await pb
			.collection('posts')
			.getOne('', { expand: [{ key: 'tags' }] })
			.catch(() => null!)
		expectTypeOf(postWithTags).toEqualTypeOf<Post & { expand?: { tags: Array<Tag> } }>()

		// single optional back relation
		const postWithComments = await pb
			.collection('posts')
			.getOne('', { expand: [{ key: 'comments_via_post' }] })
			.catch(() => null!)
		expectTypeOf(postWithComments).toEqualTypeOf<
			Post & {
				expand?: { comments_via_post: Array<Comment> }
			}
		>()

		// multiple optional relations
		const postWithCommentsAndTags = await pb
			.collection('posts')
			.getOne('', { expand: [{ key: 'comments_via_post' }, { key: 'tags' }] })
			.catch(() => null!)
		expectTypeOf(postWithCommentsAndTags).toEqualTypeOf<
			Post & {
				expand?: {
					comments_via_post?: Array<Comment>
					tags?: Array<Tag>
				}
			}
		>()

		// optional and required relations mixed
		const postWithCommentsAndUser = await pb
			.collection('posts')
			.getOne('', { expand: [{ key: 'comments_via_post' }, { key: 'author' }] })
			.catch(() => null!)
		expectTypeOf(postWithCommentsAndUser).toEqualTypeOf<
			Post & {
				expand: { comments_via_post?: Array<Comment> } & {
					author: User
				}
			}
		>()
	})

	it('should let you override back-relations', async () => {
		type Schema2 = {
			users: { type: User }
			posts: {
				type: Post
				relations: {
					user: User
					tags?: Tag[]

					comments_via_post: Comment
				}
			}
			tags: { type: Tag }
			comments: {
				type: Comment
				relations: {
					post: Post
					user: User
				}
			}
		}

		const pb2 = new PocketBaseTS<Schema2>()

		const postWithComments = await pb2
			.collection('posts')
			.getOne('', { expand: [{ key: 'comments_via_post' }] })
			.catch(() => null!)

		expectTypeOf(postWithComments).toEqualTypeOf<
			Post & {
				expand: { comments_via_post: Comment }
			}
		>()
	})

	it('should correctly type fields in expand (depth=1)', async () => {
		// witout specifying fields at top level
		const post = await pb
			.collection('posts')
			.getOne('', {
				expand: [
					{ key: 'tags', fields: ['name'] },
					{ key: 'comments_via_post', fields: ['message'] },
				],
			})
			.catch(() => null!)
		expectTypeOf(post).toEqualTypeOf<
			Post & {
				expand?: {
					tags?: Array<Pick<Tag, 'name'>>
					comments_via_post?: Array<Pick<Comment, 'message'>>
				}
			}
		>()

		// specifying fields at top level
		const postWithFields = await pb
			.collection('posts')
			.getOne('', {
				fields: ['title'],
				expand: [
					{ key: 'tags', fields: ['name'] },
					{ key: 'comments_via_post', fields: ['message'] },
				],
			})
			.catch(() => null!)
		expectTypeOf(postWithFields).toEqualTypeOf<
			Pick<Post, 'title'> & {
				expand?: {
					tags?: Array<Pick<Tag, 'name'>>
					comments_via_post?: Array<Pick<Comment, 'message'>>
				}
			}
		>()
	})

	it("should handle nested expand's correctly", async () => {
		const user = await pb
			.collection('users')
			.getOne('', {
				expand: [
					{
						key: 'posts_via_author',
						expand: [
							{ key: 'comments_via_post', fields: ['message'] },
							{
								key: 'tags',
								fields: ['name'],
							},
						],
					},
				],
			})
			.catch(() => null!)

		expectTypeOf(user).toEqualTypeOf<
			User & {
				expand?: {
					posts_via_author: Array<
						Post & {
							expand?: {
								comments_via_post?: Array<Pick<Comment, 'message'>>
								tags?: Array<Pick<Tag, 'name'>>
							}
						}
					>
				}
			}
		>()
	})
})
