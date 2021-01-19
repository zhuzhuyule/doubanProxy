/** @format */
// https://cn.eslint.org/docs/rules/
module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        es6: true,
    },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    rules: {
        'no-unused-vars': 1,
        'dot-location': ['error', 'property'],
        semi: [0, 'never'],
        'semi-spacing': [
            2,
            {
                before: false,
                after: true,
            },
        ],
    },
}
