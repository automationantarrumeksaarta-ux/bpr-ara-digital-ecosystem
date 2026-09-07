"use client"

import * as React from "react"
import { Star } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "../../lib/utils"

export interface PointsChartDataPoint {
  date: string
  total: number
  change: number
}

export interface PointsChartLevel {
  value: number
  color: string
}

export interface PointsChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: PointsChartDataPoint[]
  height?: number
  title?: string
  headerRight?: React.ReactNode
  yAxisLabel?: string
  levels?: PointsChartLevel[]
  className?: string
}

function formatValue(value: number) {
  return Math.round(value).toLocaleString()
}

function LevelReferenceStarLabel({
  viewBox,
  color,
}: {
  viewBox?: { x?: number; y?: number } | null
  color: string
}) {
  const x = viewBox?.x
  const y = viewBox?.y

  if (typeof x !== "number" || typeof y !== "number") {
    return null
  }

  return (
    <g transform={`translate(${x - 14},${y})`}>
      <Star
        x={-5}
        y={-5}
        width={10}
        height={10}
        fill={color}
        stroke={color}
        strokeWidth={1.75}
      />
    </g>
  )
}

export function PointsChart({
  data,
  height = 260,
  title = "Your points",
  headerRight,
  yAxisLabel,
  levels,
  className,
  ...props
}: PointsChartProps) {
  const yDomain = React.useMemo<[number, number]>(() => {
    const values = [
      ...data.map((item) => item.total),
      ...(levels?.map((level) => level.value) ?? []),
    ]

    if (values.length === 0) return [0, 100]

    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue

    if (range === 0) {
      const padding = Math.max(maxValue * 0.15, 10)
      return [Math.max(0, minValue - padding), maxValue + padding]
    }

    const padding = Math.max(range * 0.12, 10)
    return [Math.max(0, minValue - padding), maxValue + padding]
  }, [data, levels])

  const isDark = document.documentElement.classList.contains('dark')
  const chartColor = "#2563eb" // blue-600
  const gridColor = isDark ? "#334155" : "#e2e8f0" // slate-700 / slate-200
  const tickColor = isDark ? "#94a3b8" : "#64748b" // slate-400 / slate-500
  const popoverBg = isDark ? "#0f172a" : "#ffffff"
  const popoverBorder = isDark ? "#1e293b" : "#e2e8f0"

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-bold text-slate-800 dark:text-white text-base">{title}</p>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
          >
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: tickColor, fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={yDomain}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickFormatter={formatValue}
              width={35}
              label={
                yAxisLabel
                  ? {
                      value: yAxisLabel,
                      angle: -90,
                      position: "insideLeft",
                      fill: tickColor,
                      fontSize: 12,
                      dx: -18,
                    }
                  : undefined
              }
            />
            {levels?.map((level) => (
              <ReferenceLine
                key={level.value}
                y={level.value}
                stroke={level.color}
                strokeDasharray="6 6"
                strokeWidth={2}
                label={{
                  position: "left",
                  content: (labelProps: { viewBox?: unknown }) => (
                    <LevelReferenceStarLabel
                      viewBox={
                        (labelProps.viewBox as {
                          x?: number
                          y?: number
                        } | null) ?? null
                      }
                      color={level.color}
                    />
                  ),
                }}
              />
            ))}
            <Tooltip
              cursor={{ stroke: chartColor, strokeDasharray: "4 4" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as PointsChartDataPoint
                const changePrefix = row.change > 0 ? "+" : ""
                return (
                  <div
                    className="rounded-xl px-4 py-3 text-sm shadow-xl"
                    style={{
                      backgroundColor: popoverBg,
                      borderColor: popoverBorder,
                      borderWidth: 1,
                      borderStyle: 'solid'
                    }}
                  >
                    <p className="text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                    <p className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                      Progress: {formatValue(row.total)}%
                    </p>
                    <p className="text-emerald-500 font-semibold text-xs tabular-nums mt-1">
                      {changePrefix}
                      {formatValue(row.change)}% dari bulan lalu
                    </p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke={chartColor}
              strokeWidth={3}
              connectNulls
              dot={{ r: 4, fill: isDark ? '#1e293b' : 'white', stroke: chartColor, strokeWidth: 2 }}
              activeDot={{ r: 7, fill: chartColor, stroke: 'white', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
