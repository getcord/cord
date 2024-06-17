export function addReplaceProp(
  component: string,
  typeData: {
    propertyOrder: readonly string[];
    properties: Record<string, unknown>;
  },
) {
  return {
    ...typeData,
    propertyOrder: [...typeData.propertyOrder, 'replace'],
    properties: {
      ...typeData.properties,
      replace: {
        type: 'ReplaceConfig',
        description: `Object that contains the components that will be replaced in the ${component}. Find more information about it [here](/customization/custom-react-components).`,
      },
    },
  };
}
