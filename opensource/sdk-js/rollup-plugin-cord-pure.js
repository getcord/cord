import MagicString from 'magic-string';

/**
 * This Rollup plugin does two related things:
 *
 * 1. Finds all toplevel calls of functions marked `__NO_SIDE_EFFECTS__` and marks
 * them `__PURE__`. While rollup understands and respects both, other bundlers
 * like esbuild don't/can't do the sort of global analysis that you need to do
 * in order to make the no-side-effects annotation work. So we should inline it
 * everywhere while we *are* doing such a global analysis, for the benefit of
 * our end users' bundlers.
 *
 * 2. Finds all toplevel calls of functions in an explicitly provided "extra
 * ident" list, and marks them as pure as well. This is for things like
 * `React.forwardRef` where we can't annotate the library function as above.
 *
 * Both of those are implemented by trawling through the AST finding appropriate
 * spots and adding in the annotation. The scan is actually pretty
 * straightforward since we don't ever need to look at function bodies; only
 * calls when defining toplevel constants matter for the purposes of pure
 * annotations. Note that the AST scan is not especially clever and likely
 * misses a bunch of cases -- it just has to work well enough for Cord's SDK,
 * not be super robust and cover all cases in all generality.
 *
 * Unfortunately we need to do the two above steps separately, in two different
 * plugin hooks (though they just call into the same main worker function). This
 * is because we want to do the "extra idents" pass early, before Rollup
 * potentially mangles import names, but we want to do the side-effects pass
 * late, after everything has been bundled into one file and we have a global
 * view of everything.
 *
 * It would be really nice if Rollup had a more fully-featured plugin API to do
 * this sort of thing -- in order to do tree-shaking they actually already have
 * the machinery for all of this, and I don't think it would be an especially
 * difficult feature to add in to Rollup core in a fully-robust way -- but for
 * now we do this.
 */
export function cordPure(extraIdentList) {
  const extraIdents = new Set(extraIdentList);
  return {
    transform(code) {
      const program = this.parse(code);
      return maybeTransformProgram(extraIdents, code, program);
    },
    renderChunk(code) {
      const program = this.parse(code);

      const idents = new Set();
      collect(idents, program);

      return maybeTransformProgram(idents, code, program);
    },
  };
}

/**
 * Look at all toplevel function definitions and find the ones that are marked
 * no-side-effects.
 */
function collect(idents, program) {
  for (const decl of program.body) {
    if (decl.type !== 'FunctionDeclaration') {
      continue;
    }

    const annotations = decl._rollupAnnotations;
    if (!annotations) {
      continue;
    }

    for (const annotation of annotations) {
      if (annotation.type === 'noSideEffects') {
        idents.add(decl.id.name);
      }
    }
  }
}

function maybeTransformProgram(idents, code, program) {
  const transformData = { code: new MagicString(code), transformed: false };
  transformProgram(transformData, idents, program);
  if (transformData.transformed) {
    return {
      code: transformData.code.toString(),
      // TODO: magic-string makes it easy to return a map here, but the Cord SDK
      // doesn't ship sourcemaps, so not bothering for now.
    };
  } else {
    return null;
  }
}

function transformProgram(transformData, idents, program) {
  for (const decl of program.body) {
    transformDeclaration(transformData, idents, decl);
  }
}

function transformDeclaration(transformData, idents, decl) {
  if (!decl) {
    return;
  }

  if (decl.type === 'ExportNamedDeclaration') {
    // This is something like `export const x = ...` -- we don't care about the
    // export, so unwrap to `const x = ...` and try again.
    transformDeclaration(transformData, idents, decl.declaration);
  }

  if (decl.type !== 'VariableDeclaration') {
    return;
  }

  // VariableDeclaration contains a VariableDeclarator, just another wrapper we
  // don't care about, so we need to unwrap twice.
  for (const declDecl of decl.declarations) {
    if (declDecl.type !== 'VariableDeclarator') {
      continue;
    }
    transformCallExpression(transformData, idents, declDecl.init);
  }
}

function transformCallExpression(transformData, idents, call) {
  if (!call || call.type !== 'CallExpression') {
    return;
  }

  const callee = call.callee;
  const calleeIdent = makeIdent(callee).join('.');
  if (idents.has(calleeIdent)) {
    transformData.code.appendLeft(callee.start, '/* @__PURE__ */ ');
    transformData.transformed = true;
  }

  for (const arg of call.arguments) {
    // For cases like `foo(bar(), baz())` all three need to be annotated as pure
    // for it to be tree-shaken, so we need to recurse through call expressions
    // to make sure we get `bar` and `baz`.
    transformCallExpression(transformData, idents, arg);
  }
}

/**
 * For the purposes of extraIdents, it's nice to be able to specify something
 * like `React.forwardRef` -- but that isn't actually an identifier as far as
 * the AST is concerned, it's a MemberExpression. Collect up (potentially
 * nested) member expressions so that we can concatenate them together into a
 * form like `React.forwardRef`.
 */
function makeIdent(node) {
  switch (node.type) {
    case 'Identifier':
      return [node.name];
    case 'MemberExpression':
      return [...makeIdent(node.object), ...makeIdent(node.property)];
    default:
      return [];
  }
}
