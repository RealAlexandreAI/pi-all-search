import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerWebSearchTool } from "./src/web-search.js";
import { registerExtractTool } from "./src/extract.js";
import { registerGetSubDomainsTool } from "./src/get-sub-domains.js";

export default function (pi: ExtensionAPI) {
  registerWebSearchTool(pi);
  registerExtractTool(pi);
  registerGetSubDomainsTool(pi);
}
