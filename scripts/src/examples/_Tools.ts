function getURL(name: string): string {
    return "http://127.0.0.1/Mitoia/res/" + name + "?ts=" + MITOIA.Timer.utc;
}