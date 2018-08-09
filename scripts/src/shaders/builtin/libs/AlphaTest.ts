namespace MITOIA.BuiltinShader.Lib {
    export const ALPHA_TEST_HEADER: ShaderLib = {
        name:"_AlphaTest_Header",
        source: `
#if defined(${ShaderPredefined.ALPHA_TEST}) && defined(${ShaderPredefined.ALPHA_TEST_FUNC})
uniform float ${ShaderPredefined.u_AlphaTestCompareValue};
#endif
`};

    /**
     * @param alpha float.
     */
    export const ALPHA_TEST: ShaderLib = {
        name:"_AlphaTest",
        source: `
#ifdef ${ShaderPredefined.ALPHA_TEST}
    #ifdef ${ShaderPredefined.ALPHA_TEST_FUNC}
        #if ${ShaderPredefined.ALPHA_TEST_FUNC} == ${ShaderPredefined.ALPHA_TEST_FUNC_LESS}
            if (\${0} < ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
        #elif ${ShaderPredefined.ALPHA_TEST_FUNC} == ${ShaderPredefined.ALPHA_TEST_FUNC_EQUAL}
            if (\${0} == ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
        #elif ${ShaderPredefined.ALPHA_TEST_FUNC} == ${ShaderPredefined.ALPHA_TEST_FUNC_NOTEQUAL}
            if (\${0} != ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
        #elif ${ShaderPredefined.ALPHA_TEST_FUNC} == ${ShaderPredefined.ALPHA_TEST_FUNC_LEQUAL}
            if (\${0} <= ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
        #elif ${ShaderPredefined.ALPHA_TEST_FUNC} == ${ShaderPredefined.ALPHA_TEST_FUNC_GREATER}
            if (\${0} > ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
        #elif ${ShaderPredefined.ALPHA_TEST_FUNC} == ${ShaderPredefined.ALPHA_TEST_FUNC_GEQUAL}
            if (\${0} >= ${ShaderPredefined.u_AlphaTestCompareValue}) discard;
        #endif
    #else
        if (\${0} < 1.0) discard;
    #endif
#endif
`};

    export const ALPHA_TEST_FRAG_SOURCES: ShaderLib[] = [ALPHA_TEST_HEADER, ALPHA_TEST];
}