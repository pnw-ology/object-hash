/* typescript version ported from: puleos/object-hash by Brian Johnson */

declare const Buffer: any;
declare var require: (moduleId: string) => any;
const crypto = require('webcrypto');

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

export class OptionsObject {
    public algorithm?: string = 'sha1';
    public excludeValues?: boolean = false;
    public encoding?: string = 'hex';
    public ignoreUnknown?: boolean = false;
    public replacer?: any;
    public respectFunctionProperties?: boolean = true;
    public respectFunctionNames?: boolean = true;
    public respectType?: boolean = true;
    public unorderedArrays?: boolean = false;
    public unorderedSets?: boolean = true;
}

export class StreamObject {
    public write?: Function;
    public update?: Function;
}

export function objectHash(object: object, options?: OptionsObject): string {
    options = applyDefaults(object, options);
    return hash(object, options);
}

/**
 * Exported sugar methods
 *
 * @param {object} object value to hash
 * @return {string} hash value
 * @api public
 */
export function sha1(object: any) {
    return objectHash(object);
}
export function keys(object: any) {
    return objectHash(object, { excludeValues: true, algorithm: 'sha1', encoding: 'hex' });
}
export function MD5(object: any) {
    return objectHash(object, { algorithm: 'md5', encoding: 'hex' });
}
export function keysMD5(object: any) {
    return objectHash(object, { algorithm: 'md5', encoding: 'hex', excludeValues: true });
}

// Internals
let hashes = crypto.getHashes ? crypto.getHashes().slice() : ['sha1', 'md5'];
hashes.push('passthrough');
let encodings = ['buffer', 'hex', 'binary', 'base64'];

function applyDefaults(object: any, options?: OptionsObject) {
    options = options || {};
    options.algorithm = options.algorithm || 'sha1';
    options.encoding = options.encoding || 'hex';
    options.excludeValues = options.excludeValues ? true : false;
    options.algorithm = options.algorithm.toLowerCase();
    options.encoding = options.encoding.toLowerCase();
    options.ignoreUnknown = options.ignoreUnknown !== true ? false : true; // default to false
    options.respectType = options.respectType === false ? false : true; // default to true
    options.respectFunctionNames = options.respectFunctionNames === false ? false : true;
    options.respectFunctionProperties = options.respectFunctionProperties === false ? false : true;
    options.unorderedArrays = options.unorderedArrays !== true ? false : true; // default to false
    options.unorderedSets = options.unorderedSets === false ? false : true; // default to false
    options.replacer = options.replacer || undefined;

    if (typeof object === 'undefined') {
        throw new Error('Object argument required.');
    }

    // if there is a case-insensitive match in the hashes list, accept it
    // (i.e. SHA256 for sha256)
    for (let i = 0; i < hashes.length; ++i) {
        if (options.algorithm && hashes[i].toLowerCase() === options.algorithm.toLowerCase()) {
            options.algorithm = hashes[i];
        }
    }

    if (hashes.indexOf(options.algorithm) === -1) {
        throw new Error('Algorithm "' + options.algorithm + '"  not supported. ' +
            'supported values: ' + hashes.join(', '));
    }

    if (encodings.indexOf(options.encoding) === -1 &&
        options.algorithm !== 'passthrough') {
        throw new Error('Encoding "' + options.encoding + '"  not supported. ' +
            'supported values: ' + encodings.join(', '));
    }

    return options;
}

/** Check if the given function is a native function */
function isNativeFunction(f: Function) {
    if ((typeof f) !== 'function') {
        return false;
    }
    let exp = /^function\s+\w*\s*\(\s*\)\s*{\s+\[native code\]\s+}$/i;
    return exp.exec(Function.prototype.toString.call(f)) !== null;
}

function hash(object: any, options: OptionsObject): string {
    let hashingStream;

    if (options.algorithm !== 'passthrough') {
        hashingStream = crypto.createHash(options.algorithm);
    } else {
        hashingStream = Object.create(PassThrough());
    }

    if (typeof hashingStream.write === 'undefined') {
        hashingStream.write = hashingStream.update;
        hashingStream.end = hashingStream.update;
    }

    let hasher = typeHasher(options, hashingStream);
    hasher.dispatch(object);
    if (!hashingStream.update) { hashingStream.end(''); }

    if (hashingStream.digest) {
        return hashingStream.digest(options.encoding === 'buffer' ? undefined : options.encoding);
    }

    let buf = hashingStream.read();
    if (options.encoding === 'buffer') {
        return buf;
    }

    return buf.toString(options.encoding);
}

/**
 * Expose streaming API
 *
 * @param {object} object  Value to serialize
 * @param {object} options  Options, as for hash()
 * @param {object} stream  A stream to write the serializiation to
 * @api public
 */
export function writeToStream(object: any, options: OptionsObject, stream: any) {
    if (typeof stream === 'undefined') {
        stream = options;
        options = {};
    }

    options = applyDefaults(object, options);

    return typeHasher(options, stream).dispatch(object);
}

function typeHasher(options: OptionsObject, writeTo?: StreamObject, context?: string | Array<string>) {
    context = context || [];
    let write = function (str: string, encoding?: string) {
        if (writeTo && writeTo.update)
            return writeTo.update(str, 'utf8');
        else
            if (writeTo && writeTo.write) { return writeTo.write!(str, 'utf8'); } else { return; }
    };

    return {
        dispatch: function (value: any) {
            if (options.replacer) {
                value = options.replacer(value);
            }

            let type = <string>typeof value;

            if (value === null) {
                type = 'null';
            }

            return this['_' + <string>type](value);
        },
        _object: function (object: any) {
            let pattern = (/\[object (.*)\]/i);
            let objString = Object.prototype.toString.call(object);
            let objType: string | null | RegExpExecArray = pattern.exec(objString);
            if (!objType) { // object type did not match [object ...]
                objType = 'unknown:[' + objString + ']';
            } else {
                objType = objType[1]; // take only the class name
            }

            objType = objType.toLowerCase();

            let objectNumber = null;

            if (<String>context) {
                if ((objectNumber = (<String>context).indexOf(object)) >= 0) {
                    return this.dispatch('[CIRCULAR:' + objectNumber + ']');
                } else {
                    (<Array<string>>context).push(object);
                }
            }


            if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(object)) {
                write('buffer:');
                return write(object);
            }

            if (objType !== 'object' && objType !== 'function') {
                if (this['_' + objType]) {
                    this['_' + objType](object);
                } else if (options.ignoreUnknown) {
                    return write('[' + objType + ']');
                } else {
                    throw new Error('Unknown object type "' + objType + '"');
                }
            } else {
                let keys = Object.keys(object).sort();
                // Make sure to incorporate special properties, so
                // Types with different prototypes will produce
                // a different hash and objects derived from
                // different functions (`new Foo`, `new Bar`) will
                // produce different hashes.
                // We never do this for native functions since some
                // seem to break because of that.
                if (options.respectType !== false && !isNativeFunction(object)) {
                    keys.splice(0, 0, 'prototype', '__proto__', 'constructor');
                }

                write('object:' + keys.length + ':');
                let self = this;
                return keys.forEach(function (key) {
                    self.dispatch(key);
                    write(':');
                    if (!options.excludeValues) {
                        self.dispatch(object[key]);
                    }
                    write(',');
                });
            }
        },
        _array: function (arr: any, unordered: any) {
            unordered = typeof unordered !== 'undefined' ? unordered :
                options.unorderedArrays !== false; // default to options.unorderedArrays

            let self = this;
            write('array:' + arr.length + ':');
            if (!unordered || arr.length <= 1) {
                return arr.forEach(function (entry: any) {
                    return self.dispatch(entry);
                });
            }

            // the unordered case is a little more complicated:
            // since there is no canonical ordering on objects,
            // i.e. {a:1} < {a:2} and {a:1} > {a:2} are both false,
            // we first serialize each entry using a PassThrough stream
            // before sorting.
            // also: we can’t use the same context array for all entries
            // since the order of hashing should *not* matter. instead,
            // we keep track of the additions to a copy of the context array
            // and add all of them to the global context array when we’re done
            let contextAdditions: Array<any> = [];
            let entries = arr.map(function (entry: any) {
                let strm = (<any>Object).create(PassThrough());
                let localContext = context!.slice(); // make copy
                let hasher = typeHasher(options, strm, localContext);
                hasher.dispatch(entry);
                // take only what was added to localContext and append it to contextAdditions
                contextAdditions = contextAdditions.concat(localContext.slice(context!.length));
                return strm.read().toString();
            });
            context = (<any>context).concat(contextAdditions);
            entries.sort();
            return this._array(entries, false);
        },
        _date: function (date: Date) {
            return write('date:' + date.toJSON());
        },
        _symbol: function (sym: Symbol) {
            return write('symbol:' + sym.toString());
        },
        _error: function (err: Error) {
            return write('error:' + err.toString());
        },
        _boolean: function (bool: Boolean
        ) {
            return write('bool:' + bool.toString());
        },
        _string: function (string: string) {
            write('string:' + string.length + ':');
            write(string);
        },
        _function: function (fn: Function) {
            write('fn:');
            if (isNativeFunction(fn)) {
                this.dispatch('[native]');
            } else {
                this.dispatch(fn.toString());
            }

            if (options.respectFunctionNames !== false) {
                // Make sure we can still distinguish native functions
                // by their name, otherwise String and Function will
                // have the same hash
                this.dispatch('function-name:' + String(fn.name));
            }

            if (options.respectFunctionProperties) {
                this._object(fn);
            }
        },
        _number: function (number: Number) {
            return write('number:' + number.toString());
        },
        _xml: function (xml: XMLDocument) {
            return write('xml:' + xml.toString());
        },
        _null: function () {
            return write('Null');
        },
        _undefined: function () {
            return write('Undefined');
        },
        _regexp: function (regex: RegExp) {
            return write('regex:' + regex.toString());
        },
        _uint8array: function (arr: Array<any>) {
            write('uint8array:');
            return this.dispatch(Array.prototype.slice.call(arr));
        },
        _uint8clampedarray: function (arr: Array<any>) {
            write('uint8clampedarray:');
            return this.dispatch(Array.prototype.slice.call(arr));
        },
        _int8array: function (arr: Array<any>) {
            write('uint8array:');
            return this.dispatch(Array.prototype.slice.call(arr));
        },
        _uint16array: function (arr: Array<any>) {
            write('uint16array:');
            return this.dispatch(Array.prototype.slice.call(arr));
        },
        _int16array: function (arr: Array<any>) {
            write('uint16array:');
            return this.dispatch(Array.prototype.slice.call(arr));
        },
        _uint32array: function (arr: Array<any>) {
            write('uint32array:');
            return this.dispatch(Array.prototype.slice.call(arr));
        },
        _int32array: function (arr: Array<any>) {
            write('uint32array:');
            return this.dispatch(Array.prototype.slice.call(arr));
        },
        _float32array: function (arr: Array<any>) {
            write('float32array:');
            return this.dispatch(Array.prototype.slice.call(arr));
        },
        _float64array: function (arr: Array<any>) {
            write('float64array:');
            return this.dispatch(Array.prototype.slice.call(arr));
        },
        _arraybuffer: function (arr: Array<any>) {
            write('arraybuffer:');
            return this.dispatch(new Uint8Array(arr));
        },
        _url: function (url: URL) {
            return write('url:' + url.toString());
        },
        _map: function (map: Map<string, any>) {
            write('map:');
            let arr = Array.from(map);
            return this._array(arr, options.unorderedSets !== false);
        },
        _set: function (set: Set<any>) {
            write('set:');
            let arr = Array.from(set);
            return this._array(arr, options.unorderedSets !== false);
        },
        _blob: function () {
            if (options.ignoreUnknown) {
                return write('[blob]');
            }

            throw Error('Hashing Blob objects is currently not supported\n' +
                '(see https://github.com/puleos/object-hash/issues/26)\n' +
                'Use "options.replacer" or "options.ignoreUnknown"\n');
        },
        _domwindow: function () { return write('domwindow'); },
        /* Node.js standard native objects */
        _process: function () { return write('process'); },
        _timer: function () { return write('timer'); },
        _pipe: function () { return write('pipe'); },
        _tcp: function () { return write('tcp'); },
        _udp: function () { return write('udp'); },
        _tty: function () { return write('tty'); },
        _statwatcher: function () { return write('statwatcher'); },
        _securecontext: function () { return write('securecontext'); },
        _connection: function () { return write('connection'); },
        _zlib: function () { return write('zlib'); },
        _context: function () { return write('context'); },
        _nodescript: function () { return write('nodescript'); },
        _httpparser: function () { return write('httpparser'); },
        _dataview: function () { return write('dataview'); },
        _signal: function () { return write('signal'); },
        _fsevent: function () { return write('fsevent'); },
        _tlswrap: function () { return write('tlswrap'); }
    };
}

// Mini-implementation of stream.PassThrough
// We are far from having need for the full implementation, and we can
// make assumtions like "many writes, then only one final read"
// and we can ignore encoding specifics
function PassThrough() {
    return {
        buf: '',

        write: function (b: any) {
            this.buf += b;
        },

        end: function (b: any) {
            this.buf += b;
        },

        read: function () {
            return this.buf;
        }
    };
}

