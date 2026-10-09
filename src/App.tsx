import { useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';

type Period = 'week' | 'month';
type ReportResponse = {
  id: string;
  period: string;
  scope: string;
  report: string;
  sources: Array<{ tool: string; summary: string }>;
};
const apiBaseUrl = import.meta.env.VITE_REPORT_API_URL ?? 'http://localhost:3001';

function App() {
  const [period, setPeriod] = useState<Period>('week');
  const [scope, setScope] = useState('全站');
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, scope }),
      });
      if (!response.ok) throw new Error('报告生成失败，请确认服务端已经启动。');
      setReport((await response.json()) as ReportResponse);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '发生未知错误。');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="report-app">
      <section className="hero">
        <p className="eyebrow">OPERATIONS INTELLIGENCE</p>
        <h1>运营报告 Agent</h1>
        <p>选择范围，Agent 会查询业务指标、对比趋势并生成可审计的运营结论。</p>
      </section>
      <section className="workspace">
        <form className="report-form" onSubmit={generateReport}>
          <label>
            报告周期
            <select value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
              <option value="week">本周运营周报</option>
              <option value="month">本月运营月报</option>
            </select>
          </label>
          <label>
            业务范围
            <select value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="全站">全站</option>
              <option value="华东区域">华东区域</option>
              <option value="App 渠道">App 渠道</option>
            </select>
          </label>
          <button type="submit" disabled={isGenerating}>
            {isGenerating ? '正在分析数据…' : '生成报告'}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        {report ? (
          <section className="report-result" aria-live="polite">
            <div className="report-heading">
              <div>
                <p className="eyebrow">
                  {report.period} · {report.scope}
                </p>
                <h2>运营报告</h2>
              </div>
              <span className="report-id">#{report.id.slice(-8)}</span>
            </div>
            <article className="report-content">{report.report}</article>
            <aside className="data-sources">
              <h3>数据依据</h3>
              {report.sources.map((source, index) => (
                <p key={`${source.tool}-${index}`}>
                  <code>{source.tool}</code>
                  {source.summary}
                </p>
              ))}
            </aside>
          </section>
        ) : (
          <section className="empty-state">
            <span>01</span>
            <h2>准备生成第一份报告</h2>
            <p>服务端会使用 3 个只读业务工具；模型无法直接执行 SQL。</p>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
