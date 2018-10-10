namespace Aurora {
    export class ARRFile {
        public static readonly FILE_HEADER = 0xBFC2D4F6;

        public static readonly CHUNK_HEAD = 0x0001;

        private _version: uint = 0;

        public get version(): uint {
            return this._version;
        }

        public static encode(): void {

        }

        public static parse(data: ByteArray): ARRFile {
            let file = new ARRFile();

            let pos = data.position;
            let endian = data.littleEndian;
            data.position = 0;
            data.littleEndian = true;

            if (data.readUint32() === ARRFile.FILE_HEADER) {
                while (data.bytesAvailable >= 2) {
                    let chunk = data.readUint16();
                    let lenType = chunk & 0b11;
                    let length: uint = 0;
                    switch (chunk & 0b11) {
                        case 1:
                            length = data.readUint8();
                            break;
                        case 2:
                            length = data.readUint16();
                            break;
                        case 3:
                            length = data.readUint32();
                            break;
                        default:
                            break;
                    }
                    chunk = chunk >> 2 & 0xFFFF;
                    let pos = data.position;
                    switch (chunk) {
                        case ARRFile.CHUNK_HEAD:
                            ARRFile._parseHead(data, length, file);
                            break;
                        default:
                            console.log(`Parse ARR File: not define chunk (${chunk.toString(16)})`);
                            break;
                    }
                    data.position = pos + length;
                }
            }

            data.position = pos;
            data.littleEndian = endian;

            return file;
        }

        private static _parseHead(data: ByteArray, length: uint, file: ARRFile): void {
            file._version = data.readUint24();
            let att = data.readUint8();
        }
    }
}