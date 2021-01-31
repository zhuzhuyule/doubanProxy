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
        // airbnb
        'import/no-unresolved': 'off', // 引入模块路径检查（vue难以解析路径）
        'import/extensions': 'off', // import文件不加后缀检查
        'import/no-extraneous-dependencies': 'off', // 无外来依赖检查（要求只能用npm依赖，导致无法使用cdn）
        'import/prefer-default-export': 'off', // 优先使用export default
        // eslint
        // 'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off', // 生产时无console语句
        'no-console': 'error', // 生产时无console语句
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off', // 生产时无debugger关键字
        'linebreak-style': 'off', // 换行检查
        'func-names': 'off', // 函数必须命名（导致匿名函数无法使用）
        'no-restricted-syntax': 'off', // 禁用特定语法（导致一些语法无法使用：for of）
        'no-use-before-define': [
            'error',
            {
                // 函数必须先定义后使用
                functions: false,
            },
        ],
        'no-plusplus': 'off', // 禁用 ++ --
        'no-continue': 'off', // 禁用 continue
        'no-param-reassign': 'off', // 禁止函数的参数重写赋值
        'class-methods-use-this': 'off', // class中的方法必须使用this
        'no-unused-expressions': 'off',
    },
};
