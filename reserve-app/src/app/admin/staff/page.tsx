'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Button from '@/components/Button';
import {
  AddStaffModal,
  EditStaffModal,
  DeleteStaffDialog,
  ShiftSettingModal,
  StaffSearchBar,
  StaffList,
  DAY_OF_WEEK_MAP,
  DAYS,
} from '@/components/admin/staff';
import type {
  Staff,
  StaffFormData,
  ShiftData,
  ShiftFormData,
  VacationFormData,
} from '@/components/admin/staff';

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // モーダル・ダイアログの状態
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // フォームデータ
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    email: '',
    phone: '',
    role: '',
  });

  // シフト設定データ
  const [shiftFormData, setShiftFormData] = useState<ShiftFormData>({});
  const [vacationFormData, setVacationFormData] = useState<VacationFormData>({
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [activeTab, setActiveTab] = useState<'shift' | 'vacation'>('shift');

  // 検索
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const url = searchQuery
        ? `/api/admin/staff?search=${encodeURIComponent(searchQuery)}`
        : '/api/admin/staff';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setStaff(result.data);
        setError(null);
      } else {
        setError(result.error?.message || result.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Staff fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    setFormData({ name: '', email: '', phone: '', role: '' });
    setShowAddModal(true);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone || '',
      role: staffMember.role || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setShowDeleteDialog(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteDialog(false);
    setShowShiftModal(false);
    setSelectedStaff(null);
    setFormData({ name: '', email: '', phone: '', role: '' });
    setShiftFormData({});
    setVacationFormData({ startDate: '', endDate: '', reason: '' });
    setActiveTab('shift');
  };

  const handleShiftSetting = async (staffMember: Staff) => {
    setSelectedStaff(staffMember);

    const initialShiftData: ShiftFormData = {};
    DAYS.forEach(day => {
      initialShiftData[day] = {
        enabled: false,
        startTime: '09:00',
        endTime: '18:00',
      };
    });

    try {
      const response = await fetch(`/api/admin/staff/${staffMember.id}/shifts`);
      const result = await response.json();

      if (result.success && result.data.length > 0) {
        result.data.forEach((shift: ShiftData) => {
          const dayName = Object.keys(DAY_OF_WEEK_MAP).find(
            key => DAY_OF_WEEK_MAP[key] === shift.dayOfWeek
          );
          if (dayName) {
            initialShiftData[dayName] = {
              enabled: shift.isActive,
              startTime: shift.startTime,
              endTime: shift.endTime,
            };
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
    }

    setShiftFormData(initialShiftData);
    setShowShiftModal(true);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const submitShiftSetting = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!selectedStaff) { return; }

      const shifts: ShiftData[] = [];
      Object.entries(shiftFormData).forEach(([day, data]) => {
        if (data.enabled) {
          const dayOfWeek = DAY_OF_WEEK_MAP[day];
          if (dayOfWeek) {
            const startMinutes = timeToMinutes(data.startTime);
            const endMinutes = timeToMinutes(data.endTime);

            if (endMinutes <= startMinutes) {
              setError('退勤時間は出勤時間より後である必要があります');
              return;
            }

            shifts.push({
              dayOfWeek,
              startTime: data.startTime,
              endTime: data.endTime,
              isActive: true,
            });
          }
        }
      });

      if (shifts.length === 0) {
        setError('少なくとも1つのシフトを設定してください');
        return;
      }

      const response = await fetch(`/api/admin/staff/${selectedStaff.id}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shifts }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('シフトを保存しました');
        closeModals();
      } else {
        setError(result.error?.message || result.error || 'シフトの保存に失敗しました');
      }
    } catch (err) {
      setError('シフトの保存に失敗しました');
      console.error('Submit shift error:', err);
    }
  };

  const submitVacationSetting = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!selectedStaff) { return; }

      if (!vacationFormData.startDate || !vacationFormData.endDate) {
        setError('休暇期間を入力してください');
        return;
      }

      const response = await fetch(`/api/admin/staff/${selectedStaff.id}/vacations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vacationFormData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('休暇を設定しました');
        closeModals();
      } else {
        setError(result.error?.message || result.error || '休暇の設定に失敗しました');
      }
    } catch (err) {
      setError('休暇の設定に失敗しました');
      console.error('Submit vacation error:', err);
    }
  };

  const submitAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.name || !formData.email) {
        setError('名前とメールアドレスは必須です');
        return;
      }

      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('スタッフを追加しました');
        closeModals();
        fetchStaff();
      } else {
        setError(result.error?.message || result.error || 'スタッフの追加に失敗しました');
      }
    } catch (err) {
      setError('スタッフの追加に失敗しました');
      console.error('Add staff error:', err);
    }
  };

  const submitEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!selectedStaff) { return; }

      const response = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('スタッフ情報を更新しました');
        closeModals();
        fetchStaff();
      } else {
        setError(result.error?.message || result.error || 'スタッフ情報の更新に失敗しました');
      }
    } catch (err) {
      setError('スタッフ情報の更新に失敗しました');
      console.error('Edit staff error:', err);
    }
  };

  const confirmDelete = async () => {
    try {
      if (!selectedStaff) { return; }

      const response = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('スタッフを削除しました');
        closeModals();
        fetchStaff();
      } else {
        setError(result.error?.message || result.error || 'スタッフの削除に失敗しました');
      }
    } catch (err) {
      setError('スタッフの削除に失敗しました');
      console.error('Delete staff error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="flex h-96 items-center justify-center">
            <div data-testid="loading-message" className="text-gray-500">読み込み中...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* ページヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">スタッフ管理</h1>
          <Button
            data-testid="add-staff-button"
            onClick={handleAddStaff}
            variant="primary"
            size="md"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            スタッフを追加
          </Button>
        </div>

        {/* 成功・エラーメッセージ */}
        {successMessage && (
          <div data-testid="success-message" className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
            {successMessage}
          </div>
        )}
        {error && (
          <div data-testid="error-message" className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* 検索バー */}
        <StaffSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* スタッフ一覧 */}
        <StaffList
          staff={staff}
          onEdit={handleEditStaff}
          onDelete={handleDeleteStaff}
          onShiftSetting={handleShiftSetting}
        />
      </main>

      {/* モーダル */}
      {showAddModal && (
        <AddStaffModal
          formData={formData}
          error={error}
          onFormChange={setFormData}
          onSubmit={submitAddStaff}
          onClose={closeModals}
        />
      )}

      {showEditModal && selectedStaff && (
        <EditStaffModal
          formData={formData}
          onFormChange={setFormData}
          onSubmit={submitEditStaff}
          onClose={closeModals}
        />
      )}

      {showDeleteDialog && selectedStaff && (
        <DeleteStaffDialog
          staff={selectedStaff}
          onConfirm={confirmDelete}
          onClose={closeModals}
        />
      )}

      {showShiftModal && selectedStaff && (
        <ShiftSettingModal
          staff={selectedStaff}
          activeTab={activeTab}
          shiftFormData={shiftFormData}
          vacationFormData={vacationFormData}
          error={error}
          onTabChange={setActiveTab}
          onShiftFormChange={setShiftFormData}
          onVacationFormChange={setVacationFormData}
          onShiftSubmit={submitShiftSetting}
          onVacationSubmit={submitVacationSetting}
          onClose={closeModals}
        />
      )}
    </div>
  );
}
