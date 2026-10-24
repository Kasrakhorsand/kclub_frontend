/**
 * Structured data for search engines and AI answer engines (schema.org JSON-LD).
 * `<` is escaped so text from config or the API can never close the script tag.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const doc = Array.isArray(data) ? { "@context": "https://schema.org", "@graph": data } : { "@context": "https://schema.org", ...data };
  const json = JSON.stringify(doc).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
