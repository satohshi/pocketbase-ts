import { describe, expect, it } from 'vitest'

import { Options, processOptions } from './option-parser.js'

describe('processOptions', () => {
	it('should return undefined if option is undefined', () => {
		expect(processOptions(undefined)).toBeUndefined()
	})

	it('should return the same option if fields and expand are already strings', () => {
		const option = { fields: 'field1,field2', expand: 'expand1,expand2' }
		expect(processOptions(option)).toEqual(option)
	})

	it('should process options with fields only', () => {
		const option = { fields: ['field1', 'field2'] }
		const expected = { fields: 'field1,field2' }
		expect(processOptions(option)).toEqual(expected)
	})

	it('should process options with expand only', () => {
		const option = { expand: [{ key: 'expand1' }, { key: 'expand2' }] }
		const expected = { expand: 'expand1,expand2' }
		expect(processOptions(option)).toEqual(expected)
	})

	it('should process options with nested expand', () => {
		const option = { expand: [{ key: 'expand1', expand: [{ key: 'subexpand1' }] }] }
		const expected = { expand: 'expand1.subexpand1' }
		expect(processOptions(option)).toEqual(expected)
	})

	it('should leave modifier as is', () => {
		const option = { fields: ['field1:excerpt(1)', 'field2:excerpt(10,true)'] }
		const expected = { fields: 'field1:excerpt(1),field2:excerpt(10,true)' }
		expect(processOptions(option)).toEqual(expected)
	})

	it('should process options with fields and expand', () => {
		const option = { fields: ['field1', 'field2'], expand: [{ key: 'expand1' }] }
		const expected = { fields: 'field1,field2,expand.*', expand: 'expand1' }
		expect(processOptions(option)).toEqual(expected)
	})

	it('should process options with nested fields in expand', () => {
		const option = {
			fields: ['field1'],
			expand: [
				{
					key: 'expand1',
					fields: ['subfield1'],
					expand: [{ key: 'subexpand1', fields: ['subsubfield1'] }],
				},
			],
		}
		const expected = {
			fields: 'field1,expand.expand1.subfield1,expand.expand1.expand.subexpand1.subsubfield1',
			expand: 'expand1.subexpand1',
		}
		expect(processOptions(option)).toEqual(expected)
	})

	it('should remove undefined values from the result', () => {
		const option = { fields: ['field1'], expand: undefined }
		const expected = { fields: 'field1' }
		expect(processOptions(option)).toEqual(expected)
	})

	it("shouldn't remove requestKey with value `null`", () => {
		const option = { requestKey: null }
		expect(processOptions(option)).toEqual(option)
	})

	it("shouldn't touch filter if it's a string", () => {
		const option = { filter: 'field1 = "value1"' }
		expect(processOptions(option)).toEqual(option)
	})

	it("shouldn't do anything if filter is not defined", () => {
		const option = {}
		expect(processOptions(option)).toEqual(option)
	})

	it('should process filter accordingly if it is a function', () => {
		const option: Options = {
			filter: ({ $ }) => $`${'field1'} = "value1" && ${'field2'} = "value2"`,
		}
		const expected = {
			filter: 'field1 = "value1" && field2 = "value2"',
		}
		expect(processOptions(option)).toEqual(expected)
	})

	it("shouldn't touch sort if it's a string", () => {
		const option = { sort: 'field1"' }
		expect(processOptions(option)).toEqual(option)
	})

	it("shouldn't do anything if sort is not defined", () => {
		const option = {}
		expect(processOptions(option)).toEqual(option)
	})

	it('should process sort accordingly if it is a function', () => {
		const option: Options = {
			sort: ({ $ }) => $`${'field1'},${'field2'}`,
		}
		const expected = { sort: 'field1,field2' }
		expect(processOptions(option)).toEqual(expected)
	})
})
