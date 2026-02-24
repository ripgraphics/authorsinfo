// Custom ESLint rule enforcing descriptive className values.
// It warns when a JSX `className` string literal doesn't contain a semantic name
// (we expect at least one part using the `{block}__{element}` pattern, e.g.
// `my-component__header`).  Tailwind utilities will still be allowed alongside
// the semantic name, but the rule ensures a semantic identifier is present.

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'ensure JSX className includes at least one descriptive semantic name',
      category: 'Stylistic Issues',
      recommended: false,
    },
    schema: [],
  },

  create(context) {
    function hasSemanticClass(raw) {
      if (!raw || typeof raw !== 'string') return false
      const classes = raw.split(/\s+/).filter(Boolean)
      return classes.some((c) => c.includes('__'))
    }

    function report(node) {
      context.report({
        node,
        message:
          'className should include at least one descriptive semantic name (e.g. block__element)',
      })
    }

    function checkLiteral(node) {
      if (node && node.type === 'Literal' && typeof node.value === 'string') {
        if (!hasSemanticClass(node.value) && node.value.trim().length > 0) {
          report(node)
        }
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name && node.name.name === 'className') {
          const val = node.value
          if (!val) return

          if (val.type === 'Literal') {
            checkLiteral(val)
          } else if (val.type === 'JSXExpressionContainer') {
            const expr = val.expression
            if (expr.type === 'Literal') {
              checkLiteral(expr)
            } else if (expr.type === 'TemplateLiteral') {
              // join all static pieces, ignoring interpolations for simplicity
              const text = expr.quasis.map((q) => q.value.cooked).join(' ')
              if (!hasSemanticClass(text) && text.trim().length > 0) {
                report(expr)
              }
            }
          }
        }
      },
    }
  },
}
