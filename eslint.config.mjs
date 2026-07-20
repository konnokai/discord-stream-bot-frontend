import pluginVue from 'eslint-plugin-vue';
import skipFormattingConfig from '@vue/eslint-config-prettier/skip-formatting';
import { vueTsConfigs, withVueTs } from '@vue/eslint-config-typescript';

export default withVueTs(
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest'
    },
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },
  skipFormattingConfig
);
