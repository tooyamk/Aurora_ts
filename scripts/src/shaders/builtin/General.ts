/// <reference path="../ShaderPredefined.ts" />

namespace MITOIA.BuiltinShader.General {
    export const PRECISION_HEAD: string = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else  
precision mediump float; 
#endif
`;

    /**
     * @param type
     * @param name
     */
    export const DECLARE_ATTRIB_DEFINE_PREFIX: string = "_DECLARE_ATTRIB_";

    export const DECLARE_ATTRIB: ShaderLib = {
        name: "_DECLARE_ATTRIB",
        source: `
#ifndef ${DECLARE_ATTRIB_DEFINE_PREFIX}\${1}
#define ${DECLARE_ATTRIB_DEFINE_PREFIX}\${1}
attribute \${0} \${1};
#endif
`};

    /**
     * @param type
     * @param name
     */
    export const DECLARE_UNIFORM_DEFINE_PREFIX: string = "_DECLARE_UNIFORM_";

    export const DECLARE_UNIFORM: ShaderLib = {
        name: "_DECLARE_UNIFORM",
        source: `
#ifndef ${DECLARE_UNIFORM_DEFINE_PREFIX}\${1}
#define ${DECLARE_UNIFORM_DEFINE_PREFIX}\${1}
uniform \${0} \${1};
#endif
`};

    export const DECLARE_VARYING_DEFINE_PREFIX: string = "_DECLARE_VARYING_";

    /**
     * @param type
     * @param name
     */
    export const DECLARE_VARYING: ShaderLib = {
        name: "_DECLARE_VARYING",
        source: `
#ifndef ${DECLARE_VARYING_DEFINE_PREFIX}\${1}
#define ${DECLARE_VARYING_DEFINE_PREFIX}\${1}
varying \${0} \${1};
#endif
`};

    export const SOURCES: ShaderLib[] = [DECLARE_ATTRIB, DECLARE_UNIFORM, DECLARE_VARYING];
}