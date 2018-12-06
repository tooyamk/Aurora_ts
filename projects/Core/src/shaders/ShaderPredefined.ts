///<reference path="../Types.ts"/>

namespace Aurora {
    export const enum ShaderPredefined {
        ALPHA_TEST = "ALPHA_TEST",
        ALPHA_TEST_LESS = 1,
        ALPHA_TEST_EQUAL = 2,
        ALPHA_TEST_NOTEQUAL = 3,
        ALPHA_TEST_LEQUAL = 4,
        ALPHA_TEST_GREATER = 5,
        ALPHA_TEST_GEQUAL = 6,

        MAX_BONES = "MAX_BONES",

        NUM_BONES_PER_VERTEX = "NUM_BONES_PER_VERTEX",

        LIGHTING = "LIGHTING",
        LIGHT0 = "LIGHT0",

        LIGHT_TYPE0 = "LIGHT_TYPE0",
        LIGHT_TYPE_DIRECTION = 1,
        LIGHT_TYPE_POINT = 2,
        LIGHT_TYPE_SPOT = 3,

        LIGHTING_SPECULAR = "LIGHTING_SPECULAR",
        LIGHTING_SPECULAR_PHONE = 1,
        LIGHTING_SPECULAR_BANK_BRDF = 2,
        LIGHTING_SPECULAR_BLINN_PHONE = 3,

        VERTEX_COLOR = "VERTEX_COLOR",

        REFLECTION = "REFLECTION",

        AMBIENT_COLOR = "AMBIENT_COLOR",

        DIFFUSE_TEX = "DIFFUSE_TEX",
        DIFFUSE_COLOR = "DIFFUSE_COLOR",

        SPECULAR_TEX = "SPECULAR_TEX",
        SPECULAR_COLOR = "SPECULAR_COLOR",

        REFLECTION_COLOR = "REFLECTION_COLOR",

        u_LightColor0 = "u_LightColor0",
        u_LightPosW0 = "u_LightPosW0",
        u_LightDirW0 = "u_LightDirW0",

        /**
         * Direction Light:
         ** none.
        *
        * Point Light:
        ** v0 = range.
        *
        * Spot Light:
        ** v0 = range.
        ** v1 = cos(spotAngle * 0.5).
        */
        u_LightAttrib0 = "u_LightAtrrib0",

        u_LighitngSpecularShininess = "u_LighitngSpecularShininess",

        u_CamPosW = "u_CamPosW",

        a_Position0 = "a_Position0",
        a_Normal0 = "a_Normal0",
        a_UV0 = "a_UV0",
        a_Color0 = "a_Color0",
        a_BoneIndex0 = "a_BoneIndex0",
        a_BoneWeight0 = "a_BoneWeight0",

        u_M44_W2V = "u_M44_W2V",
        u_M44_W2P = "u_M44_W2P",
        u_M44_V2P = "u_M44_V2P",
        
        u_M44_L2V = "u_M44_L2V",
        u_M33_L2W = "u_M33_L2W",
        u_M44_L2W = "u_M44_L2W",
        u_M44_L2P = "u_M44_L2P",

        u_AmbientColor = "u_AmbientColor",
        u_DiffuseColor = "u_DiffuseColor",
        u_SpecularColor = "u_SpecularColor",
        u_ReflectionColor = "u_ReflectionColor",

        u_SkinningMatrices = "u_SkinningMatrices",

        u_AlphaTestCompareValue = "u_AlphaTestCompareValue",

        u_Sampler0 = "u_Sampler0",
        u_DiffuseSampler = "u_DiffuseSampler",
        u_SpecularSampler = "u_SpecularSampler",
        u_ReflectionSampler = "u_ReflectionSampler",

        v_UV0 = "v_UV0",
        v_Color0 = "v_Color0",
        v_WorldNormal0 = "v_WorldNormal0",
        v_WorldPos0 = "v_WorldPos0",

        var_WorldNormal0 = "var_WorldNormal0",
        var_WorldViewDir0 = "var_WorldViewDir0"
    }
}