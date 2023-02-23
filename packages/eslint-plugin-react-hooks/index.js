const RulesOfHooks = require('./RulesOfHooks').default;
const ExhaustiveDeps = require('./ExhaustiveDeps').default;

exports.configs = {
  recommended: {
    plugins: ['react-hooks'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
};

exports.rules = {
  'rules-of-hooks': RulesOfHooks,
  'exhaustive-deps': ExhaustiveDeps,
};
