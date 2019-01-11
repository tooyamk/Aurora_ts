namespace Aurora.BuiltinShader.Sprite.Default {
    export const NAME = "_Built-in_Sprite_Default";

    export const VERTEX = 
`attribute vec2 ${ShaderPredefined.a_Position0};
attribute vec2 ${ShaderPredefined.a_UV0};
attribute vec4 ${ShaderPredefined.a_Color0};

varying vec2 ${General.v_UV0};
varying vec4 ${General.v_Color0};

void main(void) {
    gl_Position = vec4(${ShaderPredefined.a_Position0}, 0.0, 1.0);
    ${General.v_UV0} = ${ShaderPredefined.a_UV0};
    ${General.v_Color0} = ${ShaderPredefined.a_Color0};
}`;
    
    export const FRAGMENT = 
`${General.PRECISION_HEAD}

uniform sampler2D ${ShaderPredefined.u_DiffuseSampler};

varying vec2 ${General.v_UV0};
varying vec4 ${General.v_Color0};

void main(void) {
    gl_FragColor = texture2D(${ShaderPredefined.u_DiffuseSampler}, ${General.v_UV0}) * ${General.v_Color0};
}`;
}