/// <reference path="../../ShaderPredefined.ts" />

namespace MITOIA.BuiltinShader.Lib {
    export const ALPHA_TEST_HEADER: ShaderLib = {
        name:"_AlphaTest_Header",
        source: `
#ifdef ${ShaderPredefined.ALPHA_TEST}
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(float, ${ShaderPredefined.u_AlphaTestCompareValue})
#endif
`};

    /**
     * @param alpha float.
     */
    export const ALPHA_TEST: ShaderLib = {
        name:"_AlphaTest",
        source: `
#ifdef ${ShaderPredefined.ALPHA_TEST}
    #if ${ShaderPredefined.ALPHA_TEST} == ${ShaderPredefined.ALPHA_TEST_LESS}
        if (\${0} < ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
    #elif ${ShaderPredefined.ALPHA_TEST} == ${ShaderPredefined.ALPHA_TEST_EQUAL}
        if (\${0} == ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
    #elif ${ShaderPredefined.ALPHA_TEST} == ${ShaderPredefined.ALPHA_TEST_NOTEQUAL}
        if (\${0} != ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
    #elif ${ShaderPredefined.ALPHA_TEST} == ${ShaderPredefined.ALPHA_TEST_LEQUAL}
        if (\${0} <= ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
    #elif ${ShaderPredefined.ALPHA_TEST} == ${ShaderPredefined.ALPHA_TEST_GREATER}
        if (\${0} > ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
    #elif ${ShaderPredefined.ALPHA_TEST} == ${ShaderPredefined.ALPHA_TEST_GEQUAL}
        if (\${0} >= ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
    #endif
#endif
`};

    export const ALPHA_TEST_FRAG_SOURCES: ShaderLib[] = [ALPHA_TEST_HEADER, ALPHA_TEST];
}