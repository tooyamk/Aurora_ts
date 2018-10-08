class Helper {
    public static getURL(name: string): string {
        //let root = "http://127.0.0.1/Aurora/res/";
        let root = "res/";
        return root + name + "?ts=" + Date.now();
    }
}