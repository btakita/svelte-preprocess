"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformer = exports.loadTsconfig = void 0;
const path_1 = require("path");
const typescript_1 = __importDefault(require("typescript"));
const errors_1 = require("../modules/errors");
function createFormatDiagnosticsHost(cwd) {
    return {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => cwd,
        getNewLine: () => typescript_1.default.sys.newLine,
    };
}
function formatDiagnostics(diagnostics, basePath) {
    if (Array.isArray(diagnostics)) {
        return typescript_1.default.formatDiagnosticsWithColorAndContext(diagnostics, createFormatDiagnosticsHost(basePath));
    }
    return typescript_1.default.formatDiagnostic(diagnostics, createFormatDiagnosticsHost(basePath));
}
const importTransformer = (context) => {
    const visit = (node) => {
        var _a;
        if (typescript_1.default.isImportDeclaration(node)) {
            if ((_a = node.importClause) === null || _a === void 0 ? void 0 : _a.isTypeOnly) {
                return typescript_1.default.createEmptyStatement();
            }
            return typescript_1.default.createImportDeclaration(node.decorators, node.modifiers, node.importClause, node.moduleSpecifier);
        }
        return typescript_1.default.visitEachChild(node, (child) => visit(child), context);
    };
    return (node) => typescript_1.default.visitNode(node, visit);
};
function loadTsconfig(compilerOptionsJSON, filename, tsOptions) {
    if (typeof tsOptions.tsconfigFile === 'boolean') {
        return { errors: [], options: compilerOptionsJSON };
    }
    let basePath = process.cwd();
    const fileDirectory = (tsOptions.tsconfigDirectory ||
        path_1.dirname(filename));
    let tsconfigFile = tsOptions.tsconfigFile ||
        typescript_1.default.findConfigFile(fileDirectory, typescript_1.default.sys.fileExists);
    tsconfigFile = path_1.isAbsolute(tsconfigFile)
        ? tsconfigFile
        : path_1.join(basePath, tsconfigFile);
    basePath = path_1.dirname(tsconfigFile);
    const { error, config } = typescript_1.default.readConfigFile(tsconfigFile, typescript_1.default.sys.readFile);
    if (error) {
        throw new Error(formatDiagnostics(error, basePath));
    }
    // Do this so TS will not search for initial files which might take a while
    config.include = [];
    let { errors, options } = typescript_1.default.parseJsonConfigFileContent(config, typescript_1.default.sys, basePath, compilerOptionsJSON, tsconfigFile);
    // Filter out "no files found error"
    errors = errors.filter((d) => d.code !== 18003);
    return { errors, options };
}
exports.loadTsconfig = loadTsconfig;
const transformer = ({ content, filename, options = {}, }) => {
    // default options
    const compilerOptionsJSON = {
        moduleResolution: 'node',
        target: 'es6',
    };
    const basePath = process.cwd();
    Object.assign(compilerOptionsJSON, options.compilerOptions);
    const { errors, options: convertedCompilerOptions } = options.tsconfigFile !== false || options.tsconfigDirectory
        ? loadTsconfig(compilerOptionsJSON, filename, options)
        : typescript_1.default.convertCompilerOptionsFromJson(compilerOptionsJSON, basePath);
    if (errors.length) {
        throw new Error(formatDiagnostics(errors, basePath));
    }
    const compilerOptions = {
        ...convertedCompilerOptions,
        importsNotUsedAsValues: typescript_1.default.ImportsNotUsedAsValues.Error,
        allowNonTsExtensions: true,
    };
    if (compilerOptions.target === typescript_1.default.ScriptTarget.ES3 ||
        compilerOptions.target === typescript_1.default.ScriptTarget.ES5) {
        throw new Error(`Svelte only supports es6+ syntax. Set your 'compilerOptions.target' to 'es6' or higher.`);
    }
    const { outputText: code, sourceMapText: map, diagnostics, } = typescript_1.default.transpileModule(content, {
        fileName: filename.slice(0, 1) === '.'
            ? path_1.resolve(path_1.join(process.cwd(), filename))
            : filename,
        compilerOptions,
        reportDiagnostics: options.reportDiagnostics !== false,
        transformers: {
            before: [importTransformer],
        },
    });
    if (diagnostics.length > 0) {
        // could this be handled elsewhere?
        const hasError = diagnostics.some((d) => d.category === typescript_1.default.DiagnosticCategory.Error);
        const formattedDiagnostics = formatDiagnostics(diagnostics, basePath);
        console.log(formattedDiagnostics);
        if (hasError) {
            errors_1.throwTypescriptError();
        }
    }
    return {
        code,
        map,
        diagnostics,
    };
};
exports.transformer = transformer;
