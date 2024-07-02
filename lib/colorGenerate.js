import tinycolor from 'tinycolor2'; // Certifique-se de instalar a biblioteca tinycolor2

const colorGenerate = {
// Função para criar variações de primaryColor
createPrimaryColorVariants: (color) => {
  const baseColor = tinycolor(color);
  const dark = baseColor.clone().desaturate(5).lighten(11);
  const normal = dark.clone().desaturate(5).lighten(11);
  const light = normal.clone().desaturate(5).lighten(11);
  return {
    darken: baseColor.toHexString(),
    dark: dark.toHexString(),
    normal: normal.toHexString(),
    light: light.toHexString(),
  };
},

// Função para criar variações de whiteColor
createWhiteColorVariants: (color) => {
  const baseColor = tinycolor(color);
  let lightenValue = 100;
  let darken, dark, normal, light;
  // Incrementar lightenValue até encontrar o primeiro valor diferente de #ffffff
  while (true) {
    darken = baseColor.clone().lighten(lightenValue);
    dark = darken.clone().desaturate(2).lighten(3);
    normal = dark.clone().desaturate(2).lighten(1);
    light = normal.clone().desaturate(2).lighten(1);
    if (light.toHexString() !== '#ffffff') {
      break;
    }
    lightenValue = lightenValue - 0.5 ;
  }
  // Recalcular as cores com o lightenValue encontrado
  darken = baseColor.clone().lighten(lightenValue);
  dark = darken.clone().desaturate(2).lighten(3);
  normal = dark.clone().desaturate(2).lighten(1);
  light = normal.clone().desaturate(2).lighten(1);

  return {
    darken: darken.toHexString(),
    dark: dark.toHexString(),
    normal: normal.toHexString(),
    light: light.toHexString(),
  };
}
};

export default colorGenerate;
