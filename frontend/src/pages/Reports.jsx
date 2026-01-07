import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import {
  Calendar, TrendingUp, TrendingDown, Loader2,
  Download, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { reportsAPI, categoriesAPI, exportAPI } from '../services/api'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary')
  const [categories, setCategories] = useState([])
  
  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  })
  
  // Report data
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState(null)
  const [timeseries, setTimeseries] = useState([])
  const [timeseriesBucket, setTimeseriesBucket] = useState('daily')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchReportData()
  }, [dateRange, activeTab, timeseriesBucket])

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.list()
      setCategories(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'summary' || activeTab === 'timeseries') {
        const summaryRes = await reportsAPI.getSummary(dateRange.start, dateRange.end)
        setSummary(summaryRes.data)
      }

      if (activeTab === 'trends') {
        // Get current month for trends
        const month = `${dateRange.start.substring(0, 7)}-01`
        const trendsRes = await reportsAPI.getTrends(month)
        setTrends(trendsRes.data)
      }

      if (activeTab === 'timeseries') {
        const timeseriesRes = await reportsAPI.getTimeseries(dateRange.start, dateRange.end, timeseriesBucket)
        setTimeseries(timeseriesRes.data.series || [])
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await exportAPI.getCSV({
        start: dateRange.start,
        end: dateRange.end,
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `expenses_${dateRange.start}_${dateRange.end}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  const handleExportBackup = async () => {
    try {
      const response = await exportAPI.getBackup()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `expense_backup_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting backup:', error)
    }
  }

  const getCategoryById = (id) => categories.find(c => c.id === id)

  // Prepare pie chart data
  const pieData = summary?.by_category?.map(cat => ({
    name: cat.category_name,
    value: parseFloat(cat.total),
    color: getCategoryById(cat.category_id)?.color_token || '#8b5cf6',
    percent: parseFloat(cat.percent) * 100,
  })) || []

  // Prepare timeseries data for chart
  const chartData = timeseries.map(item => ({
    date: timeseriesBucket === 'daily'
      ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : `Week ${new Date(item.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    amount: parseFloat(item.total),
  }))

  // Quick date range presets
  const setPreset = (preset) => {
    const now = new Date()
    let start, end

    switch (preset) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last30':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        end = now
        break
      case 'last90':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        end = now
        break
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1)
        end = now
        break
      default:
        return
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-slate-400 mt-1">Analyze your spending patterns</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <Download size={18} />
            Full Backup
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'last30', label: 'Last 30 Days' },
              { id: 'last90', label: 'Last 90 Days' },
              { id: 'thisYear', label: 'This Year' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setPreset(preset.id)}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Calendar size={18} className="text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-violet-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'summary', label: 'Summary' },
          { id: 'trends', label: 'Trends' },
          { id: 'timeseries', label: 'Over Time' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Tab */}
          {activeTab === 'summary' && summary && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <p className="text-slate-400 text-sm">Total Spent</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    ৳{parseFloat(summary.total).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <p className="text-slate-400 text-sm">Daily Average</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    ৳{parseFloat(summary.average_per_day).toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <p className="text-slate-400 text-sm">Categories Used</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {summary.by_category?.length || 0}
                  </p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <h3 className="font-semibold text-white mb-4">Spending by Category</h3>
                  <div className="h-64 min-h-[256px]">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: '#1e293b',
                              border: 'none',
                              borderRadius: '12px',
                              color: '#fff',
                            }}
                            formatter={(value, name) => [`৳${value.toFixed(2)}`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        No data for this period
                      </div>
                    )}
                  </div>
                </div>

                {/* Category List */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <h3 className="font-semibold text-white mb-4">Category Details</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {pieData.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          ></div>
                          <span className="text-slate-300">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-white">৳{cat.value.toFixed(2)}</span>
                          <span className="text-slate-500 text-sm ml-2">({cat.percent.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                    {pieData.length === 0 && (
                      <p className="text-slate-500 text-center py-4">No expenses in this period</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && trends && (
            <div className="space-y-6">
              {/* Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <p className="text-slate-400 text-sm">Current Period</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    ৳{parseFloat(trends.current?.total || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {trends.current?.start} to {trends.current?.end}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <p className="text-slate-400 text-sm">Previous Period</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    ৳{parseFloat(trends.previous?.total || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {trends.previous?.start} to {trends.previous?.end}
                  </p>
                </div>
              </div>

              {/* Change Indicator */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className={`flex items-center justify-center gap-2 text-4xl font-bold ${
                      parseFloat(trends.delta || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {parseFloat(trends.delta || 0) > 0 ? (
                        <ArrowUpRight size={32} />
                      ) : (
                        <ArrowDownRight size={32} />
                      )}
                      {(Math.abs(parseFloat(trends.percent_change || 0)) * 100).toFixed(1)}%
                    </div>
                    <p className="text-slate-400 mt-2">
                      {parseFloat(trends.delta || 0) > 0 ? 'More' : 'Less'} than last month
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      Difference: ৳{Math.abs(parseFloat(trends.delta || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bar Chart Comparison */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h3 className="font-semibold text-white mb-4">Month Comparison</h3>
                <div className="h-64 min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart
                      data={[
                        { name: 'Previous', amount: parseFloat(trends.previous?.total || 0) },
                        { name: 'Current', amount: parseFloat(trends.current?.total || 0) },
                      ]}
                    >
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          background: '#1e293b',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                        formatter={(value) => [`৳${value.toFixed(2)}`, 'Spent']}
                      />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Timeseries Tab */}
          {activeTab === 'timeseries' && (
            <div className="space-y-6">
              {/* Bucket Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">View by:</span>
                <button
                  onClick={() => setTimeseriesBucket('daily')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    timeseriesBucket === 'daily'
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeseriesBucket('weekly')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    timeseriesBucket === 'weekly'
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Weekly
                </button>
              </div>

              {/* Line Chart */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h3 className="font-semibold text-white mb-4">Spending Over Time</h3>
                <div className="h-80 min-h-[320px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart data={chartData}>
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickFormatter={(value) => `৳${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#1e293b',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                          }}
                          formatter={(value) => [`৳${value.toFixed(2)}`, 'Spent']}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: '#a855f7' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      No data for this period
                    </div>
                  )}
                </div>
              </div>

              {/* Summary for period */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <p className="text-slate-400 text-sm">Total for Period</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ৳{parseFloat(summary.total).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <p className="text-slate-400 text-sm">Daily Average</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ৳{parseFloat(summary.average_per_day).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <p className="text-slate-400 text-sm">Data Points</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {chartData.length} {timeseriesBucket === 'daily' ? 'days' : 'weeks'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
