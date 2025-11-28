import eslint from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const ignores = {
  ignores: ['node_modules', 'dist', 'build', 'coverage', '.turbo', '.cache']
};

const baseConfig = eslint.configs.recommended;

const typescriptConfig = {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project: ['./tsconfig.base.json'],
      tsconfigRootDir: import.meta.dirname,
      sourceType: 'module'
    }
  },
  plugins: {
    '@typescript-eslint': tsPlugin
  },
  rules: {
    ...tsPlugin.configs['recommended-type-checked'].rules,
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  }
};

const frontendGlobals = {
  files: ['apps/frontend/**/*.{ts,tsx}'],
  languageOptions: {
    globals: {
      window: 'readonly',
      document: 'readonly',
      navigator: 'readonly'
    }
  }
};

const backendGlobals = {
  files: ['apps/backend/**/*.ts'],
  languageOptions: {
    globals: {
      console: 'readonly',
      process: 'readonly',
      __dirname: 'readonly',
      module: 'readonly'
    }
  }
};

export default [ignores, baseConfig, typescriptConfig, frontendGlobals, backendGlobals];

