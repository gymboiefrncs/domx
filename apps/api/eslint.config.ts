import nodeConfig from "@domx/eslint-config/node";

export default [...nodeConfig, { ignores: ["dist/"] }];
