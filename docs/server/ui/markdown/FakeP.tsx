/** @jsxImportSource @emotion/react */

// The syntax highlighter produces tags which can't be nested inside of a <p>
// tag. Annoyingly, the markdown processor defaults to creating <p> tags that
// wrap codeblocks. This means we end up creating invalid HTML. React is really
// loud about this in the dev console, which makes us look like noobs. So, I'm
// overriding the default <p> behaviour in the markdown processor to ensure we
// get legit HTML.
type FakePProps = {
  children: React.ReactNode;
};
function FakeP({ children }: FakePProps) {
  return <div className="p">{children}</div>;
}

export default FakeP;
