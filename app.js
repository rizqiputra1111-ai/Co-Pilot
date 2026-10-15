// 2. Fungsi Ambil Screenshot Canvas & Kirim ke Gemini API
async function analyzeChart() {
  const apiKeyInput = document.getElementById('apiKey');
  const apiKey = apiKeyInput.value.trim();
  const outputDiv = document.getElementById('output');
  const btn = document.getElementById('btnAnalyze');

  if (!apiKey) {
    alert("Masukkan Gemini API Key kamu dulu, bes!");
    return;
  }

  // Set status loading & matikan tombol sementara
  btn.disabled = true;
  btn.innerText = "⏳ Analyzing...";
  outputDiv.innerText = "⏳ Sedang mengambil screenshot chart dan dikirim ke Gemini AI...";

  try {
    const canvas = chartElement.querySelector('canvas');
    if (!canvas) {
      throw new Error("Canvas chart belum siap/ditemukan.");
    }

    // Ambil string Base64 murni dari canvas
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");

    // Prompt khusus Smart Money Concepts
    const promptText = `Kamu adalah analis trading profesional berspesialisasi dalam Smart Money Concepts (SMC) dan Liquidity.
Analisa gambar chart realtime berikut:
1. Identifikasi struktur tren saat ini (M15).
2. Tentukan area Supply/Demand (Order Block) atau Fair Value Gap (FVG) yang berpotensi dituju.
3. Tentukan potensi Liquidity Sweep (BSL/SSL).
4. Berikan saran plan entry (BUY/SELL), area Stop Loss (SL ketat), dan Take Profit (TP).`;

    // ENDPOINT REVISI: Menggunakan gemini-2.5-flash atau gemini-1.5-flash-latest
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: "image/png",
                data: base64Data
              }
            }
          ]
        }]
      })
    });

    const result = await response.json();

    if (response.ok && result.candidates && result.candidates[0]) {
      outputDiv.innerText = result.candidates[0].content.parts[0].text;
    } else {
      console.error("API Error Response:", result);
      const errMsg = result.error ? result.error.message : "Gagal memproses respon.";
      outputDiv.innerText = `❌ Error API (${response.status}):\n${errMsg}`;
    }

  } catch (error) {
    console.error("Error Detail:", error);
    outputDiv.innerText = `❌ Terjadi kesalahan:\n${error.message}`;
  } finally {
    // Aktifkan kembali tombol setelah 3 detik
    setTimeout(() => {
      btn.disabled = false;
      btn.innerText = "🤖 Analisa Chart";
    }, 3000);
  }
}
