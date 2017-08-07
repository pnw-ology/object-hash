/**
 * Exported function
 *
 * Options:
 *
 *  - `algorithm` hash algo to be used by this instance: *'sha1', 'md5'
 *  - `excludeValues` {true|*false} hash object keys, values ignored
 *  - `encoding` hash encoding, supports 'buffer', '*hex', 'binary', 'base64'
 *  - `ignoreUnknown` {true|*false} ignore unknown object types
 *  - `replacer` optional function that replaces values before hashing
 *  - `respectFunctionProperties` {*true|false} consider function properties when hashing
 *  - `respectFunctionNames` {*true|false} consider 'name' property of functions for hashing
 *  - `respectType` {*true|false} Respect special properties (prototype, constructor)
 *    when hashing to distinguish between types
 *  - `unorderedArrays` {true|*false} Sort all arrays before hashing
 *  - `unorderedSets` {*true|false} Sort `Set` and `Map` instances before hashing
 *  * = default
 *
 * @param {object} object value to hash
 * @param {object} options hashing options
 * @return {string} hash value
 * @api public
 */
export declare class OptionsObject {
    algorithm?: string;
    excludeValues?: boolean;
    encoding?: string;
    ignoreUnknown?: boolean;
    replacer?: any;
    respectFunctionProperties?: boolean;
    respectFunctionNames?: boolean;
    respectType?: boolean;
    unorderedArrays?: boolean;
    unorderedSets?: boolean;
}
export declare class StreamObject {
    write?: Function;
    update?: Function;
}
export declare function objectHash(object: object, options?: OptionsObject): string;
/**
 * Exported sugar methods
 *
 * @param {object} object value to hash
 * @return {string} hash value
 * @api public
 */
export declare function sha1(object: any): string;
export declare function keys(object: any): string;
export declare function MD5(object: any): string;
export declare function keysMD5(object: any): string;
/**
 * Expose streaming API
 *
 * @param {object} object  Value to serialize
 * @param {object} options  Options, as for hash()
 * @param {object} stream  A stream to write the serializiation to
 * @api public
 */
export declare function writeToStream(object: any, options: OptionsObject, stream: any): any;
