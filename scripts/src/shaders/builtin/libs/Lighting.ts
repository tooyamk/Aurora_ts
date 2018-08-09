namespace MITOIA.BuiltinShader.Lib {
    export const DIFFUSE_FACTOR_HEADER: ShaderLib = {
        name: "_Lighting_DiffuseFactor_HEADER",
        source: `
float _Lighting_DiffuseFactor(vec3 normal, vec3 lightingDir) {
	return max(dot(normal, lightingDir), 0);
}
`};

    /**
     * @param normal vec3.
     * @param lightingDir vec3.
     */
    export const DIFFUSE_FACTOR_FUNC: ShaderLib = {
        name: "_Lighting_DiffuseFactor",
        source: ``};

    export const DIFFUSE_FACTOR_SOURCES: ShaderLib[] = [DIFFUSE_FACTOR_HEADER, DIFFUSE_FACTOR_FUNC];
}