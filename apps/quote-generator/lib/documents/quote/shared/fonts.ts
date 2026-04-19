import { Font } from "@react-pdf/renderer";

import { resolveQuoteGeneratorPath } from "./asset-paths";

Font.register({
  family: "URWGeometric",
  fonts: [
    {
      src: resolveQuoteGeneratorPath("fonts", "URWGeometricW03Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: resolveQuoteGeneratorPath("fonts", "URWGeometricW03Bold.ttf"),
      fontWeight: 700,
    },
  ],
});
