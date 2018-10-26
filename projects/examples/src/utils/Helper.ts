class Helper {
    public static getURL(name: string): string {
        //let root = "http://127.0.0.1/Aurora/res/";
        let root = "res/";
        return root + name + "?ts=" + Date.now();
    }

    public static printNodeHierarchy(nodes: Aurora.Node[]): void {
        let s = "";

        let tmpVec3 = new Aurora.Vector3();

        let printChildFn = (indent: string, node: Aurora.Node) => {
            if (s.length > 0) s += "\n";
            s += indent + (node.name.length ? node.name : "(Empty Name)");

            let pos = node.getLocalPositon(tmpVec3);
            s += "(pos: x=" + pos.x + " y=" + pos.y + " z=" + pos.z + ")";
            let rot = node.readonlyLocalRotation.toEuler(tmpVec3).mulNumber(Aurora.MathUtils.RAD_2_DEG);
            s += "(rot: x=" + rot.x + " y=" + rot.y + " z=" + rot.z + ")";
            let scale = node.readonlyLocalScale;
            s += "(scale: x=" + scale.x + " y=" + scale.y + " z=" + scale.z + ")";

            indent += "    ";
            node.foreach((c) => {
                printChildFn(indent, c);
                return true;
            });
        };

        for (let i = 0, n = nodes.length; i < n; ++i) {
            printChildFn("", nodes[i]);
        }

        console.log(s);
    }
}