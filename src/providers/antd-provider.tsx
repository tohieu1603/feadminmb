"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import viVN from "antd/locale/vi_VN";
import type { ReactNode } from "react";

interface AntdProviderProps {
  children: ReactNode;
}

// Custom theme
const theme = {
  token: {
    colorPrimary: "#1890ff",
    borderRadius: 6,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      siderBg: "#001529",
      headerBg: "#fff",
    },
    Menu: {
      darkItemBg: "#001529",
      darkSubMenuItemBg: "#000c17",
    },
  },
};

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme} locale={viVN}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
