namespace MITOIA.ShaderPredefined {
    export const ALPHA_TEST: string = "ALPHA_TEST";
    export const ALPHA_TEST_FUNC: string = "ALPHA_TEST_FUNC";
    export const ALPHA_TEST_FUNC_LESS: int = 1;
    export const ALPHA_TEST_FUNC_EQUAL: int = 2;
    export const ALPHA_TEST_FUNC_NOTEQUAL: int = 3;
    export const ALPHA_TEST_FUNC_LEQUAL: int = 4;
    export const ALPHA_TEST_FUNC_GREATER: int = 5;
    export const ALPHA_TEST_FUNC_GEQUAL: int = 6;

    export const LIGHTING: string = "LIGHTING";
    export const LIGHT0: string = "LIGHT0";

    export const LIGHT_TYPE0: string = "LIGHT_TYPE0";
    export const LIGHT_TYPE_DIRECTION: int = 1;

    export const LIGHTING_SPECULAR: string = "LIGHTING_SPECULAR";
    export const LIGHTING_SPECULAR_NONE: int = 0;
    export const LIGHTING_SPECULAR_PHONE: int = 1;
    export const LIGHTING_SPECULAR_BANK_BRDF: int = 2;
    export const LIGHTING_SPECULAR_BLINN_PHONE: int = 3;

    /**
     * General:
     ** v0, v1, v2 = color.
     * 
     * Direction Light:
     ** v4,v5,v6 = lighting world dir
     */
    export const u_LightAtrrib0: string = "u_LightAtrrib0";

    export const u_LighitngSpecularShininess = "u_LighitngSpecularShininess";

    export const u_CamPosW: string = "u_CamPosW";

    export const DIFFUSE_TEX: string = "DIFFUSE_TEX";
    export const DIFFUSE_COLOR: string = "DIFFUSE_COLOR";

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

    export const u_DiffuseColor: string = "u_DiffuseColor";

    export const u_Light0Pos: string = "u_Light0Pos";

    export const u_AlphaTestCompareValue: string = "u_AlphaTestCompareValue";

    export const s_Sampler: string = "s_Sampler";
    export const s_DiffuseSampler: string = "s_DiffuseSampler";
}