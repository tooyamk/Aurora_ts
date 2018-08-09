/// <reference path="libs/AlphaTest.ts" />

namespace MITOIA.BuiltinShader.Mesh {
    export const VERTEX: string = `
attribute vec3 ${ShaderPredefined.a_Position};

#ifdef ${ShaderPredefined.DIFFUSE_TEX}
attribute vec2 ${ShaderPredefined.a_TexCoord};
varying vec2 v_uv;
#endif

uniform mat4 ${ShaderPredefined.u_M44_L2P};

void main(void){

#ifdef ${ShaderPredefined.DIFFUSE_TEX}
    v_uv = ${ShaderPredefined.a_TexCoord};
#endif

    gl_Position = ${ShaderPredefined.u_M44_L2P} * vec4(${ShaderPredefined.a_Position}, 1.0);
}`;

    export const FRAGMENT: string = `
${General.PRECISION_HEAD}

#ifdef ${ShaderPredefined.DIFFUSE_TEX}
uniform sampler2D ${ShaderPredefined.s_DiffuseSampler};
varying vec2 v_uv;
#endif

#ifdef ${ShaderPredefined.DIFFUSE_COLOR}
uniform vec4 ${ShaderPredefined.u_DiffuseColor};
#endif

#include<${BuiltinShader.Lib.ALPHA_TEST_HEADER.name}>

void main(void){
    vec4 c = vec4(0, 0, 0, 0);

#ifdef ${ShaderPredefined.DIFFUSE_TEX}
    c = texture2D(${ShaderPredefined.s_DiffuseSampler}, v_uv);
#endif

#ifdef ${ShaderPredefined.DIFFUSE_COLOR}
    c *= ${ShaderPredefined.u_DiffuseColor};
#endif

    #include<${BuiltinShader.Lib.ALPHA_TEST.name}>(c.w)

    gl_FragColor = c;
}`;
}