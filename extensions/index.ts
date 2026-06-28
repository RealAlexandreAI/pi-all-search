import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerWebSearchTool } from "./src/web-search.js";

export default function (pi: ExtensionAPI) {
  registerWebSearchTool(pi);
}
