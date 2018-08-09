/// <reference path="libs/AlphaTest.ts" />
/// <reference path="libs/Lighting.ts" />

namespace MITOIA.BuiltinShader.Mesh {
    export const VERTEX: string = `
attribute vec3 ${ShaderPredefined.a_Position};

#ifdef ${ShaderPredefined.LIGHTING}
attribute vec3 ${ShaderPredefined.a_Normal};
uniform mat3 ${ShaderPredefined.u_M33_L2W};
varying vec3 v_nrm;
#endif

#ifdef ${ShaderPredefined.DIFFUSE_TEX}
attribute vec2 ${ShaderPredefined.a_TexCoord};
varying vec2 v_uv;
#endif

uniform mat4 ${ShaderPredefined.u_M44_L2P};

void main(void) {

#ifdef ${ShaderPredefined.DIFFUSE_TEX}
    v_uv = ${ShaderPredefined.a_TexCoord};
#endif

#ifdef ${ShaderPredefined.LIGHTING}
    v_nrm = ${ShaderPredefined.u_M33_L2W} * ${ShaderPredefined.a_Normal};
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

#ifdef ${ShaderPredefined.LIGHTING}
varying vec3 v_nrm;
#include<${BuiltinShader.Lib.LIGHT_HEADER.name}>
    #if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_DIRECTION}
uniform vec3 ${ShaderPredefined.u_LightAtrrib0};
    #endif
#endif

#include<${BuiltinShader.Lib.ALPHA_TEST_HEADER.name}>

void main(void) {
#ifdef ${ShaderPredefined.DIFFUSE_TEX}
    vec4 c = texture2D(${ShaderPredefined.s_DiffuseSampler}, v_uv);

    #ifdef ${ShaderPredefined.DIFFUSE_COLOR}
    c *= ${ShaderPredefined.u_DiffuseColor};
    #endif
#elif defined(${ShaderPredefined.DIFFUSE_COLOR})
    vec4 c = ${ShaderPredefined.u_DiffuseColor};
#else
    vec4 c = vec4(0, 0, 0, 0);
#endif

    #include<${BuiltinShader.Lib.ALPHA_TEST.name}>(c.w)

#ifdef ${ShaderPredefined.LIGHTING}
    _Light light;
    #if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_DIRECTION}
        light.dirW = ${ShaderPredefined.u_LightAtrrib0};
    #endif

    float df = ${BuiltinShader.Lib.LIGHTING_DIFFUSE_FACTOR_FUNC.name}(v_nrm, light.dirW);
    c.xyz *= df;
#endif

    gl_FragColor = c;
}`;
}