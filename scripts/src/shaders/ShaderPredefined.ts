namespace MITOIA.ShaderPredefined {
    export const ALPHA_TEST: string = "ALPHA_TEST";
    export const ALPHA_TEST_FUNC: string = "ALPHA_TEST_FUNC";
    export const ALPHA_TEST_FUNC_LESS: string = "1";
    export const ALPHA_TEST_FUNC_EQUAL: string = "2";
    export const ALPHA_TEST_FUNC_NOTEQUAL: string = "3";
    export const ALPHA_TEST_FUNC_LEQUAL: string = "4";
    export const ALPHA_TEST_FUNC_GREATER: string = "5";
    export const ALPHA_TEST_FUNC_GEQUAL: string = "6";

    export const LIGHTING: string = "LIGHTING";
    export const LIGHT0: string = "LIGHT0";

    export const LIGHT_TYPE0: string = "LIGHT_TYPE0";
    export const LIGHT_TYPE_DIRECTION: string = "1";

    /**
     * Direction Light:
     ** v0,v1,v2 = lighting world dir
     */
    export const u_LightAtrrib0: string = "u_LightAtrrib0";

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