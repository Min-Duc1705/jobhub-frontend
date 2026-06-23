import { useState, useEffect } from 'react'
import { Form, InputNumber, Button, App, Select } from 'antd'
import { Area } from '@ant-design/plots'
import { getTrendApi } from '../../../services/ai-service'
import type { TrendResponse } from '../../../services/ai-service'
import { getSkillsDropdownApi } from '../../../services/skill-service'
import type { ISkill } from '../../../types/skill'

const formatVND = (value: number) => Math.round(value || 0).toLocaleString('vi-VN')

const SkillTrendChart = () => {
  const { notification } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [trend, setTrend] = useState<TrendResponse | null>(null)
  const [trendTab, setTrendTab] = useState<'job' | 'salary'>('job')
  const [skillsList, setSkillsList] = useState<ISkill[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)

  const fetchTrend = async (skillName: string, months: number) => {
    setLoading(true)
    try {
      const data = await getTrendApi({ skill_name: skillName, months })
      setTrend(data)
    } catch {
      notification.error({
        message: 'Lỗi tải xu hướng công nghệ',
        description: 'Không thể kết nối với dịch vụ phân tích dữ liệu tuyển dụng.',
        duration: 3,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoadingSkills(true)
    getSkillsDropdownApi()
      .then(res => {
        const list = res.data ?? res ?? []
        setSkillsList(list)
        
        // Tải mặc định xu hướng kỹ năng đầu tiên có trong danh sách
        // Nếu không có, fallback về 'React'
        const defaultSkill = list.length > 0 ? list[0].name : 'React'
        form.setFieldsValue({ skillName: defaultSkill })
        fetchTrend(defaultSkill, 6)
      })
      .catch(err => {
        console.warn('Lỗi khi tải skills cho dashboard trend:', err)
        fetchTrend('React', 6)
      })
      .finally(() => setLoadingSkills(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onFinish = (values: any) => {
    fetchTrend(values.skillName, values.months)
  }

  const getChartData = () => {
    if (!trend) return []
    let history = trend.history || []
    const forecast = trend.forecast || []
    
    // Nếu cả history và forecast đều rỗng (kỹ năng chưa có dữ liệu job)
    if (history.length === 0 && forecast.length === 0) {
      const list: any[] = []
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()
      
      // Tạo 6 tháng lịch sử ảo có giá trị 0
      for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i
        let y = currentYear
        if (m <= 0) {
          m += 12
          y -= 1
        }
        list.push({
          name: `${m}/${y}`,
          value: 0,
          type: 'Lịch sử',
        })
      }
      
      // Tạo điểm nối và các tháng dự báo ảo có giá trị 0
      const monthsToForecast = form.getFieldValue('months') || 6
      list.push({
        name: `${currentMonth}/${currentYear}`,
        value: 0,
        type: 'Dự báo',
      })
      
      for (let i = 1; i <= monthsToForecast; i++) {
        let m = currentMonth + i
        let y = currentYear
        if (m > 12) {
          m -= 12
          y += 1
        }
        list.push({
          name: `${m}/${y}`,
          value: 0,
          type: 'Dự báo',
        })
      }
      return list
    }

    // NẾU CÓ DỮ LIỆU NHƯNG ÍT HƠN 3 ĐIỂM HISTORY
    // Tự động sinh thêm các tháng trước đó bằng 0 để đồ thị vẽ được đường nối rõ ràng
    if (history.length > 0 && history.length < 3) {
      const padCount = 3 - history.length
      const firstPoint = history[0]
      const padded: any[] = []
      
      let tempMonth = firstPoint.month
      let tempYear = firstPoint.year
      
      for (let i = 0; i < padCount; i++) {
        tempMonth -= 1
        if (tempMonth <= 0) {
          tempMonth = 12
          tempYear -= 1
        }
        padded.unshift({
          month: tempMonth,
          year: tempYear,
          job_count: 0,
          avg_salary: 0
        })
      }
      history = [...padded, ...history]
    }

    const list: any[] = []
    const labelHistory = 'Lịch sử'
    const labelForecast = 'Dự báo'

    history.forEach((item) => {
      list.push({
        name: `${item.month}/${item.year}`,
        value: trendTab === 'job' ? item.job_count : item.avg_salary,
        type: labelHistory,
      })
    })

    // Điểm nối: lấy điểm cuối của lịch sử làm điểm đầu của dự báo
    if (history.length > 0 && forecast.length > 0) {
      const lastH = history[history.length - 1]
      list.push({
        name: `${lastH.month}/${lastH.year}`,
        value: trendTab === 'job' ? lastH.job_count : lastH.avg_salary,
        type: labelForecast,
      })
    }

    forecast.forEach((item) => {
      list.push({
        name: `${item.month}/${item.year}`,
        value: trendTab === 'job' ? item.job_count : item.avg_salary,
        type: labelForecast,
      })
    })

    return list
  }

  const chartData = getChartData()

  // Cấu hình biểu đồ Area của Ant Design Plots (G2 v5)
  const config = {
    data: chartData,
    xField: 'name',
    yField: 'value',
    colorField: 'type',
    height: 260,
    scale: {
      color: {
        domain: ['Lịch sử', 'Dự báo'],
        range: [trendTab === 'job' ? '#0075d5' : '#20c997', '#ff9f43'],
      },
    },
    style: {
      lineDash: (datum: any) => (datum.type === 'Dự báo' ? [4, 4] : [0, 0]),
      strokeWidth: 2.5,
      fillOpacity: 0.15,
    },
    interaction: {
      tooltip: {
        shared: true,
        showMarkers: true,
      },
    },
    tooltip: {
      title: 'name',
      items: [
        {
          channel: 'y',
          valueFormatter: (v: any) => (trendTab === 'job' ? `${v} jobs` : `${formatVND(v)} VND`),
        },
      ],
    },
  }

  return (
    <section className="dashboard-skill-trend-section">
      <div className="trend-card-header">
        <div className="header-left">
          <span className="material-symbols-outlined header-icon">trending_up</span>
          <div>
            <h3 className="trend-card-title">AI Skill Market Trend Forecast (AntD Charts)</h3>
            <p className="trend-card-subtitle">
              Phân tích lịch sử và dự đoán xu hướng tuyển dụng, thu nhập của kỹ năng trong tương lai.
            </p>
          </div>
        </div>

        <Form
          form={form}
          layout="inline"
          className="trend-header-form"
          onFinish={onFinish}
          initialValues={{ skillName: 'React', months: 6 }}
        >
          <Form.Item 
            label="Kỹ năng" 
            name="skillName" 
            rules={[{ required: true, message: 'Chọn công nghệ' }]}
          >
            <Select
              showSearch
              placeholder="Chọn kỹ năng..."
              style={{ width: 180 }}
              loading={loadingSkills}
              options={skillsList.map(s => ({ label: s.name, value: s.name }))}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item 
            label="Số tháng dự báo" 
            name="months" 
            rules={[{ required: true, message: 'Số tháng' }]}
          >
            <InputNumber min={1} max={24} style={{ width: 80 }} placeholder="Tháng" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} className="btn-query-trend">
            Tra cứu
          </Button>
        </Form>
      </div>

      <div className="trend-card-body">
        {trend && (
          <div className="trend-chart-wrapper">
            <div className="trend-chart-tabs-row">
              <div className="trend-tabs">
                <button
                  type="button"
                  className={`trend-tab-btn ${trendTab === 'job' ? 'active' : ''}`}
                  onClick={() => setTrendTab('job')}
                >
                  Nhu cầu tuyển dụng (Job Postings)
                </button>
                <button
                  type="button"
                  className={`trend-tab-btn ${trendTab === 'salary' ? 'active' : ''}`}
                  onClick={() => setTrendTab('salary')}
                >
                  Mức lương trung bình (Avg Salary)
                </button>
              </div>
              <div className="trend-info-badge">
                Đang xem xu hướng: <strong>{trend.skill_name}</strong>
              </div>
            </div>

            <div className="trend-chart-render">
              <div style={{ height: 260 }}>
                <Area {...config} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default SkillTrendChart
