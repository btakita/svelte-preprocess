"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLanguage = exports.isAliasOf = exports.getLanguageFromAlias = exports.addLanguageAlias = exports.getLanguageDefaults = exports.SOURCE_MAP_PROP_MAP = exports.ALIAS_MAP = void 0;
const path_1 = require("path");
const utils_1 = require("./utils");
const LANGUAGE_DEFAULTS = {
    sass: {
        indentedSyntax: true,
        stripIndent: true,
    },
    pug: {
        stripIndent: true,
    },
    coffeescript: {
        stripIndent: true,
    },
    stylus: {
        stripIndent: true,
    },
    // We need to defer this require to make sugarss an optional dependency.
    sugarss: () => ({
        stripIndent: true,
        // eslint-disable-next-line @typescript-eslint/no-require-imports, node/global-require
        parser: require('sugarss'),
    }),
};
exports.ALIAS_MAP = new Map([
    ['pcss', 'css'],
    ['postcss', 'css'],
    ['sugarss', 'css'],
    ['sass', 'scss'],
    ['styl', 'stylus'],
    ['js', 'javascript'],
    ['coffee', 'coffeescript'],
    ['ts', 'typescript'],
]);
exports.SOURCE_MAP_PROP_MAP = {
    babel: [['sourceMaps'], true],
    typescript: [['compilerOptions', 'sourceMap'], true],
    scss: [['sourceMap'], true],
    less: [['sourceMap'], {}],
    stylus: [['sourcemap'], true],
    postcss: [['map'], true],
    coffeescript: [['sourceMap'], true],
    globalStyle: [['sourceMap'], true],
};
function getLanguageDefaults(lang) {
    const defaults = LANGUAGE_DEFAULTS[lang];
    if (!defaults)
        return null;
    if (typeof defaults === 'function') {
        return defaults();
    }
    return defaults;
}
exports.getLanguageDefaults = getLanguageDefaults;
function addLanguageAlias(entries) {
    return entries.forEach((entry) => exports.ALIAS_MAP.set(...entry));
}
exports.addLanguageAlias = addLanguageAlias;
function getLanguageFromAlias(alias) {
    return exports.ALIAS_MAP.get(alias) || alias;
}
exports.getLanguageFromAlias = getLanguageFromAlias;
function isAliasOf(alias, lang) {
    return lang !== alias && getLanguageFromAlias(alias) === lang;
}
exports.isAliasOf = isAliasOf;
exports.getLanguage = (attributes) => {
    let alias = null;
    if (attributes.lang) {
        // istanbul ignore if
        if (typeof attributes.lang !== 'string') {
            throw new Error('lang attribute must be string');
        }
        alias = attributes.lang;
    }
    else if (attributes.type) {
        // istanbul ignore if
        if (typeof attributes.type !== 'string') {
            throw new Error('type attribute must be string');
        }
        alias = attributes.type.replace(/^(text|application)\/(.*)$/, '$2');
    }
    else if (typeof attributes.src === 'string' &&
        utils_1.isValidLocalPath(attributes.src)) {
        const parts = path_1.basename(attributes.src).split('.');
        if (parts.length > 1) {
            alias = parts.pop();
        }
    }
    return {
        lang: getLanguageFromAlias(alias),
        alias,
    };
};
