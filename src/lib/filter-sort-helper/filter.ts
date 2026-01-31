import type { SchemaDeclaration } from '../../schema.js'
import type { GetSingleType, Join } from '../type-utils.js'
import type {
	CollectionRef,
	FieldsMapForFilter,
	FilterObject,
	Macros,
	QuotedString,
} from './field-to-type-map.js'

type Stringifiable = string | number | boolean

export type FilterHelpers<
	TSchema extends SchemaDeclaration,
	TCollectionName extends keyof TSchema,
	_MaxDepth extends number = 2,
	_ThisSchema extends FieldsMapForFilter<TSchema, TCollectionName, _MaxDepth> =
		FieldsMapForFilter<TSchema, TCollectionName, _MaxDepth>,
	_AtCollection extends CollectionRef<TSchema> = CollectionRef<TSchema>,
	_All extends _ThisSchema & _AtCollection & Macros = _ThisSchema & _AtCollection & Macros,
	_AnyArrayMap = FilterObject<_All, Array<any>>,
	_StringFieldNames = keyof FilterObject<_ThisSchema & _AtCollection, string>,
	_NumberFieldNames = keyof FilterObject<_ThisSchema & _AtCollection, number>,
	_StringMacros = keyof FilterObject<Macros, string>,
	_NumberMacros = keyof FilterObject<Macros, number>,
	_StringArgs = _StringFieldNames | _StringMacros | QuotedString,
	_NumberArgs = _NumberFieldNames | _NumberMacros | number,
	_NumberArrayArg = keyof FilterObject<_All, Array<number>>,
	_StringArrayArg = keyof FilterObject<_All, Array<string>>,
> = {
	// TODO: remove in next minor release
	/** @deprecated use new helper functions instead */
	$: (str: TemplateStringsArray, ...values: (keyof _All | {} | null | undefined)[]) => string

	and: <const T extends [string, string, ...string[]]>(...conditions: T) => `(${Join<T, '&&'>})`
	or: <const T extends [string, string, ...string[]]>(...conditions: T) => `(${Join<T, '||'>})`

	eq: <
		TA extends keyof _ThisSchema & string,
		TB extends (keyof FilterObject<_All, _TB> | (string extends _TB ? QuotedString : _TB)) &
			Stringifiable,
		_TB = GetSingleType<_ThisSchema[TA]>,
	>(
		a: TA,
		b: TB
	) => `${TA}=${TB}`
	ne: <
		TA extends keyof _ThisSchema & string,
		TB extends (keyof FilterObject<_All, _TB> | (string extends _TB ? QuotedString : _TB)) &
			Stringifiable,
		_TB = GetSingleType<_ThisSchema[TA]>,
	>(
		a: TA,
		b: TB
	) => `${TA}!=${TB}`

	gt: <
		TA extends (_NumberFieldNames | _StringFieldNames) & string,
		TB extends (TA extends _NumberFieldNames ? _NumberArgs : _StringArgs) & Stringifiable,
	>(
		a: TA,
		b: TB
	) => `${TA}>${TB}`
	gte: <
		TA extends (_NumberFieldNames | _StringFieldNames) & string,
		TB extends (TA extends _NumberFieldNames ? _NumberArgs : _StringArgs) & Stringifiable,
	>(
		a: TA,
		b: TB
	) => `${TA}>=${TB}`
	lt: <
		TA extends (_NumberFieldNames | _StringFieldNames) & string,
		TB extends (TA extends _NumberFieldNames ? _NumberArgs : _StringArgs) & Stringifiable,
	>(
		a: TA,
		b: TB
	) => `${TA}<${TB}`
	lte: <
		TA extends (_NumberFieldNames | _StringFieldNames) & string,
		TB extends (TA extends _NumberFieldNames ? _NumberArgs : _StringArgs) & Stringifiable,
	>(
		a: TA,
		b: TB
	) => `${TA}<=${TB}`

	like: <
		TA extends keyof FilterObject<_ThisSchema, string>,
		TB extends (
			| keyof FilterObject<_ThisSchema, string>
			| _StringMacros
			| _CaseSensitiveString
		) &
			string,
		_CaseSensitiveString extends string extends _ThisSchema[TA]
			? QuotedString
			: _ThisSchema[TA],
	>(
		a: TA,
		b: TB
	) => `${TA}~${TB}`
	notLike: <
		TA extends keyof FilterObject<_ThisSchema, string>,
		TB extends (
			| keyof FilterObject<_ThisSchema, string>
			| _StringMacros
			| _CaseSensitiveString
		) &
			string,
		_CaseSensitiveString extends string extends _ThisSchema[TA]
			? QuotedString
			: _ThisSchema[TA],
	>(
		a: TA,
		b: TB
	) => `${TA}!~${TB}`

	anyEq: <
		TA extends keyof _AnyArrayMap & string,
		TB extends (keyof FilterObject<_All, _TB> | (string extends _TB ? QuotedString : _TB)) &
			Stringifiable,
		_TB = GetSingleType<_AnyArrayMap[TA]>,
	>(
		a: TA,
		b: TB
	) => `${TA}?=${TB}`
	anyNe: <
		TA extends keyof _AnyArrayMap & string,
		TB extends (keyof FilterObject<_All, _TB> | (string extends _TB ? QuotedString : _TB)) &
			Stringifiable,
		_TB = GetSingleType<_AnyArrayMap[TA]>,
	>(
		a: TA,
		b: TB
	) => `${TA}?!=${TB}`

	anyGt: <
		TA extends (_NumberArrayArg | _StringArrayArg) & string,
		TB extends (TA extends _NumberArrayArg ? _NumberArgs : _StringArgs) & Stringifiable,
	>(
		a: TA,
		b: TB
	) => `${TA}?>${TB}`
	anyGte: <
		TA extends (_NumberArrayArg | _StringArrayArg) & string,
		TB extends (TA extends _NumberArrayArg ? _NumberArgs : _StringArgs) & Stringifiable,
	>(
		a: TA,
		b: TB
	) => `${TA}?>=${TB}`
	anyLt: <
		TA extends (_NumberArrayArg | _StringArrayArg) & string,
		TB extends (TA extends _NumberArrayArg ? _NumberArgs : _StringArgs) & Stringifiable,
	>(
		a: TA,
		b: TB
	) => `${TA}?<${TB}`
	anyLte: <
		TA extends (_NumberArrayArg | _StringArrayArg) & string,
		TB extends (TA extends _NumberArrayArg ? _NumberArgs : _StringArgs) & Stringifiable,
	>(
		a: TA,
		b: TB
	) => `${TA}?<=${TB}`

	anyLike: <
		TA extends keyof FilterObject<_ThisSchema, string[]>,
		TB extends (keyof FilterObject<_All, string> | _StringMacros | _CaseSensitiveString) &
			string,
		_CaseSensitiveString extends string extends GetSingleType<_ThisSchema[TA]>
			? QuotedString
			: GetSingleType<_ThisSchema[TA]>,
	>(
		a: TA,
		b: TB
	) => `${TA}?~${TB}`
	anyNotLike: <
		TA extends keyof FilterObject<_ThisSchema, string[]>,
		TB extends (keyof FilterObject<_All, string> | _StringMacros | _CaseSensitiveString) &
			string,
		_CaseSensitiveString extends string extends GetSingleType<_ThisSchema[TA]>
			? QuotedString
			: GetSingleType<_ThisSchema[TA]>,
	>(
		a: TA,
		b: TB
	) => `${TA}?!~${TB}`

	between: <
		TA extends (_NumberFieldNames | _StringFieldNames) & string,
		TB extends (TA extends _NumberFieldNames ? _NumberArgs : _StringArgs) & Stringifiable,
		TC extends (TA extends _NumberFieldNames ? _NumberArgs : _StringArgs) & Stringifiable,
	>(
		a: TA,
		b: TB,
		c: TC
	) => `(${TA}>=${TB}&&${TA}<=${TC})`
	notBetween: <
		TA extends (_NumberFieldNames | _StringFieldNames) & string,
		TB extends (TA extends _NumberFieldNames ? _NumberArgs : _StringArgs) & Stringifiable,
		TC extends (TA extends _NumberFieldNames ? _NumberArgs : _StringArgs) & Stringifiable,
	>(
		a: TA,
		b: TB,
		c: TC
	) => `(${TA}<${TB}||${TA}>${TC})`

	inArray: <
		TA extends keyof _ThisSchema & string,
		const TB extends Array<
			(keyof FilterObject<_All, _TB> | (string extends _TB ? QuotedString : _TB)) &
				Stringifiable
		>,
		_TB = GetSingleType<_ThisSchema[TA]>,
	>(
		a: TA,
		b: TB
	) => InArrayReturnType<TA, TB, 'in'>
	notInArray: <
		TA extends keyof _ThisSchema & string,
		const TB extends Array<
			(keyof FilterObject<_All, _TB> | (string extends _TB ? QuotedString : _TB)) &
				Stringifiable
		>,
		_TB = GetSingleType<_ThisSchema[TA]>,
	>(
		a: TA,
		b: TB
	) => InArrayReturnType<TA, TB, 'notIn'>
}

export const filterHelpers = {
	$: (str, ...values) => {
		return values.reduce<string>((acc, val, i) => acc + val + str[i + 1], str[0]!)
	},

	and: (...conditions) => `(${conditions.join('&&')})` as any,
	or: (...conditions) => `(${conditions.join('||')})` as any,
	eq: (a, b) => `${a}=${b}`,
	ne: (a, b) => `${a}!=${b}`,
	gt: (a, b) => `${a}>${b}`,
	gte: (a, b) => `${a}>=${b}`,
	lt: (a, b) => `${a}<${b}`,
	lte: (a, b) => `${a}<=${b}`,
	like: (a, b) => `${a}~${b}`,
	notLike: (a, b) => `${a}!~${b}`,
	anyEq: (a, b) => `${a}?=${b}`,
	anyNe: (a, b) => `${a}?!=${b}`,
	anyGt: (a, b) => `${a}?>${b}`,
	anyGte: (a, b) => `${a}?>=${b}`,
	anyLt: (a, b) => `${a}?<${b}`,
	anyLte: (a, b) => `${a}?<=${b}`,
	anyLike: (a, b) => `${a}?~${b}`,
	anyNotLike: (a, b) => `${a}?!~${b}`,

	between: (a, b, c) => `(${a}>=${b}&&${a}<=${c})`,
	notBetween: (a, b, c) => `(${a}<${b}||${a}>${c})`,

	inArray: (a, b) => `(${b.map((x) => `${a}=${x}`).join('||')})` as any,
	notInArray: (a, b) => `(${b.map((x) => `${a}!=${x}`).join('&&')})` as any,
} as const satisfies FilterHelpers<SchemaDeclaration, keyof SchemaDeclaration>

type InArrayReturnType<
	TField extends string,
	TArray extends Stringifiable[],
	Method extends 'in' | 'notIn',
	_Acc extends string[] = [],
	_Operators extends [string, string] = {
		in: ['=', '||']
		notIn: ['!=', '&&']
	}[Method],
> = TArray extends [infer F extends string, ...infer Rest extends string[]]
	? InArrayReturnType<TField, Rest, Method, [..._Acc, `${TField}${_Operators[0]}${F}`]>
	: `(${Join<_Acc, _Operators[1]>})`
