// Next 16 ESLint flat config — eslint-config-next 16 은 네이티브 flat config 배열을 export.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "scripts/**"] },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
