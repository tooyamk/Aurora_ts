///<reference path="libs/AlphaTest.ts" />
///<reference path="libs/Lighting.ts" />
///<reference path="libs/Reflection.ts" />

namespace Aurora.BuiltinShader.DefaultMesh {
    export const NAME = "_Built-in_DefaultMesh";

    export const VERTEX = `
attribute vec3 ${ShaderPredefined.a_Position0};

#if defined(${ShaderPredefined.DIFFUSE_TEX}) || defined(${ShaderPredefined.SPECULAR_TEX})
#include<${General.DECLARE_ATTRIB.name}>(vec2, ${ShaderPredefined.a_TexCoord0})
#include<${General.DECLARE_VARYING.name}>(vec2, ${ShaderPredefined.v_TexCoord0})
#endif

#include<${General.DECLARE_UNIFORM.name}>(mat4, ${ShaderPredefined.u_M44_L2P})

#include<${Lib.Lighting.VERT_HEADER.name}>
#include<${Lib.Reflection.VERT_HEADER.name}>

void main(void) {
#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_TexCoord0}
    ${ShaderPredefined.v_TexCoord0} = ${ShaderPredefined.a_TexCoord0};
#endif

#include<${Lib.Lighting.VERT.name}>
#include<${Lib.Reflection.VERT.name}>

    gl_Position = ${ShaderPredefined.u_M44_L2P} * vec4(${ShaderPredefined.a_Position0}, 1.0);
}`;

    export const FRAGMENT = `
${General.PRECISION_HEAD}

#if defined(${ShaderPredefined.DIFFUSE_TEX}) || defined(${ShaderPredefined.SPECULAR_TEX})
#include<${General.DECLARE_UNIFORM.name}>(sampler2D, ${ShaderPredefined.u_DiffuseSampler})
#include<${General.DECLARE_VARYING.name}>(vec2, ${ShaderPredefined.v_TexCoord0})
#endif

#ifdef ${ShaderPredefined.DIFFUSE_COLOR}
#include<${General.DECLARE_UNIFORM.name}>(vec4, ${ShaderPredefined.u_DiffuseColor})
#endif

#include<${Lib.Lighting.FRAG_HEADER.name}>
#include<${Lib.Reflection.FRAG_HEADER.name}>
#include<${Lib.AlphaTest.HEADER.name}>

void main(void) {
#ifdef ${ShaderPredefined.DIFFUSE_TEX}
    vec4 c = texture2D(${ShaderPredefined.u_DiffuseSampler}, ${ShaderPredefined.v_TexCoord0});

    #ifdef ${ShaderPredefined.DIFFUSE_COLOR}
    c *= ${ShaderPredefined.u_DiffuseColor};
    #endif
#elif defined(${ShaderPredefined.DIFFUSE_COLOR})
    vec4 c = ${ShaderPredefined.u_DiffuseColor};
#else
    vec4 c = vec4(0.0);
#endif

    #include<${Lib.AlphaTest.FRAG.name}>(c.w)

#include<${Lib.Reflection.FRAG.name}>
#include<${Lib.Lighting.FRAG.name}>(${ShaderPredefined.v_TexCoord0})

#include<${General.FINAL_COLOR.name}>(c)

    gl_FragColor = c;
}`;
}