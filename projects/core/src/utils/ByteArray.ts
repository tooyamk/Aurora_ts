namespace Aurora {
    export interface IDecodeUTF8Result {
        byteLength: uint;
        string: string;
    }

    export class ByteArray {
        private _pos: uint = 0;
        private _logicLen: uint = 0;
        private _rawLen: uint = 0;
        private _raw: DataView;
        private _little: boolean = true;

        constructor(data: ArrayBuffer | uint | null = null, offset: uint = 0, length: uint = null) {
            if (data instanceof ArrayBuffer) {
                this._raw = new DataView(data, offset, length);
                this._rawLen = this._raw.byteLength;
            } else {
                if (data === null || data === undefined) data = 32;
                this._raw = new DataView(new ArrayBuffer(data));
                this._rawLen = data;
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

        public readInt8(): int {
            if (this._pos + 1 > this._logicLen) {
                this._pos = this._logicLen
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
                this._pos = this._logicLen
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
                this._pos = this._logicLen
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
                this._pos = this._logicLen
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
                this._pos = this._logicLen
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
                this._pos = this._logicLen
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
                this._pos = this._logicLen
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

        public readFloat32(): number {
            if (this._pos + 4 > this._logicLen) {
                this._pos = this._logicLen
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
                this._pos = this._logicLen
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

        public readBytes(value: ByteArray, length: uint = null): void {
            let last = this._logicLen - this._pos;
            if (length === null || length === undefined) {
                length = last;
            } else if (length > last) {
                length = last;
            }
            
            value.writeBytes(this, length);
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

        public readString(maxLength: uint = null): string {
            let rst = ByteArray.decodeUTF8(this._raw, this._pos, maxLength);
            this._pos += rst.byteLength;
            return rst.string;
        }

        public writeString(value: string): void {
            let arr = ByteArray.encodeUTF8(value);
            let n = arr.length;
            this._checkAndAllocateSpace(n + 1);
            let raw = this._raw;
            let pos = this._pos;
            for (let i = 0; i < n; ++i) {
                raw.setUint8(pos++, arr[i]);
            }
            raw.setUint8(pos++, 0);
            this._pos = pos;
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

        public static decodeUTF8(bytes: DataView, offset: uint = 0, maxLength: uint = null): IDecodeUTF8Result {
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