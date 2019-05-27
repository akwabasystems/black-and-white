module.exports = {
    setupFiles: [
        "./test/global.js"
    ],
    modulePathIgnorePatterns: [
        "global.js"
    ],
    testMatch: [
        "**/tests/**/*.spec.js"
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
