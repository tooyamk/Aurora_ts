namespace MITOIA.BuiltinShader.PostProcess.Default {
    export const VERTEX: string = `
attribute vec2 ${ShaderPredefined.a_Position};
attribute vec2 ${ShaderPredefined.a_TexCoord};
varying vec2 v_uv;
void main(void){
    v_uv = ${ShaderPredefined.a_TexCoord};
    gl_Position = vec4(${ShaderPredefined.a_Position}.x, ${ShaderPredefined.a_Position}.y, 0, 1);
}`;

    export const FRAGMENT: string = `
${General.PRECISION_HEAD}
uniform sampler2D ${ShaderPredefined.s_Sampler};
varying vec2 v_uv;
void main(void){
    gl_FragColor = texture2D(${ShaderPredefined.s_Sampler}, v_uv);
}`;
}