"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Menu, Button, Dropdown, Avatar, Typography, theme } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  WalletOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAuth } from "@/hooks/use-auth";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Menu items
const menuItems: MenuProps["items"] = [
  {
    key: "/admin",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "/admin/users",
    icon: <UserOutlined />,
    label: "Quản lý Users",
  },
  {
    key: "/admin/deposits",
    icon: <WalletOutlined />,
    label: "Quản lý Nạp tiền",
  },
  {
    key: "/admin/cronjobs",
    icon: <ClockCircleOutlined />,
    label: "Quản lý Cronjobs",
  },
  {
    key: "/admin/gateway-jobs",
    icon: <RocketOutlined />,
    label: "Gateway Jobs",
  },
  {
    key: "/admin/analytics",
    icon: <BarChartOutlined />,
    label: "Token Analytics",
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, logoutLoading } = useAuth();
  const { token } = theme.useToken();

  // Handle menu click
  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key);
  };

  // User dropdown menu
  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin tài khoản",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      logout();
    }
  };

  // Get selected key from pathname
  const getSelectedKey = () => {
    if (pathname === "/admin") return ["/admin"];
    if (pathname.startsWith("/admin/users")) return ["/admin/users"];
    if (pathname.startsWith("/admin/deposits")) return ["/admin/deposits"];
    if (pathname.startsWith("/admin/cronjobs")) return ["/admin/cronjobs"];
    if (pathname.startsWith("/admin/gateway-jobs")) return ["/admin/gateway-jobs"];
    if (pathname.startsWith("/admin/analytics")) return ["/admin/analytics"];
    return [pathname];
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Text
            strong
            style={{
              color: "#fff",
              fontSize: collapsed ? 16 : 20,
              transition: "all 0.2s",
            }}
          >
            {collapsed ? "OP" : "Operis Admin"}
          </Text>
        </div>

        {/* Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>

      {/* Main Layout */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "all 0.2s",
        }}
      >
        {/* Header */}
        <Header
          style={{
            padding: "0 24px",
            background: token.colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 99,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          {/* Collapse button */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 48, height: 48 }}
          />

          {/* User dropdown */}
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Button
              type="text"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 12px",
              }}
              loading={logoutLoading}
            >
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: token.colorPrimary }}
              />
              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.name || user?.email || "Admin"}
              </span>
            </Button>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: 24,
            minHeight: "calc(100vh - 64px - 48px)",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
