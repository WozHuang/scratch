const RulesOfHooks = require('./RulesOfHooks').default;
const ExhaustiveDeps = require('./ExhaustiveDeps').default;

exports.configs = {
  recommended: {
    plugins: ['@woz-scratch/react-hooks'],
    rules: {
      '@woz-scratch/react-hooks/rules-of-hooks': 'error',
      '@woz-scratch/react-hooks/exhaustive-deps': 'warn',
    },
  },
};

exports.rules = {
  'rules-of-hooks': RulesOfHooks,
  'exhaustive-deps': ExhaustiveDeps,
};
