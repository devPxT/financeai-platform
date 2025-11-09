// module.exports = {
//   testEnvironment: "node",
//   rootDir: "..",
//   testMatch: ["<rootDir>/architecture/**/*.spec.ts"],
//   transform: {
//     "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/architecture/tsconfig.arch.json" }]
//   },
//   moduleFileExtensions: ["ts", "js", "json"],
//   maxWorkers: 1,
//   verbose: true
// };

// module.exports = {
//   preset: "ts-jest/presets/default-esm",
//   testEnvironment: "node",
//   rootDir: "..",
//   testMatch: ["<rootDir>/architecture/**/*.spec.ts"],
//   transform: {
//     "^.+\\.tsx?$": [
//       "ts-jest",
//       { tsconfig: "<rootDir>/architecture/tsconfig.arch.json", useESM: true }
//     ]
//   },
//   extensionsToTreatAsEsm: [".ts"],
//   moduleNameMapper: {
//     // ajuda o Jest com import ESM que termina em .js
//     "^(\\.{1,2}/.*)\\.js$": "$1"
//   },
//   moduleFileExtensions: ["ts", "js", "json"],
//   maxWorkers: 1,
//   verbose: true
// };

module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  rootDir: "..",
  testMatch: ["<rootDir>/architecture/**/*.spec.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        useESM: true
      }
    ]
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  moduleFileExtensions: ["ts", "js", "json"],
  maxWorkers: 1,
  verbose: true
};