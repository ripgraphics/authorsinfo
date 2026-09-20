import { createRequire } from 'node:module'
import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })
const typescriptParser = require('@typescript-eslint/parser')
const typescriptPlugin = require('@typescript-eslint/eslint-plugin')
const prettierPlugin = require('eslint-plugin-prettier')
const descriptiveClassnamePlugin = require('./eslint-plugin-descriptive-classname/index.js')

export default [
  ...compat.extends('next/core-web-vitals'),
  {
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      prettier: prettierPlugin,
      'descriptive-classname': descriptiveClassnamePlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      // These React Compiler diagnostics are not actionable under the
      // application’s current architecture; retain the legacy hook checks
      // above while preventing framework-version noise from failing lint.
      'react-hooks/error-boundaries': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
      'prefer-const': 'warn',
      'import/no-anonymous-default-export': 'warn',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'descriptive-classname/require-semantic-classname': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'backup_db/**',
      'db_backups/**',
      'public/**',
      'dist/**',
      'next-env.d.ts',
      'tests-e2e/**',
      'types/supabase.ts',
    ],
  },
]
