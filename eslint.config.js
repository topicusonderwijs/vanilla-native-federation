const typescript = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const globals = require('globals');
const prettier = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');

module.exports = [
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'coverage/**',
            '**/*.js',
            '**/*.d.ts',
            '**/*.spec.ts',
            '**/*.mock.ts',
            'build.ts'
        ]
    },
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.node,
                ...globals.es2022
            }
        },
        plugins: {
            '@typescript-eslint': typescript,
            'import': importPlugin,
            'prettier': prettier
        },
        rules: {
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/consistent-type-imports': ['error', {
                prefer: 'type-imports',
            }],
            
            'import/order': ['error', {
                'groups': [
                    ['builtin', 'external'],
                    'internal',
                    ['parent', 'sibling', 'index']
                ],
                'newlines-between': 'always',
                'alphabetize': {
                    'order': 'asc',
                    'caseInsensitive': true
                }
            }],
            'import/no-duplicates': 'error',
            
            // General rules
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'eqeqeq': ['error', 'always'],
            'no-unused-expressions': 'error',
            'no-duplicate-imports': 'error',
            'prefer-const': 'error',
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                }
            }
        }
    }
];