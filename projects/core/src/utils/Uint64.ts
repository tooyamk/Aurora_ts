namespace Aurora {
    export class StringInteger {
        private _low: uint = 0;
        private _high: uint = 0;

        public get low(): uint {
            return this._low;
        }

        public get high(): uint {
            return this._high;
        }

        public get signed(): int {
            if (this._high > 2147483647) {

            } else {
                return this._high * 4294967296 + this._low;
            }
            return 0;
        }

        public get unsigned(): uint {
            return this._high * 4294967296 + this._low;
        }

        public set(value: StringInteger): void {
            this._high = value._high;
            this._low = value._low;
        }

        public setSeparate(high: uint, low: uint): void {
            this._high = high;
            this._low = low;
        }

        private static _compare(a: string, b: string): int {
            let lenA = a.length;
            let lenB = b.length;
            if (lenA > lenB) {
                return 1;
            } else if (lenA < lenB) {
                return -1;
            } else {
                for (let i = 0; i < lenA; ++i) {
                    let c0 = a.charCodeAt(i);
                    let c1 = b.charCodeAt(i);
                    if (c0 > c1) {
                        return 1;
                    } else if (c0 < c1) {
                        return -1;
                    }
                }
                return 0;
            }
        }

        public static add(a: string, b: string): string {
            let d0 = StringInteger.toDecimal(a);
            let d1 = StringInteger.toDecimal(b);

            let negativeA = d0.charAt(0) === "-";
            let negativeB = d1.charAt(0) === "-";

            if (negativeA) {
                if (negativeB) {
                    let n = StringInteger._add(d0.substr(1), d1.substr(1));
                    return n === "0" ? n : "-" + n;
                } else {
                    return StringInteger._sub(d0.substr(1), d1);
                }
            } else if (negativeB) {
                return StringInteger._sub(d0, d1.substr(1));
            } else {
                return StringInteger._add(d0, d1);
            }
        }

        private static _add(a: string, b: string): string {
            let rst = "";

            let digitsA = a.length;
            let digitsB = b.length;

            let maxDigits = digitsA > digitsB ? digitsA : digitsB;

            let tens = 0;
            for (let i = 1; i <= maxDigits; ++i) {
                let n0 = i <= digitsA ? a.charCodeAt(digitsA - i) - 48 : 0;
                let n1 = i <= digitsB ? b.charCodeAt(digitsB - i) - 48 : 0;
                let n = n0 + n1 + tens;
                if (n > 9) {
                    tens = 1;
                    rst = (n - 10) + rst;
                } else {
                    tens = 0;
                    rst = n + rst;
                }
            }
            return tens > 0 ? tens + rst : rst;
        }

        private static _sub(a: string, b: string): string {
            let compare = StringInteger._compare(a, b);
            if (compare === 0) {
                return "0";
            } else {
                if (compare < 0) {
                    let tmp = a;
                    a = b;
                    b = tmp;
                }

                return "0";
            }
        }

        private static _mul(a: string, b: string): string {
            let rst = "0";
            let len = b.length;
            let base = "";
            for (let i = a.length - 1; i >= 0; --i) {
                let tmp = base;
                base += "0";
                let tens = 0;
                let n0 = a.charCodeAt(i) - 48;
                for (let j = len - 1; j >= 0; --j) {
                    let n = n0 * (b.charCodeAt(j) - 48) + tens;
                    if (n > 9) {
                        tens = (n * 0.1) | 0;
                        tmp = n - tens * 10 + tmp;
                    } else {
                        tens = 0;
                        tmp = n + tmp;
                    }
                }
                if (tens > 0) tmp = tens + tmp;
                rst = StringInteger._add(rst, tmp);
            }
            return rst;
        }

        public static toDecimal(n: string): string {
            let len = n.length;
            if (len === 0) {
                return "0";
            } else {
                let h = n.substr(0, 2);
                if (h === "0x") {
                    let rst = "0";
                    let base = "1";
                    let first: boolean = true;
                    for (let i = len - 1; i >= 2; --i) {
                        let c = n.charCodeAt(i);
                        let v = 0;
                        if (c >= 48 && c <= 57) {
                            v = c - 48;
                        } else if (c >= 65 && c <= 70) {
                            v = c - 55;
                        } else if (c >= 97 && c <= 102) {
                            v = c - 87;
                        } else {
                            return "0";
                        }

                        if (v > 0) rst = StringInteger._add(rst, StringInteger._mul(v.toString(), base));
                        base = StringInteger._mul(base, "16");
                    }
                    return rst;
                } else if (h === "0o") {
                    let rst = "0";
                    let base = "1";
                    let first: boolean = true;
                    for (let i = len - 1; i >= 2; --i) {
                        let c = n.charCodeAt(i);
                        let v = 0;
                        if (c >= 48 && c <= 55) {
                            v = c - 48;
                        } else {
                            return "0";
                        }

                        if (v > 0) rst = StringInteger._add(rst, StringInteger._mul(v.toString(), base));
                        base = StringInteger._mul(base, "8");
                    }
                    return rst;
                } else if (h === "0b") {
                    let rst = "0";
                    let base = "1";
                    let first: boolean = true;
                    for (let i = len - 1; i >= 2; --i) {
                        let c = n.charCodeAt(i);
                        let v = 0;
                        if (c === 48 || c === 49) {
                            v = c - 48;
                        } else {
                            return "0";
                        }

                        if (v > 0) rst = StringInteger._add(rst, base);
                        base = StringInteger._mul(base, "2");
                    }
                    return rst;
                } else {
                    for (let i = n.charAt(0) === "-" ? 1 : 0; i < len; ++i) {
                        let c = n.charCodeAt(i);
                        if (c < 48 || c > 57) return "0";
                    }
                    return n;
                }
            }
        }
    }
}