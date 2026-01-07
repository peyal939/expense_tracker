import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from 'recharts'
import {
  Calendar, TrendingUp, TrendingDown, Loader2,
  Download, ArrowUpRight, ArrowDownRight, AlertTriangle,
  CheckCircle2, XCircle, Target, Wallet, PiggyBank, Activity,
} from 'lucide-react'
import { reportsAPI, categoriesAPI, exportAPI } from '../services/api'
import { useOnboarding } from '../context/OnboardingContext'

export default function Reports() {
  const { markReportsViewed } = useOnboarding()
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
  const [spendingTrends, setSpendingTrends] = useState(null)
  const [monthEndSummary, setMonthEndSummary] = useState(null)

  useEffect(() => {
    fetchCategories()
    // Mark reports as viewed when component mounts
    markReportsViewed()
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

      if (activeTab === 'spending-trends') {
        const trendsRes = await reportsAPI.getSpendingTrends()
        setSpendingTrends(trendsRes.data)
      }

      if (activeTab === 'month-end') {
        const month = `${dateRange.start.substring(0, 7)}-01`
        const summaryRes = await reportsAPI.getMonthEndSummary(month)
        setMonthEndSummary(summaryRes.data)
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

  // Prepare daily spending trend chart data
  const dailyTrendData = spendingTrends?.daily_spending
    ? Object.entries(spendingTrends.daily_spending).map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: amount,
      }))
    : []

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 size={16} className="text-emerald-400" />
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-400" />
      case 'exceeded':
        return <XCircle size={16} className="text-rose-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok':
        return 'text-emerald-400'
      case 'warning':
        return 'text-amber-400'
      case 'exceeded':
        return 'text-rose-400'
      default:
        return 'text-slate-400'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Analyze your spending patterns</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-sm"
          >
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-sm"
          >
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Full Backup</span>
            <span className="sm:hidden">Backup</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'last30', label: '30 Days' },
              { id: 'last90', label: '90 Days' },
              { id: 'thisYear', label: 'This Year' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setPreset(preset.id)}
                className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400 hidden sm:block" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1 sm:w-auto bg-slate-800 border border-slate-700 rounded-lg px-2 sm:px-3 py-1.5 text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <span className="text-slate-500 text-center hidden sm:block">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="flex-1 sm:w-auto bg-slate-800 border border-slate-700 rounded-lg px-2 sm:px-3 py-1.5 text-white text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {[
          { id: 'summary', label: 'Summary' },
          { id: 'trends', label: 'Compare' },
          { id: 'timeseries', label: 'Timeline' },
          { id: 'spending-trends', label: 'Trends' },
          { id: 'month-end', label: 'Month End' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors text-sm ${
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
            <div className="space-y-4 sm:space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5">
                  <p className="text-slate-400 text-xs sm:text-sm">Total Spent</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    ৳{parseFloat(summary.total).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5">
                  <p className="text-slate-400 text-xs sm:text-sm">Daily Average</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    ৳{parseFloat(summary.average_per_day).toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5">
                  <p className="text-slate-400 text-xs sm:text-sm">Categories Used</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    {summary.by_category?.length || 0}
                  </p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Pie Chart */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5">
                  <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Spending by Category</h3>
                  <div className="h-48 sm:h-64 min-h-[192px] sm:min-h-[256px]">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
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

          {/* Trends Tab (Month Comparison) */}
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

          {/* Spending Trends Tab (NEW) */}
          {activeTab === 'spending-trends' && (
            <div className="space-y-6">
              {!spendingTrends?.has_data ? (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center">
                  <Activity size={48} className="mx-auto text-slate-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Not Enough Data</h3>
                  <p className="text-slate-400">
                    {spendingTrends?.message || 'Need at least 7 days of spending data for trend analysis.'}
                  </p>
                  {spendingTrends?.days_available && (
                    <p className="text-slate-500 text-sm mt-2">
                      Currently have {spendingTrends.days_available} days of data.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Velocity Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Wallet size={16} />
                        <span>Total Spent</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ৳{spendingTrends.totals?.total_spent?.toLocaleString('en-BD', { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                      <p className="text-slate-500 text-sm mt-1">
                        Last {spendingTrends.period?.days || 30} days
                      </p>
                    </div>
                    
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Activity size={16} />
                        <span>Daily Average</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ৳{spendingTrends.totals?.average_daily?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <TrendingUp size={16} />
                        <span>Recent 7 Days</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ৳{spendingTrends.velocity?.recent_7_days?.toLocaleString('en-BD', { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                    
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Target size={16} />
                        <span>Projected Month</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ৳{spendingTrends.projection?.projected_month_total?.toLocaleString('en-BD', { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                      <p className="text-slate-500 text-sm mt-1">
                        {spendingTrends.projection?.days_remaining} days left
                      </p>
                    </div>
                  </div>

                  {/* Velocity Indicator */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Activity size={20} />
                      Spending Velocity
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Previous 7 Days</p>
                        <p className="text-xl font-bold text-white">
                          ৳{spendingTrends.velocity?.previous_7_days?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="text-center px-6">
                        <div className={`flex items-center justify-center gap-2 text-2xl font-bold ${
                          spendingTrends.velocity?.trend === 'increasing' ? 'text-rose-400' :
                          spendingTrends.velocity?.trend === 'decreasing' ? 'text-emerald-400' :
                          'text-slate-400'
                        }`}>
                          {spendingTrends.velocity?.trend === 'increasing' ? (
                            <TrendingUp size={28} />
                          ) : spendingTrends.velocity?.trend === 'decreasing' ? (
                            <TrendingDown size={28} />
                          ) : (
                            <Activity size={28} />
                          )}
                          {spendingTrends.velocity?.change_percent !== null
                            ? `${spendingTrends.velocity.change_percent > 0 ? '+' : ''}${spendingTrends.velocity.change_percent.toFixed(1)}%`
                            : 'N/A'}
                        </div>
                        <p className="text-slate-500 text-sm mt-1 capitalize">
                          {spendingTrends.velocity?.trend || 'Stable'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Recent 7 Days</p>
                        <p className="text-xl font-bold text-white">
                          ৳{spendingTrends.velocity?.recent_7_days?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Daily Spending Chart */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <h3 className="font-semibold text-white mb-4">Daily Spending Pattern</h3>
                    <div className="h-72 min-h-[288px]">
                      {dailyTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <AreaChart data={dailyTrendData}>
                            <defs>
                              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#64748b', fontSize: 11 }}
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
                            <Area
                              type="monotone"
                              dataKey="amount"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorAmount)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                          No daily data available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Categories */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <h3 className="font-semibold text-white mb-4">Top Spending Categories</h3>
                    <div className="space-y-4">
                      {spendingTrends.top_categories?.map((cat, index) => {
                        const totalSpent = spendingTrends.totals?.total_spent || 1
                        const percent = (cat.total / totalSpent) * 100
                        const category = categories.find(c => c.id === cat.category_id)
                        const color = category?.color_token || '#8b5cf6'
                        
                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-slate-300">{cat.category_name}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium text-white">৳{cat.total.toFixed(2)}</span>
                                <span className="text-slate-500 text-sm ml-2">({percent.toFixed(1)}%)</span>
                              </div>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      {(!spendingTrends.top_categories || spendingTrends.top_categories.length === 0) && (
                        <p className="text-slate-500 text-center py-4">No category data available</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Month End Summary Tab (NEW) */}
          {activeTab === 'month-end' && (
            <div className="space-y-6">
              {!monthEndSummary ? (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center">
                  <PiggyBank size={48} className="mx-auto text-slate-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Summary Available</h3>
                  <p className="text-slate-400">
                    Unable to generate month-end summary for the selected period.
                  </p>
                </div>
              ) : (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-xl border border-emerald-500/20 p-5">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
                        <Wallet size={16} />
                        <span>Total Income</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ৳{monthEndSummary.income?.total?.toLocaleString('en-BD', { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-violet-500/20 to-violet-500/5 rounded-xl border border-violet-500/20 p-5">
                      <div className="flex items-center gap-2 text-violet-400 text-sm mb-2">
                        <Target size={16} />
                        <span>Budget</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ৳{monthEndSummary.budget?.total?.toLocaleString('en-BD', { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-rose-500/20 to-rose-500/5 rounded-xl border border-rose-500/20 p-5">
                      <div className="flex items-center gap-2 text-rose-400 text-sm mb-2">
                        <TrendingDown size={16} />
                        <span>Total Spent</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ৳{monthEndSummary.spending?.total?.toLocaleString('en-BD', { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                    
                    <div className={`bg-gradient-to-br ${
                      monthEndSummary.savings?.amount >= 0
                        ? 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20'
                        : 'from-amber-500/20 to-amber-500/5 border-amber-500/20'
                    } rounded-xl border p-5`}>
                      <div className={`flex items-center gap-2 text-sm mb-2 ${
                        monthEndSummary.savings?.amount >= 0 ? 'text-cyan-400' : 'text-amber-400'
                      }`}>
                        <PiggyBank size={16} />
                        <span>{monthEndSummary.savings?.amount >= 0 ? 'Savings' : 'Overspent'}</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ৳{Math.abs(monthEndSummary.savings?.amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </p>
                      {monthEndSummary.savings?.rate_percent !== null && (
                        <p className="text-slate-400 text-sm mt-1">
                          {monthEndSummary.savings.rate_percent.toFixed(1)}% of budget
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Budget Compliance */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <h3 className="font-semibold text-white mb-4">Budget Compliance</h3>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 w-full">
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-400">Budget Used</span>
                          <span className={`font-medium ${
                            monthEndSummary.compliance?.within_budget ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {monthEndSummary.compliance?.percent_used?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              monthEndSummary.compliance?.percent_used > 100
                                ? 'bg-rose-500'
                                : monthEndSummary.compliance?.percent_used > 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(monthEndSummary.compliance?.percent_used || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                        monthEndSummary.compliance?.within_budget
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {monthEndSummary.compliance?.within_budget ? (
                          <>
                            <CheckCircle2 size={20} />
                            <span className="font-medium">Within Budget</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={20} />
                            <span className="font-medium">Over Budget</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <h3 className="font-semibold text-white mb-4">Category Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-800">
                            <th className="text-left text-slate-400 text-sm font-medium pb-3">Category</th>
                            <th className="text-right text-slate-400 text-sm font-medium pb-3">Budget</th>
                            <th className="text-right text-slate-400 text-sm font-medium pb-3">Spent</th>
                            <th className="text-right text-slate-400 text-sm font-medium pb-3">Used</th>
                            <th className="text-center text-slate-400 text-sm font-medium pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthEndSummary.spending?.by_category?.map((cat, index) => {
                            const category = categories.find(c => c.id === cat.category_id)
                            const color = category?.color_token || '#8b5cf6'
                            
                            return (
                              <tr key={index} className="border-b border-slate-800/50">
                                <td className="py-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: color }}
                                    />
                                    <span className="text-white">{cat.category_name}</span>
                                  </div>
                                </td>
                                <td className="py-3 text-right text-slate-300">
                                  {cat.budget ? `৳${cat.budget.toFixed(2)}` : '-'}
                                </td>
                                <td className="py-3 text-right text-white font-medium">
                                  ৳{cat.spent.toFixed(2)}
                                </td>
                                <td className="py-3 text-right">
                                  {cat.percent_used !== null ? (
                                    <span className={getStatusColor(cat.status)}>
                                      {cat.percent_used.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">-</span>
                                  )}
                                </td>
                                <td className="py-3 text-center">
                                  <div className="flex justify-center">
                                    {getStatusIcon(cat.status)}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                          {(!monthEndSummary.spending?.by_category || monthEndSummary.spending.by_category.length === 0) && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-500">
                                No spending data for this month
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Insights */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="font-semibold text-white mb-4">Month Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-400">Total Categories</span>
                        <span className="text-white font-medium">
                          {monthEndSummary.spending?.by_category?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-400">Categories Over Budget</span>
                        <span className="text-rose-400 font-medium">
                          {monthEndSummary.spending?.by_category?.filter(c => c.status === 'exceeded').length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-400">Categories Warning</span>
                        <span className="text-amber-400 font-medium">
                          {monthEndSummary.spending?.by_category?.filter(c => c.status === 'warning').length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-400">Categories On Track</span>
                        <span className="text-emerald-400 font-medium">
                          {monthEndSummary.spending?.by_category?.filter(c => c.status === 'ok').length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
