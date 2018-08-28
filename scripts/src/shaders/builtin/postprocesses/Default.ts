/// <reference path="../General.ts" />

namespace Aurora.BuiltinShader.PostProcess.Default {
    export const VERTEX: string = `
attribute vec2 ${ShaderPredefined.a_Position0};
attribute vec2 ${ShaderPredefined.a_TexCoord0};
varying vec2 ${ShaderPredefined.v_TexCoord0};

void main(void) {
    ${ShaderPredefined.v_TexCoord0} = ${ShaderPredefined.a_TexCoord0};
    gl_Position = vec4(${ShaderPredefined.a_Position0}, 0, 1);
}`;

    export const FRAGMENT: string = `
${General.PRECISION_HEAD}

uniform sampler2D ${ShaderPredefined.u_Sampler0};
varying vec2 ${ShaderPredefined.v_TexCoord0};

void main(void) {
    gl_FragColor = texture2D(${ShaderPredefined.u_Sampler0}, ${ShaderPredefined.v_TexCoord0});
}`;
}