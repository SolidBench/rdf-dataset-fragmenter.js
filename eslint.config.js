const config = require('@rubensworks/eslint-config');

module.exports = config([
  {
    files: [ '**/*.ts' ],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [ './tsconfig.eslint.json' ],
      },
    },
  },
  {
    rules: {
      'import/no-nodejs-modules': 'off',
    },
  },
  {
    files: [
      'lib/**/*VoID*.ts',
    ],
    rules: {
      'unicorn/filename-case': 'off',
    },
  },
]);
