namespace Aurora {
    export abstract class AbstractRenderer {
        public isRendering: boolean = false;

        protected _renderingMgr: RenderingManager = null;
        protected _lights: AbstractLight[] = null;

        public preRender(renderingMgr: RenderingManager, lights: AbstractLight[]): void {
            this._renderingMgr = renderingMgr;
            this._lights = lights;
        }

        public render(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void {
            //override
        }

        public postRender(): void {
            this._renderingMgr = null;
            this._lights = null;
        }

        public collectRenderingObjects(renderable: AbstractRenderable, replaceMaterials: Material[], appendFn: AppendRenderingObjectFn): void {
            //override
        }

        public flush(): void {
            //override
        }

        public destroy(): void {
            //override
        }
    }
}