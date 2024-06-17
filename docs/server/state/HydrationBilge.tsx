/** @jsxImportSource @emotion/react */

type HydrationBilgeProps = {
  props: object;
};

function HydrationBilge({ props }: HydrationBilgeProps) {
  return (
    <>
      <div id="hydration-bilge" data-hydration-state={JSON.stringify(props)} />
      <script src="/static/hydrate.js"></script>
    </>
  );
}

export function MiniAppHydrationBilge({ props }: HydrationBilgeProps) {
  return (
    <>
      <div id="hydration-bilge" data-hydration-state={JSON.stringify(props)} />
      <script src="/static/hydrateMiniApp.js"></script>
    </>
  );
}

export default HydrationBilge;
