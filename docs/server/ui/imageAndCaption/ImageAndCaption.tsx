/** @jsxImportSource @emotion/react */

type ImageAndCaptionProps = {
  imgSrc: string;
  imgAlt: string;
  imgHeight?: React.CSSProperties['height'];
  caption: string;
};
export function ImageAndCaption({
  imgSrc,
  imgAlt,
  imgHeight = 'auto',
  caption,
}: ImageAndCaptionProps) {
  return (
    <figure css={{ display: 'block', flexWrap: 'wrap' }}>
      <img
        src={imgSrc}
        alt={imgAlt}
        css={{
          backgroundColor: 'var(--color-greyXlight)',
          borderRadius: 8,
          height: imgHeight,
          objectFit: 'contain',
        }}
      ></img>
      <figcaption
        style={{
          color: 'var(--color-contentPrimary)',
          fontSize: 14,
        }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}
