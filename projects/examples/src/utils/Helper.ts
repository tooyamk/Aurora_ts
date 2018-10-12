class Helper {
    public static getURL(name: string): string {
        //let root = "http://127.0.0.1/Aurora/res/";
        let root = "res/";
        return root + name + "?ts=" + Date.now();
    }

    public static printNodeHierarchy(nodes: Aurora.Node3D[]): void {
        let s = "";

        let printChildFn = (indent: string, node: Aurora.Node3D) => {
            if (s.length > 0) s += "\n";
            s += indent + (node.name.length ? node.name : "(Empty Name)");
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