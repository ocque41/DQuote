/** @type {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: ["cn", "clsx", "cva", "classNames"],
};

export default config;
