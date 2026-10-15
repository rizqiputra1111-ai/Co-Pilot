const chartElement = document.getElementById('chartContainer');

// Dapatkan ukuran kontainer agar chart ter-render dengan tinggi & lebar yang pasti
function getChartDimensions() {
  return {
    width: chartElement.clientWidth || 800,
    height: chartElement.clientHeight || 500
  };
}

const dim = getChartDimensions();

const chart = LightweightCharts.createChart(chartElement, {
  width: dim.width,
  height: dim.height,
  layout: { backgroundColor: '#131722', textColor: '#d1d4dc' },
  grid: { vertLines: { color: '#2b2f3a' }, horzLines: { color: '#2b2f3a' } },
  timeScale: { timeVisible: true, secondsVisible: false }
});

const candleSeries = chart.addCandlestickSeries({
  upColor: '#089981', downColor: '#f23645',
  borderUpColor: '#089981', borderDownColor: '#f23645',
  wickUpColor: '#089981', wickDownColor: '#f23645'
});

// Penyesuaian ukuran otomatis saat jendela browser di-resize
window.addEventListener('resize', () => {
  const newDim = getChartDimensions();
  chart.applyOptions({ width: newDim.width, height: newDim.height });
});

// Stream Data Realtime via WebSocket (BTCUSDT Binance 15M)
const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_15m');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const kline = data.k;
  candleSeries.update({
    time: Math.floor(kline.t / 1000),
    open: parseFloat(kline.o),
    high: parseFloat(kline.h),
    low: parseFloat(kline.l),
    close: parseFloat(kline.c)
  });
};

async function analyzeChart() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const outputDiv = document.getElementById('output');
  const btn = document.getElementById('btnAnalyze');

  if (!apiKey) {
    alert("Masukkan Gemini API Key kamu dulu, bes!");
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ Analyzing...";
  outputDiv.innerText = "⏳ Sedang memproses gambar chart dan mengirim ke Gemini AI...";

  try {
    const canvas = chartElement.querySelector('canvas');
    if (!canvas) {
      throw new Error("Canvas chart belum siap/ditemukan.");
    }

    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");

    const promptText = `Kamu adalah analis trading profesional berspesialisasi dalam Smart Money Concepts (SMC) dan Liquidity.
Analisa gambar chart realtime berikut:
1. Identifikasi struktur tren saat ini (M15).
2. Tentukan area Supply/Demand (Order Block) atau Fair Value Gap (FVG) yang berpotensi dituju.
3. Tentukan potensi Liquidity Sweep (BSL/SSL).
4. Berikan saran plan entry (BUY/SELL), area Stop Loss (SL ketat), dan Take Profit (TP).`;

    // ENDPOINT RESMI TERBARU: gemini-3.8-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: "image/png", data: base64Data } }
          ]
        }]
      })
    });

    const result = await response.json();

    if (response.ok && result.candidates && result.candidates[0]) {
      outputDiv.innerText = result.candidates[0].content.parts[0].text;
    } else {
      const errMsg = result.error ? result.error.message : "Gagal memproses respon.";
      outputDiv.innerText = `❌ Error API (${response.status}):\n${errMsg}`;
    }

  } catch (error) {
    outputDiv.innerText = `❌ Terjadi kesalahan:\n${error.message}`;
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.innerText = "🤖 Analisa Chart";
    }, 3000);
  }
}
