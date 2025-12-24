
import { MotionSample } from '../types';

export const downloadCSV = (data: MotionSample[], fileName: string = 'motion_data.csv') => {
  if (data.length === 0) return;

  const firstTimestamp = data[0].timestamp;

  const formatDateTime = (ms: number) => {
    const date = new Date(ms);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    const msec = String(date.getMilliseconds()).padStart(3, '0');
    return `${y}/${m}/${d} ${h}:${min}:${s}.${msec}`;
  };

  // Pythonスクリプトの required_columns = ['time[s]', 'ax[m/s^2]', 'ay[m/s^2]', 'az[m/s^2]'] に合わせる
  const headers = [
    'time[s]',        // 0.000, 0.010, 0.020... (Python解析のメイン軸)
    'ax[m/s^2]',      // X軸加速度
    'ay[m/s^2]',      // Y軸加速度
    'az[m/s^2]',      // Z軸加速度
    'DateTime',       // 人間用の確認時刻
    'Raw_Elapsed[s]', // 実際の計測間隔（参考用）
    'Raw_Unix_ms'     // 生のタイムスタンプ
  ];

  const rows = data.map((sample, index) => {
    // インデックスから計算した理想的な経過時間 (100Hz = 0.01s刻み)
    // これにより Python 内で np.diff(time) を取った際にジッタが消え、fs=100Hz固定で計算されます
    const fixedTimeSec = index * 0.01;
    
    // 最初のデータからの実際の経過時間
    const rawElapsedSec = (sample.timestamp - firstTimestamp) / 1000;
    
    return [
      fixedTimeSec.toFixed(3),
      sample.x.toFixed(6),
      sample.y.toFixed(6),
      sample.z.toFixed(6),
      formatDateTime(sample.timestamp),
      rawElapsedSec.toFixed(4),
      sample.timestamp
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // BOMを付与してExcel/Python(pandas)での読み込みをスムーズにする
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
