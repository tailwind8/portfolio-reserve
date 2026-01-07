/** @type {import('lint-staged').Config} */
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',
  ],
};
