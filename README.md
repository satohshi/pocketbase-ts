# PocketBase Typed SDK

A small wrapper around the official [PocketBase JavaScript SDK](https://github.com/pocketbase/js-sdk) that allows you to write options in a more human-readable way, and also types the response for you.

This is how you would normally write options for the PocketBase SDK:

```js
{
	expand: 'comments_via_post,tags',
	fields: 'id,title,expand.comments_via_post.user,expand.comments_via_post.message,expand.tags.id,expand.tags.name'
}
```

Writing options manually like this is very error-prone, and makes the code very hard to read and maintain.

This wrapper allows you to write it like this instead:

```js
{
	fields: ['id', 'title'],
	expand: [
		{ key: 'tags', fields: ['id', 'name'] },
		{ key: 'comments_via_post', fields: ['user', 'message'] },
	]
}
```

It comes with autocomplete for `fields`, `expand`, `key`, and the basic `sort` options, and also properly **types the response** as:

```ts
Pick<Post, 'id' | 'title'> & {
	expand: {
		tags: Pick<Tag, 'id' | 'name'>[]
		comments_via_post?: Pick<Comment, 'user' | 'message'>[]
	}
}
```

## Installation

```sh
npm install pocketbase-ts
```

```sh
pnpm add pocketbase-ts
```

## Usage

### Defining schema

Below is an example of how you would define the schema for [this](https://pocketbase.io/docs/working-with-relations/) in the PocketBase docs.

```ts
interface PocketBaseCollection {
	id: string
	created: string
	updated: string
}

interface User extends PocketBaseCollection {
	name: string
}

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

// you need to use "type" instead of "interface" here
type Schema = {
	// collection name as key
	users: { type: User }
	posts: {
		type: Post
		relFields: {
			// field name as key
			author: User
			// add "?" modifier to annotate optional relation fields
			tags?: Tag[]
		}
	}
	tags: { type: Tag }
	comments: {
		type: Comment
		relFields: {
			post: Post
			user: User
		}
	}
}
```

> [!NOTE]
> Back-relations will automatically be inferred from the schema, so in most cases, you don't need to define them yourself.  
> However, in some cases, you may need to define them explicitly. See [Caveats](#caveats) for more information.

### Instantiating the SDK

```ts
import PocketBaseTS from 'pocketbase-ts'

const pb = new PocketBaseTS<Schema>('http://127.0.0.1:8090')
```

### Building query

Use it just like you would with the official SDK, but with a more readable option syntax:

```ts
const result = await pb.collection('posts').getOne({
	// you can specify fields to be returned in the response
	fields: ['id', 'title', 'tags'],
	expand: [
		{
			// returns all fields if not specified
			key: 'author',
		},
		{
			key: 'comments_via_post',
			// you can use `:excerpt` modifier on string fields
			fields: ['message:excerpt(20)'],
			// nesting `expand` is supported
			expand: [{ key: 'user', fields: ['name'] }],
		},
	],
})
```

The result is automatically typed as:

```ts
Pick<Post, "tags" | "id" | "title"> & {
	expand: {
		author: User
		comments_via_post?: (Pick<Comment, "message"> & {
			expand: {
				user: Pick<User, "name">
			}
		})[]
	}
}
```

## Type for `Schema`:

```ts
interface SchemaDeclaration {
	[collectionName: string]: {
		type: Record<string, any> // collection type
		relFields?: {
			[fieldName: string]: Record<string, any> // relation type
		}
	}
}
```

## Handling of `expand`

Let's say you want to fetch a post with its comments using `expand`.  
When the post doesn't have any comments, the SDK (or PocketBase itself rather) returns something like this:

```ts
{
	id: "1",
	title: "Lorem ipsum",
	tags: ["lorem", "ipsum"],
	created: "2024-01-01T00:00:00.000Z",
	updated: "2024-01-01T00:00:00.000Z"
}
```

The response will not have

```ts
{
	expand: {
		comments_via_post: []
	}
}
// or not even { expand: undefined } for that matter
```

So you will get a runtime error if you try to access `post.expand.comments_via_post` on a post with no comments.

To handle cases like this, the wrapper will add the `?` modifier to `expand` itself if all the specified expands are for optional relation fields.

```ts
Post & {
	expand?: {
		comments_via_post: Comment[]
	}
}
// or with multiple optional relations
Post & {
	expand?: {
		tags?: Tag[]
		comments_via_post?: Comment[]
	}
}
```

If you expand it along with fields that are not optional like `author`, `expand` will be present regardless of whether the post has comments or not.

So the response will be typed as:

```ts
Post & {
	expand: {
		author: User
		comments_via_post?: Comment[]
	}
}
```

## Caveats:

### Back-relations

By default, all back-relations are treated as **nullable** (e.g. `Post` may not have any `Comment`), and **to-many** (e.g. `comments_via_post` will be of type `Comment[]`).  
The former can be dealt with by simply adding the non-null assertion operator `!`, but the latter is a different story.

If you have a `UNIQUE` index constraint on the relation field, the item in `expand` will be of type `T` instead of `T[]`.

In such case, you can override the default behaviour by explicitly defining back-relations yourself in the schema.

```diff
type Schema = {
	...
	users: {
		type: User
		relFields: {
			...
-			userDetail_via_user?: UserDetail[] // default (implicit/inferred)
+			userDetail_via_user: UserDetail // made non-nullable by removing the `?`
		}
	}
	...
}
```

### Dealing with tables with exactly the same properties

In the [example above](#defining-schema-and-relations), `User` and `Tag` have the exact same shape.  
The current implementation doesn't handle cases like this very well when checking for back-relations.

I am working on a fix for this, but in the meantime, you can use a workaround like this:

```ts
interface User extends PocketBaseCollection {
	name: string

	readonly _: unique symbol // add a field that can never overlap
}
// and/or
interface Tag extends PocketBaseCollection {
	name: string

	readonly _: unique symbol
}
```
