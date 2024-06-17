## Annotation classes

How they work

### Monaco Editor (https://github.com/microsoft/monaco-editor)

- When a user places an annotation, we work out whether it is in a monaco editor by looking for the presence of the selector '[data-mprt="3"].overflow-guard' in the elements in elementsFromPoint(...selectedCoordinates)
- If the annotation is within a monaco editor, we save additional target data to the annotation's DocumentLocation: the ID and the line number annotated
  - The ID of the editor is added by our partner to the editor via the CORD_INSTANCE_ID_ATTRIBUTE_NAME data attribute
  - The lineNumber can be calculated in two ways:
    - If our partner has provided us with the monacoEditor instance via `addMonacoEditor`, we use Monaco's inbuilt method `getTargetAtClientPoint`
    - If we don't have access to the instance, we can still work it out from the inline style set on the line element (`calculateMonacoLineNumberFromStyle`)
- We use the inline style of the line element as our selector (`getMonacoLineSelector`)
- When locating the annotation, we use the methods on MonacoEditorAnnotation, which is created from `createAnnotationInstance` if the monaco additional target data is set
  - If we have access to the MonacoEditor instance, we are able to find and scroll to all annotations, even if not in the current scroll view of the Monaco Editor (which is virtualised). To scroll, we use the Monaco Editor's native method `scrollToLine`
  - If we do not have access to the instance, we can only find the annotation if it happens to be in the current scroll view

### React Tree (https://github.com/react-component/tree)

- When a user places an annotation, we work out if the annotation is in a react tree using a fairly convoluted check that the annotated point is inside the tree DOM structure (see example tree structure in following subsection)
- If it is in a reactTree, and we have access to the tree instance, we save the ID of the tree and the key of the node
  - ID is put on react tree instance by our partner via CORD_INSTANCE_ID_ATTRIBUTE_NAME data attribute
  - We work out the key by:
    - Working out the annotated tree node's index within the rendered tree nodes (not all are rendered at one time)
    - Working out the rendered nodes index range within all possible nodes (using height of nodes and translateY styles of top & bottom)
    - Using these indexes to grab the right node in `tree.getFlattenedNodes()`, which has the key stored on it
- When locating the annotation, we create a new ReactTreeAnnotation and use the methods on that
- We find the node using similar methods to how we work out the key - working out the currently visible nodes and seeing if our key is present. If it's not present but not visible, we can go to the annotation by:
  - Expanding the tree above the node if necessary
  - Scrolling to the right node
- If we don't have access to the tree instance, we can only show the annotation if a) It is on screen and b) We had to the tree instance at time of annotation, and the treeNode key made it into the CSS selector that we saved

#### Example tree structure on Salto

```
<div className='[PREFIX_CLS]'>
  <div role='tree'>...</div>
  <div className='[PREFIX_CLS]-list' [CORD_INSTANCE_ID_ATTRIBUTE_NAME]='unique_id'>
    <div className='[PREFIX_CLS]-list-holder'>
      <div>
        <div className='[PREFIX_CLS]-list-holder-inner'>
          {visibleTreeNodes.map((node) => <div className='[PREFIX_CLS]-treenode'>...</div>}
        </div>
      </div>
    </div>
  </div>
</div>
```

#### Testing React Tree on Salto

- Go to https://app.salto.io/orgs/ac247678-3977-4be5-80d6-8944f91ed5ef/envs/fcb37d6d-fb08-4bf1-a6cd-819130ad7808/explore and log in using sock@cord.com
- Go to CPQdev environment, 'Files' tab and you should see a react tree
- Using the inspector, locate the div with class 'file-tree-wrapper'
- Switch to the React components tab of chrome devtools
- Click on the FileTree (Memo) component in the react devtools left panel
- In right panel, click on the first ref in the hooks section. This should be
  the ReactTree instance (which should look like type ReactTreeInstance in
  types file in current folder)
- Right click it and 'Store as global variable'
- In the console you will see it has been assigned to $reactTemp1. Can ignore errors
- Inject the sidebar into the page
- Get the value of data-cord-instance-id on div with className
  "salto-file-tree-list". If it doesn't have this value, add a value. This
  value is the ID used in next step
- Call the addReactTree method: cordSDK.addReactTree(id, $reactTemp1);
- Annotate anywhere on the tree and post message
- Debug the message and check that the annotation attachment has
  additionalTargetData field set to { targetType: 'reactTree', reactTree: {
  key: 'someKey', treeID: 'someID' } }
- Check that
  - The annotation shows on page
  - You can scroll to the annotation on click
