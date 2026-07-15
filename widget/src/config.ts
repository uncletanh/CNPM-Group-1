// Widget được nhúng vào web của SME qua thẻ <script>, ví dụ:
// <script src="https://cdn.novachat.ai/script.umd.js"
//         data-workspace-id="1"
//         data-widget-token="xxxx"
//         data-api-url="https://api.novachat.ai/api/v1"></script>
//
// Khi chạy `npm run dev` cục bộ (không có script tag thật) thì lấy từ biến môi trường Vite.
export interface WidgetConfig {
  workspaceId: string;
  widgetToken: string;
  apiUrl: string;
}

function readScriptConfig(): Partial<WidgetConfig> {
  const currentScript = document.currentScript as HTMLScriptElement | null;
  const scriptTag =
    currentScript ?? document.querySelector<HTMLScriptElement>("script[data-workspace-id]");

  if (!scriptTag) return {};

  return {
    workspaceId: scriptTag.dataset.workspaceId,
    widgetToken: scriptTag.dataset.widgetToken,
    apiUrl: scriptTag.dataset.apiUrl,
  };
}

export function getWidgetConfig(): WidgetConfig {
  const fromScript = readScriptConfig();

  const workspaceId = fromScript.workspaceId ?? import.meta.env.VITE_WORKSPACE_ID;
  const widgetToken = fromScript.widgetToken ?? import.meta.env.VITE_WIDGET_TOKEN;
  const apiUrl =
    fromScript.apiUrl ?? import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

  if (!workspaceId || !widgetToken) {
    throw new Error(
      "Thiếu cấu hình widget: cần data-workspace-id và data-widget-token trên thẻ <script>."
    );
  }

  return { workspaceId, widgetToken, apiUrl };
}
