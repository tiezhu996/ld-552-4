import { Card, Descriptions, List, Tabs, Tag } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import InterviewTimeline from '../components/InterviewTimeline';
import FollowUpTimeline from '../components/FollowUpTimeline';
import { statusText } from '../constants/enums';
import { api } from '../utils/api';

export default function CandidateDetailPage() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState<Candidate>();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  const loadData = useCallback(() => {
    if (!id) return;
    Promise.all([
      api.get(`/candidates/${id}`),
      api.get(`/candidates/${id}/interviews`),
      api.get(`/audit-logs/candidate/${id}`).catch(() => ({ data: [] })),
      api.get(`/follow-ups/candidate/${id}`).catch(() => ({ data: [] })),
    ]).then(([c, i, a, f]) => {
      setCandidate(c.data);
      setInterviews(i.data);
      setAudits(a.data);
      setFollowUps(f.data);
    });
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <>
      <h1 className="page-title">{candidate?.name}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, marginTop: 18 }}>
        <Card className="tf-card">
          <Descriptions
            column={1}
            size="small"
            items={[
              { key: 'email', label: '邮箱', children: candidate?.email },
              { key: 'phone', label: '手机', children: candidate?.phone },
              { key: 'source', label: '来源', children: candidate?.source },
            ]}
          />
        </Card>
        <Tabs
          items={[
            {
              key: 'resumes',
              label: '投递记录',
              children: (
                <List
                  dataSource={candidate?.resumes || []}
                  renderItem={(r) => (
                    <List.Item>
                      <List.Item.Meta
                        title={r.job?.title}
                        description={
                          <>
                            <Tag>{statusText[r.status]}</Tag>
                            {r.resumeUrl}
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: 'timeline',
              label: '面试与跟进',
              children: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <Card size="small" title="面试时间线" className="tf-card">
                    <InterviewTimeline interviews={interviews} />
                  </Card>
                  <Card size="small" className="tf-card" style={{ overflow: 'visible' }}>
                    {id && (
                      <FollowUpTimeline
                        followUps={followUps}
                        candidateId={Number(id)}
                        onRefresh={loadData}
                      />
                    )}
                  </Card>
                </div>
              ),
            },
            {
              key: 'offers',
              label: 'Offer 状态',
              children: (
                <List
                  dataSource={candidate?.offers || []}
                  renderItem={(o) => (
                    <List.Item>
                      {o.job?.title} · {o.salary} · <Tag color="green">{statusText[o.status]}</Tag>
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: 'audit',
              label: '状态流转审计',
              children: (
                <List
                  dataSource={audits}
                  renderItem={(a) => (
                    <List.Item>
                      {a.entity} #{a.entityId}: {a.beforeStatus} → {a.afterStatus} · {a.actor?.name || '系统'} ·{' '}
                      {a.reason}
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
