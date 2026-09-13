import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'server.js', 'src/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
