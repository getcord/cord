export async function svgToDataURL(
  svg: SVGElement,
  replacements: { [replace: string]: string } = {},
): Promise<string> {
  return await Promise.resolve().then(() => {
    svg.querySelectorAll(`*[src]`).forEach((element) => {
      const src = element.getAttribute('src');
      if (src && replacements[src]) {
        element.setAttribute('src', replacements[src]);
      }
    });
    const xml = new XMLSerializer().serializeToString(svg);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });
}
