module.exports = {
  extends: '../../.eslintrc.js',
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        'max-classes-per-file': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  ],
};
