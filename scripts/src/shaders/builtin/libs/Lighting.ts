namespace MITOIA.BuiltinShader.Lib {
    export const LIGHTING_DIFFUSE_FACTOR_HEADER: ShaderLib = {
        name: "_Lighting_DiffuseFactor_Header",
        source: `
float _Lighting_DiffuseFactor(vec3 normal, vec3 lightingDir) {
	return max(dot(normal, lightingDir), 0.0);
}
`};

    /**
     * @param normal vec3.
     * @param lightingDir vec3.
     */
    export const LIGHTING_DIFFUSE_FACTOR_FUNC: ShaderLib = {
        name: "_Lighting_DiffuseFactor",
        source: ``};

    export const LIGHT_HEADER: ShaderLib = {
        name: "_Light_Header",
        source: `
struct _Light {
	vec3 dirW;
};
#include<${LIGHTING_DIFFUSE_FACTOR_HEADER.name}>
`};

    export const DIFFUSE_FACTOR_SOURCES: ShaderLib[] = [LIGHTING_DIFFUSE_FACTOR_HEADER, LIGHTING_DIFFUSE_FACTOR_FUNC];

    export const LIGHTING_SOURCES: ShaderLib[] = DIFFUSE_FACTOR_SOURCES.concat(LIGHT_HEADER);
}