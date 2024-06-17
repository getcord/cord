import * as fs from 'fs';
import type {
  API,
  FileInfo,
  ObjectExpression,
  ObjectProperty,
  Options,
  ASTPath,
  Collection,
  Identifier,
  StringLiteral,
  Property,
  ObjectMethod,
  SpreadProperty,
  SpreadElement,
} from 'jscodeshift';

type PropertyWithStringLiteralKey = ObjectProperty & { key: StringLiteral };
type PropertyWithIdentifierKey = ObjectProperty & { key: Identifier };

// Run this file like that❯
// npx jscodeshift external/**/MyComponent.tsx -t ./codemods/jss-to-vanilla-extract.ts --extensions=tsx --parser=ts
// npx jscodeshift external/ -t ./codemods/jss-to-vanilla-extract.ts --extensions=tsx --parser=ts
/**
 * WARNING: This file will write 2 files per file input. It may not respect the --dry option.
 * WARNING: This file is not idiomatic codemod style, I clearly have not clue what I'm doing.
 *
 *
 * The goal is to take a file with this :
 * ```
 * const useStyles = createUseStyles({
 * class1: {
 *     bla: 42
 *   },
 *   class2: {
 *     foo: 12,
 *     "&:nested": {
 *       bla:43
 *     },
 *      '--some-var': 42,
 *   }
 * });
 *
 * const classes = useStyles();
 *   // other content
 * ```
 *
 * into a new file with:
 *
 * ```
 * const class1 = internalStyle( {
 *     bla: 42
 *   });
 * const class2 = internalStyle({
 *     foo: 12,
 *     selectors: {
 *       "&:nested": {
 *         bla:43
 *       }
 *     },
 *     vars: {
 *       '--some-var': 42
 *     }
 *   });
 *   ```
 *   and update the input file that way:
 * ```
 * import * as classes from 'relative/path/to/new/file.css'
 *   // other content
 * ```
 *
 *
 * KNOWN ISSUES:
 *  - @keyframes crashes, we only have a few files, I'll transform them manually
 *  - ast-types does not recognize `statisfies` https://github.com/benjamn/ast-types/issues/935
 *   - Box2 (sprinkle?)
 *   - MenuItem2 labelColorOverride, perhaps with the variant plugin (recipes)
 *  Only used in 1 tsx file (Issues.tsx)
 *
 **/

export default async function transform(
  file: FileInfo,
  api: API,
  options: Options,
) {
  const j = api.jscodeshift;

  const root = j(file.source);
  const rootNewCSS = j('');

  /**
   * Create a new variable declaration like
   * `const className = internalStyle(<objectStyle>)`
   * @param newObjs
   */
  function insertStyleForObjs(props: Collection<ObjectExpression>) {
    props.forEach((o) => {
      const parentNode = o.parentPath.node as ObjectProperty;
      switch (parentNode.key.type) {
        case 'Identifier': {
          const className = parentNode.key;
          const style = o.node;
          sortProperties(style);
          addDependenciesFromObject(o);
          nestSelectors(o);
          nestCSSVariables(o);

          const styleCall = j.exportNamedDeclaration(
            j.variableDeclaration('const', [
              j.variableDeclarator(
                className,
                j.callExpression(j.identifier('internalStyle'), [style]),
              ),
            ]),
          );
          rootNewCSS.find(j.Program).get(0).node.body.push(styleCall);
          break;
        }
        default:
          throw new Error(
            `I do not know what to do with that: ${parentNode.key.type}`,
          );
      }
    });
  }

  type Prop =
    | Property
    | ObjectProperty
    | SpreadElement
    | SpreadProperty
    | ObjectMethod;

  function nestMatchingPropertiesInto(
    o: ASTPath<ObjectExpression>,
    match: (prop: PropertyWithStringLiteralKey) => boolean,
    nestIntoKey: string,
  ) {
    // we can only match on StringLiteral to search for `--` or `&`
    // but in some case we want to keep the others
    function filterOnlyProperty(
      origMatch: typeof match,
      keepNonPropertyNonStringLiteral: boolean,
    ) {
      return (p: Prop) => {
        if (p.type !== 'ObjectProperty') {
          return keepNonPropertyNonStringLiteral;
        }
        if (p.key.type !== 'StringLiteral') {
          return keepNonPropertyNonStringLiteral;
        }
        return origMatch(p as PropertyWithStringLiteralKey);
      };
    }
    const toNestProperties = o.node.properties.filter(
      filterOnlyProperty(match, false),
    );
    const toKeepProperties = o.node.properties.filter(
      filterOnlyProperty((p) => !match(p), true),
    );

    if (toNestProperties.length <= 0) {
      return o;
    }

    // we need to add a `nestIntoKey` key and have the nested things inside
    // but we also want to ensure the nested properties are sorted
    const insertedObj = j.objectExpression(toNestProperties);
    j(insertedObj)
      .find(j.ObjectExpression)
      .forEach((path) => sortProperties(path.node));
    const selectorKey = j.property(
      'init',
      j.identifier(nestIntoKey),
      insertedObj,
    );

    // only insert once after the last.
    o.node.properties = [...toKeepProperties, selectorKey];
    // remove the nested property (go up from literal)

    return o;
  }

  // find the nested selctor key of an object, gather them under `selectors`
  function nestSelectors(o: ASTPath<ObjectExpression>) {
    return nestMatchingPropertiesInto(
      o,
      (p) => p.key.value.includes('&'),
      'selectors',
    );
  }
  // find the css vars key of an object, gather them under `vars`
  function nestCSSVariables(o: ASTPath<ObjectExpression>) {
    return nestMatchingPropertiesInto(
      o,
      (p) => p.key.value.indexOf('--') === 0,
      'vars',
    );
  }

  const alreadyImported = new Set();
  function findAndAddImportForIdentifier(id: Identifier) {
    root
      .find(
        j.ImportDeclaration,
        (node) =>
          j(node).find(j.Identifier, (idToTest) =>
            idToTest.name ? idToTest.name === id.name : false,
          ).length > 0,
      )
      .forEach((pathNode) => {
        if (
          // we do not want to put multiple time the same import
          // TODO:
          // but we are lazy here and only check for the source
          // this is fragile
          // it will to add an import if we import 2 different things from the same source
          alreadyImported.has(pathNode.node.source.value)
        ) {
          return;
        }
        alreadyImported.add(pathNode.node.source.value);
        rootNewCSS.find(j.Program).get(0).node.body.unshift(pathNode.node);
      });
  }

  const alreadyDeclared = new Set();
  function findAndAddVariableDeclarationForIdentifier(id: Identifier) {
    api.stats(id.name);
    root
      .find(j.VariableDeclarator, (node) => {
        const idToTest = node.id;
        if (idToTest.type !== 'Identifier') {
          return false;
        }
        return idToTest.name === id.name;
      })
      .forEach((pathNode) => {
        if (pathNode.node.id.type !== 'Identifier') {
          return;
        }
        if (alreadyDeclared.has(pathNode.node.id.name)) {
          return;
        }
        alreadyDeclared.add(pathNode.node.id.name);
        rootNewCSS
          .find(j.Program)
          .get(0)
          .node.body.unshift(pathNode.parentPath.node);
      });
  }

  // If the object uses some variables, we want to make sure they will be copied over the .css
  // ```
  // {someContainer : {
  //   color: Colors.red,
  // }}
  // ```
  // We will need to find where Colors come from and make it available in the .css file
  // I'll start by assuming it is from an import
  //  TODO
  //  Find all identifier under the ObjectProperty
  //  `find(j.ObectProperty).find(j.Identifier)`
  //  but compare the closest Ancestor Object property to make sure we are not too deeply nested
  //  OR just get identifier, if there is a an import we are happy to import
  function addDependenciesFromObject(o: ASTPath<ObjectExpression>) {
    j(o)
      .find(j.Identifier)
      // check if the identifier is a value of an ObjectPropety
      .filter((pathNode) => {
        // (pathNode.parentPath.node.type =
        //   'ObjectProperty' && pathNode.parentPath.node.value === pathNode),
        return pathNode.name !== 'key';
      })
      .forEach((pathNode) => findAndAddImportForIdentifier(pathNode.node))
      .forEach((pathNode) =>
        findAndAddVariableDeclarationForIdentifier(pathNode.node),
      );
  }

  // Sort the properties alphabetically
  // If there is some SpreadOperator we do not sort to avoid breaking things by changing precedence
  function sortProperties(node: ObjectExpression) {
    const props = node.properties;
    function getKey(
      property: PropertyWithIdentifierKey | PropertyWithStringLiteralKey,
    ) {
      if (property.key.type === 'StringLiteral') {
        return property.key.value;
      }
      return property.key.name;
    }

    if (
      props.some((p) => {
        // we do not want to sort if there is any SpreadProperty,
        // so we strictly avoid non ObjectProperty
        if (p.type !== 'ObjectProperty') {
          return true;
        }

        // We cannot sort funky keys, let's stick with StringLiteral or Identifier
        return !['StringLiteral', 'Identifier'].includes(p.key.type);
      })
    ) {
      return;
    }

    // Sort the properties by key name
    (
      props as (PropertyWithIdentifierKey | PropertyWithStringLiteralKey)[]
    ).sort((a, b) => getKey(a).localeCompare(getKey(b)));
  }

  // find imports from `react-jss`
  const importDeclaration = root.find(j.ImportDeclaration, {
    source: {
      type: 'StringLiteral',
      value: 'react-jss',
    },
  });
  const identifierCollection = importDeclaration.find(j.Identifier);
  if (identifierCollection.length <= 0) {
    return;
  }

  // I'm lazy here and assume the first import is `makeUseStyles`
  const nodePath = identifierCollection.get(0);
  const localName = nodePath.node.name;

  // `const useStyles = createMakeStyles();`
  const calls = root.find(j.CallExpression, {
    callee: {
      name: localName,
    },
  });

  if (calls.length <= 0) {
    return;
  }

  calls.forEach((call) => {
    // top level keys in each `createUseStyles` will become single call to `style`
    const topLevelProperties = j(call)
      .find(j.ObjectExpression)
      .filter((path) => {
        return path.parentPath.parentPath.node === call.node.arguments[0];
      });

    insertStyleForObjs(topLevelProperties);
  });

  // `const classes = useStyles()`
  // only remove the declaration if the call is the only declarotor in there.
  // but also collect identifiers, we will have to find where they are executed and replace with import form file.css.ts
  const callsToReplace: Identifier[] = [];

  // `const classes = createMakeStyles()`
  // Above, we want to find `classes`
  // We get a Set to deduplicate identifiers
  // We may have multiple function components in the same file using the same`classes` object.
  // But we want to import only once.
  const importAs: Set<string> = new Set();
  calls
    .closest(j.VariableDeclarator)
    .forEach(
      (path) =>
        path.node.id.type === 'Identifier' && callsToReplace.push(path.node.id),
    )
    .remove();

  if (
    callsToReplace.some((id) =>
      root
        .find(j.CallExpression, {
          callee: {
            name: id.name,
          },
        })
        .some((pathNode) => pathNode.node.arguments.length > 0),
    )
  ) {
    throw new Error(
      'We have dynamic class (passing a variable to useStyles), fix it yourself',
    );
  }

  j(
    callsToReplace.flatMap((id) =>
      root
        .find(j.VariableDeclarator, {
          init: {
            callee: {
              name: id.name,
            },
          },
        })
        .nodes(),
    ),
  ).forEach(
    (path) =>
      path.node.id.type === 'Identifier' && importAs.add(path.node.id.name),
  );

  const relativeCssSource = file.path.replace(/\.tsx?$/, '.css');
  const newImports = [...importAs.values()].map((asWhat) =>
    j.importDeclaration(
      [j.importNamespaceSpecifier(j.identifier(asWhat))],
      j.stringLiteral(relativeCssSource),
    ),
  );
  root.find(j.ImportDeclaration).at(-1).insertAfter(newImports);

  callsToReplace.forEach((id) =>
    root
      .find(j.VariableDeclarator, {
        init: {
          callee: {
            name: id.name,
          },
        },
      })
      .remove(),
  );

  if (!options.dry) {
    fs.writeFile(
      file.path.replace(/\.tsx?$/, '.css.ts'),
      // Easier to add them like that :sweat:
      // I'll rely on eslint autofix and prettier
      ` 
     import { internalStyle } from 'common/ui/style';

      ${rootNewCSS.toSource()}

      `,
      (err) => {
        if (err) {
          console.log(err);
        }
      },
    );
  }

  return root.toSource();
}
