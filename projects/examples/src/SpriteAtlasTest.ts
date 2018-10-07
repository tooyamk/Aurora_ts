class SpriteAtlasTest {
    constructor() {
        let atlas = new Aurora.SpriteAtlas();

        let request = new XMLHttpRequest();
        request.addEventListener("loadend", () => {
            atlas.parse("", JSON.parse(request.responseText), null);
        });
        request.open("GET", "res/atlas/atlas.json", true);
        //request.responseType = "arraybuffer";
        request.send();
    }
}