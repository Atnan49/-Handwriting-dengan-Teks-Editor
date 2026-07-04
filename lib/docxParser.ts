import mammoth from "mammoth";

/**
 * Parses a DOCX/Word file and returns its clean HTML representation.
 * Works client-side using mammoth.js.
 */
export async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Custom options for Mammoth to parse images inline as Base64 and map page breaks
  const options = {
    styleMap: [
      "br[type='page'] => hr.page-break"
    ],
    convertImage: (mammoth.images as any).inline((element: any) => {
      return element.read("base64").then((imageBuffer: any) => {
        return {
          src: `data:${element.contentType};base64,${imageBuffer}`
        };
      });
    })
  };

  const result = await mammoth.convertToHtml({ arrayBuffer }, options);
  
  // Return the converted HTML string
  return result.value;
}
