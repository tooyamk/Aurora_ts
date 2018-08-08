namespace MITOIA.BuiltinShader.General {
    export const PRECISION_HEAD: string = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else  
precision mediump float; 
#endif
`;

    export const ALPHA_TEST: string = `
void __alphaTest(float a) {
    if (a < 0.5)
    discard;
}
`;
}