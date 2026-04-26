"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': ['@swc/jest', {}],
    },
    moduleFileExtensions: ['js', 'json', 'ts'],
    testEnvironment: 'node',
    collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.ts', '!**/seeds/**', '!**/main.ts'],
    coverageDirectory: '../coverage',
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map