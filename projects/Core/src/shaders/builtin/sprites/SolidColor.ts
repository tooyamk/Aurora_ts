namespace Aurora.BuiltinShader.Sprite.SolidColor {
    export const NAME = "_Built-in_Sprite_SolidColor";

    export const VERTEX =
`attribute vec2 ${ShaderPredefined.a_Position0};
attribute vec4 ${ShaderPredefined.a_Color0};

varying vec4 ${General.v_Color0};

void main(void) {
    gl_Position = vec4(${ShaderPredefined.a_Position0}, 0.0, 1.0);
    ${General.v_Color0} = ${ShaderPredefined.a_Color0};
}`;

    export const FRAGMENT =
`${General.PRECISION_HEAD}

varying vec4 ${General.v_Color0};

void main(void) {
    gl_FragColor = ${General.v_Color0};
}`;
}