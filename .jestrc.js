module.exports = {
    setupFiles: [
        "./test/global.js"
    ],
    modulePathIgnorePatterns: [
        "global.js"
    ],
    testMatch: [
        "**/test/**/*.spec.js"
    ],
    transformIgnorePatterns: [
        "node_modules/(?!@akwaba)"
    ],
    verbose: true,
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85
        }
    }
};
