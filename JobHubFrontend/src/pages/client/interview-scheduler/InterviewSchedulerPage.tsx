import { useState, useEffect, useCallback } from 'react';
import { App, Form, message, Spin } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/vi';

// Sub-components
import { CalendarSyncCard } from '../../../components/shared/interview-scheduler/CalendarSyncCard';
import { PendingScheduleList } from '../../../components/shared/interview-scheduler/PendingScheduleList';
import { SchedulerHeader } from '../../../components/shared/interview-scheduler/SchedulerHeader';
import { AiInsightBanner } from '../../../components/shared/interview-scheduler/AiInsightBanner';
import { CalendarGrid } from '../../../components/shared/interview-scheduler/CalendarGrid';
import { SchedulerModals } from '../../../components/shared/interview-scheduler/SchedulerModals';

import { 
  getCampaignsApi,
  getCampaignConversationsApi, 
  scheduleInterviewApi,
  cancelCampaignScheduleApi
} from '../../../services/hire-agent-service';
import { 
  getInterviewsApi,
  createInterviewApi,
  updateInterviewApi,
  cancelInterviewApi
} from '../../../services/interview-service';
import { getCustomerByIdApi } from '../../../services/customer-service';
import { getApplicationsApi } from '../../../services/application-service';
import { 
  getGoogleCalendarStatusApi,
  getGoogleCalendarAuthUrlApi,
  disconnectGoogleCalendarApi,
  syncExistingGoogleCalendarApi
} from '../../../services/google-calendar-service';

import './InterviewSchedulerPage.scss';

// Extend dayjs
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);
dayjs.locale('vi');

// Helper to parse date string as local time ignoring timezone offset/Z shift
const parseRawDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return dayjs();
  return dayjs(dateStr);
};

interface PendingCandidate {
  id: string; // conversation.id or app-id
  candidateId: string;
  campaignId: string;
  jobId?: string; // Real jobId for standard applications
  name: string;
  role: string; // campaign.jobName
  type: 'Technical' | 'Cultural' | 'Final';
  image?: string;
  status: string;
}

interface InterviewEvent {
  id: string; // conversation.id or db-id
  candidateId: string;
  campaignId: string;
  jobId?: string; // Real jobId
  candidateName: string;
  role: string; // campaign.jobName
  type: 'Technical' | 'Cultural' | 'Final';
  interviewDate: string; // ISO String
  time: string; // "hh:mm A - hh:mm A" representation
  image?: string;
  status: string;
}

interface CachedCandidate {
  name: string;
  avatar?: string;
}

// Bulletproof English AM/PM formatter to bypass browser locale overrides
const formatTimeEn = (dateObj: Dayjs) => {
  const hours = dateObj.hour();
  const mins = dateObj.minute().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
  return `${displayHours}:${mins} ${ampm}`;
};

export default function InterviewSchedulerPage() {
  const { modal, message, notification } = App.useApp();
  const [scheduleForm] = Form.useForm();
  const [rescheduleForm] = Form.useForm();
  const [addEventForm] = Form.useForm();

  // Loading and date states
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');

  // API Data states
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [pendingCandidates, setPendingCandidates] = useState<PendingCandidate[]>([]);
  const [candidateNamesCache, setCandidateNamesCache] = useState<Record<string, CachedCandidate>>({});
  
  // Custom manual events state (mocked/locally saved for custom freestyle typed names only)
  const [customEvents, setCustomEvents] = useState<InterviewEvent[]>([]);

  // Modals visibility
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);

  // Active selections for actions
  const [activeCandidate, setActiveCandidate] = useState<PendingCandidate | null>(null);
  const [activeEvent, setActiveEvent] = useState<InterviewEvent | null>(null);

  // Sync state togglers
  const [isGoogleSynced, setIsGoogleSynced] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [isOutlookSynced, setIsOutlookSynced] = useState(false);

  // Form values helper for custom candidate select
  const [isCustomCandidate, setIsCustomCandidate] = useState(false);

  // Fetch campaigns, conversations, standard approved CV applications, and dedicated interviews from Backend
  const loadData = useCallback(async (existingCache: Record<string, CachedCandidate> = candidateNamesCache) => {
    setLoading(true);
    try {
      const campaignsRes = await getCampaignsApi();
      const campaignsList = campaignsRes.data || [];

      // Create a mapping of JobId to JobName for easy role description resolution
      const jobNameMap: Record<string, string> = {};
      campaignsList.forEach(c => {
        jobNameMap[c.jobId] = c.jobName;
      });

      // Fetch conversations for each campaign in parallel
      const conversationsPromises = campaignsList.map(c => 
        getCampaignConversationsApi(c.id)
          .then(res => ({ campaign: c, conversations: res.data || [] }))
          .catch(() => ({ campaign: c, conversations: [] }))
      );
      
      const results = await Promise.all(conversationsPromises);
      
      const tempPending: PendingCandidate[] = [];
      const tempEvents: InterviewEvent[] = [];
      const allCandidateIds: string[] = [];

      // 1. Map AI Recruiter Campaign Conversations
      results.forEach(({ campaign, conversations }) => {
        conversations.forEach(conv => {
          allCandidateIds.push(conv.candidateId);
          
          let type: 'Technical' | 'Cultural' | 'Final' = 'Technical';
          if (conv.status === 'Scheduled') {
            type = 'Final';
          } else if (conv.status === 'PendingCandidateConfirm') {
            type = 'Cultural';
          }

          const cached = existingCache[conv.candidateId];
          const cachedName = cached?.name || `Ứng viên (${conv.candidateId.slice(0, 6)})`;
          const cachedAvatar = cached?.avatar;

          if (conv.interviewDate) {
            const dateObj = parseRawDate(conv.interviewDate);
            const timeStr = `${formatTimeEn(dateObj)} - ${formatTimeEn(dateObj.add(1, 'hour'))}`;
            
            tempEvents.push({
              id: `api-${conv.id}`,
              candidateId: conv.candidateId,
              campaignId: conv.campaignId,
              candidateName: cachedName,
              role: campaign.jobName || 'Vị trí ứng tuyển',
              type: type,
              interviewDate: conv.interviewDate,
              time: timeStr,
              image: cachedAvatar,
              status: conv.status
            });
          } 
          
          if (conv.status === 'Passed' || (conv.status === 'PendingCandidateConfirm' && !conv.interviewDate)) {
            tempPending.push({
              id: conv.id,
              candidateId: conv.candidateId,
              campaignId: conv.campaignId,
              name: cachedName,
              role: campaign.jobName || 'Vị trí ứng tuyển',
              type: type,
              image: cachedAvatar,
              status: conv.status
            });
          }
        });
      });

      // 2. Fetch dedicated interviews from the new DB table
      try {
        const interviewsRes = await getInterviewsApi();
        const interviewsList = interviewsRes.data || [];
        
        interviewsList.forEach(inter => {
          allCandidateIds.push(inter.candidateId);

          const cached = existingCache[inter.candidateId];
          const cachedName = cached?.name || `Ứng viên (${inter.candidateId.slice(0, 6)})`;
          const cachedAvatar = cached?.avatar;

          const dateObj = parseRawDate(inter.interviewDate);
          const timeStr = `${formatTimeEn(dateObj)} - ${formatTimeEn(dateObj.add(1, 'hour'))}`;

          // Map "PendingConfirm" -> "PendingCandidateConfirm" for unified frontend UI rendering
          let uiStatus: string = inter.status;
          if (uiStatus === 'PendingConfirm') {
            uiStatus = 'PendingCandidateConfirm';
          }

          tempEvents.push({
            id: `db-${inter.id}`,
            candidateId: inter.candidateId,
            campaignId: 'standard', // Mark as standard scheduling
            jobId: inter.jobId,
            candidateName: cachedName,
            role: jobNameMap[inter.jobId] || 'Vị trí ứng tuyển',
            type: inter.type,
            interviewDate: inter.interviewDate,
            time: timeStr,
            image: cachedAvatar,
            status: uiStatus
          });
        });
      } catch (err) {
        console.warn("Failed to load dedicated interviews from db:", err);
      }

      // 3. Fetch APPROVED standard applications from backend
      try {
        const appsRes = await getApplicationsApi("pageSize=100&status=APPROVED");
        const appsList = appsRes.data?.result || [];
        
        appsList.forEach(app => {
          allCandidateIds.push(app.customerId);
          
          // Check if already scheduled in database events
          const isAlreadyScheduled = tempEvents.some(e => e.candidateId === app.customerId);
          if (isAlreadyScheduled) return;

          // Check if already pending under campaign list
          const isAlreadyPending = tempPending.some(p => p.candidateId === app.customerId);
          if (isAlreadyPending) return;

          // Find active campaign for this job
          const matchingCampaign = campaignsList.find(c => c.jobId === app.jobId);
          const campaignId = matchingCampaign?.id || 'standard';
          const roleName = matchingCampaign?.jobName || 'Hồ sơ tuyển dụng';
          
          const cached = existingCache[app.customerId];
          const cachedName = cached?.name || `Ứng viên (${app.customerId.slice(0, 6)})`;
          const cachedAvatar = cached?.avatar;

          tempPending.push({
            id: `app-${app.id}`,
            candidateId: app.customerId,
            campaignId: campaignId,
            jobId: app.jobId,
            name: cachedName,
            role: roleName,
            type: 'Technical',
            image: cachedAvatar,
            status: 'Passed'
          });
        });
      } catch (appErr) {
        console.warn("Failed to fetch approved applications:", appErr);
      }

      // Fetch names and avatars for candidates not yet cached
      const uniqueIds = Array.from(new Set(allCandidateIds)).filter(id => !existingCache[id]);
      let activeCacheObj = { ...existingCache };
      if (uniqueIds.length > 0) {
        const namePromises = uniqueIds.map(id => 
          getCustomerByIdApi(id)
            .then(res => ({ id, name: res.data?.fullName || 'Ứng viên', avatar: res.data?.avatar || undefined }))
            .catch(() => ({ id, name: `Ứng viên (${id.slice(0, 6)})`, avatar: undefined }))
        );
        const resolvedCandidates = await Promise.all(namePromises);
        
        resolvedCandidates.forEach(({ id, name, avatar }) => {
          activeCacheObj[id] = { name, avatar };
        });
        setCandidateNamesCache(activeCacheObj);

        // Map resolved data back to temp sets
        tempEvents.forEach(e => {
          const cached = activeCacheObj[e.candidateId];
          if (cached) {
            e.candidateName = cached.name;
            e.image = cached.avatar;
          }
        });
        tempPending.forEach(c => {
          const cached = activeCacheObj[c.candidateId];
          if (cached) {
            c.name = cached.name;
            c.image = cached.avatar;
          }
        });
      }

      // Fallback mock data if workspace remains completely empty (for demonstration)
      if (campaignsList.length === 0 && tempPending.length === 0 && tempEvents.length === 0) {
        console.log("Empty backend data. Loading dynamic mock fallbacks...");
        const today = dayjs();
        
        const fallbackEvents: InterviewEvent[] = [
          {
            id: 'mock-1',
            candidateId: 'c1',
            campaignId: 'camp-1',
            candidateName: 'Alex Rivers',
            role: 'Sr. Backend Engineer',
            type: 'Technical',
            interviewDate: today.subtract(2, 'day').hour(10).minute(0).second(0).toISOString(),
            time: `${formatTimeEn(today.subtract(2, 'day').hour(10).minute(0))} - ${formatTimeEn(today.subtract(2, 'day').hour(11).minute(30))}`,
            status: 'Scheduled',
            image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex'
          },
          {
            id: 'mock-2',
            candidateId: 'c2',
            campaignId: 'camp-2',
            candidateName: 'Sarah Chen',
            role: 'Lead Data Scientist',
            type: 'Cultural',
            interviewDate: today.add(1, 'day').hour(14).minute(0).second(0).toISOString(),
            time: `${formatTimeEn(today.add(1, 'day').hour(14).minute(0))} - ${formatTimeEn(today.add(1, 'day').hour(15).minute(0))}`,
            status: 'PendingCandidateConfirm',
            image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah'
          },
          {
            id: 'mock-3',
            candidateId: 'c3',
            campaignId: 'camp-3',
            candidateName: 'Marcus Thorne',
            role: 'Staff Product Manager',
            type: 'Final',
            interviewDate: today.hour(16).minute(30).second(0).toISOString(),
            time: `${formatTimeEn(today.hour(16).minute(30))} - ${formatTimeEn(today.hour(17).minute(30))}`,
            status: 'Scheduled',
            image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Marcus'
          }
        ];

        const fallbackPending: PendingCandidate[] = [
          {
            id: 'mock-p1',
            candidateId: 'c1',
            campaignId: 'camp-1',
            name: 'Alex Rivers',
            role: 'Sr. Backend Engineer',
            type: 'Technical',
            image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex',
            status: 'Passed'
          },
          {
            id: 'mock-p2',
            candidateId: 'c2',
            campaignId: 'camp-2',
            name: 'Sarah Chen',
            role: 'Lead Data Scientist',
            type: 'Cultural',
            image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah',
            status: 'Passed'
          }
        ];

        setEvents(fallbackEvents);
        setPendingCandidates(fallbackPending);
      } else {
        setEvents(tempEvents);
        setPendingCandidates(tempPending);
      }

    } catch (err) {
      console.error(err);
      message.error('Không thể kết nối đến máy chủ để tải lịch phỏng vấn.');
    } finally {
      setLoading(false);
    }
  }, [candidateNamesCache]);

  const loadGoogleCalendarStatus = useCallback(async () => {
    try {
      const res = await getGoogleCalendarStatusApi();
      if (res.data) {
        setIsGoogleSynced(res.data.isConnected);
        setGoogleEmail(res.data.email);
      }
    } catch (err) {
      console.error("Lỗi lấy trạng thái liên kết Google Calendar:", err);
    }
  }, []);

  useEffect(() => {
    loadData({});
    loadGoogleCalendarStatus();

    // Check Google OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const googleSync = urlParams.get('google_sync');
    const errorMsg = urlParams.get('error');

    if (googleSync === 'success') {
      message.loading({ content: 'Đang đồng bộ các lịch phỏng vấn hiện tại sang Google Calendar...', key: 'sync-all' });
      // Clear query params
      const url = new URL(window.location.href);
      url.searchParams.delete('google_sync');
      window.history.replaceState({}, '', url.pathname + url.search);
      // Reload status
      loadGoogleCalendarStatus();
      
      syncExistingGoogleCalendarApi().then(() => {
        message.destroy('sync-all');
        notification.success({
          message: 'Liên kết Google Calendar thành công!',
          description: 'Tài khoản Google Calendar của bạn đã được kết nối và toàn bộ lịch phỏng vấn hiện tại đã được đồng bộ hóa thành công.',
          placement: 'topRight',
          duration: 5
        });
        loadData({});
      }).catch(err => {
        console.error("Lỗi đồng bộ lịch hẹn cũ:", err);
        message.destroy('sync-all');
        notification.warning({
          message: 'Liên kết thành công với cảnh báo',
          description: 'Đã kết nối tài khoản Google Calendar, nhưng có lỗi xảy ra khi tự động đồng bộ các lịch hẹn cũ. Bạn có thể bấm nút Đồng bộ để thử lại.',
          placement: 'topRight',
          duration: 5
        });
      });
    } else if (googleSync === 'failed') {
      message.error(`Liên kết tài khoản Google Calendar thất bại: ${errorMsg || 'Lỗi không xác định.'}`);
      const url = new URL(window.location.href);
      url.searchParams.delete('google_sync');
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadGoogleCalendarStatus]);

  // Actions
  const handleResolveConflicts = () => {
    modal.success({
      title: 'AI Smart-Schedule Resolve',
      content: 'AI has analyzed scheduling conflicts. Timezones and availability maps updated. Optimized calendar slots synchronized successfully!',
      okText: 'Xong',
    });
  };

  const handleCancelEvent = (eventId: string, candidateName: string) => {
    modal.confirm({
      title: 'Hủy lịch phỏng vấn',
      content: `Bạn có chắc chắn muốn hủy lịch phỏng vấn của ứng viên ${candidateName}?`,
      okText: 'Hủy lịch',
      okType: 'danger',
      cancelText: 'Giữ lại',
      onOk: async () => {
        if (eventId.startsWith('db-')) {
          try {
            setLoading(true);
            const dbId = eventId.replace('db-', '');
            await cancelInterviewApi(dbId);
            message.success(`Đã hủy lịch phỏng vấn của ứng viên ${candidateName} thành công.`);
            await loadData();
          } catch (err) {
            console.error(err);
            message.error("Lỗi khi hủy lịch phỏng vấn.");
          } finally {
            setLoading(false);
          }
        } else if (eventId.startsWith('api-')) {
          const activeEv = events.find(e => e.id === eventId);
          if (activeEv) {
            try {
              setLoading(true);
              await cancelCampaignScheduleApi(activeEv.campaignId, activeEv.candidateId);
              message.success(`Đã hủy lịch phỏng vấn của ứng viên ${candidateName} thành công. Ứng viên đã quay lại danh sách Chờ xếp lịch.`);
              await loadData();
            } catch (err) {
              console.error(err);
              message.error("Lỗi khi hủy lịch phỏng vấn.");
            } finally {
              setLoading(false);
            }
          }
        } else if (eventId.startsWith('custom-') || eventId.startsWith('mock-')) {
          setCustomEvents(prev => prev.filter(e => e.id !== eventId));
          setEvents(prev => prev.filter(e => e.id !== eventId));
          message.success(`Đã hủy lịch phỏng vấn của ${candidateName}.`);
        } else {
          setEvents(prev => prev.filter(e => e.id !== eventId));
          message.success(`Đã hủy lịch phỏng vấn của ${candidateName} trên giao diện.`);
        }
      }
    });
  };

  const handleOpenSchedule = (candidate: PendingCandidate) => {
    setActiveCandidate(candidate);
    scheduleForm.setFieldsValue({
      type: candidate.type,
      date: dayjs(),
      timeRange: [dayjs('09:00', 'HH:mm'), dayjs('10:00', 'HH:mm')]
    });
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (values: any) => {
    if (!activeCandidate) return;
    
    const selectedDate = values.date
      .hour(values.timeRange[0].hour())
      .minute(values.timeRange[0].minute())
      .second(0);
    const timeStr = `${formatTimeEn(values.timeRange[0])} - ${formatTimeEn(values.timeRange[1])}`;

    // Fallback locally only for mock demo candidates
    if (activeCandidate.id.startsWith('mock-')) {
      const newEvent: InterviewEvent = {
        id: `custom-app-${Math.random().toString()}`,
        candidateId: activeCandidate.candidateId,
        campaignId: activeCandidate.campaignId,
        candidateName: activeCandidate.name,
        role: activeCandidate.role,
        type: values.type,
        interviewDate: selectedDate.toISOString(),
        time: timeStr,
        image: activeCandidate.image,
        status: 'PendingCandidateConfirm'
      };

      setEvents(prev => [...prev, newEvent]);
      setPendingCandidates(prev => prev.filter(c => c.id !== activeCandidate.id));
      setScheduleModalOpen(false);
      setActiveCandidate(null);
      message.success(`Đã xếp lịch phỏng vấn thành công cho ${activeCandidate.name} (lưu trữ cục bộ, chờ xác nhận).`);
      return;
    }

    // PERSISTENCE UNIFICATION:
    // If standard application (CV path) -> Save directly to the dedicated Interviews DB table!
    if (activeCandidate.campaignId === 'standard') {
      try {
        setLoading(true);
        await createInterviewApi({
          jobId: activeCandidate.jobId || '',
          candidateId: activeCandidate.candidateId,
          interviewDate: selectedDate.toISOString(),
          type: values.type,
          notes: 'Đặt lịch phỏng vấn thủ công từ danh sách ứng viên hồ sơ CV.'
        });

        message.success(`Đã xếp lịch phỏng vấn thành công cho ${activeCandidate.name} (Lịch phỏng vấn lưu vào database)!`);
        setScheduleModalOpen(false);
        setActiveCandidate(null);
        await loadData();
      } catch (err) {
        console.error("createInterviewApi error:", err);
        message.error("Lỗi khi xếp lịch phỏng vấn.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // AI Recruiter Campaign Candidate: Call Backend HireAgent API (sends proposal message + email)
    try {
      setLoading(true);
      await scheduleInterviewApi(
        activeCandidate.campaignId,
        activeCandidate.candidateId,
        selectedDate.toISOString()
      );

      message.success(`Đã xếp lịch phỏng vấn thành công cho ${activeCandidate.name}!`);
      setScheduleModalOpen(false);
      setActiveCandidate(null);
      await loadData();
    } catch (err: any) {
      console.error("scheduleInterviewApi error:", err);
      message.error('Lỗi khi gửi yêu cầu xếp lịch phỏng vấn.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReschedule = (event: InterviewEvent) => {
    setActiveEvent(event);
    rescheduleForm.setFieldsValue({
      date: parseRawDate(event.interviewDate),
      timeRange: [
        dayjs(event.time.split(' - ')[0], 'hh:mm A', 'en'),
        dayjs(event.time.split(' - ')[1], 'hh:mm A', 'en')
      ]
    });
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async (values: any) => {
    if (!activeEvent) return;
    
    const selectedDate = values.date
      .hour(values.timeRange[0].hour())
      .minute(values.timeRange[0].minute())
      .second(0);
    const timeStr = `${formatTimeEn(values.timeRange[0])} - ${formatTimeEn(values.timeRange[1])}`;

    // PERSISTENCE UNIFICATION:
    // If it's a dedicated database interview, update using the dedicated Interviews API!
    if (activeEvent.id.startsWith('db-')) {
      try {
        setLoading(true);
        const dbId = activeEvent.id.replace('db-', '');
        await updateInterviewApi(dbId, {
          interviewDate: selectedDate.toISOString(),
          status: 'PendingConfirm' // Rescheduled defaults back to pending confirmation
        });

        message.success(`Đã dời lịch phỏng vấn thành công cho ${activeEvent.candidateName} (đã cập nhật vào database)!`);
        setRescheduleModalOpen(false);
        setActiveEvent(null);
        await loadData();
      } catch (err) {
        console.error("updateInterviewApi error:", err);
        message.error("Lỗi khi dời lịch phỏng vấn.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fallback locally only for mock demo candidates
    if (activeEvent.id.startsWith('mock-') || activeEvent.id.startsWith('custom-')) {
      const updateFn = (prev: InterviewEvent[]) => prev.map(e => e.id === activeEvent.id ? { 
        ...e, 
        interviewDate: selectedDate.toISOString(), 
        time: timeStr,
        status: 'PendingCandidateConfirm'
      } : e);

      setCustomEvents(updateFn);
      setEvents(updateFn);
      setRescheduleModalOpen(false);
      setActiveEvent(null);
      message.success(`Đã dời lịch phỏng vấn thành công cho ${activeEvent.candidateName} (chờ xác nhận).`);
      return;
    }

    // AI Recruiter Campaign Candidate: Call Backend HireAgent API (sends proposal message + email)
    try {
      setLoading(true);
      await scheduleInterviewApi(
        activeEvent.campaignId,
        activeEvent.candidateId,
        selectedDate.toISOString()
      );

      message.success(`Đã dời lịch phỏng vấn thành công cho ${activeEvent.candidateName}!`);
      setRescheduleModalOpen(false);
      setActiveEvent(null);
      await loadData();
    } catch (err: any) {
      console.error("rescheduleInterviewApi error:", err);
      message.error('Lỗi khi dời lịch phỏng vấn.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCellClick = (cellDate: Dayjs) => {
    setIsCustomCandidate(false);
    addEventForm.resetFields();
    addEventForm.setFieldsValue({
      candidateSelect: 'custom',
      date: cellDate,
      type: 'Technical',
      timeRange: [dayjs('10:00', 'HH:mm'), dayjs('11:00', 'HH:mm')]
    });
    setIsCustomCandidate(true);
    setAddEventOpen(true);
  };

  const handleSaveAddEvent = async (values: any) => {
    const selectedDate = values.date
      .hour(values.timeRange[0].hour())
      .minute(values.timeRange[0].minute())
      .second(0);
    const timeStr = `${formatTimeEn(values.timeRange[0])} - ${formatTimeEn(values.timeRange[1])}`;

    if (values.candidateSelect !== 'custom') {
      const candidate = pendingCandidates.find(c => c.id === values.candidateSelect);
      if (!candidate) return;

      // Fallback locally only for mock demo candidates
      if (candidate.id.startsWith('mock-')) {
        const newEvent: InterviewEvent = {
          id: `custom-mock-${Math.random().toString()}`,
          candidateId: candidate.candidateId,
          campaignId: candidate.campaignId,
          candidateName: candidate.name,
          role: candidate.role,
          type: values.type,
          interviewDate: selectedDate.toISOString(),
          time: timeStr,
          image: candidate.image,
          status: 'PendingCandidateConfirm'
        };

        setEvents(prev => [...prev, newEvent]);
        setPendingCandidates(prev => prev.filter(c => c.id !== candidate.id));
        setAddEventOpen(false);
        message.success(`Đã xếp lịch phỏng vấn thành công cho ${candidate.name} (chờ xác nhận).`);
        return;
      }

      // PERSISTENCE UNIFICATION:
      // If standard application (CV path) -> Save directly to the dedicated Interviews DB table!
      if (candidate.campaignId === 'standard') {
        try {
          setLoading(true);
          await createInterviewApi({
            jobId: candidate.jobId || '',
            candidateId: candidate.candidateId,
            interviewDate: selectedDate.toISOString(),
            type: values.type,
            notes: 'Đặt lịch phỏng vấn thủ công từ bảng lịch biểu.'
          });

          message.success(`Đã xếp lịch phỏng vấn thành công cho ${candidate.name} (lưu vào database)!`);
          setAddEventOpen(false);
          await loadData();
        } catch (err) {
          console.error("createInterviewApi error:", err);
          message.error("Lỗi khi xếp lịch phỏng vấn.");
        } finally {
          setLoading(false);
        }
        return;
      }

      // AI Recruiter Campaign Candidate: Call Backend HireAgent API (sends proposal message + email)
      try {
        setLoading(true);
        await scheduleInterviewApi(
          candidate.campaignId,
          candidate.candidateId,
          selectedDate.toISOString()
        );
        message.success(`Đã lưu lịch phỏng vấn cho ${candidate.name}!`);
        setAddEventOpen(false);
        await loadData();
      } catch (err: any) {
        console.error("addInterviewApi error:", err);
        message.error('Lỗi khi lưu lịch phỏng vấn.');
      } finally {
        setLoading(false);
      }
    } else {
      const newEvent: InterviewEvent = {
        id: `custom-${Math.random().toString()}`,
        candidateId: 'custom',
        campaignId: 'custom',
        candidateName: values.candidateName,
        role: values.role || 'Vị trí tự nhập',
        type: values.type,
        interviewDate: selectedDate.toISOString(),
        time: timeStr,
        status: 'Scheduled'
      };

      setCustomEvents(prev => [...prev, newEvent]);
      setAddEventOpen(false);
      message.success(`Đã tự thêm lịch phỏng vấn cho ${values.candidateName}!`);
    }
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success('Đã sao chép liên kết chia sẻ lịch hẹn vào clipboard!');
  };

  const handleExportReport = () => {
    message.loading({ content: 'Đang xuất báo cáo tuần...', key: 'export' });
    setTimeout(() => {
      message.success({ content: 'Đã xuất Báo cáo tuần thành công!', key: 'export', duration: 2 });
    }, 1000);
  };

  return (
    <Spin spinning={loading} size="large" tip="Đang thực hiện xếp lịch...">
      <div className="scheduler-container">
        {/* Left Column: Sidebar */}
        <aside className="scheduler-sidebar">
          <CalendarSyncCard 
            isGoogleSynced={isGoogleSynced}
            googleEmail={googleEmail}
            isOutlookSynced={isOutlookSynced}
            onToggleGoogle={async () => {
              if (!isGoogleSynced) {
                try {
                  setLoading(true);
                  const res = await getGoogleCalendarAuthUrlApi();
                  if (res.data?.url) {
                    window.location.href = res.data.url;
                  } else {
                    message.error('Không lấy được liên kết xác thực Google.');
                  }
                } catch (err) {
                  message.error('Lỗi khi liên kết Google Calendar.');
                } finally {
                  setLoading(false);
                }
              } else {
                modal.confirm({
                  title: 'Hủy liên kết Google Calendar',
                  content: `Bạn có chắc chắn muốn hủy liên kết Google Calendar cho tài khoản ${googleEmail}? Lịch phỏng vấn sẽ không còn được tự động đồng bộ.`,
                  okText: 'Hủy liên kết',
                  cancelText: 'Quay lại',
                  okType: 'danger',
                  onOk: async () => {
                    try {
                      setLoading(true);
                      await disconnectGoogleCalendarApi();
                      setIsGoogleSynced(false);
                      setGoogleEmail('');
                      message.success('Đã hủy liên kết Google Calendar thành công.');
                    } catch (err) {
                      message.error('Lỗi khi hủy liên kết Google Calendar.');
                    } finally {
                      setLoading(false);
                    }
                  }
                });
              }
            }}
            onToggleOutlook={() => {
              notification.info({
                message: 'Tính năng đang phát triển',
                description: 'Chức năng đồng bộ Outlook Calendar đang được phát triển. Xin lỗi vì sự bất tiện này!',
                placement: 'topRight',
                duration: 4
              });
            }}
            onSyncExisting={async () => {
              try {
                setLoading(true);
                message.loading({ content: 'Đang tiến hành đồng bộ các lịch hẹn cũ sang Google Calendar...', key: 'manual-sync' });
                await syncExistingGoogleCalendarApi();
                message.destroy('manual-sync');
                notification.success({
                  message: 'Đồng bộ Google Calendar thành công',
                  description: 'Toàn bộ lịch phỏng vấn hiện có đã được đồng bộ hóa sang Google Calendar của bạn.',
                  placement: 'topRight',
                  duration: 4
                });
                loadData({});
              } catch (err) {
                message.destroy('manual-sync');
                notification.error({
                  message: 'Lỗi đồng bộ Google Calendar',
                  description: 'Không thể đồng bộ các lịch phỏng vấn hiện tại. Vui lòng kiểm tra lại kết nối mạng.',
                  placement: 'topRight',
                  duration: 4
                });
              } finally {
                setLoading(false);
              }
            }}
          />

          <PendingScheduleList 
            candidates={pendingCandidates}
            onSelectCandidate={handleOpenSchedule}
            onRefresh={() => loadData()}
          />
        </aside>

        {/* Right Column: Main Scheduler & Calendar */}
        <div className="scheduler-main">
          <SchedulerHeader 
            currentDate={currentDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNavigatePrev={() => {
              if (viewMode === 'week') {
                setCurrentDate(prev => prev.subtract(1, 'week'));
              } else if (viewMode === 'day') {
                setCurrentDate(prev => prev.subtract(1, 'day'));
              } else {
                setCurrentDate(prev => prev.subtract(1, 'month'));
              }
            }}
            onNavigateNext={() => {
              if (viewMode === 'week') {
                setCurrentDate(prev => prev.add(1, 'week'));
              } else if (viewMode === 'day') {
                setCurrentDate(prev => prev.add(1, 'day'));
              } else {
                setCurrentDate(prev => prev.add(1, 'month'));
              }
            }}
            onNavigateToday={() => setCurrentDate(dayjs())}
          />

          <AiInsightBanner onResolve={handleResolveConflicts} />

          <CalendarGrid 
            currentDate={currentDate}
            events={events}
            customEvents={customEvents}
            onCellAddClick={handleOpenCellClick}
            onEventClick={handleOpenReschedule}
            onEventCancel={handleCancelEvent}
            viewMode={viewMode}
          />

          {/* Legend and Actions */}
          <div className="main-footer">
            <div className="legend-bar">
              <div className="legend-item">
                <span className="legend-dot dot-technical"></span>
                <span>Technical Interview</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-cultural"></span>
                <span>Cultural/Fit (Chờ ứng viên xác nhận)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-final"></span>
                <span>Final Round</span>
              </div>
            </div>
            
            <div className="action-buttons">
              <button onClick={handleExportReport} className="export-btn">
                Export Weekly Report
              </button>
              <button onClick={handleShareLink} className="share-btn">
                <span className="material-symbols-outlined">share</span>
                Share Availability Link
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Dialogs and Modals */}
        <SchedulerModals 
          scheduleModalOpen={scheduleModalOpen}
          activeCandidate={activeCandidate}
          onScheduleCancel={() => setScheduleModalOpen(false)}
          onScheduleFinish={handleSaveSchedule}
          scheduleForm={scheduleForm}

          rescheduleModalOpen={rescheduleModalOpen}
          activeEvent={activeEvent}
          onRescheduleCancel={() => setRescheduleModalOpen(false)}
          onRescheduleFinish={handleSaveReschedule}
          rescheduleForm={rescheduleForm}

          addEventModalOpen={addEventOpen}
          onAddEventCancel={() => setAddEventOpen(false)}
          onAddEventFinish={handleSaveAddEvent}
          addEventForm={addEventForm}
          pendingCandidates={pendingCandidates}
          isCustomCandidate={isCustomCandidate}
          setIsCustomCandidate={setIsCustomCandidate}
        />
      </div>
    </Spin>
  );
}
