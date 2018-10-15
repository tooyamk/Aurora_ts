namespace Aurora {
    export class StringInteger {
        public static compare(a: string, b: string): int {
            return StringInteger._compare(StringInteger.toDecimal(a), StringInteger.toDecimal(b));
        }

        private static _compare(a: string, b: string): int {
            let negativeA = a.charCodeAt(0) === 45;
            let negativeB = b.charCodeAt(0) === 45;

            if (negativeA) {
                if (negativeB) {
                    let rst = StringInteger._compareNonnegative(a.substr(1), b.substr(1));
                    if (rst !== 0) rst *= -1;
                    return rst;
                } else {
                    return -1;
                }
            } else if (negativeB) {
                return 1;
            } else {
                return StringInteger._compareNonnegative(a, b);
            }
        }

        private static _compareNonnegative(a: string, b: string): int {
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
            return StringInteger._add(StringInteger.toDecimal(a), StringInteger.toDecimal(b));
        }

        private static _add(a: string, b: string): string {
            let negativeA = a.charCodeAt(0) === 45;
            let negativeB = b.charCodeAt(0) === 45;

            if (negativeA) {
                if (negativeB) {
                    return "-" + StringInteger._addNonnegative(a.substr(1), b.substr(1));
                } else {
                    return StringInteger._subNonnegative(a.substr(1), b);
                }
            } else if (negativeB) {
                return StringInteger._subNonnegative(a, b.substr(1));
            } else {
                return StringInteger._addNonnegative(a, b);
            }
        }

        private static _addNonnegative(a: string, b: string): string {
            if (a === "0") return b;
            if (b === "0") return a;

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

        public static sub(a: string, b: string): string {
            return StringInteger._sub(StringInteger.toDecimal(a), StringInteger.toDecimal(b));
        }

        private static _sub(a: string, b: string): string {
            let negativeA = a.charCodeAt(0) === 45;
            let negativeB = b.charCodeAt(0) === 45;

            if (negativeA) {
                if (negativeB) {
                    return StringInteger._subNonnegative(b.substr(1), a.substr(1));
                } else {
                    return "-" + StringInteger._addNonnegative(b, a.substr(1));
                }
            } else if (negativeB) {
                return StringInteger._addNonnegative(a, b.substr(1));
            } else {
                return StringInteger._subNonnegative(a, b);
            }
        }

        private static _subNonnegative(a: string, b: string): string {
            if (b === "0") return a;

            let compare = StringInteger._compareNonnegative(a, b);
            if (compare === 0) {
                return "0";
            } else {
                if (compare < 0) {
                    let tmp = a;
                    a = b;
                    b = tmp;
                }

                let rst = "";

                let digitsA = a.length;
                let digitsB = b.length;

                let arr: uint[] = [];
                arr.length = digitsA;
                for (let i = 0; i < digitsA; ++i) arr[i] = a.charCodeAt(digitsA - i - 1) - 48;

                for (let i = 0; i < digitsA; ++i) {
                    let n0 = arr[i];
                    let n1 = i < digitsB ? b.charCodeAt(digitsB - i - 1) - 48 : 0;

                    if (n0 < n1) {
                        let idx = i + 1;
                        do {
                            let value = arr[idx];
                            if (value > 0) {
                                if (value === 1 && idx + 1 === digitsA) {
                                    --digitsA;
                                    for (let j = i + 1; j <= idx; ++j) arr[j] = 9;
                                } else {
                                    --arr[idx--];
                                    for (let j = i + 1; j <= idx; ++j) arr[j] = 9;
                                }
                                
                                break;
                            }
                            ++idx;
                        } while (true);
                        n0 += 10;
                    }
                    
                    let n = n0 - n1;
                    rst = n + rst;
                }

                digitsA = rst.length;
                if (rst.charCodeAt(0) === 48 && digitsA > 1) {
                    let s = 1;
                    for (let i = 1; i < digitsA; ++i) {
                        if (rst.charCodeAt(i) === 48) {
                            ++s;
                        } else {
                            break;
                        }
                    }
                    rst = rst.substr(s);
                }
                return compare < 0 ? "-" + rst : rst;
            }
        }

        public static mul(a: string, b: string): string {
            return StringInteger._mul(StringInteger.toDecimal(a), StringInteger.toDecimal(b));
        }

        private static _mul(a: string, b: string): string {
            let negativeA = a.charCodeAt(0) === 45;
            let negativeB = b.charCodeAt(0) === 45;

            if (negativeA) {
                if (negativeB) {
                    return StringInteger._mulNonnegative(a.substr(1), b.substr(1));
                } else {
                    return "-" + StringInteger._mulNonnegative(a.substr(1), b);
                }
            } else if (negativeB) {
                return "-" + StringInteger._mulNonnegative(a, b.substr(1));
            } else {
                return StringInteger._mulNonnegative(a, b);
            }
        }

        private static _mulNonnegative(a: string, b: string): string {
            if (a === "1") return b;
            if (b === "1") return a;
            if (a === "0" || b === "0") return "0";

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
                rst = StringInteger._addNonnegative(rst, tmp);
            }
            return rst;
        }

        public static div(a: string, b: string): string[] {
            return StringInteger._div(StringInteger.toDecimal(a), StringInteger.toDecimal(b));
        }

        private static _div(a: string, b: string): string[] {
            let negativeA = a.charCodeAt(0) === 45;
            let negativeB = b.charCodeAt(0) === 45;

            if (negativeA) {
                if (negativeB) {
                    let rst = StringInteger._divNonnegative(a.substr(1), b.substr(1));
                    if (rst[1] !== "0") rst[1] = "-" + rst[1];
                    return rst;
                } else {
                    let rst = StringInteger._divNonnegative(a.substr(1), b);
                    if (rst[0] !== "0") rst[0] = "-" + rst[0];
                    if (rst[1] !== "0") rst[1] = "-" + rst[1];
                    return rst;
                }
            } else if (negativeB) {
                let rst = StringInteger._divNonnegative(a, b.substr(1));
                if (rst[0] !== "0") rst[0] = "-" + rst[0];
                return rst;
            } else {
                return StringInteger._divNonnegative(a, b);
            }
        }

        private static _divNonnegative(a: string, b: string): string[] {
            if (b === "1") return [a, "0"];
            if (a === "0" || b === "0") return ["0", "0"];

            let digitsB = b.length;

            let quotient = "0", remainder = "0";

            while (true) {
                let compare = StringInteger._compareNonnegative(a, b);
                if (compare > 0) {
                    let digitsA = a.length;
                    let len = digitsA - digitsB;
                    if (len > 0) {
                        let a0 = (a.charCodeAt(0) - 48) * 10 + a.charCodeAt(1) - 48;
                        let b0 = b.charCodeAt(0) - 48;
                        let n = ((a0 / b0) | 0) >> 1;

                        let mul = "1";
                        for (let i = 1; i < len; ++i) mul += "0";

                        if (n < 2) {
                            quotient = StringInteger._addNonnegative(quotient, mul);
                            remainder = StringInteger._subNonnegative(a, StringInteger._mulNonnegative(b, mul));
                        } else {
                            mul = StringInteger._mulNonnegative(mul, n.toString());
                            quotient = StringInteger._addNonnegative(quotient, mul);
                            remainder = StringInteger._subNonnegative(a, StringInteger._mulNonnegative(b, mul));
                        }
                    } else {
                        let a0 = a.charCodeAt(0) - 48;
                        let b0 = b.charCodeAt(0) - 48;
                        if (a0 === b0) {
                            quotient = StringInteger._addNonnegative(quotient, "1");
                            remainder = StringInteger._subNonnegative(a, b);
                            break;
                        } else {
                            let n = ((a0 / b0) | 0) >> 1;
                            if (n < 2) {
                                quotient = StringInteger._addNonnegative(quotient, "1");
                                remainder = StringInteger._subNonnegative(a, b);
                            } else {
                                let mul = n.toString();
                                quotient = StringInteger._addNonnegative(quotient, mul);
                                remainder = StringInteger._subNonnegative(a, StringInteger._mulNonnegative(b, mul));
                            }
                        }
                    }
                } else if (compare < 0) {
                    remainder = a;
                    break;
                } else {
                    quotient = StringInteger._addNonnegative(quotient, "1");
                    remainder = "0";
                    break;
                }

                if (remainder === "0") {
                    break;
                } else {
                    a = remainder;
                }
            }

            return [quotient, remainder];
        }

        public static getMaxValue(bits: uint): string {
            bits |= 0;
            if (bits <= 0) {
                return "0";
            } else {
                switch (bits) {
                    case 8:
                        return "255";
                    case 16:
                        return "65535";
                    case 24:
                        return "‭16777215‬";
                    case 32:
                        return "‭4294967295‬";
                    case 40:
                        return "‭1099511627775‬";
                    case 48:
                        return "‭281474976710655‬";
                    case 56:
                        return "‭72057594037927935‬";
                    case 64:
                        return "18446744073709551615";
                    default: {
                        let bin = "";
                        for (let i = 0; i < bits; ++i) bin += "1";
                        return StringInteger.toDecimal("0b" + bin);
                    }
                }
            }
        }

        public static toHexadecimal(n: string, bits: int = -1): string {
            let len = n.length;
            if (len === 0 || bits === 0) {
                return "0";
            } else {
                let dec = StringInteger.toDecimal(n, bits, false);

                let rst = "";
                do {
                    let div = StringInteger._divNonnegative(dec, "16");
                    let quotient = div[0];

                    let remainder = div[1];
                    if (remainder.length === 1) {
                        rst = remainder + rst;
                    } else {
                        switch (remainder.charCodeAt(1)) {
                            case 48:
                                rst = "A" + rst;
                                break;
                            case 49:
                                rst = "B" + rst;
                                break;
                            case 50:
                                rst = "C" + rst;
                                break;
                            case 51:
                                rst = "D" + rst;
                                break;
                            case 52:
                                rst = "E" + rst;
                                break;
                            case 53:
                                rst = "F" + rst;
                                break;
                            default:
                                break;
                        }
                    }

                    if (quotient === "0") {
                        break;
                    } else {
                        dec = quotient;
                    }
                } while (true);

                return rst;
            }
        }

        public static toDecimal(n: string, bits: int = -1, signed: boolean = true): string {
            let len = n.length;
            bits |= 0;
            if (len === 0 || bits === 0) {
                return "0";
            } else {
                let h = n.substr(0, 2);
                if (h === "0x") {
                    let rst = "0";
                    let base = "1";
                    let s = 2;
                    for (let i = 2; i < len; ++i) {
                        if (n.charCodeAt(i) === 48) {
                            ++s;
                        } else {
                            break;
                        }
                    }
                    for (let i = len - 1; i >= s; --i) {
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

                        if (v > 0) rst = StringInteger._addNonnegative(rst, StringInteger._mulNonnegative(v.toString(), base));
                        base = StringInteger._mulNonnegative(base, "16");
                    }

                    return StringInteger._usnignedDecimalCheckBitsAndSigned(rst, bits, signed);
                } else if (h === "0o") {
                    let rst = "0";
                    let base = "1";
                    let s = 2;
                    for (let i = 2; i < len; ++i) {
                        if (n.charCodeAt(i) === 48) {
                            ++s;
                        } else {
                            break;
                        }
                    }
                    for (let i = len - 1; i >= s; --i) {
                        let c = n.charCodeAt(i);
                        let v = 0;
                        if (c >= 48 && c <= 55) {
                            v = c - 48;
                        } else {
                            return "0";
                        }

                        if (v > 0) rst = StringInteger._addNonnegative(rst, StringInteger._mulNonnegative(v.toString(), base));
                        base = StringInteger._mulNonnegative(base, "8");
                    }

                    return StringInteger._usnignedDecimalCheckBitsAndSigned(rst, bits, signed);
                } else if (h === "0b") {
                    let rst = "0";
                    let base = "1";
                    let s = 2;
                    for (let i = 2; i < len; ++i) {
                        if (n.charCodeAt(i) === 48) {
                            ++s;
                        } else {
                            break;
                        }
                    }
                    for (let i = len - 1; i >= s; --i) {
                        let c = n.charCodeAt(i);
                        let v = 0;
                        if (c === 48 || c === 49) {
                            v = c - 48;
                        } else {
                            return "0";
                        }

                        if (v > 0) rst = StringInteger._addNonnegative(rst, base);
                        base = StringInteger._mulNonnegative(base, "2");
                    }

                    return StringInteger._usnignedDecimalCheckBitsAndSigned(rst, bits, signed);
                } else {
                    let first = n.charCodeAt(0);
                    let s = first === 43 || first === 45 ? 1 : 0;
                    for (let i = s; i < len; ++i) {
                        if (n.charCodeAt(i) === 48) {
                            ++s;
                        } else {
                            break;
                        }
                    }
                    for (let i = s; i < len; ++i) {
                        let c1 = n.charAt(i);
                        let c = n.charCodeAt(i);
                        if (c < 48 || c > 57) return "0";
                    }

                    if (s > 0) n = n.substr(s);

                    if (bits > 0) {
                        let max = StringInteger.getMaxValue(bits);
                        if (first === 45) {
                            let limit = StringInteger._addNonnegative(max, "1");
                            let minSigned = StringInteger._div(limit, "2")[0];
                            if (StringInteger.compare(n, minSigned) > 0) n = minSigned;
                            return signed ? "-" + n : StringInteger._subNonnegative(limit, n);
                        } else {
                            if (signed) {
                                let limit = StringInteger._subNonnegative(max, "1");
                                let maxSigned = StringInteger._div(limit, "2")[0];
                                return StringInteger.compare(n, maxSigned) > 0 ? maxSigned : n;
                            } else {
                                return StringInteger.compare(n, max) > 0 ? max : n;
                            }
                        }
                    } else {
                        return first === 45 ? (signed ? "-" + n : "0") : n;
                    }
                }
            }
        }

        private static _usnignedDecimalCheckBitsAndSigned(n: string, bits: int, signed: boolean): string {
            if (bits > 0) {
                let max = StringInteger.getMaxValue(bits);
                if (StringInteger.compare(n, max) > 0) n = max;
                if (signed) {
                    let limit = StringInteger._addNonnegative(max, "1");
                    let minSigned = StringInteger._div(limit, "2")[0];
                    if (StringInteger.compare(n, minSigned) >= 0) n = StringInteger._subNonnegative(n, limit);
                }
            }
            return n;
        }
    }
}