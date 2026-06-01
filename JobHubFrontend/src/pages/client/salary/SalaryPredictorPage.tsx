import { useState, useEffect } from 'react'
import { App, Button, Form, Input, InputNumber, Select, Slider } from 'antd'
import type { SalaryPredictResponse, TrendResponse } from '../../../services/ai-service'
import { getTrendApi, predictSalaryApi } from '../../../services/ai-service'
import { getSkillsDropdownApi } from '../../../services/skill-service'
import type { ISkill } from '../../../types/skill'
import './SalaryPredictorPage.scss'

const LEVELS = [
  { label: 'Intern', value: 'INTERN' },
  { label: 'Fresher', value: 'FRESHER' },
  { label: 'Junior', value: 'JUNIOR' },
  { label: 'Middle', value: 'MIDDLE' },
  { label: 'Senior', value: 'SENIOR' },
]

interface SalaryFormValues {
  jobTitle: string
  level: string
  skills?: string[]
  location: string
}

interface TrendFormValues {
  skillName: string
  months: number
}

const formatMoney = (value: number) => Number(value || 0).toFixed(1)
const formatConfidence = (value: number) => `${Math.round((value || 0) * 100)}%`

const SalaryPredictorPage = () => {
  const { notification } = App.useApp()
  const [form] = Form.useForm<SalaryFormValues>()
  const [trendForm] = Form.useForm<TrendFormValues>()
  const [exp, setExp] = useState<number>(3)
  const [loading, setLoading] = useState(false)
  const [trendLoading, setTrendLoading] = useState(false)
  const [result, setResult] = useState<SalaryPredictResponse | null>(null)
  const [trend, setTrend] = useState<TrendResponse | null>(null)

  const [skillsList, setSkillsList] = useState<ISkill[]>([])
  const [provinceOptions, setProvinceOptions] = useState<any[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)

  useEffect(() => {
    // 1. Fetch skills dropdown
    getSkillsDropdownApi()
      .then(res => {
        const list = res.data ?? res ?? []
        setSkillsList(list)
      })
      .catch(err => console.warn('Lỗi khi tải skills:', err))

    // 2. Fetch Vietnam provinces
    setLoadingProvinces(true)
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then(res => res.json())
      .then((data: any[]) => {
        const cleanProvinceName = (name: string) => name.replace(/^(Thành phố|Tỉnh)\s+/i, '').trim();
        const options = data.map((province: any) => {
          const cleaned = cleanProvinceName(province.name);
          return {
            label: cleaned,
            value: cleaned,
          };
        })
        // Thêm Remote và Khác
        options.push({
          label: 'Remote',
          value: 'Remote',
        })
        options.push({
          label: 'Khác',
          value: 'Khác',
        })
        setProvinceOptions(options)
      })
      .catch(err => {
        console.warn('Lỗi khi tải danh sách tỉnh thành:', err)
        setProvinceOptions([
          { label: 'Hà Nội', value: 'Hà Nội' },
          { label: 'TP.HCM', value: 'TP.HCM' },
          { label: 'Đà Nẵng', value: 'Đà Nẵng' },
          { label: 'Hải Phòng', value: 'Hải Phòng' },
          { label: 'Khác', value: 'Khác' },
          { label: 'Remote', value: 'Remote' },
        ])
      })
      .finally(() => setLoadingProvinces(false))
  }, [])

  const onFinish = async (values: SalaryFormValues) => {
    setLoading(true)
    try {
      const data = await predictSalaryApi({
        job_title: values.jobTitle,
        years_of_experience: exp,
        skill_set: values.skills ?? [],
        location: values.location || '',
        level: values.level,
      })
      setResult(data)
    } catch {
      notification.error({
        message: 'Không thể dự đoán lương',
        description: 'Kiểm tra DataAnalyticsService và API Gateway đang chạy.',
        duration: 3,
      })
    } finally {
      setLoading(false)
    }
  }

  const onTrendFinish = async (values: TrendFormValues) => {
    setTrendLoading(true)
    try {
      const data = await getTrendApi({
        skill_name: values.skillName,
        months: values.months,
      })
      setTrend(data)
    } catch {
      notification.error({
        message: 'Không thể tải dự báo xu hướng',
        description: 'Endpoint /api/v1/analytics/trend chưa trả về dữ liệu hợp lệ.',
        duration: 3,
      })
    } finally {
      setTrendLoading(false)
    }
  }

  const rangeText = result
    ? `${formatMoney(result.min_salary)} - ${formatMoney(result.max_salary)}`
    : '--'

  return (
    <div className="salary-page">
      <div className="salary-inner">

        <div className="salary-form-card">
          <div className="salary-form-card__heading">
            <h1 className="salary-form-card__title">AI Salary Predictor</h1>
            <p className="salary-form-card__desc">
              Nhập thông tin vị trí để nhận dự đoán lương từ Data Analytics Service qua API Gateway.
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            initialValues={{
              jobTitle: 'Frontend Developer',
              level: 'MIDDLE',
              skills: ['React', 'TypeScript'],
              location: 'Hồ Chí Minh',
            }}
          >
            <Form.Item
              label="Job Title"
              name="jobTitle"
              rules={[{ required: true, message: 'Nhập tên vị trí' }]}
            >
              <Input placeholder="e.g. Senior Frontend Developer" />
            </Form.Item>

            <Form.Item
              label="Level"
              name="level"
              rules={[{ required: true, message: 'Chọn cấp bậc' }]}
            >
              <Select placeholder="Select Level" options={LEVELS} />
            </Form.Item>

            <Form.Item name="experience" noStyle>
              <div>
                <div className="salary-form-card__exp-label">
                  <span>Years of Experience</span>
                  <span>{exp} {exp === 1 ? 'Year' : 'Years'}</span>
                </div>
                <Slider min={0} max={15} value={exp} onChange={setExp} />
                <div className="salary-form-card__exp-ticks">
                  <span>0</span><span>15+</span>
                </div>
              </div>
            </Form.Item>

            <Form.Item
              label="Core Skills"
              name="skills"
              style={{ marginTop: 16 }}
              rules={[{ required: true, message: 'Nhập ít nhất 1 kỹ năng' }]}
            >
              <Select
                mode="tags"
                placeholder="Select or add skills..."
                tokenSeparators={[',']}
                options={skillsList.map(s => ({ label: s.name, value: s.name }))}
              />
            </Form.Item>

            <Form.Item
              label="Location"
              name="location"
              rules={[{ required: true, message: 'Chọn địa điểm' }]}
            >
              <Select
                showSearch
                options={provinceOptions}
                placeholder="Chọn Tỉnh/Thành..."
                optionFilterProp="children"
                loading={loadingProvinces}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 8 }}>
              <Button className="salary-btn" htmlType="submit" loading={loading}>
                <span className="material-symbols-outlined">auto_awesome</span>
                Dự đoán lương
              </Button>
            </Form.Item>
          </Form>

          <div className="salary-trend-card">
            <div className="salary-trend-card__heading">
              <span className="material-symbols-outlined">trending_up</span>
              <strong>Skill Trend</strong>
            </div>
            <Form
              form={trendForm}
              className="salary-trend-card__form"
              onFinish={onTrendFinish}
              initialValues={{ skillName: 'React', months: 6 }}
            >
              <div className="salary-trend-card__inputs">
                <Form.Item name="skillName" rules={[{ required: true, message: 'Nhập kỹ năng' }]}>
                  <Input placeholder="React" />
                </Form.Item>
                <Form.Item name="months" rules={[{ required: true, message: 'Nhập số tháng' }]}>
                  <InputNumber min={1} max={24} />
                </Form.Item>
              </div>
              <Button htmlType="submit" loading={trendLoading}>
                Xem xu hướng
              </Button>
            </Form>

            {trend && (
              <div className="salary-trend-card__list">
                {trend.forecast.slice(0, 4).map(item => (
                  <div key={`${item.year}-${item.month}`}>
                    <span>{item.month}/{item.year}</span>
                    <strong>{item.job_count} jobs</strong>
                    <em>{formatMoney(item.avg_salary)}M</em>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="salary-result-col">
          <div className="salary-glass">
            <div className="salary-glass__content">

              <div className="salary-glass__badge">
                <span className="material-symbols-outlined">insights</span>
                <span>{result ? `AI Prediction ${result.model_version}` : 'AI Prediction'}</span>
              </div>

              <p className="salary-glass__label">Estimated Monthly Salary</p>
              <div className="salary-glass__value">
                {rangeText} <span>Triệu VND</span>
              </div>

              {!result && (
                <div className="salary-glass__empty">
                  Điền form bên trái và bấm Dự đoán lương để lấy kết quả thật từ dịch vụ AI.
                </div>
              )}

              {result && (
                <>
                  <div className="salary-glass__range-labels">
                    <span>Min ({formatMoney(result.min_salary)}M)</span>
                    <span>Max ({formatMoney(result.max_salary)}M)</span>
                  </div>
                  <div className="salary-glass__bar-wrap">
                    <div className="salary-glass__bar-base" />
                    <div className="salary-glass__bar-predict" />
                    <div className="salary-glass__bar-marker" />
                  </div>

                  <div className="salary-glass__metrics">
                    <div>
                      <p className="salary-glass__metric-label">Model Confidence</p>
                      <p className="salary-glass__metric-value">{formatConfidence(result.confidence)}</p>
                    </div>
                    <div>
                      <p className="salary-glass__metric-label">Response Source</p>
                      <p className="salary-glass__metric-value">{result.from_cache ? 'Cache' : 'Model'}</p>
                    </div>
                  </div>

                  <div className="salary-glass__status">
                    <span className="dot" />
                    DataAnalyticsService responded via API Gateway
                  </div>
                </>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default SalaryPredictorPage
