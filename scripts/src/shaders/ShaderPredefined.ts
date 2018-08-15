namespace MITOIA.ShaderPredefined {
    export const ALPHA_TEST: string = "ALPHA_TEST";
    export const ALPHA_TEST_LESS: int = 1;
    export const ALPHA_TEST_EQUAL: int = 2;
    export const ALPHA_TEST_NOTEQUAL: int = 3;
    export const ALPHA_TEST_LEQUAL: int = 4;
    export const ALPHA_TEST_GREATER: int = 5;
    export const ALPHA_TEST_GEQUAL: int = 6;

    export const LIGHTING: string = "LIGHTING";
    export const LIGHT0: string = "LIGHT0";

    export const LIGHT_TYPE0: string = "LIGHT_TYPE0";
    export const LIGHT_TYPE_DIRECTION: int = 1;
    export const LIGHT_TYPE_POINT: int = 2;
    export const LIGHT_TYPE_SPOT: int = 3;

    export const LIGHTING_SPECULAR: string = "LIGHTING_SPECULAR";
    export const LIGHTING_SPECULAR_PHONE: int = 1;
    export const LIGHTING_SPECULAR_BANK_BRDF: int = 2;
    export const LIGHTING_SPECULAR_BLINN_PHONE: int = 3;

    export const u_LightColor0: string = "u_LightColor0";
    export const u_LightPosW0: string = "u_LightPosW0";
    export const u_LightDirW0: string = "u_LightDirW0";

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
    export const u_LightAttrib0: string = "u_LightAtrrib0";

    export const u_LighitngSpecularShininess = "u_LighitngSpecularShininess";

    export const REFLECTION: string = "REFLECTION";

    export const u_CamPosW: string = "u_CamPosW";

    export const AMBIENT_COLOR: string = "AMBIENT_COLOR";

    export const DIFFUSE_TEX: string = "DIFFUSE_TEX";
    export const DIFFUSE_COLOR: string = "DIFFUSE_COLOR";

    export const SPECULAR_TEX: string = "SPECULAR_TEX";
    export const SPECULAR_COLOR: string = "SPECULAR_COLOR";

    export const REFLECTION_COLOR: string = "REFLECTION_COLOR";

    export const a_Position: string = "a_Position";
    export const a_Normal: string = "a_Normal";
    export const a_TexCoord: string = "a_TexCoord";
    export const a_Color: string = "a_Color";
    export const a_Index: string = "a_Index";

    export const u_M44_W2V: string = "u_M44_W2V";
    export const u_M44_W2P: string = "u_M44_W2P";
    export const u_M44_V2P: string = "u_M44_V2P";
    
    export const u_M44_L2V: string = "u_M44_L2V";
    export const u_M33_L2W: string = "u_M33_L2W";
    export const u_M44_L2W: string = "u_M44_L2W";
    export const u_M44_L2P: string = "u_M44_L2P";

    export const u_AmbientColor: string = "u_AmbientColor";
    export const u_DiffuseColor: string = "u_DiffuseColor";
    export const u_SpecularColor: string = "u_SpecularColor";
    export const u_ReflectionColor: string = "u_ReflectionColor";

    export const u_AlphaTestCompareValue: string = "u_AlphaTestCompareValue";

    export const u_Sampler: string = "u_Sampler";
    export const u_DiffuseSampler: string = "u_DiffuseSampler";
    export const u_SpecularSampler: string = "u_SpecularSampler";
    export const u_ReflectionSampler: string = "u_ReflectionSampler";

    export const v_TexCoord: string = "v_TexCoord";
    export const v_NormalW: string = "v_NormalW";
    export const v_PosW: string = "v_PosW";

    export const var_NormalW: string = "var_NormalW";
    export const var_ViewDirW: string = "var_ViewDirW";
}