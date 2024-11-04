import { describe, expectTypeOf, it } from 'vitest'
import PocketBaseTS from './index.js'

interface PocketBaseCollection {
	id: string
	created: string
	updated: string
}

interface User extends PocketBaseCollection {
	name: string
}

interface Post extends PocketBaseCollection {
	user: string
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
	users: User
	posts: Post
	tags: Tag
	comments: Comment
}

type Relations = {
	post: Post
	user: User
	tags?: Array<Tag>

	posts_via_tags?: Array<Post>
	posts_via_user?: Array<Post>
	comments_via_post?: Array<Comment>
	comments_via_user?: Array<Comment>
}

describe('Type Utils', () => {
	const pb = new PocketBaseTS<Schema, Relations>()

	it("shouldn't touch type when no option is provided", async () => {
		const post = await pb
			.collection('posts')
			.getOne('')
			.catch(() => null!)
		expectTypeOf(post).toEqualTypeOf<Post>()
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

	it('should correctly type expand (depth=1)', async () => {
		// single required relation
		const postWithUser = await pb
			.collection('posts')
			.getOne('', { expand: [{ key: 'user' }] })
			.catch(() => null!)
		expectTypeOf(postWithUser).toEqualTypeOf<Post & { expand: { user: User } }>()

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
			Post & { expand?: { comments_via_post: Array<Comment> } }
		>()

		// multiple optional relations
		const postWithCommentsAndTags = await pb
			.collection('posts')
			.getOne('', { expand: [{ key: 'comments_via_post' }, { key: 'tags' }] })
			.catch(() => null!)
		expectTypeOf(postWithCommentsAndTags).toEqualTypeOf<
			Post & { expand?: { comments_via_post?: Array<Comment>; tags?: Array<Tag> } }
		>()

		// optional and required relations mixed
		const postWithCommentsAndUser = await pb
			.collection('posts')
			.getOne('', { expand: [{ key: 'comments_via_post' }, { key: 'user' }] })
			.catch(() => null!)
		expectTypeOf(postWithCommentsAndUser).toEqualTypeOf<
			Post & { expand: { comments_via_post?: Array<Comment>; user: User } }
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
						key: 'posts_via_user',
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
					posts_via_user: Array<
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
