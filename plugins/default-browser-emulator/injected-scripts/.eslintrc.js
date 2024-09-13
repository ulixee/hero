const { join } = require('path');

module.exports = {
  extends: '../../../.eslintrc.js',
  parserOptions: {
    project: join(__dirname, '/tsconfig.json'),
  },
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        'no-restricted-globals': 'off',
        'no-restricted-properties': [
          'error',
          ...Object.getOwnPropertyNames(Object).map(key => {
            return { object: 'Object', property: key };
          }),
          ...Object.getOwnPropertyNames(Reflect).map(key => {
            return { object: 'Reflect', property: key };
          }),
        ],
        'no-proto': 'off',
        'no-extend-native': 'off',
        'no-inner-declarations': 'off',
        'prefer-regex-literals': 'off',
        'max-classes-per-file': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        'prefer-arrow-callback': 'off',
        'prefer-rest-params': 'off',
        'func-names': 'off',
        'no-console': 'off',
        'lines-around-directive': 'off',
      },
    },
  ],
};
