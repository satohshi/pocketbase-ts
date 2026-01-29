import { describe, it, expectTypeOf } from 'vitest'
import type { SchemaDeclaration } from './schema.js'

export interface PocketBaseCollection {
	id: string
}

export interface User extends PocketBaseCollection {
	name: string
	age: number
	verified: boolean
	pinnedPost: string
}

export interface Post extends PocketBaseCollection {
	author: string
	title: string
	likes: number
	tags: string[]
	multiSelect: ('a' | 'b' | 'c')[]
	published: boolean
	createdAt: string
}

export interface Tag extends PocketBaseCollection {
	name: string
}

export interface Comment extends PocketBaseCollection {
	post: string
	user: string
	likes: number
	message: string
}

export interface CourseRegistrations extends PocketBaseCollection {
	user: string
}

export type TestSchema = {
	users: {
		type: User
		relations: {
			pinnedPost?: Post
		}
	}
	posts: {
		type: Post
		relations: {
			author: User
			tags: Tag[]
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
	courseRegistrations: {
		type: CourseRegistrations
		relations: {
			user: User
		}
	}
}

describe('test schema', () => {
	it('extends SchemaDeclaration', () => {
		expectTypeOf<TestSchema>().toExtend<SchemaDeclaration>()
	})
})
