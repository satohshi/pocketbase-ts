import { describe, it, expectTypeOf } from 'vitest'
import type { Options } from './options.js'
import type { PBResponseType } from './response.js'

interface BaseInterface {
	id: string
	toOneRequired1: string
	toOneRequired2: string
	toOneOptional1?: string
	toOneOptional2?: string
	toManyRequired2: string[]
	toManyRequired1: string[]
	toManyOptional1?: string[]
	toManyOptional2?: string[]
}

interface BaseCollection extends BaseInterface {
	name: 'BaseCollection'
}

interface ToOneRequired extends BaseInterface {
	name: 'ToOneRequired'
}
interface ToOneOptional extends BaseInterface {
	name: 'ToOneOptional'
}
interface ToManyRequired extends BaseInterface {
	name: 'ToManyRequired'
}
interface ToManyOptional extends BaseInterface {
	name: 'ToManyOptional'
}

type Schema = {
	base: {
		type: BaseCollection
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
}

type Prettify<T> = {
	[K in keyof T]: Prettify<T[K]>
} & {}

describe('PBResponseType', () => {
	type BaseOption = Options<Schema, 'base', 2, 'list'>
	// .branded made some tests pass that actually should fail, so using Prettify instead
	type Response<T extends BaseOption> = Prettify<PBResponseType<Schema, 'base', T, 2>>

	describe('top level', () => {
		it('returns type as is if no option is passed', async () => {
			const option = {} as const satisfies BaseOption
			expectTypeOf<Response<typeof option>>().toEqualTypeOf<BaseCollection>()
		})

		describe('fields', () => {
			it('returns type with only specified fields in options', async () => {
				const option = { fields: ['id', 'name'] } as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Pick<BaseCollection, 'id' | 'name'>
				>()
			})

			it("modifiers don't affect types", async () => {
				const withoutModifier = { fields: ['id', 'name'] } as const satisfies BaseOption
				const withModifier = {
					fields: ['id', 'name:excerpt(10)'],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof withModifier>>().toEqualTypeOf<
					Response<typeof withoutModifier>
				>()
			})
		})

		describe('expand', () => {
			it('types single required to-one expand', async () => {
				const option = { expand: [{ key: 'toOneRequired1' }] } as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<BaseCollection & { expand: { toOneRequired1: ToOneRequired } }>
				>()
			})

			it('types single optional to-one expand', async () => {
				const option = { expand: [{ key: 'toOneOptional1' }] } as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<BaseCollection & { expand: { toOneOptional1?: ToOneOptional } }>
				>()
			})

			it('types single required to-many expand', async () => {
				const option = {
					expand: [{ key: 'toManyRequired1' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: { toManyRequired1: [ToManyRequired, ...ToManyRequired[]] }
						}
					>
				>()
			})

			it('types single optional to-many expand', async () => {
				const option = {
					expand: [{ key: 'toManyOptional1' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: { toManyOptional1?: [ToManyOptional, ...ToManyOptional[]] }
						}
					>
				>()
			})

			it('types multiple expands (to-one required x2)', async () => {
				const option = {
					expand: [{ key: 'toOneRequired1' }, { key: 'toOneRequired2' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired
								toOneRequired2: ToOneRequired
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one required & to-one optional)', async () => {
				const option = {
					expand: [{ key: 'toOneRequired1' }, { key: 'toOneOptional1' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired
								toOneOptional1?: ToOneOptional
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one optional x2)', async () => {
				const option = {
					expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional
								toOneOptional2?: ToOneOptional
							}
						}
					>
				>()
			})

			it('types multiple expands (to-many required x2)', async () => {
				const option = {
					expand: [{ key: 'toManyRequired1' }, { key: 'toManyRequired2' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
								toManyRequired2: [ToManyRequired, ...ToManyRequired[]]
							}
						}
					>
				>()
			})

			it('types multiple expands (to-many required & to-many optional)', async () => {
				const option = {
					expand: [{ key: 'toManyRequired1' }, { key: 'toManyOptional1' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
								toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
							}
						}
					>
				>()
			})

			it('types multiple expands (to-many optional x2)', async () => {
				const option = {
					expand: [{ key: 'toManyOptional1' }, { key: 'toManyOptional2' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
								toManyOptional2?: [ToManyOptional, ...ToManyOptional[]]
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one required & to-many required)', async () => {
				const option = {
					expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired1' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired
								toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one required & to-many optional)', async () => {
				const option = {
					expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired
								toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one optional & to-many required)', async () => {
				const option = {
					expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired1' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional
								toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one optional & to-many optional)', async () => {
				const option = {
					expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional
								toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
							}
						}
					>
				>()
			})
		})
	})

	describe('in `expand` (to-one required)', () => {
		it('returns type as is if `fields` is not specified', async () => {
			const option = {
				expand: [{ key: 'toOneRequired1' }],
			} as const satisfies BaseOption
			expectTypeOf<Response<typeof option>>().toEqualTypeOf<
				Prettify<BaseCollection & { expand: { toOneRequired1: ToOneRequired } }>
			>()
		})

		describe('fields', () => {
			it('returns type with only specified fields', async () => {
				const option = {
					expand: [{ key: 'toOneRequired1', fields: ['id', 'name'] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: { toOneRequired1: Pick<ToOneRequired, 'id' | 'name'> }
						}
					>
				>()
			})

			it("modifiers don't affect types", async () => {
				const withoutModifier = {
					expand: [{ key: 'toOneRequired1', fields: ['id', 'name'] }],
				} as const satisfies BaseOption
				const withModifier = {
					expand: [{ key: 'toOneRequired1', fields: ['id', 'name:excerpt(10)'] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof withModifier>>().toEqualTypeOf<
					Response<typeof withoutModifier>
				>()
			})
		})

		describe('expand', () => {
			it('types single required to-one expand', async () => {
				const option = {
					expand: [{ key: 'toOneRequired1', expand: [{ key: 'toOneRequired1' }] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: { toOneRequired1: ToOneRequired }
								}
							}
						}
					>
				>()
			})

			it('types single optional to-one expand', async () => {
				const option = {
					expand: [{ key: 'toOneRequired1', expand: [{ key: 'toOneOptional1' }] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: { toOneOptional1?: ToOneOptional }
								}
							}
						}
					>
				>()
			})

			it('types single required to-many expand', async () => {
				const option = {
					expand: [{ key: 'toOneRequired1', expand: [{ key: 'toManyRequired1' }] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types single optional to-many expand', async () => {
				const option = {
					expand: [{ key: 'toOneRequired1', expand: [{ key: 'toManyOptional1' }] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: {
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one required x2)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneRequired1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toOneRequired2' }],
						},
					],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
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
				const option = {
					expand: [
						{
							key: 'toOneRequired1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toOneOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toOneOptional1?: ToOneOptional
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one optional x2)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneRequired1',
							expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
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
				const option = {
					expand: [
						{
							key: 'toOneRequired1',
							expand: [{ key: 'toManyRequired1' }, { key: 'toManyRequired2' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
										toManyRequired2: [ToManyRequired, ...ToManyRequired[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-many required & to-many optional)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneRequired1',
							expand: [{ key: 'toManyRequired1' }, { key: 'toManyOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-many optional x2)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneRequired1',
							expand: [{ key: 'toManyOptional1' }, { key: 'toManyOptional2' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: {
										toManyOptional2?: [ToManyOptional, ...ToManyOptional[]]
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one required & to-many required)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneRequired1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one required & to-many optional)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneRequired1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one optional & to-many required)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneRequired1',
							expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one optional & to-many optional)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneRequired1',
							expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneRequired1: ToOneRequired & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								}
							}
						}
					>
				>()
			})
		})
	})

	describe('in `expand` (to-one optional)', () => {
		it('returns type as is if `fields` is not specified', async () => {
			const option = {
				expand: [{ key: 'toOneOptional1' }],
			} as const satisfies BaseOption
			expectTypeOf<Response<typeof option>>().toEqualTypeOf<
				Prettify<BaseCollection & { expand: { toOneOptional1?: ToOneOptional } }>
			>()
		})

		describe('fields', () => {
			it('returns type with only specified fields', async () => {
				const option = {
					expand: [{ key: 'toOneOptional1', fields: ['id', 'name'] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: Pick<ToOneOptional, 'id' | 'name'>
							}
						}
					>
				>()
			})

			it("modifiers don't affect types", async () => {
				const withoutModifier = {
					expand: [{ key: 'toOneOptional1', fields: ['id', 'name'] }],
				} as const satisfies BaseOption
				const withModifier = {
					expand: [{ key: 'toOneOptional1', fields: ['id', 'name:excerpt(10)'] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof withModifier>>().toEqualTypeOf<
					Response<typeof withoutModifier>
				>()
			})
		})

		describe('expand', () => {
			it('types single required to-one expand', async () => {
				const option = {
					expand: [{ key: 'toOneOptional1', expand: [{ key: 'toOneRequired1' }] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: { toOneRequired1: ToOneRequired }
								}
							}
						}
					>
				>()
			})

			it('types single optional to-one expand', async () => {
				const option = {
					expand: [{ key: 'toOneOptional1', expand: [{ key: 'toOneOptional1' }] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: { toOneOptional1?: ToOneOptional }
								}
							}
						}
					>
				>()
			})

			it('types single required to-many expand', async () => {
				const option = {
					expand: [{ key: 'toOneOptional1', expand: [{ key: 'toManyRequired1' }] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types single optional to-many expand', async () => {
				const option = {
					expand: [{ key: 'toOneOptional1', expand: [{ key: 'toManyOptional1' }] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: {
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one required x2)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneOptional1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toOneRequired2' }],
						},
					],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
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
				const option = {
					expand: [
						{
							key: 'toOneOptional1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toOneOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: {
										toOneRequired1: ToOneRequired
										toOneOptional1?: ToOneOptional
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one optional x2)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneOptional1',
							expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
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
				const option = {
					expand: [
						{
							key: 'toOneOptional1',
							expand: [{ key: 'toManyRequired1' }, { key: 'toManyRequired2' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
										toManyRequired2: [ToManyRequired, ...ToManyRequired[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-many required & to-many optional)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneOptional1',
							expand: [{ key: 'toManyRequired1' }, { key: 'toManyOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-many optional x2)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneOptional1',
							expand: [{ key: 'toManyOptional1' }, { key: 'toManyOptional2' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: {
										toManyOptional2?: [ToManyOptional, ...ToManyOptional[]]
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one required & to-many required)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneOptional1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: {
										toOneRequired1: ToOneRequired
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one required & to-many optional)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneOptional1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: {
										toOneRequired1: ToOneRequired
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one optional & to-many required)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneOptional1',
							expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								}
							}
						}
					>
				>()
			})

			it('types multiple expands (to-one optional & to-many optional)', async () => {
				const option = {
					expand: [
						{
							key: 'toOneOptional1',
							expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toOneOptional1?: ToOneOptional & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								}
							}
						}
					>
				>()
			})
		})
	})

	describe('in `expand` (to-many required)', () => {
		it('returns type as is if `fields` is not specified', async () => {
			const option = {
				expand: [{ key: 'toManyRequired1' }],
			} as const satisfies BaseOption
			expectTypeOf<Response<typeof option>>().toEqualTypeOf<
				Prettify<
					BaseCollection & {
						expand: {
							toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
						}
					}
				>
			>()
		})

		describe('fields', () => {
			it('returns type with only specified fields', async () => {
				const option = {
					expand: [{ key: 'toManyRequired1', fields: ['id', 'name'] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toManyRequired1: [
									Pick<ToManyRequired, 'id' | 'name'>,
									...Pick<ToManyRequired, 'id' | 'name'>[],
								]
							}
						}
					>
				>()
			})

			it("modifiers don't affect types", async () => {
				const withoutModifier = {
					expand: [{ key: 'toManyRequired1', fields: ['id', 'name'] }],
				} as const satisfies BaseOption
				const withModifier = {
					expand: [{ key: 'toManyRequired1', fields: ['id', 'name:excerpt(10)'] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof withModifier>>().toEqualTypeOf<
					Response<typeof withoutModifier>
				>()
			})
		})

		describe('expand', () => {
			it('types single required to-one expand', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toOneRequired1' }],
						},
					],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: { toOneRequired1: ToOneRequired }
								},
								...(ToManyRequired & {
									expand: { toOneRequired1: ToOneRequired }
								})[],
							]
						}
					}
				>()
			})

			it('types single optional to-one expand', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toOneOptional1' }],
						},
					],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: { toOneOptional1?: ToOneOptional }
								},
								...(ToManyRequired & {
									expand: { toOneOptional1?: ToOneOptional }
								})[],
							]
						}
					}
				>()
			})

			it('types single required to-many expand', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toManyRequired1' }],
						},
					],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								},
								...(ToManyRequired & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								})[],
							]
						}
					}
				>()
			})

			it('types single optional to-many expand', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toManyOptional1' }],
						},
					],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]] // TODO: I can remove this line and the test still passes??? maybe I should do something about it.
									}
								},
								...(ToManyRequired & {
									expand: {
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								})[],
							]
						}
					}
				>()
			})

			it('types multiple expands (to-one required x2)', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toOneRequired2' }],
						},
					],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toOneRequired2: ToOneRequired
									}
								},
								...(ToManyRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toOneRequired2: ToOneRequired
									}
								})[],
							]
						}
					}
				>()
			})

			it('types multiple expands (to-one required & to-one optional)', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toOneOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toOneOptional1?: ToOneOptional
									}
								},
								...(ToManyRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toOneOptional1?: ToOneOptional
									}
								})[],
							]
						}
					}
				>()
			})

			it('types multiple expands (to-one optional x2)', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toOneOptional1?: ToOneOptional
										toOneOptional2?: ToOneOptional
									}
								},
								...(ToManyRequired & {
									expand: {
										toOneOptional1?: ToOneOptional
										toOneOptional2?: ToOneOptional
									}
								})[],
							]
						}
					}
				>()
			})

			it('types multiple expands (to-many required x2)', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toManyRequired1' }, { key: 'toManyRequired2' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
										toManyRequired2: [ToManyRequired, ...ToManyRequired[]]
									}
								},
								...(ToManyRequired & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
										toManyRequired2: [ToManyRequired, ...ToManyRequired[]]
									}
								})[],
							]
						}
					}
				>()
			})

			it('types multiple expands (to-many required & to-many optional)', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toManyRequired1' }, { key: 'toManyOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								},
								...(ToManyRequired & {
									expand: {
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								})[],
							]
						}
					}
				>()
			})

			it('types multiple expands (to-many optional x2)', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toManyOptional1' }, { key: 'toManyOptional2' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toManyOptional2?: [ToManyOptional, ...ToManyOptional[]]
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								},
								...(ToManyRequired & {
									expand: {
										toManyOptional2?: [ToManyOptional, ...ToManyOptional[]]
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								})[],
							]
						}
					}
				>()
			})

			it('types multiple expands (to-one required & to-many required)', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								},
								...(ToManyRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								})[],
							]
						}
					}
				>()
			})

			it('types multiple expands (to-one required & to-many optional)', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								},
								...(ToManyRequired & {
									expand: {
										toOneRequired1: ToOneRequired
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								})[],
							]
						}
					}
				>()
			})

			it('types multiple expands (to-one optional & to-many required)', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								},
								...(ToManyRequired & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								})[],
							]
						}
					}
				>()
			})

			it('types multiple expands (to-one optional & to-many optional)', async () => {
				const option = {
					expand: [
						{
							key: 'toManyRequired1',
							expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
						},
					],
				} as const satisfies BaseOption

				expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
					BaseCollection & {
						expand: {
							toManyRequired1: [
								ToManyRequired & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								},
								...(ToManyRequired & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								})[],
							]
						}
					}
				>()
			})
		})
	})

	describe('in `expand` (to-many optional)', () => {
		it('returns type as is if `fields` is not specified', async () => {
			const option = {
				expand: [{ key: 'toManyOptional1' }],
			} as const satisfies BaseOption
			expectTypeOf<Response<typeof option>>().toEqualTypeOf<
				Prettify<
					BaseCollection & {
						expand: {
							toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
						}
					}
				>
			>()
		})

		describe('fields', () => {
			it('returns type with only specified fields', async () => {
				const option = {
					expand: [{ key: 'toManyOptional1', fields: ['id', 'name'] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof option>>().toEqualTypeOf<
					Prettify<
						BaseCollection & {
							expand: {
								toManyOptional1?: [
									Pick<ToManyOptional, 'id' | 'name'>,
									...Pick<ToManyOptional, 'id' | 'name'>[],
								]
							}
						}
					>
				>()
			})

			it("modifiers don't affect types", async () => {
				const withoutModifier = {
					expand: [{ key: 'toManyOptional1', fields: ['id', 'name'] }],
				} as const satisfies BaseOption
				const withModifier = {
					expand: [{ key: 'toManyOptional1', fields: ['id', 'name:excerpt(10)'] }],
				} as const satisfies BaseOption
				expectTypeOf<Response<typeof withModifier>>().toEqualTypeOf<
					Response<typeof withoutModifier>
				>()
			})
		})
	})

	describe('expand', () => {
		it('types single required to-one expand', async () => {
			const option = {
				expand: [{ key: 'toManyOptional1', expand: [{ key: 'toOneRequired1' }] }],
			} as const satisfies BaseOption

			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: { toOneRequired1: ToOneRequired }
							},
							...(ToManyOptional & {
								expand: { toOneRequired1: ToOneRequired }
							})[],
						]
					}
				}
			>()
		})

		it('types single optional to-one expand', async () => {
			const option = {
				expand: [{ key: 'toManyOptional1', expand: [{ key: 'toOneOptional1' }] }],
			} as const satisfies BaseOption
			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: { toOneOptional1?: ToOneOptional }
							},
							...(ToManyOptional & {
								expand: { toOneOptional1?: ToOneOptional }
							})[],
						]
					}
				}
			>()
		})

		it('types single required to-many expand', async () => {
			const option = {
				expand: [{ key: 'toManyOptional1', expand: [{ key: 'toManyRequired1' }] }],
			} as const satisfies BaseOption
			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: {
									toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
								}
							},
							...(ToManyOptional & {
								expand: {
									toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
								}
							})[],
						]
					}
				}
			>()
		})

		it('types single optional to-many expand', async () => {
			const option = {
				expand: [{ key: 'toManyOptional1', expand: [{ key: 'toManyOptional1' }] }],
			} as const satisfies BaseOption
			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: {
									toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
								}
							},
							...(ToManyOptional & {
								expand: {
									toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
								}
							})[],
						]
					}
				}
			>()
		})

		it('types multiple expands (to-one required x2)', async () => {
			const option = {
				expand: [
					{
						key: 'toManyOptional1',
						expand: [{ key: 'toOneRequired1' }, { key: 'toOneRequired2' }],
					},
				],
			} as const satisfies BaseOption
			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: {
									toOneRequired1: ToOneRequired
									toOneRequired2: ToOneRequired
								}
							},
							...(ToManyOptional & {
								expand: {
									toOneRequired1: ToOneRequired
									toOneRequired2: ToOneRequired
								}
							})[],
						]
					}
				}
			>()
		})

		it('types multiple expands (to-one required & to-one optional)', async () => {
			const option = {
				expand: [
					{
						key: 'toManyOptional1',
						expand: [{ key: 'toOneRequired1' }, { key: 'toOneOptional1' }],
					},
				],
			} as const satisfies BaseOption

			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: {
									toOneRequired1: ToOneRequired
									toOneOptional1?: ToOneOptional
								}
							},
							...(ToManyOptional & {
								expand: {
									toOneRequired1: ToOneRequired
									toOneOptional1?: ToOneOptional
								}
							})[],
						]
					}
				}
			>()
		})

		it('types multiple expands (to-one optional x2)', async () => {
			const option = {
				expand: [
					{
						key: 'toManyOptional1',
						expand: [{ key: 'toOneOptional1' }, { key: 'toOneOptional2' }],
					},
				],
			} as const satisfies BaseOption

			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: {
									toOneOptional1?: ToOneOptional
									toOneOptional2?: ToOneOptional
								}
							},
							...(ToManyOptional & {
								expand: {
									toOneOptional1?: ToOneOptional
									toOneOptional2?: ToOneOptional
								}
							})[],
						]
					}
				}
			>()
		})

		it('types multiple expands (to-many required x2)', async () => {
			const option = {
				expand: [
					{
						key: 'toManyOptional1',
						expand: [{ key: 'toManyRequired1' }, { key: 'toManyRequired2' }],
					},
				],
			} as const satisfies BaseOption

			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: {
									toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									toManyRequired2: [ToManyRequired, ...ToManyRequired[]]
								}
							},
							...(ToManyOptional & {
								expand: {
									toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									toManyRequired2: [ToManyRequired, ...ToManyRequired[]]
								}
							})[],
						]
					}
				}
			>()
		})

		it('types multiple expands (to-many required & to-many optional)', async () => {
			const option = {
				expand: [
					{
						key: 'toManyOptional1',
						expand: [{ key: 'toManyRequired1' }, { key: 'toManyOptional1' }],
					},
				],
			} as const satisfies BaseOption

			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: {
									toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
								}
							},
							...(ToManyOptional & {
								expand: {
									toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
								}
							})[],
						]
					}
				}
			>()
		})

		it('types multiple expands (to-many optional x2)', async () => {
			const option = {
				expand: [
					{
						key: 'toManyOptional1',
						expand: [{ key: 'toManyOptional1' }, { key: 'toManyOptional2' }],
					},
				],
			} as const satisfies BaseOption

			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: {
									toManyOptional2?: [ToManyOptional, ...ToManyOptional[]]
									toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
								}
							},
							...(ToManyOptional & {
								expand: {
									toManyOptional2?: [ToManyOptional, ...ToManyOptional[]]
									toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
								}
							})[],
						]
					}
				}
			>()
		})

		it('types multiple expands (to-one required & to-many required)', async () => {
			const option = {
				expand: [
					{
						key: 'toManyOptional1',
						expand: [{ key: 'toOneRequired1' }, { key: 'toManyRequired1' }],
					},
				],
			} as const satisfies BaseOption

			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: {
									toOneRequired1: ToOneRequired
									toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
								}
							},
							...(ToManyOptional & {
								expand: {
									toOneRequired1: ToOneRequired
									toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
								}
							})[],
						]
					}
				}
			>()
		})

		it('types multiple expands (to-one required & to-many optional)', async () => {
			const option = {
				expand: [
					{
						key: 'toManyOptional1',
						expand: [{ key: 'toOneRequired1' }, { key: 'toManyOptional1' }],
					},
				],
			} as const satisfies BaseOption

			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				BaseCollection & {
					expand: {
						toManyOptional1?: [
							ToManyOptional & {
								expand: {
									toOneRequired1: ToOneRequired
									toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
								}
							},
							...(ToManyOptional & {
								expand: {
									toOneRequired1: ToOneRequired
									toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
								}
							})[],
						]
					}
				}
			>()
		})

		it('types multiple expands (to-one optional & to-many required)', async () => {
			const option = {
				expand: [
					{
						key: 'toManyOptional1',
						expand: [{ key: 'toOneOptional1' }, { key: 'toManyRequired1' }],
					},
				],
			} as const satisfies BaseOption

			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				Prettify<
					BaseCollection & {
						expand: {
							toManyOptional1?: [
								ToManyOptional & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								},
								...(ToManyOptional & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyRequired1: [ToManyRequired, ...ToManyRequired[]]
									}
								})[],
							]
						}
					}
				>
			>()
		})

		it('types multiple expands (to-one optional & to-many optional)', async () => {
			const option = {
				expand: [
					{
						key: 'toManyOptional1',
						expand: [{ key: 'toOneOptional1' }, { key: 'toManyOptional1' }],
					},
				],
			} as const satisfies BaseOption

			expectTypeOf<Response<typeof option>>().branded.toEqualTypeOf<
				Prettify<
					BaseCollection & {
						expand: {
							toManyOptional1?: [
								ToManyOptional & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								},
								...(ToManyOptional & {
									expand: {
										toOneOptional1?: ToOneOptional
										toManyOptional1?: [ToManyOptional, ...ToManyOptional[]]
									}
								})[],
							]
						}
					}
				>
			>()
		})
	})
})
