/// <reference path="../General.ts" />

namespace MITOIA.BuiltinShader.PostProcess.Default {
    export const VERTEX: string = `
attribute vec2 ${ShaderPredefined.a_Position};
attribute vec2 ${ShaderPredefined.a_TexCoord};
varying vec2 ${ShaderPredefined.v_TexCoord};

void main(void) {
    ${ShaderPredefined.v_TexCoord} = ${ShaderPredefined.a_TexCoord};
    gl_Position = vec4(${ShaderPredefined.a_Position}, 0, 1);
}`;

    export const FRAGMENT: string = `
${General.PRECISION_HEAD}

uniform sampler2D ${ShaderPredefined.u_Sampler};
varying vec2 ${ShaderPredefined.v_TexCoord};

void main(void) {
    gl_FragColor = texture2D(${ShaderPredefined.u_Sampler}, ${ShaderPredefined.v_TexCoord});
}`;
}