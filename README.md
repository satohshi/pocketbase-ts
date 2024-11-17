# PocketBase Typed SDK

A small wrapper around the official [PocketBase JavaScript SDK](https://github.com/pocketbase/js-sdk) that allows you to write options in a more human-readable way, and also types the response for you.

This is how you would normally write options for the PocketBase SDK:

```js
const postsWithAuthorAndComments = await pb.collection('posts').getFullList({
	expand: 'author,comments_via_post'
	fields: 'id,title,expand.author.id,expand.author.name,expand.comments_via_post.id,expand.comments_via_post.message',
})
```

Writing options manually like this is very error-prone, and makes the code very hard to read and maintain.

This wrapper allows you to write it like this instead:

```js
const postsWithAuthorAndComments = await pb.collection('posts').getFullList({
	fields: ['id', 'title'],
	expand: [
		{ key: 'author', fields: ['id', 'name'] },
		{
			key: 'comments_via_post',
			fields: ['id', 'message'],
		},
	],
})
```

It comes with autocomplete for `fields`, `expand`, `key`, and the basic `sort` options, and also properly **types the response** as:

```ts
Pick<Post, 'id' | 'title'> & {
	expand: {
		author: Pick<User, 'id' | 'name'>
		comments_via_post?: Pick<Comment, 'id' | 'message'>[]
	}
}
```

You can try it out in [TS Playground](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgBQgYwNYFMYCECGAzlgCoDKANHDAJ5hZwCqAdsAI4CuWAwhADZ8saGMAjM4AXzgAzKBBBwARJEw4ARkSwBaGIUUAoQwHojcYM0Ix8zEfhgMYACwaEAJhjgB3YE7g0IHFBwhGjOIPj6aGKWcGBqcAC8cMxYnijo2Hia5AA8ZKFY4QB8ABSKigCUhvomMjihsRAx3r5RICBYNoRw1q7Uzsn4HXAQ0v0MbR02WFCR0fCQlgDqPo687Z26iT2e+D6xagB0UQJCImJli7qVhwDmOABiHAIAMsCWJQj6cD8ywFh8VyEABccAA2opgK5FFRFCIYIIYUo0FAsHYsNCALoUb6-LAADzAvVBYK+v3JcGwNFBikmm0IAH0AG7AfAMq4w3EUv4AoEkyHQ2EdQiEfD3RTYrkUglE5iuElk7kUqk0jjEKCcpUU6T-QEg8ECpGKZhDLASqXkiSYqVW-QSKrGUxOBiowjPeDvHocGDyOzAND4AQ0ah0DH6Wj0dLLVbrKZbJLIVEwETSGg5CNYUaNaNOWP0oo1Uy-AB6AH5qkYAFRwBm1uv1utMER8boNtu1uCVozh0MoJMptMkIrbJBggDSZnEVKzJExoMTOAHORI48xw6kADJEBJjNX2224Pkwvga-v653u+Z7FBpPg0AxUKossReKdhKJxIqflDQZYoOZbilFE0XseVghgf9mEA8kODAVx0TAv8ALtQwMyYdVthYdguFfQR3zEHIkBNDpfwggDJDgLdH0yAgX34PDzmYKgAHI1RmQhmILfQrxmW97yjeACXsOVumonBaJ4eizg-RApXwb1HGgUjIOg354UEZTkPJKxbn1ABBKAoHwNMkKggsd246YbzvBgSDFOAhM6IF0ifCTcOksRZPJYisE0qCUMs68+IYPMbAc-FhOcsTn0kt9GK834rj81SfjYqBkqlYVRXuDKLLQo9ChPJIvzgNL9SQDNQUYDCd3JK5yotNTQ3nJoYEan5UT4P1olBEqtXkpwlPQmZ2opHTCFLUE7NuMFrS1WrfgWn5xt6kN6Cm+ylrgOkul60bKrgUK2q1TruosPatTq1qWssUaYPVKr1VGradx3IA)

## Installation

```sh
npm install pocketbase-ts
```

```sh
pnpm add pocketbase-ts
```

## Usage

### Defining schema

> [!TIP]
> I recommend using [this hook](https://github.com/satohshi/pocketbase-ts-schema-generator) to generate the schema during development.  
> It will watch for any changes made to the collections and update the schema file accordingly, keeping everything in sync.

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
		relations: {
			// field name as key
			author: User
			// add "?" modifier to annotate optional relation fields
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
```

> [!NOTE]
> Back-relations will automatically be inferred from the schema, so in most cases, you don't need to define them yourself.  
> However, in some cases, you may need to define them explicitly. See [Caveats](#caveats) for more information.

### Instantiating the SDK

```ts
import { PocketBaseTS } from 'pocketbase-ts'

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

## Filter helper

While you can use the normal string-based filter, you can also use the provided `f` tagged template literal helper to get intellisense for the field names.

```ts
const result = await pb.collection('posts').getFullList({
	filter: ({ f }) => f`${'author.role'} = "admin" && ${'comments_via_post.message'} ?~ 'hello'`,
	expand: [{ key: 'comments_via_post' }],
})
```

This function is merely there to provide you with intellisense and help mitigate typos. It does not do any type narrowing or validation.  
(i.e. the example above will still have `?` modifier on `expand` in the response type.)

### Maximum expand depth

While PocketBase supports expanding relations up to 6 levels deep, the number of filterable fields increases exponentially with each level.  
The performance hit was very noticeable when I tried to set it to 6 even with the simple schema in the example above.

As such, I've set the maximum depth to 2 by default.

However, should you wish to expand further, you can adjust the maximum depth by passing it as the second type argument when instantiating the SDK.

```ts
const pb = new PocketBaseTS<Schema, 6>('')
```

## Type for `Schema`:

```ts
interface SchemaDeclaration {
	[collectionName: string]: {
		type: Record<string, any> // collection type
		relations?: {
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
		relations: {
			...
-			userDetail_via_user?: UserDetail[] // default (implicit/inferred)
+			userDetail_via_user: UserDetail // made non-nullable by removing the `?`
		}
	}
	...
}
```

### Dealing with tables with exactly the same properties

In the [example above](#defining-schema), `User` and `Tag` have the exact same shape, and there is no way for TypeScript to differentiate between the two.  
To make it clear to TypeScript that they are different, you can use the `UniqueCollection` utility type provided by this package.

```ts
import type { UniqueCollection } from 'pocketbase-ts'

// pass in the collection name as the second type argument to ensure uniqueness
type User = UniqueCollection<{ name: string } & PocketBaseCollection, 'users'>
```

Without this, TypeScript will confuse back-relations pointing to `User` and `Tag` and suggest that `users` can be expanded with `posts_via_tags`, etc.
