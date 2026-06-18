import { MessageOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Timeline, Tag, Button, Modal, Form, Input, Select, DatePicker, Space, Popconfirm, message } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { FollowUpType, UserRole } from '../constants/enums';
import { statusText } from '../constants/enums';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';

const { TextArea } = Input;

interface FollowUpTimelineProps {
  followUps: FollowUp[];
  candidateId: number;
  onRefresh: () => void;
}

export default function FollowUpTimeline({ followUps, candidateId, onRefresh }: FollowUpTimelineProps) {
  const canEdit = useAuthStore((s) => s.can([UserRole.HR, UserRole.ADMIN, UserRole.HIRING_MANAGER]));
  const user = useAuthStore((s) => s.user);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FollowUp | null>(null);
  const [form] = Form.useForm();

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ contactedAt: dayjs() });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: FollowUp) => {
    setEditingItem(item);
    form.setFieldsValue({
      type: item.type,
      content: item.content,
      contactedAt: dayjs(item.contactedAt),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        candidateId,
        type: values.type,
        content: values.content,
        contactedAt: values.contactedAt.toISOString(),
      };
      if (editingItem) {
        await api.patch(`/follow-ups/${editingItem.id}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/follow-ups', payload);
        message.success('添加成功');
      }
      setModalOpen(false);
      onRefresh();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/follow-ups/${id}`);
      message.success('删除成功');
      onRefresh();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '删除失败');
    }
  };

  const canEditItem = (item: FollowUp) => {
    if (!user) return false;
    if (user.role === UserRole.HR || user.role === UserRole.ADMIN || user.role === UserRole.HIRING_MANAGER) return true;
    return item.createdById === user.id;
  };

  const typeTagColor = (type: FollowUpType) => {
    switch (type) {
      case FollowUpType.PHONE: return 'blue';
      case FollowUpType.EMAIL: return 'purple';
      case FollowUpType.WECHAT: return 'green';
      case FollowUpType.ONSITE: return 'orange';
      case FollowUpType.VIDEO: return 'cyan';
      default: return 'default';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 500 }}>沟通记录 {followUps.length > 0 && `(${followUps.length})`}</span>
        {canEdit && (
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            添加跟进
          </Button>
        )}
      </div>
      <Timeline
        items={followUps.map((item) => ({
          dot: <MessageOutlined />,
          children: (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <b>{statusText[item.type]}沟通</b>
                  <span style={{ marginLeft: 8, color: '#666', fontSize: 13 }}>
                    {dayjs(item.contactedAt).format('YYYY-MM-DD HH:mm')}
                  </span>
                  <Tag color={typeTagColor(item.type)} style={{ marginLeft: 8 }}>
                    {statusText[item.type]}
                  </Tag>
                  <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                    · {item.createdBy?.name || '未知'}
                  </span>
                </div>
                {canEditItem(item) && (
                  <Space size={4}>
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(item)} />
                    <Popconfirm title="确认删除该跟进记录?" onConfirm={() => handleDelete(item.id)} okText="删除" cancelText="取消">
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                )}
              </div>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: 4, marginBottom: 0 }}>{item.content}</p>
            </div>
          ),
        }))}
        pending={followUps.length === 0 ? '暂无沟通记录' : null}
      />
      <Modal
        title={editingItem ? '编辑跟进记录' : '添加跟进记录'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="type" label="沟通方式" rules={[{ required: true, message: '请选择沟通方式' }]}>
            <Select
              options={[
                { label: '电话', value: FollowUpType.PHONE },
                { label: '邮件', value: FollowUpType.EMAIL },
                { label: '微信', value: FollowUpType.WECHAT },
                { label: '现场', value: FollowUpType.ONSITE },
                { label: '视频', value: FollowUpType.VIDEO },
                { label: '其他', value: FollowUpType.OTHER },
              ]}
            />
          </Form.Item>
          <Form.Item name="contactedAt" label="沟通时间" rules={[{ required: true, message: '请选择沟通时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="content" label="沟通内容" rules={[{ required: true, message: '请填写沟通内容' }]}>
            <TextArea rows={4} placeholder="请详细记录本次沟通的内容..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
