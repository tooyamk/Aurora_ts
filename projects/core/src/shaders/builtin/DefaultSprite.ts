namespace Aurora.BuiltinShader.DefaultSprite {
    export const NAME = "_Built-in_DefaultSprite";

    export const VERTEX = `
attribute vec2 ${ShaderPredefined.a_Position0};
attribute vec2 ${ShaderPredefined.a_UV0};
attribute vec4 ${ShaderPredefined.a_Color0};

varying vec2 tc;
varying vec4 color;

void main(void) {
    gl_Position = vec4(${ShaderPredefined.a_Position0}, 0.0, 1.0);
    tc = ${ShaderPredefined.a_UV0};
    color = ${ShaderPredefined.a_Color0};
}`;
    
        export const FRAGMENT = `
${General.PRECISION_HEAD}

uniform sampler2D ${ShaderPredefined.u_DiffuseSampler};

varying vec2 tc;
varying vec4 color;

void main(void) {
    gl_FragColor = texture2D(${ShaderPredefined.u_DiffuseSampler}, tc) * color;
}`;
}