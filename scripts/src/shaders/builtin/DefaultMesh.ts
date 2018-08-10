/// <reference path="General.ts" />
/// <reference path="libs/AlphaTest.ts" />
/// <reference path="libs/Lighting.ts" />

namespace MITOIA.BuiltinShader.DefaultMesh {
    export const VERTEX: string = `
attribute vec3 ${ShaderPredefined.a_Position};

#ifdef ${ShaderPredefined.LIGHTING}
#include<${BuiltinShader.General.DECLARE_ATTRIB.name}>(vec3, ${ShaderPredefined.a_Normal})
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(mat3, ${ShaderPredefined.u_M33_L2W})
#include<${BuiltinShader.General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_NormalW})

    #if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_POINT} || ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_SPOT} || ${ShaderPredefined.LIGHTING_SPECULAR} != ${ShaderPredefined.LIGHTING_SPECULAR_NONE}
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(mat4, ${ShaderPredefined.u_M44_L2W})
#include<${BuiltinShader.General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_PosW})
    #endif
#endif

#if defined(${ShaderPredefined.DIFFUSE_TEX}) || defined(${ShaderPredefined.SPECULAR_TEX})
#include<${BuiltinShader.General.DECLARE_ATTRIB.name}>(vec2, ${ShaderPredefined.a_TexCoord})
#include<${BuiltinShader.General.DECLARE_VARYING.name}>(vec2, ${ShaderPredefined.v_TexCoord})
#endif

#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(mat4, ${ShaderPredefined.u_M44_L2P})

void main(void) {
#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_TexCoord}
    ${ShaderPredefined.v_TexCoord} = ${ShaderPredefined.a_TexCoord};
#endif

#ifdef ${ShaderPredefined.LIGHTING}
    ${ShaderPredefined.v_NormalW} = ${ShaderPredefined.u_M33_L2W} * ${ShaderPredefined.a_Normal};

    #ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_PosW}
    ${ShaderPredefined.v_PosW} = (${ShaderPredefined.u_M44_L2W} * vec4(${ShaderPredefined.a_Position}, 1.0)).xyz;
    #endif
#endif

    gl_Position = ${ShaderPredefined.u_M44_L2P} * vec4(${ShaderPredefined.a_Position}, 1.0);
}`;

    export const FRAGMENT: string = `
${General.PRECISION_HEAD}

#if defined(${ShaderPredefined.DIFFUSE_TEX}) || defined(${ShaderPredefined.SPECULAR_TEX})
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(sampler2D, ${ShaderPredefined.s_DiffuseSampler})
#include<${BuiltinShader.General.DECLARE_VARYING.name}>(vec2, ${ShaderPredefined.v_TexCoord})
#endif

#ifdef ${ShaderPredefined.DIFFUSE_COLOR}
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(vec4, ${ShaderPredefined.u_DiffuseColor})
#endif

#ifdef ${ShaderPredefined.LIGHTING}
#include<${BuiltinShader.Lib.LIGHTING_HEADER.name}>
#endif

#include<${BuiltinShader.Lib.ALPHA_TEST_HEADER.name}>

void main(void) {
#ifdef ${ShaderPredefined.DIFFUSE_TEX}
    vec4 c = texture2D(${ShaderPredefined.s_DiffuseSampler}, ${ShaderPredefined.v_TexCoord});

    #ifdef ${ShaderPredefined.DIFFUSE_COLOR}
    c *= ${ShaderPredefined.u_DiffuseColor};
    #endif
#elif defined(${ShaderPredefined.DIFFUSE_COLOR})
    vec4 c = ${ShaderPredefined.u_DiffuseColor};
#else
    vec4 c = vec4(0.0);
#endif

    #include<${BuiltinShader.Lib.ALPHA_TEST.name}>(c.w)

#ifdef ${ShaderPredefined.LIGHTING}
#include<${BuiltinShader.Lib.LIGHTING_FRAG.name}>(${ShaderPredefined.v_TexCoord})
    c.xyz = (c.xyz * _lightingInfo.color + _lightingInfo.specularColor) * _lightingInfo.intensity;
#endif

    gl_FragColor = c;
}`;
}