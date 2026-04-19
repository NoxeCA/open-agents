import { Font } from '@react-pdf/renderer';
import path from 'path';

Font.register({
  family: 'URWGeometric',
  fonts: [
    {
      src: path.join(process.cwd(), 'fonts', 'URWGeometricW03Regular.ttf'),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), 'fonts', 'URWGeometricW03Bold.ttf'),
      fontWeight: 700,
    },
  ],
});
