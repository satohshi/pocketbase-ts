import { describe, expectTypeOf, it } from 'vitest'
import type { TestSchema } from '../../schema.test-d.js'
import type { FilterHelpers } from './filter.js'

declare const {
	$,

	and,
	or,
	eq,
	ne,
	gt,
	gte,
	lt,
	lte,
	like,
	notLike,
	anyEq,
	anyNe,
	anyGt,
	anyGte,
	anyLt,
	anyLte,
	anyLike,
	anyNotLike,

	between,
	notBetween,
	inArray,
	notInArray,
}: FilterHelpers<TestSchema, 'posts'>

describe('$', () => {
	it('accept any type of value in filter helper', () => {
		$`${1} ${'foo'} ${true} ${null} ${undefined} ${{}} ${[]} ${() => {}} ${new Date()}`
	})
})

describe('and/or', () => {
	it('params for and and or are the same at type-level', () => {
		type AndParam = Parameters<typeof and>
		type OrParam = Parameters<typeof or>
		expectTypeOf<AndParam>().toEqualTypeOf<OrParam>()
	})

	it('`and` return type', () => {
		const res = and('a', 'b', 'c')
		expectTypeOf(res).toEqualTypeOf<'(a&&b&&c)'>()
	})

	it('`or` return type', () => {
		const res = or('a', 'b', 'c')
		expectTypeOf(res).toEqualTypeOf<'(a||b||c)'>()
	})

	it('errors when only one arg is passed', () => {
		// @ts-expect-error
		and('foo')
	})

	it('works with two args', () => {
		and('foo', 'bar')
	})

	it('works with three args', () => {
		and('foo', 'bar', 'baz')
	})
})

describe('eq/ne', () => {
	it('params for eq and ne are the same at type-level', () => {
		type EqParam = Parameters<typeof eq>
		type NeParam = Parameters<typeof ne>
		expectTypeOf<EqParam>().toEqualTypeOf<NeParam>()
	})

	describe('return type', () => {
		describe('eq', () => {
			it('number', () => {
				const res = eq('likes', 20)
				expectTypeOf(res).toEqualTypeOf<'likes=20'>()
			})

			it('stirng', () => {
				const res = eq('title', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'title="foo"'>()
			})

			it('boolean', () => {
				const res = eq('published', true)
				expectTypeOf(res).toEqualTypeOf<'published=true'>()
			})
		})

		describe('ne', () => {
			it('number', () => {
				const res = ne('likes', 20)
				expectTypeOf(res).toEqualTypeOf<'likes!=20'>()
			})

			it('stirng', () => {
				const res = ne('title', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'title!="foo"'>()
			})

			it('boolean', () => {
				const res = ne('published', true)
				expectTypeOf(res).toEqualTypeOf<'published!=true'>()
			})
		})
	})

	it('random (users)', () => {
		const { eq } = {} as FilterHelpers<TestSchema, 'users'>

		eq('posts_via_author.tags.id', '"a"')

		// @ts-expect-error
		eq('posts_via_author.tags', '"a"')

		eq('posts_via_author.tags:each', '"a"')
		// @ts-expect-error
		eq('posts_via_author.tags:each', 'a')
		// @ts-expect-error
		eq('posts_via_author.tags:each', 0)

		eq('posts_via_author.tags:length', 2)
		// @ts-expect-error
		eq('posts_via_author.tags:length', '"foo"')
	})

	it('random (posts)', () => {
		eq('author.name', '"foo"')
		eq('author', '"foo"')
		eq('tags.id', '"foo"')
		eq('tags.id', '"foo"')
		// @ts-expect-error
		eq('tags:length', '"foo"')
		eq('tags:each', '"foo"')
		eq('tags:length', 4)
		// @ts-expect-error
		eq('comments_via_post', 4)
		eq('comments_via_post.user', '"foo"')
		eq('comments_via_post.user.id', '"foo"')
	})

	it('first arg needs to be field name', () => {
		// @ts-expect-error
		eq('@now', '"foo"')
		// @ts-expect-error
		eq('"foo"', '"foo"')
		// @ts-expect-error
		eq('foo', '"foo"')
		// @ts-expect-error
		eq(3, '"foo"')
		// @ts-expect-error
		eq(true, '"foo"')
	})

	describe('first arg: number field', () => {
		it('lets you use macros that returns a number', () => {
			eq('likes', '@weekday')
		})

		it('works with a number field name and a number', () => {
			eq('likes', 1)
		})

		it('works with two number field names', () => {
			eq('likes', 'tags:length')
		})

		it('rejects macros that returns a string', () => {
			// @ts-expect-error
			eq('likes', '@now')
		})

		it('rejects a generic string', () => {
			// @ts-expect-error
			eq('likes', '"foo"')
		})

		it('rejects a string field name', () => {
			// @ts-expect-error
			eq('likes', 'author.id')
		})

		it('rejects a boolean field name', () => {
			// @ts-expect-error
			eq('likes', 'published')
		})

		it('rejects a boolean', () => {
			// @ts-expect-error
			eq('likes', true)
		})

		it('rejects arrays and objects', () => {
			// @ts-expect-error
			eq('likes', [])
			// @ts-expect-error
			eq('likes', {})
		})
	})

	describe('first arg: string fields', () => {
		it('accepts macros that return string', () => {
			eq('createdAt', '@tomorrow')
		})

		it('rejects macros that return numbers', () => {
			// @ts-expect-error
			eq('createdAt', '@year')
		})

		it('only accepts string field names or string wrapped in quotes as second arg', () => {
			// @ts-expect-error
			eq('title', 'foo')
			// @ts-expect-error
			eq('title', 0)
			// @ts-expect-error
			eq('title', true)
			// @ts-expect-error
			eq('title', [])
			// @ts-expect-error
			eq('title', {})
		})

		it('generic string in double quotation marks', () => {
			eq('title', '"foo"')
		})

		it('generic string in single quotation marks', () => {
			eq('title', "'foo'")
		})

		it('rejects generic unquoted string', () => {
			// @ts-expect-error
			eq('title', '`foo`')
			// @ts-expect-error
			eq('title', 'foo')
		})

		it('rejects a number field name', () => {
			// @ts-expect-error
			eq('title', 'likes')
		})

		it('rejects a boolean field name', () => {
			// @ts-expect-error
			eq('title', 'published')
		})

		it(`:lower errors when second arg isn't all lowercase`, () => {
			eq('title:lower', '"foo"')
			// @ts-expect-error
			eq('title:lower', '"Foo"')

			eq('title:lower', 'id:lower')
			// @ts-expect-error
			eq('title:lower', 'id')
		})
	})

	describe('first arg: boolean fields', () => {
		it('boolean', () => {
			eq('published', true)
			eq('published', false)
		})

		it('boolean field names', () => {
			eq('published', 'author.verified')
		})

		it('rejects macros', () => {
			// @ts-expect-error
			eq('published', '@now')
			// @ts-expect-error
			eq('published', '@weekday')
		})

		it('rejects a generic string', () => {
			// @ts-expect-error
			eq('published', '"foo"')
		})

		it('rejects a string field name', () => {
			// @ts-expect-error
			eq('published', 'author.id')
		})

		it('rejects a number', () => {
			// @ts-expect-error
			eq('published', 3)
		})

		it('rejects a number field name', () => {
			// @ts-expect-error
			eq('published', 'likes')
		})

		it('rejects arrays and objects', () => {
			// @ts-expect-error
			eq('published', [])
			// @ts-expect-error
			eq('published', {})
		})
	})

	describe('first arg: array:length', () => {
		it('works with a number', () => {
			eq('tags:length', 3)
		})

		it('works with a macro that returns a number', () => {
			eq('tags:length', '@day')
		})

		it('works with a number field name', () => {
			eq('tags:length', 'likes')
		})

		it('rejects macro that returns a string', () => {
			// @ts-expect-error
			eq('tags:length', '@now')
		})

		it('rejects a string field name', () => {
			// @ts-expect-error
			eq('tags:length', 'author.id')
		})

		it('rejects a boolean field name', () => {
			// @ts-expect-error
			eq('tags:length', 'published')
		})

		it('rejects a boolean', () => {
			// @ts-expect-error
			eq('tags:length', true)
		})

		it('rejects a generic string', () => {
			// @ts-expect-error
			eq('tags:length', 'foo')
			// @ts-expect-error
			eq('tags:length', '"foo"')
		})
	})

	describe('first arg: stringArray:each', () => {
		it('works with a generic quoted string', () => {
			eq('tags:each', '"foo"')
		})

		it('works with a string field name', () => {
			eq('tags:each', 'title')
		})

		it('works with a macro that returns a string', () => {
			eq('tags:each', '@now')
		})

		it('rejects a generic unquoted string', () => {
			// @ts-expect-error
			eq('tags:each', 'foo')
		})

		it('rejects a number', () => {
			// @ts-expect-error
			eq('tags:each', 4)
		})

		it('rejects a boolean', () => {
			// @ts-expect-error
			eq('tags:each', true)
		})

		it('rejects a number field name', () => {
			// @ts-expect-error
			eq('tags:each', 'likes')
		})
	})
})

describe('gt/gte/lt/lte', () => {
	it('params for gt, gte, lt, and lte are the same at type-level', () => {
		type GtParam = Parameters<typeof gt>
		type GteParam = Parameters<typeof gte>
		type LtParam = Parameters<typeof lt>
		type LteParam = Parameters<typeof lte>
		expectTypeOf<GtParam>().toEqualTypeOf<GteParam>()
		expectTypeOf<GtParam>().toEqualTypeOf<LtParam>()
		expectTypeOf<GtParam>().toEqualTypeOf<LteParam>()
	})

	describe('return type', () => {
		describe('gt', () => {
			it('string', () => {
				const res = gt('title', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'title>"foo"'>()
			})

			it('number', () => {
				const res = gt('likes', 10)
				expectTypeOf(res).toEqualTypeOf<'likes>10'>()
			})
		})

		describe('gte', () => {
			it('string', () => {
				const res = gte('title', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'title>="foo"'>()
			})

			it('number', () => {
				const res = gte('likes', 10)
				expectTypeOf(res).toEqualTypeOf<'likes>=10'>()
			})
		})

		describe('lt', () => {
			it('string', () => {
				const res = lt('title', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'title<"foo"'>()
			})

			it('number', () => {
				const res = lt('likes', 10)
				expectTypeOf(res).toEqualTypeOf<'likes<10'>()
			})
		})

		describe('lte', () => {
			it('string', () => {
				const res = lte('title', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'title<="foo"'>()
			})

			it('number', () => {
				const res = lte('likes', 10)
				expectTypeOf(res).toEqualTypeOf<'likes<=10'>()
			})
		})
	})

	it('first arg needs to be field name', () => {
		// @ts-expect-error
		gt('@now', '"foo"')
		// @ts-expect-error
		gt('"foo"', '"foo"')
		// @ts-expect-error
		gt('foo', '"foo"')
		// @ts-expect-error
		gt(3, '"foo"')
		// @ts-expect-error
		gt(true, '"foo"')
	})

	describe('number/number field name', () => {
		it('with two number field names', () => {
			gt('likes', 'tags:length')
		})

		it('with a number field name and a number', () => {
			gt('likes', 0)
		})

		it('with a number and a number field name', () => {
			// @ts-expect-error
			gt(0, 'likes')
		})

		it('with two numbers', () => {
			// @ts-expect-error
			gt(1, 0)
		})

		it('stringField:length', () => {
			gt('tags:length', 3)
		})

		it('macro that returns a number', () => {
			gt('likes', '@hour')
		})

		it('rejects macro that returns a string', () => {
			// @ts-expect-error
			gt('likes', '@now')
		})

		it("can't be called with anything else", () => {
			// @ts-expect-error
			gt('likes', 'aaa')
			// @ts-expect-error
			gt('title', 1)
			// @ts-expect-error
			gt('published', 0)
			// @ts-expect-error
			gt('foo', 'bar')
			// @ts-expect-error
			gt('tags', 1)
			// @ts-expect-error
			gt([], {})
		})
	})

	describe('string/string field name', () => {
		it('with two string field names', () => {
			gt('title', 'id')
		})

		it('with a string field name and a string', () => {
			gt('title', '"foo"')
		})

		it('string[]:each', () => {
			gt('tags:each', '"foo"')
		})

		it(`errors when second arg is unquoted`, () => {
			// @ts-expect-error
			gt('title:lower', 'foo')
		})

		it(`string:lower`, () => {
			gt('title:lower', '"foo"')
		})

		it(`string:lower shouldn't cause an error even when second arg isn't all lowercase`, () => {
			gt('title:lower', '"Foo"')
		})

		it('macro that returns a string', () => {
			gt('title', '@now')
		})

		it('rejects macro that returns a number', () => {
			// @ts-expect-error
			gt('title', '@hour')
		})

		it('rejects unquoted generic strings', () => {
			// @ts-expect-error
			gt('title', 'bar')
			// @ts-expect-error
			gt('foo', 'bar')
		})

		it("can't be called with anything else", () => {
			// @ts-expect-error
			gt('title', 1)
			// @ts-expect-error
			gt('title', true)
		})
	})

	describe('boolean/boolean field name', () => {
		it('should throw type errors', () => {
			// @ts-expect-error
			gt('published', true)
			// @ts-expect-error
			gt('published', 'published')
			// @ts-expect-error
			gt(true, 'published')
			// @ts-expect-error
			gt(true, true)
		})
	})
})

describe('like/notLike', () => {
	it('params for like and notLike are the same at type-level', () => {
		type LikeParams = Parameters<typeof like>
		type NotLikeParams = Parameters<typeof notLike>
		expectTypeOf<LikeParams>().toEqualTypeOf<NotLikeParams>()
	})

	describe('return type', () => {
		it('like', () => {
			const res = like('title', '"foo"')
			expectTypeOf(res).toEqualTypeOf<'title~"foo"'>()
		})
		it('notLike', () => {
			const res = notLike('title', '"foo"')
			expectTypeOf(res).toEqualTypeOf<'title!~"foo"'>()
		})
	})

	it('first arg needs to be single item string field name', () => {
		// @ts-expect-error
		like('likes', 3)
		// @ts-expect-error
		like('published', true)
		// @ts-expect-error
		like('comments_via_post.id', '')
	})

	describe('second arg', () => {
		it('generic quoted string', () => {
			like('title', '"foo"')
		})

		it('string field name', () => {
			like('title', 'title')
		})

		it('macro that returns a string', () => {
			like('title', '@now')
		})

		it(':lower', () => {
			like('title:lower', '"foo"')

			// @ts-expect-error
			like('title:lower', '"Foo"')
		})

		it('rejects unquoted string', () => {
			// @ts-expect-error
			like('title:lower', 'foo')
		})

		it('boolean should error', () => {
			// @ts-expect-error
			like('title', true)
		})

		it('boolean field name should error', () => {
			// @ts-expect-error
			like('title', 'published')
		})

		it('string[] field name should error', () => {
			// @ts-expect-error
			like('title', 'tags')
		})
	})
})

describe('anyEq/anyNe', () => {
	it('params for anyEq and anyNe are the same at type-level', () => {
		type AnyEqParam = Parameters<typeof anyEq>
		type AnyNeParam = Parameters<typeof anyNe>
		expectTypeOf<AnyEqParam>().toEqualTypeOf<AnyNeParam>()
	})

	describe('return type', () => {
		describe('anyEq', () => {
			it('string', () => {
				const res = anyEq('tags.name', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'tags.name?="foo"'>()
			})

			it('number', () => {
				const res = anyEq('comments_via_post.likes', 10)
				expectTypeOf(res).toEqualTypeOf<'comments_via_post.likes?=10'>()
			})

			it('boolean', () => {
				const res = anyEq('author.posts_via_author.published', true)
				expectTypeOf(res).toEqualTypeOf<'author.posts_via_author.published?=true'>()
			})
		})

		describe('anyNe', () => {
			it('string', () => {
				const res = anyNe('tags.name', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'tags.name?!="foo"'>()
			})

			it('number', () => {
				const res = anyNe('comments_via_post.likes', 10)
				expectTypeOf(res).toEqualTypeOf<'comments_via_post.likes?!=10'>()
			})

			it('boolean', () => {
				const res = anyNe('author.posts_via_author.published', true)
				expectTypeOf(res).toEqualTypeOf<'author.posts_via_author.published?!=true'>()
			})
		})
	})

	it('first arg needs to be to-many field names', () => {
		// @ts-expect-error
		anyEq('author', '"foo"')
		// @ts-expect-error
		anyEq('likes', 3)
		// @ts-expect-error
		anyEq('published', true)
	})

	describe('first arg: @collection (number)', () => {
		it('lets you use macros that returns a number', () => {
			anyEq('@collection.comments.likes', '@weekday')
		})

		it('works with a number field name and a number', () => {
			anyEq('@collection.comments.likes', 1)
		})

		it('works with two number field names', () => {
			anyEq('@collection.comments.likes', 'tags:length')
		})

		it('rejects macros that returns a string', () => {
			// @ts-expect-error
			anyEq('@collection.comments.likes', '@now')
		})

		it('rejects a generic string', () => {
			// @ts-expect-error
			anyEq('@collection.comments.likes', 'foo')
			// @ts-expect-error
			anyEq('@collection.comments.likes', '"foo"')
		})

		it('rejects a boolean', () => {
			// @ts-expect-error
			anyEq('@collection.comments.likes', true)
		})

		it('rejects arrays and objects', () => {
			// @ts-expect-error
			anyEq('@collection.comments.likes', [])
			// @ts-expect-error
			anyEq('@collection.comments.likes', {})
		})
	})

	describe('first arg: number field', () => {
		it('lets you use macros that returns a number', () => {
			anyEq('comments_via_post.likes', '@weekday')
		})

		it('works with a number field name and a number', () => {
			anyEq('comments_via_post.likes', 1)
		})

		it('works with two number field names', () => {
			anyEq('comments_via_post.likes', 'tags:length')
		})

		it('rejects macros that returns a string', () => {
			// @ts-expect-error
			anyEq('comments_via_post.likes', '@now')
		})

		it('rejects a generic string', () => {
			// @ts-expect-error
			anyEq('comments_via_post.likes', 'foo')
			// @ts-expect-error
			anyEq('comments_via_post.likes', '"foo"')
		})

		it('rejects a boolean', () => {
			// @ts-expect-error
			anyEq('comments_via_post.likes', true)
		})

		it('rejects arrays and objects', () => {
			// @ts-expect-error
			anyEq('comments_via_post.likes', [])
			// @ts-expect-error
			anyEq('comments_via_post.likes', {})
		})
	})

	describe('first arg: string fields', () => {
		it('accepts macros that return string', () => {
			anyEq('tags.name', '@tomorrow')
		})

		it('rejects macros that return numbers', () => {
			// @ts-expect-error
			anyEq('tags.name', '@year')
		})

		it('only accepts string field names or string wrapped in quotes as second arg', () => {
			// @ts-expect-error
			anyEq('tags.name', 'foo')
			// @ts-expect-error
			anyEq('tags.name', 0)
			// @ts-expect-error
			anyEq('tags.name', true)
			// @ts-expect-error
			anyEq('tags.name', [])
			// @ts-expect-error
			anyEq('tags.name', {})
		})

		it('generic string in double quotation marks', () => {
			anyEq('tags.name', '"foo"')
		})

		it('generic string in single quotation marks', () => {
			anyEq('tags.name', "'foo'")
		})

		it('rejects generic string', () => {
			// @ts-expect-error
			anyEq('tags.name', '`foo`')
			// @ts-expect-error
			anyEq('tags.name', 'foo')
		})

		it('field name as second arg with autoWrap option set to false', () => {
			anyEq('tags.name', 'author.name')
		})

		it(`:lower errors when second arg isn't all lowercase`, () => {
			anyEq('tags.name:lower', '"foo"')
			// @ts-expect-error
			anyEq('tags.name:lower', '"Foo"')
		})
	})

	describe("first arg: relation's string field", () => {
		it('rejects number', () => {
			// @ts-expect-error
			anyEq('tags.name', 3)
		})

		it('rejects number field name', () => {
			// @ts-expect-error
			anyEq('tags.name', 'tags:length')
		})

		it('rejects macro that returns a number', () => {
			// @ts-expect-error
			anyEq('tags.name', '@hour')
		})

		it('generic quoted string', () => {
			anyEq('tags.name', '"foo"')
		})

		it('string field name', () => {
			anyEq('tags.name', 'author.name')
		})

		it('macro that returns a string', () => {
			anyEq('tags.name', '@now')
		})

		it(':lower', () => {
			anyEq('tags.name:lower', '"foo"')
		})

		it('rejects unquoted string', () => {
			// @ts-expect-error
			anyEq('tags.name', 'foo')
		})

		it('rejects boolean', () => {
			// @ts-expect-error
			anyEq('tags.name', true)
		})

		it('rejects boolean field name', () => {
			// @ts-expect-error
			anyEq('tags.name', 'published')
		})

		it('rejects string[] field name', () => {
			// @ts-expect-error
			anyEq('tags.name', 'tags')
		})
	})
})

describe('anyGt/anyGte/anyLt/anyLte', () => {
	it('params for anyGt, anyGte, anyLt, and anyLte are the same at type-level', () => {
		type AnyGtParam = Parameters<typeof anyGt>
		type AnyGteParam = Parameters<typeof anyGte>
		type AnyLtParam = Parameters<typeof anyLt>
		type AnyLteParam = Parameters<typeof anyLte>
		expectTypeOf<AnyGtParam>().toEqualTypeOf<AnyGteParam>()
		expectTypeOf<AnyGtParam>().toEqualTypeOf<AnyLtParam>()
		expectTypeOf<AnyGtParam>().toEqualTypeOf<AnyLteParam>()
	})

	describe('return type', () => {
		describe('anyGt', () => {
			it('string', () => {
				const res = anyGt('tags.name', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'tags.name?>"foo"'>()
			})

			it('number', () => {
				const res = anyGt('comments_via_post.likes', 10)
				expectTypeOf(res).toEqualTypeOf<'comments_via_post.likes?>10'>()
			})
		})

		describe('anyGte', () => {
			it('string', () => {
				const res = anyGte('tags.name', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'tags.name?>="foo"'>()
			})

			it('number', () => {
				const res = anyGte('comments_via_post.likes', 10)
				expectTypeOf(res).toEqualTypeOf<'comments_via_post.likes?>=10'>()
			})
		})

		describe('anyLt', () => {
			it('string', () => {
				const res = anyLt('tags.name', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'tags.name?<"foo"'>()
			})

			it('number', () => {
				const res = anyLt('comments_via_post.likes', 10)
				expectTypeOf(res).toEqualTypeOf<'comments_via_post.likes?<10'>()
			})
		})

		describe('anyLte', () => {
			it('string', () => {
				const res = anyLte('tags.name', '"foo"')
				expectTypeOf(res).toEqualTypeOf<'tags.name?<="foo"'>()
			})

			it('number', () => {
				const res = anyLte('comments_via_post.likes', 10)
				expectTypeOf(res).toEqualTypeOf<'comments_via_post.likes?<=10'>()
			})
		})
	})

	it('first arg needs to be to-many field names', () => {
		anyGt('tags.name', '"foo"')
		anyGt('comments_via_post.likes', 3)
		// @ts-expect-error
		anyGt('author', '"foo"')
		// @ts-expect-error
		anyGt('likes', 3)
		// @ts-expect-error
		anyGt('published', true)
	})

	describe('first arg: string field name', () => {
		it('works with a string field name and a string', () => {
			anyGt('tags.name', '"foo"')
		})

		it('works with two string field names', () => {
			anyGt('tags.name', 'author.name')
		})

		it(`string:lower shouldn't cause an error even when second arg isn't all lowercase`, () => {
			anyGt('tags.name:lower', '"Foo"')
		})
	})

	describe('first arg: number field name', () => {
		it('works with a number field name and a number', () => {
			anyGt('comments_via_post.likes', 3)
		})

		it('works with two number field names', () => {
			anyGt('comments_via_post.likes', 'tags:length')
		})

		it('rejects macros that return a string', () => {
			// @ts-expect-error
			anyGt('comments_via_post.likes', '@now')
		})

		it('rejects a generic string', () => {
			// @ts-expect-error
			anyGt('comments_via_post.likes', 'foo')
			// @ts-expect-error
			anyGt('comments_via_post.likes', '"foo"')
		})

		it('rejects a boolean', () => {
			// @ts-expect-error
			anyGt('comments_via_post.likes', true)
		})

		it('rejects arrays and objects', () => {
			// @ts-expect-error
			anyGt('comments_via_post.likes', [])
			// @ts-expect-error
			anyGt('comments_via_post.likes', {})
		})
	})
})

describe('anyLike/anyNotLike', () => {
	it('params for anyLike and anyNotLike are the same at type-level', () => {
		type AnyLikeParam = Parameters<typeof anyLike>
		type AnyNotLikeParam = Parameters<typeof anyNotLike>
		expectTypeOf<AnyLikeParam>().toEqualTypeOf<AnyNotLikeParam>()
	})

	describe('return type', () => {
		it('anyLike', () => {
			const res = anyLike('tags.name', '"foo"')
			expectTypeOf(res).toEqualTypeOf<'tags.name?~"foo"'>()
		})
		it('anyNotLike', () => {
			const res = anyNotLike('tags.name', '"foo"')
			expectTypeOf(res).toEqualTypeOf<'tags.name?!~"foo"'>()
		})
	})

	it('first arg needs to be to-many string field names', () => {
		anyLike('tags.name', '"foo"')

		// @ts-expect-error
		anyLike('tags.posts_via_tags.likes', 4)
		// @ts-expect-error
		anyLike('tags.posts_via_tags.published', true)
		// @ts-expect-error
		anyLike('author', '"foo"')
		// @ts-expect-error
		anyLike('likes', 3)
		// @ts-expect-error
		anyLike('published', true)
	})

	describe('first arg: string field name', () => {
		it('works with a string field name and a string', () => {
			anyLike('tags.name', '"foo"')
		})

		it('works with two string field names', () => {
			anyLike('tags.name', 'author.name')
		})

		it('works with :lower', () => {
			anyLike('tags.name:lower', '"foo"')

			// @ts-expect-error
			anyLike('tags.name:lower', '"Foo"')
		})
	})
})

describe('between/notBetween', () => {
	it('params for between and notBetween are the same at type-level', () => {
		type BetweenParam = Parameters<typeof between>
		type NotBetweenParam = Parameters<typeof notBetween>
		expectTypeOf<BetweenParam>().toEqualTypeOf<NotBetweenParam>()
	})

	describe('return type', () => {
		it('between', () => {
			const res = between('likes', 5, 10)
			expectTypeOf(res).toEqualTypeOf<'(likes>=5&&likes<=10)'>()
		})

		it('notBetween', () => {
			const res = notBetween('likes', 5, 10)
			expectTypeOf(res).toEqualTypeOf<'(likes<5||likes>10)'>()
		})
	})

	describe('first arg: string field name', () => {
		it('takes quoted strings', () => {
			between('createdAt', '"2025-01-01"', '"2026-01-01"')
		})

		it('takes string field names', () => {
			between('title', 'author.name', 'author.id')
		})

		it('rejects generic unquoted strings', () => {
			// @ts-expect-error
			between('createdAt', '2025-01-01', '2026-01-01')
		})

		it('rejects numbers', () => {
			// @ts-expect-error
			between('title', 0, 1)
		})

		it('rejects number field names', () => {
			// @ts-expect-error
			between('title', 'likes', '@year')
		})

		it('rejects booleans', () => {
			// @ts-expect-error
			between('title', true, false)
		})

		it('rejects boolean field names', () => {
			// @ts-expect-error
			between('title', 'published', 'author.verified')
		})
	})

	describe('first arg: number field name', () => {
		it('takes numbers', () => {
			between('likes', 0, 1)
		})

		it('takes number field names', () => {
			between('likes', 'tags:length', 'author.age')
		})

		it('rejects strings', () => {
			// @ts-expect-error
			between('likes', '"foo"', '"bar"')
		})

		it('rejects string field names', () => {
			// @ts-expect-error
			between('likes', 'title', 'author.name')
		})

		it('rejects booleans', () => {
			// @ts-expect-error
			between('likes', true, false)
		})

		it('rejects boolean field names', () => {
			// @ts-expect-error
			between('likes', 'published', 'author.verified')
		})
	})
})

describe('inArray/notInArray', () => {
	it('params for inArray and notInArray are the same at type-level', () => {
		type InArrayParam = Parameters<typeof inArray>
		type NotInArrayParam = Parameters<typeof notInArray>
		expectTypeOf<InArrayParam>().toEqualTypeOf<NotInArrayParam>()
	})

	describe('return type', () => {
		it('inArray', () => {
			const res = inArray('title', ['"foo"', '"bar"', '"baz"'])
			expectTypeOf(res).toEqualTypeOf<'(title="foo"||title="bar"||title="baz")'>()
		})

		it('notInArray', () => {
			const res = notInArray('title', ['"foo"', '"bar"', '"baz"'])
			expectTypeOf(res).toEqualTypeOf<'(title!="foo"&&title!="bar"&&title!="baz")'>()
		})
	})

	describe('first arg: string field name', () => {
		it('takes quoted strings', () => {
			inArray('title', ['"foo"', '"bar"', '"baz"'])
		})

		it('rejects generic unquoted strings', () => {
			// @ts-expect-error
			inArray('title', ['foo', 'bar', 'baz'])
		})

		it('takes string field names', () => {
			inArray('title', ['author.name'])
		})

		it('rejects numbers', () => {
			// @ts-expect-error
			inArray('title', [0, 1, 2])
		})

		it('rejects number field names', () => {
			// @ts-expect-error
			inArray('title', ['likes'])
		})

		it('rejects booleans', () => {
			// @ts-expect-error
			inArray('title', [true])
		})

		it('rejects boolean field names', () => {
			// @ts-expect-error
			inArray('title', ['published'])
		})

		it('rejects uppercase characters when first arg has :lower', () => {
			// @ts-expect-error
			inArray('title:lower', ['Foo'])
		})
	})

	describe('first arg: number field name', () => {
		it('takes numbers', () => {
			inArray('likes', [0, 1, 2])
		})

		it('takes number field names', () => {
			inArray('likes', ['tags:length'])
		})

		it('rejects strings', () => {
			// @ts-expect-error
			inArray('likes', ['"foo"', '"bar"', '"baz"'])
		})

		it('rejects string field names', () => {
			// @ts-expect-error
			inArray('likes', ['title'])
		})

		it('rejects booleans', () => {
			// @ts-expect-error
			inArray('likes', [true])
		})

		it('rejects boolean field names', () => {
			// @ts-expect-error
			inArray('likes', ['published'])
		})
	})
})
