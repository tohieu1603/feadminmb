"use client";

import { Card, Statistic } from "antd";
import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  prefix?: ReactNode;
  suffix?: string;
  valueStyle?: React.CSSProperties;
  loading?: boolean;
  formatter?: (value: number | string) => ReactNode;
}

export function StatsCard({
  title,
  value,
  prefix,
  suffix,
  valueStyle,
  loading,
  formatter,
}: StatsCardProps) {
  return (
    <Card className="stat-card" loading={loading}>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ fontSize: 24, ...valueStyle }}
        formatter={formatter as (value: number | string | undefined) => ReactNode}
      />
    </Card>
  );
}
