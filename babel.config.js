const presets = ["@babel/typescript"];

if (process.env.NODE_ENV === "test") {
  presets.push(["@babel/preset-env", { targets: { node: "current" } }]);
}

module.exports = {
  presets,
  plugins: ["@babel/proposal-class-properties"],
};
