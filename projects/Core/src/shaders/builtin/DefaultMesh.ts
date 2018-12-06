///<reference path="libs/AlphaTest.ts"/>
///<reference path="libs/Lighting.ts"/>
///<reference path="libs/Reflection.ts"/>
///<reference path="libs/Skinning.ts"/>

namespace Aurora.BuiltinShader.DefaultMesh {
    export const NAME = "_Built-in_DefaultMesh";

    export const VERTEX = `
attribute vec3 ${ShaderPredefined.a_Position0};

#if defined(${ShaderPredefined.DIFFUSE_TEX}) || defined(${ShaderPredefined.SPECULAR_TEX})
#include<${General.DECLARE_ATTRIB.name}>(vec2, ${ShaderPredefined.a_UV0})
#include<${General.DECLARE_VARYING.name}>(vec2, ${ShaderPredefined.v_UV0})
#endif

#ifdef ${ShaderPredefined.VERTEX_COLOR}
#include<${General.DECLARE_ATTRIB.name}>(vec4, ${ShaderPredefined.a_Color0})
#include<${General.DECLARE_VARYING.name}>(vec4, ${ShaderPredefined.v_Color0})
#endif

#include<${General.DECLARE_UNIFORM.name}>(mat4, ${ShaderPredefined.u_M44_L2P})

#include<${Lib.Lighting.VERT_HEADER.name}>
#include<${Lib.Reflection.VERT_HEADER.name}>
#include<${Lib.Skinning.VERT_HEADER.name}>

void main(void) {
#include<${General.DECLARE_TEMP_VAR.name}>(vec3, pos)
pos = ${ShaderPredefined.a_Position0};

#ifdef ${General.DECLARE_ATTRIB_DEFINE_PREFIX}${ShaderPredefined.a_Normal0}
    #include<${General.DECLARE_TEMP_VAR.name}>(vec3, nrm)
    nrm = ${ShaderPredefined.a_Normal0};
#endif

#include<${Lib.Skinning.VERT.name}>(pos, pos)

#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_UV0}
    ${ShaderPredefined.v_UV0} = ${ShaderPredefined.a_UV0};
#endif

#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_Color0}
    ${ShaderPredefined.v_Color0} = ${ShaderPredefined.a_Color0};
#endif

#include<${Lib.Lighting.VERT.name}>(pos, nrm)
#include<${Lib.Reflection.VERT.name}>(pos, nrm)

    gl_Position = ${ShaderPredefined.u_M44_L2P} * vec4(pos, 1.0);
}`;

    export const FRAGMENT = `
${General.PRECISION_HEAD}

#if defined(${ShaderPredefined.DIFFUSE_TEX}) || defined(${ShaderPredefined.SPECULAR_TEX})
#include<${General.DECLARE_UNIFORM.name}>(sampler2D, ${ShaderPredefined.u_DiffuseSampler})
#include<${General.DECLARE_VARYING.name}>(vec2, ${ShaderPredefined.v_UV0})
#endif

#ifdef ${ShaderPredefined.VERTEX_COLOR}
#include<${General.DECLARE_VARYING.name}>(vec4, ${ShaderPredefined.v_Color0})
#endif

#ifdef ${ShaderPredefined.DIFFUSE_COLOR}
#include<${General.DECLARE_UNIFORM.name}>(vec4, ${ShaderPredefined.u_DiffuseColor})
#endif

#include<${Lib.Lighting.FRAG_HEADER.name}>
#include<${Lib.Reflection.FRAG_HEADER.name}>
#include<${Lib.AlphaTest.HEADER.name}>

void main(void) {
#ifdef ${ShaderPredefined.DIFFUSE_TEX}
    vec4 c = texture2D(${ShaderPredefined.u_DiffuseSampler}, ${ShaderPredefined.v_UV0});

    #ifdef ${ShaderPredefined.VERTEX_COLOR}
    c *= ${ShaderPredefined.v_Color0};
    #endif

    #ifdef ${ShaderPredefined.DIFFUSE_COLOR}
    c *= ${ShaderPredefined.u_DiffuseColor};
    #endif
#elif defined(${ShaderPredefined.VERTEX_COLOR})
    vec4 c = ${ShaderPredefined.v_Color0};

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
#include<${Lib.Lighting.FRAG.name}>(${ShaderPredefined.v_UV0})

#include<${General.FINAL_COLOR.name}>(c)

    gl_FragColor = c;
}`;
}