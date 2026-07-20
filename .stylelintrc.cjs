module.exports = {
  extends: ['stylelint-config-recommended'],
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
      rules: {
        'declaration-property-value-no-unknown': [
          true,
          {
            ignoreProperties: {
              width: ['v-bind(css_size)'],
              'max-width': ['v-bind(css_size)']
            }
          }
        ]
      }
    },
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss'
    }
  ],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['apply', 'tailwind']
      }
    ]
  }
};
