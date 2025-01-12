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

It comes with autocomplete for `key`, `fields`, `expand`, `filter`, and `sort` options, and also properly **types the response** as:

```ts
Pick<Post, 'id' | 'title'> & {
	expand: {
		author: Pick<User, 'id' | 'name'>
		comments_via_post?: Pick<Comment, 'id' | 'message'>[]
	}
}
```

You can try it out in [TS Playground](https://www.typescriptlang.org/play/#code/JYWwDg9gTgLgBAbzgBQgYwNYFMYCECGAzlgCoDKcAvnAGZQQhwBEkmOARkVgLQyFMAoIQHphcYADtCMfBJjB8MLHBgALZYQAmGOAHdgauAE8IAVyhxCadSHwC0EKfDDs4AXjgSsulOmx4ucgAeMmssWwA+AAomJgBKIQFRWhxrOEhpPQNVOAcQECw5QjhZTRV1T3wCuAgacuU8grksKHtHTIyYAHVsgGEGJr53Et18A3T2ADoHABsZrDR5RxjO-jjJgHMcADFTOYAZYGkohAE4c7hksGBMWmAsGc1ik1NPLCxNM4uae8fCAC44ABtJjATRMAA0zHkMHmkOYaCgWEUHyYAF0IUILpcxFgAB5gUpZQxImaKYDtL7nfGEiSaQFA07Y7HYIyApiNQp8AD6ADcFNzOpCqcyfg8ngzQeCoUwCoRCPgtujMSLsckXrlZG9MjTSqqLrq6QymczTaz2aZiFBhabTWK-pKwfCmBIqlh0frzpQMViLt6VWqxLooAZlD8ZkooMV9IZ8KYYOgGGB5kpaNA7uLKnKReHI4CTnAACRUOLuCKIT1wJEwcwSIsAA0LCCYMg2APmEg2aiY1HLAEY4AAyQdF5ucop8gWdSaWlqTMnSfYQDaSHtwAD85YAAiBHGoyDJYPWRZQBJQEkkxGplEjCHt4EcSvGGOS0Pg5kYVEYwB8BDBv8oqDSD0aj9PkXLFB4yDVvINBGEE-4-rU6QQMBfQDBBESXtiAB666JMIABUcDcqRZHkWRcAAKryDMxQUQxpFwIRwh-gBKAwcAcFBCQ5YeEgQIANLiHWrLISQaKAtBOCwfBJBCWi5bUCOCCnkkxGMQxcChDY+AkZp5HMaxkiRjQ+BoIBfg4AQxD9HMCxLHWJrnGCgLSCGnYioiyJKPSlgwB5GwiqYYCaCifnuZIQVqQIJktGZFnUVacD4kodLFKgbABLZED2YsFJOSKroFG5AVRSKC4wEuK4SKVgVnkIcVQAllk6niaVPL4WU2VgdnzPljgVticZqNAdXldiMLzONnmTYqAJwAAglAUD4PBkWdlhalNS1cAkIqKXtYUnWZf4PV9Q5BVDRcxVYDN0WNc0zXmcoYGDIdHUZVZ2W9bl-WOdd5ydPdwVWiD2JygqWwg2piHKDp4R6fxoMtAtSBw4CVHJae2KrICznMhjvjSJWpLku0+OVsN8aqGNSUtFTFytoQ66AvtGxAmilY436IrM-jX4-mzB08+c458JTtqC3dcBvVypMPOTUiS1LFzA8TMCM+cs5QJjVrcyeDVAA)

## Installation

```sh
npm install pocketbase-ts
```

```sh
pnpm add pocketbase-ts
```

> [!NOTE]
> This package doesn't strictly follow SemVer and treats 1.x.x like 0.x.x as the name `pocketbase-ts` apparently belonged to another package previously and npm didn't let me publish 0.x.x.

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
	// relation fields are defined as strings because they are IDs of the related items
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
			tags?: Array<Tag>
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

## Helper for `filter` & `sort`

While you can still write `filter` and `sort` as string, you can also use the provided `$` tagged template literal helper to get intellisense for the field names.

```ts
const result = await pb.collection('posts').getFullList({
	filter: ({ $ }) => $`${'author.role'} = "admin" && ${'comments_via_post.message'} ?~ 'hello'`,
	sort: ({ $ }) => $`${'created'},${'author.name'}`,
	expand: [{ key: 'comments_via_post' }],
})
```

This function is merely there to provide you with intellisense and help mitigate typos. It does not do any type narrowing or validation.  
(i.e. the example above will still have `?` modifier on `expand` in the response type.)

### Maximum expand depth

While PocketBase supports expanding relations up to 6 levels deep, the number of fields increases exponentially with each level.  
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
		type: Record<PropertyKey, any> // collection type
		relations?: {
			[fieldName: string]: Record<PropertyKey, any> // relation type
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

### Batch requests

The response of batch requests (introduced in the official SDK v0.22.0) is not typed.  
There are many cases where it's impossible to know the shape of the request until runtime.

For example:

```ts
const batch = pb.createBatch()

for (const user of users) {
	if (condition) {
		batch.collection('users').update(user.id, ...)
	} else {
		batch.collection('users').delete(user.id)
	}
}

const response = batch.send()
```
