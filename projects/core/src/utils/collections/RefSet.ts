namespace Aurora {
    export class RefSet<I extends Ref> extends Set<I> {
        public add(value: I): this {
            if (!this.has(value)) {
                if (value) value.retain();
                super.add(value);
            }

            return this;
        }

        public delete(value: I): boolean {
            const rst = super.delete(value);
            if (rst && value) value.release(); 
            return rst;
        }
    }
}