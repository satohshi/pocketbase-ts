# PocketBase Typed SDK

A little wrapper around the official [PocketBase JavaScript SDK](https://github.com/pocketbase/js-sdk) that allows you to write options in a more human readable way, and types the response for you.

This is how you would normally write options for the PocketBase SDK:

```js
{
    expand: 'comments_via_post,tags',
    fields: 'id,title,expand.comments_via_post.user,expand.comments_via_post.message,expand.tags.id,expand.tags.name'
}
```

Writing options manually like this is very error-prone, and makes the code very hard to read/maintain.

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

It comes with autocomplete for `fields`, `expand` and the basic `sort` options, and also **types the response**.

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

## Usage

### Defining schema and relations

Below is an example of how you would define the schema for [this](https://pocketbase.io/docs/working-with-relations/) in the PocketBase docs.

```ts
interface PocketbaseCollection {
	id: string
	created: string
	updated: string
}

interface User extends PocketBaseCollection {
	name: string
}

interface Post extends PocketBaseCollection {
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

// You need to use "type" instead of "interface" for these as interfaces are "mutable"
// TypeScript needs to know the keys are guaranteed to be of type "string"
type Schema = {
	// Table names as keys
	users: User
	posts: Post
	tags: Tag
	comments: Comment
}

type Relations = {
	// column names as keys
	user: User
	post: Post

	// if the relation is one-to-many or many-to-many, use Array<>
	tags: Array<Tag>

	// back-relations
	posts_via_tags: Array<Post>
	// OR
	'posts(tags)': Array<Post> // if you're using PB < 0.22.0
	// the old syntax will be supported until PB hard-deprecates it or it gets too annoying to maintain

	// Add "?" modifier to annotate optional relation fields
	comments_via_post?: Array<Comment> // i.e. post might not have any comments
	comments_via_user?: Array<Comment> // i.e. user might not have any comments
}
```

### Instantiating the SDK

```ts
import PocketBaseTS from 'pocketbase-ts'

const pb = new PocketBaseTS<Schema, Relations>('http://127.0.0.1:8090')
```

### Building query

Use it just like you would with the official SDK, but with a more readable option syntax:

```ts
const result = await pb.collection('posts').getOne({
	// you can specify fields to be returned in the response
	fields: ['id', 'title', 'tags'],
	expand: [
		{
			key: 'tags',
			// returns all fields if not specified
		},
		{
			key: 'comments_via_post',
			// you can use :excerpt modifier on string fields
			fields: ['message:excerpt(20)'],
			// nesting "expand" is supported
			expand: [{ key: 'user', fields: ['name'] }],
		},
	],
})
```

The result is automatically typed as:

```ts
Pick<Post, "tags" | "id" | "title"> & {
    expand: {
        tags: Array<Tag>
        comments_via_post?: (Pick<Comment, "message"> & {
            expand: {
                user: Pick<User, "name">
            }
        })[]
    }
}
```

### Type for `options`:

```ts
{
    // Array of fields you want to be returned in the response
    fields?: Array<keyof Schema[key]> // defaults to all fields if not specified

    // Array of relations you want to be returned in the response
    expand?: Array<ExpandItem>

    // These will be passed to the SDK as is
    sort?: string
	page?: number
    filter?: string
	perPage?: number
	skipTotal?: boolean
    requestKey?: string
}

ExpandItem {
    // Relation name as defined in "Relations"
    key: keyof Relations

    fields?: // same as above
    expand?: // same as above
}
```

### Handling of optional relation fields

Let's say you want to get a post with its comments using `expand`.  
When the post doesn't have any comments, the SDK (or PocketBase itself rather) returns:

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

So you will get runtime error if you try to access `post.expand.comments_via_post` on a post with no comments.

To handle cases like this, the wrapper will add `?` modifier to the `expand` field itself if all the specified expands are for optional relation fields.

```ts
Post & {
    expand?: {
        comments_via_post: Comment[]
    }
}
// or with multiple optional relations
Post & {
    expand?: {
        foo?: Foo
        comments_via_post?: Comment[]
    }
}
```

If you expand it along with fields that are not optional like `tag`, `expand` will be there regardless of whether the post has comments or not.

So the response will be typed as:

```ts
Post & {
    expand: {
        tag: Array<Tag>
        comments_via_post?: Comment[]
    }
}
```

## Caveat:

In order for back-relations to work, you need to have the forward-relations defined as well.

```ts
type Relations = {
	// This alone is not enough
	comments_via_post: Array<Comment>

	// You need to have this defined as well
	post: Post
}

const result = await pb.collection('posts').getFullList({
	expand: [
		{
			// Without "post: Post", TS will complain and you won't get autocomplete or typesafety
			key: 'comments_via_post',
		},
	],
})
```
