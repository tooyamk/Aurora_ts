///<reference path="../General.ts"/>
///<reference path="../../ShaderStore.ts"/>

namespace Aurora.BuiltinShader.Lib.AlphaTest {
    export const NAME = "_AlphaTest";

    export const HEADER: ShaderLib = {
        name: `${NAME}_Header`,
        source: `
#ifdef ${ShaderPredefined.ALPHA_TEST}
    #include<${General.DECLARE_UNIFORM_MACRO.name}>(float, ${ShaderPredefined.u_AlphaTestCompareValue})
#endif
`};

    /**
     * @param alpha float.
     */
    export const FRAG: ShaderLib = {
        name: `${NAME}_Frag`,
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

    export const SOURCES: ShaderLib[] = [HEADER, FRAG];
}