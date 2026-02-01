# PocketBase Typed SDK

- [PocketBase Typed SDK](#pocketbase-typed-sdk)
    - [Overview](#overview)
    - [Demo](#demo)
    - [Installation](#installation)
    - [Usage](#usage)
        - [Defining schema](#defining-schema)
            - [Schema interface](#schema-interface)
        - [Instantiating the SDK](#instantiating-the-sdk)
        - [Building query](#building-query)
    - [Helper functions for `filter` and `sort`](#helper-functions-for-filter-and-sort)
        - [Filter](#filter)
            - [and](#and)
            - [or](#or)
            - [eq/ne](#eqne)
            - [gt/gte/lt/lte](#gtgteltlte)
            - [like/notLike](#likenotlike)
            - [anyEq/anyNe](#anyeqanyne)
            - [anyGt/anyGte/anyLt/anyLte](#anygtanygteanyltanylte)
            - [anyLike/anyNotLike](#anylikeanynotlike)
            - [between/notBetween](#betweennotbetween)
            - [inArray/notInArray](#inarraynotinarray)
        - [Sort](#sort)
        - [Maximum expand depth](#maximum-expand-depth)
    - [Caveats:](#caveats)
        - [Back-relations](#back-relations)
        - [Dealing with tables with exactly the same properties](#dealing-with-tables-with-exactly-the-same-properties)
        - [Batch requests](#batch-requests)

## Overview

`pocketbase-ts` is a wrapper around the official [PocketBase JavaScript SDK](https://github.com/pocketbase/js-sdk) that allows you to write options like this:

```js
const postsWithAuthorAndComments = await pb.collection('posts').getFullList({
    fields: ['id', 'title'],
    expand: [
        {
            key: 'author',
            fields: ['id', 'name'],
        },
        {
            key: 'comments_via_post',
            fields: ['id', 'message'],
        },
    ],
})
```

instead of:

```js
const postsWithAuthorAndComments = await pb.collection('posts').getFullList({
    expand: 'author,comments_via_post',
    fields: 'id,title,expand.author.id,expand.author.name,expand.comments_via_post.id,expand.comments_via_post.message',
})
```

and types the response as:

```ts
type PostsWithAuthorAndComments = Pick<Post, 'id' | 'title'> & {
    expand: {
        author: Pick<User, 'id' | 'name'>
        comments_via_post?: Pick<Comment, 'id' | 'message'>[]
    }
}
```

It comes with autocomplete for collection names, field names, relation names, etc.

## Demo

You can try it out in [TS Playground](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgBQgYwNYFMYCECGAzlgCoDKcAvnAGZQQhwDkkmOARkVgLQyFMAoAQHphcYADtCMfBJjB8MLHBgALZYQAmGOAHdgauAE8IAVyhxCadSHwC0EKfDDs4AXjgSsulOmx4ucgAeMmssWwA+AAomJgBKIVFaHGs4SGk9A1U4BxAQLDlCOFlNFXVPfHy4CBoy5Vz8uSwoe0cM9JgAdSyAYQZGvndi3XwDNPYAOgcAG2msNHlHGI7+OImAcxwAMVNZgBlgaSiEATgzuCSwYExaYCxpzSKTU08sLE1T85o7h8IALjgAG0mMBNEwADTMeQwOYQ5hoKBYRTvJgAXXBQnOFzEWAAHmASplDIjpopgG1Pmc8QSJJoAYDKVjEIymedsEYAUwGgU+AB9ABuCl5HQhLNZt3uj3pTHyhEI+E2aIxYtZSWeOVkrwy1JKKqZOtp9L14uZJrNbKwHOYpmIUFF5vN30l-yBILBkKYEkqWCVxvFlAxDrg6L1AcZIcZSV0UAMym+0yUFkJhGg8H0hnwphg6AYYDmSmKtJURjAPHlNBwRjgNsk6zg6mmpYsNFMEgW5KkjPjiYBx0LmkhWAAjpD1vBKHF3BFTeLETBzBJ+1ExzFpsBsPxIQBGAAMcUHQ5imbU0Am-OawCd7pUUFMWDiCSxYcZKdgvaQr7wVYnU8sqdwRgxNCsIeseqinl6+TxBiE6JGIajKIihC7PAhzFFmDBkmg+CzFWMAlu8Aj4aWvjSN0ah9HkPJFB4yBzvINBGEExFYDUaQQGRvT9NREQiGI5wAHoAPyJAAVHAvKSVJ0lSXAACq8jTEUMkqZJcCicIREESg9GXkxJDTh4SCAgA0uIi7smxJCogCdE4Ax+mmai07UAAZIglBiRJqkyXAoQ2Pg3k+bJGkCJIiY0PgaDKKgbABMQfSzPMiyLicWKggC0gxhI6yMgiSJKHSlgwNluVYqYYCaMiRVZbWAieWFTRQJF0XybacB4kotJFLF-gEAlEBJe2jgzmckFYJlJV1Vi54xleALsBAg1IhIjKktIewQOskiTaV9VCOFzQtTFHHwJ1BSPL4cX9VgiVzMNqWMmB0C7dN5xrhuAISKYIDsM0jLARNxV7ViMjrC6ACCUBQPgTG1TlvENYdzVRcoJAKh1uJdZdvU4Ddd3JR2o0VPkr05ftjURajcCUQMmPYz1fh41wBMPcTHRk2V5w2s0nOMrK8qbHzDUsX5YS2EMaXc7aLpICxAJye1nlYisAJS6y8ukTAeokmSbRq36ZzPVACu2obKgKoQQkAuj6yAqioaMsr5xg7LxaljbGPO2c3KFAbJqa7TPI6-cetSP7Doc1r5s8ybbX-Sa3tUPtQA)

## Installation

> [!IMPORTANT]
> This package doesn't strictly follow SemVer and treats 1.x.x like 0.x.x as the name `pocketbase-ts` apparently belonged to another package previously and npm didn't let me publish 0.x.x.

```sh
npm install pocketbase-ts
```

```sh
pnpm add pocketbase-ts
```

```sh
bun add pocketbase-ts
```

## Usage

Except for the features described below (i.e., the query options), everything from the official SDK is left as-is.

### Defining schema

> [!TIP]
> I recommend using [this hook](https://github.com/satohshi/pocketbase-ts-schema-generator) to generate the schema.  
> It will watch for any changes made to the collections and update the schema file accordingly, keeping everything in sync.

#### Schema interface

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
    users: {
        type: User
    }
    posts: {
        type: Post
        relations: {
            // field name as key
            author: User
            // add "?" modifier to annotate optional relation fields
            tags?: Array<Tag>
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
}
```

Back-relations will automatically be inferred from the schema, so in most cases, you don't need to define them yourself.  
However, in some cases, you may need to define them explicitly. See [Caveats](#caveats) for more information.

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
            expand: [
                {
                    key: 'user',
                    fields: ['id', 'name'],
                },
            ],
        },
    ],
})
```

The result is automatically typed as:

```ts
type Result = Pick<Post, 'id' | 'title' | 'tags'> & {
    expand: {
        author: User
        comments_via_post?: (Pick<Comment, 'message'> & {
            expand: {
                user: Pick<User, 'id' | 'name'>
            }
        })[]
    }
}
```

## Helper functions for `filter` and `sort`

While you can still write `filter` and `sort` as plain strings, `pocketbase-ts` provides several helper functions that allow you to build them in a type-safe manner.

### Filter

For filters, you can use Drizzle-like functions.

```ts
const result = await pb.collection('posts').getFullList({
    filter: ({ and, eq, gte }) => {
        return and(eq('author.verified', true), gte('likes', 10))
    },
})
```

Except for `and` and `or`, all helper functions take a field name as the first argument and a value or another field name to compare as the second/third argument.

> [!IMPORTANT]
> Since the schema only exists at the type level, these helpers cannot distinguish between a field name and a generic string at runtime.  
> So if you want to pass a generic string as the value, you need to wrap it in either single or double quotes.

#### and

```ts
and(eq('title', '"foo"'), gt('likes', 30)) // => (title="foo"&&likes>30)
```

#### or

```ts
or(eq('title', '"foo"'), eq('title', '"bar"')) // => (title="foo"||title="bar")
```

#### eq/ne

```ts
eq('likes', 5) // => likes=5
eq('verified', true) // => verified=true
eq('title', '"foo"') // => title="foo"
eq('tags:length', 3) // => tags:length=3
```

#### gt/gte/lt/lte

```ts
gt('likes', 10) // => likes>10
gt('tags:length', 3) // => tags:length>3
gt('year', '@year') // => year>@year

gt('date', '"2000-01-01"') // => date>"2000-01-01"
gt('datetime', '@now') // => datetime>@now
```

#### like/notLike

```ts
like('title', '"foo"') // => title~"foo"
```

#### anyEq/anyNe

```ts
anyEq('tags.name', '"foo"') // => tags.name?="foo"
anyEq('posts_via_author.published', true) // => posts_via_author.published?=true
anyEq('@collection.courseRegistrations.user', 'id') // => @collection.courseRegistrations.user?=id
```

#### anyGt/anyGte/anyLt/anyLte

```ts
anyGt('posts_via_author.likes', 10) // => posts_via_author.likes>10
anyGt('posts_via_author.date', '"2000-01-01"') // => posts_via_author.date>"2000-01-01"
```

#### anyLike/anyNotLike

```ts
anyLike('tags.name', '"foo"') // => tags.name?~"foo"
anyLike('posts_via_author.title', '"foo"') // => posts_via_author.title?~"foo"
```

#### between/notBetween

```ts
between('likes', 10, 100) // => (likes>=10&&likes<=100)

notBetween('date', '"2000-01-01"', '"2001-01-01"') // => (date<"2000-01-01"||date>"2001-01-01")
```

#### inArray/notInArray

```ts
inArray('likes', [1, 3, 5]) // => (likes=1||likes=3||likes=5)

notInArray('title', ['"foo"', '"bar"', '"baz"']) // => (title!="foo"&&title!="bar"&&title!="baz")
```

At the moment, these helper functions do not perform any type narrowing.  
(e.g. `eq('tags:length', 3)` won't make `tags` in the response type `[string, string, string]`. It'll still be `string[]`.)

### Sort

For sort, you can use the `sortBy` function.

```ts
const result = await pb.collection('posts').getFullList({
    sort: ({ sortBy }) => {
        return sortBy('author.name', 'title', '-likes') // => 'author.name,title,-likes'
    },
})
```

### Maximum expand depth

While PocketBase supports expanding relations up to 6 levels deep, the number of fields increases exponentially with each level.  
The performance hit was very noticeable when I tried to set it to 6 even with the simple schema in the example above.

As such, I've set the default maximum depth for these helpers to 1.

However, should you wish to expand further, you can adjust the maximum depth by passing it as the second type argument when instantiating the SDK.

```ts
const pb = new PocketBaseTS<Schema, 6>()
```

## Caveats:

### Back-relations

By default, all back-relations are treated as **nullable** (e.g. `Post` may not have any `Comment`), and **to-many** (e.g. `comments_via_post` will be of type `Comment[]`).  
The former can be dealt with by simply adding the non-null assertion operator `!`, but the latter is a different story.

If you have a `UNIQUE` index constraint on the relation field, the item in `expand` will be of type `T` instead of `T[]`.

In such cases, you can override the default behaviour by explicitly defining back-relations yourself in the schema.

```diff
type Schema = {
    ...
    users: {
        type: User
        relations: {
            ...
-            userDetail_via_user?: UserDetail[] // default (implicit/inferred)
+            userDetail_via_user: UserDetail // made non-nullable by removing the `?`
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

The response of batch requests (introduced in the official SDK v0.22.0) is not typed, and likely never will be.  
There are many cases where it's impossible to know the shape of the request until runtime.

For example:

```ts
const batch = pb.createBatch()

for (const user of users) {
    if (condition) {
        batch.collection('users').update(user.id, { name: '...' })
    } else {
        batch.collection('users').delete(user.id)
    }
}

const response = batch.send()
```
