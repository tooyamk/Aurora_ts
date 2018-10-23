namespace Aurora {
    export interface IByteArrayDecodeUTF8Result {
        byteLength: uint;
        string: string;
    }

    export const enum ByteArrayStringMode {
        END_MARK,
        DYNAMIC_LENGTH,
        FIXED_LENGTH
    }

    export class ByteArray {
        private _pos: uint = 0;
        private _logicLen: uint = 0;
        private _rawLen: uint = 0;
        private _raw: DataView;
        private _little: boolean = true;

        constructor(data: ArrayBuffer | uint | null = null, offset: uint = 0, logicLength: uint = null, rawLength: uint = null) {
            if (data instanceof ArrayBuffer) {
                let len = data.byteLength;
                if (offset > len) offset = len;
                if (rawLength === null || rawLength === undefined) {
                    rawLength = len - offset;
                } else if (offset + rawLength > len) {
                    rawLength = len - offset;
                }

                this._raw = new DataView(data, offset, rawLength);
                this._rawLen = rawLength;

                this._logicLen = logicLength === null || logicLength === undefined || logicLength > rawLength ? rawLength : logicLength;
            } else {
                if (data === null || data === undefined) data = 32;
                this._raw = new DataView(new ArrayBuffer(data));
                this._rawLen = data;

                if (logicLength !== null && logicLength !== undefined) this._logicLen = logicLength > data ? data : logicLength;
            }
        }

        public get littleEndian(): boolean {
            return this._little;
        }

        public set littleEndian(b: boolean) {
            this._little = b;
        }

        public get position(): uint {
            return this._pos;
        }

        public set position(pos: uint) {
            if (pos > this._logicLen) pos = this._logicLen;
            this._pos = pos;
        }

        public get length(): uint {
            return this._logicLen;
        }

        public set length(len: uint) {
            let sub = len - this._logicLen;
            if (sub > 0) {
                this._checkAndAllocateSpace(sub);
            } else if (sub < 0) {
                this._logicLen = len;
                if (this._pos > this._logicLen) this._pos = this._logicLen;
            }
        }

        public get raw(): ArrayBuffer {
            return this._raw.buffer;
        }

        public get bytesAvailable(): uint {
            return this._logicLen - this._pos;
        }

        public readBool(): boolean {
            if (this._pos + 1 > this._logicLen) {
                this._pos = this._logicLen;
                return false;
            } else {
                return this._raw.getUint8(this._pos++) !== 0;
            }
        }

        public writeBool(value: boolean): void {
            this._checkAndAllocateSpace(1);
            this._raw.setUint8(this._pos++, value ? 1 : 0);
        }

        public readInt8(): int {
            if (this._pos + 1 > this._logicLen) {
                this._pos = this._logicLen;
                return 0;
            } else {
                return this._raw.getInt8(this._pos++);
            }
        }

        public writeInt8(value: int): void {
            this._checkAndAllocateSpace(1);
            this._raw.setInt8(this._pos++, value);
        }

        public readUint8(): uint {
            if (this._pos + 1 > this._logicLen) {
                this._pos = this._logicLen;
                return 0;
            } else {
                return this._raw.getUint8(this._pos++);
            }
        }

        public writeUint8(value: uint): void {
            this._checkAndAllocateSpace(1);
            this._raw.setUint8(this._pos++, value);
        }

        public readInt16(): int {
            if (this._pos + 2 > this._logicLen) {
                this._pos = this._logicLen;
                return 0;
            } else {
                let v = this._raw.getInt16(this._pos, this._little);
                this._pos += 2;
                return v;
            }
        }

        public writeInt16(value: int): void {
            this._checkAndAllocateSpace(2);
            this._raw.setInt16(this._pos, value, this._little);
            this._pos += 2;
        }

        public readUint16(): uint {
            if (this._pos + 2 > this._logicLen) {
                this._pos = this._logicLen;
                return 0;
            } else {
                let v = this._raw.getUint16(this._pos, this._little);
                this._pos += 2;
                return v;
            }
        }

        public writeUint16(value: uint): void {
            this._checkAndAllocateSpace(2);
            this._raw.setUint16(this._pos, value, this._little);
            this._pos += 2;
        }

        public readInt24(): int {
            let v = this.readUint24();
            if (v > 0x7FFFFF) return v - 0x1000000;
            return v;
        }

        public writeInt24(value: int): void {
            if (value < 0) value += 0x1000000;
            this.writeUint24(value);
        }

        public readUint24(): uint {
            if (this._pos + 3 > this._logicLen) {
                this._pos = this._logicLen;
                return 0;
            } else {
                let v0 = this._raw.getUint8(this._pos);
                let v1 = this._raw.getUint8(this._pos + 1);
                let v2 = this._raw.getUint8(this._pos + 2);
                this._pos += 3;
                if (this._little) {
                    return v2 << 16 | v1 << 8 | v0;
                } else {
                    return v0 << 16 | v1 << 8 | v2;
                }
            }
        }

        public writeUint24(value: uint): void {
            this._checkAndAllocateSpace(3);
            if (this._little) {
                this._raw.setUint8(this._pos, value & 0xFF);
                this._raw.setUint8(this._pos + 1, value >> 8 & 0xFF);
                this._raw.setUint8(this._pos + 2, value >> 16 & 0xFF);
            } else {
                this._raw.setUint8(this._pos, value >> 16 & 0xFF);
                this._raw.setUint8(this._pos + 1, value >> 8 & 0xFF);
                this._raw.setUint8(this._pos + 2, value & 0xFF);
            }
            this._pos += 3;
        }

        public readInt32(): int {
            if (this._pos + 4 > this._logicLen) {
                this._pos = this._logicLen;
                return 0;
            } else {
                let v = this._raw.getInt32(this._pos, this._little);
                this._pos += 4;
                return v;
            }
        }

        public writeInt32(value: int): void {
            this._checkAndAllocateSpace(4);
            this._raw.setInt32(this._pos, value, this._little);
            this._pos += 4;
        }

        public readUint32(): uint {
            if (this._pos + 4 > this._logicLen) {
                this._pos = this._logicLen;
                return 0;
            } else {
                let v = this._raw.getUint32(this._pos, this._little);
                this._pos += 4;
                return v;
            }
        }

        public writeUint32(value: uint): void {
            this._checkAndAllocateSpace(4);
            this._raw.setUint32(this._pos, value, this._little);
            this._pos += 4;
        }

        public readInt64(): string {
            return this._readInt64(true);
        }

        public readUint64(): string {
            return this._readInt64(false);
        }

        private _readInt64(signed: boolean): string {
            if (this._pos + 8 > this._logicLen) {
                this._pos = this._logicLen;
                return "0";
            } else {
                let low: uint, high: uint;
                if (this._little) {
                    low = this._raw.getUint32(this._pos, true);
                    high = this._raw.getUint32(this._pos + 4, true);
                } else {
                    high = this._raw.getUint32(this._pos, false);
                    low = this._raw.getUint32(this._pos + 4, false);
                }
                this._pos += 8;
                let lowHex = low.toString(16);
                for (let i = 0, n = 8 - lowHex.length; i < n; ++i) lowHex = "0" + lowHex;
                return StringInteger.toDecimal("0x" + high.toString(16) + lowHex, 64, signed);
            }
        }

        public writeInt64(value: string): void {
            this._writeInt64(value);
        };

        public writeUint64(value: string): void {
            this._writeInt64(value);
        }

        private _writeInt64(value: string): void {
            this._checkAndAllocateSpace(8);
            let hex = StringInteger.toHexadecimal(value, 64);
            let low: uint, high: uint;
            let len = hex.length;
            if (hex.length > 8) {
                len -= 8;
                low = parseInt(hex.substr(len, 8), 16);
                high = parseInt(hex.substr(0, len), 16);
            } else {
                low = parseInt(hex, 16);
                high = 0;
            }
            if (this._little) {
                this._raw.setUint32(this._pos, low, true);
                this._raw.setUint32(this._pos + 4, high, true);
            } else {
                this._raw.setUint32(this._pos, high, false);
                this._raw.setUint32(this._pos + 4, low, false);
            }

            this._pos += 8;
        }

        public readFloat32(): number {
            if (this._pos + 4 > this._logicLen) {
                this._pos = this._logicLen;
                return 0;
            } else {
                let v = this._raw.getFloat32(this._pos, this._little);
                this._pos += 4;
                return v;
            }
        }

        public writeFloat32(value: number): void {
            this._checkAndAllocateSpace(4);
            this._raw.setFloat32(this._pos, value, this._little);
            this._pos += 4;
        }

        public readFloat64(): number {
            if (this._pos + 8 > this._logicLen) {
                this._pos = this._logicLen;
                return 0;
            } else {
                let v = this._raw.getFloat64(this._pos, this._little);
                this._pos += 8;
                return v;
            }
        }

        public writeFloat64(value: number): void {
            this._checkAndAllocateSpace(8);
            this._raw.setFloat64(this._pos, value, this._little);
            this._pos += 8;
        }

        public readBytes(length: uint): ByteArray;
        public readBytes(value: ByteArray, length: uint): void;

        public readBytes(...args: any[]): ByteArray | void {
            let bytes: ByteArray = null;
            let length: uint = null;

            if (args.length === 1) {
                length = args[0];
            } else {
                bytes = args[0];
                length = args[1];
            }

            let last = this._logicLen - this._pos;
            if (length === null || length === undefined) {
                length = last;
            } else if (length > last) {
                length = last;
            }
            
            if (!bytes) bytes = new ByteArray(length);
            bytes.writeBytes(this, length);
            this._pos += length;
        }

        public writeBytes(value: ByteArray, length: uint = null): void {
            let last = value.length - value.position;
            if (length === null || length === undefined) {
                length = last;
            } else if (length > last) {
                length = last;
            }

            this._checkAndAllocateSpace(length);
            let src = value._raw, dst = this._raw;
            let srcStart = value.position, dstStart = this._pos;
            for (let i = 0; i < length; ++i) dst.setUint8(dstStart + i, src.getUint8(srcStart + i));
            this._pos += length;
        }

        public readString(mode: ByteArrayStringMode, maxLength: uint = null): string {
            switch (mode) {
                case ByteArrayStringMode.END_MARK: {
                    let rst = ByteArray.decodeUTF8(this._raw, this._pos, maxLength);
                    this._pos += rst.byteLength;
                    return rst.string;
                }
                case ByteArrayStringMode.DYNAMIC_LENGTH: {
                    let n = this.readDynamicLength();
                    let rst = ByteArray.decodeUTF8(this._raw, this._pos, n);
                    this._pos += n;
                    return rst.string;
                }
                case ByteArrayStringMode.FIXED_LENGTH: {
                    let rst = ByteArray.decodeUTF8(this._raw, this._pos, maxLength);
                    this._pos += maxLength === null || maxLength === undefined || maxLength < 0 ? rst.byteLength : maxLength;
                    return rst.string;
                }
                default:
                    return "";
            }
        }

        public writeString(value: string, mode: ByteArrayStringMode): void {
            let arr = ByteArray.encodeUTF8(value);
            let n = arr.length;
            switch (mode) {
                case ByteArrayStringMode.END_MARK, ByteArrayStringMode.FIXED_LENGTH: {
                    this._checkAndAllocateSpace(n + 1);
                    let raw = this._raw;
                    let pos = this._pos;
                    for (let i = 0; i < n; ++i) raw.setUint8(pos++, arr[i]);
                    raw.setUint8(pos++, 0);

                    break;
                }
                case ByteArrayStringMode.DYNAMIC_LENGTH: {
                    this.writeDynamicLength(n);
                    this._checkAndAllocateSpace(n);
                    let raw = this._raw;
                    let pos = this._pos;
                    for (let i = 0; i < n; ++i) raw.setUint8(pos++, arr[i]);

                    break;
                }
                default:
                    break;
            }
        }

        private _checkAndAllocateSpace(need: uint): void {
            let needRawLen = this._pos + need;
            if (needRawLen > this._logicLen) {
                if (needRawLen > this._rawLen) {
                    let newRawLen = (this._rawLen * 1.5) | 0;
                    if (newRawLen < needRawLen) newRawLen = (needRawLen * 1.5) | 0;
                    let newRaw = new DataView(new ArrayBuffer(newRawLen));
                    let oldRaw = this._raw;
                    for (let i = 0, n = this._rawLen; i < n; ++i) newRaw.setUint8(i, oldRaw.getUint8(i));
                    this._raw = newRaw;
                    this._rawLen = newRawLen;
                }
                this._logicLen += need;
            }
        }

        public writeDynamicLength(length: uint): void {
            if (length <= 0x7F) {
                this.writeUint8(length);
            } else if (length <= 0x3FFF) {
                this._checkAndAllocateSpace(2);
                this._raw.setUint8(this._pos++, 0x80 | (length & 0x7F));
                this._raw.setUint8(this._pos++, length >> 7 & 0x7F);
            } else if (length <= 0x1FFFFF) {
                this._checkAndAllocateSpace(3);
                this._raw.setUint8(this._pos++, 0x80 | (length & 0x7F));
                this._raw.setUint8(this._pos++, 0x80 | (length >> 7 & 0x7F));
                this._raw.setUint8(this._pos++, length >> 14 & 0x7F);
            } else {
                this._checkAndAllocateSpace(4);
                this._raw.setUint8(this._pos++, 0x80 | (length & 0x7F));
                this._raw.setUint8(this._pos++, 0x80 | (length >> 7 & 0x7F));
                this._raw.setUint8(this._pos++, 0x80 | (length >> 14 & 0x7F));
                this._raw.setUint8(this._pos++, length >> 21 & 0x7F);
            }
        }

        public readDynamicLength(): uint {
            let v0 = this.readUint8();
            if (v0 > 127) {
                let v1 = this.readUint8();
                if (v1 > 127) {
                    let v2 = this.readUint8();
                    if (v2 > 127) {
                        let v3 = this.readUint8();
                        return (v3 << 21) | (v2 << 14 & 0x7F) | (v1 << 7 & 0x7F) | (v0 & 0x7F);
                    } else {
                        return (v2 << 14) | (v1 << 7 & 0x7F) | (v0 & 0x7F);
                    }
                } else {
                    return (v1 << 7) | (v0 & 0x7F);
                }
            } else {
                return v0;
            }
        }

        public static encodeUTF8(s: string): uint[] {
            let bytes: uint[] = [];
            let num = 0;
            for (let i = 0, n = s.length; i < n; ++i) {
                let c = s.charCodeAt(i);
                if (c < 0x80) {
                    bytes[num++] = c;
                } else if (c < 0x800) {
                    bytes[num++] = 0xC0 + (c >> 6 & 0x1F);
                    bytes[num++] = 0x80 + (c & 0x3F);
                } else {
                    let x = c ^ 0xD800;
                    if (x >> 10 === 0) {
                        c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000;
                        bytes[num++] = 0xF0 + (c >> 18 & 0x7);
                        bytes[num++] = 0x80 + (c >> 12 & 0x3F);
                    } else {
                        bytes[num++] = 0xE0 + (c >> 12 & 0xF);
                    }
                    bytes[num++] = 0x80 + (c >> 6 & 0x3F);
                    bytes[num++] = 0x80 + (c & 0x3F);
                }
            }
            return bytes;
        }

        public static decodeUTF8(bytes: DataView, offset: uint = 0, maxLength: uint = null): IByteArrayDecodeUTF8Result {
            let str = "";
            let i = offset;
            let len = maxLength === null || maxLength === undefined ? bytes.byteLength : offset + maxLength;
            let char2: uint, char3: uint;
            while (i < len) {
                let c = bytes.getUint8(i++);
                if (c === 0) {
                    break;
                } else {
                    switch (c >> 4) {
                        case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                            // 0xxxxxxx
                            str += String.fromCharCode(c);
                            break;
                        case 12: case 13:
                            // 110x xxxx   10xx xxxx
                            char2 = bytes.getUint8(i++);
                            str += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                            break;
                        case 14:
                            // 1110 xxxx  10xx xxxx  10xx xxxx
                            char2 = bytes.getUint8(i++);
                            char3 = bytes.getUint8(i++);
                            str += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
                            break;
                    }
                }
            }

            return { byteLength: i - offset, string: str };
        }
    }
}